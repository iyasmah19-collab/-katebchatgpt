"""Google Play subscription verification via the Google Play Developer API.

Server-side verification is the single source of truth for premium access that
comes from a Google Play purchase. The mobile app obtains a `purchaseToken` from
`react-native-iap` and sends it here; we verify it against
`purchases.subscriptionsv2.get` and derive the subscription state + expiry.

Configuration (backend/.env):
  - GOOGLE_PLAY_PACKAGE_NAME            e.g. com.kateb.mobile
  - GOOGLE_PLAY_SERVICE_ACCOUNT_FILE    absolute path to the service-account JSON
    (or) GOOGLE_PLAY_SERVICE_ACCOUNT_JSON   the raw JSON contents inline

If not configured, `is_configured()` returns False and the endpoints respond with
a clear error instead of crashing the app.
"""
import json
import logging
import os
from datetime import datetime, timezone
from functools import lru_cache
from typing import Optional

logger = logging.getLogger(__name__)

ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher"

PACKAGE_NAME = os.environ.get("GOOGLE_PLAY_PACKAGE_NAME", "")
SERVICE_ACCOUNT_FILE = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_FILE", "")
SERVICE_ACCOUNT_JSON = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "")

# Subscription states that should grant premium access. We honour the remaining
# paid period after a user cancels auto-renew (CANCELED) and during a billing
# grace period; premium is revoked once the subscription is EXPIRED, ON_HOLD,
# PAUSED, PENDING, or once the expiry timestamp passes.
PREMIUM_STATES = {
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    "SUBSCRIPTION_STATE_CANCELED",
}


def is_configured() -> bool:
    has_creds = bool(SERVICE_ACCOUNT_FILE and os.path.exists(SERVICE_ACCOUNT_FILE)) or bool(SERVICE_ACCOUNT_JSON)
    return bool(PACKAGE_NAME) and has_creds


@lru_cache()
def _get_service():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    if SERVICE_ACCOUNT_JSON:
        info = json.loads(SERVICE_ACCOUNT_JSON)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=[ANDROID_PUBLISHER_SCOPE]
        )
    else:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=[ANDROID_PUBLISHER_SCOPE]
        )
    return build("androidpublisher", "v3", credentials=creds, cache_discovery=False)


def get_subscription_v2(purchase_token: str) -> dict:
    """Fetch the SubscriptionPurchaseV2 resource for a purchase token."""
    service = _get_service()
    return (
        service.purchases()
        .subscriptionsv2()
        .get(packageName=PACKAGE_NAME, token=purchase_token)
        .execute()
    )


def get_product_purchase(product_id: str, purchase_token: str) -> dict:
    """Fetch a one-time product purchase (`purchases.products.get`).

    Used for credit-pack purchases. Returns the raw Google response which
    includes `purchaseState` (0=Purchased, 1=Cancelled, 2=Pending),
    `acknowledgementState`, `orderId`, etc.
    """
    service = _get_service()
    return (
        service.purchases()
        .products()
        .get(packageName=PACKAGE_NAME, productId=product_id, token=purchase_token)
        .execute()
    )


def acknowledge_product_purchase(product_id: str, purchase_token: str) -> None:
    """Acknowledge a one-time product purchase so Google doesn't auto-refund it."""
    service = _get_service()
    service.purchases().products().acknowledge(
        packageName=PACKAGE_NAME,
        productId=product_id,
        token=purchase_token,
        body={},
    ).execute()


def _parse_rfc3339(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        # Google returns RFC3339 like "2024-01-01T10:00:00.123Z"
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return None


def parse_subscription_v2(response: dict) -> dict:
    """Map a SubscriptionPurchaseV2 response into our internal shape.

    Returns: {state, product_id, expiry_time (datetime|None), is_premium (bool)}
    """
    state = response.get("subscriptionState")
    line_items = response.get("lineItems", []) or []

    expiry_time: Optional[datetime] = None
    product_id: Optional[str] = None

    # Pick the line item with the furthest expiry (the currently effective plan).
    for item in line_items:
        exp = _parse_rfc3339(item.get("expiryTime"))
        if exp and (expiry_time is None or exp > expiry_time):
            expiry_time = exp
            product_id = item.get("productId")

    now = datetime.now(timezone.utc)
    is_premium = bool(
        state in PREMIUM_STATES and expiry_time is not None and expiry_time > now
    )

    return {
        "state": state,
        "product_id": product_id,
        "expiry_time": expiry_time,
        "is_premium": is_premium,
    }

"""Google Play subscription verification tests.

1. Unit tests for google_play.parse_subscription_v2 (pure, no network).
2. Endpoint wiring tests against the live API (auth required, 503 when the
   service account is not configured, status returns False with no subscription).
"""
import os
import sys
import time
from datetime import datetime, timezone, timedelta

import pytest
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import google_play  # noqa: E402

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
PW = "TestPass123!"


def _future(days=10):
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat().replace("+00:00", "Z")


def _past(days=2):
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat().replace("+00:00", "Z")


# ---------- unit tests: parse_subscription_v2 ----------
def test_active_subscription_is_premium():
    resp = {
        "subscriptionState": "SUBSCRIPTION_STATE_ACTIVE",
        "lineItems": [{"productId": "kateb_premium_monthly", "expiryTime": _future()}],
    }
    parsed = google_play.parse_subscription_v2(resp)
    assert parsed["is_premium"] is True
    assert parsed["product_id"] == "kateb_premium_monthly"
    assert parsed["state"] == "SUBSCRIPTION_STATE_ACTIVE"


def test_expired_subscription_revokes_premium():
    resp = {
        "subscriptionState": "SUBSCRIPTION_STATE_EXPIRED",
        "lineItems": [{"productId": "kateb_premium_monthly", "expiryTime": _past()}],
    }
    assert google_play.parse_subscription_v2(resp)["is_premium"] is False


def test_canceled_but_still_in_paid_period_keeps_premium():
    # User turned off auto-renew but the paid period has not ended yet.
    resp = {
        "subscriptionState": "SUBSCRIPTION_STATE_CANCELED",
        "lineItems": [{"productId": "kateb_premium_monthly", "expiryTime": _future()}],
    }
    assert google_play.parse_subscription_v2(resp)["is_premium"] is True


def test_canceled_past_expiry_revokes_premium():
    resp = {
        "subscriptionState": "SUBSCRIPTION_STATE_CANCELED",
        "lineItems": [{"productId": "kateb_premium_monthly", "expiryTime": _past()}],
    }
    assert google_play.parse_subscription_v2(resp)["is_premium"] is False


def test_on_hold_revokes_premium():
    resp = {
        "subscriptionState": "SUBSCRIPTION_STATE_ON_HOLD",
        "lineItems": [{"productId": "kateb_premium_monthly", "expiryTime": _future()}],
    }
    assert google_play.parse_subscription_v2(resp)["is_premium"] is False


def test_picks_furthest_expiry_line_item():
    resp = {
        "subscriptionState": "SUBSCRIPTION_STATE_ACTIVE",
        "lineItems": [
            {"productId": "old", "expiryTime": _past()},
            {"productId": "kateb_premium_yearly", "expiryTime": _future(365)},
        ],
    }
    parsed = google_play.parse_subscription_v2(resp)
    assert parsed["product_id"] == "kateb_premium_yearly"
    assert parsed["is_premium"] is True


# ---------- endpoint wiring tests (live API) ----------
def _register_fresh():
    ts = int(time.time() * 1000)
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE}/api/auth/register", json={
        "email": f"billing+{ts}@example.com",
        "password": PW,
        "username": f"bl_{ts % 10_000_000}",
        "name": "Billing Test",
    }, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    return r.json()["token"]


def test_status_requires_auth():
    r = requests.get(f"{BASE}/api/billing/google/status", timeout=30)
    assert r.status_code == 401


def test_verify_requires_auth():
    r = requests.post(f"{BASE}/api/billing/google/verify",
                      json={"purchase_token": "x", "product_id": "y"}, timeout=30)
    assert r.status_code == 401


def test_status_no_subscription_returns_not_premium():
    token = _register_fresh()
    r = requests.get(f"{BASE}/api/billing/google/status",
                     headers={"Authorization": f"Bearer {token}"}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["is_premium"] is False


def test_verify_returns_503_when_not_configured():
    # In preview the service account is not configured, so verify should fail cleanly.
    token = _register_fresh()
    r = requests.post(f"{BASE}/api/billing/google/verify",
                      headers={"Authorization": f"Bearer {token}"},
                      json={"purchase_token": "tok", "product_id": "kateb_premium_monthly"}, timeout=30)
    assert r.status_code in (502, 503)

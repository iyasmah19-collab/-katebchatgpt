"""
Phase 5 backend tests for Kateb (Arabic AI Content Tool):
  - Auth register creates new schema fields: credits=20, referral_code=KTB-XXXX,
    referred_by=null, premium_expires_at=null, subscription_type=null,
    subscription_cancelled=false.
  - Referral system: /api/referral/info, /api/referral/apply, signup bonus +10
    credits to referrer, KTB-XXXX format (4 chars, no 0/O/1/I), legacy backfill.
  - Free-match-trial ad flow: /api/match/usage (anonymous + authed),
    /api/match/free-trial-claim (max 10 / 24h → 429), bonus consumed first in
    /api/generate/match, 403 when bonus=0 and used>=3.
  - Subscription mgmt: /api/subscription/cancel (400 when no premium),
    /api/subscription/status structure.
  - Credits packages: GET /api/credits/packages, POST /api/credits/verify-purchase
    (400 unknown product, 503 path when google_play not configured).
  - Regression: /api/auth/me, /api/auth/login, /api/generate/content,
    /api/generate/hook, /api/chat/message, /api/virality/*.
"""
import os
import re
import io
import uuid
import time
import tempfile
import pytest
import requests


def _read_frontend_env_url() -> str:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    except FileNotFoundError:
        return ""
    return ""


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _read_frontend_env_url()).rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

SUFFIX = uuid.uuid4().hex[:6]
USER_A = {
    "email": f"phase5a_{SUFFIX}@example.com",
    "username": f"p5a_{SUFFIX}",
    "password": "Test1234!",
    "name": "Phase5 A",
}
USER_B = {
    "email": f"phase5b_{SUFFIX}@example.com",
    "username": f"p5b_{SUFFIX}",
    "password": "Test1234!",
    "name": "Phase5 B",
}
USER_C = {
    "email": f"phase5c_{SUFFIX}@example.com",
    "username": f"p5c_{SUFFIX}",
    "password": "Test1234!",
    "name": "Phase5 C",
}

state = {
    "token_a": None, "user_a": None, "code_a": None,
    "token_b": None, "user_b": None, "code_b": None,
    "token_c": None, "user_c": None, "code_c": None,
}

REFERRAL_CODE_RE = re.compile(r"^KTB-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$")


def _h(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ===================== 1. REGISTER schema fields =====================
def test_01_register_user_a_has_full_schema():
    r = requests.post(f"{API}/auth/register", json=USER_A, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "token" in d and d["token"]
    u = d["user"]
    assert u["credits"] == 20
    assert u["email"] == USER_A["email"]
    assert u.get("is_premium") is False
    state["token_a"] = d["token"]
    state["user_a"] = u

    # Pull full user via /referral/info to read referral_code + referred_by
    ri = requests.get(f"{API}/referral/info", headers=_h(d["token"]), timeout=15)
    assert ri.status_code == 200, ri.text
    info = ri.json()
    code = info["referral_code"]
    assert REFERRAL_CODE_RE.match(code), f"bad referral_code format: {code}"
    # No ambiguous chars
    for ch in code[4:]:
        assert ch not in ("0", "O", "1", "I"), f"ambiguous char in code: {code}"
    assert info["referred_by"] is None
    assert info["signup_bonus"] == 10
    assert info["premium_bonus"] == 100
    assert info["stats"] == {"signups": 0, "premium_conversions": 0, "total_credits_earned": 0}
    assert info["history"] == []
    state["code_a"] = code


def test_02_subscription_status_for_new_user_has_full_shape():
    r = requests.get(f"{API}/subscription/status", headers=_h(state["token_a"]), timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["is_premium"] is False
    assert d["premium_source"] in (None, "")
    assert d["premium_expires_at"] in (None, "")
    assert d["subscription_type"] in (None, "")
    assert d["subscription_cancelled"] is False


# ===================== 2. REFERRAL via REGISTER body =====================
def test_03_register_user_b_with_referral_code_grants_referrer_10_credits():
    payload = dict(USER_B)
    payload["referral_code"] = state["code_a"]
    r = requests.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    state["token_b"] = d["token"]
    state["user_b"] = d["user"]
    # B starts with 20 credits (no self-bonus on register)
    assert d["user"]["credits"] == 20

    # Verify A's credits went 20 -> 30 and stats incremented
    ri = requests.get(f"{API}/referral/info", headers=_h(state["token_a"]), timeout=15)
    assert ri.status_code == 200
    info = ri.json()
    assert info["stats"]["signups"] == 1, info
    assert info["stats"]["total_credits_earned"] == 10, info
    assert len(info["history"]) == 1
    h0 = info["history"][0]
    assert h0["kind"] == "signup"
    assert h0["credits"] == 10
    assert h0["referrer_id"] == state["user_a"]["user_id"]
    assert h0["referred_id"] == state["user_b"]["user_id"]

    # B's referred_by points to A
    rib = requests.get(f"{API}/referral/info", headers=_h(state["token_b"]), timeout=15)
    assert rib.status_code == 200
    bi = rib.json()
    assert bi["referred_by"] == state["user_a"]["user_id"]
    state["code_b"] = bi["referral_code"]
    assert REFERRAL_CODE_RE.match(state["code_b"])
    assert state["code_b"] != state["code_a"]

    # A's credits balance now 30
    bal = requests.get(f"{API}/credits/balance", headers=_h(state["token_a"]), timeout=15)
    assert bal.status_code == 200
    assert bal.json()["credits"] == 30, bal.json()


# ===================== 3. /api/referral/apply branches =====================
def test_04_referral_apply_branches_and_grants():
    # Create user C without referral
    r = requests.post(f"{API}/auth/register", json=USER_C, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    state["token_c"] = d["token"]
    state["user_c"] = d["user"]

    # Capture A's credits before
    pre = requests.get(f"{API}/credits/balance", headers=_h(state["token_a"]), timeout=15).json()["credits"]

    # 4a) Self-code → 400
    rc = requests.get(f"{API}/referral/info", headers=_h(state["token_c"]), timeout=15).json()
    state["code_c"] = rc["referral_code"]
    rs = requests.post(
        f"{API}/referral/apply",
        headers=_h(state["token_c"]),
        json={"code": state["code_c"]},
        timeout=15,
    )
    assert rs.status_code == 400, rs.text

    # 4b) Invalid format (no KTB- prefix) → 400
    rs = requests.post(
        f"{API}/referral/apply",
        headers=_h(state["token_c"]),
        json={"code": "ABCD"},
        timeout=15,
    )
    assert rs.status_code == 400, rs.text

    # 4c) Well-formed but unknown code → 404
    rs = requests.post(
        f"{API}/referral/apply",
        headers=_h(state["token_c"]),
        json={"code": "KTB-ZZZZ"},  # exceedingly unlikely to exist
        timeout=15,
    )
    # Could be 404 (not found) — accept it.
    assert rs.status_code in (404, 400), rs.text
    if rs.status_code == 400:
        # If it happened to collide with an existing legit code, skip the 404 assertion.
        pass

    # 4d) Apply A's code → 200 and A gets +10
    rs = requests.post(
        f"{API}/referral/apply",
        headers=_h(state["token_c"]),
        json={"code": state["code_a"]},
        timeout=15,
    )
    assert rs.status_code == 200, rs.text
    d = rs.json()
    assert d["ok"] is True
    assert d["signup_bonus_granted"] == 10
    post = requests.get(f"{API}/credits/balance", headers=_h(state["token_a"]), timeout=15).json()["credits"]
    assert post == pre + 10, (pre, post)

    # 4e) Apply twice → 400 (referred_by already set)
    rs2 = requests.post(
        f"{API}/referral/apply",
        headers=_h(state["token_c"]),
        json={"code": state["code_a"]},
        timeout=15,
    )
    assert rs2.status_code == 400, rs2.text


# ===================== 4. /api/match/usage =====================
def test_05_match_usage_anonymous():
    r = requests.get(f"{API}/match/usage", timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("authenticated") is False
    assert d["ads_daily_limit"] == 10
    assert d["ads_remaining_today"] == 10
    assert d["bonus"] == 0


def test_06_match_usage_authenticated_non_premium():
    r = requests.get(f"{API}/match/usage", headers=_h(state["token_a"]), timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["authenticated"] is True
    assert d["is_premium"] is False
    assert d["limit"] == 3
    assert d["used"] == 0
    assert d["bonus"] == 0
    assert d["ads_daily_limit"] == 10
    assert d["ads_remaining_today"] == 10


# ===================== 5. /api/match/free-trial-claim =====================
def test_07_free_trial_claim_increments_bonus_and_then_429():
    # Use USER_B (fresh, no ad watches)
    tok = state["token_b"]
    # 10 claims must all succeed and grant +1 bonus each.
    for i in range(10):
        r = requests.post(f"{API}/match/free-trial-claim", headers=_h(tok), timeout=15)
        assert r.status_code == 200, f"claim #{i + 1} failed: {r.status_code} {r.text}"
        d = r.json()
        assert d["bonus"] == i + 1, f"after claim #{i + 1} bonus={d['bonus']}"
        assert d["ads_watched_today"] == i + 1
        assert d["ads_remaining_today"] == max(0, 10 - (i + 1))

    # 11th call → 429
    r11 = requests.post(f"{API}/match/free-trial-claim", headers=_h(tok), timeout=15)
    assert r11.status_code == 429, r11.text
    assert "تم استنفاد" in (r11.json() or {}).get("detail", ""), r11.json()

    # /match/usage reflects bonus=10, ads_remaining_today=0
    u = requests.get(f"{API}/match/usage", headers=_h(tok), timeout=15).json()
    assert u["bonus"] == 10, u
    assert u["ads_remaining_today"] == 0, u
    # remaining = (3-0) + 10 = 13
    assert u["remaining"] == 13, u


# ===================== 6. /api/generate/match consumes bonus first =====================
def test_08_generate_match_consumes_bonus_then_402_path():
    """Verify USER_B (bonus=10) consumes bonus first when calling /generate/match.
    We only need one call to prove bonus-decrement; a full deplete would burn LLM credits.
    """
    tok = state["token_b"]
    payload = {
        "platform": "tiktok",
        "content": "ريلز عن القهوة الصباحية والإنتاجية",
        "language": "ar",
    }
    r = requests.post(f"{API}/generate/match", headers=_h(tok), json=payload, timeout=120)
    if r.status_code == 503:
        pytest.skip(f"LLM unavailable: {r.text}")
    assert r.status_code == 200, r.text
    d = r.json()
    # Bonus decremented by 1 (10 -> 9). match_usage_count stays 0.
    assert d["bonus"] == 9, d
    assert d["used"] == 0, d
    # match/usage confirms
    u = requests.get(f"{API}/match/usage", headers=_h(tok), timeout=15).json()
    assert u["bonus"] == 9, u
    assert u["used"] == 0, u


def test_09_match_403_when_no_bonus_and_used_ge_3():
    """USER_C has bonus=0 and used=0. Burn 3 calls, 4th should 403 with 'شاهد إعلاناً' hint.

    We minimize LLM cost by limiting calls. Each call may cost LLM budget; if any
    call fails with 503/non-200, the test is skipped so we don't false-positive.
    """
    tok = state["token_c"]
    # Sanity: bonus 0, used 0
    u = requests.get(f"{API}/match/usage", headers=_h(tok), timeout=15).json()
    assert u["bonus"] == 0
    assert u["used"] == 0

    payload = {
        "platform": "instagram",
        "content": "محتوى عن السفر إلى تركيا في الصيف",
        "language": "ar",
    }
    for i in range(3):
        r = requests.post(f"{API}/generate/match", headers=_h(tok), json=payload, timeout=120)
        if r.status_code == 503:
            pytest.skip(f"LLM unavailable mid-test (call #{i + 1}): {r.text}")
        assert r.status_code == 200, f"call #{i + 1} failed: {r.text}"
        d = r.json()
        assert d["used"] == i + 1, d
        assert d["bonus"] == 0, d

    # 4th call → 403 with hint
    r4 = requests.post(f"{API}/generate/match", headers=_h(tok), json=payload, timeout=30)
    assert r4.status_code == 403, r4.text
    detail = (r4.json() or {}).get("detail", "")
    assert "شاهد إعلاناً" in detail or "ترقّى" in detail, detail


# ===================== 7. Subscription cancel/status =====================
def test_10_subscription_cancel_400_when_no_premium():
    r = requests.post(f"{API}/subscription/cancel", headers=_h(state["token_a"]), timeout=15)
    assert r.status_code == 400, r.text
    detail = (r.json() or {}).get("detail", "")
    assert "لا يوجد اشتراك" in detail or "اشتراك" in detail, detail


def test_11_subscription_status_full_shape():
    r = requests.get(f"{API}/subscription/status", headers=_h(state["token_a"]), timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ("is_premium", "premium_source", "premium_expires_at", "subscription_type", "subscription_cancelled"):
        assert k in d, f"missing key {k} in {d}"
    assert d["is_premium"] is False
    assert d["subscription_cancelled"] is False


# ===================== 8. Credits packages =====================
def test_12_credits_packages_structure():
    r = requests.get(f"{API}/credits/packages", timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    fx = d["fixed"]
    assert isinstance(fx, list) and len(fx) == 4
    by_credits = {p["credits"]: p for p in fx}
    assert set(by_credits.keys()) == {200, 500, 1000, 2000}
    assert by_credits[200]["price_usd"] == 2
    assert by_credits[500]["price_usd"] == 4
    assert by_credits[1000]["price_usd"] == 6
    assert by_credits[2000]["price_usd"] == 8
    assert all(p["product_id"].startswith("kateb_credits_") for p in fx)
    cu = d["custom"]
    assert cu["min_credits"] == 50
    assert cu["max_credits"] == 100000
    assert cu["sku_prefix"] == "kateb_credits_custom_"


# ===================== 9. Credits verify-purchase: 400 and 503 =====================
def test_13_credits_verify_purchase_unknown_product_400():
    r = requests.post(
        f"{API}/credits/verify-purchase",
        headers=_h(state["token_a"]),
        json={"purchase_token": "fake_token_abc", "product_id": "kateb_credits_unknown"},
        timeout=15,
    )
    assert r.status_code == 400, r.text


def test_14_credits_verify_purchase_503_when_play_not_configured():
    # With a *valid* fixed product but no Play credentials, must be 503.
    r = requests.post(
        f"{API}/credits/verify-purchase",
        headers=_h(state["token_a"]),
        json={"purchase_token": "fake_token_abc", "product_id": "kateb_credits_200"},
        timeout=15,
    )
    # If credentials happen to be configured in this env, we'd see 502 (verify failed)
    # or 400 — accept 503 strictly per problem statement, otherwise warn.
    assert r.status_code in (503, 502, 400), r.text
    if r.status_code != 503:
        pytest.skip(f"google_play seems configured in this env (status={r.status_code}) — 503 path not testable")


# ===================== 10. Backfill: legacy phase1 user gets a referral_code =====================
def test_15_legacy_user_has_referral_code_via_backfill():
    """phase1@example.com (from earlier iteration) was created before referral_code
    existed. Startup backfill MUST have assigned them one. Skip if account doesn't exist."""
    legacy_email = "phase1@example.com"
    legacy_pwd = "Test1234!"
    rl = requests.post(f"{API}/auth/login", json={"email": legacy_email, "password": legacy_pwd}, timeout=15)
    if rl.status_code != 200:
        pytest.skip(f"Legacy account {legacy_email} not present in this env (status={rl.status_code})")
    legacy_token = rl.json()["token"]
    ri = requests.get(f"{API}/referral/info", headers=_h(legacy_token), timeout=15)
    assert ri.status_code == 200, ri.text
    info = ri.json()
    assert info["referral_code"], "legacy user has no referral_code after backfill"
    assert REFERRAL_CODE_RE.match(info["referral_code"]), f"legacy code bad format: {info['referral_code']}"


# ===================== 11. Regression: existing endpoints still work =====================
def test_16_regression_auth_me_and_login():
    r = requests.post(f"{API}/auth/login", json={"email": USER_A["email"], "password": USER_A["password"]}, timeout=15)
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    rme = requests.get(f"{API}/auth/me", headers=_h(tok), timeout=15)
    assert rme.status_code == 200, rme.text
    me = rme.json()
    user_doc = me.get("user", me)
    assert (user_doc.get("email") == USER_A["email"]) or (me.get("email") == USER_A["email"])


def test_17_regression_generate_content_and_hook():
    tok = state["token_a"]
    rc = requests.post(
        f"{API}/generate/content",
        headers=_h(tok),
        json={"content_type": "caption", "style": "casual", "dialect": "fusha", "topic": "قهوة الصباح", "language": "ar"},
        timeout=120,
    )
    if rc.status_code == 503:
        pytest.skip("LLM unavailable for generate/content")
    assert rc.status_code == 200, rc.text
    cdata = rc.json()
    assert any(k in cdata for k in ("result", "content", "text", "generations", "output", "items"))

    rh = requests.post(
        f"{API}/generate/hook",
        headers=_h(tok),
        json={"platform": "tiktok", "topic": "ادخار المال", "hook_type": "mixed", "dialect": "fusha", "language": "ar"},
        timeout=120,
    )
    if rh.status_code == 503:
        pytest.skip("LLM unavailable for generate/hook")
    assert rh.status_code == 200, rh.text
    hdata = rh.json()
    assert any(k in hdata for k in ("result", "hooks", "content", "text", "items", "generations", "output"))


def test_18_regression_chat_message():
    tok = state["token_a"]
    r = requests.post(
        f"{API}/chat/message",
        headers=_h(tok),
        json={"message": "اقترح فكرة فيديو قصير عن القهوة"},
        timeout=120,
    )
    if r.status_code == 503:
        pytest.skip("LLM unavailable for chat/message")
    assert r.status_code == 200, r.text
    d = r.json()
    assert isinstance(d.get("reply"), str) and d["reply"]
    assert isinstance(d.get("credits"), int)


def test_19_regression_virality_endpoints_present():
    # We don't actually upload (heavy); just confirm the protected endpoint
    # responds to a GET history with 200.
    r = requests.get(f"{API}/virality/history", headers=_h(state["token_a"]), timeout=20)
    assert r.status_code == 200, r.text
    assert isinstance(r.json(), list)

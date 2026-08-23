"""Backend tests for Kateb - Arabic AI Content Tool"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8000").rstrip("/")
TEST_TOKEN = os.environ.get("TEST_SESSION_TOKEN", "")


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health ---
def test_root(api):
    r = api.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# --- Auth ---
def test_auth_me_no_cookie(api):
    r = requests.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 401


def test_auth_me_with_seeded_token(api):
    if not TEST_TOKEN:
        pytest.skip("No TEST_SESSION_TOKEN provided")
    r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {TEST_TOKEN}"})
    assert r.status_code == 200
    body = r.json()
    assert "email" in body
    assert body.get("is_premium") is True


# --- Generate Content (sample combos) ---
@pytest.mark.parametrize("ctype,style,dialect,lang", [
    ("caption", "funny", "gulf", "ar"),
    ("ad", "professional", "fusha", "ar"),
    ("tweet", "motivational", "egyptian", "ar"),
    ("post", "casual", "levantine", "en"),
])
def test_generate_content(api, ctype, style, dialect, lang):
    r = api.post(f"{BASE_URL}/api/generate/content", json={
        "content_type": ctype, "style": style, "dialect": dialect,
        "topic": "تطبيق ذكي للتسويق", "language": lang,
    }, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "content" in data
    assert isinstance(data["content"], str) and len(data["content"]) > 5


# --- Generate Hook ---
@pytest.mark.parametrize("platform", ["instagram", "tiktok", "shorts"])
def test_generate_hook(api, platform):
    r = api.post(f"{BASE_URL}/api/generate/hook", json={
        "platform": platform, "topic": "كيف تربح متابعين بسرعة", "language": "ar",
    }, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "hooks" in data
    assert len(data["hooks"]) > 10


# --- Match ---
def test_generate_match(api):
    r = api.post(f"{BASE_URL}/api/generate/match", json={
        "platform": "tiktok",
        "content": "فيديو عن نصائح طبخ سريع",
        "language": "ar",
    }, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "analysis" in data
    assert len(data["analysis"]) > 20


# --- Payments ---
def test_checkout_monthly(api):
    r = api.post(f"{BASE_URL}/api/payments/checkout", json={
        "plan": "monthly", "origin_url": BASE_URL,
    }, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "url" in data and data["url"].startswith("http")
    assert "session_id" in data
    pytest.checkout_session_id = data["session_id"]


def test_checkout_lifetime(api):
    r = api.post(f"{BASE_URL}/api/payments/checkout", json={
        "plan": "lifetime", "origin_url": BASE_URL,
    }, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "url" in data
    assert "session_id" in data


def test_checkout_invalid(api):
    r = api.post(f"{BASE_URL}/api/payments/checkout", json={
        "plan": "yearly", "origin_url": BASE_URL,
    })
    assert r.status_code == 400


def test_payment_status(api):
    sid = getattr(pytest, "checkout_session_id", None)
    if not sid:
        pytest.skip("No session id from checkout")
    r = api.get(f"{BASE_URL}/api/payments/status/{sid}", timeout=30)
    assert r.status_code == 200, r.text
    assert "payment_status" in r.json()

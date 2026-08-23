"""
Phase 1 backend tests for Kateb:
  - Credits system (20 free credits, deducted per chat msg, blocked at 0)
  - Chat AI (POST /api/chat/message + sessions/history)
  - Virality Check (multipart video upload, frames extracted via OpenCV, GPT-5.2 vision)
  - Social Accounts (TikTok manual connect/list/delete + Instagram 503 + YouTube url)
  - Regression on existing endpoints (login, /auth/me, /generate/content, /generate/hook)
"""
import os
import io
import time
import uuid
import tempfile
import pytest
import requests
import numpy as np
import cv2

def _read_frontend_env_url() -> str:
    fe = "/app/frontend/.env"
    try:
        with open(fe) as f:
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

# Fresh test user
SUFFIX = uuid.uuid4().hex[:6]
TEST_EMAIL = f"phase1_{SUFFIX}@example.com"
TEST_USERNAME = f"p1_{SUFFIX}"
# Password is loaded from env (TEST_USER_PASSWORD) so secrets never live in source.
TEST_PASSWORD = os.environ.get("TEST_USER_PASSWORD") or f"Tst-{uuid.uuid4().hex[:10]}!"
TEST_NAME = "Phase1 Tester"


# ---------- shared state across tests in this module ----------
state = {"token": None, "user_id": None, "session_id": None, "tiktok_account_id": None}


def _h():
    return {"Authorization": f"Bearer {state['token']}"}


# ===================== AUTH =====================
def test_01_register_returns_20_credits_and_token():
    r = requests.post(
        f"{API}/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "username": TEST_USERNAME,
            "name": TEST_NAME,
        },
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and data["token"]
    assert "user" in data
    user = data["user"]
    assert user.get("credits") == 20, f"expected 20 credits, got {user.get('credits')}"
    assert user.get("is_premium") is False
    assert user.get("email") == TEST_EMAIL
    state["token"] = data["token"]
    state["user_id"] = user.get("user_id")


def test_02_credits_balance_is_20_after_register():
    r = requests.get(f"{API}/credits/balance", headers=_h(), timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d == {"credits": 20, "is_premium": False, "unlimited": False}


# ===================== CHAT =====================
def test_03_chat_message_returns_reply_and_deducts_one_credit():
    r = requests.post(
        f"{API}/chat/message",
        headers=_h(),
        json={"message": "اعطني 3 افكار ريلز عن القهوة"},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    assert isinstance(d.get("reply"), str) and len(d["reply"]) > 0
    assert isinstance(d.get("session_id"), str) and d["session_id"]
    assert d.get("is_premium") is False
    assert d.get("credits") == 19, f"expected 19 credits, got {d.get('credits')}"
    state["session_id"] = d["session_id"]


def test_04_credits_balance_after_one_chat_is_19():
    r = requests.get(f"{API}/credits/balance", headers=_h(), timeout=15)
    assert r.status_code == 200
    assert r.json()["credits"] == 19


def test_05_chat_history_and_sessions():
    # history for this session
    r = requests.get(
        f"{API}/chat/history",
        headers=_h(),
        params={"session_id": state["session_id"]},
        timeout=15,
    )
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list) and len(items) >= 2
    roles = [i["role"] for i in items]
    # chronological order: user first then assistant
    assert roles[0] == "user"
    assert "assistant" in roles

    # sessions list
    r2 = requests.get(f"{API}/chat/sessions", headers=_h(), timeout=15)
    assert r2.status_code == 200
    sess = r2.json()
    assert isinstance(sess, list) and len(sess) >= 1
    s0 = sess[0]
    assert "session_id" in s0 and "last_message" in s0 and "last_at" in s0
    assert s0.get("count", 0) >= 2


def test_06_deplete_credits_and_then_402():
    """Send chat messages until balance is 0, then next call should be 402."""
    # Currently at 19. Send 19 more short messages to reach 0.
    for i in range(19):
        r = requests.post(
            f"{API}/chat/message",
            headers=_h(),
            json={"message": f"اختصر: نصيحة سريعة #{i}", "session_id": state["session_id"]},
            timeout=120,
        )
        # Should always succeed until credits hit 0
        assert r.status_code == 200, f"msg {i} failed: {r.status_code} {r.text}"
        bal = r.json().get("credits")
        assert bal == 18 - i, f"after msg {i} expected {18 - i}, got {bal}"

    # Balance now 0
    rb = requests.get(f"{API}/credits/balance", headers=_h(), timeout=15)
    assert rb.status_code == 200 and rb.json()["credits"] == 0

    # Next message must 402
    r2 = requests.post(
        f"{API}/chat/message",
        headers=_h(),
        json={"message": "هل لديك المزيد؟"},
        timeout=30,
    )
    assert r2.status_code == 402, r2.text
    detail = (r2.json() or {}).get("detail", "")
    assert "رصيد" in detail, f"detail did not mention رصيد: {detail}"


# ===================== VIRALITY =====================
def _generate_test_mp4(path: str, seconds: int = 3, fps: int = 24, size=(640, 360)) -> None:
    """Create a real animated mp4 with moving shapes + text for OpenCV to read."""
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    w, h = size
    writer = cv2.VideoWriter(path, fourcc, fps, (w, h))
    total = seconds * fps
    for i in range(total):
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        # gradient background
        frame[:] = (int(40 + 200 * (i / max(total - 1, 1))), 80, 200)
        # moving circle
        cx = int(60 + (w - 120) * (i / max(total - 1, 1)))
        cy = h // 2
        cv2.circle(frame, (cx, cy), 40, (255, 255, 255), -1)
        # text
        cv2.putText(
            frame, f"KATEB {i}", (30, 60),
            cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 0), 3, cv2.LINE_AA,
        )
        writer.write(frame)
    writer.release()


def test_07_virality_analyze_non_premium():
    # Build a real mp4
    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    tmp.close()
    _generate_test_mp4(tmp.name, seconds=3)
    assert os.path.exists(tmp.name) and os.path.getsize(tmp.name) > 1024

    # We give this user premium=false so we are out of chat credits but virality does not deduct.
    with open(tmp.name, "rb") as fh:
        files = {"file": ("test.mp4", fh, "video/mp4")}
        r = requests.post(
            f"{API}/virality/analyze",
            headers=_h(),
            files=files,
            timeout=180,
        )
    os.remove(tmp.name)
    assert r.status_code == 200, r.text
    d = r.json()
    # response shape
    assert "analysis_id" in d
    scores = d.get("scores") or {}
    for k in ("hook", "pace", "trend", "emotion", "retention"):
        assert k in scores, f"missing scores.{k}: {scores}"
        v = scores[k]
        assert isinstance(v, (int, float)) and 0 <= v <= 100, f"bad score {k}={v}"
    factors = d.get("factors") or {}
    for k in ("hook", "pace", "trend", "emotion", "retention"):
        assert k in factors, f"missing factors.{k}: {factors}"
    assert "overall_score" in d
    assert "verdict" in d and isinstance(d["verdict"], str)
    # Pro insights are gated for non-premium user
    assert d.get("pro_insights") == [], f"non-premium leaked pro_insights: {d.get('pro_insights')}"
    assert d.get("pro_locked") is True

    # Verify temp file in the system tempdir was wiped — server uses NamedTemporaryFile(delete=False) and removes after frame extraction.
    # We can only verify our own client tmp was removed (above). Server-side we trust the finally block.

    state["analysis_id"] = d["analysis_id"]


def test_08_virality_history_non_premium_gated():
    r = requests.get(f"{API}/virality/history", headers=_h(), timeout=30)
    assert r.status_code == 200, r.text
    items = r.json()
    assert isinstance(items, list) and len(items) >= 1
    it = items[0]
    assert it.get("pro_locked") is True
    assert it.get("pro_insights") == []


# ===================== SOCIAL ACCOUNTS =====================
def test_09_tiktok_connect_manual():
    payload = {
        "username": "@tester",
        "followers_count": 1000,
        "media_count": 30,
        "name": "Tester",
    }
    r = requests.post(f"{API}/social/connect/tiktok", headers=_h(), json=payload, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("platform") == "tiktok"
    assert d.get("username") == "tester", f"username should be stripped of @: {d.get('username')}"
    aid = d.get("account_id", "")
    assert aid.startswith("sa_"), f"account_id should start with sa_: {aid}"
    assert d.get("connection_method") == "manual"
    # secrets must not leak
    for k in ("access_token", "refresh_token", "long_lived_token", "fb_user_token"):
        assert k not in d
    state["tiktok_account_id"] = aid


def test_10_tiktok_connect_upsert_no_duplicate():
    payload2 = {
        "username": "tester",  # same username, no @
        "followers_count": 2500,
        "media_count": 42,
        "name": "Tester Updated",
    }
    r = requests.post(f"{API}/social/connect/tiktok", headers=_h(), json=payload2, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("account_id") == state["tiktok_account_id"], "upsert should keep same account_id"
    assert d.get("followers_count") == 2500
    assert d.get("media_count") == 42

    # list should contain exactly one tiktok account for tester
    r2 = requests.get(f"{API}/social/accounts", headers=_h(), timeout=15)
    assert r2.status_code == 200
    accts = r2.json()
    tiktok = [a for a in accts if a.get("platform") == "tiktok" and a.get("username") == "tester"]
    assert len(tiktok) == 1
    # secrets must not leak
    for k in ("access_token", "refresh_token", "long_lived_token", "fb_user_token"):
        assert k not in tiktok[0]


def test_11_social_account_delete():
    aid = state["tiktok_account_id"]
    r = requests.delete(f"{API}/social/accounts/{aid}", headers=_h(), timeout=15)
    assert r.status_code == 200
    r2 = requests.get(f"{API}/social/accounts", headers=_h(), timeout=15)
    assert r2.status_code == 200
    accts = r2.json()
    assert not any(a.get("account_id") == aid for a in accts)


# ===================== OAUTH start endpoints =====================
def test_12_instagram_503_expected():
    r = requests.get(f"{API}/auth/instagram", headers=_h(), timeout=15)
    assert r.status_code == 503, r.text
    detail = (r.json() or {}).get("detail", "")
    assert "META" in detail or "Meta" in detail or "ميتا" in detail, f"detail missing META: {detail}"


def test_13_youtube_returns_google_oauth_url():
    r = requests.get(f"{API}/auth/youtube", headers=_h(), timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    url = d.get("url", "")
    assert "accounts.google.com" in url
    assert "youtube.readonly" in url


# ===================== REGRESSION =====================
def test_14_regression_login_me_generate():
    # login (cookie + token)
    r = requests.post(
        f"{API}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    token = r.json().get("token")
    assert token
    hh = {"Authorization": f"Bearer {token}"}

    # /auth/me
    rme = requests.get(f"{API}/auth/me", headers=hh, timeout=15)
    assert rme.status_code == 200, rme.text
    me = rme.json()
    # Some implementations wrap in {"user":...}, accept either
    user_doc = me.get("user", me) if isinstance(me, dict) else {}
    assert (user_doc.get("email") == TEST_EMAIL) or (me.get("email") == TEST_EMAIL)

    # /generate/content
    rc = requests.post(
        f"{API}/generate/content",
        headers=hh,
        json={
            "content_type": "caption",
            "style": "casual",
            "dialect": "fusha",
            "topic": "قهوة الصباح",
            "language": "ar",
        },
        timeout=120,
    )
    assert rc.status_code == 200, rc.text
    cdata = rc.json()
    # Accept any of {result, content, text, generations}
    has_content = any(k in cdata for k in ("result", "content", "text", "generations", "output", "items"))
    assert has_content, f"unexpected /generate/content response: {cdata}"

    # /generate/hook
    rh = requests.post(
        f"{API}/generate/hook",
        headers=hh,
        json={
            "platform": "tiktok",
            "topic": "ادخار المال",
            "hook_type": "mixed",
            "dialect": "fusha",
            "language": "ar",
        },
        timeout=120,
    )
    assert rh.status_code == 200, rh.text
    hdata = rh.json()
    has_hook = any(k in hdata for k in ("result", "hooks", "content", "text", "items", "generations", "output"))
    assert has_hook, f"unexpected /generate/hook response: {hdata}"

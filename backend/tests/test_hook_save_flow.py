"""
Backend tests for Hook dialect generator + Saved generations CRUD + per-user persistence.
Covers review_request iteration 2 features.
"""
import os
import time
import pytest
import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

# Dialect-specific markers to verify the LLM honors the requested dialect.
# These are tolerant (any one match counts) because the LLM may not always emit
# the exact lexeme, but each list contains very common dialect-distinctive words.
DIALECT_MARKERS = {
    "gulf":      ["تبي", "تبغى", "وش", "شلون", "ابي", "ابغى", "يبي", "ايش", "هال", " مو ", "محد", "سويت", "سو "],
    "egyptian":  ["إيه", "ايه", "بتاع", "ازاي", "إزاي", "ليه", "عايز", "فين", "بيعمل",
                  " دي ", " ده ", " مش ", "إنت", "هتـ", "بتـ", "علشان", "عشان"],
    "levantine": ["هيك", "كيف", "شو", "هلق", "هلأ", "كتير", "منيح", "بدّك", "بدك"],
}


@pytest.fixture(scope="module")
def user_session():
    """Register a fresh user and return an authenticated requests.Session."""
    ts = int(time.time() * 1000)
    email = f"testhook+{ts}@example.com"
    pw = "TestPass123!"
    username = f"th_{ts % 10_000_000}"
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE}/api/auth/register", json={
        "email": email, "password": pw, "username": username, "name": "Test Hook"
    })
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("token")
    assert token, "no bearer token in register response"
    s.headers.update({"Authorization": f"Bearer {token}"})
    s.creds = {"email": email, "password": pw, "username": username}
    return s


# --- Hook generation with dialect ---
def test_hook_default_dialect_fusha(user_session):
    r = user_session.post(f"{BASE}/api/generate/hook", json={
        "platform": "tiktok",
        "topic": "كيف تبدأ مشروعك الصغير",
        "language": "ar",
    }, timeout=120)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "hooks" in data and len(data["hooks"]) > 20


@pytest.mark.parametrize("dialect", ["gulf", "egyptian", "levantine"])
def test_hook_dialect_specific_words(user_session, dialect):
    """The generated text should contain at least one common word from the requested dialect."""
    r = user_session.post(f"{BASE}/api/generate/hook", json={
        "platform": "tiktok",
        "topic": "نصائح للنوم العميق",
        "dialect": dialect,
        "hook_type": "mixed",
        "language": "ar",
    }, timeout=120)
    assert r.status_code == 200, r.text
    hooks_text = r.json()["hooks"]
    markers = DIALECT_MARKERS[dialect]
    matched = [m for m in markers if m in hooks_text]
    assert matched, f"No {dialect} marker found in hooks. Markers tried={markers}. Output head={hooks_text[:300]!r}"


def test_hook_fusha_explicit(user_session):
    r = user_session.post(f"{BASE}/api/generate/hook", json={
        "platform": "instagram",
        "topic": "أهمية القراءة",
        "dialect": "fusha",
        "language": "ar",
    }, timeout=120)
    assert r.status_code == 200, r.text
    assert len(r.json()["hooks"]) > 20


# --- Saved generations CRUD ---
def test_save_hook_and_list(user_session):
    payload = {
        "content": "1. هل تعلم أن... \n2. السر اللي ما حد قاله...",
        "content_type": "hook",
        "kind": "hook",
        "dialect": "gulf",
        "topic": "نصائح للنوم",
    }
    r = user_session.post(f"{BASE}/api/generations", json=payload)
    assert r.status_code == 200, r.text
    saved = r.json()
    assert saved["gen_id"].startswith("gen_")
    assert saved["content_type"] == "hook"
    assert saved["dialect"] == "gulf"
    assert saved["kind"] == "hook"
    user_session.saved_hook_id = saved["gen_id"]

    # GET list — must include the saved hook
    r2 = user_session.get(f"{BASE}/api/generations")
    assert r2.status_code == 200
    items = r2.json()
    assert any(it["gen_id"] == saved["gen_id"] for it in items), "saved hook missing from list"


def test_save_content_regression(user_session):
    """Existing caption/content save flow should still work."""
    r = user_session.post(f"{BASE}/api/generations", json={
        "content": "كابشن تجريبي للاختبار",
        "content_type": "caption",
        "kind": "content",
        "dialect": "fusha",
        "style": "casual",
        "topic": "اختبار",
    })
    assert r.status_code == 200, r.text
    assert r.json()["content_type"] == "caption"


def test_delete_saved_hook(user_session):
    gen_id = getattr(user_session, "saved_hook_id", None)
    assert gen_id, "no hook saved by previous test"
    r = user_session.delete(f"{BASE}/api/generations/{gen_id}")
    assert r.status_code == 200, r.text

    r2 = user_session.get(f"{BASE}/api/generations")
    assert r2.status_code == 200
    assert not any(it["gen_id"] == gen_id for it in r2.json()), "deleted hook still present"


# --- Auth & per-user isolation ---
def test_generations_require_auth():
    r = requests.get(f"{BASE}/api/generations")
    assert r.status_code == 401


def test_persistence_across_login(user_session):
    """Save a hook → logout (drop bearer) → login again → hook still present."""
    # Save a new hook
    r = user_session.post(f"{BASE}/api/generations", json={
        "content": "هوك ثابت عبر تسجيل الدخول",
        "content_type": "hook",
        "kind": "hook",
        "dialect": "egyptian",
        "topic": "اختبار الثبات",
    })
    assert r.status_code == 200, r.text
    gen_id = r.json()["gen_id"]

    # Fresh session — log in with same creds
    creds = user_session.creds
    s2 = requests.Session()
    s2.headers.update({"Content-Type": "application/json"})
    rlogin = s2.post(f"{BASE}/api/auth/login", json={
        "email": creds["email"], "password": creds["password"],
    })
    assert rlogin.status_code == 200, rlogin.text
    token = rlogin.json()["token"]
    s2.headers.update({"Authorization": f"Bearer {token}"})

    rlist = s2.get(f"{BASE}/api/generations")
    assert rlist.status_code == 200
    items = rlist.json()
    assert any(it["gen_id"] == gen_id for it in items), "hook not persisted across login"

    # Cleanup
    s2.delete(f"{BASE}/api/generations/{gen_id}")


def test_per_user_isolation():
    """Two different users must not see each other's saved generations."""
    ts = int(time.time() * 1000)
    users = []
    for i in range(2):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        email = f"testhook+iso{ts}_{i}@example.com"
        r = s.post(f"{BASE}/api/auth/register", json={
            "email": email, "password": "TestPass123!",
            "username": f"iso_{ts % 10_000_000}_{i}", "name": "Iso",
        })
        assert r.status_code == 200, r.text
        s.headers.update({"Authorization": f"Bearer {r.json()['token']}"})
        users.append(s)

    # User 0 saves
    r = users[0].post(f"{BASE}/api/generations", json={
        "content": "private to user 0", "content_type": "hook", "kind": "hook",
    })
    assert r.status_code == 200
    gen_id_0 = r.json()["gen_id"]

    # User 1 should NOT see it
    r2 = users[1].get(f"{BASE}/api/generations")
    assert r2.status_code == 200
    assert not any(it["gen_id"] == gen_id_0 for it in r2.json()), "cross-user leak!"

    # User 1 cannot delete user 0's hook (delete should silently no-op, then verify it still exists)
    users[1].delete(f"{BASE}/api/generations/{gen_id_0}")
    r3 = users[0].get(f"{BASE}/api/generations")
    assert any(it["gen_id"] == gen_id_0 for it in r3.json()), "another user deleted my hook!"

    # cleanup
    users[0].delete(f"{BASE}/api/generations/{gen_id_0}")

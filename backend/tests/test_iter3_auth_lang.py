"""
Iteration 3 regression tests:
- Distinct auth errors: 404 for unregistered login, 401 for wrong password,
  409 for duplicate register email
- Auto language detection from topic: ignores explicit `language` field,
  responds in language matching the topic
"""
import os
import time
import re
import pytest
import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
PW = "TestPass123!"


# ---------- helpers ----------
def _register_fresh():
    ts = int(time.time() * 1000)
    email = f"testflow+{ts}@example.com"
    username = f"tf_{ts % 10_000_000}"
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE}/api/auth/register", json={
        "email": email, "password": PW, "username": username, "name": "Test Flow"
    }, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    token = r.json().get("token")
    assert token, "no bearer token in register response"
    s.headers.update({"Authorization": f"Bearer {token}"})
    s.creds = {"email": email, "password": PW, "username": username}
    return s


def _has_arabic(text: str) -> int:
    return sum(1 for c in text if "\u0600" <= c <= "\u06FF")


def _has_latin(text: str) -> int:
    return sum(1 for c in text if c.isascii() and c.isalpha())


# ---------- auth distinct error codes ----------
class TestAuthDistinctErrors:
    def test_login_unregistered_returns_404(self):
        r = requests.post(f"{BASE}/api/auth/login", json={
            "email": f"never_existed_{int(time.time()*1000)}@example.com",
            "password": PW,
        }, timeout=20)
        assert r.status_code == 404, r.text
        body = r.json()
        detail = body.get("detail", "")
        # Should be Arabic and mention creating new account
        assert _has_arabic(detail) > 0, f"detail not Arabic: {detail!r}"
        assert ("إنشاء" in detail or "جديد" in detail or "غير مسجّل" in detail), detail

    def test_register_then_duplicate_returns_409(self):
        s = _register_fresh()
        email = s.creds["email"]
        r2 = requests.post(f"{BASE}/api/auth/register", json={
            "email": email, "password": PW,
            "username": f"dup_{int(time.time()*1000) % 10_000_000}",
            "name": "Dup",
        }, timeout=20)
        assert r2.status_code == 409, r2.text
        detail = r2.json().get("detail", "")
        assert _has_arabic(detail) > 0
        assert ("مسجّل" in detail or "مسجل" in detail), detail

    def test_login_wrong_password_returns_401(self):
        s = _register_fresh()
        r = requests.post(f"{BASE}/api/auth/login", json={
            "email": s.creds["email"], "password": "WRONG_PASS_999!",
        }, timeout=20)
        assert r.status_code == 401, r.text
        detail = r.json().get("detail", "")
        assert "كلمة السر" in detail or "غير صحيح" in detail, detail

    def test_login_correct_credentials_returns_200(self):
        s = _register_fresh()
        r = requests.post(f"{BASE}/api/auth/login", json={
            "email": s.creds["email"], "password": PW,
        }, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "token" in body and isinstance(body["token"], str) and len(body["token"]) > 10
        assert body.get("user", {}).get("email") == s.creds["email"]


# ---------- auto language detection ----------
@pytest.fixture(scope="module")
def user_session():
    return _register_fresh()


class TestAutoLanguageDetection:
    def test_content_english_topic_with_lang_ar_returns_english(self, user_session):
        r = user_session.post(f"{BASE}/api/generate/content", json={
            "topic": "a productivity app for students",
            "content_type": "caption",
            "style": "casual",
            "dialect": "fusha",
            "language": "ar",  # explicit AR — must be ignored
        }, timeout=120)
        assert r.status_code == 200, r.text
        content = r.json()["content"]
        ar = _has_arabic(content)
        en = _has_latin(content)
        assert en > ar, f"expected English-dominant content. ar={ar} en={en}. text={content[:200]!r}"

    def test_content_arabic_topic_with_lang_en_returns_arabic(self, user_session):
        r = user_session.post(f"{BASE}/api/generate/content", json={
            "topic": "فطور صحي للأطفال",
            "content_type": "caption",
            "style": "casual",
            "dialect": "fusha",
            "language": "en",  # explicit EN — must be ignored
        }, timeout=120)
        assert r.status_code == 200, r.text
        content = r.json()["content"]
        ar = _has_arabic(content)
        en = _has_latin(content)
        assert ar > en, f"expected Arabic-dominant content. ar={ar} en={en}. text={content[:200]!r}"

    def test_hook_english_topic_returns_english(self, user_session):
        r = user_session.post(f"{BASE}/api/generate/hook", json={
            "platform": "tiktok",
            "topic": "best productivity hacks for college students",
            "language": "ar",  # ignored
            "hook_type": "mixed",
        }, timeout=120)
        assert r.status_code == 200, r.text
        hooks = r.json()["hooks"]
        ar = _has_arabic(hooks)
        en = _has_latin(hooks)
        assert en > ar, f"expected English hooks. ar={ar} en={en}. head={hooks[:200]!r}"

    def test_hook_arabic_topic_egyptian_dialect_regression(self, user_session):
        """Auto-detect should still pick Arabic AND dialect must be honored."""
        r = user_session.post(f"{BASE}/api/generate/hook", json={
            "platform": "tiktok",
            "topic": "نصائح للنوم العميق",
            "dialect": "egyptian",
            "hook_type": "mixed",
            "language": "en",  # ignored
        }, timeout=120)
        assert r.status_code == 200, r.text
        hooks = r.json()["hooks"]
        ar = _has_arabic(hooks)
        en = _has_latin(hooks)
        assert ar > en, f"expected Arabic hooks. ar={ar} en={en}"
        egyptian_markers = ["إيه", "ايه", "بتاع", "ازاي", "إزاي", "ليه", "عايز",
                            "فين", " دي ", " ده ", " مش ", "علشان", "عشان"]
        assert any(m in hooks for m in egyptian_markers), \
            f"no Egyptian marker found. head={hooks[:300]!r}"

    def test_match_english_content_returns_english(self, user_session):
        r = user_session.post(f"{BASE}/api/generate/match", json={
            "content": "Quick tips for waking up early without an alarm clock. Step by step morning routine that actually works.",
            "platform": "tiktok",
            "language": "ar",  # ignored
        }, timeout=120)
        assert r.status_code == 200, r.text
        analysis = r.json().get("analysis", "")
        ar = _has_arabic(analysis)
        en = _has_latin(analysis)
        assert en > ar, f"expected English analysis. ar={ar} en={en}. head={analysis[:200]!r}"


# ---------- regression: previously saved hook CRUD still works ----------
class TestRegressionGenerationsCRUD:
    def test_save_list_delete(self, user_session):
        r = user_session.post(f"{BASE}/api/generations", json={
            "content": "1. تجربة\n2. حفظ",
            "content_type": "hook", "kind": "hook",
            "dialect": "fusha", "topic": "اختبار",
        })
        assert r.status_code == 200, r.text
        gid = r.json()["gen_id"]
        rl = user_session.get(f"{BASE}/api/generations")
        assert rl.status_code == 200
        assert any(it["gen_id"] == gid for it in rl.json())
        rd = user_session.delete(f"{BASE}/api/generations/{gid}")
        assert rd.status_code == 200
        rl2 = user_session.get(f"{BASE}/api/generations")
        assert not any(it["gen_id"] == gid for it in rl2.json())

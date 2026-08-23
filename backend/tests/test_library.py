"""
Backend tests for Library features: generation history (auto-log), favorite
templates CRUD, brand voice CRUD + activation, and brand-voice injection.
"""
import os
import time
import pytest
import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


@pytest.fixture(scope="module")
def session():
    ts = int(time.time() * 1000)
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE}/api/auth/register", json={
        "email": f"lib+{ts}@example.com", "password": "TestPass123!",
        "username": f"lib_{ts % 10_000_000}", "name": "Lib Test",
    })
    assert r.status_code == 200, r.text
    s.headers.update({"Authorization": f"Bearer {r.json()['token']}"})
    return s


# ---------- Templates ----------
def test_template_crud(session):
    r = session.post(f"{BASE}/api/templates", json={
        "name": "إعلان مصري مضحك", "kind": "content",
        "content_type": "ad", "style": "funny", "dialect": "egyptian",
    })
    assert r.status_code == 200, r.text
    tpl = r.json()
    assert tpl["template_id"].startswith("tpl_")
    assert tpl["content_type"] == "ad"

    lst = session.get(f"{BASE}/api/templates")
    assert lst.status_code == 200
    assert any(x["template_id"] == tpl["template_id"] for x in lst.json())

    d = session.delete(f"{BASE}/api/templates/{tpl['template_id']}")
    assert d.status_code == 200
    lst2 = session.get(f"{BASE}/api/templates")
    assert not any(x["template_id"] == tpl["template_id"] for x in lst2.json())


def test_templates_require_auth():
    assert requests.get(f"{BASE}/api/templates").status_code == 401


# ---------- History (auto-logged by generation) ----------
def test_history_autolog_and_delete(session):
    # Clear then generate → history should contain the new entry.
    session.delete(f"{BASE}/api/history")
    g = session.post(f"{BASE}/api/generate/content", json={
        "content_type": "caption", "style": "casual", "dialect": "fusha",
        "topic": "قهوة الصباح", "language": "ar",
    }, timeout=120)
    assert g.status_code == 200, g.text

    h = session.get(f"{BASE}/api/history")
    assert h.status_code == 200
    items = h.json()
    assert len(items) >= 1
    assert items[0]["kind"] == "content"
    assert items[0]["content"]

    hid = items[0]["hist_id"]
    d = session.delete(f"{BASE}/api/history/{hid}")
    assert d.status_code == 200
    assert not any(x["hist_id"] == hid for x in session.get(f"{BASE}/api/history").json())


def test_history_clear(session):
    session.post(f"{BASE}/api/generate/content", json={
        "content_type": "tweet", "style": "funny", "dialect": "fusha",
        "topic": "اختبار", "language": "ar",
    }, timeout=120)
    c = session.delete(f"{BASE}/api/history")
    assert c.status_code == 200
    assert session.get(f"{BASE}/api/history").json() == []


def test_history_requires_auth():
    assert requests.get(f"{BASE}/api/history").status_code == 401


# ---------- Brand voice ----------
def test_brand_voice_too_short_rejected(session):
    r = session.post(f"{BASE}/api/brand-voice", json={"name": "v", "samples": "قصير"})
    assert r.status_code == 400


def test_brand_voice_create_activate_delete(session):
    r = session.post(f"{BASE}/api/brand-voice", json={
        "name": "صوتي المصري",
        "samples": "يا جماعة الخير! النهاردة هنتكلم عن حاجة هتغير حياتكم. صدقوني الموضوع جامد جداً. خليكم معايا للآخر!",
    }, timeout=120)
    assert r.status_code == 200, r.text
    v = r.json()
    assert v["voice_id"].startswith("bv_")
    assert v["profile"]
    assert v["is_active"] is True  # first voice auto-active

    # second voice → not auto active
    r2 = session.post(f"{BASE}/api/brand-voice", json={
        "name": "صوت رسمي",
        "samples": "نقدم لكم اليوم محتوى احترافياً يهدف إلى تقديم قيمة حقيقية ومعلومات موثوقة بأسلوب رصين.",
    }, timeout=120)
    assert r2.status_code == 200
    v2 = r2.json()
    assert v2["is_active"] is False

    # activate v2 → v1 becomes inactive
    a = session.post(f"{BASE}/api/brand-voice/{v2['voice_id']}/activate")
    assert a.status_code == 200
    lst = {x["voice_id"]: x["is_active"] for x in session.get(f"{BASE}/api/brand-voice").json()}
    assert lst[v2["voice_id"]] is True
    assert lst[v["voice_id"]] is False

    # deactivate all
    session.post(f"{BASE}/api/brand-voice/deactivate")
    lst2 = [x["is_active"] for x in session.get(f"{BASE}/api/brand-voice").json()]
    assert all(a is False for a in lst2)

    # delete
    session.delete(f"{BASE}/api/brand-voice/{v['voice_id']}")
    session.delete(f"{BASE}/api/brand-voice/{v2['voice_id']}")
    assert session.get(f"{BASE}/api/brand-voice").json() == []


def test_generate_with_brand_voice_id(session):
    v = session.post(f"{BASE}/api/brand-voice", json={
        "name": "hype-en",
        "samples": "Yo whats up fam! Today we talking about something huge. Trust me this changes everything. Lets gooo!",
    }, timeout=120).json()
    g = session.post(f"{BASE}/api/generate/content", json={
        "content_type": "caption", "style": "casual", "dialect": "fusha",
        "topic": "new gym launch", "language": "en", "brand_voice_id": v["voice_id"],
    }, timeout=120)
    assert g.status_code == 200, g.text
    assert g.json()["content"]
    session.delete(f"{BASE}/api/brand-voice/{v['voice_id']}")


def test_brand_voice_requires_auth():
    assert requests.get(f"{BASE}/api/brand-voice").status_code == 401

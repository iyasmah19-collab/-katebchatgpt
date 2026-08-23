from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Depends, UploadFile, File, Header
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
from urllib.parse import urlencode
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict
import uuid
import re
import json
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
import httpx
from openai import AsyncOpenAI
import stripe
import google_play
import tempfile
import base64
import cv2  # type: ignore

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
OWNER_ACCESS_TOKEN = os.environ.get("OWNER_ACCESS_TOKEN", "")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
APP_NAME = os.environ.get("APP_NAME", "kateb")

# Independent object storage.  S3-compatible storage is preferred in production;
# local disk is used as a zero-configuration fallback for development.
STORAGE_DIR = Path(os.environ.get("STORAGE_DIR", str(ROOT_DIR / "storage")))
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
S3_BUCKET = os.environ.get("S3_BUCKET", "")
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL", "")
S3_REGION = os.environ.get("S3_REGION", "auto")
S3_ACCESS_KEY_ID = os.environ.get("S3_ACCESS_KEY_ID", "")
S3_SECRET_ACCESS_KEY = os.environ.get("S3_SECRET_ACCESS_KEY", "")

# Direct OpenAI integration; no Emergent gateway is required.
LLM_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.4")
LLM_VISION_MODEL = os.environ.get("OPENAI_VISION_MODEL", LLM_MODEL)
_openai = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

def _require_openai():
    if _openai is None:
        raise RuntimeError("OPENAI_API_KEY is not configured")

async def llm_send(*, session_id: str, system_message: str, user_text: str, primary=None) -> str:
    _require_openai()
    response = await _openai.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_text},
        ],
        temperature=0.7,
    )
    text = (response.choices[0].message.content or "").strip()
    if not text:
        raise RuntimeError("Empty response from OpenAI")
    return text

def _safe_storage_path(path: str) -> Path:
    clean = path.replace("\\\\", "/").lstrip("/")
    target = (STORAGE_DIR / clean).resolve()
    if STORAGE_DIR.resolve() not in target.parents:
        raise ValueError("Invalid storage path")
    target.parent.mkdir(parents=True, exist_ok=True)
    return target

def storage_put(path: str, data: bytes, content_type: str) -> dict:
    # S3-compatible storage when configured.
    if S3_BUCKET and S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY:
        import boto3
        kwargs = {
            "service_name": "s3",
            "region_name": S3_REGION,
            "aws_access_key_id": S3_ACCESS_KEY_ID,
            "aws_secret_access_key": S3_SECRET_ACCESS_KEY,
        }
        if S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = S3_ENDPOINT_URL
        s3 = boto3.client(**kwargs)
        s3.put_object(Bucket=S3_BUCKET, Key=path, Body=data, ContentType=content_type)
        return {"path": path}
    target = _safe_storage_path(path)
    target.write_bytes(data)
    target.with_suffix(target.suffix + ".content-type").write_text(content_type, encoding="utf8")
    return {"path": path}

def storage_get(path: str) -> tuple:
    if S3_BUCKET and S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY:
        import boto3
        kwargs = {
            "service_name": "s3",
            "region_name": S3_REGION,
            "aws_access_key_id": S3_ACCESS_KEY_ID,
            "aws_secret_access_key": S3_SECRET_ACCESS_KEY,
        }
        if S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = S3_ENDPOINT_URL
        obj = boto3.client(**kwargs).get_object(Bucket=S3_BUCKET, Key=path)
        return obj["Body"].read(), obj.get("ContentType", "application/octet-stream")
    target = _safe_storage_path(path)
    if not target.exists():
        raise FileNotFoundError(path)
    ct_file = target.with_suffix(target.suffix + ".content-type")
    content_type = ct_file.read_text(encoding="utf8") if ct_file.exists() else "application/octet-stream"
    return target.read_bytes(), content_type

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_jwt(user_id: str, days: int = 7) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=days),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def sync_remote_picture(url: str, user_id: str) -> Optional[str]:
    """Download remote profile picture and upload to object storage. Returns internal URL or None."""
    if not url:
        return None
    try:
        r = requests.get(url, timeout=15, stream=True)
        if r.status_code != 200:
            return None
        data = r.content
        if len(data) > 10 * 1024 * 1024:
            return None
        content_type = r.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
        ext_map = {
            "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
            "image/webp": "webp", "image/gif": "gif",
        }
        ext = ext_map.get(content_type, "jpg")
        path = f"{APP_NAME}/avatars/{user_id}/{uuid.uuid4().hex}.{ext}"
        result = storage_put(path, data, content_type)
        return result["path"]
    except Exception as e:
        logging.warning(f"Picture sync failed: {e}")
        return None

app = FastAPI()
api = APIRouter(prefix="/api")


# ============== MODELS ==============
class User(BaseModel):
    user_id: str
    email: str
    name: str
    username: Optional[str] = None
    picture: Optional[str] = None
    avatar_path: Optional[str] = None
    auth_method: Optional[str] = "google"
    is_premium: bool = False
    credits: Optional[int] = None
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None
    premium_source: Optional[str] = None
    premium_expires_at: Optional[str] = None
    subscription_type: Optional[str] = None
    subscription_cancelled: Optional[bool] = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str
    name: Optional[str] = None
    referral_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None  # not required for OAuth users setting password first time
    new_password: str


class GenerateRequest(BaseModel):
    content_type: str  # caption, ad, post, bio, tweet, story
    style: str  # funny, professional, emotional, motivational, casual
    dialect: str  # fusha, gulf, egyptian, levantine
    topic: str
    language: str = "ar"  # ar or en
    brand_voice_id: Optional[str] = None  # optional brand-voice profile to mimic


class HookRequest(BaseModel):
    platform: str  # instagram, tiktok, shorts
    topic: str
    hook_type: str = "mixed"  # shocking, question, secret, challenge, opinion, story, statistic, contradiction, mixed
    dialect: str = "fusha"  # fusha, gulf, egyptian, levantine
    language: str = "ar"
    brand_voice_id: Optional[str] = None  # optional brand-voice profile to mimic


class TemplateRequest(BaseModel):
    name: str
    kind: str = "content"  # content | hook
    content_type: Optional[str] = None
    style: Optional[str] = None
    dialect: Optional[str] = None
    platform: Optional[str] = None
    hook_type: Optional[str] = None


class BrandVoiceRequest(BaseModel):
    name: str
    samples: str  # past posts / writing samples pasted by the user


class SecretRef(BaseModel):
    number: int
    title: str


class MatchRequest(BaseModel):
    platform: str
    content: str
    language: str = "ar"
    # Optional list of the 50 vault secrets (number + title) for the LLM to pick from.
    # When provided, the response includes a structured `analysis_data` block — otherwise
    # we fall back to free-form markdown via the legacy prompt.
    secrets: Optional[List[SecretRef]] = None


class CheckoutRequest(BaseModel):
    plan: str  # monthly, lifetime
    origin_url: str


class RedeemCodeRequest(BaseModel):
    code: str


# Valid premium discount codes (case-sensitive, uppercase only).
# Value is discount fraction (1.0 = 100% off = full free premium access).
DISCOUNT_CODES_SERVER: Dict[str, float] = {
    "AMDSH75": 1.0,
}

# How many free attempts non-premium users get for the matcher tool.
FREE_MATCH_ATTEMPTS = 3


# ============== AUTH ==============
async def _enforce_premium_expiry(user_doc: dict) -> dict:
    """If premium has expired (and is not owner/discount-granted), revoke it.

    This mutates the DB in-place and returns the (possibly updated) user_doc so
    callers can return fresh state. Owner / discount premium is never revoked.
    """
    if not user_doc:
        return user_doc
    if not user_doc.get("is_premium"):
        return user_doc
    if user_doc.get("premium_source") in ("owner", "discount"):
        return user_doc
    expires_at = user_doc.get("premium_expires_at")
    if not expires_at:
        return user_doc
    try:
        exp_dt = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
    except Exception:
        return user_doc
    if exp_dt.tzinfo is None:
        exp_dt = exp_dt.replace(tzinfo=timezone.utc)
    if exp_dt > datetime.now(timezone.utc):
        return user_doc
    # Expired — revoke premium but keep the historical expiry timestamp.
    await db.users.update_one(
        {"user_id": user_doc["user_id"]},
        {"$set": {"is_premium": False, "premium_source": None}},
    )
    user_doc["is_premium"] = False
    user_doc["premium_source"] = None
    return user_doc


async def get_current_user(
    request: Request, session_token: Optional[str] = None
) -> Optional[User]:
    # Try JWT access_token first (email/password auth)
    access_token = request.cookies.get("access_token")
    if not access_token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            access_token = auth[7:]
    if access_token:
        try:
            payload = jwt.decode(access_token, JWT_SECRET, algorithms=[JWT_ALG])
            user_doc = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
            if user_doc:
                user_doc = await _enforce_premium_expiry(user_doc)
                return User(**user_doc)
        except jwt.PyJWTError:
            pass

    # Fall back to legacy session_token (Google OAuth / owner)
    token = session_token if isinstance(session_token, str) else None
    if not token:
        token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        return None
    user_doc = await _enforce_premium_expiry(user_doc)
    return User(**user_doc)


async def require_user(request: Request, session_token: Optional[str] = Cookie(default=None)) -> User:
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@api.post("/auth/session")
async def auth_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    async with httpx.AsyncClient() as cli:
        r = await cli.get(
            "/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=15.0,
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()

    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        # Re-sync picture from Google (if new picture URL)
        new_pic = data.get("picture", "")
        if new_pic and new_pic != existing.get("google_picture_url"):
            internal_path = sync_remote_picture(new_pic, user_id)
            if internal_path:
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "avatar_path": internal_path,
                        "picture": f"/api/avatar/{internal_path}",
                        "google_picture_url": new_pic,
                    }},
                )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        # Sync picture from Google to object storage
        google_pic_url = data.get("picture", "")
        internal_path = sync_remote_picture(google_pic_url, user_id) if google_pic_url else None
        picture_url = f"/api/avatar/{internal_path}" if internal_path else google_pic_url
        referral_code = await generate_referral_code()
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data.get("name", ""),
            "username": (data["email"].split("@")[0] + "_" + uuid.uuid4().hex[:4])[:20],
            "picture": picture_url,
            "avatar_path": internal_path,
            "google_picture_url": google_pic_url,
            "auth_method": "google",
            "is_premium": False,
            "credits": DEFAULT_CREDITS,
            "referral_code": referral_code,
            "referred_by": None,
            "premium_expires_at": None,
            "subscription_type": None,
            "subscription_cancelled": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": session_token}


@api.get("/auth/me")
async def auth_me(user: User = Depends(require_user)):
    return user.model_dump()


@api.post("/auth/logout")
async def auth_logout(response: Response, session_token: Optional[str] = Cookie(default=None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


# ============== GOOGLE OAUTH (DIRECT — replaces Emergent auth bridge) ==============
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
# The redirect URI is derived from the request origin so it works on preview, deployed, and any
# custom domain — as long as the URI is registered in Google Cloud Console.
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def _frontend_origin_from(request: Request) -> str:
    """Resolve the frontend origin (scheme+host) without hardcoding any URL.

    Cloudflare workers and other proxies sometimes rewrite ``Host``/``Origin``
    to an internal cluster hostname while keeping the real public host in
    ``x-forwarded-host``. Trust that header first so OAuth redirect URIs always
    point at the public frontend URL.
    """
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    forwarded_host = request.headers.get("x-forwarded-host")
    if forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}"
    origin = request.headers.get("origin")
    if origin:
        return origin.rstrip("/")
    referer = request.headers.get("referer")
    if referer:
        try:
            from urllib.parse import urlparse
            p = urlparse(referer)
            return f"{p.scheme}://{p.netloc}"
        except Exception:
            pass
    host = request.headers.get("host") or "localhost"
    return f"{forwarded_proto}://{host}"


@api.get("/auth/google/login")
async def google_login(request: Request, ref: Optional[str] = None):
    """Initiate Google OAuth — 302-redirect the user straight to Google's account picker."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    origin = _frontend_origin_from(request)
    redirect_uri = f"{origin}/auth/google"
    state = secrets.token_urlsafe(24)
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",  # always show account picker, never silent-login
        "include_granted_scopes": "true",
    }
    google_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    resp = RedirectResponse(google_url, status_code=302)
    # CSRF protection: bind state to the browser via HttpOnly cookie
    resp.set_cookie(
        "g_oauth_state", state,
        max_age=600, httponly=True, secure=True, samesite="lax", path="/",
    )
    # Forward referral code through the OAuth flow as a short-lived cookie so
    # `/auth/google/exchange` can apply it on first-time sign-up.
    if ref:
        resp.set_cookie(
            "g_oauth_ref", ref,
            max_age=600, httponly=True, secure=True, samesite="lax", path="/",
        )
    return resp


class GoogleExchangeRequest(BaseModel):
    code: str
    state: str
    redirect_uri: str  # must match the redirect_uri used in /auth/google/login


@api.post("/auth/google/exchange")
async def google_exchange(body: GoogleExchangeRequest, request: Request, response: Response):
    """Exchange the Google authorization code for tokens + user info, then issue our JWT cookie."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    saved_state = request.cookies.get("g_oauth_state")
    if not saved_state or saved_state != body.state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state (CSRF check failed)")

    async with httpx.AsyncClient(timeout=15) as client_http:
        token_resp = await client_http.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": body.code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": body.redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        if token_resp.status_code != 200:
            logging.error("Google token exchange failed: %s", token_resp.text[:300])
            raise HTTPException(status_code=400, detail="فشل التحقق من Google — حاول مجدداً")
        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access_token in Google response")

        userinfo_resp = await client_http.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")
        userinfo = userinfo_resp.json()

    email = (userinfo.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Google did not return an email")
    if not userinfo.get("email_verified", True):
        raise HTTPException(status_code=400, detail="بريد Google غير مُؤكَّد")

    name = userinfo.get("name") or email.split("@")[0]
    picture = userinfo.get("picture", "")
    google_sub = userinfo.get("sub")

    # Find existing user (by email) or create a new one
    existing = await db.users.find_one({"email": email})
    is_new_user = False
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "google_sub": google_sub,
                "picture": picture or existing.get("picture", ""),
                "name": existing.get("name") or name,
            }},
        )
    else:
        is_new_user = True
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        base = re.sub(r"[^a-zA-Z0-9_]", "", email.split("@")[0])[:18] or f"u{user_id[5:9]}"
        username = base
        suffix = 0
        while await db.users.find_one({"username": username}):
            suffix += 1
            username = f"{base}{suffix}"[:20]
        referral_code = await generate_referral_code()
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "username": username,
            "name": name,
            "picture": picture,
            "google_sub": google_sub,
            "auth_method": "google",
            "is_premium": False,
            "credits": DEFAULT_CREDITS,
            "referral_code": referral_code,
            "referred_by": None,
            "premium_expires_at": None,
            "subscription_type": None,
            "subscription_cancelled": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    set_auth_cookie(response, user_id)
    # Apply pending referral cookie (only for first-time signups via Google).
    ref_cookie = request.cookies.get("g_oauth_ref")
    if is_new_user and ref_cookie:
        try:
            code = _normalize_referral_code(ref_cookie)
            if code.startswith(REFERRAL_PREFIX):
                referrer = await db.users.find_one({"referral_code": code}, {"_id": 0, "user_id": 1})
                if referrer and referrer["user_id"] != user_id:
                    await db.users.update_one(
                        {"user_id": user_id},
                        {"$set": {"referred_by": referrer["user_id"]}},
                    )
                    await _grant_referral_signup(referrer["user_id"], user_id, code)
        except Exception as e:
            logging.warning(f"referral apply on google signup failed: {e}")
    response.delete_cookie("g_oauth_ref", path="/")
    # Cleanup OAuth state cookie
    response.delete_cookie("g_oauth_state", path="/")
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user_doc}


# ============== MOBILE GOOGLE SIGN-IN ==============
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
# Mobile apps cannot share cookies with the backend the way browsers do, so they exchange
# a Google ID token for our own JWT (returned in the response body, stored in SecureStore).
GOOGLE_WEB_CLIENT_ID = os.environ.get("GOOGLE_WEB_CLIENT_ID", "") or GOOGLE_CLIENT_ID
GOOGLE_ANDROID_CLIENT_ID = os.environ.get("GOOGLE_ANDROID_CLIENT_ID", "")
GOOGLE_IOS_CLIENT_ID = os.environ.get("GOOGLE_IOS_CLIENT_ID", "")


class GoogleMobileLoginRequest(BaseModel):
    id_token: str


@api.post("/auth/google/mobile")
async def google_mobile_login(body: GoogleMobileLoginRequest):
    """Mobile Google Sign-In: verify Google ID token, return our JWT + user.

    Frontend (expo-auth-session) obtains an `id_token` from Google. We verify it
    server-side against Google's public keys, then issue our own JWT bearer token
    that the mobile app stores in SecureStore and sends as `Authorization: Bearer ...`.
    """
    if not GOOGLE_WEB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    # Lazy import so backend still boots if the package is missing in some environments.
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
    except Exception as e:
        logging.error("google-auth library not installed: %s", e)
        raise HTTPException(status_code=500, detail="Server missing google-auth library")

    # Build the list of accepted audiences (Web + Android + iOS client IDs).
    accepted_audiences = [c for c in [GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID] if c]

    idinfo = None
    last_err = None
    for aud in accepted_audiences:
        try:
            idinfo = google_id_token.verify_oauth2_token(
                body.id_token, google_requests.Request(), aud
            )
            break
        except ValueError as e:
            last_err = str(e)
            continue

    if not idinfo:
        logging.warning("Mobile Google id_token verification failed: %s", last_err)
        raise HTTPException(status_code=401, detail="فشل التحقق من Google — حاول مجدداً")

    # Standard Google ID token claims
    if idinfo.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(status_code=401, detail="Invalid token issuer")

    email = (idinfo.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Google did not return an email")
    if not idinfo.get("email_verified", True):
        raise HTTPException(status_code=400, detail="بريد Google غير مُؤكَّد")

    name = idinfo.get("name") or email.split("@")[0]
    picture = idinfo.get("picture", "")
    google_sub = idinfo.get("sub")

    # Find existing user (by email) or create a new one — same logic as web flow.
    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "google_sub": google_sub,
                "picture": picture or existing.get("picture", ""),
                "name": existing.get("name") or name,
            }},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        base = re.sub(r"[^a-zA-Z0-9_]", "", email.split("@")[0])[:18] or f"u{user_id[5:9]}"
        username = base
        suffix = 0
        while await db.users.find_one({"username": username}):
            suffix += 1
            username = f"{base}{suffix}"[:20]
        referral_code = await generate_referral_code()
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "username": username,
            "name": name,
            "picture": picture,
            "google_sub": google_sub,
            "auth_method": "google",
            "is_premium": False,
            "credits": DEFAULT_CREDITS,
            "referral_code": referral_code,
            "referred_by": None,
            "premium_expires_at": None,
            "subscription_type": None,
            "subscription_cancelled": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Mobile gets the JWT in the response body (NOT a cookie) for SecureStore.
    jwt_token = create_jwt(user_id, days=30)
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"token": jwt_token, "user": user_doc}


# ============== EMAIL/PASSWORD AUTH ==============
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,20}$")


def set_auth_cookie(response: Response, user_id: str):
    token = create_jwt(user_id, days=7)
    response.set_cookie(
        key="access_token",
        value=token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    return token


@api.post("/auth/register")
async def auth_register(body: RegisterRequest, response: Response):
    email = body.email.lower().strip()
    username = body.username.strip()
    if not USERNAME_RE.match(username):
        raise HTTPException(status_code=400, detail="اسم المستخدم: 3-20 حرف، أحرف إنجليزية وأرقام و _ فقط")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="كلمة السر: 6 أحرف على الأقل")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="هذا البريد مسجّل مسبقاً. الرجاء تسجيل الدخول.")
    if await db.users.find_one({"username": username}):
        raise HTTPException(status_code=409, detail="اسم المستخدم مأخوذ")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    referral_code = await generate_referral_code()
    await db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "username": username,
        "name": body.name or username,
        "picture": "",
        "avatar_path": None,
        "password_hash": hash_password(body.password),
        "auth_method": "email",
        "is_premium": False,
        "credits": DEFAULT_CREDITS,
        "referral_code": referral_code,
        "referred_by": None,
        "premium_expires_at": None,
        "subscription_type": None,
        "subscription_cancelled": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    set_auth_cookie(response, user_id)
    # Apply referral code if the new user provided one (silent failure — sign-up must still succeed).
    if body.referral_code:
        try:
            code = _normalize_referral_code(body.referral_code)
            if code.startswith(REFERRAL_PREFIX):
                referrer = await db.users.find_one({"referral_code": code}, {"_id": 0, "user_id": 1})
                if referrer and referrer["user_id"] != user_id:
                    await db.users.update_one(
                        {"user_id": user_id},
                        {"$set": {"referred_by": referrer["user_id"]}},
                    )
                    await _grant_referral_signup(referrer["user_id"], user_id, code)
        except Exception as e:
            logging.warning(f"referral apply on register failed: {e}")
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    # Mobile clients also receive the JWT in the body so they can store it in SecureStore.
    bearer_token = create_jwt(user_id, days=30)
    return {"user": user_doc, "token": bearer_token}


@api.post("/auth/login")
async def auth_login(body: LoginRequest, response: Response):
    email = body.email.lower().strip()
    doc = await db.users.find_one({"email": email})
    if not doc:
        # Distinct status so the UI can suggest "create an account" instead of generic error
        raise HTTPException(status_code=404, detail="هذا البريد غير مسجّل. الرجاء إنشاء حساب جديد.")
    if not doc.get("password_hash"):
        # Account exists but was created via Google OAuth (no local password)
        raise HTTPException(status_code=400, detail="هذا الحساب مرتبط بـ Google. سجّل الدخول عبر Google.")
    if not verify_password(body.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="كلمة السر غير صحيحة")
    set_auth_cookie(response, doc["user_id"])
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    # Mobile clients also receive the JWT in the body so they can store it in SecureStore.
    bearer_token = create_jwt(doc["user_id"], days=30)
    return {"user": doc, "token": bearer_token}


# ============== EMAIL/PASSWORD AUTH ==============


@api.put("/auth/profile")
async def update_profile(body: UpdateProfileRequest, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    updates = {}
    if body.username:
        username = body.username.strip()
        if not USERNAME_RE.match(username):
            raise HTTPException(status_code=400, detail="اسم المستخدم: 3-20 حرف، أحرف إنجليزية وأرقام و _ فقط")
        existing = await db.users.find_one({"username": username, "user_id": {"$ne": user.user_id}})
        if existing:
            raise HTTPException(status_code=409, detail="اسم المستخدم مأخوذ")
        updates["username"] = username
    if body.email:
        email = body.email.lower().strip()
        existing = await db.users.find_one({"email": email, "user_id": {"$ne": user.user_id}})
        if existing:
            raise HTTPException(status_code=409, detail="البريد الإلكتروني مسجّل مسبقاً")
        updates["email"] = email
    if body.name is not None:
        updates["name"] = body.name.strip()
    if updates:
        await db.users.update_one({"user_id": user.user_id}, {"$set": updates})
    doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    return {"user": doc}


@api.put("/auth/password")
async def change_password(body: ChangePasswordRequest, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="كلمة السر: 6 أحرف على الأقل")
    doc = await db.users.find_one({"user_id": user.user_id})
    if doc.get("password_hash"):
        if not body.current_password or not verify_password(body.current_password, doc["password_hash"]):
            raise HTTPException(status_code=403, detail="كلمة السر الحالية غير صحيحة")
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"password_hash": hash_password(body.new_password)}},
    )
    return {"ok": True}


@api.post("/auth/avatar")
async def upload_avatar(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    allowed = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="نوع الصورة غير مدعوم (PNG/JPG/WEBP/GIF فقط)")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="حجم الصورة أكبر من 5MB")
    ext = (file.filename or "img").split(".")[-1].lower()
    if ext not in {"png", "jpg", "jpeg", "webp", "gif"}:
        ext = "png"
    path = f"{APP_NAME}/avatars/{user.user_id}/{uuid.uuid4().hex}.{ext}"
    try:
        result = storage_put(path, data, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في رفع الصورة: {e}")

    stored_path = result["path"]
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"avatar_path": stored_path, "picture": f"/api/avatar/{stored_path}"}},
    )
    return {"avatar_path": stored_path, "url": f"/api/avatar/{stored_path}"}


@api.delete("/auth/avatar")
async def delete_avatar(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"avatar_path": None, "picture": ""}},
    )
    return {"ok": True}


@api.get("/avatar/{path:path}")
async def serve_avatar(path: str):
    try:
        data, content_type = storage_get(path)
        return Response(content=data, media_type=content_type)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")


@api.post("/auth/owner-unlock")
async def owner_unlock(request: Request, response: Response):
    body = await request.json()
    token = body.get("token", "")
    if not OWNER_ACCESS_TOKEN or token != OWNER_ACCESS_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid access token")

    owner = await db.users.find_one({"email": "owner@kateb.local"}, {"_id": 0})
    if owner:
        user_id = owner["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"is_premium": True, "premium_source": "owner"}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": "owner@kateb.local",
            "name": "Owner",
            "picture": "",
            "is_premium": True,
            "premium_source": "owner",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = f"owner_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=365)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=365 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": session_token}


@api.post("/auth/redeem-code")
async def redeem_discount_code(body: RedeemCodeRequest, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="سجّل الدخول أولاً لاستخدام كود الخصم")
    # Case-sensitive: must be EXACTLY uppercase as defined
    code = body.code  # do NOT normalize — uppercase only enforced
    if code not in DISCOUNT_CODES_SERVER:
        raise HTTPException(status_code=400, detail="كود الخصم غير صالح")
    discount = DISCOUNT_CODES_SERVER[code]
    update_doc = {"discount_code_used": code, "discount_applied_at": datetime.now(timezone.utc).isoformat()}
    if discount >= 1.0:
        update_doc["is_premium"] = True
        update_doc["premium_source"] = "discount"
    await db.users.update_one({"user_id": user.user_id}, {"$set": update_doc})
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    return {"ok": True, "discount": discount, "user": user_doc}


# ============== GOOGLE PLAY BILLING ==============
class GooglePlayVerifyRequest(BaseModel):
    purchase_token: str
    product_id: Optional[str] = None


def _subscription_doc(parsed: dict, purchase_token: str, product_id: Optional[str]) -> dict:
    exp = parsed["expiry_time"]
    return {
        "platform": "google_play",
        "product_id": parsed["product_id"] or product_id,
        "purchase_token": purchase_token,
        "state": parsed["state"],
        "expiry_time": exp.isoformat() if exp else None,
        "last_checked_at": datetime.now(timezone.utc).isoformat(),
    }


@api.post("/billing/google/verify")
async def google_billing_verify(body: GooglePlayVerifyRequest, user: User = Depends(require_user)):
    """Verify a Google Play purchase token after a subscription purchase and
    grant premium if the subscription is active."""
    if not google_play.is_configured():
        raise HTTPException(status_code=503, detail="Google Play billing is not configured on the server")
    try:
        raw = google_play.get_subscription_v2(body.purchase_token)
    except Exception as e:
        logging.warning(f"Google Play verify failed: {e}")
        raise HTTPException(status_code=502, detail="تعذّر التحقق من الاشتراك مع Google Play")

    parsed = google_play.parse_subscription_v2(raw)
    sub = _subscription_doc(parsed, body.purchase_token, body.product_id)

    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0}) or {}
    protected = user_doc.get("premium_source") in ("owner", "discount")

    update = {"subscription": sub}
    if parsed["is_premium"]:
        update["is_premium"] = True
        update["premium_source"] = "google_play"
        update["premium_expires_at"] = sub["expiry_time"]
        update["subscription_type"] = _infer_sub_type(sub["product_id"])
        update["subscription_cancelled"] = False
    elif not protected:
        update["is_premium"] = False
        update["premium_source"] = None

    await db.users.update_one({"user_id": user.user_id}, {"$set": update})
    # If the user was referred by someone, pay the referrer the premium bonus (once).
    if parsed["is_premium"]:
        try:
            await grant_referral_premium_bonus(user.user_id)
        except Exception as e:
            logging.warning(f"referral premium bonus failed: {e}")
    return {
        "is_premium": parsed["is_premium"],
        "state": parsed["state"],
        "product_id": sub["product_id"],
        "expiry_time": sub["expiry_time"],
        "subscription_type": update.get("subscription_type"),
    }


def _infer_sub_type(product_id: Optional[str]) -> Optional[str]:
    """Map a Google Play SKU to our internal monthly/yearly label."""
    if not product_id:
        return None
    pid = product_id.lower()
    if "year" in pid or "annual" in pid:
        return "yearly"
    if "month" in pid:
        return "monthly"
    return None


# ============== SUBSCRIPTION MANAGEMENT ==============
@api.post("/subscription/cancel")
async def cancel_subscription(user: User = Depends(require_user)):
    """Mark the user's subscription as cancelled.

    The user keeps premium features until `premium_expires_at`. Actual auto-renew
    cancellation happens in Google Play (we just record the intent so the UI can
    show "Cancelled — active until <date>").
    """
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0}) or {}
    if user_doc.get("premium_source") in ("owner", "discount"):
        raise HTTPException(status_code=400, detail="هذا الحساب مفعّل عبر كود — لا يحتاج إلى إلغاء.")
    if not user_doc.get("is_premium"):
        raise HTTPException(status_code=400, detail="لا يوجد اشتراك نشط لإلغائه.")
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"subscription_cancelled": True}},
    )
    return {
        "ok": True,
        "subscription_cancelled": True,
        "premium_expires_at": user_doc.get("premium_expires_at"),
        "message": "تم إلغاء التجديد التلقائي. ستبقى الميزات نشطة حتى تاريخ الانتهاء.",
    }


@api.get("/subscription/status")
async def subscription_status(user: User = Depends(require_user)):
    """Quick read of the user's subscription status (for the Premium page)."""
    doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0}) or {}
    return {
        "is_premium": bool(doc.get("is_premium")),
        "premium_source": doc.get("premium_source"),
        "premium_expires_at": doc.get("premium_expires_at"),
        "subscription_type": doc.get("subscription_type"),
        "subscription_cancelled": bool(doc.get("subscription_cancelled", False)),
    }


@api.get("/billing/google/status")
async def google_billing_status(user: User = Depends(require_user)):
    """Re-verify the stored Google Play subscription on every app open and revoke
    premium if it is no longer active. Owner/discount premium is never revoked."""
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0}) or {}
    premium_source = user_doc.get("premium_source")
    sub = user_doc.get("subscription")

    # Non-Google premium (owner / discount code) is never revoked by this check.
    if premium_source in ("owner", "discount"):
        return {"is_premium": bool(user_doc.get("is_premium")), "source": premium_source, "state": None, "expiry_time": None}

    token = sub.get("purchase_token") if sub else None
    if not token or not google_play.is_configured():
        return {
            "is_premium": bool(user_doc.get("is_premium", False)),
            "source": premium_source,
            "state": sub.get("state") if sub else None,
            "expiry_time": sub.get("expiry_time") if sub else None,
        }

    try:
        raw = google_play.get_subscription_v2(token)
    except Exception as e:
        logging.warning(f"Google Play status check failed: {e}")
        # Transient error — keep last known status, do not wrongly revoke.
        return {
            "is_premium": bool(user_doc.get("is_premium", False)),
            "source": premium_source,
            "state": sub.get("state"),
            "expiry_time": sub.get("expiry_time"),
        }

    parsed = google_play.parse_subscription_v2(raw)
    new_sub = _subscription_doc(parsed, token, sub.get("product_id"))
    update = {
        "subscription": new_sub,
        "is_premium": parsed["is_premium"],
        "premium_source": "google_play" if parsed["is_premium"] else None,
        "premium_expires_at": new_sub["expiry_time"],
    }
    if parsed["is_premium"]:
        update["subscription_type"] = _infer_sub_type(new_sub["product_id"])
        # If the user previously cancelled and Play now reports a new active period,
        # they've effectively re-subscribed — clear the cancelled flag.
        update["subscription_cancelled"] = False
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": update},
    )
    return {
        "is_premium": parsed["is_premium"],
        "source": "google_play" if parsed["is_premium"] else None,
        "state": parsed["state"],
        "expiry_time": new_sub["expiry_time"],
        "subscription_type": update.get("subscription_type"),
    }


# ============== AI HELPERS ==============
CONTENT_TYPE_DESC_AR = {
    "caption": "كابشن قصير وجذاب لمنشور على وسائل التواصل",
    "ad": "نص إعلاني قوي يحوّل المشاهد إلى عميل",
    "post": "بوست متوسط الطول للتفاعل",
    "bio": "سيرة شخصية مختصرة وجذابة (Bio)",
    "tweet": "تغريدة قصيرة جداً (أقل من 280 حرف)",
    "story": "نص قصة (Story) تفاعلية",
}
STYLE_DESC_AR = {
    "funny": "مضحك خفيف ظل",
    "professional": "احترافي رسمي",
    "emotional": "عاطفي يلمس القلب",
    "motivational": "تحفيزي يشعل الحماس",
    "casual": "عادي بسيط ومألوف",
}
DIALECT_DESC = {
    "fusha": "العربية الفصحى الحديثة",
    "gulf": "اللهجة الخليجية",
    "egyptian": "اللهجة المصرية",
    "levantine": "اللهجة الشامية (سوري/أردني/لبناني/فلسطيني)",
}


def build_system_prompt(language: str) -> str:
    if language == "en":
        return (
            "You are an expert English social media copywriter. "
            "Respond in fluent, natural English. "
            "Be creative, punchy and culturally relevant. Output ONLY the requested content, no preamble."
        )
    return (
        "أنت كاتب محتوى عربي محترف لوسائل التواصل الاجتماعي. "
        "اكتب بالعربي الفصيح أو اللهجة المطلوبة بدقة. "
        "كن مبدعاً وجذاباً وقوياً. اكتب المحتوى فقط دون مقدمات أو شرح."
    )


def detect_topic_language(text: str, fallback: str = "ar") -> str:
    """Auto-detect Arabic vs English from the user's topic text.

    Counts Arabic-script chars (U+0600..U+06FF) vs Latin alphabetic chars.
    Whichever wins decides the response language. Falls back to caller's
    explicit `language` parameter when the text is empty or has no letters
    (e.g. only digits/emojis/punctuation).
    """
    if not text:
        return fallback
    arabic = sum(1 for c in text if "\u0600" <= c <= "\u06FF")
    latin = sum(1 for c in text if c.isascii() and c.isalpha())
    if arabic == 0 and latin == 0:
        return fallback
    return "ar" if arabic >= latin else "en"


async def get_brand_voice_profile(user_id: Optional[str], brand_voice_id: Optional[str]) -> Optional[str]:
    """Return the style-profile text for a user's brand voice.

    If `brand_voice_id` is provided, fetch that one; otherwise fall back to the
    user's currently-active brand voice (if any). Returns None when nothing applies.
    """
    if not user_id:
        return None
    query = {"user_id": user_id}
    if brand_voice_id:
        query["voice_id"] = brand_voice_id
    else:
        query["is_active"] = True
    doc = await db.brand_voices.find_one(query, {"_id": 0, "profile": 1})
    return (doc or {}).get("profile") or None


def brand_voice_instruction(profile: Optional[str], language: str) -> str:
    """Build a prompt fragment that forces the LLM to mimic the brand voice."""
    if not profile:
        return ""
    if language == "en":
        return (
            "\n\nIMPORTANT — Write in the user's brand voice. Match this voice profile exactly "
            "(tone, vocabulary, rhythm, emoji habits, signature phrases):\n" + profile + "\n"
        )
    return (
        "\n\nمهم جداً — اكتب بنبرة صوت العلامة الخاصة بالمستخدم. التزم تماماً بهذا الوصف "
        "(النبرة، المفردات، الإيقاع، استخدام الإيموجي، العبارات المميزة):\n" + profile + "\n"
    )


async def log_history(user_id: Optional[str], kind: str, content: str, meta: dict):
    """Auto-record a generation into the user's history (best-effort, non-blocking)."""
    if not user_id or not content:
        return
    try:
        await db.history.insert_one({
            "hist_id": f"h_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "kind": kind,
            "content": content,
            **meta,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        # Keep history bounded: retain the most recent 100 entries per user.
        count = await db.history.count_documents({"user_id": user_id})
        if count > 100:
            old = (
                await db.history.find({"user_id": user_id}, {"_id": 1})
                .sort("created_at", 1)
                .to_list(count - 100)
            )
            ids = [o["_id"] for o in old]
            if ids:
                await db.history.delete_many({"_id": {"$in": ids}})
    except Exception as e:
        logging.warning(f"history log failed: {e}")


@api.post("/generate/content")
async def generate_content(req: GenerateRequest, request: Request):
    ctype = CONTENT_TYPE_DESC_AR.get(req.content_type, req.content_type)
    style = STYLE_DESC_AR.get(req.style, req.style)
    dialect = DIALECT_DESC.get(req.dialect, req.dialect)

    # Auto-detect: if the user's topic is in English, respond in English. If Arabic, respond in Arabic.
    effective_lang = detect_topic_language(req.topic, fallback=req.language)

    user = await get_current_user(request)
    voice_profile = await get_brand_voice_profile(user.user_id if user else None, req.brand_voice_id)
    voice_frag = brand_voice_instruction(voice_profile, effective_lang)

    if effective_lang == "en":
        user_prompt = (
            f"Write a {req.content_type}.\n"
            f"Topic: {req.topic}\n"
            f"Style: {req.style}\n"
            "Respond ONLY in English. Give one ready-to-post piece of text, no preamble, no explanation."
            + voice_frag
        )
    else:
        user_prompt = (
            f"اكتب {ctype}\n"
            f"الموضوع: {req.topic}\n"
            f"الأسلوب: {style}\n"
            f"اللهجة: {dialect}\n\n"
            "أعطني نص واحد فقط، جاهز للنشر، بدون مقدمات وبدون شرح. اكتب بالعربية فقط."
            + voice_frag
        )

    try:
        content = await llm_send(
            session_id=f"gen_{uuid.uuid4().hex[:8]}",
            system_message=build_system_prompt(effective_lang),
            user_text=user_prompt,
        )
        await log_history(
            user.user_id if user else None, "content", content,
            {"content_type": req.content_type, "style": req.style, "dialect": req.dialect, "topic": req.topic},
        )
        return {"content": content}
    except Exception as e:
        err = str(e)
        logging.exception("LLM error (all providers exhausted)")
        if "Budget" in err or "budget" in err:
            raise HTTPException(status_code=503, detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً (انتهى الرصيد).")
        raise HTTPException(status_code=500, detail="تعذّر توليد المحتوى الآن. حاول مرة أخرى.")


HOOK_TYPE_DESC = {
    "shocking": "هوكس صادمة تخلق صدمة فورية وتشد الانتباه",
    "question": "أسئلة مثيرة تجبر المشاهد على البحث عن الإجابة",
    "secret": "أسرار خفية وكشف معلومة لا يعرفها أحد",
    "challenge": "تحديات تستفز المشاهد ليجرب أو يثبت العكس",
    "opinion": "آراء جريئة ومثيرة للجدل تخلق نقاش",
    "story": "بدايات قصة تجعل المشاهد يريد المعرفة",
    "statistic": "إحصائيات صادمة وأرقام لا يصدّقها العقل",
    "contradiction": "مفارقات وتناقضات تكسر التوقع",
    "mixed": "خليط متنوّع من أنواع الهوكس الأقوى",
}


@api.post("/generate/hook")
async def generate_hook(req: HookRequest, request: Request):
    platform_names = {"instagram": "Instagram Reels", "tiktok": "TikTok", "shorts": "YouTube Shorts"}
    platform = platform_names.get(req.platform, req.platform)

    user = await get_current_user(request)
    count = 15 if user and user.is_premium else 5
    htype_desc = HOOK_TYPE_DESC.get(req.hook_type, HOOK_TYPE_DESC["mixed"])
    dialect_desc = DIALECT_DESC.get(req.dialect, DIALECT_DESC["fusha"])

    # Auto-detect output language from the topic the user typed.
    effective_lang = detect_topic_language(req.topic, fallback=req.language)

    voice_profile = await get_brand_voice_profile(user.user_id if user else None, req.brand_voice_id)
    voice_frag = brand_voice_instruction(voice_profile, effective_lang)

    if effective_lang == "en":
        user_prompt = (
            f"Write {count} highly engaging video hook ideas for a short-form video on {platform}.\n"
            f"Topic: {req.topic}\n"
            f"Hook style: {req.hook_type}\n\n"
            "Each hook must:\n"
            "- Be under 8 seconds spoken\n"
            "- Spark curiosity, shock, or a strong promise\n"
            "- Force the viewer to keep watching\n\n"
            f"Output ONLY a numbered list 1-{count}, one hook per line, in English, with no explanation."
            + voice_frag
        )
    else:
        user_prompt = (
            f"اكتب {count} أفكار هوك (Hook) جذابة جداً لفيديو قصير على {platform}.\n"
            f"الموضوع: {req.topic}\n"
            f"اللهجة المطلوبة: {dialect_desc}\n"
            f"نوع الهوك المطلوب: {htype_desc}\n\n"
            "كل هوك يجب أن:\n"
            "- يكون أقل من 8 ثوان نطقاً\n"
            "- يخلق فضول أو صدمة أو وعد قوي\n"
            "- يجبر المشاهد على الاستمرار\n"
            f"- يتبع النوع المحدد: {htype_desc}\n"
            f"- يُكتب باللهجة المطلوبة: {dialect_desc} (طبيعية وأصيلة، بدون كلمات مزيج من لهجات أخرى)\n\n"
            f"أعطني قائمة مرقمة 1-{count} فقط، كل سطر هوك مستقل، بدون شرح."
            + voice_frag
        )

    try:
        hooks_text = await llm_send(
            session_id=f"hook_{uuid.uuid4().hex[:8]}",
            system_message=build_system_prompt(effective_lang),
            user_text=user_prompt,
        )
        await log_history(
            user.user_id if user else None, "hook", hooks_text,
            {"content_type": "hook", "platform": req.platform, "dialect": req.dialect, "topic": req.topic},
        )
        return {"hooks": hooks_text, "count": count, "is_premium": bool(user and user.is_premium)}
    except Exception as e:
        err = str(e)
        logging.exception("hook LLM error (all providers exhausted)")
        if "Budget" in err or "budget" in err:
            raise HTTPException(status_code=503, detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً (انتهى الرصيد).")
        raise HTTPException(status_code=500, detail="تعذّر توليد الهوكس الآن. حاول مرة أخرى.")


@api.get("/match/usage")
async def match_usage(request: Request):
    """Return current match usage for the authenticated user."""
    user = await get_current_user(request)
    if not user:
        return {
            "authenticated": False, "is_premium": False, "used": 0,
            "limit": FREE_MATCH_ATTEMPTS, "remaining": FREE_MATCH_ATTEMPTS,
            "bonus": 0, "ads_watched_today": 0, "ads_daily_limit": ADS_DAILY_LIMIT,
            "ads_remaining_today": ADS_DAILY_LIMIT,
        }
    doc = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "match_usage_count": 1, "bonus_match_attempts": 1},
    ) or {}
    used = int(doc.get("match_usage_count", 0))
    bonus = int(doc.get("bonus_match_attempts", 0))
    ads_today = await _count_ads_today(user.user_id)
    if user.is_premium:
        return {
            "authenticated": True, "is_premium": True, "used": used,
            "limit": None, "remaining": None,
            "bonus": bonus, "ads_watched_today": ads_today,
            "ads_daily_limit": ADS_DAILY_LIMIT,
            "ads_remaining_today": max(0, ADS_DAILY_LIMIT - ads_today),
        }
    remaining = max(0, FREE_MATCH_ATTEMPTS - used) + bonus
    return {
        "authenticated": True,
        "is_premium": False,
        "used": used,
        "limit": FREE_MATCH_ATTEMPTS,
        "remaining": remaining,
        "bonus": bonus,
        "ads_watched_today": ads_today,
        "ads_daily_limit": ADS_DAILY_LIMIT,
        "ads_remaining_today": max(0, ADS_DAILY_LIMIT - ads_today),
    }


# Daily ad-watch limit for free match-trial top-ups.
ADS_DAILY_LIMIT = 10


async def _count_ads_today(user_id: str) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    return await db.ad_watches.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": cutoff.isoformat()},
    })


@api.post("/match/free-trial-claim")
async def match_free_trial_claim(request: Request):
    """User finished watching a (simulated) ad — grant +1 free match attempt.

    Max 10 successful claims per trailing 24 hours per user. Premium users do not
    need this, but the endpoint still works (no-op for them) so the client can
    safely call it without branching.
    """
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="سجّل الدخول أولاً")

    ads_today = await _count_ads_today(user.user_id)
    if ads_today >= ADS_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"تم استنفاد محاولاتك المجانية عبر الإعلانات ({ADS_DAILY_LIMIT}/{ADS_DAILY_LIMIT}). عُد غداً أو ترقّى إلى Premium.",
        )

    await db.ad_watches.insert_one({
        "ad_id": f"ad_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"bonus_match_attempts": 1}},
    )

    doc = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "match_usage_count": 1, "bonus_match_attempts": 1},
    ) or {}
    used = int(doc.get("match_usage_count", 0))
    bonus = int(doc.get("bonus_match_attempts", 0))
    ads_today += 1
    remaining = (max(0, FREE_MATCH_ATTEMPTS - used) + bonus) if not user.is_premium else None
    return {
        "ok": True,
        "bonus": bonus,
        "ads_watched_today": ads_today,
        "ads_daily_limit": ADS_DAILY_LIMIT,
        "ads_remaining_today": max(0, ADS_DAILY_LIMIT - ads_today),
        "remaining": remaining,
    }


@api.post("/generate/match")
async def match_content_with_secrets(req: MatchRequest, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="سجّل الدخول لاستخدام أداة الربط بالأسرار")

    # Track usage for non-premium users — 3 free attempts only.
    # Users can earn extra attempts by watching ads (`bonus_match_attempts`).
    used = 0
    bonus = 0
    if not user.is_premium:
        doc = await db.users.find_one(
            {"user_id": user.user_id},
            {"_id": 0, "match_usage_count": 1, "bonus_match_attempts": 1},
        ) or {}
        used = int(doc.get("match_usage_count", 0))
        bonus = int(doc.get("bonus_match_attempts", 0))
        if used >= FREE_MATCH_ATTEMPTS and bonus <= 0:
            raise HTTPException(
                status_code=403,
                detail=f"انتهت محاولاتك المجانية ({FREE_MATCH_ATTEMPTS}/{FREE_MATCH_ATTEMPTS}). شاهد إعلاناً لمحاولة مجانية، أو ترقّى إلى Premium.",
            )

    platform_names = {"instagram": "Instagram", "tiktok": "TikTok", "shorts": "YouTube Shorts"}
    platform = platform_names.get(req.platform, req.platform)

    # Auto-detect response language from the user's content text.
    effective_lang = detect_topic_language(req.content, fallback=req.language)
    is_arabic = effective_lang == "ar"

    # Build the secrets catalog block (when the frontend passed the 50 secrets)
    secrets_block = ""
    if req.secrets:
        lines = [f"#{s.number} - {s.title}" for s in req.secrets]
        secrets_block = "\n".join(lines)

    if is_arabic:
        system_msg = (
            "أنت خبير عالمي في خوارزميات وسائل التواصل الاجتماعي. "
            "أجوبتك دقيقة وعملية. تُخرج JSON صالحاً فقط، بدون أي نص قبل أو بعد، وبدون code fences."
        )
        if secrets_block:
            user_prompt = (
                f"محتوى المستخدم:\n{req.content}\n\n"
                f"المنصة: {platform}\n\n"
                "قائمة الأسرار الخمسين (اختر منها فقط بالرقم):\n"
                f"{secrets_block}\n\n"
                "اختر 5 أسرار تناسب هذا المحتوى تحديداً، ثم أعطني JSON فقط بهذا الشكل:\n"
                '{\n'
                '  "matched_secrets": [\n'
                '    {"number": <رقم من القائمة>, "how": "<خطوة عملية واحدة-جملتين باللهجة العربية الفصحى>"}\n'
                '  ],\n'
                '  "opening": "<السكريبت الكامل لأول 3 ثوان مع وصف الـ visual hook>",\n'
                '  "best_time": "<أفضل وقت نشر بصياغة موجزة>",\n'
                '  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]\n'
                "}\n\n"
                "قواعد إلزامية:\n"
                "- استخدم أرقاماً من القائمة فقط (1-50).\n"
                "- اكتب \"how\" بنص عادي بدون markdown ولا ** ولا --.\n"
                "- اكتب باللغة العربية.\n"
                "- JSON صالح فقط، بدون مقدّمة ولا code block."
            )
        else:
            user_prompt = (
                f"محتوى المستخدم:\n{req.content}\n\n"
                f"المنصة: {platform}\n\n"
                "أعطني JSON فقط بهذا الشكل (بدون markdown ولا code fences):\n"
                '{\n'
                '  "matched_secrets": [{"title": "<اسم السر>", "how": "<شرح عملي قصير>"} x5],\n'
                '  "opening": "<أول 3 ثوان مع الـ visual hook>",\n'
                '  "best_time": "<وقت النشر الأمثل>",\n'
                '  "hashtags": ["#a","#b","#c","#d","#e"]\n'
                "}"
            )
    else:
        system_msg = (
            "You are a world-class expert in social media algorithms. "
            "Your replies are precise and actionable. Output VALID JSON only — no prose, no code fences."
        )
        if secrets_block:
            user_prompt = (
                f"User's content:\n{req.content}\n\n"
                f"Platform: {platform}\n\n"
                "Vault of 50 secrets (pick ONLY by their number):\n"
                f"{secrets_block}\n\n"
                "Pick 5 that fit this content best. Reply with JSON only:\n"
                '{\n'
                '  "matched_secrets": [\n'
                '    {"number": <id from the list above>, "how": "<one short actionable sentence>"}\n'
                '  ],\n'
                '  "opening": "<the full first-3-seconds script + visual hook>",\n'
                '  "best_time": "<concise best posting time>",\n'
                '  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5"]\n'
                "}\n\n"
                "Rules:\n"
                "- numbers must be from the list (1-50).\n"
                "- 'how' must be plain text — no markdown, **, --, ##.\n"
                "- English only.\n"
                "- VALID JSON only — no preface, no code block."
            )
        else:
            user_prompt = (
                f"User's content:\n{req.content}\n\n"
                f"Platform: {platform}\n\n"
                "Reply with JSON only:\n"
                '{\n'
                '  "matched_secrets": [{"title": "<secret name>", "how": "<short actionable advice>"} x5],\n'
                '  "opening": "<first 3 seconds script + visual hook>",\n'
                '  "best_time": "<best posting time>",\n'
                '  "hashtags": ["#a","#b","#c","#d","#e"]\n'
                "}"
            )

    try:
        raw_text = await llm_send(
            session_id=f"match_{uuid.uuid4().hex[:8]}",
            system_message=system_msg,
            user_text=user_prompt,
        )
    except Exception as e:
        err = str(e)
        logging.exception("matcher LLM error (all providers exhausted)")
        if "Budget" in err or "budget" in err:
            raise HTTPException(status_code=503, detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً (انتهى الرصيد). يرجى المحاولة لاحقاً أو التواصل مع الدعم.")
        raise HTTPException(status_code=500, detail="تعذّر توليد التحليل الآن. حاول مرة أخرى.")

    # Robust JSON parse: tolerate stray code-fences / preface text
    analysis_data = _parse_match_json(raw_text)

    remaining = None
    if not user.is_premium:
        # Consume bonus first, then base usage.
        if bonus > 0:
            await db.users.update_one(
                {"user_id": user.user_id, "bonus_match_attempts": {"$gte": 1}},
                {"$inc": {"bonus_match_attempts": -1}},
            )
            bonus -= 1
        else:
            await db.users.update_one(
                {"user_id": user.user_id},
                {"$inc": {"match_usage_count": 1}},
            )
            used += 1
        remaining = max(0, FREE_MATCH_ATTEMPTS - used) + bonus

    return {
        # Structured output for the rich-renderer in the UI.
        "analysis_data": analysis_data,
        # Plain text fallback (raw LLM response stripped of markdown noise) — kept for
        # backwards compatibility with mobile + legacy renderers.
        "analysis": _strip_markdown(raw_text),
        "is_premium": user.is_premium,
        "used": used,
        "bonus": bonus if not user.is_premium else 0,
        "limit": None if user.is_premium else FREE_MATCH_ATTEMPTS,
        "remaining": remaining,
    }


def _parse_match_json(text: str) -> Optional[Dict]:
    """Best-effort JSON extraction from an LLM response."""
    if not text:
        return None
    # Try direct parse first
    try:
        return json.loads(text)
    except Exception:
        pass
    # Strip common code-fence wrappers
    cleaned = text.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```", 2)
        cleaned = parts[1] if len(parts) > 1 else ""
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip("` \n")
    # Extract the first balanced JSON object
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except Exception:
            return None
    return None


def _strip_markdown(text: str) -> str:
    """Lightweight markdown cleanup: kept readable for the legacy plain-text renderer."""
    if not text:
        return text
    out = text
    # If the LLM returned pure JSON, render it as a readable bullet list
    parsed = _parse_match_json(out)
    if isinstance(parsed, dict):
        lines: List[str] = []
        for s in parsed.get("matched_secrets") or []:
            num = s.get("number")
            title = s.get("title") or ""
            how = s.get("how") or ""
            head = f"#{num}" if num is not None else (title or "•")
            if title and num is not None:
                head = f"#{num} — {title}"
            lines.append(f"{head}: {how}".strip())
        if parsed.get("opening"):
            lines.append("")
            lines.append("الافتتاحية: " + parsed["opening"])
        if parsed.get("best_time"):
            lines.append("أفضل وقت: " + parsed["best_time"])
        if parsed.get("hashtags"):
            lines.append("هاشتاقات: " + " ".join(parsed["hashtags"]))
        return "\n".join(lines).strip()
    # Otherwise scrub markdown noise from raw text
    out = re.sub(r"^#+\s*", "", out, flags=re.MULTILINE)
    out = re.sub(r"\*\*(.+?)\*\*", r"\1", out)
    out = re.sub(r"\*(.+?)\*", r"\1", out)
    out = re.sub(r"^[-*]\s+", "• ", out, flags=re.MULTILINE)
    out = re.sub(r"^—{2,}\s*", "", out, flags=re.MULTILINE)
    return out.strip()


# ============== STRIPE PAYMENTS ==============
PRICING = {
    "monthly": {"amount": 5.00, "currency": "usd", "label": "Premium Monthly"},
    "yearly": {"amount": 30.00, "currency": "usd", "label": "Premium Yearly"},
}


@api.post("/payments/checkout")
async def create_checkout(body: CheckoutRequest, http_request: Request):
    if body.plan not in PRICING:
        raise HTTPException(status_code=400, detail="Invalid plan")
    pkg = PRICING[body.plan]

    user = await get_current_user(http_request)
    user_email = user.email if user else None
    user_id = user.user_id if user else None

    stripe.api_key = STRIPE_API_KEY
    success_url = f"{body.origin_url}/premium/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{body.origin_url}/premium"
    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": pkg["currency"],
                "product_data": {"name": pkg["label"]},
                "unit_amount": int(round(pkg["amount"] * 100)),
            },
            "quantity": 1,
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "plan": body.plan,
            "user_email": user_email or "guest",
            "user_id": user_id or "guest",
        },
    )

    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": user_id,
        "user_email": user_email,
        "plan": body.plan,
        "amount": pkg["amount"],
        "currency": pkg["currency"],
        "payment_status": "initiated",
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id}


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, http_request: Request):
    stripe.api_key = STRIPE_API_KEY
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if txn.get("payment_status") == "paid":
        return {"payment_status": "paid", "status": "complete"}

    # Initialize defensively so static analyzers don't flag a "potentially-unbound" warning
    # on line below — every code path either assigns `status` in the try or returns early.
    status = None
    try:
        status = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        logging.warning(f"Stripe status retrieval failed: {e}")
        return {"payment_status": "pending", "status": "open"}

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"status": status.get("status"), "payment_status": status.get("payment_status")}},
    )

    if status.get("payment_status") == "paid" and txn.get("payment_status") != "paid":
        user_id = txn.get("user_id")
        if user_id and user_id != "guest":
            await db.users.update_one({"user_id": user_id}, {"$set": {"is_premium": True}})

    return {"payment_status": status.payment_status, "status": status.status}

# ============== SAVED GENERATIONS ==============
class SaveGenerationRequest(BaseModel):
    content: str
    content_type: str
    style: Optional[str] = None
    dialect: Optional[str] = None
    topic: Optional[str] = None
    kind: str = "content"  # content, hook, match


@api.post("/generations")
async def save_generation(body: SaveGenerationRequest, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    doc = {
        "gen_id": f"gen_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "content": body.content,
        "content_type": body.content_type,
        "style": body.style,
        "dialect": body.dialect,
        "topic": body.topic,
        "kind": body.kind,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.generations.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/generations")
async def list_generations(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    items = (
        await db.generations.find({"user_id": user.user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(100)
    )
    return items


@api.delete("/generations/{gen_id}")
async def delete_generation(gen_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    await db.generations.delete_one({"gen_id": gen_id, "user_id": user.user_id})
    return {"ok": True}


# ============== GENERATION HISTORY (auto-logged) ==============
@api.get("/history")
async def list_history(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    items = (
        await db.history.find({"user_id": user.user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(100)
    )
    return items


@api.delete("/history/{hist_id}")
async def delete_history_item(hist_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    await db.history.delete_one({"hist_id": hist_id, "user_id": user.user_id})
    return {"ok": True}


@api.delete("/history")
async def clear_history(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    res = await db.history.delete_many({"user_id": user.user_id})
    return {"ok": True, "deleted": res.deleted_count}


# ============== FAVORITE TEMPLATES ==============
@api.post("/templates")
async def create_template(body: TemplateRequest, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="اسم القالب مطلوب")
    doc = {
        "template_id": f"tpl_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "name": name,
        "kind": body.kind,
        "content_type": body.content_type,
        "style": body.style,
        "dialect": body.dialect,
        "platform": body.platform,
        "hook_type": body.hook_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.templates.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/templates")
async def list_templates(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    items = (
        await db.templates.find({"user_id": user.user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(100)
    )
    return items


@api.delete("/templates/{template_id}")
async def delete_template(template_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    await db.templates.delete_one({"template_id": template_id, "user_id": user.user_id})
    return {"ok": True}


# ============== BRAND VOICE ==============
async def extract_voice_profile(samples: str) -> str:
    """Use the LLM to distil a concise reusable style profile from the user's past posts."""
    lang = detect_topic_language(samples, fallback="ar")
    if lang == "en":
        system_msg = (
            "You are a brand-voice analyst. Read the writing samples and produce a concise, "
            "reusable STYLE PROFILE that another writer could follow to imitate this voice. "
            "Cover: tone, formality, vocabulary, sentence length/rhythm, emoji & punctuation habits, "
            "and any signature phrases. Output the profile only — no preamble. Keep it under 180 words."
        )
        prompt = f"Writing samples:\n\n{samples}\n\nWrite the style profile now."
    else:
        system_msg = (
            "أنت محلّل نبرة صوت العلامة. اقرأ العينات الكتابية وأخرج وصفاً موجزاً وقابلاً لإعادة الاستخدام "
            "لـ (نبرة الصوت) بحيث يستطيع كاتب آخر تقليد هذا الأسلوب. غطِّ: النبرة، الرسمية، المفردات، "
            "طول الجمل وإيقاعها، استخدام الإيموجي وعلامات الترقيم، والعبارات المميزة. "
            "أخرج الوصف فقط بدون مقدمات. أقل من 180 كلمة."
        )
        prompt = f"العينات الكتابية:\n\n{samples}\n\nاكتب وصف نبرة الصوت الآن."
    return await llm_send(
        session_id=f"voice_{uuid.uuid4().hex[:8]}",
        system_message=system_msg,
        user_text=prompt,
    )


@api.post("/brand-voice")
async def create_brand_voice(body: BrandVoiceRequest, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    name = body.name.strip()
    samples = body.samples.strip()
    if not name:
        raise HTTPException(status_code=400, detail="اسم نبرة الصوت مطلوب")
    if len(samples) < 40:
        raise HTTPException(status_code=400, detail="الصق منشورات سابقة كافية (40 حرفاً على الأقل) ليتعلّم منها الأسلوب")
    try:
        profile = await extract_voice_profile(samples)
    except Exception as e:
        err = str(e)
        logging.exception("brand voice extraction error")
        if "Budget" in err or "budget" in err:
            raise HTTPException(status_code=503, detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً (انتهى الرصيد).")
        raise HTTPException(status_code=500, detail="تعذّر تحليل الأسلوب الآن. حاول مرة أخرى.")

    # First brand voice becomes active automatically.
    existing_count = await db.brand_voices.count_documents({"user_id": user.user_id})
    is_active = existing_count == 0
    doc = {
        "voice_id": f"bv_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "name": name,
        "samples": samples,
        "profile": profile,
        "is_active": is_active,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.brand_voices.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/brand-voice")
async def list_brand_voices(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    items = (
        await db.brand_voices.find({"user_id": user.user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(50)
    )
    return items


@api.post("/brand-voice/{voice_id}/activate")
async def activate_brand_voice(voice_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    target = await db.brand_voices.find_one({"voice_id": voice_id, "user_id": user.user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="نبرة الصوت غير موجودة")
    await db.brand_voices.update_many({"user_id": user.user_id}, {"$set": {"is_active": False}})
    await db.brand_voices.update_one(
        {"voice_id": voice_id, "user_id": user.user_id}, {"$set": {"is_active": True}}
    )
    return {"ok": True, "active_voice_id": voice_id}


@api.post("/brand-voice/deactivate")
async def deactivate_brand_voice(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    await db.brand_voices.update_many({"user_id": user.user_id}, {"$set": {"is_active": False}})
    return {"ok": True}


@api.delete("/brand-voice/{voice_id}")
async def delete_brand_voice(voice_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    was_active = await db.brand_voices.find_one(
        {"voice_id": voice_id, "user_id": user.user_id}, {"_id": 0, "is_active": 1}
    )
    await db.brand_voices.delete_one({"voice_id": voice_id, "user_id": user.user_id})
    # If we deleted the active voice, promote the most recent remaining one.
    if was_active and was_active.get("is_active"):
        nxt = await db.brand_voices.find({"user_id": user.user_id}, {"_id": 0, "voice_id": 1}).sort("created_at", -1).to_list(1)
        if nxt:
            await db.brand_voices.update_one(
                {"voice_id": nxt[0]["voice_id"], "user_id": user.user_id}, {"$set": {"is_active": True}}
            )
    return {"ok": True}


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        if not STRIPE_WEBHOOK_SECRET:
            raise RuntimeError("STRIPE_WEBHOOK_SECRET is not configured")
        evt = stripe.Webhook.construct_event(body, sig, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        logging.exception("webhook error")
        return Response(content=json.dumps({"ok": False, "error": str(e)}), status_code=400, media_type="application/json")

    if evt["type"] == "checkout.session.completed":
        session_obj = evt["data"]["object"]
        if session_obj.get("payment_status") == "paid":
            session_id = session_obj.get("id")
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "status": "complete"}},
            )
            user_id = (session_obj.get("metadata") or {}).get("user_id")
        if user_id and user_id != "guest":
            await db.users.update_one({"user_id": user_id}, {"$set": {"is_premium": True}})
    return {"ok": True}


@api.get("/")
async def root():
    return {"status": "ok", "service": "Arabic AI Content Tool"}


# ============== CREDITS SYSTEM ==============
DEFAULT_CREDITS = 20
CHAT_COST = 1  # credits deducted per Kateb-AI chat message for non-premium users
REFERRAL_PREFIX = "KTB-"
REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous chars (0/O, 1/I)


async def generate_referral_code() -> str:
    """Generate a unique referral code in the format KTB-XXXX (4 uppercase alphanumeric chars).

    Uses the cryptographically-secure `secrets` module so codes can't be
    predicted by sequential guessing.
    """
    for _ in range(20):
        code = REFERRAL_PREFIX + "".join(secrets.choice(REFERRAL_ALPHABET) for _ in range(4))
        if not await db.users.find_one({"referral_code": code}, {"_id": 1}):
            return code
    # Fallback: extend length if 4 chars exhausted (extremely unlikely)
    return REFERRAL_PREFIX + "".join(secrets.choice(REFERRAL_ALPHABET) for _ in range(6))


async def get_user_credits(user_id: str) -> int:
    """Return the user's current credit balance. Auto-initialize legacy users to DEFAULT_CREDITS."""
    doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "credits": 1})
    if doc and isinstance(doc.get("credits"), (int, float)):
        return int(doc["credits"])
    await db.users.update_one({"user_id": user_id}, {"$set": {"credits": DEFAULT_CREDITS}})
    return DEFAULT_CREDITS


async def deduct_credits(user_id: str, amount: int) -> Optional[int]:
    """Atomically deduct `amount` credits. Returns new balance or None if insufficient."""
    res = await db.users.find_one_and_update(
        {"user_id": user_id, "credits": {"$gte": amount}},
        {"$inc": {"credits": -amount}},
        projection={"_id": 0, "credits": 1},
        return_document=True,
    )
    return res["credits"] if res else None


@api.get("/credits/balance")
async def credits_balance(user: User = Depends(require_user)):
    bal = await get_user_credits(user.user_id)
    return {
        "credits": bal,
        "is_premium": user.is_premium,
        "unlimited": user.is_premium,
    }


# ============== BUY CREDITS (Google Play one-time products) ==============
# Each SKU maps to a credit grant. Custom amounts are handled via "kateb_credits_custom_*"
# SKUs created dynamically in the Play Console for each tier the user can slide to.
CREDIT_PACKS: Dict[str, int] = {
    # Fixed-price packages (credits granted — pricing is $0.10/credit)
    "kateb_credits_20": 20,      # $2   → 20 credits
    "kateb_credits_50": 50,      # $5   → 50 credits
    "kateb_credits_100": 100,    # $10  → 100 credits
    "kateb_credits_200": 200,    # $20  → 200 credits
}


def _credits_for_product(product_id: str) -> Optional[int]:
    """Return the credit grant for a Google Play product id (fixed pack or custom)."""
    if product_id in CREDIT_PACKS:
        return CREDIT_PACKS[product_id]
    # Custom SKUs encode the credit amount, e.g. "kateb_credits_custom_750"
    m = re.match(r"^kateb_credits_custom_(\d{2,6})$", product_id)
    if m:
        amount = int(m.group(1))
        if 20 <= amount <= 100000:
            return amount
    return None


class CreditsPurchaseVerifyRequest(BaseModel):
    purchase_token: str
    product_id: str


@api.post("/credits/verify-purchase")
async def credits_verify_purchase(
    body: CreditsPurchaseVerifyRequest,
    user: User = Depends(require_user),
):
    """Verify a Google Play one-time product purchase, then credit the user.

    Each `purchase_token` is single-use: we record it in `db.credits_purchases`
    with a unique index so a replayed call cannot double-credit the account.
    """
    grant = _credits_for_product(body.product_id)
    if grant is None:
        raise HTTPException(status_code=400, detail="منتج Credits غير معروف")
    if not google_play.is_configured():
        raise HTTPException(status_code=503, detail="Google Play غير مهيّأ على الخادم")

    # Idempotency: refuse to credit twice for the same purchase token.
    existing = await db.credits_purchases.find_one({"purchase_token": body.purchase_token})
    if existing:
        return {
            "ok": True,
            "already_credited": True,
            "credits_added": int(existing.get("credits_added", 0)),
            "balance": await get_user_credits(user.user_id),
        }

    try:
        raw = google_play.get_product_purchase(body.product_id, body.purchase_token)
    except Exception as e:
        logging.warning(f"Google Play product verify failed: {e}")
        raise HTTPException(status_code=502, detail="تعذّر التحقق من عملية الشراء مع Google Play")

    # purchaseState: 0=Purchased, 1=Cancelled, 2=Pending
    if int(raw.get("purchaseState", 1)) != 0:
        raise HTTPException(status_code=400, detail="حالة الشراء غير صالحة (لم يتم الدفع).")

    # Acknowledge the purchase so Google doesn't auto-refund after 3 days.
    if int(raw.get("acknowledgementState", 0)) == 0:
        try:
            google_play.acknowledge_product_purchase(body.product_id, body.purchase_token)
        except Exception as e:
            logging.warning(f"Acknowledge failed (non-fatal): {e}")

    # Atomically grant credits + record the purchase. Unique index on
    # `purchase_token` is created at startup so a race-condition replay 409s out.
    try:
        await db.credits_purchases.insert_one({
            "purchase_id": f"cp_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "product_id": body.product_id,
            "purchase_token": body.purchase_token,
            "credits_added": grant,
            "order_id": raw.get("orderId"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        # Duplicate key — another concurrent request already credited.
        return {
            "ok": True,
            "already_credited": True,
            "credits_added": grant,
            "balance": await get_user_credits(user.user_id),
        }

    res = await db.users.find_one_and_update(
        {"user_id": user.user_id},
        {"$inc": {"credits": grant}},
        projection={"_id": 0, "credits": 1},
        return_document=True,
    )
    return {
        "ok": True,
        "credits_added": grant,
        "balance": int(res["credits"]) if res else grant,
    }


@api.get("/credits/packages")
async def credits_packages():
    """Public catalogue of fixed credit packs for the /credits page."""
    return {
        "fixed": [
            {"product_id": "kateb_credits_20",  "credits": 20,  "price_usd": 2},
            {"product_id": "kateb_credits_50",  "credits": 50,  "price_usd": 5},
            {"product_id": "kateb_credits_100", "credits": 100, "price_usd": 10},
            {"product_id": "kateb_credits_200", "credits": 200, "price_usd": 20},
        ],
        "custom": {
            "min_credits": 20,
            "max_credits": 100000,
            "sku_prefix": "kateb_credits_custom_",
        },
    }


# ============== REFERRAL SYSTEM ==============
REFERRAL_SIGNUP_BONUS = 10   # credits granted to the referrer when a new user signs up with their code
REFERRAL_PREMIUM_BONUS = 100  # extra credits when the referred user buys premium


class ReferralApplyRequest(BaseModel):
    code: str


def _normalize_referral_code(code: str) -> str:
    return (code or "").strip().upper()


async def _grant_referral_signup(referrer_id: str, referred_id: str, code: str) -> None:
    """Insert a signup-reward record (idempotent) and credit the referrer."""
    try:
        await db.referral_rewards.insert_one({
            "reward_id": f"rr_{uuid.uuid4().hex[:12]}",
            "referrer_id": referrer_id,
            "referred_id": referred_id,
            "code": code,
            "kind": "signup",
            "credits": REFERRAL_SIGNUP_BONUS,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.users.update_one(
            {"user_id": referrer_id},
            {"$inc": {"credits": REFERRAL_SIGNUP_BONUS}},
        )
    except Exception as e:
        logging.warning(f"referral signup reward failed: {e}")


async def grant_referral_premium_bonus(user_id: str) -> None:
    """Called when a referred user buys premium — pay the referrer the premium bonus once."""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "referred_by": 1}) or {}
    referrer_id = user_doc.get("referred_by")
    if not referrer_id:
        return
    # Idempotent: skip if already rewarded for this user.
    already = await db.referral_rewards.find_one({"referred_id": user_id, "kind": "premium"})
    if already:
        return
    await db.referral_rewards.insert_one({
        "reward_id": f"rr_{uuid.uuid4().hex[:12]}",
        "referrer_id": referrer_id,
        "referred_id": user_id,
        "kind": "premium",
        "credits": REFERRAL_PREMIUM_BONUS,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.users.update_one(
        {"user_id": referrer_id},
        {"$inc": {"credits": REFERRAL_PREMIUM_BONUS}},
    )


@api.get("/referral/info")
async def referral_info(user: User = Depends(require_user)):
    """Return the user's referral code + stats."""
    doc = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "referral_code": 1, "referred_by": 1},
    ) or {}
    code = doc.get("referral_code")
    # Ensure legacy user has one (defensive — startup backfills, but just in case).
    if not code:
        code = await generate_referral_code()
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"referral_code": code}})
    signups = await db.referral_rewards.count_documents({"referrer_id": user.user_id, "kind": "signup"})
    premium_count = await db.referral_rewards.count_documents({"referrer_id": user.user_id, "kind": "premium"})
    total_credits = signups * REFERRAL_SIGNUP_BONUS + premium_count * REFERRAL_PREMIUM_BONUS
    history = (
        await db.referral_rewards.find({"referrer_id": user.user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(50)
    )
    return {
        "referral_code": code,
        "referred_by": doc.get("referred_by"),
        "signup_bonus": REFERRAL_SIGNUP_BONUS,
        "premium_bonus": REFERRAL_PREMIUM_BONUS,
        "stats": {
            "signups": signups,
            "premium_conversions": premium_count,
            "total_credits_earned": total_credits,
        },
        "history": history,
    }


@api.post("/referral/apply")
async def referral_apply(body: ReferralApplyRequest, user: User = Depends(require_user)):
    """Apply a referral code to the current user (only valid once, only for new users)."""
    code = _normalize_referral_code(body.code)
    if not code.startswith(REFERRAL_PREFIX):
        raise HTTPException(status_code=400, detail="كود الإحالة غير صالح")

    me = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "referral_code": 1, "referred_by": 1}) or {}
    if me.get("referred_by"):
        raise HTTPException(status_code=400, detail="تم تطبيق كود إحالة مسبقاً على هذا الحساب.")
    if me.get("referral_code") == code:
        raise HTTPException(status_code=400, detail="لا يمكنك استخدام كود الإحالة الخاص بك.")

    referrer = await db.users.find_one({"referral_code": code}, {"_id": 0, "user_id": 1})
    if not referrer:
        raise HTTPException(status_code=404, detail="كود الإحالة غير موجود")
    referrer_id = referrer["user_id"]
    if referrer_id == user.user_id:
        raise HTTPException(status_code=400, detail="لا يمكنك استخدام كود الإحالة الخاص بك.")

    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"referred_by": referrer_id}},
    )
    await _grant_referral_signup(referrer_id, user.user_id, code)
    return {
        "ok": True,
        "referrer_id": referrer_id,
        "signup_bonus_granted": REFERRAL_SIGNUP_BONUS,
        "premium_bonus_pending": REFERRAL_PREMIUM_BONUS,
    }


# ============== CHAT AI (كاتب 🤖) ==============
class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    account_context: Optional[Dict] = None  # selected social account info


KATEB_AI_SYSTEM_AR = (
    "أنت 'كاتب 🤖' — مساعد ذكاء اصطناعي متخصص في ذكاء وسائل التواصل الاجتماعي "
    "(Instagram, TikTok, YouTube Shorts). مهمتك مساعدة صانعي المحتوى العرب على فهم "
    "خوارزميات النشر، تحسين الوصول، اقتراح أفكار محتوى، تحليل اتجاهات المنصات، "
    "وكتابة هوكس وكابشنات قوية. أجوبتك عملية، مختصرة، وقابلة للتنفيذ. "
    "اكتب بالعربية الفصحى افتراضياً، وإذا كتب المستخدم بالإنجليزية فردّ بالإنجليزية. "
    "تجنب الإجابات العامة — قدّم خطوات محددة وأرقاماً وأمثلة. "
    "لا تجب على أي شيء خارج نطاق صناعة المحتوى ووسائل التواصل."
)


@api.post("/chat/message")
async def chat_message(body: ChatMessageRequest, user: User = Depends(require_user)):
    msg = (body.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="الرسالة فارغة")
    if len(msg) > 4000:
        raise HTTPException(status_code=400, detail="الرسالة طويلة جداً (الحد 4000 حرف)")

    # Check credits BEFORE calling the LLM (non-premium users)
    if not user.is_premium:
        balance = await get_user_credits(user.user_id)
        if balance < CHAT_COST:
            raise HTTPException(
                status_code=402,
                detail="انتهى رصيدك. ترقّى إلى Premium للحصول على رسائل غير محدودة.",
            )

    session_id = body.session_id or f"chat_{uuid.uuid4().hex[:12]}"

    # Build optional account context block so Kateb knows which account it's advising on
    ctx_block = ""
    if body.account_context:
        ac = body.account_context
        ctx_block = (
            "\n\n--- سياق الحساب المختار ---\n"
            f"المنصة: {ac.get('platform', '—')}\n"
            f"اسم الحساب: @{ac.get('username', '—')}\n"
            f"المتابعون: {ac.get('followers_count', '—')}\n"
            f"عدد المنشورات: {ac.get('media_count', '—')}"
        )

    try:
        reply = await llm_send(
            session_id=session_id,
            system_message=KATEB_AI_SYSTEM_AR,
            user_text=msg + ctx_block,
        )
    except Exception as e:
        err = str(e)
        logging.exception("kateb chat LLM error")
        if "Budget" in err or "budget" in err:
            raise HTTPException(status_code=503, detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً (انتهى الرصيد).")
        raise HTTPException(status_code=500, detail="تعذّر الرد الآن. حاول مرة أخرى.")

    # Deduct after a successful response
    new_balance = None
    if not user.is_premium:
        new_balance = await deduct_credits(user.user_id, CHAT_COST)

    # Persist both turns
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_many([
        {
            "msg_id": f"msg_{uuid.uuid4().hex[:12]}",
            "session_id": session_id,
            "user_id": user.user_id,
            "role": "user",
            "content": msg,
            "created_at": now,
        },
        {
            "msg_id": f"msg_{uuid.uuid4().hex[:12]}",
            "session_id": session_id,
            "user_id": user.user_id,
            "role": "assistant",
            "content": reply,
            "created_at": now,
        },
    ])

    return {
        "session_id": session_id,
        "reply": reply,
        "credits": new_balance,
        "is_premium": user.is_premium,
    }


@api.get("/chat/history")
async def chat_history(session_id: Optional[str] = None, user: User = Depends(require_user)):
    query: Dict = {"user_id": user.user_id}
    if session_id:
        query["session_id"] = session_id
    items = (
        await db.chat_messages.find(query, {"_id": 0})
        .sort("created_at", 1)
        .to_list(500)
    )
    return items


@api.get("/chat/sessions")
async def chat_sessions(user: User = Depends(require_user)):
    pipeline = [
        {"$match": {"user_id": user.user_id}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$first": "$content"},
            "last_at": {"$first": "$created_at"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"last_at": -1}},
        {"$limit": 50},
    ]
    out = []
    async for doc in db.chat_messages.aggregate(pipeline):
        out.append({
            "session_id": doc["_id"],
            "last_message": (doc["last_message"] or "")[:120],
            "last_at": doc["last_at"],
            "count": doc["count"],
        })
    return out


@api.delete("/chat/sessions/{session_id}")
async def chat_session_delete(session_id: str, user: User = Depends(require_user)):
    await db.chat_messages.delete_many({"user_id": user.user_id, "session_id": session_id})
    return {"ok": True}


# ============== VIRALITY CHECK ==============
def extract_video_frames(video_path: str, num_frames: int = 5, max_dim: int = 512) -> List[bytes]:
    """Open the video, extract `num_frames` evenly-spaced frames, resize and JPEG-encode them.

    Returns a list of JPEG byte-strings. Raises ValueError on unreadable/empty videos.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("تعذر فتح ملف الفيديو — تأكد من صيغة الفيديو")
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        cap.release()
        raise ValueError("الفيديو لا يحتوي على إطارات قابلة للقراءة")

    indices = [max(0, int(total * i / (num_frames + 1))) for i in range(1, num_frames + 1)]
    frames: List[bytes] = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ok, frame = cap.read()
        if not ok or frame is None:
            continue
        h, w = frame.shape[:2]
        scale = max_dim / max(h, w)
        if scale < 1:
            frame = cv2.resize(frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        ok2, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 82])
        if ok2:
            frames.append(buf.tobytes())
    cap.release()
    if not frames:
        raise ValueError("تعذر استخراج أي إطارات من الفيديو")
    return frames


VIRALITY_SYSTEM_PROMPT = (
    "أنت خبير عالمي في تحليل الفيديوهات القصيرة (Reels / TikTok / YouTube Shorts). "
    "ستتلقّى 5 إطارات (Frames) متسلسلة زمنياً من فيديو قصير. حلّلها معاً (لا منفصلة) "
    "وقيّم احتمالية انتشار الفيديو. أخرج JSON صالحاً فقط بدون أي نص آخر، بدون markdown، "
    "بدون code fences. التقييم على 5 محاور (كل محور 0-100): "
    "Hook (قوة أول إطار/افتتاحية)، Pace (إيقاع التقطيع بين الإطارات)، "
    "Trend (مدى ملاءمة الترند الحالي)، Emotion (شدة العاطفة)، "
    "Retention (احتمالية بقاء المشاهد حتى النهاية)."
)


@api.post("/virality/analyze")
async def virality_analyze(file: UploadFile = File(...), user: User = Depends(require_user)):
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="يجب رفع ملف فيديو فقط")

    tmp_path: Optional[str] = None
    try:
        data = await file.read()
        if len(data) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="حجم الفيديو أكبر من 100MB")
        if len(data) < 1024:
            raise HTTPException(status_code=400, detail="الملف فارغ أو تالف")
        # Persist temporarily so OpenCV/FFmpeg can seek through frames
        ext = ".mp4"
        if file.filename and "." in file.filename:
            cand = "." + file.filename.rsplit(".", 1)[-1].lower()
            if cand in {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}:
                ext = cand
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        try:
            frames_jpeg = extract_video_frames(tmp_path, num_frames=5, max_dim=512)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
    finally:
        # Delete the uploaded video IMMEDIATELY (privacy) — never persist it
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    # Encode frames to base64 for the vision API
    image_data_urls = [
        "data:image/jpeg;base64," + base64.b64encode(buf).decode("ascii")
        for buf in frames_jpeg
    ]

    user_prompt = (
        "حلّل هذا الفيديو القصير عبر إطاراته الخمسة (مرتبة زمنياً). "
        "أعطني JSON بهذا الشكل بالضبط:\n"
        "{\n"
        '  "overall_score": <0-100>,\n'
        '  "scores": {"hook": <0-100>, "pace": <0-100>, "trend": <0-100>, "emotion": <0-100>, "retention": <0-100>},\n'
        '  "factors": {"hook": "<سطرين عن قوة الافتتاحية وما يجب تحسينه>", "pace": "<سطرين>", "trend": "<سطرين>", "emotion": "<سطرين>", "retention": "<سطرين>"},\n'
        '  "verdict": "<حكم عام في جملتين>",\n'
        '  "pro_insights": ["<نصيحة احترافية #1 محددة وقابلة للتنفيذ>", "<نصيحة #2>", "<نصيحة #3>"]\n'
        "}\n\n"
        "الإطارات بترتيب زمني. اكتب بالعربية. JSON صالح فقط بدون أي نص قبله أو بعده."
    )

    try:
        _require_openai()
        content = [{"type": "text", "text": user_prompt}]
        content.extend(
            {"type": "image_url", "image_url": {"url": url, "detail": "low"}}
            for url in image_data_urls
        )
        vision_response = await _openai.chat.completions.create(
            model=LLM_VISION_MODEL,
            messages=[
                {"role": "system", "content": VIRALITY_SYSTEM_PROMPT},
                {"role": "user", "content": content},
            ],
            temperature=0.2,
        )
        response = (vision_response.choices[0].message.content or "").strip()
    except Exception as e:
        err = str(e)
        logging.exception("virality vision error")
        if "Budget" in err or "budget" in err:
            raise HTTPException(status_code=503, detail="خدمة الذكاء الاصطناعي غير متاحة مؤقتاً (انتهى الرصيد).")
        raise HTTPException(status_code=500, detail="تعذّر تحليل الفيديو الآن. حاول مرة أخرى.")

    parsed = _parse_match_json(response.strip()) or {}
    scores = parsed.get("scores") or {}
    if not all(k in scores for k in ("hook", "pace", "trend", "emotion", "retention")):
        logging.warning("Virality vision returned malformed JSON: %s", response[:300])
        raise HTTPException(status_code=502, detail="تعذّر فهم رد التحليل — حاول مرة أخرى")

    analysis_id = f"vir_{uuid.uuid4().hex[:12]}"
    doc = {
        "analysis_id": analysis_id,
        "user_id": user.user_id,
        "filename": file.filename or "video",
        "overall_score": parsed.get("overall_score"),
        "scores": scores,
        "factors": parsed.get("factors") or {},
        "verdict": parsed.get("verdict", ""),
        "pro_insights": parsed.get("pro_insights") or [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.virality_analyses.insert_one(dict(doc))
    doc.pop("_id", None)

    # Pro insights gated behind premium
    if not user.is_premium:
        doc["pro_insights"] = []
        doc["pro_locked"] = True
    else:
        doc["pro_locked"] = False
    return doc


@api.get("/virality/history")
async def virality_history(user: User = Depends(require_user)):
    items = (
        await db.virality_analyses.find({"user_id": user.user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(50)
    )
    if not user.is_premium:
        for it in items:
            it["pro_insights"] = []
            it["pro_locked"] = True
    else:
        for it in items:
            it["pro_locked"] = False
    return items


@api.delete("/virality/{analysis_id}")
async def virality_delete(analysis_id: str, user: User = Depends(require_user)):
    await db.virality_analyses.delete_one({"analysis_id": analysis_id, "user_id": user.user_id})
    return {"ok": True}


# ============== SOCIAL ACCOUNTS (OAuth + manual) ==============
META_APP_ID = os.environ.get("META_APP_ID", "")
META_APP_SECRET = os.environ.get("META_APP_SECRET", "")
INSTAGRAM_GRAPH_BASE = "https://graph.facebook.com/v19.0"

# YouTube uses a dedicated OAuth client (separate from the login client) so that
# scope changes on YouTube don't force users to re-consent the login flow.
YOUTUBE_CLIENT_ID = os.environ.get("YOUTUBE_CLIENT_ID", "") or GOOGLE_CLIENT_ID
YOUTUBE_CLIENT_SECRET = os.environ.get("YOUTUBE_CLIENT_SECRET", "") or GOOGLE_CLIENT_SECRET
YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.readonly"


class TikTokConnectRequest(BaseModel):
    username: str
    followers_count: Optional[int] = 0
    media_count: Optional[int] = 0
    name: Optional[str] = None
    profile_picture_url: Optional[str] = None


def _social_doc_public(doc: dict) -> dict:
    """Strip secrets before returning a social_account document to the client."""
    safe = {k: v for k, v in doc.items() if k not in ("_id", "access_token", "refresh_token", "long_lived_token", "fb_user_token")}
    return safe


@api.get("/social/accounts")
async def social_accounts_list(user: User = Depends(require_user)):
    items = await db.social_accounts.find({"user_id": user.user_id}).to_list(100)
    return [_social_doc_public(d) for d in items]


@api.delete("/social/accounts/{account_id}")
async def social_account_delete(account_id: str, user: User = Depends(require_user)):
    await db.social_accounts.delete_one({"account_id": account_id, "user_id": user.user_id})
    return {"ok": True}


@api.post("/social/connect/tiktok")
async def social_connect_tiktok(body: TikTokConnectRequest, user: User = Depends(require_user)):
    """Manual TikTok connect — user pastes their handle + public counts."""
    username = body.username.strip().lstrip("@")
    if not username or len(username) > 40:
        raise HTTPException(status_code=400, detail="اسم المستخدم على TikTok مطلوب")

    # Upsert: one account per (user, platform, username)
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "account_id": f"sa_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "platform": "tiktok",
        "username": username,
        "name": body.name or username,
        "profile_picture_url": body.profile_picture_url or "",
        "followers_count": int(body.followers_count or 0),
        "media_count": int(body.media_count or 0),
        "total_views": 0,
        "connected_at": now,
        "connection_method": "manual",
    }
    existing = await db.social_accounts.find_one({
        "user_id": user.user_id, "platform": "tiktok", "username": username,
    })
    if existing:
        await db.social_accounts.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "name": doc["name"],
                "profile_picture_url": doc["profile_picture_url"],
                "followers_count": doc["followers_count"],
                "media_count": doc["media_count"],
                "connected_at": now,
            }},
        )
        merged = await db.social_accounts.find_one({"_id": existing["_id"]})
        return _social_doc_public(merged)
    await db.social_accounts.insert_one(doc)
    return _social_doc_public(doc)


# --- Instagram (Meta Graph) -------------------------------------------------
@api.get("/auth/instagram")
async def instagram_auth_start(request: Request):
    """Initiate the Instagram (Meta) OAuth flow. Requires META_APP_ID/SECRET in env."""
    if not META_APP_ID or not META_APP_SECRET:
        raise HTTPException(status_code=503, detail="ربط Instagram غير مُهيَّأ — يلزم META_APP_ID/SECRET على الخادم")
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="سجّل الدخول أولاً")
    origin = _frontend_origin_from(request)
    redirect_uri = f"{origin}/auth/instagram"
    state = secrets.token_urlsafe(24)
    await db.oauth_states.insert_one({
        "state": state,
        "user_id": user.user_id,
        "platform": "instagram",
        "redirect_uri": redirect_uri,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    params = {
        "client_id": META_APP_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "instagram_basic,pages_show_list,instagram_manage_insights,business_management,pages_read_engagement",
        "state": state,
    }
    return {"url": f"https://www.facebook.com/v19.0/dialog/oauth?{urlencode(params)}"}


class InstagramExchangeRequest(BaseModel):
    code: str
    state: str
    redirect_uri: str


@api.post("/auth/instagram/exchange")
async def instagram_auth_exchange(body: InstagramExchangeRequest, user: User = Depends(require_user)):
    if not META_APP_ID or not META_APP_SECRET:
        raise HTTPException(status_code=503, detail="ربط Instagram غير مُهيَّأ")
    saved = await db.oauth_states.find_one({"state": body.state, "platform": "instagram"})
    if not saved or saved.get("user_id") != user.user_id:
        raise HTTPException(status_code=400, detail="فشل تحقق OAuth (state) — حاول مجدداً")
    await db.oauth_states.delete_one({"_id": saved["_id"]})

    async with httpx.AsyncClient(timeout=20) as cli:
        # Exchange code -> short-lived token
        tok_r = await cli.get(
            f"{INSTAGRAM_GRAPH_BASE}/oauth/access_token",
            params={
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "redirect_uri": body.redirect_uri,
                "code": body.code,
            },
        )
        if tok_r.status_code != 200:
            logging.error("Meta token exchange failed: %s", tok_r.text[:300])
            raise HTTPException(status_code=400, detail="فشل تبادل رمز Instagram مع Meta")
        access_token = tok_r.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="لم يُرجِع Meta access_token")

        # Long-lived token (60 days)
        ll_r = await cli.get(
            f"{INSTAGRAM_GRAPH_BASE}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "fb_exchange_token": access_token,
            },
        )
        long_lived = ll_r.json().get("access_token", access_token) if ll_r.status_code == 200 else access_token

        # Get user's pages and the Instagram Business Account attached to each
        pages_r = await cli.get(
            f"{INSTAGRAM_GRAPH_BASE}/me/accounts",
            params={"access_token": long_lived, "fields": "id,name,access_token,instagram_business_account"},
        )
        if pages_r.status_code != 200:
            raise HTTPException(status_code=400, detail="تعذّر جلب صفحات Facebook المرتبطة")
        pages = pages_r.json().get("data", [])
        ig_account = None
        for p in pages:
            iba = p.get("instagram_business_account")
            if iba and iba.get("id"):
                ig_account = {"ig_user_id": iba["id"], "page_id": p["id"], "page_token": p.get("access_token")}
                break
        if not ig_account:
            raise HTTPException(status_code=400, detail="لا يوجد حساب Instagram Business مرتبط بصفحة Facebook")

        # Fetch IG profile + stats
        prof_r = await cli.get(
            f"{INSTAGRAM_GRAPH_BASE}/{ig_account['ig_user_id']}",
            params={
                "fields": "id,username,name,profile_picture_url,followers_count,media_count",
                "access_token": ig_account["page_token"] or long_lived,
            },
        )
        if prof_r.status_code != 200:
            raise HTTPException(status_code=400, detail="تعذّر جلب بيانات حساب Instagram")
        prof = prof_r.json()

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "account_id": f"sa_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "platform": "instagram",
        "ig_user_id": prof.get("id"),
        "page_id": ig_account["page_id"],
        "username": prof.get("username", ""),
        "name": prof.get("name", ""),
        "profile_picture_url": prof.get("profile_picture_url", ""),
        "followers_count": int(prof.get("followers_count") or 0),
        "media_count": int(prof.get("media_count") or 0),
        "total_views": 0,
        "access_token": ig_account["page_token"] or long_lived,
        "long_lived_token": long_lived,
        "connected_at": now,
        "connection_method": "oauth",
    }
    # Upsert by (user, platform, ig_user_id)
    await db.social_accounts.update_one(
        {"user_id": user.user_id, "platform": "instagram", "ig_user_id": doc["ig_user_id"]},
        {"$set": doc},
        upsert=True,
    )
    return _social_doc_public(doc)


# --- YouTube (Google OAuth, extended scope) ---------------------------------
@api.get("/auth/youtube")
async def youtube_auth_start(request: Request):
    if not YOUTUBE_CLIENT_ID or not YOUTUBE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="ربط YouTube غير مُهيَّأ — يلزم YOUTUBE_CLIENT_ID/SECRET")
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="سجّل الدخول أولاً")
    origin = _frontend_origin_from(request)
    redirect_uri = f"{origin}/auth/youtube"
    state = secrets.token_urlsafe(24)
    await db.oauth_states.insert_one({
        "state": state,
        "user_id": user.user_id,
        "platform": "youtube",
        "redirect_uri": redirect_uri,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    params = {
        "client_id": YOUTUBE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": YOUTUBE_SCOPE,
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    return {"url": f"{GOOGLE_AUTH_URL}?{urlencode(params)}"}


class YouTubeExchangeRequest(BaseModel):
    code: str
    state: str
    redirect_uri: str


@api.post("/auth/youtube/exchange")
async def youtube_auth_exchange(body: YouTubeExchangeRequest, user: User = Depends(require_user)):
    if not YOUTUBE_CLIENT_ID or not YOUTUBE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="ربط YouTube غير مُهيَّأ")
    saved = await db.oauth_states.find_one({"state": body.state, "platform": "youtube"})
    if not saved or saved.get("user_id") != user.user_id:
        raise HTTPException(status_code=400, detail="فشل تحقق OAuth (state) — حاول مجدداً")
    await db.oauth_states.delete_one({"_id": saved["_id"]})

    async with httpx.AsyncClient(timeout=20) as cli:
        tok_r = await cli.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": body.code,
                "client_id": YOUTUBE_CLIENT_ID,
                "client_secret": YOUTUBE_CLIENT_SECRET,
                "redirect_uri": body.redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        if tok_r.status_code != 200:
            logging.error("YouTube token exchange failed: %s", tok_r.text[:300])
            raise HTTPException(status_code=400, detail="فشل تبادل رمز YouTube مع Google")
        tokens = tok_r.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token", "")
        if not access_token:
            raise HTTPException(status_code=400, detail="لم يُرجِع Google access_token")

        # Fetch the user's channel
        ch_r = await cli.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params={"part": "snippet,statistics", "mine": "true"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if ch_r.status_code != 200 or not ch_r.json().get("items"):
            raise HTTPException(status_code=400, detail="تعذّر جلب قناة YouTube الخاصة بك")
        ch = ch_r.json()["items"][0]
        snip = ch.get("snippet") or {}
        stats = ch.get("statistics") or {}

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "account_id": f"sa_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "platform": "youtube",
        "yt_channel_id": ch.get("id"),
        "username": (snip.get("customUrl") or snip.get("title") or "").lstrip("@"),
        "name": snip.get("title", ""),
        "profile_picture_url": (snip.get("thumbnails") or {}).get("default", {}).get("url", ""),
        "followers_count": int(stats.get("subscriberCount") or 0),
        "media_count": int(stats.get("videoCount") or 0),
        "total_views": int(stats.get("viewCount") or 0),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "connected_at": now,
        "connection_method": "oauth",
    }
    await db.social_accounts.update_one(
        {"user_id": user.user_id, "platform": "youtube", "yt_channel_id": doc["yt_channel_id"]},
        {"$set": doc},
        upsert=True,
    )
    return _social_doc_public(doc)


app.include_router(api)

# CORS: when origins is "*" AND credentials are allowed, browsers reject the request
# (wildcard + credentials is forbidden by spec). Use a regex to echo back the origin instead.
_cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
_origins_list = [o.strip() for o in _cors_origins_env.split(",") if o.strip()]
_cors_kwargs = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if _origins_list == ["*"] or _cors_origins_env.strip() == "*":
    _cors_kwargs["allow_origin_regex"] = ".*"
else:
    _cors_kwargs["allow_origins"] = _origins_list

app.add_middleware(CORSMiddleware, **_cors_kwargs)

logging.basicConfig(level=logging.INFO)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.on_event("startup")
async def startup_event():
    try:
        await db.users.create_index("email", unique=True, sparse=True)
        await db.users.create_index("username", unique=True, sparse=True)
        await db.users.create_index("user_id", unique=True)
        await db.users.create_index("referral_code", unique=True, sparse=True)
        await db.social_accounts.create_index([("user_id", 1), ("platform", 1)])
        await db.chat_messages.create_index([("user_id", 1), ("session_id", 1), ("created_at", 1)])
        await db.virality_analyses.create_index([("user_id", 1), ("created_at", -1)])
        await db.ad_watches.create_index([("user_id", 1), ("created_at", -1)])
        await db.referral_rewards.create_index([("referrer_id", 1), ("created_at", -1)])
        await db.credits_purchases.create_index("purchase_token", unique=True)
        # Backfill: existing users without `credits` field get DEFAULT_CREDITS
        await db.users.update_many(
            {"credits": {"$exists": False}},
            {"$set": {"credits": DEFAULT_CREDITS}},
        )
        # Backfill: new schema fields default to safe values
        await db.users.update_many(
            {"referred_by": {"$exists": False}},
            {"$set": {
                "referred_by": None,
                "premium_expires_at": None,
                "subscription_type": None,
                "subscription_cancelled": False,
            }},
        )
        # Backfill: generate referral codes for users that don't have one yet
        legacy = db.users.find({"referral_code": {"$in": [None, ""]}}, {"user_id": 1})
        async for u in legacy:
            code = await generate_referral_code()
            await db.users.update_one({"user_id": u["user_id"]}, {"$set": {"referral_code": code}})
        legacy_missing = db.users.find({"referral_code": {"$exists": False}}, {"user_id": 1})
        async for u in legacy_missing:
            code = await generate_referral_code()
            await db.users.update_one({"user_id": u["user_id"]}, {"$set": {"referral_code": code}})
    except Exception as e:
        logging.warning(f"Index creation: {e}")
    init_storage()

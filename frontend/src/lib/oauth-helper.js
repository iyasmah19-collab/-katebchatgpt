// Detects in-app browsers (Instagram, Facebook, TikTok, etc.) and helps users escape to a real
// browser for OAuth flows. Google blocks WebView OAuth with "403 disallowed_useragent" since 2021
// (https://developers.googleblog.com/2021/06/upcoming-security-changes-google-oauth.html).
//
// OAuth is handled directly by the Kateb FastAPI backend. Google Cloud Console must contain
// the backend's /api/auth/google/callback URL as an authorized redirect URI.

const IN_APP_PATTERNS = [
  // Facebook family
  "FBAN", "FBAV", "FB_IAB", "FBIOS", "FB4A", "Messenger",
  // Other social apps that ship a WebView
  "Instagram", "Twitter", "Line", "Snapchat", "TikTok", "musical_ly",
  "Linkedin", "LinkedInApp", "WhatsApp", "Telegram", "MicroMessenger",
  "QQ/", "KAKAOTALK", "NAVER", "Pinterest", "DuckDuckGo",
];

export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";

  // 1) Explicit Android WebView marker: "; wv)" — present on every Android WebView since 2014.
  if (/;\s*wv\)/i.test(ua)) return true;

  // 2) Known in-app browser User-Agent fragments
  if (IN_APP_PATTERNS.some((p) => ua.includes(p))) return true;

  // 3) iOS WebView heuristic: real Safari has "Safari/" + "Version/" in the UA.
  //    iOS in-app WebViews (WKWebView/UIWebView) usually keep AppleWebKit but drop "Safari/" or "Version/".
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAppleWebKit = /AppleWebKit/i.test(ua);
  if (isIOS && isAppleWebKit && (!/Safari\//i.test(ua) || !/Version\/\d/i.test(ua))) {
    return true;
  }

  return false;
}

export function detectAppName() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua)) return "Facebook";
  if (/Messenger/i.test(ua)) return "Messenger";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/TikTok|musical_ly/i.test(ua)) return "TikTok";
  if (/Twitter/i.test(ua)) return "Twitter / X";
  if (/Linkedin|LinkedInApp/i.test(ua)) return "LinkedIn";
  if (/WhatsApp/i.test(ua)) return "WhatsApp";
  if (/Telegram/i.test(ua)) return "Telegram";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  if (/Line\b/i.test(ua)) return "Line";
  if (/MicroMessenger/i.test(ua)) return "WeChat";
  if (/KAKAOTALK/i.test(ua)) return "KakaoTalk";
  if (/Pinterest/i.test(ua)) return "Pinterest";
  return null;
}

export function getPlatform() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "desktop";
}

// Best-effort: try to open URL in the system browser, escaping the WebView.
// - Android: uses the intent:// scheme (forces Chrome with a fallback URL).
// - iOS:     no reliable cross-app trigger; user must use the "..." menu.
//            We open the URL in a new top-level navigation as a best effort.
export function escapeWebViewAndOpen(url) {
  const platform = getPlatform();

  if (platform === "android") {
    // Strip protocol for intent:// then add fallback to the original https URL.
    const clean = url.replace(/^https?:\/\//, "");
    const intentUrl =
      `intent://${clean}#Intent;scheme=https;package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(url)};end`;
    try {
      window.location.href = intentUrl;
    } catch (e) {
      // Some WebViews throw on intent:// URIs — fall back to plain HTTPS.
      console.warn("[oauth-helper] intent:// failed, falling back to https:", e?.message);
      window.location.href = url;
    }
    // Fallback if the intent handler did not fire (e.g. Chrome not installed)
    setTimeout(() => {
      if (!document.hidden) window.location.href = url;
    }, 1200);
    return;
  }

  if (platform === "ios") {
    // iOS WebViews cannot reliably hand off to Safari from JS. Just navigate; some apps
    // (Instagram, FB) will offer "Open in Safari" via their "..." menu after this.
    window.location.href = url;
    return;
  }

  // Desktop fallback
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.href = url;
}

// Copy a URL to the clipboard with a graceful fallback.
export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // Clipboard API can fail in iframes / non-secure contexts — fall through to legacy path.
    console.warn("[oauth-helper] Clipboard API failed, falling back to execCommand:", e?.message);
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch (e) {
    return false;
  }
}

// Build our OWN backend Google-login URL. The backend then 302-redirects the user directly
// to Google's native account-picker page (accounts.google.com). The redirect URI registered
// in Google Cloud Console is `<origin>/auth/google` — we never hardcode it here.
//
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export function buildAuthUrl(_redirectPath = "/dashboard") {
  // Always use window.location.origin — works on preview, deployed, and custom domains.
  const base = window.location.origin + "/api/auth/google/login";
  // If the current URL has a ?ref= referral code, forward it to the backend so it
  // can attach the referral on first-time Google signup.
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) return `${base}?ref=${encodeURIComponent(ref)}`;
  } catch (e) {
    // Non-browser env — ignore.
  }
  return base;
}

// Main entry used by Login / Signup pages.
// Returns:
//   { inApp: false }                       → standard browser, redirect already initiated.
//   { inApp: true, appName, authUrl }      → in-app browser detected; caller MUST show a dialog
//                                            with a manual "Open in Browser" button and copy link.
//                                            Calling code should not start the redirect itself.
export function startGoogleAuth(redirectPath = "/dashboard") {
  const authUrl = buildAuthUrl(redirectPath);

  if (isInAppBrowser()) {
    return { inApp: true, appName: detectAppName(), authUrl, platform: getPlatform() };
  }

  // Standard browser — direct top-level navigation (no popup, no iframe).
  // Using window.top.location avoids issues if this page is ever embedded in an iframe.
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = authUrl;
    } else {
      window.location.href = authUrl;
    }
  } catch (e) {
    // Cross-origin frame access denied → safest is to break out via target=_top
    window.location.href = authUrl;
  }
  return { inApp: false, authUrl, platform: getPlatform() };
}

// Google Sign-In helper for mobile (Expo).
// Uses expo-auth-session/providers/google to obtain an id_token, then exchanges it
// for our own JWT via POST /api/auth/google/mobile.
//
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import client, { setSessionToken } from "./api";

// Required so the auth modal closes correctly after redirect on iOS/web.
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

export function useGoogleSignIn({ onSuccess, onError } = {}) {
  // useIdTokenAuthRequest gives us an `id_token` we can verify server-side.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID || undefined,
    iosClientId: IOS_CLIENT_ID || undefined,
    // Scopes are inferred (openid email profile) — no need to specify.
  });

  useEffect(() => {
    (async () => {
      if (!response) return;
      if (response.type !== "success") {
        if (response.type === "error" && onError) {
          onError(response.error || new Error("Google sign-in cancelled"));
        }
        return;
      }
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (!idToken) {
        onError && onError(new Error("No id_token returned from Google"));
        return;
      }
      try {
        const r = await client.post("/auth/google/mobile", { id_token: idToken });
        if (r.data?.token) {
          await setSessionToken(r.data.token);
        }
        onSuccess && onSuccess(r.data.user);
      } catch (e) {
        const msg = e.response?.data?.detail || e.message || "تعذّر تسجيل الدخول";
        onError && onError(new Error(msg));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    signIn: () => promptAsync(),
    ready: !!request,
  };
}

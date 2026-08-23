import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useApp } from "@/contexts/AppContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
// This component lives at the FRONTEND route /auth/google. Google redirects users here
// after they authenticate. We extract ?code=...&state=... from the query string and POST it
// to the backend (/api/auth/google/exchange) which performs the secure server-side token
// exchange and issues our own JWT cookie.
export default function GoogleCallback() {
  const nav = useNavigate();
  const { lang, setUser } = useApp();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
      toast.error(
        lang === "ar"
          ? error === "access_denied" ? "تم إلغاء تسجيل الدخول" : `خطأ من Google: ${error}`
          : error === "access_denied" ? "Login cancelled" : `Google error: ${error}`
      );
      nav("/login", { replace: true });
      return;
    }
    if (!code || !state) {
      toast.error(lang === "ar" ? "رابط غير صالح" : "Invalid callback URL");
      nav("/login", { replace: true });
      return;
    }

    const redirect_uri = window.location.origin + "/auth/google";
    axios
      .post(`${API}/auth/google/exchange`, { code, state, redirect_uri })
      .then((r) => {
        setUser(r.data.user);
        toast.success(lang === "ar" ? "تم تسجيل الدخول 🎉" : "Logged in 🎉");
        nav("/dashboard", { replace: true });
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail;
        toast.error(typeof detail === "string" ? detail : (lang === "ar" ? "فشل تسجيل الدخول" : "Login failed"));
        nav("/login", { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-grain px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-600/10 border border-amber-500/40 flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
        <h2 className="text-xl font-black text-white" dir="auto">
          {lang === "ar" ? "جاري تسجيل الدخول..." : "Signing you in..."}
        </h2>
        <p className="text-sm text-zinc-400" dir="auto">
          {lang === "ar"
            ? "نتحقق من بيانات حسابك على Google. لحظات."
            : "Verifying your Google account. One moment."}
        </p>
      </div>
    </div>
  );
}

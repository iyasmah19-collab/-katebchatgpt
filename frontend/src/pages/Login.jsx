import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, Mail, Lock } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { startGoogleAuth } from "@/lib/oauth-helper";
import InAppBrowserDialog from "@/components/InAppBrowserDialog";

export default function Login() {
  const { t, lang, setUser } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [inAppState, setInAppState] = useState(null); // { open, appName, platform, authUrl }

  // Pre-fill email if redirected from Signup with ?email=... (e.g. after "account exists")
  useEffect(() => {
    const e = params.get("email");
    if (e) setEmail(e);
  }, [params]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await axios.post(`${API}/auth/login`, { email, password });
      setUser(r.data.user);
      toast.success(lang === "ar" ? "تم تسجيل الدخول" : "Logged in");
      nav("/dashboard", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      // 404 = email not registered → suggest creating an account, prefill the email.
      if (status === 404) {
        toast.error(
          lang === "ar"
            ? "هذا البريد غير مسجّل. تحتاج إنشاء حساب جديد."
            : "This email isn't registered. You need to create an account.",
          {
            action: {
              label: lang === "ar" ? "إنشاء حساب" : "Sign up",
              onClick: () => nav(`/signup?email=${encodeURIComponent(email)}`),
            },
            duration: 6000,
          }
        );
      } else {
        toast.error(typeof detail === "string" ? detail : t.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const google = () => {
    // Use the OAuth helper: it detects in-app browsers (Instagram/FB/TikTok…) which would
    // otherwise trigger Google's "403 disallowed_useragent" error, and instructs the user
    // to open the auth URL in a real system browser instead.
    // OAuth is handled directly by the Kateb backend; its callback is configured in Google Cloud Console.
    const result = startGoogleAuth("/dashboard");
    if (result.inApp) {
      setInAppState({ open: true, ...result });
    }
    // For non-in-app browsers, startGoogleAuth has already initiated the redirect.
  };

  return (
    <div className="bg-grain min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.4)]">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-2xl font-black shine-text">{t.appName}</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white pt-4">
            {lang === "ar" ? "أهلاً بعودتك" : "Welcome back"}
          </h1>
          <p className="text-zinc-400 text-sm">
            {lang === "ar" ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
          </p>
        </div>

        <div className="rounded-3xl bg-[#0f0f13] border border-white/10 p-7 space-y-5">
          <div className="grid gap-2">
            <Button onClick={google} data-testid="login-google" className="h-11 bg-white text-black hover:bg-zinc-100 font-semibold">
              <FcGoogle className="w-5 h-5 me-2" />
              {lang === "ar" ? "متابعة بحساب Google" : "Continue with Google"}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
              {lang === "ar" ? "أو" : "OR"}
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute top-1/2 -translate-y-1/2 start-3" />
                <Input data-testid="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#16161d] border-white/10 h-11 ps-10 text-white focus-visible:ring-amber-500/40" placeholder="you@example.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "كلمة السر" : "Password"}</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute top-1/2 -translate-y-1/2 start-3" />
                <Input data-testid="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#16161d] border-white/10 h-11 ps-10 text-white focus-visible:ring-amber-500/40" />
              </div>
            </div>
            <Button type="submit" disabled={loading} data-testid="login-submit" className="w-full h-11 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(255,184,0,0.3)]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === "ar" ? "تسجيل دخول" : "Sign in")}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-400">
            {lang === "ar" ? "ما عندك حساب؟" : "Don't have an account?"}{" "}
            <Link to="/signup" className="text-amber-400 font-semibold hover:underline" data-testid="link-to-signup">
              {lang === "ar" ? "أنشئ حساب جديد" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>

      <InAppBrowserDialog
        open={!!inAppState?.open}
        onClose={() => setInAppState(null)}
        appName={inAppState?.appName}
        platform={inAppState?.platform}
        authUrl={inAppState?.authUrl}
      />
    </div>
  );
}

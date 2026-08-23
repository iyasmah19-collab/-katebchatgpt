import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, Mail, Lock, User as UserIcon, Gift } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { startGoogleAuth } from "@/lib/oauth-helper";
import InAppBrowserDialog from "@/components/InAppBrowserDialog";

export default function Signup() {
  const { t, lang, setUser } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState(() => ({
    email: params.get("email") || "",
    password: "",
    username: "",
    name: "",
    referral_code: (params.get("ref") || "").toUpperCase(),
  }));
  const [loading, setLoading] = useState(false);
  const [inAppState, setInAppState] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.referral_code) payload.referral_code = payload.referral_code.trim().toUpperCase();
      else delete payload.referral_code;
      const r = await axios.post(`${API}/auth/register`, payload);
      setUser(r.data.user);
      toast.success(lang === "ar" ? "تم إنشاء حسابك 🎉" : "Account created 🎉");
      nav("/dashboard", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      // 409 = email (or username) already exists → suggest logging in instead.
      if (status === 409) {
        const isEmailDup = typeof detail === "string" && detail.includes("بريد");
        toast.error(
          isEmailDup
            ? (lang === "ar"
                ? "هذا الحساب موجود فعلاً. الرجاء تسجيل الدخول."
                : "This account already exists. Please sign in.")
            : (typeof detail === "string" ? detail : t.error),
          {
            action: isEmailDup
              ? {
                  label: lang === "ar" ? "تسجيل دخول" : "Sign in",
                  onClick: () => nav(`/login?email=${encodeURIComponent(form.email)}`),
                }
              : undefined,
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
    // OAuth helper detects in-app browsers and avoids Google's "403 disallowed_useragent"
    // by routing the user to a real system browser via intent:// (Android) or instructions (iOS).
    const result = startGoogleAuth("/dashboard");
    if (result.inApp) setInAppState({ open: true, ...result });
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
            {lang === "ar" ? "أنشئ حسابك" : "Create your account"}
          </h1>
          <p className="text-zinc-400 text-sm">
            {lang === "ar" ? "ابدأ مجاناً، بدون بطاقة" : "Start free, no credit card"}
          </p>
        </div>

        <div className="rounded-3xl bg-[#0f0f13] border border-white/10 p-7 space-y-5">
          <div className="grid gap-2">
            <Button onClick={google} data-testid="signup-google" className="h-11 bg-white text-black hover:bg-zinc-100 font-semibold">
              <FcGoogle className="w-5 h-5 me-2" />
              {lang === "ar" ? "إنشاء حساب بـ Google" : "Sign up with Google"}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "أو" : "OR"}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "اسم المستخدم" : "Username"}</Label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute top-1/2 -translate-y-1/2 start-3" />
                <Input data-testid="signup-username" required minLength={3} maxLength={20} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-[#16161d] border-white/10 h-11 ps-10 text-white focus-visible:ring-amber-500/40" placeholder="ahmad_alkateb" />
              </div>
              <p className="text-xs text-zinc-600">{lang === "ar" ? "3-20 حرف، أحرف وأرقام و _" : "3-20 chars: letters, numbers, _"}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute top-1/2 -translate-y-1/2 start-3" />
                <Input data-testid="signup-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-[#16161d] border-white/10 h-11 ps-10 text-white focus-visible:ring-amber-500/40" placeholder="you@example.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "كلمة السر" : "Password"}</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute top-1/2 -translate-y-1/2 start-3" />
                <Input data-testid="signup-password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-[#16161d] border-white/10 h-11 ps-10 text-white focus-visible:ring-amber-500/40" />
              </div>
              <p className="text-xs text-zinc-600">{lang === "ar" ? "6 أحرف على الأقل" : "6 characters minimum"}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                {lang === "ar" ? "كود الإحالة (اختياري)" : "Referral code (optional)"}
              </Label>
              <div className="relative">
                <Gift className="w-4 h-4 text-amber-400/70 absolute top-1/2 -translate-y-1/2 start-3" />
                <Input
                  data-testid="signup-referral"
                  value={form.referral_code}
                  onChange={(e) => setForm({ ...form, referral_code: e.target.value.toUpperCase() })}
                  maxLength={10}
                  className="bg-[#16161d] border-white/10 h-11 ps-10 text-white focus-visible:ring-amber-500/40 tracking-wider font-mono"
                  placeholder="KTB-XXXX"
                />
              </div>
              <p className="text-xs text-zinc-600">
                {lang === "ar"
                  ? "أدخل كود صديقك ليحصل كلاكما على رصيد إضافي"
                  : "Enter a friend's code — both of you earn extra credits"}
              </p>
            </div>
            <Button type="submit" disabled={loading} data-testid="signup-submit" className="w-full h-11 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(255,184,0,0.3)]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === "ar" ? "أنشئ الحساب" : "Create account")}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-400">
            {lang === "ar" ? "عندك حساب؟" : "Already have an account?"}{" "}
            <Link to="/login" className="text-amber-400 font-semibold hover:underline" data-testid="link-to-login">
              {lang === "ar" ? "تسجيل دخول" : "Sign in"}
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

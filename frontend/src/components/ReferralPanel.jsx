import React, { useEffect, useState } from "react";
import axios from "axios";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Gift, Copy, Share2, Loader2, Sparkles, Trophy, Users } from "lucide-react";
import { copyToClipboard } from "@/lib/oauth-helper";

/**
 * Referral panel for the Library page.
 * - Shows the user's referral code + a one-click copy/share link
 * - Lists rewards earned (10 per signup, 100 per premium conversion)
 * - Lets the user apply someone else's code if they haven't yet
 */
export default function ReferralPanel() {
  const { lang } = useApp();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API}/referral/info`).then(
      (res) => { if (!cancelled) setInfo(res.data); },
      (err) => {
        if (cancelled) return;
        const msg = err?.response?.data?.detail || (lang === "ar" ? "تعذّر تحميل بيانات الإحالة" : "Could not load referral info");
        toast.error(msg);
      },
    ).then(
      () => { if (!cancelled) setLoading(false); },
    );
    return () => { cancelled = true; };
  }, [lang, reloadKey]);

  const reload = () => { setLoading(true); setReloadKey((k) => k + 1); };

  const shareLink = info?.referral_code
    ? `${window.location.origin}/signup?ref=${info.referral_code}`
    : "";

  const onCopyCode = async () => {
    if (!info?.referral_code) return;
    const ok = await copyToClipboard(info.referral_code);
    toast[ok ? "success" : "error"](
      ok ? (lang === "ar" ? "تم نسخ الكود" : "Code copied") : (lang === "ar" ? "تعذّر النسخ" : "Copy failed")
    );
  };

  const onCopyLink = async () => {
    if (!shareLink) return;
    const ok = await copyToClipboard(shareLink);
    toast[ok ? "success" : "error"](
      ok ? (lang === "ar" ? "تم نسخ الرابط" : "Link copied") : (lang === "ar" ? "تعذّر النسخ" : "Copy failed")
    );
  };

  const onNativeShare = async () => {
    if (!shareLink) return;
    const text = lang === "ar"
      ? `جرّب كاتب — أداة AI لإنشاء محتوى عربي قوي. استخدم كودي ${info.referral_code} واحصل على رصيد مجاني:\n${shareLink}`
      : `Try Kateb — the Arabic AI content tool. Use my code ${info.referral_code} for free credits:\n${shareLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Kateb", text, url: shareLink });
      } catch (e) {
        // user cancelled — no-op
      }
    } else {
      await onCopyLink();
    }
  };

  const onApply = async (e) => {
    e.preventDefault();
    if (!applyCode.trim()) return;
    setApplying(true);
    try {
      const res = await axios.post(`${API}/referral/apply`, { code: applyCode.trim().toUpperCase() });
      toast.success(
        lang === "ar"
          ? `تم تطبيق كود الإحالة — صديقك ربح ${res.data.signup_bonus_granted} كريديت 🎉`
          : `Referral applied — your friend earned ${res.data.signup_bonus_granted} credits 🎉`
      );
      setApplyCode("");
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || (lang === "ar" ? "كود غير صالح" : "Invalid code"));
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }
  if (!info) return null;

  return (
    <div className="space-y-6" data-testid="referral-panel">
      {/* Hero card */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#0f0f13] to-black p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(255,184,0,0.45)]">
            <Gift className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              {lang === "ar" ? "ادعُ صديقاً، اكسبا معاً" : "Invite a friend, earn together"}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {lang === "ar"
                ? `${info.signup_bonus} كريديت لك عند كل اشتراك جديد بكودك، و+${info.premium_bonus} إضافي إذا اشترك Premium.`
                : `${info.signup_bonus} credits per signup with your code, +${info.premium_bonus} bonus on Premium upgrade.`}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
              {lang === "ar" ? "كودك" : "Your code"}
            </p>
            <div className="flex items-center gap-2">
              <code data-testid="referral-code" className="text-2xl font-black tracking-wider text-amber-400 font-mono">{info.referral_code}</code>
              <Button data-testid="referral-copy-code" size="sm" variant="outline" onClick={onCopyCode} className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
              {lang === "ar" ? "رابط الدعوة" : "Invite link"}
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-zinc-300 truncate flex-1" title={shareLink}>{shareLink}</code>
              <Button data-testid="referral-copy-link" size="sm" variant="outline" onClick={onCopyLink} className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
                <Copy className="w-4 h-4" />
              </Button>
              <Button data-testid="referral-share-btn" size="sm" onClick={onNativeShare} className="bg-amber-500 text-black hover:brightness-110 font-semibold">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={Users} label={lang === "ar" ? "اشتراكات" : "Signups"} value={info.stats.signups} testid="ref-stat-signups" />
          <Stat icon={Sparkles} label={lang === "ar" ? "Premium" : "Premium"} value={info.stats.premium_conversions} testid="ref-stat-premium" />
          <Stat icon={Trophy} label={lang === "ar" ? "إجمالي الكريديت" : "Credits earned"} value={info.stats.total_credits_earned} testid="ref-stat-credits" />
        </div>
      </div>

      {/* Apply someone else's code */}
      {!info.referred_by && (
        <form onSubmit={onApply} className="rounded-2xl border border-white/10 bg-[#0f0f13] p-5 space-y-3">
          <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-400">
            {lang === "ar" ? "هل لديك كود صديق؟" : "Have a friend's code?"}
          </h3>
          <div className="flex items-center gap-2">
            <Input
              data-testid="referral-apply-input"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
              placeholder="KTB-XXXX"
              maxLength={10}
              className="bg-black border-white/10 text-white font-mono tracking-wider h-11"
            />
            <Button
              data-testid="referral-apply-btn"
              type="submit"
              disabled={applying || !applyCode.trim()}
              className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold h-11 px-6"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === "ar" ? "تطبيق" : "Apply")}
            </Button>
          </div>
        </form>
      )}

      {/* History */}
      {info.history?.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-5 space-y-3">
          <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-400">
            {lang === "ar" ? "سجل المكافآت" : "Reward history"}
          </h3>
          <ul className="divide-y divide-white/5">
            {info.history.map((h) => (
              <li key={h.reward_id} data-testid="ref-history-row" className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.kind === "premium" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                    {h.kind === "premium" ? <Sparkles className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      {h.kind === "premium"
                        ? (lang === "ar" ? "ترقية Premium" : "Premium upgrade")
                        : (lang === "ar" ? "اشتراك جديد" : "New signup")}
                    </p>
                    <p className="text-xs text-zinc-500">{new Date(h.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-amber-400 font-bold font-mono">+{h.credits}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, testid }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center" data-testid={testid}>
      <Icon className="w-4 h-4 text-amber-400 mx-auto mb-1" />
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

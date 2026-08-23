import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Crown, Loader2, Sparkles, ArrowLeft, Smartphone } from "lucide-react";
import { toast } from "sonner";

// Google Play subscriptions — the ONLY paid path. Web visitors are guided to install
// the mobile app and subscribe through Google Play.
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.kateb.mobile";

const PLANS = {
  monthly: { price: 5, label: "monthly", period: "perMonth", badgeKey: "monthly" },
  yearly:  { price: 30, label: "yearly",  period: "perYear",  badgeKey: "bestValue" },
};

// Discount codes — UPPERCASE ONLY, case-sensitive on both client and server.
const DISCOUNT_CODES = {
  AMDSH75: { discount: 1.0 }, // 100% off — unlocks full Premium for free
};

export default function Premium() {
  const { t, lang, user, checkAuth } = useApp();
  const [loading, setLoading] = useState(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [polling, setPolling] = useState(false);
  const [paid, setPaid] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [subStatus, setSubStatus] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const sessionId = params.get("session_id");
  const successPath = window.location.pathname.includes("/success");

  // Load detailed subscription status for the "already premium" screen.
  useEffect(() => {
    if (!user?.is_premium) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API}/subscription/status`);
        if (!cancelled) setSubStatus(res.data);
      } catch (err) {
        // non-critical — UI just hides the extras when missing
        console.warn("[Premium] subscription/status failed:", err?.response?.status || err?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.is_premium]);

  const onCancelSubscription = async () => {
    if (!window.confirm(
      lang === "ar"
        ? "هل أنت متأكد من إلغاء التجديد التلقائي؟ ستبقى ميزات Premium نشطة حتى تاريخ الانتهاء."
        : "Cancel auto-renewal? You'll keep Premium features until your expiry date."
    )) return;
    setCancelling(true);
    try {
      const res = await axios.post(`${API}/subscription/cancel`, {});
      toast.success(res.data.message || (lang === "ar" ? "تم الإلغاء" : "Cancelled"));
      setSubStatus((s) => ({ ...s, subscription_cancelled: true }));
    } catch (e) {
      toast.error(e?.response?.data?.detail || (lang === "ar" ? "تعذّر الإلغاء" : "Cancel failed"));
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!sessionId || !successPath) return;
    setPolling(true);
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const res = await axios.get(`${API}/payments/status/${sessionId}`);
        if (res.data.payment_status === "paid") {
          setPaid(true);
          setPolling(false);
          toast.success(t.paymentSuccess);
          await checkAuth();
          setTimeout(() => navigate("/vault"), 1800);
          return;
        }
        if (res.data.status === "expired" || attempts > 12) {
          setPolling(false);
          toast.error(t.error);
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        setPolling(false);
      }
    };
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, successPath]);

  const applyDiscountCode = () => {
    // Case-sensitive: code must be entered in UPPERCASE exactly (e.g. "AMDSH75").
    const raw = discountCodeInput.trim();
    const code = DISCOUNT_CODES[raw];
    if (code) {
      setAppliedDiscount({ ...code, code: raw });
      toast.success(lang === "ar" ? "تم تطبيق كود الخصم!" : "Discount code applied!");
    } else {
      setAppliedDiscount(null);
      toast.error(
        lang === "ar"
          ? "كود الخصم غير صالح (يجب أن يكون بحروف كبيرة)."
          : "Invalid discount code (uppercase only)."
      );
    }
  };

  const handleFreeActivation = async () => {
    if (!user) {
      toast.error(lang === "ar" ? "سجّل الدخول أولاً" : "Please login first");
      navigate("/login");
      return;
    }
    if (!appliedDiscount?.code) {
      toast.error(lang === "ar" ? "أدخل كود خصم صالح" : "Enter a valid discount code");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/redeem-code`, { code: appliedDiscount.code });
      await checkAuth();
      setPaid(true);
      toast.success(lang === "ar" ? "تم تفعيل البريميوم مجاناً! 🎉" : "Premium activated for free! 🎉");
      setTimeout(() => navigate("/vault"), 1800);
    } catch (e) {
      const msg = e?.response?.data?.detail || (lang === "ar" ? "حدث خطأ" : "Something went wrong");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const openPlayStore = () => {
    window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    toast.success(
      lang === "ar"
        ? "افتحنا متجر Google Play لك. اشترك من داخل التطبيق."
        : "Opening Google Play. Subscribe from inside the app."
    );
  };

  // ALREADY-PREMIUM screen: when an existing subscriber visits /premium, greet them and
  // hide the plan cards / discount form (those would be confusing/redundant). The nav link
  // stays visible per UX requirement so users can always come here to check their status.
  if (user?.is_premium && !successPath && !paid) {
    return (
      <div className="min-h-screen bg-grain px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto vault-card rounded-3xl p-8 md:p-12 text-center glow-gold-strong">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-600/10 border border-amber-500/50 mb-6 relative">
            <Crown className="w-10 h-10 text-amber-400 fill-amber-400" />
            <div className="absolute -top-1 -end-1 w-7 h-7 rounded-full bg-green-500/90 border-2 border-[#0f0f13] flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-mono uppercase tracking-widest mb-4">
            <Check className="w-3.5 h-3.5" />
            {lang === "ar" ? "اشتراك نشط" : "Active Subscription"}
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3" dir="auto">
            <span className="shine-text">
              {lang === "ar" ? "أنت مشترك في Premium 🎉" : "You're a Premium member 🎉"}
            </span>
          </h1>

          <p className="text-zinc-400 text-base md:text-lg max-w-md mx-auto leading-relaxed mb-8" dir="auto">
            {lang === "ar"
              ? "تم تفعيل اشتراكك بنجاح. كل المزايا الحصرية مُتاحة لك الآن — استمتع 🚀"
              : "Your subscription is active. All exclusive features are unlocked — enjoy 🚀"}
          </p>

          <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto text-start mb-8" dir="auto">
            {[
              lang === "ar" ? "الوصول الكامل لخزنة الأسرار (150+ سراً)" : "Full access to the Secrets Vault (150+ secrets)",
              lang === "ar" ? "أداة الربط بالأسرار بلا حدود" : "Unlimited Secrets Matcher tool",
              lang === "ar" ? "مولّد الهوكس والمحتوى بدون قيود" : "Unlimited hooks & content generation",
              lang === "ar" ? "دعم أولوية وميزات قادمة" : "Priority support & upcoming features",
            ].map((line) => (
              <div key={line} className="flex items-start gap-2 rounded-xl bg-white/5 border border-white/10 p-3">
                <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-200">{line}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate("/vault")}
              className="h-12 px-6 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110 shadow-[0_0_25px_rgba(255,184,0,0.35)]"
              data-testid="go-to-vault-btn"
            >
              <Crown className="w-4 h-4 me-2" />
              {lang === "ar" ? "اذهب إلى خزنة الأسرار" : "Go to the Vault"}
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="h-12 px-6 bg-transparent border-white/15 hover:bg-white/5 text-white"
            >
              {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
            </Button>
          </div>

          {/* Subscription details + cancel (Google Play subscriptions only) */}
          {subStatus && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5 text-start space-y-3" data-testid="subscription-details">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Row label={lang === "ar" ? "المصدر" : "Source"} value={
                  subStatus.premium_source === "owner" ? (lang === "ar" ? "Owner" : "Owner")
                  : subStatus.premium_source === "discount" ? (lang === "ar" ? "كود خصم" : "Discount code")
                  : subStatus.premium_source === "google_play" ? "Google Play"
                  : "-"
                } />
                <Row label={lang === "ar" ? "النوع" : "Plan"} value={
                  subStatus.subscription_type === "yearly" ? (lang === "ar" ? "سنوي" : "Yearly")
                  : subStatus.subscription_type === "monthly" ? (lang === "ar" ? "شهري" : "Monthly")
                  : "-"
                } />
                <Row label={lang === "ar" ? "ينتهي في" : "Expires"} value={
                  subStatus.premium_expires_at ? new Date(subStatus.premium_expires_at).toLocaleDateString() : "-"
                } />
                <Row label={lang === "ar" ? "حالة التجديد" : "Auto-renew"} value={
                  subStatus.subscription_cancelled
                    ? (lang === "ar" ? "ملغى ✕" : "Cancelled ✕")
                    : (lang === "ar" ? "مفعّل ✓" : "Active ✓")
                } />
              </div>
              {subStatus.premium_source === "google_play" && !subStatus.subscription_cancelled && (
                <Button
                  onClick={onCancelSubscription}
                  disabled={cancelling}
                  variant="outline"
                  data-testid="cancel-subscription-btn"
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10 w-full sm:w-auto"
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === "ar" ? "إلغاء التجديد التلقائي" : "Cancel auto-renewal")}
                </Button>
              )}
              {subStatus.subscription_cancelled && (
                <p className="text-xs text-amber-300">
                  {lang === "ar"
                    ? "تم إلغاء التجديد التلقائي — تبقى الميزات نشطة حتى تاريخ الانتهاء."
                    : "Auto-renewal cancelled — features remain active until expiry."}
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-zinc-500 mt-6" dir="auto">
            {lang === "ar"
              ? "لإلغاء الاشتراك أو إدارة الفوترة، تواصل مع الدعم."
              : "To cancel or manage billing, contact support."}
          </p>
        </div>
      </div>
    );
  }


  if (successPath || (paid && appliedDiscount)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grain px-4">
        <div className="vault-card rounded-3xl p-10 max-w-md text-center glow-gold-strong">
          {polling || (loading && appliedDiscount) ? (
            <>
              <Loader2 className="w-10 h-10 text-amber-400 mx-auto animate-spin mb-4" />
              <p className="text-white font-bold">{t.paymentPending}</p>
            </>
          ) : paid ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-black shine-text mb-2">{t.paymentSuccess}</h2>
              <p className="text-zinc-400 text-sm">{lang === "ar" ? "نرسلك للخزنة..." : "Redirecting to vault..."}</p>
            </>
          ) : (
            <>
              <p className="text-white mb-4">{t.error}</p>
              <Link to="/premium">
                <Button className="bg-amber-500 text-black">{lang === "ar" ? "حاول مرة أخرى" : "Try again"}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-grain min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest">
            <Crown className="w-3.5 h-3.5" /> PREMIUM
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            <span className="shine-text">{t.premiumTitle}</span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">{t.premiumDesc}</p>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 text-xs">
            <Smartphone className="w-3.5 h-3.5" />
            {lang === "ar"
              ? "الاشتراك عبر Google Play — مباشرة من التطبيق"
              : "Subscribe via Google Play — straight from the app"}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => (
            <GooglePlayCard
              key={key}
              plan={key}
              data={plan}
              onClick={openPlayStore}
              discount={appliedDiscount}
              onFreeActivate={handleFreeActivation}
              loading={loading}
            />
          ))}
        </div>

        <div className="max-w-sm mx-auto text-center">
            <label htmlFor="discount" className="block text-sm font-medium leading-6 text-zinc-400 mb-2">{lang === 'ar' ? 'عندك كود خصم؟' : 'Have a discount code?'}</label>
            <div className="flex gap-2">
                <Input
                    type="text"
                    name="discount"
                    id="discount"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6 text-center"
                    placeholder={lang === 'ar' ? 'أدخل الكود هنا' : 'Enter code here'}
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                />
                <Button onClick={applyDiscountCode} className="font-bold">
                    {t.apply || (lang === 'ar' ? 'تطبيق' : 'Apply')}
                </Button>
            </div>
        </div>

        <div className="text-center space-y-3">
          <Link to="/vault" className="text-zinc-500 hover:text-amber-400 text-sm inline-flex items-center gap-1 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.backToVault}
          </Link>
          <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
            {lang === "ar"
              ? "حمّل تطبيق Kateb من Google Play ثم اشترك شهرياً من داخل التطبيق. الاشتراك يُفعّل تلقائياً على حسابك."
              : "Install the Kateb app from Google Play, then subscribe monthly from inside the app. Subscription activates on your account automatically."}
          </p>
        </div>
      </div>
    </div>
  );
}

function GooglePlayCard({ plan, data, onClick, discount, onFreeActivate, loading }) {
  const { t, lang } = useApp();
  const isYearly = plan === "yearly";

  const originalPrice = data.price;
  const finalPrice = discount ? originalPrice * (1 - discount.discount) : originalPrice;
  const isFree = finalPrice <= 0;

  const features = lang === "ar"
    ? [
        "+50 سر خوارزمية لكل منصة (Instagram، TikTok، YouTube Shorts)",
        "تحديث دوري للأسرار مع تحديثات المنصات",
        "أداة AI لمطابقة محتواك مع الأسرار بلا حدود",
        "بداية فيديو احترافية لكل محتوى",
        "15 هوك بدل 5 في كل توليد",
        "حفظ كل المحتوى المولّد",
        "بدون أي إعلانات",
        ...(isYearly ? ["وفّر 50% مقارنة بالاشتراك الشهري"] : []),
      ]
    : [
        "50 algorithm secrets per platform (Instagram, TikTok, Shorts)",
        "Periodic updates with platform changes",
        "Unlimited AI Secrets-Matcher tool",
        "Pro video opening for every content",
        "15 hooks per generation (instead of 5)",
        "Save all generated content",
        "Ad-free experience",
        ...(isYearly ? ["Save 50% vs monthly"] : []),
      ];

  return (
    <div
      className={`relative rounded-3xl p-8 transition-all ${
        isYearly
          ? "vault-card glow-gold-strong border border-amber-500/40"
          : "bg-[#0f0f13] border border-white/10 hover:border-amber-500/30"
      }`}
      data-testid={`plan-${plan}`}
    >
      <span className={`absolute -top-3 inline-end-6 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest ${
        isYearly ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black" : "bg-white/10 text-zinc-300 border border-white/10"
      }`}>
        {isYearly ? (lang === "ar" ? "الأفضل قيمة" : "Best Value") : (lang === "ar" ? "اشتراك شهري" : "Monthly")}
      </span>
      <h3 className="text-2xl font-black text-white mb-1">{t[data.label]}</h3>
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-5xl font-black shine-text">{isFree ? "$0" : `$${data.price}`}</span>
        {!isFree && <span className="text-zinc-500 text-sm">{t[data.period]}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
            <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={isFree ? onFreeActivate : onClick}
        disabled={loading}
        data-testid={`subscribe-${plan}`}
        className={`w-full h-12 font-bold ${
          isYearly
            ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:brightness-110 shadow-[0_0_30px_rgba(255,184,0,0.5)]"
            : "bg-white text-black hover:bg-zinc-200"
        }`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          isFree ? (lang === "ar" ? "تفعيل مجاني" : "Activate Free") : (
            <>
              {/* Google Play glyph */}
              <svg className="w-5 h-5 me-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M3.6 1.7c-.3.3-.5.7-.5 1.3v18c0 .6.2 1.1.5 1.3l11-11-11-9.6zM16.8 14.3l-2.5-2.5L4 21.9c.5.2 1.1.1 1.8-.2L16.8 14.3zM20.6 10.5l-3.3-1.9-2.7 2.7 2.7 2.7 3.3-1.9c1-.6 1-2 0-2.6zM5.8 2.3c-.7-.4-1.3-.4-1.8-.2L14.3 11.8 16.8 9.3 5.8 2.3z"/>
              </svg>
              {lang === "ar" ? "اشترك عبر Google Play" : "Subscribe via Google Play"}
            </>
          )
        )}
      </Button>
      <p className="text-xs text-zinc-500 text-center mt-3" dir="auto">
        {lang === "ar"
          ? "الفوترة والإلغاء يُداران بالكامل من Google Play."
          : "Billing and cancellation managed entirely by Google Play."}
      </p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="text-sm text-white font-semibold">{value}</div>
    </div>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { CreditCard, Sparkles, Loader2, Smartphone, Crown, Coins } from "lucide-react";

const PRICE_PER_CREDIT_USD = 0.10; // Custom slider only: each credit = 10¢ (fixed packs above use their own pricing).

// Google Play subscriptions/purchases — the ONLY paid path. Web visitors are guided
// to open the Kateb mobile app and complete checkout via Google Play.
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.kateb.mobile";

function openPlayStoreForProduct(productId, lang) {
  // Pass the product id as a referrer so the mobile app can deep-link straight
  // into the right purchase sheet (handled inside the app build).
  const target = `${PLAY_STORE_URL}&referrer=${encodeURIComponent(`pack=${productId}`)}`;
  window.open(target, "_blank", "noopener,noreferrer");
  toast.success(
    lang === "ar"
      ? "افتحنا Google Play لك. أكمل الشراء من داخل التطبيق."
      : "Opening Google Play. Complete checkout inside the app."
  );
}

// Inline Google Play glyph (matches Premium page).
function PlayGlyph({ className = "w-5 h-5 me-2" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.6 1.7c-.3.3-.5.7-.5 1.3v18c0 .6.2 1.1.5 1.3l11-11-11-9.6zM16.8 14.3l-2.5-2.5L4 21.9c.5.2 1.1.1 1.8-.2L16.8 14.3zM20.6 10.5l-3.3-1.9-2.7 2.7 2.7 2.7 3.3-1.9c1-.6 1-2 0-2.6zM5.8 2.3c-.7-.4-1.3-.4-1.8-.2L14.3 11.8 16.8 9.3 5.8 2.3z"/>
    </svg>
  );
}

export default function Credits() {
  const { lang, user, loadingUser } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState(100);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API}/credits/packages`);
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) toast.error(lang === "ar" ? "تعذّر تحميل الباقات" : "Could not load packages");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  const customPrice = useMemo(() => (custom * PRICE_PER_CREDIT_USD).toFixed(2), [custom]);

  if (!loadingUser && !user) {
    return (
      <div className="bg-grain min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <CreditCard className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-black text-white">
            {lang === "ar" ? "شراء الكريديت" : "Buy Credits"}
          </h1>
          <p className="text-zinc-400">
            {lang === "ar" ? "سجّل الدخول لشراء الكريديت" : "Please login to buy credits"}
          </p>
          <Link to="/login">
            <Button data-testid="credits-login-btn" className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold">
              {lang === "ar" ? "تسجيل دخول" : "Login"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-grain min-h-screen" data-testid="credits-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            <span className="shine-text">{lang === "ar" ? "شراء الكريديت 💳" : "Buy Credits 💳"}</span>
          </h1>
          <p className="text-zinc-400">
            {lang === "ar"
              ? "كل كريديت = رسالة واحدة مع كاتب AI. الـ Premium يلغي الحدود."
              : "1 credit = 1 message with Kateb AI. Premium removes all limits."}
          </p>
        </div>

        {/* Current balance */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#0f0f13] to-black p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                {lang === "ar" ? "رصيدك" : "Your balance"}
              </p>
              <p className="text-3xl font-black text-white" data-testid="credits-balance">
                {user?.is_premium ? "∞" : (user?.credits ?? 0)}
              </p>
            </div>
          </div>
          {user?.is_premium ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-mono uppercase tracking-widest">
              <Crown className="w-3.5 h-3.5" />
              {lang === "ar" ? "Premium — غير محدود" : "Premium — Unlimited"}
            </span>
          ) : (
            <Link to="/premium">
              <Button className="bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 font-semibold">
                <Crown className="w-4 h-4 me-1.5" />
                {lang === "ar" ? "احصل على Premium للحد غير المحدود" : "Get Premium for unlimited"}
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-amber-400 animate-spin" /></div>
        ) : data ? (
          <>
            {/* Fixed packs */}
            <div>
              <h2 className="text-lg font-bold text-white mb-3">
                {lang === "ar" ? "باقات جاهزة" : "Fixed packages"}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {data.fixed.map((p) => (
                  <PackCard
                    key={p.product_id}
                    credits={p.credits}
                    price={p.price_usd}
                    productId={p.product_id}
                    lang={lang}
                  />
                ))}
              </div>
            </div>

            {/* Custom slider */}
            <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {lang === "ar" ? "أو حدّد المبلغ الذي تريده" : "Or pick your own amount"}
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {lang === "ar"
                    ? `بين ${data.custom.min_credits} و ${data.custom.max_credits.toLocaleString()} كريديت`
                    : `Between ${data.custom.min_credits} and ${data.custom.max_credits.toLocaleString()} credits`}
                </p>
              </div>
              <div className="space-y-3">
                <Slider
                  data-testid="credits-custom-slider"
                  value={[custom]}
                  min={data.custom.min_credits}
                  max={Math.min(5000, data.custom.max_credits)}
                  step={1}
                  onValueChange={(v) => setCustom(v[0])}
                />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      data-testid="credits-custom-input"
                      value={custom}
                      min={data.custom.min_credits}
                      max={data.custom.max_credits}
                      step={1}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        if (Number.isNaN(raw)) return;
                        const clamped = Math.max(
                          data.custom.min_credits,
                          Math.min(data.custom.max_credits, raw)
                        );
                        setCustom(clamped);
                      }}
                      className="w-28 h-11 rounded-xl bg-[#16161d] border border-white/10 text-amber-400 text-xl font-black text-center tracking-wider focus-visible:outline-none focus:border-amber-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-zinc-400 text-sm font-mono uppercase tracking-widest">
                      {lang === "ar" ? "كريديت" : "credits"}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-white" data-testid="credits-custom-price">${customPrice}</span>
                </div>
                <p className="text-xs text-zinc-500">
                  {lang === "ar"
                    ? `أو اكتب الرقم اللي تبيه بالضبط (من ${data.custom.min_credits} إلى ${data.custom.max_credits.toLocaleString()})`
                    : `Or type the exact amount you want (${data.custom.min_credits}–${data.custom.max_credits.toLocaleString()})`}
                </p>
              </div>
              <CheckoutNotice lang={lang} productId={`${data.custom.sku_prefix}${custom}`} />
              <Button
                onClick={() => openPlayStoreForProduct(`${data.custom.sku_prefix}${custom}`, lang)}
                data-testid="credits-custom-buy"
                className="w-full h-12 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110 shadow-[0_0_22px_rgba(255,184,0,0.4)]"
              >
                <PlayGlyph className="w-5 h-5 me-2" />
                {lang === "ar"
                  ? `ادفع $${customPrice} عبر Google Play`
                  : `Pay $${customPrice} with Google Play`}
              </Button>
            </div>
          </>
        ) : null}

        {/* Mobile-only purchase notice */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0d] p-5 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm text-zinc-400">
            <p className="text-white font-semibold mb-1">
              {lang === "ar" ? "الشراء يتم داخل تطبيق Google Play" : "Purchases happen inside the Google Play app"}
            </p>
            <p>
              {lang === "ar"
                ? "افتح تطبيق كاتب على هاتفك واختر الباقة لإكمال الدفع عبر Google Play. الكريديت يظهر تلقائياً هنا بعد التحقق."
                : "Open the Kateb mobile app and pick a pack to checkout via Google Play. Credits appear here automatically after verification."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackCard({ credits, price, productId, lang }) {
  return (
    <div
      data-testid={`credit-pack-${productId}`}
      className="rounded-2xl border border-white/10 bg-[#0f0f13] p-4 space-y-3 hover:border-amber-500/40 transition group flex flex-col"
    >
      <div className="flex items-center justify-between">
        <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">{productId}</span>
      </div>
      <div>
        <p className="text-3xl font-black text-white">{credits.toLocaleString()}</p>
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-0.5">
          {lang === "ar" ? "كريديت" : "credits"}
        </p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-2xl font-black text-amber-400">${price}</span>
        <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
          {lang === "ar" ? "عبر Google Play" : "via Google Play"}
        </span>
      </div>
      <Button
        onClick={() => openPlayStoreForProduct(productId, lang)}
        data-testid={`credit-pack-buy-${productId}`}
        className="w-full h-10 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110 shadow-[0_0_18px_rgba(255,184,0,0.35)]"
      >
        <PlayGlyph className="w-4 h-4 me-2" />
        {lang === "ar" ? "ادفع عبر Google Play" : "Pay with Google Play"}
      </Button>
    </div>
  );
}

function CheckoutNotice({ lang }) {
  return (
    <p className="text-xs text-zinc-500 leading-relaxed">
      {lang === "ar"
        ? "ملاحظة: الشراء يتم عبر تطبيق الموبايل (Google Play). على الويب نعرض الباقات فقط — افتح التطبيق على هاتفك لإتمام عملية الشراء."
        : "Note: Purchase happens via the mobile app (Google Play). Here on the web we only preview packages — open the Kateb mobile app to complete checkout."}
    </p>
  );
}

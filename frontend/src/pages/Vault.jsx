import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SECRETS, getNumberedSecrets } from "@/lib/secrets-data";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { Lock, Unlock, Sparkles, Loader2, Wand2, RefreshCw, Crown, Clock, Hash, PlayCircle, Copy } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import AdWatchModal from "@/components/AdWatchModal";
import ShareButton from "@/components/ShareButton";

// Group secrets by category, preserving the order of first appearance.
// Returns an array of { category: string, items: [{secret, originalIndex}] }
function groupByCategory(secrets, lang) {
  const map = new Map();
  secrets.forEach((sec, idx) => {
    const cat = sec[lang]?.category || "";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push({ secret: sec, originalIndex: idx });
  });
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

const PLATFORM_META = {
  instagram: { icon: FaInstagram, color: "#E1306C", label: "Instagram" },
  tiktok: { icon: FaTiktok, color: "#ffffff", label: "TikTok" },
  shorts: { icon: FaYoutube, color: "#FF0000", label: "YouTube Shorts" },
};

export default function Vault() {
  const { t, lang, user } = useApp();
  const [active, setActive] = useState("instagram");
  const isPremium = !!user?.is_premium;

  return (
    <div className="bg-grain min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest mb-3">
              <Lock className="w-3 h-3" /> VAULT
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              <span className="shine-text">{t.vaultTitle}</span>
            </h1>
            <p className="text-zinc-400 mt-2 max-w-2xl">{t.vaultSubtitle}</p>
          </div>
          {!isPremium && (
            <Link to="/premium">
              <Button data-testid="upgrade-btn" className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-[0_0_20px_rgba(255,184,0,0.4)]">
                <Unlock className="w-4 h-4 me-2" />
                {t.unlockPremium}
              </Button>
            </Link>
          )}
        </div>

        <AdBanner />

        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="bg-[#0f0f13] border border-white/10 p-1 h-auto rounded-xl flex flex-wrap">
            {Object.entries(PLATFORM_META).map(([id, meta]) => {
              const Icon = meta.icon;
              return (
                <TabsTrigger
                  key={id}
                  value={id}
                  data-testid={`vault-tab-${id}`}
                  className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/30 border border-transparent rounded-lg flex items-center gap-2 px-4 py-2.5"
                >
                  <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  <span className="font-bold">{meta.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(SECRETS).map(([platform, data]) => {
            const premiumGroups = groupByCategory(data.premium, lang);
            const freeGroups = groupByCategory(data.free, lang);
            return (
            <TabsContent key={platform} value={platform} className="mt-8 space-y-10">
              {/* Matcher Tool */}
              <MatcherTool platform={platform} isPremium={isPremium} />

              {/* Update Badge */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest">
                  <RefreshCw className="w-3 h-3" />
                  {lang === "ar" ? "يُحدَّث مع تحديثات المنصات" : "Updated with platform updates"}
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {lang === "ar" ? `إجمالي: ${data.premium.length + data.free.length} سر` : `Total: ${data.premium.length + data.free.length} secrets`}
                </span>
              </div>

              {/* Free Secrets */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white">{t.secretsFree}</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 font-mono uppercase">
                    {t.free}
                  </span>
                </div>
                {freeGroups.map((group, gi) => (
                  <div key={`free-${gi}`} className="mb-6 last:mb-0">
                    {group.category && (
                      <h3 className="text-sm md:text-base font-bold text-amber-300/90 mb-3 ps-3 border-s-2 border-amber-500/40" dir="auto">
                        {group.category}
                      </h3>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                      {group.items.map(({ secret, originalIndex }) => (
                        <SecretCard
                          key={originalIndex}
                          secret={secret[lang]}
                          locked={false}
                          index={originalIndex + 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              {/* Premium Secrets — grouped by category */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white">{t.secretsPremium}</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono uppercase">
                    {data.premium.length} Premium
                  </span>
                </div>
                {premiumGroups.map((group, gi) => (
                  <div key={`premium-${gi}`} className="mb-8 last:mb-0">
                    {group.category && (
                      <h3
                        className="text-base md:text-lg font-bold text-amber-300/90 mb-4 ps-3 border-s-2 border-amber-500/40"
                        dir="auto"
                        data-testid={`vault-section-${platform}-${gi}`}
                      >
                        {group.category}
                      </h3>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                      {group.items.map(({ secret, originalIndex }) => (
                        <SecretCard
                          key={originalIndex}
                          secret={secret[lang]}
                          locked={!isPremium}
                          index={data.free.length + originalIndex + 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}

function SecretCard({ secret, locked, index }) {
  return (
    <div
      className={`relative rounded-2xl p-5 transition-all duration-300 ${
        locked
          ? "bg-[#0a0a0d] border border-white/5"
          : "vault-card hover:-translate-y-1 hover:border-amber-500/40"
      }`}
      data-testid={`secret-card-${index}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xs font-mono text-amber-400/70 mt-1">#{String(index).padStart(2, "0")}</span>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-bold text-base mb-2 ${locked ? "text-zinc-500" : "text-white"}`}
            dir="auto"
          >
            {locked ? "🔒 ••••••••••••" : secret.title}
          </h3>
          <p
            className={`text-sm leading-relaxed bidi-plaintext ${locked ? "text-zinc-700 blur-sm select-none" : "text-zinc-300"}`}
            dir="auto"
          >
            {locked ? "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor." : secret.body}
          </p>
          {!locked && (
            <div className="mt-3 flex justify-end">
              <ShareButton text={`#${index} ${secret.title}\n\n${secret.body}`} testid={`secret-share-${index}`} />
            </div>
          )}
          {locked && (
            <Link to="/premium" className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-amber-400 hover:text-amber-300">
              <Lock className="w-3 h-3" />
              Unlock Premium
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function MatcherTool({ platform, isPremium }) {
  const { t, lang, user } = useApp();
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null); // { analysis_data, analysis }
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [adOpen, setAdOpen] = useState(false);
  const FREE_LIMIT = 3;

  // Fetch current usage on mount / when user changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get(`${API}/match/usage`);
        if (!cancelled) setUsage(res.data);
      } catch (err) {
        // 401 = anonymous user — not an error worth surfacing.
        if (err?.response?.status && err.response.status !== 401) {
          console.warn("[Vault] match/usage failed:", err.response.status);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.user_id, user?.is_premium]);

  const remaining = usage?.remaining ?? FREE_LIMIT;
  const limitReached = !isPremium && !!user && remaining <= 0;
  const needsLogin = !user;

  const run = async () => {
    if (!user) {
      toast.error(lang === "ar" ? "سجّل الدخول لاستخدام هذه الأداة" : "Please login to use this tool");
      return;
    }
    if (limitReached) {
      toast.error(lang === "ar" ? "انتهت محاولاتك المجانية. ترقّى إلى Premium." : "Free attempts exhausted. Upgrade to Premium.");
      return;
    }
    if (!content.trim()) {
      toast.error(lang === "ar" ? "اكتب محتواك" : "Enter your content");
      return;
    }
    setLoading(true);
    try {
      // Include the platform's 50 secrets so the LLM picks 5 BY NUMBER from our actual vault.
      const numbered = getNumberedSecrets(platform, lang);
      const res = await axios.post(`${API}/generate/match`, {
        platform,
        content,
        language: lang,
        secrets: numbered.map((s) => ({ number: s.number, title: s.title })),
      });
      // Attach the local title lookup so the renderer can show "السر #N — title".
      const titlesByNumber = numbered.reduce((acc, s) => {
        acc[s.number] = s.title;
        return acc;
      }, {});
      setResult({
        analysis_data: res.data.analysis_data,
        analysis: res.data.analysis,
        titlesByNumber,
      });
      setUsage({
        authenticated: true,
        is_premium: res.data.is_premium,
        used: res.data.used,
        bonus: res.data.bonus ?? 0,
        limit: res.data.limit,
        remaining: res.data.remaining,
        // Preserve ad-stat fields from previous usage object so the "Watch Ad" CTA stays accurate.
        ads_watched_today: usage?.ads_watched_today ?? 0,
        ads_daily_limit: usage?.ads_daily_limit ?? 10,
        ads_remaining_today: usage?.ads_remaining_today ?? 10,
      });
      if (!res.data.is_premium && typeof res.data.remaining === "number") {
        toast.success(
          lang === "ar"
            ? `تم! تبقّى لك ${res.data.remaining} من ${FREE_LIMIT} محاولات مجانية.`
            : `Done! ${res.data.remaining} of ${FREE_LIMIT} free attempts left.`
        );
      }
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.detail;
      if (status === 401) {
        toast.error(lang === "ar" ? "سجّل الدخول أولاً" : "Please login first");
      } else if (status === 403) {
        toast.error(msg || (lang === "ar" ? "انتهت محاولاتك المجانية" : "Free attempts exhausted"));
        // Refresh usage to reflect locked state
        try {
          const u = await axios.get(`${API}/match/usage`);
          setUsage(u.data);
        } catch (refreshErr) {
          console.warn("[Vault] usage refresh failed:", refreshErr?.response?.status);
        }
      } else {
        toast.error(msg || t.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vault-card rounded-3xl p-6 md:p-8 glow-gold relative overflow-hidden">
      {/* Premium badge in corner */}
      <div className="absolute top-4 end-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-mono uppercase tracking-widest">
        <Crown className="w-3 h-3" />
        Premium
      </div>

      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/10 border border-amber-500/50 flex items-center justify-center shrink-0">
          <Wand2 className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white">{t.matcher}</h2>
          <p className="text-sm text-zinc-400 mt-1">{t.matcherDesc}</p>
        </div>
      </div>

      {/* Status bar: login / free attempts / premium */}
      {needsLogin ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-amber-200">
            {lang === "ar" ? "سجّل الدخول للحصول على 3 محاولات مجانية" : "Login to get 3 free attempts"}
          </p>
          <Link to="/login">
            <Button size="sm" className="bg-amber-500 text-black font-bold">
              {lang === "ar" ? "تسجيل دخول" : "Login"}
            </Button>
          </Link>
        </div>
      ) : isPremium ? (
        <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/5 p-3 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <p className="text-sm text-green-300">
            {lang === "ar" ? "وصول غير محدود — Premium نشط ✓" : "Unlimited access — Premium active ✓"}
          </p>
        </div>
      ) : limitReached ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-red-300">
            {lang === "ar"
              ? `انتهت محاولاتك المجانية (${FREE_LIMIT}/${FREE_LIMIT}). شاهد إعلاناً للحصول على محاولة مجانية، أو ترقّى إلى Premium.`
              : `Free attempts exhausted (${FREE_LIMIT}/${FREE_LIMIT}). Watch an ad for a free attempt, or upgrade.`}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {usage && usage.ads_remaining_today > 0 && (
              <Button
                data-testid="watch-ad-btn"
                size="sm"
                onClick={() => setAdOpen(true)}
                className="bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 font-semibold"
              >
                <PlayCircle className="w-4 h-4 me-1.5" />
                {lang === "ar"
                  ? `شاهد إعلاناً (${usage.ads_remaining_today}/${usage.ads_daily_limit})`
                  : `Watch Ad (${usage.ads_remaining_today}/${usage.ads_daily_limit})`}
              </Button>
            )}
            <Link to="/premium">
              <Button size="sm" className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold">
                <Crown className="w-4 h-4 me-1.5" />
                {lang === "ar" ? "ترقية" : "Upgrade"}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-amber-200">
            {lang === "ar"
              ? `محاولات مجانية متبقية: ${remaining} / ${FREE_LIMIT}${(usage?.bonus ?? 0) > 0 ? ` (+${usage.bonus} مكافأة)` : ""}`
              : `Free attempts remaining: ${remaining} / ${FREE_LIMIT}${(usage?.bonus ?? 0) > 0 ? ` (+${usage.bonus} bonus)` : ""}`}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {usage && usage.ads_remaining_today > 0 && (
              <button
                data-testid="watch-ad-link"
                onClick={() => setAdOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-mono uppercase tracking-widest flex items-center gap-1"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                {lang === "ar"
                  ? `شاهد إعلاناً للحصول على محاولة مجانية (${usage.ads_remaining_today}/${usage.ads_daily_limit})`
                  : `Watch ad for a free attempt (${usage.ads_remaining_today}/${usage.ads_daily_limit})`}
              </button>
            )}
            <Link to="/premium" className="text-xs text-amber-400 hover:text-amber-300 font-mono uppercase tracking-widest">
              {lang === "ar" ? "افتح غير محدود ←" : "Unlock unlimited →"}
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Textarea
          data-testid="matcher-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={lang === "ar" ? "الصق محتواك أو اكتب فكرة الفيديو..." : "Paste your content or video idea..."}
          className="bg-black border-amber-500/20 min-h-28 text-white focus-visible:ring-amber-500/50"
          disabled={needsLogin || limitReached}
        />
        <Button
          onClick={run}
          disabled={loading || needsLogin || limitReached}
          data-testid="matcher-run-btn"
          className="w-full h-12 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110 shadow-[0_0_25px_rgba(255,184,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {t.analyzing}</> : <><Sparkles className="w-4 h-4 me-2" /> {t.analyze}</>}
        </Button>

        {result && (
          <MatcherResult result={result} lang={lang} />
        )}
      </div>

      <AdWatchModal
        open={adOpen}
        onClose={() => setAdOpen(false)}
        onClaimed={async () => {
          // Refresh usage so the UI re-enables the input + matcher button.
          try {
            const u = await axios.get(`${API}/match/usage`);
            setUsage(u.data);
          } catch (err) {
            console.warn("[Vault] refresh usage after match failed:", err?.response?.status || err?.message);
          }
        }}
      />
    </div>
  );
}

/**
 * Pretty-renders the matcher result. Prefers the structured `analysis_data` JSON
 * returned by the backend; falls back to plain text (with markdown stripped server-side)
 * if the LLM failed to return valid JSON.
 *
 * For each matched secret we show a clear "Secret #N — title" header + the actionable
 * "how" body. No markdown chars, no asterisks.
 */
function MatcherResult({ result, lang }) {
  const ar = lang === "ar";
  const data = result?.analysis_data;
  const titlesByNumber = result?.titlesByNumber || {};
  const shareText = buildPlainTextSummary(data, result?.analysis, titlesByNumber, ar);

  const copyAll = async () => {
    const text = buildPlainTextSummary(data, result.analysis, titlesByNumber, ar);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(ar ? "تم النسخ" : "Copied");
    } catch {
      toast.error(ar ? "تعذّر النسخ" : "Copy failed");
    }
  };

  // Fallback: no structured JSON — render the plain (already-cleaned) text.
  if (!data || typeof data !== "object") {
    return (
      <div className="mt-4 rounded-xl bg-black border border-amber-500/30 p-5">
        <p
          className="text-white text-sm leading-relaxed whitespace-pre-wrap font-arabic bidi-plaintext"
          data-testid="matcher-result"
          dir="auto"
        >
          {result?.analysis || ""}
        </p>
      </div>
    );
  }

  const matched = Array.isArray(data.matched_secrets) ? data.matched_secrets : [];
  const opening = data.opening || "";
  const bestTime = data.best_time || "";
  const hashtags = Array.isArray(data.hashtags) ? data.hashtags : [];

  return (
    <div
      className="mt-4 rounded-xl bg-black border border-amber-500/30 p-5 space-y-6"
      data-testid="matcher-result"
      dir="auto"
    >
      {/* Header with copy-all */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-base font-bold text-amber-300 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {ar ? "تحليلك جاهز" : "Your analysis"}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={copyAll}
            data-testid="matcher-copy-btn"
            className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 h-8"
          >
            <Copy className="w-3.5 h-3.5 me-1.5" /> {ar ? "نسخ" : "Copy"}
          </Button>
          <ShareButton text={shareText} testid="matcher-share-btn" />
        </div>
      </div>

      {/* Matched secrets — the headline section */}
      {matched.length > 0 && (
        <section className="space-y-3">
          <SectionHeader icon={<Wand2 className="w-4 h-4" />}>
            {ar ? "أفضل 5 أسرار تناسب محتواك" : "Top 5 secrets for your content"}
          </SectionHeader>
          <ol className="space-y-3">
            {matched.map((s, idx) => {
              const num = typeof s.number === "number" ? s.number : null;
              const fallbackTitle = s.title || "";
              const title = (num != null && titlesByNumber[num]) || fallbackTitle;
              return (
                <li
                  key={num ?? `m-${idx}`}
                  data-testid={`matched-secret-${num ?? idx}`}
                  className="rounded-lg bg-[#0a0a0d] border border-amber-500/15 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[44px] h-7 px-2 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                      {ar ? `سر #${num ?? "—"}` : `#${num ?? "—"}`}
                    </span>
                    {title && (
                      <span className="text-amber-100 text-sm font-bold leading-snug">
                        {title}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-200 text-sm leading-relaxed mt-3" dir="auto">
                    {stripInlineMarkdown(s.how || "")}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Opening script */}
      {opening && (
        <section className="space-y-2">
          <SectionHeader icon={<PlayCircle className="w-4 h-4" />}>
            {ar ? "بداية الفيديو المثالية (أول 3 ثوان)" : "Ideal opening (first 3s)"}
          </SectionHeader>
          <div className="rounded-lg bg-[#0a0a0d] border border-white/10 p-4">
            <p className="text-zinc-100 text-sm leading-relaxed" dir="auto">
              {stripInlineMarkdown(opening)}
            </p>
          </div>
        </section>
      )}

      {/* Best posting time */}
      {bestTime && (
        <section className="space-y-2">
          <SectionHeader icon={<Clock className="w-4 h-4" />}>
            {ar ? "أفضل وقت للنشر" : "Best posting time"}
          </SectionHeader>
          <p className="text-zinc-200 text-sm leading-relaxed" dir="auto">
            {stripInlineMarkdown(bestTime)}
          </p>
        </section>
      )}

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <section className="space-y-2">
          <SectionHeader icon={<Hash className="w-4 h-4" />}>
            {ar ? "هاشتاقات استراتيجية" : "Strategic hashtags"}
          </SectionHeader>
          <div className="flex flex-wrap gap-2" dir="ltr">
            {hashtags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const SectionHeader = ({ icon, children }) => (
  <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400/80 inline-flex items-center gap-2">
    {icon}
    <span>{children}</span>
  </h4>
);

// Strip residual markdown noise (**, __, ##, ---) that might leak from the LLM.
function stripInlineMarkdown(s) {
  if (!s) return "";
  return String(s)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^-{2,}\s*$/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

function buildPlainTextSummary(data, fallback, titlesByNumber, ar) {
  if (!data) return fallback || "";
  const out = [];
  for (const s of data.matched_secrets || []) {
    const num = s.number;
    const title = (num != null && titlesByNumber[num]) || s.title || "";
    const head = ar ? `سر #${num ?? "—"}` : `#${num ?? "—"}`;
    out.push(`${head}${title ? " — " + title : ""}: ${stripInlineMarkdown(s.how || "")}`);
  }
  if (data.opening) out.push((ar ? "الافتتاحية: " : "Opening: ") + stripInlineMarkdown(data.opening));
  if (data.best_time) out.push((ar ? "أفضل وقت: " : "Best time: ") + stripInlineMarkdown(data.best_time));
  if (data.hashtags?.length) out.push((ar ? "هاشتاقات: " : "Hashtags: ") + data.hashtags.join(" "));
  return out.join("\n\n");
}


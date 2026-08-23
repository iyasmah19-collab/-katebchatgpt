import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { FaInstagram, FaTiktok, FaYoutube, FaTelegram } from "react-icons/fa";
import { Sparkles, Wand2, Lock, Copy, RefreshCw, Zap, Loader2, Check, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { errMsg } from "@/lib/utils";

const DEMO_PRESETS = {
  ar: [
    { type: "caption", typeLabel: "كابشن", style: "funny", styleLabel: "مضحك", dialect: "gulf", dialectLabel: "خليجي", topic: "صعوبة الاستيقاظ مبكراً" },
    { type: "ad", typeLabel: "إعلان", style: "professional", styleLabel: "احترافي", dialect: "fusha", dialectLabel: "فصحى", topic: "إطلاق سماعات لاسلكية فاخرة" },
    { type: "tweet", typeLabel: "تغريدة", style: "motivational", styleLabel: "تحفيزي", dialect: "fusha", dialectLabel: "فصحى", topic: "البدء قبل أن تكون مستعداً" },
    { type: "post", typeLabel: "بوست", style: "emotional", styleLabel: "عاطفي", dialect: "egyptian", dialectLabel: "مصري", topic: "اللحظة اللي قررت فيها تغيير حياتك" },
    { type: "story", typeLabel: "ستوري", style: "casual", styleLabel: "عادي", dialect: "levantine", dialectLabel: "شامي", topic: "أفضل قهوة جربتها في حياتك" },
    { type: "bio", typeLabel: "بايو", style: "funny", styleLabel: "مضحك", dialect: "gulf", dialectLabel: "خليجي", topic: "صانع محتوى يحب القهوة والقطط" },
    { type: "caption", typeLabel: "كابشن", style: "motivational", styleLabel: "تحفيزي", dialect: "fusha", dialectLabel: "فصحى", topic: "اللي يخاف من الفشل ما يحقق شي" },
  ],
  en: [
    { type: "caption", typeLabel: "Caption", style: "funny", styleLabel: "Funny", dialect: "gulf", dialectLabel: "Gulf", topic: "Difficulty waking up early" },
    { type: "ad", typeLabel: "Ad", style: "professional", styleLabel: "Pro", dialect: "fusha", dialectLabel: "MSA", topic: "Launching premium wireless headphones" },
    { type: "tweet", typeLabel: "Tweet", style: "motivational", styleLabel: "Bold", dialect: "fusha", dialectLabel: "MSA", topic: "Start before you're ready" },
    { type: "post", typeLabel: "Post", style: "emotional", styleLabel: "Emotional", dialect: "egyptian", dialectLabel: "Egyptian", topic: "The moment you decided to change your life" },
  ],
};

const FALLBACK_AR = "صراحة، فنجان قهوتي الصباحي يفهمني أكثر من نص الناس! ☕️ أنت لو فتحت عينيك بدون قهوة، فلسفياً انت قمت بس روحك لسا نايمة.";
const FALLBACK_EN = "Honestly, my morning coffee gets me more than half the people I know.";

export default function Landing() {
  const { t, lang } = useApp();
  const [idx, setIdx] = useState(0);
  const [preview, setPreview] = useState(lang === "ar" ? FALLBACK_AR : FALLBACK_EN);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const presets = DEMO_PRESETS[lang] || DEMO_PRESETS.ar;
  const current = presets[idx % presets.length];

  const regenerate = async () => {
    setLoading(true);
    const next = (idx + 1) % presets.length;
    const p = presets[next];
    try {
      const r = await axios.post(`${API}/generate/content`, {
        content_type: p.type, style: p.style, dialect: p.dialect, topic: p.topic, language: lang,
      });
      setPreview(r.data.content);
      setIdx(next);
    } catch (err) {
      toast.error(errMsg(err, t.error));
    } finally {
      setLoading(false);
    }
  };

  const copyPreview = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    toast.success(t.copied);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    setPreview(lang === "ar" ? FALLBACK_AR : FALLBACK_EN);
    setIdx(0);
  }, [lang]);

  return (
    <div className="hero-bg bg-grain min-h-screen">
      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              {t.poweredBy}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.05]">
              <span className="text-white">{lang === "ar" ? "محتوى عربي" : "Arabic content"}</span>
              <br />
              <span className="shine-text">{lang === "ar" ? "يكسر الخوارزمية" : "that breaks the algorithm"}</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl leading-relaxed">
              {lang === "ar"
                ? "اكتب كابشنات وإعلانات وبوستات وستوريز — بـ 4 لهجات وأسلوب يناسبك. خزنة أسرار خوارزمية إنستا، تيك توك، شورتس بداخلها."
                : "Generate captions, ads, posts, bios & stories in 4 Arabic dialects. Plus a real-secrets vault for Instagram, TikTok & Shorts."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/dashboard">
                <Button
                  size="lg"
                  data-testid="cta-start-btn"
                  className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-base px-8 h-12 shadow-[0_0_30px_rgba(255,184,0,0.5)] hover:brightness-110"
                >
                  <Sparkles className="w-4 h-4 me-2" />
                  {t.tryFree}
                </Button>
              </Link>
              <Link to="/vault">
                <Button
                  size="lg"
                  variant="outline"
                  data-testid="cta-vault-btn"
                  className="bg-transparent border-white/15 text-white hover:bg-white/5 hover:border-amber-500/40 h-12 px-6"
                >
                  <Lock className="w-4 h-4 me-2" />
                  {t.vault}
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-6">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <FaInstagram className="w-5 h-5 text-pink-500" />
                <span>Instagram</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <FaTiktok className="w-5 h-5 text-white" />
                <span>TikTok</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <FaYoutube className="w-5 h-5 text-red-500" />
                <span>YT Shorts</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative vault-card rounded-3xl p-6 sm:p-8 glow-gold">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400/80">
                  Live AI Preview
                </span>
                <span className="text-xs text-zinc-500">GPT-5.2</span>
              </div>
              <div className="space-y-3">
                <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300">
                  {current.typeLabel} • {current.styleLabel} • {current.dialectLabel}
                </div>
                <div className={`px-4 py-5 rounded-xl bg-black border ${loading ? "border-amber-500/10" : "border-amber-500/30"} leading-relaxed min-h-[120px]`}>
                  {loading ? (
                    <div className="flex items-center justify-center py-4 text-amber-400/80">
                      <Loader2 className="w-5 h-5 animate-spin me-2" />
                      <span className="text-sm font-mono">{t.generating}</span>
                    </div>
                  ) : (
                    <p className="text-white text-base" data-testid="preview-text">{preview}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={regenerate}
                    disabled={loading}
                    data-testid="preview-regenerate"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    {t.regenerate}
                  </button>
                  <button
                    onClick={copyPreview}
                    data-testid="preview-copy"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs text-amber-400 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            to="/dashboard?tab=generator"
            testId="feature-card-generator"
            icon={<Wand2 className="w-6 h-6" />}
            title={lang === "ar" ? "6 أنواع × 5 أساليب × 4 لهجات" : "6 types × 5 styles × 4 dialects"}
            desc={lang === "ar" ? "كل تركيبة ممكنة لكل موقف. زر جرّب-مرة-ثانية مدمج." : "Every combination possible. Try-again button built in."}
            cta={lang === "ar" ? "افتح مولّد المحتوى" : "Open content generator"}
            lang={lang}
          />
          <FeatureCard
            to="/dashboard?tab=hooks"
            testId="feature-card-hooks"
            icon={<Zap className="w-6 h-6" />}
            title={lang === "ar" ? "أفكار هوك جذاب" : "Viral hook generator"}
            desc={lang === "ar" ? "5 هوكس لكل منصة تشد المشاهد من أول 3 ثواني." : "5 hooks per platform that grab viewers in 3 seconds."}
            cta={lang === "ar" ? "ولّد هوكس الآن" : "Generate hooks"}
            lang={lang}
          />
          <FeatureCard
            to="/vault"
            testId="feature-card-vault"
            icon={<Lock className="w-6 h-6" />}
            title={lang === "ar" ? "خزنة الأسرار" : "Algorithm vault"}
            desc={lang === "ar" ? "50 سر لكل منصة، مع أداة AI تربط محتواك بأفضلها." : "50 secrets/platform + an AI tool matching your content to the best ones."}
            cta={lang === "ar" ? "افتح الخزنة" : "Open vault"}
            lang={lang}
          />
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}

function Footer({ lang }) {
  return (
    <footer className="border-t border-white/5 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="text-center">
          <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400/80 mb-4">
            {lang === "ar" ? "تواصل معي" : "Contact me"}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <a
              href="mailto:accofamd@gmail.com"
              data-testid="footer-email-link"
              className="inline-flex items-center gap-2 text-zinc-300 hover:text-amber-400 transition group"
            >
              <Mail className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition" />
              <span className="text-sm" dir="ltr">accofamd@gmail.com</span>
            </a>
            <a
              href="https://www.instagram.com/amd._.shn/"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-instagram-link"
              className="inline-flex items-center gap-2 text-zinc-300 hover:text-pink-400 transition group"
            >
              <FaInstagram className="w-4 h-4 text-zinc-500 group-hover:text-pink-500 transition" />
              <span className="text-sm" dir="ltr">amd._.shn</span>
            </a>
            <a
              href="https://t.me/ahmadshamaseen7?fbclid=PAQ0xDSwKXGTZleHRuA2FlbQIxMQABp7KcK2ok2SQnrOyuy5bpo5rpI-hwEeso8ll81nywIMaMnmYot0fO_AFpa5rC_aem_sZjUdNJXcwsXhgenThbIKQ"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-telegram-link"
              className="inline-flex items-center gap-2 text-zinc-300 hover:text-sky-400 transition group"
            >
              <FaTelegram className="w-4 h-4 text-zinc-500 group-hover:text-sky-400 transition" />
              <span className="text-sm" dir="ltr">@ahmadshamaseen7</span>
            </a>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs">
          <Link
            to="/privacy"
            data-testid="footer-privacy-link"
            className="text-zinc-500 hover:text-amber-400 transition"
          >
            {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
          </Link>
          <span className="text-zinc-700">·</span>
          <Link
            to="/terms"
            data-testid="footer-terms-link"
            className="text-zinc-500 hover:text-amber-400 transition"
          >
            {lang === "ar" ? "شروط الخدمة" : "Terms of Service"}
          </Link>
        </div>
        <p className="text-center text-xs text-zinc-600" dir="ltr">
          Made By: Ahmad Al-Shamaseen (amd)
        </p>
      </div>
    </footer>
  );
}

function FeatureCard({ icon, title, desc, to, cta, lang, testId }) {
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const content = (
    <>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
      {cta && (
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber-400 group-hover:text-amber-300 transition">
          {cta}
          <Arrow className="w-3.5 h-3.5 transition-transform group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[2px]" />
        </div>
      )}
    </>
  );

  const sharedClass =
    "group relative block rounded-2xl bg-[#0f0f13] border border-white/5 p-6 hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,184,0,0.15)] transition-all duration-300 text-start";

  if (to) {
    return (
      <Link to={to} data-testid={testId} className={sharedClass}>
        {content}
      </Link>
    );
  }
  return (
    <div data-testid={testId} className={sharedClass}>
      {content}
    </div>
  );
}

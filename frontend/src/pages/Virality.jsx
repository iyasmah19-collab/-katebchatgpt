import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload, Loader2, Play, Lock, Crown, Sparkles, Zap, TrendingUp, Heart, Clock, Eye, X, Trash2, RotateCcw,
} from "lucide-react";

const FACTORS = [
  { key: "hook",      Icon: Zap,         color: "#facc15", labelAr: "الافتتاحية",  labelEn: "Hook" },
  { key: "pace",      Icon: Clock,       color: "#22d3ee", labelAr: "الإيقاع",      labelEn: "Pace" },
  { key: "trend",     Icon: TrendingUp,  color: "#a78bfa", labelAr: "الترند",       labelEn: "Trend" },
  { key: "emotion",   Icon: Heart,       color: "#fb7185", labelAr: "العاطفة",      labelEn: "Emotion" },
  { key: "retention", Icon: Eye,         color: "#34d399", labelAr: "الاحتفاظ",     labelEn: "Retention" },
];

function CircularScore({ value = 0, color = "#facc15", size = 90, stroke = 8 }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, value || 0));
  const offset = circ - (safe / 100) * circ;
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1f1f26" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 800ms ease-out" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%" y="50%" dy="0.35em" textAnchor="middle"
        fontSize="22" fontWeight="900" fill="#fff" fontFamily="ui-monospace, Menlo, monospace"
      >
        {Math.round(safe)}
      </text>
    </svg>
  );
}

export default function Virality() {
  const { lang, user, t } = useApp();
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const r = await axios.get(`${API}/virality/history`);
      setHistory(r.data || []);
    } catch (err) {
      console.warn("[Virality] loadHistory failed:", err?.response?.status || err?.message);
    }
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grain px-4">
        <div className="text-center space-y-4 max-w-md">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-black text-white">
            {lang === "ar" ? "سجّل الدخول لتحليل فيديوهاتك" : "Sign in to analyze your videos"}
          </h1>
          <Link to="/login">
            <Button data-testid="virality-login-cta" className="bg-amber-500 text-black font-bold">{t.login}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pickFile = (f) => {
    if (!f) return;
    if (!f.type?.startsWith("video/")) {
      toast.error(lang === "ar" ? "يجب اختيار ملف فيديو" : "Please select a video file");
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error(lang === "ar" ? "الحد الأقصى 100 ميجابايت" : "Max size 100MB");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await axios.post(`${API}/virality/analyze`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(r.data);
      toast.success(lang === "ar" ? "تم التحليل" : "Analysis ready");
      loadHistory();
    } catch (err) {
      const detail = err.response?.data?.detail || (lang === "ar" ? "فشل التحليل" : "Analysis failed");
      toast.error(typeof detail === "string" ? detail : "Error");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const deleteFromHistory = async (id) => {
    if (!window.confirm(lang === "ar" ? "حذف من السجل؟" : "Delete from history?")) return;
    try {
      await axios.delete(`${API}/virality/${id}`);
      loadHistory();
      if (result?.analysis_id === id) setResult(null);
    } catch (err) {
      console.warn("[Virality] deleteFromHistory failed:", err?.response?.status || err?.message);
    }
  };

  const overallColor = result?.overall_score >= 70 ? "#34d399" : result?.overall_score >= 40 ? "#facc15" : "#fb7185";

  return (
    <div className="bg-grain min-h-screen pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400 mb-2">
              {lang === "ar" ? "كاتب · فحص الانتشار" : "Kateb · Virality Check"}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none">
              <span className="shine-text">
                {lang === "ar" ? "هل سينتشر فيديوك؟" : "Will your video go viral?"}
              </span>
            </h1>
            <p className="text-zinc-400 mt-3 text-sm max-w-xl">
              {lang === "ar"
                ? "ارفع فيديو قصير ودع كاتب AI يحلّل افتتاحيتك، إيقاعك، عاطفتك واحتمالية الاحتفاظ بالمشاهد."
                : "Upload a short-form video — Kateb AI scores your hook, pace, emotion and retention odds."}
            </p>
          </div>
        </div>

        {/* Upload card */}
        {!result && (
          <section
            data-testid="virality-upload"
            className="rounded-2xl bg-[#0f0f13] border border-white/10 p-6 sm:p-10"
          >
            <label
              htmlFor="virality-file"
              className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-amber-400/30 bg-amber-400/5 hover:bg-amber-400/10 transition p-10 text-center"
            >
              <Upload className="w-10 h-10 mx-auto text-amber-400 mb-3" />
              <p className="text-white font-bold mb-1">
                {file
                  ? file.name
                  : lang === "ar" ? "اسحب الفيديو هنا أو اضغط للاختيار" : "Drop a video here or click to choose"}
              </p>
              <p className="text-xs text-zinc-500 font-mono">
                MP4 · MOV · WEBM · {lang === "ar" ? "حتى" : "up to"} 100MB
              </p>
              <input
                id="virality-file"
                data-testid="virality-file-input"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </label>

            <div className="flex justify-center gap-2 mt-6">
              {file && (
                <Button
                  variant="outline"
                  onClick={reset}
                  data-testid="virality-clear"
                  className="bg-transparent border-white/10 text-zinc-300 hover:bg-white/5"
                >
                  <X className="w-4 h-4 me-1.5" />
                  {lang === "ar" ? "إلغاء" : "Clear"}
                </Button>
              )}
              <Button
                onClick={analyze}
                disabled={!file || analyzing}
                data-testid="virality-analyze-btn"
                className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(255,184,0,0.4)]"
              >
                {analyzing ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Play className="w-4 h-4 me-2 fill-black" />}
                {analyzing
                  ? (lang === "ar" ? "جارٍ التحليل…" : "Analyzing…")
                  : (lang === "ar" ? "حلّل الانتشار" : "Analyze virality")}
              </Button>
            </div>
            <p className="text-center text-[11px] text-zinc-600 mt-4 font-mono">
              {lang === "ar"
                ? "نحن لا نحتفظ بفيديوك — يُحذف فوراً بعد استخراج 5 إطارات"
                : "We never store your video — it's deleted right after we extract 5 frames"}
            </p>
          </section>
        )}

        {/* Result card */}
        {result && (
          <section data-testid="virality-result" className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-[#0f0f13] to-[#16161d] border border-amber-400/20 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <CircularScore value={result.overall_score} color={overallColor} size={140} stroke={12} />
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    {lang === "ar" ? "السكور الكلي" : "Overall"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-white mb-2">
                    {lang === "ar" ? "حكم كاتب AI" : "Kateb AI verdict"}
                  </h2>
                  <p className="text-zinc-300 leading-relaxed">{result.verdict}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={reset} variant="outline" data-testid="virality-new-btn" size="sm" className="bg-transparent border-white/10 text-white hover:bg-white/5">
                      <RotateCcw className="w-4 h-4 me-1.5" />
                      {lang === "ar" ? "حلّل فيديو آخر" : "Analyze another"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5 factor cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {FACTORS.map(({ key, Icon, color, labelAr, labelEn }) => (
                <div
                  key={key}
                  data-testid={`factor-${key}`}
                  className="rounded-xl bg-[#0f0f13] border border-white/5 p-4 flex flex-col items-center gap-2"
                >
                  <CircularScore value={result.scores?.[key] || 0} color={color} size={80} stroke={7} />
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {lang === "ar" ? labelAr : labelEn}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Factor breakdown */}
            <div className="rounded-2xl bg-[#0f0f13] border border-white/5 p-6 space-y-4">
              <h3 className="text-base font-bold text-white">{lang === "ar" ? "ملاحظات لكل محور" : "Per-factor breakdown"}</h3>
              <div className="space-y-3">
                {FACTORS.map(({ key, Icon, color, labelAr, labelEn }) => (
                  <div key={key} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{lang === "ar" ? labelAr : labelEn}</span>
                        <span className="text-xs text-zinc-500 font-mono">· {result.scores?.[key] || 0}/100</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                        {result.factors?.[key] || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro insights */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-purple-500/10 border border-amber-400/30 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-bold text-white">{lang === "ar" ? "نصائح احترافية" : "Pro insights"}</h3>
              </div>
              {result.pro_locked ? (
                <div data-testid="pro-insights-locked" className="text-center py-6">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <p className="text-white font-bold mb-1">
                    {lang === "ar" ? "هذه النصائح للأعضاء المميزين فقط" : "Premium-only insights"}
                  </p>
                  <p className="text-xs text-zinc-400 mb-4">
                    {lang === "ar"
                      ? "ترقّى لتحصل على 3 نصائح احترافية محددة لكل فيديو"
                      : "Upgrade to unlock 3 actionable insights per video"}
                  </p>
                  <Link to="/premium">
                    <Button data-testid="upgrade-pro-insights" className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold">
                      <Crown className="w-4 h-4 me-2" />
                      {lang === "ar" ? "ترقية إلى Premium" : "Upgrade to Premium"}
                    </Button>
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2" data-testid="pro-insights-list">
                  {(result.pro_insights || []).map((tip, i) => (
                    <li key={`pro-insight-${i}-${(tip || "").slice(0, 24)}`} className="flex gap-3 text-sm">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-xs">{i + 1}</span>
                      <span className="text-zinc-200 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section data-testid="virality-history" className="space-y-3 pt-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-500">
              {lang === "ar" ? "آخر التحليلات" : "Recent analyses"}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {history.slice(0, 6).map((h) => (
                <div
                  key={h.analysis_id}
                  data-testid={`history-row-${h.analysis_id}`}
                  className="rounded-xl bg-[#0f0f13] border border-white/5 p-4 flex items-center gap-3 hover:border-white/10 transition cursor-pointer"
                  onClick={() => setResult(h)}
                >
                  <CircularScore value={h.overall_score || 0} color={h.overall_score >= 70 ? "#34d399" : h.overall_score >= 40 ? "#facc15" : "#fb7185"} size={56} stroke={6} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{h.filename || "video.mp4"}</p>
                    <p className="text-xs text-zinc-500 truncate">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFromHistory(h.analysis_id); }}
                    className="p-2 text-zinc-500 hover:text-red-400 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

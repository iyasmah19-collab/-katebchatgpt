import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Copy, Check, Zap, Loader2, Bookmark, Trash2, Crown, Wand2, Mic2, Save } from "lucide-react";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import AdBanner from "@/components/AdBanner";
import ShareButton from "@/components/ShareButton";
import { errMsg } from "@/lib/utils";

const TYPES = ["caption", "ad", "post", "bio", "tweet", "story"];
const STYLES = ["funny", "professional", "emotional", "motivational", "casual"];
const DIALECTS = ["fusha", "gulf", "egyptian", "levantine"];
const PLATFORMS = [
  { id: "instagram", icon: FaInstagram, color: "#E1306C" },
  { id: "tiktok", icon: FaTiktok, color: "#ffffff" },
  { id: "shorts", icon: FaYoutube, color: "#FF0000" },
];
const HOOK_TYPES = [
  "mixed", "shocking", "question", "secret", "challenge", "opinion", "story", "statistic", "contradiction",
];

// Shared: fetch the user's brand voices once and reuse across panels.
function useBrandVoices(user) {
  const [voices, setVoices] = useState([]);
  const refresh = useCallback(async () => {
    if (!user) { setVoices([]); return; }
    try {
      const res = await axios.get(`${API}/brand-voice`);
      setVoices(res.data);
    } catch (err) {
      console.warn("[Dashboard] voices fetch:", err?.response?.status || err?.message);
    }
  }, [user]);
  useEffect(() => { refresh(); }, [refresh]);
  return voices;
}

// Brand-voice picker + "save as template" controls shared by both panels.
function BrandVoiceSelect({ voices, value, onChange, t }) {
  if (!voices || voices.length === 0) return null;
  return (
    <div>
      <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 block flex items-center gap-1.5">
        <Mic2 className="w-3.5 h-3.5 text-amber-400" /> {t.useBrandVoice}
      </label>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger data-testid="brand-voice-select" className="bg-[#16161d] border-white/10 h-11"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#0f0f13] border-white/10">
          <SelectItem value="none" data-testid="brand-voice-none">{t.noVoiceOption}</SelectItem>
          {voices.map((v) => (
            <SelectItem key={v.voice_id} value={v.voice_id} data-testid={`brand-voice-${v.voice_id}`}>
              {v.name}{v.is_active ? ` (${t.activeVoiceLabel})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SaveTemplateButton({ payload, t }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error(t.templateName); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/templates`, { name: name.trim(), ...payload });
      toast.success(t.templateSaved);
      setName(""); setOpen(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || t.error);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid="save-template-btn" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-amber-400 transition">
          <Save className="w-3.5 h-3.5" /> {t.saveAsTemplate}
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f0f13] border-white/10 text-white">
        <DialogHeader><DialogTitle>{t.saveAsTemplate}</DialogTitle></DialogHeader>
        <DialogDescription className="text-zinc-400 text-sm">{t.templatesDesc}</DialogDescription>
        <Input
          data-testid="template-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.templateName}
          className="bg-[#16161d] border-white/10 h-11 text-white"
        />
        <DialogFooter>
          <Button onClick={save} disabled={saving} data-testid="template-save-confirm" className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { t, lang, user } = useApp();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "hooks" ? "hooks" : "generator");
  const voices = useBrandVoices(user);

  // Content state — seed from URL query (used by "apply template" from Library).
  const [type, setType] = useState(searchParams.get("type") || "caption");
  const [style, setStyle] = useState(searchParams.get("style") || "casual");
  const [dialect, setDialect] = useState(searchParams.get("dialect") || "fusha");
  const [topic, setTopic] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);
  const [savedList, setSavedList] = useState([]);

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API}/generations`);
      setSavedList(res.data);
    } catch (err) {
      console.warn("[Dashboard] fetchSaved failed:", err?.response?.status || err?.message);
    }
  }, [user]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const generate = async () => {
    if (!topic.trim()) {
      toast.error(lang === "ar" ? "اكتب موضوع أولاً" : "Enter a topic first");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/generate/content`, {
        content_type: type, style, dialect, topic, language: lang,
        brand_voice_id: voiceId || undefined,
      });
      setResult(res.data.content);
      setSavedFlag(false);
    } catch (err) { toast.error(errMsg(err, t.error)); }
    finally { setLoading(false); }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(t.copied);
    setTimeout(() => setCopied(false), 1500);
  };

  const saveResult = async () => {
    if (!user) { toast.error(t.loginRequired); return; }
    try {
      await axios.post(`${API}/generations`, {
        content: result, content_type: type, style, dialect, topic, kind: "content",
      });
      setSavedFlag(true);
      toast.success(t.saved);
      fetchSaved();
    } catch (err) { toast.error(errMsg(err, t.error)); }
  };

  const removeSaved = async (id) => {
    try {
      await axios.delete(`${API}/generations/${id}`);
      fetchSaved();
    } catch (err) {
      console.warn("[Dashboard] removeSaved failed:", err?.response?.status || err?.message);
      toast.error(t.error);
    }
  };

  return (
    <div className="bg-grain min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            <span className="shine-text">{t.generator}</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm md:text-base">
            {lang === "ar"
              ? "اختر النوع، الأسلوب، اللهجة — أو ولّد هوكس قاتلة. الباقي علينا."
              : "Pick type, style, dialect — or generate killer hooks. We handle the rest."}
          </p>
        </div>

        <AdBanner />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#0f0f13] border border-white/10 p-1 h-auto rounded-xl">
            <TabsTrigger
              value="generator"
              data-testid="tab-generator"
              className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/30 border border-transparent rounded-lg flex items-center gap-2 px-4 py-2.5 font-bold"
            >
              <Wand2 className="w-4 h-4" />
              {t.tabGenerator}
            </TabsTrigger>
            <TabsTrigger
              value="hooks"
              data-testid="tab-hooks"
              className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 border border-transparent rounded-lg flex items-center gap-2 px-4 py-2.5 font-bold"
            >
              <Zap className="w-4 h-4" />
              {t.tabHooks}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="mt-6 space-y-6">
            <ContentGeneratorPanel
              type={type} setType={setType}
              style={style} setStyle={setStyle}
              dialect={dialect} setDialect={setDialect}
              topic={topic} setTopic={setTopic}
              voices={voices} voiceId={voiceId} setVoiceId={setVoiceId}
              result={result} loading={loading} copied={copied} savedFlag={savedFlag}
              onGenerate={generate} onCopy={copy} onSave={saveResult} t={t} lang={lang}
            />
          </TabsContent>

          <TabsContent value="hooks" className="mt-6">
            <HookGeneratorPanel onSaved={fetchSaved} voices={voices} searchParams={searchParams} />
          </TabsContent>
        </Tabs>

        {/* Saved Section */}
        {user && (
          <section className="space-y-4 pt-4" data-testid="saved-section">
            <div className="flex items-center gap-3">
              <Bookmark className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl md:text-2xl font-bold text-white">{t.mySaved}</h2>
              {savedList.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono">
                  {savedList.length}
                </span>
              )}
            </div>
            {savedList.length === 0 ? (
              <p className="text-sm text-zinc-600 italic">{t.noSaved}</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {savedList.map((g) => (
                  <div key={g.gen_id} data-testid={`saved-item-${g.gen_id}`}
                    className="rounded-2xl bg-[#0f0f13] border border-white/5 p-5 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-cyan-400/80">
                        {t[g.content_type] || g.content_type} {g.dialect ? `• ${t[g.dialect] || g.dialect}` : ""}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { navigator.clipboard.writeText(g.content); toast.success(t.copied); }}
                          className="p-1.5 rounded text-zinc-400 hover:text-white" aria-label="copy">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeSaved(g.gen_id)}
                          data-testid={`delete-saved-${g.gen_id}`}
                          className="p-1.5 rounded text-zinc-400 hover:text-red-400" aria-label="delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p
                      className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap line-clamp-4 bidi-plaintext"
                      dir="auto"
                    >
                      {g.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function ContentGeneratorPanel({ type, setType, style, setStyle, dialect, setDialect, topic, setTopic, voices, voiceId, setVoiceId, result, loading, copied, savedFlag, onGenerate, onCopy, onSave, t, lang }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#0f0f13] border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-end">
          <SaveTemplateButton payload={{ kind: "content", content_type: type, style, dialect }} t={t} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 block">{t.contentType}</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="type-select" className="bg-[#16161d] border-white/10 h-11"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0f0f13] border-white/10">
                {TYPES.map((k) => <SelectItem key={k} value={k} data-testid={`type-${k}`}>{t[k]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 block">{t.style}</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger data-testid="style-select" className="bg-[#16161d] border-white/10 h-11"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0f0f13] border-white/10">
                {STYLES.map((k) => <SelectItem key={k} value={k} data-testid={`style-${k}`}>{t[k]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 block">{t.dialect}</label>
            <Select value={dialect} onValueChange={setDialect}>
              <SelectTrigger data-testid="dialect-select" className="bg-[#16161d] border-white/10 h-11"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0f0f13] border-white/10">
                {DIALECTS.map((k) => <SelectItem key={k} value={k} data-testid={`dialect-${k}`}>{t[k]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <BrandVoiceSelect voices={voices} value={voiceId} onChange={setVoiceId} t={t} />

        <div>
          <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 block">{t.topic}</label>
          <Textarea
            data-testid="topic-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t.placeholder}
            className="bg-[#16161d] border-white/10 min-h-24 text-white placeholder:text-zinc-600 focus-visible:ring-amber-500/40 focus-visible:border-amber-500/40"
          />
        </div>

        <Button
          onClick={onGenerate}
          disabled={loading}
          data-testid="generate-btn"
          className="w-full h-12 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-base hover:brightness-110 shadow-[0_0_25px_rgba(255,184,0,0.4)]"
        >
          {loading ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {t.generating}</> : <><Sparkles className="w-4 h-4 me-2" /> {t.generate}</>}
        </Button>
      </div>

      <div className={`rounded-2xl border p-6 transition-all ${result ? "vault-card border-amber-500/30 glow-gold" : "bg-[#0f0f13] border-white/5"}`}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400/80">{t.output}</span>
          {result && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={onGenerate} disabled={loading}
                data-testid="regenerate-btn" className="text-zinc-300 hover:text-white hover:bg-white/10">
                <RefreshCw className={`w-3.5 h-3.5 me-1.5 ${loading ? "animate-spin" : ""}`} />
                {t.regenerate}
              </Button>
              <Button size="sm" onClick={onSave} data-testid="save-btn"
                className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400">
                <Bookmark className={`w-3.5 h-3.5 me-1.5 ${savedFlag ? "fill-cyan-400" : ""}`} />
                {savedFlag ? t.saved : t.save}
              </Button>
              <ShareButton text={result} testid="share-content-btn" />
              <Button size="sm" onClick={onCopy} data-testid="copy-btn"
                className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400">
                {copied ? <Check className="w-3.5 h-3.5 me-1.5" /> : <Copy className="w-3.5 h-3.5 me-1.5" />}
                {copied ? t.copied : t.copy}
              </Button>
            </div>
          )}
        </div>
        {result ? (
          <p
            className="text-white text-base leading-relaxed whitespace-pre-wrap bidi-plaintext"
            data-testid="output-text"
            dir="auto"
          >
            {result}
          </p>
        ) : (
          <p className="text-zinc-600 text-sm italic">
            {lang === "ar" ? "النتيجة ستظهر هنا..." : "Your result will appear here..."}
          </p>
        )}
      </div>
    </div>
  );
}

function HookGeneratorPanel({ onSaved, voices, searchParams }) {
  const { t, lang, user } = useApp();
  const [platform, setPlatform] = useState(searchParams?.get("platform") || "instagram");
  const [hookType, setHookType] = useState(searchParams?.get("hook_type") || "mixed");
  const [dialect, setDialect] = useState(searchParams?.get("dialect") || "fusha");
  const [topic, setTopic] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [hooks, setHooks] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);
  const [meta, setMeta] = useState({ count: user?.is_premium ? 15 : 5, is_premium: !!user?.is_premium });

  const generate = async () => {
    if (!topic.trim()) {
      toast.error(lang === "ar" ? "اكتب موضوع" : "Enter a topic");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/generate/hook`, {
        platform, topic, hook_type: hookType, dialect, language: lang,
        brand_voice_id: voiceId || undefined,
      });
      setHooks(res.data.hooks);
      setMeta({ count: res.data.count, is_premium: res.data.is_premium });
      setSavedFlag(false);
    } catch (err) { toast.error(errMsg(err, t.error)); }
    finally { setLoading(false); }
  };

  const copyHooks = async () => { await navigator.clipboard.writeText(hooks); toast.success(t.copied); };

  const saveHooks = async () => {
    if (!user) { toast.error(t.loginRequired); return; }
    if (!hooks) return;
    try {
      await axios.post(`${API}/generations`, {
        content: hooks,
        content_type: "hook",
        dialect,
        topic,
        kind: "hook",
      });
      setSavedFlag(true);
      toast.success(t.saved);
      if (onSaved) onSaved();
    } catch (err) { toast.error(errMsg(err, t.error)); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl bg-[#0f0f13] border border-white/5 p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t.hooks}</h2>
                <p className="text-xs text-zinc-500">{t.hooksDesc}</p>
              </div>
            </div>
            <span className={`text-xs font-mono uppercase tracking-widest px-2.5 py-1 rounded-md border ${
              user?.is_premium
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
            }`}>
              {user?.is_premium ? t.premiumHookLimit : t.freeHookLimit}
            </span>
          </div>

          {/* Platform */}
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 block">{t.platform}</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const active = platform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    data-testid={`hook-platform-${p.id}`}
                    className={`flex items-center justify-center h-12 rounded-xl border transition ${
                      active
                        ? "bg-white/5 border-cyan-500/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                        : "bg-transparent border-white/10 hover:border-white/30"
                    }`}
                  >
                    <Icon className="w-5 h-5" style={{ color: active ? p.color : "#a1a1aa" }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hook Type Chips */}
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 block">{t.hookType}</label>
            <div className="flex flex-wrap gap-2">
              {HOOK_TYPES.map((h) => {
                const active = hookType === h;
                const labelKey = "hookType" + h.charAt(0).toUpperCase() + h.slice(1);
                return (
                  <button
                    key={h}
                    onClick={() => setHookType(h)}
                    data-testid={`hook-type-${h}`}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                      active
                        ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/30"
                    }`}
                  >
                    {t[labelKey] || h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dialect Chips */}
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 block">{t.dialect}</label>
            <div className="flex flex-wrap gap-2">
              {DIALECTS.map((d) => {
                const active = dialect === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDialect(d)}
                    data-testid={`hook-dialect-${d}`}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                      active
                        ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/30"
                    }`}
                  >
                    {t[d] || d}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 block">{t.topic}</label>
            <Textarea
              data-testid="hook-topic-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={lang === "ar" ? "موضوع الفيديو..." : "Video topic..."}
              className="bg-[#16161d] border-white/10 min-h-20 text-white focus-visible:ring-cyan-500/40"
            />
          </div>

          <BrandVoiceSelect voices={voices} value={voiceId} onChange={setVoiceId} t={t} />

          <div className="flex items-center justify-end">
            <SaveTemplateButton payload={{ kind: "hook", platform, hook_type: hookType, dialect }} t={t} />
          </div>

          <Button
            onClick={generate}
            disabled={loading}
            data-testid="hook-generate-btn"
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-bold hover:brightness-110 shadow-[0_0_25px_rgba(0,229,255,0.3)]"
          >
            {loading ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {t.generating}</> : <><Zap className="w-4 h-4 me-2" /> {t.generateHooks}</>}
          </Button>
        </div>

        {hooks && (
          <div className="rounded-2xl bg-black border border-cyan-500/30 p-6 space-y-3 shadow-[0_0_25px_rgba(0,229,255,0.15)]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">{meta.count} Hooks</span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveHooks} data-testid="save-hooks-btn"
                  className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400">
                  <Bookmark className={`w-3.5 h-3.5 me-1.5 ${savedFlag ? "fill-cyan-400" : ""}`} />
                  {savedFlag ? t.saved : t.save}
                </Button>
                <ShareButton text={hooks} testid="share-hooks-btn" />
                <Button size="sm" onClick={copyHooks} data-testid="copy-hooks-btn"
                  className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400">
                  <Copy className="w-3.5 h-3.5 me-1.5" /> {t.copy}
                </Button>
              </div>
            </div>
            <p
              className="text-white text-base leading-relaxed whitespace-pre-wrap bidi-plaintext"
              data-testid="hooks-output"
              dir="auto"
            >
              {hooks}
            </p>
          </div>
        )}
      </div>

      {/* Upgrade nudge */}
      {!user?.is_premium && (
        <div className="lg:col-span-1">
          <div className="vault-card rounded-2xl p-6 glow-gold sticky top-24" data-testid="hook-upgrade-cta">
            <Crown className="w-8 h-8 text-amber-400 mb-3" />
            <h3 className="text-lg font-black text-white mb-2">{t.premiumHookLimit}</h3>
            <p className="text-sm text-zinc-400 mb-4">
              {lang === "ar"
                ? "ولّد 15 هوك بدل 5، اختر من 9 أنواع هوكس، واحفظ كل شي."
                : "Generate 15 hooks instead of 5, pick from 9 hook types, and save everything."}
            </p>
            <Link to="/premium">
              <Button data-testid="hook-upgrade-btn" className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-[0_0_20px_rgba(255,184,0,0.4)]">
                <Sparkles className="w-4 h-4 me-2" />
                {t.upgradeFor15}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

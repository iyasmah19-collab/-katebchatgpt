import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  History as HistoryIcon, Bookmark, LayoutTemplate, Mic2, Copy, Trash2,
  Loader2, Sparkles, Wand2, CheckCircle2, Circle, ArrowRight, Info, Gift,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ShareButton from "@/components/ShareButton";
import ReferralPanel from "@/components/ReferralPanel";

export default function Library() {
  const { t, lang, user, loadingUser } = useApp();
  const [tab, setTab] = useState("history");

  if (!loadingUser && !user) {
    return (
      <div className="bg-grain min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Mic2 className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-black text-white">{t.library}</h1>
          <p className="text-zinc-400">{t.loginRequired}</p>
          <Link to="/login">
            <Button data-testid="library-login-btn" className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold">
              {t.login}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-grain min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            <span className="shine-text">{t.library}</span>
          </h1>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#0f0f13] border border-white/10 p-1 h-auto rounded-xl flex flex-wrap">
            <LibTab value="history" icon={HistoryIcon} label={t.historyTab} testid="lib-tab-history" />
            <LibTab value="saved" icon={Bookmark} label={t.savedTab} testid="lib-tab-saved" />
            <LibTab value="templates" icon={LayoutTemplate} label={t.templatesTab} testid="lib-tab-templates" />
            <LibTab
              value="voice"
              icon={Mic2}
              label={t.brandVoiceTab}
              testid="lib-tab-voice"
              tooltip={t.brandVoiceTooltip}
              lang={lang}
            />
            <LibTab value="referral" icon={Gift} label={lang === "ar" ? "الإحالة" : "Referral"} testid="lib-tab-referral" />
          </TabsList>

          <TabsContent value="history" className="mt-6"><HistoryPanel t={t} lang={lang} /></TabsContent>
          <TabsContent value="saved" className="mt-6"><SavedPanel t={t} lang={lang} /></TabsContent>
          <TabsContent value="templates" className="mt-6"><TemplatesPanel t={t} lang={lang} /></TabsContent>
          <TabsContent value="voice" className="mt-6"><BrandVoicePanel t={t} lang={lang} /></TabsContent>
          <TabsContent value="referral" className="mt-6"><ReferralPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const LibTab = ({ value, icon: Icon, label, testid, tooltip, lang }) => (
  <TabsTrigger
    value={value}
    data-testid={testid}
    className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/30 border border-transparent rounded-lg flex items-center gap-2 px-4 py-2.5 font-bold"
  >
    <Icon className="w-4 h-4" /> {label}
    {tooltip && (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              aria-label="info"
              data-testid={`${testid}-info`}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-zinc-500 hover:text-amber-400 transition"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.stopPropagation();
              }}
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align={lang === "ar" ? "end" : "start"}
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="max-w-[260px] text-[12px] leading-relaxed bg-[#0f0f13] text-zinc-100 border border-amber-400/30 shadow-[0_0_20px_rgba(255,184,0,0.15)]"
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </TabsTrigger>
);

function ItemCard({ children, testid }) {
  return (
    <div data-testid={testid} className="rounded-2xl bg-[#0f0f13] border border-white/5 p-5 hover:border-amber-500/30 transition-all">
      {children}
    </div>
  );
}

function HistoryPanel({ t, lang }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/history`);
      setItems(res.data);
    } catch (e) {
      console.warn("[Library] history load:", e?.response?.status);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    await axios.delete(`${API}/history/${id}`);
    setItems((p) => p.filter((x) => x.hist_id !== id));
  };
  const clearAll = async () => {
    if (!window.confirm(t.clearHistoryConfirm)) return;
    await axios.delete(`${API}/history`);
    setItems([]);
    toast.success(t.deleted);
  };

  if (loading) return <Spinner />;
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{t.history}</h2>
          <p className="text-sm text-zinc-500">{t.historyDesc}</p>
        </div>
        {items.length > 0 && (
          <Button data-testid="clear-history-btn" onClick={clearAll} variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-4 h-4 me-1.5" /> {t.clearHistory}
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <Empty text={t.noHistory} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((g) => (
            <ItemCard key={g.hist_id} testid={`history-item-${g.hist_id}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400/80">
                  {t[g.content_type] || g.content_type}{g.dialect ? ` • ${t[g.dialect] || g.dialect}` : ""}
                </span>
                <div className="flex items-center gap-1.5">
                  <IconBtn onClick={() => { navigator.clipboard.writeText(g.content); toast.success(t.copied); }} testid={`history-copy-${g.hist_id}`}><Copy className="w-3.5 h-3.5" /></IconBtn>
                  <ShareButton text={g.content} testid={`history-share-${g.hist_id}`} />
                  <IconBtn onClick={() => remove(g.hist_id)} danger testid={`history-delete-${g.hist_id}`}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                </div>
              </div>
              {g.topic && <p className="text-xs text-zinc-500 mb-1.5" dir="auto">{g.topic}</p>}
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap line-clamp-5 bidi-plaintext" dir="auto">{g.content}</p>
            </ItemCard>
          ))}
        </div>
      )}
    </section>
  );
}

function SavedPanel({ t, lang }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/generations`);
      setItems(res.data);
    } catch (e) {
      console.warn("[Library] saved load:", e?.response?.status);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    await axios.delete(`${API}/generations/${id}`);
    setItems((p) => p.filter((x) => x.gen_id !== id));
  };

  if (loading) return <Spinner />;
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><Bookmark className="w-5 h-5 text-cyan-400" /> {t.mySaved}</h2>
      {items.length === 0 ? (
        <Empty text={t.noSaved} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((g) => (
            <ItemCard key={g.gen_id} testid={`saved-item-${g.gen_id}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400/80">
                  {t[g.content_type] || g.content_type}{g.dialect ? ` • ${t[g.dialect] || g.dialect}` : ""}
                </span>
                <div className="flex items-center gap-1.5">
                  <IconBtn onClick={() => { navigator.clipboard.writeText(g.content); toast.success(t.copied); }} testid={`saved-copy-${g.gen_id}`}><Copy className="w-3.5 h-3.5" /></IconBtn>
                  <ShareButton text={g.content} testid={`saved-share-${g.gen_id}`} />
                  <IconBtn onClick={() => remove(g.gen_id)} danger testid={`saved-delete-${g.gen_id}`}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                </div>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap line-clamp-5 bidi-plaintext" dir="auto">{g.content}</p>
            </ItemCard>
          ))}
        </div>
      )}
    </section>
  );
}

const TYPE_LABEL = (t, g) =>
  g.kind === "hook"
    ? `${t.hook} • ${t[g.platform] || g.platform || ""}`
    : `${t[g.content_type] || g.content_type || ""} • ${t[g.style] || g.style || ""} • ${t[g.dialect] || g.dialect || ""}`;

function TemplatesPanel({ t, lang }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/templates`);
      setItems(res.data);
    } catch (e) {
      console.warn("[Library] templates load:", e?.response?.status);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    await axios.delete(`${API}/templates/${id}`);
    setItems((p) => p.filter((x) => x.template_id !== id));
  };

  const apply = (g) => {
    const params = new URLSearchParams();
    if (g.kind === "hook") {
      params.set("tab", "hooks");
      if (g.platform) params.set("platform", g.platform);
      if (g.hook_type) params.set("hook_type", g.hook_type);
      if (g.dialect) params.set("dialect", g.dialect);
    } else {
      params.set("tab", "generator");
      if (g.content_type) params.set("type", g.content_type);
      if (g.style) params.set("style", g.style);
      if (g.dialect) params.set("dialect", g.dialect);
    }
    navigate(`/dashboard?${params.toString()}`);
  };

  if (loading) return <Spinner />;
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-amber-400" /> {t.templates}</h2>
        <p className="text-sm text-zinc-500">{t.templatesDesc}</p>
      </div>
      {items.length === 0 ? (
        <Empty text={t.noTemplates} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((g) => (
            <ItemCard key={g.template_id} testid={`template-item-${g.template_id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-white truncate" dir="auto">{g.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{TYPE_LABEL(t, g)}</p>
                </div>
                <IconBtn onClick={() => remove(g.template_id)} danger testid={`template-delete-${g.template_id}`}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
              </div>
              <Button onClick={() => apply(g)} data-testid={`template-apply-${g.template_id}`} size="sm" className="mt-3 w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400">
                {t.apply} <ArrowRight className="w-3.5 h-3.5 ms-1.5" />
              </Button>
            </ItemCard>
          ))}
        </div>
      )}
    </section>
  );
}

function BrandVoicePanel({ t, lang }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [samples, setSamples] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/brand-voice`);
      setItems(res.data);
    } catch (e) {
      console.warn("[Library] voice load:", e?.response?.status);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) { toast.error(t.voiceName); return; }
    if (samples.trim().length < 40) { toast.error(t.pastePosts); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/brand-voice`, { name: name.trim(), samples: samples.trim() });
      toast.success(t.voiceCreated);
      setName(""); setSamples("");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || t.error);
    } finally { setSaving(false); }
  };

  const activate = async (id) => { await axios.post(`${API}/brand-voice/${id}/activate`); load(); };
  const deactivate = async () => { await axios.post(`${API}/brand-voice/deactivate`); load(); };
  const remove = async (id) => { await axios.delete(`${API}/brand-voice/${id}`); load(); };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Mic2 className="w-5 h-5 text-amber-400" /> {t.brandVoice}</h2>
        <p className="text-sm text-zinc-500">{t.brandVoiceDesc}</p>
      </div>

      {/* Create form */}
      <div className="rounded-2xl bg-[#0f0f13] border border-white/5 p-5 space-y-3">
        <Input
          data-testid="voice-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.voiceName}
          className="bg-[#16161d] border-white/10 h-11 text-white"
        />
        <Textarea
          data-testid="voice-samples-input"
          value={samples}
          onChange={(e) => setSamples(e.target.value)}
          placeholder={t.pastePosts}
          className="bg-[#16161d] border-white/10 min-h-28 text-white focus-visible:ring-amber-500/40"
          dir="auto"
        />
        <Button onClick={create} disabled={saving} data-testid="voice-create-btn" className="w-full h-11 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold">
          {saving ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {t.analyzingVoice}</> : <><Wand2 className="w-4 h-4 me-2" /> {t.learnVoice}</>}
        </Button>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <Empty text={t.noVoice} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((v) => (
            <ItemCard key={v.voice_id} testid={`voice-item-${v.voice_id}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-bold text-white truncate" dir="auto">{v.name}</h3>
                  {v.is_active && (
                    <span data-testid={`voice-active-${v.voice_id}`} className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 font-mono uppercase">
                      {t.activeVoiceLabel}
                    </span>
                  )}
                </div>
                <IconBtn onClick={() => remove(v.voice_id)} danger testid={`voice-delete-${v.voice_id}`}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4 mb-3" dir="auto">{v.profile}</p>
              {v.is_active ? (
                <Button onClick={deactivate} data-testid={`voice-deactivate-${v.voice_id}`} size="sm" variant="ghost" className="w-full text-zinc-400 hover:bg-white/5">
                  <Circle className="w-3.5 h-3.5 me-1.5" /> {t.deactivateVoice}
                </Button>
              ) : (
                <Button onClick={() => activate(v.voice_id)} data-testid={`voice-activate-${v.voice_id}`} size="sm" className="w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5 me-1.5" /> {t.activateVoice}
                </Button>
              )}
            </ItemCard>
          ))}
        </div>
      )}
    </section>
  );
}

const IconBtn = ({ children, onClick, danger, testid }) => (
  <button
    onClick={onClick}
    data-testid={testid}
    className={`p-1.5 rounded text-zinc-400 transition ${danger ? "hover:text-red-400" : "hover:text-white"}`}
  >
    {children}
  </button>
);

const Empty = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
    <Sparkles className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
    <p className="text-sm text-zinc-500 italic">{text}</p>
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
  </div>
);

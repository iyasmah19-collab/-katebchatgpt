import React, { useEffect, useState } from "react";
import axios from "axios";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { Loader2, Link2, Trash2, Plus, X } from "lucide-react";

const PLATFORM_META = {
  instagram: { name: "Instagram", color: "from-pink-500 via-fuchsia-500 to-purple-600", Icon: FaInstagram },
  tiktok:    { name: "TikTok",    color: "from-cyan-400 via-cyan-500 to-pink-500",      Icon: FaTiktok    },
  youtube:   { name: "YouTube",   color: "from-red-500 via-red-600 to-rose-600",        Icon: FaYoutube   },
};

/**
 * MyAccounts — manage connected social accounts.
 * - Lists existing connections (calls GET /api/social/accounts).
 * - "Connect Instagram" opens Meta OAuth.
 * - "Connect YouTube" opens Google OAuth (youtube.readonly scope).
 * - "Add TikTok" is a manual form (TikTok has no public OAuth for personal accounts).
 */
export default function MyAccounts() {
  const { lang } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);     // platform key currently connecting
  const [showTikTok, setShowTikTok] = useState(false);
  const [tiktok, setTikTok] = useState({ username: "", followers_count: "", media_count: "", name: "" });
  const [savingTikTok, setSavingTikTok] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/social/accounts`);
      setAccounts(r.data || []);
    } catch (e) {
      // Silent failure surfaces as empty list — toast only on user-triggered actions.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startOAuth = async (platform) => {
    setConnecting(platform);
    try {
      const r = await axios.get(`${API}/auth/${platform}`);
      // Persist state hint so the callback can resume.
      sessionStorage.setItem(`oauth_${platform}_pending`, "1");
      window.location.href = r.data.url;
    } catch (err) {
      const detail = err.response?.data?.detail || (lang === "ar" ? "تعذّر بدء الاتصال" : "Could not start OAuth");
      toast.error(typeof detail === "string" ? detail : "Error");
      setConnecting(null);
    }
  };

  const submitTikTok = async () => {
    if (!tiktok.username.trim()) {
      toast.error(lang === "ar" ? "اسم المستخدم مطلوب" : "Username required");
      return;
    }
    setSavingTikTok(true);
    try {
      await axios.post(`${API}/social/connect/tiktok`, {
        username: tiktok.username.trim(),
        followers_count: parseInt(tiktok.followers_count || "0", 10) || 0,
        media_count: parseInt(tiktok.media_count || "0", 10) || 0,
        name: tiktok.name.trim() || null,
      });
      toast.success(lang === "ar" ? "تم ربط TikTok" : "TikTok connected");
      setShowTikTok(false);
      setTikTok({ username: "", followers_count: "", media_count: "", name: "" });
      load();
    } catch (err) {
      const detail = err.response?.data?.detail || (lang === "ar" ? "فشل الحفظ" : "Save failed");
      toast.error(typeof detail === "string" ? detail : "Error");
    } finally {
      setSavingTikTok(false);
    }
  };

  const disconnect = async (account_id) => {
    if (!window.confirm(lang === "ar" ? "فك الربط من هذا الحساب؟" : "Disconnect this account?")) return;
    try {
      await axios.delete(`${API}/social/accounts/${account_id}`);
      toast.success(lang === "ar" ? "تم فك الربط" : "Disconnected");
      load();
    } catch {
      toast.error(lang === "ar" ? "فشل فك الربط" : "Disconnect failed");
    }
  };

  return (
    <section
      data-testid="my-accounts"
      className="rounded-2xl bg-[#0f0f13] border border-white/5 p-6 md:p-8 space-y-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">{lang === "ar" ? "حساباتي على المنصات" : "My Social Accounts"}</h2>
          <p className="text-xs text-zinc-500 mt-1">
            {lang === "ar"
              ? "اربط حسابات Instagram, YouTube و TikTok ليتعلم منها كاتب الذكاء"
              : "Connect Instagram, YouTube & TikTok so Kateb AI can tailor advice to each account"}
          </p>
        </div>
      </div>

      {/* Connected list */}
      <div className="space-y-2" data-testid="connected-accounts-list">
        {loading && (
          <div className="text-zinc-500 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {lang === "ar" ? "جارٍ التحميل…" : "Loading…"}
          </div>
        )}
        {!loading && accounts.length === 0 && (
          <p className="text-zinc-500 text-sm">
            {lang === "ar" ? "لا توجد حسابات مربوطة بعد." : "No accounts connected yet."}
          </p>
        )}
        {accounts.map((a) => {
          const meta = PLATFORM_META[a.platform] || PLATFORM_META.tiktok;
          const Icon = meta.Icon;
          return (
            <div
              key={a.account_id}
              data-testid={`account-row-${a.platform}-${a.username}`}
              className="flex items-center gap-3 rounded-xl bg-[#16161d] border border-white/5 p-3 hover:border-white/10 transition"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">@{a.username}</span>
                  {a.connection_method === "manual" && (
                    <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-700/40 text-zinc-400">
                      {lang === "ar" ? "يدوي" : "Manual"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 flex gap-3 mt-0.5">
                  <span>{(a.followers_count || 0).toLocaleString()} {lang === "ar" ? "متابع" : "followers"}</span>
                  <span className="text-zinc-700">·</span>
                  <span>{(a.media_count || 0).toLocaleString()} {lang === "ar" ? "منشور" : "posts"}</span>
                </div>
              </div>
              <button
                onClick={() => disconnect(a.account_id)}
                data-testid={`disconnect-${a.account_id}`}
                className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                title={lang === "ar" ? "فك الربط" : "Disconnect"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Connect buttons */}
      <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          onClick={() => startOAuth("instagram")}
          disabled={connecting === "instagram"}
          data-testid="connect-instagram-btn"
          className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white font-bold hover:brightness-110"
        >
          {connecting === "instagram" ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <FaInstagram className="w-4 h-4 me-2" />}
          {lang === "ar" ? "اربط Instagram" : "Connect Instagram"}
        </Button>
        <Button
          onClick={() => startOAuth("youtube")}
          disabled={connecting === "youtube"}
          data-testid="connect-youtube-btn"
          className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold hover:brightness-110"
        >
          {connecting === "youtube" ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <FaYoutube className="w-4 h-4 me-2" />}
          {lang === "ar" ? "اربط YouTube" : "Connect YouTube"}
        </Button>
        <Button
          onClick={() => setShowTikTok((s) => !s)}
          data-testid="connect-tiktok-btn"
          className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-pink-500 text-white font-bold hover:brightness-110"
        >
          <FaTiktok className="w-4 h-4 me-2" />
          {lang === "ar" ? "أضف TikTok" : "Add TikTok"}
        </Button>
      </div>

      {/* Manual TikTok form */}
      {showTikTok && (
        <div data-testid="tiktok-form" className="rounded-xl bg-[#16161d] border border-cyan-500/20 p-4 space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaTiktok className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">{lang === "ar" ? "ربط TikTok يدوياً" : "Add TikTok manually"}</span>
            </div>
            <button onClick={() => setShowTikTok(false)} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "اسم المستخدم *" : "Username *"}</Label>
              <Input
                data-testid="tiktok-username"
                value={tiktok.username}
                onChange={(e) => setTikTok({ ...tiktok, username: e.target.value })}
                placeholder="@yourhandle"
                className="bg-[#0f0f13] border-white/10 h-10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "الاسم المعروض" : "Display name"}</Label>
              <Input
                data-testid="tiktok-name"
                value={tiktok.name}
                onChange={(e) => setTikTok({ ...tiktok, name: e.target.value })}
                placeholder={lang === "ar" ? "اختياري" : "Optional"}
                className="bg-[#0f0f13] border-white/10 h-10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "عدد المتابعين" : "Followers"}</Label>
              <Input
                data-testid="tiktok-followers"
                type="number"
                value={tiktok.followers_count}
                onChange={(e) => setTikTok({ ...tiktok, followers_count: e.target.value })}
                placeholder="0"
                className="bg-[#0f0f13] border-white/10 h-10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "عدد المنشورات" : "Posts"}</Label>
              <Input
                data-testid="tiktok-posts"
                type="number"
                value={tiktok.media_count}
                onChange={(e) => setTikTok({ ...tiktok, media_count: e.target.value })}
                placeholder="0"
                className="bg-[#0f0f13] border-white/10 h-10 text-white"
              />
            </div>
          </div>
          <Button
            onClick={submitTikTok}
            disabled={savingTikTok}
            data-testid="save-tiktok-btn"
            className="w-full bg-gradient-to-r from-cyan-400 to-pink-500 text-white font-bold"
          >
            {savingTikTok ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Plus className="w-4 h-4 me-2" />}
            {lang === "ar" ? "أضف الحساب" : "Add account"}
          </Button>
        </div>
      )}
    </section>
  );
}

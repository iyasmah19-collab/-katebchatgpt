import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API, useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import CreditsBadge from "@/components/CreditsBadge";
import ChatMessage from "@/components/ChatMessage";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import {
  Send, Bot, Loader2, ChevronDown, Plus, MessageSquare, Sparkles, Trash2, Crown, Users, BarChart3, Coins, Globe,
} from "lucide-react";

const PLATFORM_ICON = { instagram: FaInstagram, tiktok: FaTiktok, youtube: FaYoutube };

// Suggested starter prompts to bootstrap a new session.
const SUGGESTIONS = {
  ar: [
    { text: "اعطني 5 أفكار ريلز لرفع التفاعل هذا الأسبوع", Icon: Sparkles },
    { text: "حلّل أداء آخر منشوراتي واقترح تحسينات", Icon: BarChart3 },
    { text: "أفضل وقت لنشر فيديو قصير لجمهور خليجي؟", Icon: Users },
    { text: "اكتب لي 3 هوكس قوية لموضوع \"خسارة الوزن\"", Icon: Globe },
  ],
  en: [
    { text: "Give me 5 reel ideas to boost engagement this week", Icon: Sparkles },
    { text: "Analyze my recent posts and suggest improvements", Icon: BarChart3 },
    { text: "Best time to post a short video for Gulf audiences?", Icon: Users },
    { text: "Write 3 strong hooks for \"weight loss\"", Icon: Globe },
  ],
};

export default function Chat() {
  const { lang, user, t } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [creditsKey, setCreditsKey] = useState(0); // bumps to force CreditsBadge refresh
  const endRef = useRef(null);

  // Initial: load sessions + accounts
  const loadAccounts = useCallback(async () => {
    if (!user) return;
    try { const r = await axios.get(`${API}/social/accounts`); setAccounts(r.data || []); }
    catch (err) { console.warn("[Chat] loadAccounts failed:", err?.response?.status || err?.message); }
  }, [user]);
  const loadSessions = useCallback(async () => {
    if (!user) return;
    try { const r = await axios.get(`${API}/chat/sessions`); setSessions(r.data || []); }
    catch (err) { console.warn("[Chat] loadSessions failed:", err?.response?.status || err?.message); }
  }, [user]);
  useEffect(() => { loadAccounts(); loadSessions(); }, [loadAccounts, loadSessions]);

  // Load history when sessionId changes. Refactored to satisfy React 19's
  // set-state-in-effect rule by performing state updates only after async
  // boundaries (microtask / network response), never synchronously in the effect.
  const loadHistory = useCallback(async (sid, cancelFlag) => {
    if (!sid) {
      setMessages([]);
      return;
    }
    try {
      const r = await axios.get(`${API}/chat/history`, { params: { session_id: sid } });
      if (!cancelFlag.cancelled) setMessages(r.data || []);
    } catch (err) {
      console.warn("[Chat] loadHistory failed:", err?.response?.status || err?.message);
      if (!cancelFlag.cancelled) setMessages([]);
    }
  }, []);

  useEffect(() => {
    const flag = { cancelled: false };
    loadHistory(sessionId, flag);
    return () => { flag.cancelled = true; };
  }, [sessionId, loadHistory]);

  // Auto-scroll to bottom whenever messages or typing indicator change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grain px-4">
        <div className="text-center space-y-4 max-w-md">
          <Bot className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-black text-white">
            {lang === "ar" ? "سجّل الدخول للدردشة مع كاتب AI" : "Sign in to chat with Kateb AI"}
          </h1>
          <Link to="/login">
            <Button data-testid="chat-login-cta" className="bg-amber-500 text-black font-bold">{t.login}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const send = async (msgText) => {
    const text = (msgText ?? input).trim();
    if (!text || sending) return;
    setSending(true);
    // Optimistically render user turn
    const tempUserMsg = { role: "user", content: text, msg_id: `tmp_${Date.now()}` };
    setMessages((m) => [...m, tempUserMsg]);
    setInput("");
    try {
      const r = await axios.post(`${API}/chat/message`, {
        message: text,
        session_id: sessionId || undefined,
        account_context: selectedAccount
          ? {
              platform: selectedAccount.platform,
              username: selectedAccount.username,
              followers_count: selectedAccount.followers_count,
              media_count: selectedAccount.media_count,
            }
          : undefined,
      });
      setSessionId(r.data.session_id);
      setMessages((m) => [...m, { role: "assistant", content: r.data.reply, msg_id: `a_${Date.now()}` }]);
      setCreditsKey((k) => k + 1);
      window.dispatchEvent(new Event("credits:refresh"));
      // Refresh sessions list so the new one appears
      axios.get(`${API}/chat/sessions`).then((r2) => setSessions(r2.data || []));
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 402) {
        toast.error(detail || (lang === "ar" ? "انتهى رصيدك" : "Out of credits"));
      } else {
        toast.error(typeof detail === "string" ? detail : (lang === "ar" ? "خطأ" : "Error"));
      }
      // Roll back optimistic user msg on hard failure
      setMessages((m) => m.filter((x) => x.msg_id !== tempUserMsg.msg_id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const newSession = () => {
    setSessionId(null);
    setMessages([]);
  };

  const deleteSession = async (sid) => {
    if (!window.confirm(lang === "ar" ? "حذف هذه المحادثة؟" : "Delete this conversation?")) return;
    try {
      await axios.delete(`${API}/chat/sessions/${sid}`);
      setSessions((s) => s.filter((x) => x.session_id !== sid));
      if (sessionId === sid) newSession();
    } catch (err) { console.warn("[Chat] deleteSession failed:", err?.response?.status || err?.message); }
  };

  const AccountIcon = selectedAccount ? PLATFORM_ICON[selectedAccount.platform] : null;

  return (
    <div className="bg-grain min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">
              {lang === "ar" ? "محادثات" : "Conversations"}
            </h2>
            <Button onClick={newSession} size="sm" data-testid="chat-new-session" variant="outline" className="h-8 px-2 bg-transparent border-amber-400/30 text-amber-400 hover:bg-amber-400/10">
              <Plus className="w-3.5 h-3.5 me-1" />
              {lang === "ar" ? "جديدة" : "New"}
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-260px)] pr-1">
            <div className="space-y-1">
              {sessions.length === 0 && (
                <p className="text-zinc-600 text-sm px-2">
                  {lang === "ar" ? "ابدأ أول محادثة 👋" : "Start your first chat 👋"}
                </p>
              )}
              {sessions.map((s) => (
                <div
                  key={s.session_id}
                  data-testid={`session-${s.session_id}`}
                  onClick={() => setSessionId(s.session_id)}
                  className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition ${
                    sessionId === s.session_id ? "bg-amber-400/10 border border-amber-400/30" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{s.last_message || (lang === "ar" ? "محادثة" : "Conversation")}</p>
                    <p className="text-[10px] text-zinc-600 font-mono">{new Date(s.last_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.session_id); }}
                    className="opacity-0 group-hover:opacity-100 transition p-1 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main chat panel */}
        <main className="rounded-2xl bg-[#0f0f13] border border-white/10 flex flex-col min-h-[calc(100vh-120px)]">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_18px_rgba(255,184,0,0.4)]">
                <Bot className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="text-sm font-black text-white leading-tight">
                  {lang === "ar" ? "كاتب AI 🤖" : "Kateb AI 🤖"}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {lang === "ar" ? "ذكاء وسائل التواصل" : "Social media intelligence"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditsBadge refreshKey={creditsKey} />
              {/* Account Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="account-switcher"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition text-xs text-zinc-200 max-w-[160px]"
                  >
                    {selectedAccount ? (
                      <>
                        {AccountIcon && <AccountIcon className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">@{selectedAccount.username}</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" />
                        {lang === "ar" ? "كل الحسابات" : "All accounts"}
                      </>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0f0f13] border-white/10 text-white" data-testid="account-switcher-content">
                  <DropdownMenuLabel className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
                    {lang === "ar" ? "السياق" : "Context"}
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSelectedAccount(null)} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
                    <Users className="w-4 h-4 me-2" />
                    {lang === "ar" ? "كل الحسابات" : "All accounts"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {accounts.length === 0 && (
                    <div className="px-2 py-2 text-xs text-zinc-500">
                      <p>{lang === "ar" ? "لا حسابات بعد." : "No accounts yet."}</p>
                      <Link to="/settings" className="text-amber-400 hover:underline">
                        {lang === "ar" ? "اربط حسابك →" : "Connect →"}
                      </Link>
                    </div>
                  )}
                  {accounts.map((a) => {
                    const PI = PLATFORM_ICON[a.platform];
                    return (
                      <DropdownMenuItem
                        key={a.account_id}
                        onClick={() => setSelectedAccount(a)}
                        className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                        data-testid={`switch-to-${a.platform}-${a.username}`}
                      >
                        {PI && <PI className="w-4 h-4 me-2" />}
                        <span className="truncate">@{a.username}</span>
                        <span className="ms-auto text-[10px] text-zinc-500 font-mono">{a.platform}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4" data-testid="chat-messages">
            {messages.length === 0 && !sending && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(255,184,0,0.5)]">
                  <Bot className="w-8 h-8 text-black" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-2xl font-black text-white mb-2">
                    {lang === "ar" ? "اسأل كاتب AI أي شيء" : "Ask Kateb AI anything"}
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    {lang === "ar"
                      ? "أفكار محتوى · تحليل خوارزميات · أوقات النشر · هوكس وكابشنات"
                      : "Content ideas · algorithm insights · post timing · hooks & captions"}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 max-w-xl w-full">
                  {(SUGGESTIONS[lang] || SUGGESTIONS.ar).map((s, i) => (
                    <button
                      key={`suggestion-${lang}-${s.text}`}
                      data-testid={`suggestion-${i}`}
                      onClick={() => send(s.text)}
                      className="text-start rounded-xl bg-[#16161d] border border-white/5 hover:border-amber-400/30 hover:bg-amber-400/5 transition p-3 flex items-start gap-2 group"
                    >
                      <s.Icon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-zinc-300 group-hover:text-white">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.msg_id || `${m.role}-${m.created_at}`}
                data-testid={`msg-${m.role}`}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-black" />
                  </div>
                )}
                <ChatMessage role={m.role} content={m.content} />
              </div>
            ))}

            {sending && (
              <div className="flex gap-3 justify-start" data-testid="chat-typing">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-black" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-[#16161d] border border-white/5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "120ms" }} />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "240ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-white/5 px-4 sm:px-6 py-3">
            <div className="flex items-end gap-2">
              <Textarea
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={lang === "ar" ? "اسأل كاتب AI… (Enter للإرسال)" : "Ask Kateb AI… (Enter to send)"}
                className="flex-1 min-h-[44px] max-h-40 bg-[#16161d] border-white/10 text-white resize-none"
                rows={1}
              />
              <Button
                onClick={() => send()}
                disabled={!input.trim() || sending}
                data-testid="chat-send-btn"
                className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold h-11 px-4"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {!user.is_premium && (
              <p className="text-[10px] text-zinc-600 mt-2 font-mono flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                {lang === "ar" ? "كل رسالة = 1 رصيد · " : "1 credit per message · "}
                <Link to="/premium" className="text-amber-400 hover:underline inline-flex items-center gap-0.5">
                  <Crown className="w-3 h-3" />
                  {lang === "ar" ? "Premium = غير محدود" : "Premium = unlimited"}
                </Link>
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

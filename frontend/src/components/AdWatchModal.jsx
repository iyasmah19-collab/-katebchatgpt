import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API, useApp } from "@/contexts/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlayCircle, Loader2, Sparkles, X } from "lucide-react";

const COUNTDOWN_SECONDS = 5;

/**
 * Outer wrapper: re-mounts <AdInner> every time the modal opens so all internal
 * state starts fresh without needing to reset it from within an effect.
 */
export default function AdWatchModal({ open, onClose, onClaimed }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      {open ? <AdInner onClaimed={onClaimed} onClose={onClose} /> : null}
    </Dialog>
  );
}

function AdInner({ onClaimed, onClose }) {
  const { lang } = useApp();
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [phase, setPhase] = useState("counting"); // counting | claiming | done
  const claimedRef = useRef(false);

  // 1) Tick the countdown.
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2) Claim the reward exactly once when the countdown finishes.
  useEffect(() => {
    if (seconds > 0 || claimedRef.current) return undefined;
    claimedRef.current = true;
    let cancelled = false;
    setPhase("claiming");
    (async () => {
      try {
        const res = await axios.post(`${API}/match/free-trial-claim`, {});
        if (cancelled) return;
        setPhase("done");
        onClaimed?.(res.data);
        toast.success(
          lang === "ar"
            ? `🎁 ربحت محاولة مجانية! المتبقية اليوم: ${res.data.ads_remaining_today}/${res.data.ads_daily_limit}`
            : `🎁 You earned a free attempt! Today remaining: ${res.data.ads_remaining_today}/${res.data.ads_daily_limit}`,
        );
        setTimeout(() => { if (!cancelled) onClose?.(); }, 1500);
      } catch (err) {
        if (cancelled) return;
        const detail = err?.response?.data?.detail;
        toast.error(typeof detail === "string" ? detail : (lang === "ar" ? "تعذّر منح المحاولة" : "Could not claim attempt"));
        onClose?.();
      }
    })();
    return () => { cancelled = true; };
  }, [seconds, lang, onClaimed, onClose]);

  const pct = ((COUNTDOWN_SECONDS - seconds) / COUNTDOWN_SECONDS) * 100;
  const claiming = phase === "claiming";
  const done = phase === "done";

  return (
    <DialogContent
      data-testid="ad-watch-modal"
      className="bg-[#0c0c10] border-amber-500/30 text-white max-w-md"
      onInteractOutside={(e) => e.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-amber-400">
          <PlayCircle className="w-5 h-5" />
          {lang === "ar" ? "إعلان قصير" : "Short Ad"}
        </DialogTitle>
        <DialogDescription className="text-zinc-400">
          {lang === "ar"
            ? "شاهد هذا الإعلان (5 ثوان) لتحصل على محاولة مجانية إضافية."
            : "Watch this 5-second ad to earn one free attempt."}
        </DialogDescription>
      </DialogHeader>

      <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-black to-black aspect-video flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,184,0,0.5), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,184,0,0.3), transparent 40%)",
        }}/>
        <div className="relative text-center space-y-3">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
          <p className="text-xl font-black tracking-tight">
            {lang === "ar" ? "كاتب — اصنع محتواً يلتصق" : "Kateb — content that sticks"}
          </p>
          <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">
            {lang === "ar" ? "إعلان تجريبي" : "Demo Ad"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            data-testid="ad-watch-progress"
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono uppercase tracking-widest">
          <span>
            {claiming
              ? (lang === "ar" ? "جارٍ منح المكافأة..." : "Granting reward...")
              : done
              ? (lang === "ar" ? "تم!" : "Done!")
              : (lang === "ar" ? `${seconds} ثوان متبقية` : `${seconds}s remaining`)}
          </span>
          <span className="flex items-center gap-1">
            {claiming && <Loader2 className="w-3 h-3 animate-spin" />}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        {done && (
          <Button data-testid="ad-watch-close-btn" variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4 me-1.5" /> {lang === "ar" ? "إغلاق" : "Close"}
          </Button>
        )}
      </div>
    </DialogContent>
  );
}

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API, useApp } from "@/contexts/AppContext";
import { Coins, Infinity as InfinityIcon, Crown } from "lucide-react";

/**
 * CreditsBadge — small badge showing the user's remaining credits.
 * - Premium users see an Infinity glyph.
 * - Free users see the credit count; when 0, the badge becomes a "Get Premium" CTA.
 *
 * Pages can pass `refreshKey` (number/string) — whenever it changes, the badge re-fetches.
 */
export default function CreditsBadge({ refreshKey = 0, className = "" }) {
  const { user, lang } = useApp();
  const [credits, setCredits] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    const fetchBalance = () => {
      axios.get(`${API}/credits/balance`)
        .then((r) => {
          if (cancel) return;
          setCredits(r.data.credits);
          setIsPremium(!!r.data.is_premium);
        })
        .catch(() => {});
    };
    fetchBalance();
    // Subscribe to a global event so any badge refreshes after credit-spending actions.
    const handler = () => fetchBalance();
    window.addEventListener("credits:refresh", handler);
    return () => {
      cancel = true;
      window.removeEventListener("credits:refresh", handler);
    };
  }, [user, refreshKey]);

  if (!user) return null;

  if (isPremium) {
    return (
      <div
        data-testid="credits-badge-premium"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold ${className}`}
      >
        <Crown className="w-3.5 h-3.5 fill-amber-400" />
        <InfinityIcon className="w-3.5 h-3.5" />
        <span className="font-mono uppercase tracking-widest">Premium</span>
      </div>
    );
  }

  const danger = credits !== null && credits <= 3;
  const empty = credits === 0;

  if (empty) {
    return (
      <Link to="/premium" data-testid="credits-badge-empty" className={`inline-flex ${className}`}>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/25 transition">
          <Coins className="w-3.5 h-3.5" />
          {lang === "ar" ? "انتهى الرصيد · ترقّى" : "Out of credits · Upgrade"}
        </span>
      </Link>
    );
  }

  return (
    <div
      data-testid="credits-badge"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
        danger
          ? "bg-amber-500/15 border border-amber-500/40 text-amber-300"
          : "bg-white/5 border border-white/10 text-zinc-200"
      } text-xs font-bold ${className}`}
    >
      <Coins className="w-3.5 h-3.5 text-amber-400" />
      <span className="font-mono tabular-nums" data-testid="credits-count">{credits ?? "—"}</span>
      <span className="text-zinc-500 font-normal">
        {lang === "ar" ? "رصيد" : "credits"}
      </span>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { X, Crown } from "lucide-react";

export default function AdBanner({ variant = "inline" }) {
  const { user, lang, t } = useApp();
  const [dismissed, setDismissed] = React.useState(false);
  if (user?.is_premium || dismissed) return null;

  return (
    <div
      data-testid="ad-banner"
      className={`relative rounded-2xl border border-dashed border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 px-4 py-3 flex items-center justify-between gap-3 ${
        variant === "inline" ? "" : "mt-4"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400/80">
            {lang === "ar" ? "إعلان" : "Sponsored"}
          </div>
          <p className="text-sm text-zinc-300 truncate">
            {lang === "ar"
              ? "خلّيك Premium وانس الإعلانات للأبد — $5/شهر فقط"
              : "Go Premium — no ads, ever. From $5/mo"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/premium"
          data-testid="ad-upgrade-link"
          className="text-xs font-bold text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline"
        >
          {t.unlockPremium} →
        </Link>
        <button
          onClick={() => setDismissed(true)}
          data-testid="ad-dismiss"
          className="p-1 rounded text-zinc-500 hover:text-white"
          aria-label="dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { Share2, Copy, MessageCircle, Send } from "lucide-react";
import { FaWhatsapp, FaXTwitter, FaTelegram } from "react-icons/fa6";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

/**
 * Reusable share control. Uses the native Web Share API when available
 * (mobile browsers) and always offers explicit social fallbacks.
 */
export const ShareButton = ({ text, className = "", size = "sm", testid = "share-btn" }) => {
  const { t, lang } = useApp();
  const payload = (text || "").trim();

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: payload });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const enc = encodeURIComponent(payload);
  const links = {
    whatsapp: `https://wa.me/?text=${enc}`,
    twitter: `https://twitter.com/intent/tweet?text=${enc}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(" ")}&text=${enc}`,
  };

  const openLink = (url) => window.open(url, "_blank", "noopener,noreferrer");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      toast.success(t.copied);
    } catch {
      toast.error(t.error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid={testid}
          onClick={async (e) => {
            // On devices with native share, a direct tap triggers it; the menu still opens as fallback.
            if (await nativeShare()) e.preventDefault();
          }}
          className={`inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 ${
            size === "sm" ? "h-8 text-xs" : "h-9 text-sm"
          } text-zinc-300 hover:text-white hover:border-white/30 transition ${className}`}
        >
          <Share2 className="w-3.5 h-3.5" />
          {t.share}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={lang === "ar" ? "start" : "end"} className="bg-[#0f0f13] border-white/10 text-white" data-testid="share-menu">
        <DropdownMenuItem data-testid="share-whatsapp" onClick={() => openLink(links.whatsapp)} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <FaWhatsapp className="w-4 h-4 me-2 text-[#25D366]" /> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="share-twitter" onClick={() => openLink(links.twitter)} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <FaXTwitter className="w-4 h-4 me-2" /> X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="share-telegram" onClick={() => openLink(links.telegram)} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <FaTelegram className="w-4 h-4 me-2 text-[#29B6F6]" /> Telegram
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="share-copy" onClick={copy} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <Copy className="w-4 h-4 me-2 text-amber-400" /> {t.copy}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check, AlertTriangle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { escapeWebViewAndOpen, copyToClipboard } from "@/lib/oauth-helper";

// Shown when Google login is attempted from an in-app browser (Instagram, Facebook,
// TikTok, etc.). Google blocks WebView OAuth with "403 disallowed_useragent" since 2021.
//
// Props:
//   open      : boolean      — controls visibility
//   onClose   : () => void
//   appName   : string|null  — detected in-app browser (e.g. "Instagram")
//   platform  : 'android'|'ios'|'desktop'
//   authUrl   : string       — the Kateb backend OAuth URL to open in the real browser
export default function InAppBrowserDialog({ open, onClose, appName, platform, authUrl }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [copied, setCopied] = useState(false);

  const detected = appName || (ar ? "تطبيق آخر" : "another app");

  const handleOpenBrowser = () => {
    escapeWebViewAndOpen(authUrl);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(authUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Platform-specific manual instructions (used as fallback when intent:// doesn't fire).
  const manualSteps = () => {
    if (platform === "ios") {
      if (appName === "Instagram") {
        return ar
          ? [
              "اضغط على زر القائمة (⋯) في أعلى يمين الشاشة.",
              "اختر «فتح في المتصفّح الخارجي» أو «Open in External Browser».",
              "ستفتح الصفحة في Safari ويمكنك إكمال تسجيل الدخول.",
            ]
          : [
              "Tap the menu (⋯) in the top-right corner.",
              "Choose 'Open in External Browser'.",
              "The page will open in Safari and you can sign in.",
            ];
      }
      if (appName === "Facebook" || appName === "Messenger") {
        return ar
          ? [
              "اضغط على القائمة (⋯) في أسفل الشاشة أو أعلاها.",
              "اختر «فتح في Safari» أو «Open in Safari».",
            ]
          : [
              "Tap the menu (⋯) at the bottom or top.",
              "Choose 'Open in Safari'.",
            ];
      }
      return ar
        ? [
            "افتح قائمة التطبيق (عادةً أيقونة ⋯ أو مشاركة).",
            "اختر «فتح في Safari» أو «نسخ الرابط» ولصقه في Safari.",
          ]
        : [
            "Open the app menu (usually ⋯ or share).",
            "Choose 'Open in Safari' or copy the link and paste it in Safari.",
          ];
    }
    if (platform === "android") {
      return ar
        ? [
            "اضغط على «افتح في المتصفّح» في الأعلى.",
            "إذا لم تُفتح تلقائياً: انسخ الرابط أدناه والصقه في Chrome.",
          ]
        : [
            "Tap 'Open in Browser' above.",
            "If it doesn't open automatically: copy the link below and paste it in Chrome.",
          ];
    }
    return ar
      ? ["انسخ الرابط أدناه وافتحه في متصفّح عادي (Chrome، Safari، Firefox، أو Edge)."]
      : ["Copy the link below and open it in a regular browser (Chrome, Safari, Firefox, or Edge)."];
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent
        className="bg-[#0f0f13] border border-amber-500/30 text-white max-w-md"
        dir={ar ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <DialogTitle className="text-xl font-black text-white" dir="auto">
            {ar
              ? `تسجيل دخول Google لا يعمل داخل ${detected}`
              : `Google login doesn't work inside ${detected}`}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 leading-relaxed pt-1" dir="auto">
            {ar
              ? "بسبب سياسة Google الأمنية، لا يمكن تسجيل الدخول داخل التطبيقات. افتح الصفحة في متصفّحك العادي للمتابعة."
              : "Due to Google's security policy, sign-in isn't allowed inside in-app browsers. Open this page in your regular browser to continue."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleOpenBrowser}
            className="w-full h-11 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110"
            data-testid="open-in-browser-btn"
          >
            <ExternalLink className="w-4 h-4 me-2" />
            {ar ? "افتح في المتصفّح" : "Open in Browser"}
          </Button>

          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full h-11 bg-transparent border-white/15 hover:bg-white/5 text-white"
            data-testid="copy-auth-link-btn"
          >
            {copied ? <Check className="w-4 h-4 me-2 text-green-400" /> : <Copy className="w-4 h-4 me-2" />}
            {copied
              ? (ar ? "تم النسخ ✓" : "Copied ✓")
              : (ar ? "انسخ الرابط" : "Copy Link")}
          </Button>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3 mt-2">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
              {ar ? "إذا لم يعمل الزر تلقائياً:" : "If the button doesn't work:"}
            </p>
            <ol className="text-sm text-zinc-300 leading-relaxed space-y-1.5 list-decimal ps-5" dir="auto">
              {manualSteps().map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <p className="text-xs text-zinc-500 text-center pt-1" dir="auto">
            {ar
              ? "بدلاً من ذلك، يمكنك تسجيل الدخول بالبريد وكلمة السر من نفس التطبيق."
              : "Alternatively, you can sign in with email & password right here."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

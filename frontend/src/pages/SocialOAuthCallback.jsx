import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/contexts/AppContext";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/**
 * Generic OAuth callback page for /auth/instagram and /auth/youtube.
 * - Reads ?code & ?state from URL.
 * - POSTs to /api/auth/{platform}/exchange.
 * - Redirects to /settings on success.
 */
export default function SocialOAuthCallback({ platform }) {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | done | error
  const [error, setError] = useState("");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const errParam = params.get("error");

    if (errParam) {
      setStatus("error");
      setError(errParam);
      return;
    }
    if (!code || !state) {
      setStatus("error");
      setError("Missing OAuth parameters");
      return;
    }

    const redirect_uri = `${window.location.origin}/auth/${platform}`;
    axios
      .post(`${API}/auth/${platform}/exchange`, { code, state, redirect_uri })
      .then(() => {
        setStatus("done");
        toast.success(platform === "instagram" ? "Instagram تم ربطه" : "YouTube connected");
        setTimeout(() => nav("/settings"), 800);
      })
      .catch((err) => {
        setStatus("error");
        const detail = err.response?.data?.detail || "OAuth failed";
        setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      });
  }, [platform, params, nav]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-grain px-4">
      <div className="text-center max-w-md space-y-3">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-amber-400 mx-auto animate-spin" />
            <p className="text-white font-bold">جارٍ إكمال ربط {platform}…</p>
          </>
        )}
        {status === "done" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-white font-bold">تم الربط بنجاح — جارٍ التحويل…</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-white font-bold">فشل الربط</p>
            <p className="text-xs text-zinc-400 font-mono break-all">{error}</p>
            <button onClick={() => nav("/settings")} className="text-amber-400 hover:underline text-sm">
              العودة إلى الإعدادات →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useApp } from "@/contexts/AppContext";
import { Crown, Loader2, X } from "lucide-react";

export default function OwnerUnlock() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser, lang } = useApp();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const hasRun = React.useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    (async () => {
      try {
        const res = await axios.post(`${API}/auth/owner-unlock`, { token });
        setUser(res.data.user);
        setStatus("success");
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      } catch {
        setStatus("error");
      }
    })();
  }, [token, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-grain px-4">
      <div className="vault-card rounded-3xl p-10 max-w-md w-full text-center glow-gold-strong">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-amber-400 mx-auto animate-spin mb-4" />
            <p className="text-white font-bold">
              {lang === "ar" ? "جاري فتح Premium..." : "Unlocking Premium..."}
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 animate-pulse-gold">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black shine-text mb-2">
              {lang === "ar" ? "تم تفعيل Premium 🎉" : "Premium Activated 🎉"}
            </h2>
            <p className="text-zinc-400 text-sm">
              {lang === "ar" ? "نوصلك لـ Dashboard..." : "Redirecting to dashboard..."}
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {lang === "ar" ? "الرابط غير صالح" : "Invalid link"}
            </h2>
            <p className="text-zinc-400 text-sm">
              {lang === "ar" ? "تأكد من نسخ الرابط كاملاً" : "Make sure the link is copied correctly"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

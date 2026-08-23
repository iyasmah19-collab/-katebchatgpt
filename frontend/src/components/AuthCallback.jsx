import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useApp } from "@/contexts/AppContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate("/");
      return;
    }
    const sessionId = match[1];

    (async () => {
      try {
        const res = await axios.post(`${API}/auth/session`, { session_id: sessionId });
        setUser(res.data.user);
        window.history.replaceState(null, "", "/dashboard");
        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/");
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-amber-400 font-mono text-sm tracking-widest animate-pulse">
        AUTHENTICATING...
      </div>
    </div>
  );
}

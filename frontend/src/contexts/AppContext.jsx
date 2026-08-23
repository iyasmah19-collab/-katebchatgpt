import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { translations } from "@/i18n";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "ar");
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const t = translations[lang];

  const checkAuth = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/me`);
      setUser(res.data);
    } catch (err) {
      // 401 simply means "not logged in" — anything else is worth surfacing in DevTools.
      if (err?.response?.status && err.response.status !== 401) {
        console.warn("[AppContext] checkAuth failed:", err.response.status, err.response.data);
      }
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    if (window.location.hash?.includes("session_id=")) {
      setLoadingUser(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (err) {
      // Logout is best-effort — clear local state regardless, but log the failure so we can
      // diagnose server/cookie issues during dev.
      console.warn("[AppContext] logout request failed:", err?.response?.status || err?.message);
    }
    setUser(null);
    window.location.href = "/";
  };

  const toggleLang = () => setLang((l) => (l === "ar" ? "en" : "ar"));

  // Memoise the context value so consumers don't re-render on every parent render.
  // Recomputes only when one of these inputs actually changes.
  const value = useMemo(
    () => ({ lang, t, user, setUser, loadingUser, logout, toggleLang, checkAuth }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, t, user, loadingUser, checkAuth]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);

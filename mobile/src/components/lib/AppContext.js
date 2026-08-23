import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setSessionToken, getSessionToken } from "./api";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = await getSessionToken();
      if (!token) { setUser(null); return; }
      const u = await api.me();
      // Re-verify Google Play subscription on every app open. The backend
      // revokes premium if the subscription is expired/cancelled/on-hold.
      try {
        const status = await api.subscriptionStatus();
        if (status && typeof status.is_premium === "boolean") {
          u.is_premium = status.is_premium;
        }
      } catch {
        // Non-fatal: keep the value returned by /auth/me.
      }
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const unlockOwner = async (token) => {
    const data = await api.ownerUnlock(token);
    await setSessionToken(data.session_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.logout(); } catch {}
    await setSessionToken(null);
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, setUser, loadingUser, refreshUser, unlockOwner, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Vault from "@/pages/Vault";
import Premium from "@/pages/Premium";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Settings from "@/pages/Settings";
import Library from "@/pages/Library";
import AuthCallback from "@/components/AuthCallback";
import GoogleCallback from "@/pages/GoogleCallback";
import OwnerUnlock from "@/pages/OwnerUnlock";
import Virality from "@/pages/Virality";
import Chat from "@/pages/Chat";
import Credits from "@/pages/Credits";
import SocialOAuthCallback from "@/pages/SocialOAuthCallback";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/google" element={<GoogleCallback />} />
        <Route path="/auth/instagram" element={<SocialOAuthCallback platform="instagram" />} />
        <Route path="/auth/youtube" element={<SocialOAuthCallback platform="youtube" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/library" element={<Library />} />
        <Route path="/virality" element={<Virality />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/premium/success" element={<Premium />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/unlock/:token" element={<OwnerUnlock />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Toaster position="top-center" theme="dark" toastOptions={{ style: { background: "#0f0f13", color: "#fff", border: "1px solid rgba(255,215,0,0.2)" } }} />
          <AppRouter />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

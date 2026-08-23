import React, { useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API, useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { errMsg } from "@/lib/utils";
import { Sun, Moon, Camera, Trash2, Loader2, Save, LogOut, Crown, ArrowLeft } from "lucide-react";
import MyAccounts from "@/components/MyAccounts";
import CreditsBadge from "@/components/CreditsBadge";

export default function Settings() {
  const { t, lang, user, setUser, logout, toggleLang } = useApp();
  const { theme, toggle: toggleTheme } = useTheme();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({
    username: user?.username || "",
    email: user?.email || "",
    name: user?.name || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grain">
        <div className="text-center space-y-4">
          <p className="text-zinc-400">{t.loginRequired}</p>
          <Link to="/login"><Button className="bg-amber-500 text-black font-bold">{t.login}</Button></Link>
        </div>
      </div>
    );
  }

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const r = await axios.put(`${API}/auth/profile`, profile);
      setUser(r.data.user);
      toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : t.error);
    } finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    if (!pw.new_password) return;
    setSavingPw(true);
    try {
      await axios.put(`${API}/auth/password`, pw);
      setPw({ current_password: "", new_password: "" });
      toast.success(lang === "ar" ? "تم تغيير كلمة السر" : "Password changed");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : t.error);
    } finally { setSavingPw(false); }
  };

  const onAvatarChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await axios.post(`${API}/auth/avatar`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setUser({ ...user, avatar_path: r.data.avatar_path, picture: r.data.url });
      toast.success(lang === "ar" ? "تم تحديث الصورة" : "Avatar updated");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : t.error);
    } finally { setUploadingAvatar(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const removeAvatar = async () => {
    try {
      await axios.delete(`${API}/auth/avatar`);
      setUser({ ...user, avatar_path: null, picture: "" });
      toast.success(lang === "ar" ? "تم حذف الصورة" : "Avatar removed");
    } catch (err) { toast.error(errMsg(err, t.error)); }
  };

  const avatarSrc = user.picture?.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${user.picture}` : user.picture;

  return (
    <div className="bg-grain min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="shine-text">{lang === "ar" ? "الإعدادات" : "Settings"}</span>
          </h1>
          <div className="flex items-center gap-3">
            <CreditsBadge />
            <Link to="/dashboard" className="text-zinc-500 hover:text-amber-400 text-sm inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> {lang === "ar" ? "رجوع" : "Back"}
            </Link>
          </div>
        </div>

        {/* My Social Accounts — Phase 2 */}
        <MyAccounts />

        {/* Profile Card */}
        <section className="rounded-2xl bg-[#0f0f13] border border-white/5 p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-white">{lang === "ar" ? "الحساب الشخصي" : "Profile"}</h2>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-2 ring-amber-500/30">
                <AvatarImage src={avatarSrc} alt={user.username || user.name} />
                <AvatarFallback className="bg-amber-500/15 text-amber-400 text-2xl font-bold">
                  {(user.username || user.name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user.is_premium && (
                <Crown className="absolute -top-1 -end-1 w-6 h-6 text-amber-400 fill-amber-400" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarChange} className="hidden" data-testid="avatar-input" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar} data-testid="upload-avatar-btn" size="sm" className="bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25">
                  {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 me-1.5" />}
                  {lang === "ar" ? "غيّر الصورة" : "Change avatar"}
                </Button>
                {(user.avatar_path || user.picture) && (
                  <Button onClick={removeAvatar} variant="ghost" size="sm" data-testid="remove-avatar-btn" className="text-zinc-400 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5 me-1.5" />
                    {lang === "ar" ? "إزالة" : "Remove"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-zinc-600">{lang === "ar" ? "PNG/JPG/WEBP/GIF حتى 5MB" : "PNG/JPG/WEBP/GIF up to 5MB"}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "اسم المستخدم" : "Username"}</Label>
              <Input data-testid="settings-username" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className="bg-[#16161d] border-white/10 h-11 text-white focus-visible:ring-amber-500/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "الاسم المعروض" : "Display name"}</Label>
              <Input data-testid="settings-name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="bg-[#16161d] border-white/10 h-11 text-white focus-visible:ring-amber-500/40" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <Input data-testid="settings-email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="bg-[#16161d] border-white/10 h-11 text-white focus-visible:ring-amber-500/40" />
            </div>
          </div>

          <Button onClick={saveProfile} disabled={savingProfile} data-testid="save-profile-btn" className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold">
            {savingProfile ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Save className="w-4 h-4 me-2" />}
            {lang === "ar" ? "حفظ التغييرات" : "Save changes"}
          </Button>
        </section>

        {/* Password */}
        <section className="rounded-2xl bg-[#0f0f13] border border-white/5 p-6 md:p-8 space-y-5">
          <h2 className="text-lg font-bold text-white">{lang === "ar" ? "كلمة السر" : "Password"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "كلمة السر الحالية" : "Current password"}</Label>
              <Input data-testid="current-pw" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} className="bg-[#16161d] border-white/10 h-11 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-zinc-500">{lang === "ar" ? "كلمة السر الجديدة" : "New password"}</Label>
              <Input data-testid="new-pw" type="password" minLength={6} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} className="bg-[#16161d] border-white/10 h-11 text-white" />
            </div>
          </div>
          <Button onClick={changePassword} disabled={savingPw || !pw.new_password} data-testid="change-pw-btn" className="bg-white text-black font-bold hover:bg-zinc-200">
            {savingPw ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
            {lang === "ar" ? "تحديث كلمة السر" : "Update password"}
          </Button>
        </section>

        {/* Appearance */}
        <section className="rounded-2xl bg-[#0f0f13] border border-white/5 p-6 md:p-8 space-y-5">
          <h2 className="text-lg font-bold text-white">{lang === "ar" ? "المظهر" : "Appearance"}</h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
              <div>
                <p className="text-white font-medium">{lang === "ar" ? "الثيم" : "Theme"}</p>
                <p className="text-xs text-zinc-500">{theme === "dark" ? (lang === "ar" ? "داكن" : "Dark") : (lang === "ar" ? "فاتح" : "Light")}</p>
              </div>
            </div>
            <Switch checked={theme === "light"} onCheckedChange={toggleTheme} data-testid="theme-toggle" />
          </div>
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div>
              <p className="text-white font-medium">{lang === "ar" ? "اللغة" : "Language"}</p>
              <p className="text-xs text-zinc-500">{lang === "ar" ? "العربية" : "English"}</p>
            </div>
            <Button onClick={toggleLang} variant="outline" size="sm" data-testid="settings-lang-toggle" className="bg-transparent border-white/10 text-white hover:bg-white/5">
              {lang === "ar" ? "Switch to English" : "تبديل للعربية"}
            </Button>
          </div>
        </section>

        {/* Account actions */}
        <section className="rounded-2xl bg-[#0f0f13] border border-white/5 p-6 md:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white">{lang === "ar" ? "إجراءات الحساب" : "Account"}</h2>
          <div className="flex flex-wrap gap-3">
            {!user.is_premium && (
              <Link to="/premium">
                <Button data-testid="settings-upgrade" className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold">
                  <Crown className="w-4 h-4 me-2" />
                  {t.unlockPremium}
                </Button>
              </Link>
            )}
            <Button onClick={logout} variant="outline" data-testid="settings-logout" className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
              <LogOut className="w-4 h-4 me-2" />
              {t.logout}
            </Button>
          </div>
          <p className="text-xs text-zinc-600">
            {lang === "ar" ? `معرف الحساب: ${user.user_id}` : `Account ID: ${user.user_id}`}
          </p>
        </section>
      </div>
    </div>
  );
}

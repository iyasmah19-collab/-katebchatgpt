import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sparkles,
  Languages,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
  Crown,
  Menu,
  LayoutDashboard,
  KeyRound,
  BookOpen,
  Bot,
  Flame,
  CreditCard,
} from "lucide-react";
import CreditsBadge from "@/components/CreditsBadge";

export default function Header() {
  const { t, lang, toggleLang, user, logout } = useApp();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const NavItem = ({ to, label, testid }) => {
    const active = loc.pathname === to;
    return (
      <Link
        to={to}
        data-testid={testid}
        className={`relative px-3 py-2 text-sm font-medium transition-colors ${
          active ? "text-amber-400" : "text-zinc-400 hover:text-white"
        }`}
      >
        {label}
        {active && (
          <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        )}
      </Link>
    );
  };

  // Mobile drawer nav item
  const MobileNavItem = ({ to, label, icon: Icon, testid }) => {
    const active = loc.pathname === to;
    return (
      <SheetClose asChild>
        <Link
          to={to}
          data-testid={testid}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
            active
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
              : "text-zinc-300 hover:bg-white/5 border border-transparent"
          }`}
        >
          {Icon && <Icon className="w-5 h-5 shrink-0" />}
          <span className="font-medium">{label}</span>
        </Link>
      </SheetClose>
    );
  };

  const avatarSrc = user?.picture?.startsWith("/api/")
    ? `${process.env.REACT_APP_BACKEND_URL}${user.picture}`
    : user?.picture;
  const initial = (user?.username || user?.name || "?").charAt(0).toUpperCase();

  // Drawer slides in from the side opposite to the document direction so it
  // feels native: RTL pages → drawer from the left, LTR pages → from the right.
  const sheetSide = lang === "ar" ? "left" : "right";

  return (
    <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/10">
      {/*
        Force LTR layout for the header bar itself so the brand stays on the
        visual LEFT and the controls (auth / hamburger) stay on the visual
        RIGHT, regardless of the page language. This matches the user's spec:
        "الشعار عاليسار من فوق وجنبه من اليمين اسم التطبيق".
      */}
      <div
        dir="ltr"
        className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3"
      >
        {/* LEFT — Brand (logo icon + app name with shine) */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          data-testid="logo-link"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.4)]">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="text-xl font-black tracking-tight shine-text">
            {t.appName}
          </span>
        </Link>

        {/* CENTER — Desktop nav (visible only on lg+) */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavItem to="/dashboard" label={t.dashboard} testid="nav-dashboard" />
          <NavItem to="/chat" label={lang === "ar" ? "كاتب AI" : "Kateb AI"} testid="nav-chat" />
          <NavItem to="/virality" label={lang === "ar" ? "فحص الانتشار" : "Virality"} testid="nav-virality" />
          <NavItem to="/vault" label={t.vault} testid="nav-vault" />
          <NavItem to="/library" label={t.library} testid="nav-library" />
          {user && (
            <NavItem to="/credits" label={lang === "ar" ? "Credits 💳" : "Credits 💳"} testid="nav-credits" />
          )}
          <NavItem
            to="/premium"
            label={
              user?.is_premium
                ? lang === "ar"
                  ? "Premium ✓"
                  : "Premium ✓"
                : t.premium
            }
            testid="nav-premium"
          />
        </nav>

        {/* RIGHT — Controls */}
        <div className="flex items-center gap-2">
          {/* Credits badge — only for logged-in users; refreshes on user change */}
          {user && (
            <div className="hidden md:block">
              <CreditsBadge />
            </div>
          )}
          {/* Language toggle — hidden on very small screens; available inside drawer too */}
          <button
            data-testid="lang-toggle"
            onClick={toggleLang}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-xs font-mono uppercase tracking-widest text-zinc-300"
          >
            <Languages className="w-3.5 h-3.5" />
            {lang === "ar" ? "EN" : "AR"}
          </button>

          {user ? (
            <>
              {/* Logged-in: full dropdown on desktop, compact avatar on mobile/tablet */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      data-testid="user-menu"
                      className="relative flex items-center gap-2 ps-1 pe-2 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition"
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs font-bold">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      {user.is_premium && (
                        <Crown className="absolute -top-1 -end-1 w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      )}
                      <span className="hidden sm:inline text-sm text-zinc-300 max-w-[100px] truncate">
                        {user.username || user.name}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="bg-[#0f0f13] border-white/10 text-white min-w-52"
                    data-testid="user-menu-content"
                  >
                    <DropdownMenuLabel className="text-zinc-400 font-mono text-xs uppercase">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <Link to="/settings">
                      <DropdownMenuItem
                        data-testid="menu-settings"
                        className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                      >
                        <SettingsIcon className="w-4 h-4 me-2" />
                        {lang === "ar" ? "الإعدادات" : "Settings"}
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/library">
                      <DropdownMenuItem
                        data-testid="menu-library"
                        className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                      >
                        <UserIcon className="w-4 h-4 me-2" />
                        {t.library}
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/premium">
                      <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-amber-400">
                        <Crown className="w-4 h-4 me-2" />
                        {user.is_premium
                          ? lang === "ar"
                            ? "حالة اشتراك Premium"
                            : "Premium Status"
                          : t.unlockPremium}
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={logout}
                      data-testid="menu-logout"
                      className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4 me-2" />
                      {t.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Compact avatar pill for mobile/tablet (decorative; details live in the drawer) */}
              <div className="lg:hidden relative flex items-center" data-testid="mobile-avatar">
                <Avatar className="w-8 h-8 ring-2 ring-amber-400/20">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                {user.is_premium && (
                  <Crown className="absolute -top-1 -end-1 w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                )}
              </div>
            </>
          ) : (
            // Logged-out: login/signup buttons stay visible on every screen at the top-right
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="login-btn"
                  className="text-zinc-300 hover:text-white px-2 sm:px-3"
                >
                  {t.login}
                </Button>
              </Link>
              <Link to="/signup" className="hidden xs:block sm:block">
                <Button
                  size="sm"
                  data-testid="signup-btn"
                  className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110 shadow-[0_0_15px_rgba(255,184,0,0.4)] whitespace-nowrap"
                >
                  {lang === "ar" ? "ابدأ مجاناً" : "Sign up free"}
                </Button>
              </Link>
            </div>
          )}

          {/* Hamburger — visible on < lg (mobile + tablet) */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                data-testid="hamburger-btn"
                aria-label="Open menu"
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-zinc-300"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side={sheetSide}
              dir={lang === "ar" ? "rtl" : "ltr"}
              data-testid="mobile-drawer"
              className="bg-[#0a0a0d] border-white/10 text-white p-0 w-[85%] sm:max-w-sm flex flex-col overflow-y-auto"
            >
              {/* Drawer header — same brand mark + shine text */}
              <SheetHeader className="p-4 border-b border-white/10">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.4)]">
                    <Sparkles className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-xl font-black tracking-tight shine-text">
                    {t.appName}
                  </span>
                </SheetTitle>
              </SheetHeader>

              {/* Logged-in user card */}
              {user && (
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg border border-white/10">
                    <Avatar className="w-11 h-11 ring-2 ring-amber-400/30">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback className="bg-amber-500/20 text-amber-400 font-bold">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                        {user.username || user.name}
                        {user.is_premium && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 truncate font-mono">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex">
                    <CreditsBadge />
                  </div>
                </div>
              )}

              {/* Primary nav */}
              <div className="p-4 space-y-1">
                <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  {lang === "ar" ? "التنقل" : "Navigation"}
                </div>
                <MobileNavItem
                  to="/dashboard"
                  label={t.dashboard}
                  icon={LayoutDashboard}
                  testid="mobile-nav-dashboard"
                />
                <MobileNavItem
                  to="/chat"
                  label={lang === "ar" ? "كاتب AI" : "Kateb AI"}
                  icon={Bot}
                  testid="mobile-nav-chat"
                />
                <MobileNavItem
                  to="/virality"
                  label={lang === "ar" ? "فحص الانتشار" : "Virality Check"}
                  icon={Flame}
                  testid="mobile-nav-virality"
                />
                <MobileNavItem
                  to="/vault"
                  label={t.vault}
                  icon={KeyRound}
                  testid="mobile-nav-vault"
                />
                <MobileNavItem
                  to="/library"
                  label={t.library}
                  icon={BookOpen}
                  testid="mobile-nav-library"
                />
                {user && (
                  <MobileNavItem
                    to="/credits"
                    label={lang === "ar" ? "Credits 💳" : "Credits 💳"}
                    icon={CreditCard}
                    testid="mobile-nav-credits"
                  />
                )}
                <MobileNavItem
                  to="/premium"
                  label={
                    user?.is_premium
                      ? lang === "ar"
                        ? "Premium ✓"
                        : "Premium ✓"
                      : t.premium
                  }
                  icon={Crown}
                  testid="mobile-nav-premium"
                />
              </div>

              {/* Settings section */}
              <div className="p-4 border-t border-white/10 space-y-1">
                <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  {lang === "ar" ? "الإعدادات" : "Settings"}
                </div>

                {/* Language toggle */}
                <button
                  onClick={toggleLang}
                  data-testid="mobile-lang-toggle"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-zinc-300"
                >
                  <span className="flex items-center gap-3">
                    <Languages className="w-5 h-5" />
                    <span className="font-medium text-sm">
                      {lang === "ar" ? "اللغة" : "Language"}
                    </span>
                  </span>
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                    {lang === "ar" ? "AR → EN" : "EN → AR"}
                  </span>
                </button>

                {user ? (
                  <>
                    <MobileNavItem
                      to="/settings"
                      label={lang === "ar" ? "الإعدادات" : "Settings"}
                      icon={SettingsIcon}
                      testid="mobile-menu-settings"
                    />
                    <SheetClose asChild>
                      <button
                        onClick={logout}
                        data-testid="mobile-menu-logout"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
                      >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{t.logout}</span>
                      </button>
                    </SheetClose>
                  </>
                ) : (
                  // Auth buttons inside settings/drawer (also visible at top-right)
                  <div className="pt-2 space-y-2">
                    <SheetClose asChild>
                      <Link to="/login" data-testid="mobile-login-btn">
                        <Button
                          variant="outline"
                          className="w-full justify-center border-white/10 bg-white/5 hover:bg-white/10 text-white"
                        >
                          {t.login}
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/signup" data-testid="mobile-signup-btn">
                        <Button className="w-full justify-center bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold hover:brightness-110 shadow-[0_0_15px_rgba(255,184,0,0.4)]">
                          {lang === "ar" ? "ابدأ مجاناً" : "Sign up free"}
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

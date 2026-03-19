"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { useState, useEffect } from "react";

function NavIcon({ type, active }: { type: string; active: boolean }) {
  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={active ? 2.5 : 1.5}>
        <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
      </svg>
    );
  }
  if (type === "contact") {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={active ? 2.5 : 1.5}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={active ? 2.5 : 1.5}>
      <path d="M12 2a5 5 0 015 5v1a5 5 0 01-10 0V7a5 5 0 015-5zM20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { displayName, avatarUrl } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const deviceId = localStorage.getItem("musu_device_id");
    if (deviceId) {
      fetch(`/api/credits?deviceId=${deviceId}`).then((r) => r.json()).then((d) => setBalance(d.balance));
    }
  }, []);

  return (
    <aside className="hidden md:flex flex-col items-end w-[275px] pr-3 pt-8 sticky top-0 h-screen">
      <nav className="flex flex-col w-full max-w-[230px] gap-0.5 mt-4">
        <Link href="/"
          className={`flex items-center gap-4 px-3 py-2.5 rounded-full hover:bg-[var(--hover-bg)] transition-colors`}>
          <NavIcon type="home" active={pathname === "/"} />
          <span className={`text-[15px] ${pathname === "/" ? "font-bold" : ""}`}>
            {t("nav.workspace")}
          </span>
        </Link>

        <Link href="/settings"
          className={`flex items-center gap-4 px-3 py-2.5 rounded-full hover:bg-[var(--hover-bg)] transition-colors`}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={pathname === "/settings" ? 2.5 : 1.5}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className={`text-[15px] ${pathname === "/settings" ? "font-bold" : ""}`}>
            {t("nav.profile")}
          </span>
        </Link>

      </nav>

      <div className="mt-auto" />

      {/* Language selector */}
      <div className="w-full max-w-[230px] mb-2">
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
        >
          {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Bottom links - small */}
      <div className="flex gap-3 px-3 mb-2 w-full max-w-[230px]">
        <Link href="/billing" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          {t("nav.billing")}
        </Link>
        <Link href="/contact" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          {t("nav.contact")}
        </Link>
      </div>

      {/* Profile → Settings */}
      <Link href="/settings" className="mb-3 flex items-center gap-3 p-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors w-full max-w-[230px]">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
            {displayName?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{displayName || "User"}</div>
          <div className="text-xs text-[var(--muted)]">{t("settings.title")}</div>
        </div>
      </Link>
    </aside>
  );
}

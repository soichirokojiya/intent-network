"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
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
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={pathname === "/settings" && !pathname.startsWith("/settings/account") ? 2.5 : 1.5}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className={`text-[15px] ${pathname === "/settings" && !pathname.startsWith("/settings/account") ? "font-bold" : ""}`}>
            {t("nav.profile")}
          </span>
        </Link>

        <Link href="/integrations"
          className={`flex items-center gap-4 px-3 py-2.5 rounded-full hover:bg-[var(--hover-bg)] transition-colors`}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={pathname === "/integrations" ? 2.5 : 1.5}>
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <span className={`text-[15px] ${pathname === "/integrations" ? "font-bold" : ""}`}>
            {t("nav.integrations")}
          </span>
        </Link>

        <Link href="/settings/account"
          className={`flex items-center gap-4 px-3 py-2.5 rounded-full hover:bg-[var(--hover-bg)] transition-colors`}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={pathname.startsWith("/settings/account") ? 2.5 : 1.5}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span className="text-[15px]">
            {t("nav.settings")}
          </span>
        </Link>

      </nav>

      <div className="mt-auto" />

      {/* Bottom links - small */}
      <div className="flex gap-3 px-3 mb-2 w-full max-w-[230px]">
        <Link href="/billing" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          {t("nav.billing")}
        </Link>
        <Link href="/contact" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          {t("nav.contact")}
        </Link>
        <Link href="/help" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          ヘルプ
        </Link>
      </div>

      {/* Profile card removed */}
    </aside>
  );
}

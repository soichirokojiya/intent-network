"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "ホーム", icon: "home" },
    { href: "/settings", label: "プロフィール", icon: "profile" },
    { href: "/billing", label: "料金", icon: "billing" },
    { href: "/integrations", label: "連携", icon: "integrations" },
    { href: "/settings/account", label: "設定", icon: "settings" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--card-border)] z-50 backdrop-blur-md bg-opacity-80">
      <div className="flex">
        {items.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : item.href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center py-2 gap-0.5"
            >
              <div className={`${isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                {item.icon === "home" ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5}>
                    <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
                  </svg>
                ) : item.icon === "todo" ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5}>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                ) : item.icon === "profile" ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5}>
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ) : item.icon === "integrations" ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5}>
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                ) : item.icon === "billing" ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v12M9 8.5h4.5a2.5 2.5 0 010 5H9h5a2.5 2.5 0 010 5H9" />
                  </svg>
                ) : item.icon === "settings" ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5}>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M12 12h.01M8 12h.01M16 12h.01" />
                  </svg>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? "text-[var(--accent)] font-bold" : "text-[var(--muted)]"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

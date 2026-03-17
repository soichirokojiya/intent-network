"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIntents, MOOD_EMOJI } from "@/context/IntentContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import { LogoMark } from "./Logo";

function getNavItems(t: (key: string) => string) {
  return [
    { href: "/", icon: "home", label: t("nav.home") },
    { href: "/agent", icon: "agent", label: t("nav.myAgents") },
  ];
}

function NavIcon({ type, active }: { type: string; active: boolean }) {
  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--foreground)" strokeWidth={active ? 2.5 : 1.5}>
        <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--foreground)" strokeWidth={active ? 2.5 : 1.5}>
      <path d="M12 2a5 5 0 015 5v1a5 5 0 01-10 0V7a5 5 0 015-5zM20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { myAgents, activeAgent, myAgentConfig, myAgentStats } = useIntents();
  const { user, signOut } = useAuth();
  const { locale, setLocale, t } = useLocale();

  return (
    <aside className="hidden md:flex flex-col items-end w-[275px] pr-3 pt-3 sticky top-0 h-screen">
      <Link href="/" className="p-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors mb-1">
        <LogoMark size={30} />
      </Link>

      <nav className="flex flex-col w-full max-w-[230px] gap-0.5">
        {getNavItems(t).map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors group">
              <NavIcon type={item.icon} active={isActive} />
              <span className={`text-xl ${isActive ? "font-bold" : ""}`}>
                {item.label}
                {item.icon === "agent" && myAgentConfig.isConfigured && (
                  <span className="ml-1 text-sm">{MOOD_EMOJI[myAgentStats.mood]}</span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <Link href="/"
        className="mt-4 w-full max-w-[230px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-base py-3 rounded-full text-center transition-colors">
        {t("nav.send")}
      </Link>

      {/* Agent mini status */}
      {myAgents.length > 0 && (
        <Link href="/agent"
          className="mt-4 w-full max-w-[230px] bg-[var(--search-bg)] rounded-2xl p-3 hover:bg-[var(--hover-bg)] transition-colors">
          <div className="flex items-center gap-1 mb-2">
            {myAgents.slice(0, 3).map((a) => (
              <div key={a.id} className="relative">
                <AgentAvatarDisplay avatar={a.config.avatar} size={24} />
                <span className="absolute -top-1 -right-1 text-[8px]">{MOOD_EMOJI[a.stats.mood]}</span>
              </div>
            ))}
            <span className="text-[12px] text-[var(--muted)] ml-1">{myAgents.length}</span>
          </div>
          {/* Mood shown by emoji only */}
        </Link>
      )}

      {/* Language selector */}
      <div className="mt-4 w-full max-w-[230px]">
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

      {/* Profile */}
      <button onClick={signOut} className="mt-auto mb-3 flex items-center gap-3 p-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors cursor-pointer w-full max-w-[230px] text-left">
        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{user?.email?.split("@")[0] || "User"}</div>
          <div className="text-xs text-[var(--muted)]">Sign out</div>
        </div>
      </button>
    </aside>
  );
}

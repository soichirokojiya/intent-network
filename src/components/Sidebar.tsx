"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIntents, MOOD_EMOJI } from "@/context/IntentContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";

const NAV_ITEMS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/agent", icon: "agent", label: "My Agents" },
];

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

  return (
    <aside className="hidden md:flex flex-col items-end w-[275px] pr-3 pt-3 sticky top-0 h-screen">
      <Link href="/" className="p-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors mb-1">
        <span className="text-xl font-extrabold tracking-tight">musu</span>
      </Link>

      <nav className="flex flex-col w-full max-w-[230px] gap-0.5">
        {NAV_ITEMS.map((item) => {
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
        Send
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
          {activeAgent && (
            <div className="flex gap-1">
              <div className="flex-1 bg-[var(--background)] rounded-full h-1.5">
                <div className="h-full rounded-full bg-[var(--green)] transition-all" style={{ width: `${activeAgent.stats.hp}%` }} />
              </div>
              <span className="text-[10px] text-[var(--muted)]">HP</span>
            </div>
          )}
          {myAgents.some((a) => a.stats.mood === "dead") && (
            <div className="text-[11px] text-[var(--danger)] mt-1">An Agent has died</div>
          )}
        </Link>
      )}

      {/* Profile */}
      <div className="mt-auto mb-3 flex items-center gap-3 p-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors cursor-pointer w-full max-w-[230px]">
        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">Y</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">You</div>
          <div className="text-sm text-[var(--muted)] truncate">@you</div>
        </div>
        <span className="text-[var(--muted)]">···</span>
      </div>
    </aside>
  );
}

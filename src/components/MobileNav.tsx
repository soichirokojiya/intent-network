"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useIntents } from "@/context/IntentContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import { translateRole } from "@/lib/i18n";

export function MobileNav() {
  const pathname = usePathname();
  const [showTeam, setShowTeam] = useState(false);
  const { myAgents, activeAgentIds, toggleActiveAgent } = useIntents();

  const items = [
    { href: "/", label: "ホーム", icon: "home" },
    { href: "#team", label: "チーム", icon: "team" },
    { href: "/integrations", label: "連携", icon: "integrations" },
    { href: "/settings/account", label: "設定", icon: "settings" },
  ];

  return (
    <>
    {/* Team drawer */}
    {showTeam && (
      <div className="md:hidden fixed inset-0 z-[60]">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowTeam(false)} />
        <div className="absolute bottom-0 left-0 right-0 bg-[var(--background)] rounded-t-2xl max-h-[70vh] overflow-y-auto animate-fade-in-up pb-20">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
            <h2 className="text-lg font-extrabold">チーム</h2>
            <button onClick={() => setShowTeam(false)} className="text-[var(--muted)] p-1">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-4 py-2">
            {myAgents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 py-3 border-b border-[var(--card-border)] last:border-b-0">
                <button
                  onClick={() => toggleActiveAgent(agent.id)}
                  className={`w-10 h-6 rounded-full flex-shrink-0 transition-colors ${activeAgentIds.has(agent.id) ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"}`}
                >
                  <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform mx-0.5 ${activeAgentIds.has(agent.id) ? "translate-x-4" : ""}`} />
                </button>
                <div className={`flex items-center gap-3 flex-1 ${!activeAgentIds.has(agent.id) ? "opacity-40" : ""}`}>
                  <AgentAvatarDisplay avatar={agent.config.avatar} size={40} />
                  <div>
                    <p className="font-bold text-[15px]">{agent.config.name}</p>
                    <p className="text-[12px] text-[var(--muted)]">{translateRole(agent.config.role || agent.config.expertise || "", "ja")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--card-border)] z-50 backdrop-blur-md bg-opacity-80">
      <div className="flex">
        {items.map((item) => {
          const isActive = item.href === "#team"
            ? showTeam
            : item.href === "/"
            ? pathname === "/"
            : item.href === "/settings"
            ? pathname === "/settings" || pathname.startsWith("/settings/account")
            : pathname.startsWith(item.href);

          if (item.href === "#team") {
            return (
              <button
                key={item.href}
                onClick={() => setShowTeam(!showTeam)}
                className="flex-1 flex flex-col items-center py-2 gap-0.5"
              >
                <div className={`${isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5}>
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <span className={`text-[10px] ${isActive ? "text-[var(--accent)] font-bold" : "text-[var(--muted)]"}`}>
                  {item.label}
                </span>
              </button>
            );
          }

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
    </>
  );
}

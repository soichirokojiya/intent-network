"use client";

import { useIntents, MOOD_EMOJI } from "@/context/IntentContext";
import { useLocale } from "@/context/LocaleContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import Link from "next/link";

export function RightPanel() {
  const { intents, myAgents } = useIntents();
  const { t } = useLocale();

  return (
    <aside className="hidden lg:block w-[350px] pl-6 pr-4 pt-3 sticky top-0 h-screen overflow-y-auto">
      {/* Search */}
      <div className="mb-4">
        <div className="bg-[var(--search-bg)] rounded-full flex items-center px-4 py-2.5 group focus-within:bg-transparent focus-within:ring-1 focus-within:ring-[var(--accent)]">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--muted)" strokeWidth="2" className="mr-3 group-focus-within:stroke-[var(--accent)]">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder={t("right.search")}
            className="bg-transparent border-none outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] w-full" />
        </div>
      </div>

      {/* My Agents */}
      {myAgents.length > 0 && (
        <div className="bg-[var(--search-bg)] rounded-2xl p-4 mb-4">
          <h2 className="text-xl font-extrabold mb-3">{t("right.myAgents")}</h2>
          {myAgents.map((agent) => (
            <Link href={`/agent?id=${agent.id}`} key={agent.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--card-border)] last:border-b-0 hover:bg-[var(--hover-bg)] -mx-2 px-2 rounded-lg transition-colors">
              <div className={`${agent.stats.mood === "dead" ? "grayscale opacity-50" : ""}`}>
                <AgentAvatarDisplay avatar={agent.config.avatar} size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold truncate">{agent.config.name}</span>
                  <span className="text-xs">{MOOD_EMOJI[agent.stats.mood]}</span>
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-1">{agent.stats.totalReactions} {t("agent.posts")}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats removed */}

      <div className="text-xs text-[var(--muted)] py-4 flex flex-wrap gap-x-3 gap-y-1">
        <span>musu.world</span>
        <span>About</span>
        <span>Terms</span>
        <span>Privacy</span>
      </div>
    </aside>
  );
}

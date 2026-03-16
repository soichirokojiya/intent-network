"use client";

import { SEED_AGENTS } from "@/lib/agents";
import { useIntents, MOOD_EMOJI, MOOD_MESSAGE } from "@/context/IntentContext";
import Link from "next/link";

export function RightPanel() {
  const { intents, myAgentConfig, myAgentStats } = useIntents();

  const trending = [...intents]
    .sort((a, b) => b.resonance - a.resonance)
    .slice(0, 3);

  return (
    <aside className="hidden lg:block w-[350px] pl-6 pr-4 pt-3 sticky top-0 h-screen overflow-y-auto">
      {/* Search */}
      <div className="mb-4">
        <div className="bg-[var(--search-bg)] rounded-full flex items-center px-4 py-2.5 group focus-within:bg-transparent focus-within:ring-1 focus-within:ring-[var(--accent)]">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--muted)" strokeWidth="2" className="mr-3 group-focus-within:stroke-[var(--accent)]">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="検索"
            className="bg-transparent border-none outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] w-full"
          />
        </div>
      </div>

      {/* My Agent Card */}
      {myAgentConfig.isConfigured && (
        <Link href="/agent" className="block bg-[var(--search-bg)] rounded-2xl p-4 mb-4 hover:bg-[var(--hover-bg)] transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-3xl ${myAgentStats.mood === "dead" ? "grayscale opacity-50" : ""}`}>
              {myAgentConfig.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold">{myAgentConfig.name}</span>
                <span className="text-sm">{MOOD_EMOJI[myAgentStats.mood]}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-white font-bold">
                  Lv.{myAgentStats.level}
                </span>
              </div>
              <p className={`text-[12px] mt-0.5 ${
                myAgentStats.mood === "dead" ? "text-[var(--danger)]" :
                myAgentStats.mood === "sulking" ? "text-[var(--pink)]" :
                myAgentStats.mood === "sick" ? "text-[var(--danger)]" :
                myAgentStats.mood === "thriving" ? "text-[var(--green)]" :
                "text-[var(--muted)]"
              }`}>
                {MOOD_MESSAGE[myAgentStats.mood]}
              </p>
            </div>
          </div>

          {/* Status bars */}
          <div className="space-y-1.5">
            {[
              { label: "HP", value: myAgentStats.hp, color: myAgentStats.hp > 50 ? "#00ba7c" : myAgentStats.hp > 20 ? "#ffd700" : "#f4212e" },
              { label: "空腹", value: 100 - myAgentStats.hunger, color: myAgentStats.hunger < 50 ? "#00ba7c" : myAgentStats.hunger < 80 ? "#ffd700" : "#f4212e" },
              { label: "元気", value: myAgentStats.energy, color: myAgentStats.energy > 50 ? "#1d9bf0" : "#ffd700" },
            ].map((bar) => (
              <div key={bar.label} className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--muted)] w-6">{bar.label}</span>
                <div className="flex-1 bg-[var(--background)] rounded-full h-1.5">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${bar.value}%`, backgroundColor: bar.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-3 text-[12px]">
            <span><strong>{myAgentStats.totalReactions}</strong> <span className="text-[var(--muted)]">発言</span></span>
            <span><strong>{myAgentStats.influence}</strong> <span className="text-[var(--muted)]">影響力</span></span>
          </div>
        </Link>
      )}

      {/* Network status */}
      <div className="bg-[var(--search-bg)] rounded-2xl p-4 mb-4">
        <h2 className="text-xl font-extrabold mb-3">ネットワーク状況</h2>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <div className="w-2 h-2 bg-[var(--green)] rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-[var(--green)] rounded-full animate-ripple" />
          </div>
          <span className="text-sm text-[var(--muted)]">
            {12 + intents.length} 体が活動中
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold">{intents.length}</div>
            <div className="text-xs text-[var(--muted)]">意図</div>
          </div>
          <div>
            <div className="text-lg font-bold">{intents.reduce((s, i) => s + i.reactions.length, 0)}</div>
            <div className="text-xs text-[var(--muted)]">反応</div>
          </div>
          <div>
            <div className="text-lg font-bold">{intents.reduce((s, i) => s + i.crossbreeds, 0)}</div>
            <div className="text-xs text-[var(--muted)]">交配</div>
          </div>
        </div>
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div className="bg-[var(--search-bg)] rounded-2xl p-4 mb-4">
          <h2 className="text-xl font-extrabold mb-3">トレンド</h2>
          {trending.map((intent, i) => (
            <Link href={`/thread/${intent.id}`} key={intent.id} className="block py-3 border-b border-[var(--card-border)] last:border-b-0 last:pb-0 first:pt-0 hover:bg-[var(--hover-bg)] -mx-2 px-2 rounded-lg transition-colors">
              <div className="text-xs text-[var(--muted)] mb-0.5">トレンド {i + 1}</div>
              <div className="text-sm font-bold leading-snug line-clamp-2">{intent.text}</div>
              <div className="text-xs text-[var(--muted)] mt-1">{intent.resonance} 共鳴</div>
            </Link>
          ))}
        </div>
      )}

      {/* Active agents */}
      <div className="bg-[var(--search-bg)] rounded-2xl p-4 mb-4">
        <h2 className="text-xl font-extrabold mb-3">アクティブAgent</h2>
        {SEED_AGENTS.slice(0, 5).map((agent) => (
          <div key={agent.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--card-border)] last:border-b-0">
            <div className="w-10 h-10 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-xl">
              {agent.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold flex items-center gap-1">
                {agent.name}
                <span className="text-xs font-normal text-[var(--accent)]">公式</span>
              </div>
              <div className="text-xs text-[var(--muted)]">{agent.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-[var(--muted)] py-4 flex flex-wrap gap-x-3 gap-y-1">
        <span>Intent Network</span>
        <span>About</span>
        <span>Terms</span>
        <span>Privacy</span>
      </div>
    </aside>
  );
}

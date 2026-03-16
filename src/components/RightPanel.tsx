"use client";

import { SEED_AGENTS } from "@/lib/agents";
import { useIntents } from "@/context/IntentContext";

export function RightPanel() {
  const { intents } = useIntents();

  // Trending intents (top by resonance)
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
            <div key={intent.id} className="py-3 border-b border-[var(--card-border)] last:border-b-0 last:pb-0 first:pt-0">
              <div className="text-xs text-[var(--muted)] mb-0.5">トレンド {i + 1}</div>
              <div className="text-sm font-bold leading-snug line-clamp-2">{intent.text}</div>
              <div className="text-xs text-[var(--muted)] mt-1">{intent.resonance} 共鳴</div>
            </div>
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
        <button className="text-sm text-[var(--accent)] hover:underline mt-3">
          もっと見る
        </button>
      </div>

      {/* Footer */}
      <div className="text-xs text-[var(--muted)] py-4 flex flex-wrap gap-x-3 gap-y-1">
        <span>Intent Network</span>
        <span>About</span>
        <span>Terms</span>
        <span>Privacy</span>
      </div>
    </aside>
  );
}

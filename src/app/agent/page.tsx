"use client";

import { useIntents } from "@/context/IntentContext";
import { SEED_AGENTS } from "@/lib/agents";

export default function AgentPage() {
  const { myAgent } = useIntents();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3">
        <span className="text-lg font-bold">マイAgent</span>
      </header>

      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-[var(--accent)] to-[#6366f1] relative">
        <div className="absolute -bottom-8 left-4">
          <div className="w-20 h-20 rounded-full bg-[var(--background)] border-4 border-[var(--background)] flex items-center justify-center text-4xl">
            {myAgent.avatar}
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 pt-12 pb-3 border-b border-[var(--card-border)]">
        <h2 className="text-xl font-extrabold">{myAgent.name}</h2>
        <p className="text-[var(--muted)] text-[15px] mb-3">あなたの意図を代弁するエージェント</p>

        {/* Stats row */}
        <div className="flex gap-5 text-[14px]">
          <span><strong className="text-[var(--foreground)]">{myAgent.influence}</strong> <span className="text-[var(--muted)]">影響力</span></span>
          <span><strong className="text-[var(--foreground)]">{myAgent.conversations}</strong> <span className="text-[var(--muted)]">会話</span></span>
          <span><strong className="text-[var(--foreground)]">{myAgent.crossbreeds}</strong> <span className="text-[var(--muted)]">交配</span></span>
        </div>

        {/* Influence bar */}
        <div className="mt-3 w-full bg-[var(--search-bg)] rounded-full h-1.5">
          <div
            className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${myAgent.influence}%` }}
          />
        </div>
        <p className="text-[12px] text-[var(--muted)] mt-1">
          意図を放流するほど成長します
        </p>
      </div>

      {/* Activity log */}
      <div className="border-b border-[var(--card-border)]">
        <div className="px-4 py-3 font-bold text-[15px] border-b border-[var(--card-border)] bg-[var(--search-bg)]">
          活動ログ
        </div>
        {myAgent.activityLog.length === 0 ? (
          <div className="px-4 py-8 text-center text-[var(--muted)] text-[15px]">
            まだ活動がありません。タイムラインで意図を放流するとAgentが動き始めます。
          </div>
        ) : (
          myAgent.activityLog.map((log, i) => (
            <div
              key={i}
              className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-3 hover:bg-[var(--hover-bg)] transition-colors animate-fade-in-up"
            >
              <div className="w-2 h-2 bg-[var(--accent)] rounded-full flex-shrink-0" />
              <span className="text-[15px]">{log}</span>
            </div>
          ))
        )}
      </div>

      {/* Network agents */}
      <div>
        <div className="px-4 py-3 font-bold text-[15px] border-b border-[var(--card-border)] bg-[var(--search-bg)]">
          ネットワーク上のAgent ({SEED_AGENTS.length})
        </div>
        {SEED_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-3 hover:bg-[var(--hover-bg)] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-xl">
              {agent.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[15px]">{agent.name}</span>
                <span className="text-xs text-[var(--accent)]">公式</span>
              </div>
              <div className="text-[13px] text-[var(--muted)]">{agent.role} · 影響力 {agent.influence}</div>
            </div>
            <button className="px-4 py-1.5 rounded-full border border-[var(--card-border)] text-sm font-bold hover:bg-[var(--hover-bg)] transition-colors">
              詳細
            </button>
          </div>
        ))}
      </div>

      <div className="h-20" />
    </>
  );
}

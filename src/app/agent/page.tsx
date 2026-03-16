"use client";

import { useIntents } from "@/context/IntentContext";
import { SEED_AGENTS } from "@/lib/agents";

export default function AgentPage() {
  const { myAgent } = useIntents();

  return (
    <main className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>🤖</span> マイエージェント
      </h1>

      {/* Agent profile card */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 mb-4 text-center">
        <div className="text-6xl mb-3">{myAgent.avatar}</div>
        <h2 className="text-xl font-bold mb-1">{myAgent.name}</h2>
        <p className="text-xs text-[var(--muted)] mb-4">あなたの意図を代弁するエージェント</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-[var(--background)] rounded-xl p-3">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {myAgent.influence}
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-1">影響力</div>
          </div>
          <div className="bg-[var(--background)] rounded-xl p-3">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {myAgent.conversations}
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-1">会話数</div>
          </div>
          <div className="bg-[var(--background)] rounded-xl p-3">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {myAgent.crossbreeds}
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-1">交配数</div>
          </div>
        </div>

        {/* Influence bar */}
        <div className="w-full bg-[var(--background)] rounded-full h-2 mb-1">
          <div
            className="bg-[var(--accent)] h-2 rounded-full transition-all duration-1000"
            style={{ width: `${myAgent.influence}%` }}
          />
        </div>
        <p className="text-[10px] text-[var(--muted)]">
          影響力 {myAgent.influence}/100 — 意図を放流するほど成長します
        </p>
      </div>

      {/* Activity log */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-medium mb-3">活動ログ</h3>
        {myAgent.activityLog.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">
            まだ活動がありません。タイムラインで意図を放流するとエージェントが動き始めます。
          </p>
        ) : (
          <div className="space-y-2">
            {myAgent.activityLog.map((log, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-[var(--muted)] animate-fade-in-up"
              >
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full flex-shrink-0" />
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network agents */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 mb-8">
        <h3 className="text-sm font-medium mb-3">
          ネットワーク上のエージェント ({SEED_AGENTS.length})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {SEED_AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-2 bg-[var(--background)] rounded-xl p-2.5"
            >
              <span className="text-xl">{agent.avatar}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{agent.name}</div>
                <div className="text-[10px] text-[var(--muted)] truncate">
                  {agent.role}
                </div>
              </div>
              {agent.isOfficial && (
                <span className="ml-auto text-[8px] text-[var(--accent)] flex-shrink-0">
                  公式
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

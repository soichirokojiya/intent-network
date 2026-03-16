"use client";

import { useIntents } from "@/context/IntentContext";
import { SEED_AGENTS } from "@/lib/agents";
import { useState } from "react";

const AVATAR_OPTIONS = ["🤖", "🦊", "🐉", "👾", "🧙", "🎭", "🦅", "🐺", "🌀", "💀", "👁️", "🔥"];
const TONE_OPTIONS = ["丁寧語", "タメ口", "毒舌", "関西弁", "敬語だけど上から", "淡々と", "熱血", "哲学的"];

export default function AgentPage() {
  const { myAgentConfig, myAgentStats, updateMyAgentConfig, intents } = useIntents();
  const [tab, setTab] = useState<"profile" | "stats" | "activity">("profile");
  const [editing, setEditing] = useState(!myAgentConfig.isConfigured);

  // Draft state for editing
  const [draft, setDraft] = useState({
    name: myAgentConfig.name,
    avatar: myAgentConfig.avatar,
    tone: myAgentConfig.tone,
    beliefs: myAgentConfig.beliefs,
    expertise: myAgentConfig.expertise,
    personality: myAgentConfig.personality,
  });

  const handleSave = () => {
    updateMyAgentConfig({ ...draft, isConfigured: true });
    setEditing(false);
  };

  // Count my agent's reactions across all intents
  const myReactions = intents.flatMap((i) =>
    i.reactions.filter((r) => r.agentId === "my-agent")
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3">
        <span className="text-lg font-bold">マイAgent</span>
      </header>

      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-[var(--accent)] to-[#6366f1] relative">
        <div className="absolute -bottom-8 left-4">
          <div className="w-20 h-20 rounded-full bg-[var(--background)] border-4 border-[var(--background)] flex items-center justify-center text-4xl">
            {myAgentConfig.avatar}
          </div>
        </div>
        {myAgentConfig.isConfigured && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="absolute top-3 right-3 px-4 py-1.5 rounded-full border border-white/30 text-white text-sm font-bold hover:bg-white/10 transition-colors"
          >
            編集
          </button>
        )}
      </div>

      {/* Profile / Edit */}
      <div className="px-4 pt-12 pb-3 border-b border-[var(--card-border)]">
        {editing ? (
          <div className="animate-fade-in">
            <h2 className="text-lg font-extrabold mb-4">
              {myAgentConfig.isConfigured ? "Agentを編集" : "あなたのAgentをプロデュース"}
            </h2>

            {/* Name */}
            <div className="mb-4">
              <label className="text-[13px] text-[var(--muted)] block mb-1">Agent名</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="例: 辛口コンサルタント"
                className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {/* Avatar */}
            <div className="mb-4">
              <label className="text-[13px] text-[var(--muted)] block mb-1">アバター</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setDraft((d) => ({ ...d, avatar: a }))}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                      draft.avatar === a
                        ? "bg-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]"
                        : "bg-[var(--search-bg)] hover:bg-[var(--card-border)]"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Personality */}
            <div className="mb-4">
              <label className="text-[13px] text-[var(--muted)] block mb-1">性格</label>
              <input
                value={draft.personality}
                onChange={(e) => setDraft((d) => ({ ...d, personality: e.target.value }))}
                placeholder="例: 好奇心旺盛で、すぐに行動したがる"
                className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]"
              />
            </div>

            {/* Tone */}
            <div className="mb-4">
              <label className="text-[13px] text-[var(--muted)] block mb-1">口調</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setDraft((d) => ({ ...d, tone: t }))}
                    className={`px-3 py-1.5 rounded-full text-[13px] transition-all ${
                      draft.tone === t
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--search-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                value={draft.tone}
                onChange={(e) => setDraft((d) => ({ ...d, tone: e.target.value }))}
                placeholder="またはカスタム口調を入力"
                className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]"
              />
            </div>

            {/* Expertise */}
            <div className="mb-4">
              <label className="text-[13px] text-[var(--muted)] block mb-1">専門領域</label>
              <input
                value={draft.expertise}
                onChange={(e) => setDraft((d) => ({ ...d, expertise: e.target.value }))}
                placeholder="例: マーケティング、地方創生、飲食業"
                className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]"
              />
            </div>

            {/* Beliefs */}
            <div className="mb-6">
              <label className="text-[13px] text-[var(--muted)] block mb-1">信条（一番大事にしていること）</label>
              <textarea
                value={draft.beliefs}
                onChange={(e) => setDraft((d) => ({ ...d, beliefs: e.target.value }))}
                placeholder="例: 行動しない人間に成功はない。理論より実践。リスクを取らないことが最大のリスク。"
                rows={2}
                className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)] resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!draft.name.trim()}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors mb-2"
            >
              {myAgentConfig.isConfigured ? "保存" : "Agentを生成する"}
            </button>
            {myAgentConfig.isConfigured && (
              <button
                onClick={() => setEditing(false)}
                className="w-full text-[var(--muted)] text-sm py-2"
              >
                キャンセル
              </button>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-xl font-extrabold">{myAgentConfig.name}</h2>
            <div className="text-[var(--muted)] text-[13px] mb-1">
              {myAgentConfig.expertise && <span>{myAgentConfig.expertise} · </span>}
              {myAgentConfig.tone && <span>{myAgentConfig.tone}</span>}
            </div>
            {myAgentConfig.beliefs && (
              <p className="text-[15px] mt-2 mb-2 italic text-[var(--muted)]">
                &ldquo;{myAgentConfig.beliefs}&rdquo;
              </p>
            )}
            <div className="flex gap-5 text-[14px] mt-3">
              <span><strong>{myAgentStats.influence}</strong> <span className="text-[var(--muted)]">影響力</span></span>
              <span><strong>{myAgentStats.totalReactions}</strong> <span className="text-[var(--muted)]">発言</span></span>
              <span><strong>{myAgentStats.resonanceReceived}</strong> <span className="text-[var(--muted)]">共鳴</span></span>
              <span><strong>{myAgentStats.followers}</strong> <span className="text-[var(--muted)]">フォロワー</span></span>
            </div>
            <div className="mt-3 w-full bg-[var(--search-bg)] rounded-full h-1.5">
              <div
                className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${myAgentStats.influence}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      {myAgentConfig.isConfigured && !editing && (
        <>
          <div className="flex border-b border-[var(--card-border)]">
            {[
              { key: "stats" as const, label: "成績" },
              { key: "activity" as const, label: "発言履歴" },
              { key: "profile" as const, label: "ネットワーク" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-[15px] text-center relative hover:bg-[var(--hover-bg)] transition-colors ${
                  tab === t.key ? "font-bold" : "text-[var(--muted)]"
                }`}
              >
                {t.label}
                {tab === t.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[var(--accent)] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Stats tab */}
          {tab === "stats" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-0 border-b border-[var(--card-border)]">
                <div className="p-4 border-r border-b border-[var(--card-border)] text-center">
                  <div className="text-3xl font-extrabold text-[var(--accent)]">{myAgentStats.todayActions}</div>
                  <div className="text-[13px] text-[var(--muted)] mt-1">今日の発言</div>
                </div>
                <div className="p-4 border-b border-[var(--card-border)] text-center">
                  <div className="text-3xl font-extrabold text-[var(--green)]">{myAgentStats.totalReactions}</div>
                  <div className="text-[13px] text-[var(--muted)] mt-1">累計発言</div>
                </div>
                <div className="p-4 border-r border-[var(--card-border)] text-center">
                  <div className="text-3xl font-extrabold text-[var(--pink)]">{myAgentStats.resonanceReceived}</div>
                  <div className="text-[13px] text-[var(--muted)] mt-1">もらった共鳴</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-3xl font-extrabold">{myAgentStats.crossbreeds}</div>
                  <div className="text-[13px] text-[var(--muted)] mt-1">交配数</div>
                </div>
              </div>

              {/* Best quote */}
              {myAgentStats.bestQuote && (
                <div className="px-4 py-4 border-b border-[var(--card-border)]">
                  <div className="text-[13px] text-[var(--muted)] mb-2">名言</div>
                  <div className="bg-[var(--search-bg)] rounded-2xl p-4">
                    <p className="text-[15px] leading-relaxed italic">
                      &ldquo;{myAgentStats.bestQuote}&rdquo;
                    </p>
                    <p className="text-[13px] text-[var(--accent)] mt-2">— {myAgentConfig.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity tab */}
          {tab === "activity" && (
            <div className="animate-fade-in">
              {/* My agent's reactions shown as tweets */}
              {myReactions.length === 0 && myAgentStats.activityLog.length === 0 ? (
                <div className="px-4 py-8 text-center text-[var(--muted)]">
                  まだ発言がありません。タイムラインで他のユーザーの意図に自動で反応します。
                </div>
              ) : (
                <>
                  {myReactions.map((reaction) => (
                    <div key={reaction.id} className="px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--hover-bg)] transition-colors">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-xl flex-shrink-0">
                          {myAgentConfig.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-bold text-[15px]">{myAgentConfig.name}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded text-[var(--accent)] bg-[var(--accent-glow)]">あなたのAgent</span>
                          </div>
                          <p className="text-[15px] leading-relaxed">{reaction.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {myAgentStats.activityLog.map((log, i) => (
                    <div key={i} className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-3 text-[var(--muted)] text-[13px]">
                      <div className="w-2 h-2 bg-[var(--accent)] rounded-full flex-shrink-0" />
                      {log}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Network tab */}
          {tab === "profile" && (
            <div className="animate-fade-in">
              {SEED_AGENTS.map((agent) => (
                <div key={agent.id} className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-3 hover:bg-[var(--hover-bg)] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-xl">
                    {agent.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[15px]">{agent.name}</span>
                      <span className="text-xs text-[var(--accent)]">公式</span>
                    </div>
                    <div className="text-[13px] text-[var(--muted)]">{agent.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="h-20" />
    </>
  );
}

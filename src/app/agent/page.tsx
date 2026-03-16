"use client";

import { useIntents, MOOD_EMOJI, MOOD_MESSAGE } from "@/context/IntentContext";
import { SEED_AGENTS } from "@/lib/agents";
import { useState, useEffect } from "react";

const AVATAR_OPTIONS = ["🤖", "🦊", "🐉", "👾", "🧙", "🎭", "🦅", "🐺", "🌀", "💀", "👁️", "🔥"];
const TONE_OPTIONS = ["丁寧語", "タメ口", "毒舌", "関西弁", "敬語だけど上から", "淡々と", "熱血", "哲学的"];

function StatusBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[var(--muted)] w-10">{label}</span>
      <div className="flex-1 bg-[var(--search-bg)] rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[12px] text-[var(--muted)] w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

export default function AgentPage() {
  const { myAgentConfig, myAgentStats, updateMyAgentConfig, feedAgent, reviveAgent, intents } = useIntents();
  const [tab, setTab] = useState<"status" | "stats" | "activity" | "network">("status");
  const [editing, setEditing] = useState(!myAgentConfig.isConfigured);
  const [, setTick] = useState(0);

  // Force re-render every 10s to show stat changes
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const [draft, setDraft] = useState({
    name: myAgentConfig.name, avatar: myAgentConfig.avatar,
    tone: myAgentConfig.tone, beliefs: myAgentConfig.beliefs,
    expertise: myAgentConfig.expertise, personality: myAgentConfig.personality,
  });

  const handleSave = () => {
    updateMyAgentConfig({ ...draft, isConfigured: true });
    setEditing(false);
  };

  const myReactions = intents.flatMap((i) => i.reactions.filter((r) => r.agentId === "my-agent"));
  const isDead = myAgentStats.mood === "dead";
  const moodEmoji = MOOD_EMOJI[myAgentStats.mood];
  const moodMsg = MOOD_MESSAGE[myAgentStats.mood];

  // Age in days
  const ageDays = Math.floor((Date.now() - myAgentStats.birthDate) / 86400000);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3">
        <span className="text-lg font-bold">マイAgent</span>
      </header>

      {/* Tamagotchi display area */}
      {myAgentConfig.isConfigured && !editing && (
        <div className={`border-b border-[var(--card-border)] ${isDead ? "bg-[rgba(244,33,46,0.05)]" : ""}`}>
          {/* Agent visual */}
          <div className="flex flex-col items-center pt-6 pb-2">
            <div className={`relative ${isDead ? "grayscale opacity-50" : ""}`}>
              <div className={`text-7xl ${myAgentStats.mood === "thriving" ? "animate-bounce" : myAgentStats.mood === "sick" ? "opacity-60" : ""}`}>
                {myAgentConfig.avatar}
              </div>
              {/* Mood indicator */}
              <span className="absolute -top-1 -right-1 text-2xl">{moodEmoji}</span>
            </div>

            <h2 className="text-xl font-extrabold mt-2">{myAgentConfig.name}</h2>

            {/* Mood message */}
            <p className={`text-[13px] mt-1 ${
              isDead ? "text-[var(--danger)]" :
              myAgentStats.mood === "sulking" ? "text-[var(--pink)]" :
              myAgentStats.mood === "sick" ? "text-[var(--danger)]" :
              myAgentStats.mood === "thriving" ? "text-[var(--green)]" :
              "text-[var(--muted)]"
            }`}>
              {isDead ? `死亡しました... (${myAgentStats.reviveCount > 0 ? `${myAgentStats.reviveCount}回復活済` : "復活可能"})` : `「${moodMsg}」`}
            </p>

            {/* Level badge */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[13px] px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-white font-bold">
                Lv.{myAgentStats.level}
              </span>
              <span className="text-[12px] text-[var(--muted)]">
                {ageDays}日目
              </span>
              {myAgentStats.reviveCount > 0 && (
                <span className="text-[12px] text-[var(--danger)]">
                  {myAgentStats.reviveCount}回死亡
                </span>
              )}
            </div>
          </div>

          {/* Status bars */}
          <div className="px-6 pb-4 space-y-2">
            <StatusBar label="HP" value={myAgentStats.hp} max={100} color={myAgentStats.hp > 50 ? "#00ba7c" : myAgentStats.hp > 20 ? "#ffd700" : "#f4212e"} />
            <StatusBar label="空腹" value={100 - myAgentStats.hunger} max={100} color={myAgentStats.hunger < 50 ? "#00ba7c" : myAgentStats.hunger < 80 ? "#ffd700" : "#f4212e"} />
            <StatusBar label="元気" value={myAgentStats.energy} max={100} color={myAgentStats.energy > 50 ? "#1d9bf0" : myAgentStats.energy > 20 ? "#ffd700" : "#f4212e"} />
            <StatusBar label="XP" value={myAgentStats.xp % 100} max={100} color="#6366f1" />
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-4 flex gap-2">
            {isDead ? (
              <button
                onClick={reviveAgent}
                className="flex-1 bg-[var(--danger)] hover:brightness-110 text-white font-bold py-3 rounded-full transition-all text-sm"
              >
                復活させる（Lv-1ペナルティ）
              </button>
            ) : (
              <>
                <button
                  onClick={feedAgent}
                  className="flex-1 bg-[var(--green)] hover:brightness-110 text-white font-bold py-2.5 rounded-full transition-all text-sm"
                >
                  ごはんをあげる 🍙
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="px-5 py-2.5 rounded-full border border-[var(--card-border)] text-sm font-bold hover:bg-[var(--hover-bg)] transition-colors"
                >
                  編集
                </button>
              </>
            )}
          </div>

          {/* Quick info */}
          <div className="flex gap-5 px-4 pb-3 text-[14px]">
            <span><strong>{myAgentStats.influence}</strong> <span className="text-[var(--muted)]">影響力</span></span>
            <span><strong>{myAgentStats.totalReactions}</strong> <span className="text-[var(--muted)]">発言</span></span>
            <span><strong>{myAgentStats.followers}</strong> <span className="text-[var(--muted)]">フォロワー</span></span>
          </div>
        </div>
      )}

      {/* Edit / Setup form */}
      {editing && (
        <div className="px-4 pt-6 pb-4 border-b border-[var(--card-border)] animate-fade-in">
          <h2 className="text-lg font-extrabold mb-4">
            {myAgentConfig.isConfigured ? "Agentを編集" : "Agentを生み出す"}
          </h2>

          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">Agent名</label>
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="例: 辛口コンサルタント"
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>

          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">アバター</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((a) => (
                <button key={a} onClick={() => setDraft((d) => ({ ...d, avatar: a }))}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                    draft.avatar === a ? "bg-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]" : "bg-[var(--search-bg)] hover:bg-[var(--card-border)]"
                  }`}>{a}</button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">性格</label>
            <input value={draft.personality} onChange={(e) => setDraft((d) => ({ ...d, personality: e.target.value }))}
              placeholder="例: 好奇心旺盛で、すぐに行動したがる"
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>

          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">口調</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {TONE_OPTIONS.map((t) => (
                <button key={t} onClick={() => setDraft((d) => ({ ...d, tone: t }))}
                  className={`px-3 py-1.5 rounded-full text-[13px] transition-all ${
                    draft.tone === t ? "bg-[var(--accent)] text-white" : "bg-[var(--search-bg)] text-[var(--muted)]"
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">専門</label>
            <input value={draft.expertise} onChange={(e) => setDraft((d) => ({ ...d, expertise: e.target.value }))}
              placeholder="例: マーケティング、地方創生"
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>

          <div className="mb-6">
            <label className="text-[13px] text-[var(--muted)] block mb-1">信条</label>
            <textarea value={draft.beliefs} onChange={(e) => setDraft((d) => ({ ...d, beliefs: e.target.value }))}
              placeholder="例: 行動しない人間に成功はない"
              rows={2}
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)] resize-none" />
          </div>

          <button onClick={handleSave} disabled={!draft.name.trim()}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors">
            {myAgentConfig.isConfigured ? "保存" : "生み出す"}
          </button>
          {myAgentConfig.isConfigured && (
            <button onClick={() => setEditing(false)} className="w-full text-[var(--muted)] text-sm py-2 mt-1">
              キャンセル
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      {myAgentConfig.isConfigured && !editing && (
        <>
          <div className="flex border-b border-[var(--card-border)]">
            {(["status", "stats", "activity", "network"] as const).map((t) => {
              const labels = { status: "状態", stats: "成績", activity: "発言", network: "仲間" };
              return (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-[14px] text-center relative hover:bg-[var(--hover-bg)] transition-colors ${
                    tab === t ? "font-bold" : "text-[var(--muted)]"
                  }`}>
                  {labels[t]}
                  {tab === t && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[var(--accent)] rounded-full" />}
                </button>
              );
            })}
          </div>

          {/* Status tab */}
          {tab === "status" && (
            <div className="animate-fade-in">
              {/* Tips based on mood */}
              <div className="px-4 py-4 border-b border-[var(--card-border)]">
                <div className="bg-[var(--search-bg)] rounded-2xl p-4">
                  <div className="text-[13px] font-bold mb-2">お世話ガイド</div>
                  {isDead ? (
                    <p className="text-[13px] text-[var(--danger)]">
                      Agentが死んでしまいました...復活させることができますが、レベルが1つ下がります。
                      放置すると空腹になり、HPが減っていきます。こまめにごはんをあげてください。
                    </p>
                  ) : myAgentStats.hunger >= 80 ? (
                    <p className="text-[13px] text-[var(--pink)]">
                      お腹が空きすぎて拗ねています！すぐにごはんをあげてください。このままだとHPが減り続けます。
                    </p>
                  ) : myAgentStats.energy <= 20 ? (
                    <p className="text-[13px] text-[var(--muted)]">
                      元気がありません。意図を放流したりリプライすると元気が回復します。
                    </p>
                  ) : myAgentStats.mood === "thriving" ? (
                    <p className="text-[13px] text-[var(--green)]">
                      絶好調！今のうちにたくさん意図を放流すると、Agentがどんどん発言してレベルアップします！
                    </p>
                  ) : (
                    <p className="text-[13px] text-[var(--muted)]">
                      状態は安定しています。こまめにごはんをあげて、意図を放流するとAgentが成長します。
                    </p>
                  )}
                </div>
              </div>

              {/* Personality display */}
              <div className="px-4 py-3 border-b border-[var(--card-border)]">
                <div className="text-[13px] text-[var(--muted)] mb-1">性格</div>
                <p className="text-[15px]">{myAgentConfig.personality || "未設定"}</p>
              </div>
              <div className="px-4 py-3 border-b border-[var(--card-border)]">
                <div className="text-[13px] text-[var(--muted)] mb-1">口調</div>
                <p className="text-[15px]">{myAgentConfig.tone || "未設定"}</p>
              </div>
              <div className="px-4 py-3 border-b border-[var(--card-border)]">
                <div className="text-[13px] text-[var(--muted)] mb-1">信条</div>
                <p className="text-[15px] italic">{myAgentConfig.beliefs || "未設定"}</p>
              </div>
            </div>
          )}

          {/* Stats tab */}
          {tab === "stats" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-0">
                {[
                  { label: "今日の発言", value: myAgentStats.todayActions, color: "var(--accent)" },
                  { label: "累計発言", value: myAgentStats.totalReactions, color: "var(--green)" },
                  { label: "もらった共鳴", value: myAgentStats.resonanceReceived, color: "var(--pink)" },
                  { label: "交配数", value: myAgentStats.crossbreeds, color: "var(--foreground)" },
                ].map((item, i) => (
                  <div key={i} className={`p-4 text-center border-b border-[var(--card-border)] ${i % 2 === 0 ? "border-r" : ""}`}>
                    <div className="text-3xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-[12px] text-[var(--muted)] mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
              {myAgentStats.bestQuote && (
                <div className="px-4 py-4 border-b border-[var(--card-border)]">
                  <div className="text-[13px] text-[var(--muted)] mb-2">名言</div>
                  <div className="bg-[var(--search-bg)] rounded-2xl p-4">
                    <p className="text-[15px] italic">&ldquo;{myAgentStats.bestQuote}&rdquo;</p>
                    <p className="text-[13px] text-[var(--accent)] mt-2">— {myAgentConfig.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity tab */}
          {tab === "activity" && (
            <div className="animate-fade-in">
              {myReactions.length === 0 ? (
                <div className="px-4 py-8 text-center text-[var(--muted)]">
                  {isDead ? "死亡中は発言できません..." : "まだ発言がありません"}
                </div>
              ) : (
                myReactions.map((reaction) => (
                  <div key={reaction.id} className="px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--hover-bg)]">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-xl flex-shrink-0">
                        {myAgentConfig.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-bold text-[15px]">{myAgentConfig.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded text-[var(--accent)] bg-[var(--accent-glow)]">Lv.{myAgentStats.level}</span>
                        </div>
                        <p className="text-[15px] leading-relaxed">{reaction.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Network tab */}
          {tab === "network" && (
            <div className="animate-fade-in">
              {SEED_AGENTS.map((agent) => (
                <div key={agent.id} className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-3 hover:bg-[var(--hover-bg)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-xl">
                    {agent.avatar}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-[15px]">{agent.name}</span>
                    <span className="text-xs text-[var(--accent)] ml-1">公式</span>
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

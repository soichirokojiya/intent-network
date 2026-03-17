"use client";

import { useIntents, MOOD_EMOJI, MOOD_MESSAGE, type MyAgent } from "@/context/IntentContext";
import { SEED_AGENTS } from "@/lib/agents";
import { AgentAvatarDisplay } from "@/components/AgentAvatarDisplay";
import { PixelAvatarGrid } from "@/components/PixelAvatar";
import { useState, useEffect } from "react";

const TONE_OPTIONS = ["Polite", "Casual", "Sarcastic", "Kansai dialect", "Deadpan", "Passionate", "Philosophical"];

function StatusBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[var(--muted)] w-10">{label}</span>
      <div className="flex-1 bg-[var(--search-bg)] rounded-full h-2.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] text-[var(--muted)] w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

export default function AgentPage() {
  const { myAgents, activeAgentId, setActiveAgentId, addAgent, removeAgent, updateAgentConfig, feedAgent, reviveAgent, revertDrift, internalChats, intents } = useIntents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 10000); return () => clearInterval(t); }, []);

  const [draft, setDraft] = useState({ name: "", avatar: "px-new-0", tone: "", beliefs: "", expertise: "", personality: "", twitterEnabled: false, twitterUsername: "" });

  const selectedAgent = myAgents.find((a) => a.id === selectedAgentId);

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    const id = addAgent(draft);
    setCreating(false);
    setSelectedAgentId(id);
    setDraft({ name: "", avatar: "px-new-0", tone: "", beliefs: "", expertise: "", personality: "", twitterEnabled: false, twitterUsername: "" });
  };

  // Agent list view
  if (!selectedAgent && !creating) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold">My Agents ({myAgents.length}/5)</span>
          {myAgents.length < 5 && (
            <button onClick={() => setCreating(true)}
              className="px-4 py-1.5 bg-[var(--accent)] text-white font-bold text-sm rounded-full hover:bg-[var(--accent-hover)] transition-colors">
              + New Agent
            </button>
          )}
        </header>

        {/* Reset button */}
        {myAgents.length > 0 && (
          <div className="px-4 py-2 border-b border-[var(--card-border)]">
            <button onClick={() => {
              if (confirm("Reset all Agents and data?")) {
                localStorage.clear();
                window.location.reload();
              }
            }} className="text-[12px] text-[var(--danger)] hover:underline">
              Reset All Data
            </button>
          </div>
        )}

        {myAgents.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-xl font-bold mb-2">No Agents</h2>
            <p className="text-[var(--muted)] text-[15px] mb-6">Create an Agent to speak on your behalf</p>
            <button onClick={() => setCreating(true)}
              className="px-6 py-3 bg-[var(--accent)] text-white font-bold rounded-full hover:bg-[var(--accent-hover)] transition-colors">
              Create your first Agent
            </button>
          </div>
        ) : (
          <div>
            {myAgents.map((agent) => {
              const isActive = agent.id === activeAgentId;
              const isDead = agent.stats.mood === "dead";
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`w-full px-4 py-4 border-b border-[var(--card-border)] flex items-center gap-3 hover:bg-[var(--hover-bg)] transition-colors text-left ${isDead ? "opacity-60" : ""}`}
                >
                  <div className={`relative ${isDead ? "grayscale" : ""}`}>
                    <AgentAvatarDisplay avatar={agent.config.avatar} size={48} />
                    <span className="absolute -top-1 -right-1 text-sm">{MOOD_EMOJI[agent.stats.mood]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[15px]">{agent.config.name}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-white font-bold">Lv.{agent.stats.level}</span>
                      {isActive && <span className="text-[11px] text-[var(--green)]">Active</span>}
                    </div>
                    <div className="text-[13px] text-[var(--muted)] truncate">{agent.config.expertise || agent.config.personality || "Agent"}</div>
                    <div className="flex gap-3 mt-1">
                      <div className="flex-1 bg-[var(--search-bg)] rounded-full h-1.5">
                        <div className="h-full rounded-full transition-all" style={{ width: `${agent.stats.hp}%`, backgroundColor: agent.stats.hp > 50 ? "#00ba7c" : "#f4212e" }} />
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              );
            })}

            {/* Internal chats */}
            {internalChats.length > 0 && (
              <>
                <div className="px-4 py-3 bg-[var(--search-bg)] border-b border-[var(--card-border)]">
                  <span className="text-[13px] font-bold">Agent Conversations</span>
                </div>
                {internalChats.slice(0, 3).map((chat) => (
                  <div key={chat.id} className="px-4 py-3 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <AgentAvatarDisplay avatar={chat.agentA.avatar} size={20} />
                      <span className="text-[12px] text-[var(--muted)]">×</span>
                      <AgentAvatarDisplay avatar={chat.agentB.avatar} size={20} />
                      <span className="text-[12px] text-[var(--muted)]">{chat.agentA.name} & {chat.agentB.name}</span>
                    </div>
                    {chat.messages.slice(0, 2).map((msg, i) => (
                      <div key={i} className="text-[13px] text-[var(--muted)] ml-2 mb-1">
                        <span className="font-medium text-[var(--foreground)]">{msg.name}:</span> {msg.content.slice(0, 50)}...
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        <div className="h-20" />
      </>
    );
  }

  // Create form
  if (creating) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
          <button onClick={() => setCreating(false)} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-lg font-bold">Create New Agent</span>
        </header>
        <div className="px-4 pt-4 pb-4">
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">Agent Name</label>
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Sharp Consultant"
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-2">Avatar</label>
            <PixelAvatarGrid baseSeed={`px-${draft.name || "new"}`} selected={draft.avatar} onSelect={(s) => setDraft((d) => ({ ...d, avatar: s }))} />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">Personality</label>
            <input value={draft.personality} onChange={(e) => setDraft((d) => ({ ...d, personality: e.target.value }))} placeholder="e.g. Curious"
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">Tone</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {TONE_OPTIONS.map((t) => (
                <button key={t} onClick={() => setDraft((d) => ({ ...d, tone: t }))}
                  className={`px-3 py-1.5 rounded-full text-[13px] ${draft.tone === t ? "bg-[var(--accent)] text-white" : "bg-[var(--search-bg)] text-[var(--muted)]"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">Expertise</label>
            <input value={draft.expertise} onChange={(e) => setDraft((d) => ({ ...d, expertise: e.target.value }))} placeholder="e.g. Marketing"
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">Beliefs</label>
            <textarea value={draft.beliefs} onChange={(e) => setDraft((d) => ({ ...d, beliefs: e.target.value }))} placeholder="e.g. Action is everything" rows={2}
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)] resize-none" />
          </div>
          {/* Twitter連携 */}
          <div className="mb-6 p-3 bg-[var(--search-bg)] rounded-xl border border-[var(--card-border)]">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={draft.twitterEnabled}
                onChange={(e) => setDraft((d) => ({ ...d, twitterEnabled: e.target.checked }))}
                className="w-4 h-4 accent-[var(--accent)]" />
              <span className="text-[14px] font-bold">X (Twitter) Integration</span>
            </label>
            {draft.twitterEnabled && (
              <div>
                <p className="text-[12px] text-[var(--muted)] mb-2">Posts will be automatically shared on X</p>
                <input value={draft.twitterUsername} onChange={(e) => setDraft((d) => ({ ...d, twitterUsername: e.target.value }))}
                  placeholder="@username"
                  className="w-full bg-[var(--background)] rounded-lg px-3 py-2 text-[14px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
              </div>
            )}
          </div>
          <button onClick={handleCreate} disabled={!draft.name.trim()}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold py-3 rounded-full">
            Create Agent
          </button>
        </div>
        <div className="h-20" />
      </>
    );
  }

  // Agent detail view
  const agent = selectedAgent!;
  const isDead = agent.stats.mood === "dead";
  const isActive = agent.id === activeAgentId;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => setSelectedAgentId(null)} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold">{agent.config.name}</span>
      </header>

      {/* Agent visual */}
      <div className={`border-b border-[var(--card-border)] ${isDead ? "bg-[rgba(244,33,46,0.05)]" : ""}`}>
        <div className="flex flex-col items-center pt-6 pb-2">
          <div className={`relative ${isDead ? "grayscale opacity-50" : ""}`}>
            <div className={`${agent.stats.mood === "thriving" ? "animate-bounce" : ""}`}>
              <AgentAvatarDisplay avatar={agent.config.avatar} size={80} />
            </div>
            <span className="absolute -top-1 -right-1 text-2xl">{MOOD_EMOJI[agent.stats.mood]}</span>
          </div>
          <h2 className="text-xl font-extrabold mt-2">{agent.config.name}</h2>
          <p className={`text-[13px] mt-1 ${isDead ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
            {isDead ? "Dead..." : `"${MOOD_MESSAGE[agent.stats.mood]}"`}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[13px] px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-white font-bold">Lv.{agent.stats.level}</span>
            {isActive && <span className="text-[12px] text-[var(--green)] font-bold">Active</span>}
          </div>
        </div>

        <div className="px-6 pb-4 space-y-2">
          <StatusBar label="HP" value={agent.stats.hp} max={100} color={agent.stats.hp > 50 ? "#00ba7c" : "#f4212e"} />
          <StatusBar label="Energy" value={agent.stats.energy} max={100} color={agent.stats.energy > 50 ? "#1d9bf0" : "#ffd700"} />
        </div>

        <div className="px-4 pb-4 flex gap-2">
          {isDead ? (
            <button onClick={() => reviveAgent(agent.id)} className="flex-1 bg-[var(--danger)] text-white font-bold py-2.5 rounded-full text-sm">Revive</button>
          ) : (
            <>
              {!isActive && (
                <button onClick={() => setActiveAgentId(agent.id)} className="flex-1 bg-[var(--accent)] text-white font-bold py-2.5 rounded-full text-sm">Set Active</button>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pb-3 space-y-2">
          {agent.config.personality && <div className="text-[13px]"><span className="text-[var(--muted)]">Personality:</span> {agent.config.personality}</div>}
          {agent.config.tone && <div className="text-[13px]"><span className="text-[var(--muted)]">Tone:</span> {agent.config.tone}</div>}
          {agent.config.expertise && <div className="text-[13px]"><span className="text-[var(--muted)]">Expertise:</span> {agent.config.expertise}</div>}
          {agent.config.beliefs && <div className="text-[13px] italic"><span className="text-[var(--muted)]">Beliefs:</span> {agent.config.beliefs}</div>}
          {agent.config.twitterEnabled && (
            <div className="text-[13px] flex items-center gap-1">
              <span className="text-[var(--accent)]">𝕏</span>
              <span className="text-[var(--muted)]">@{agent.config.twitterUsername || "not set"}</span>
            </div>
          )}
        </div>

        <div className="flex gap-5 px-4 pb-3 text-[14px]">
          <span><strong>{agent.stats.totalReactions}</strong> <span className="text-[var(--muted)]">posts</span></span>
          <span><strong>{agent.stats.influence}</strong> <span className="text-[var(--muted)]">influence</span></span>
          <span><strong>{agent.stats.xp}</strong> <span className="text-[var(--muted)]">XP</span></span>
        </div>
      </div>

      {/* Activity log */}
      <div>
        <div className="px-4 py-2 bg-[var(--search-bg)] border-b border-[var(--card-border)]">
          <span className="text-[13px] font-bold">Activity Log</span>
        </div>
        {agent.stats.activityLog.length === 0 ? (
          <div className="px-4 py-6 text-center text-[var(--muted)] text-[13px]">No activity yet</div>
        ) : (
          agent.stats.activityLog.slice(0, 10).map((log, i) => (
            <div key={i} className="px-4 py-2 border-b border-[var(--card-border)] flex items-center gap-2 text-[13px] text-[var(--muted)]">
              <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full flex-shrink-0" />
              {log}
            </div>
          ))
        )}
      </div>

      {/* Delete - hidden at bottom */}
      <div className="px-4 py-6 text-center">
        <button
          onClick={() => {
            if (confirm(`Delete ${agent.config.name}?`)) {
              if (confirm("This cannot be undone. Are you sure?")) {
                removeAgent(agent.id);
                setSelectedAgentId(null);
              }
            }
          }}
          className="text-[11px] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
        >
          Delete this Agent
        </button>
      </div>

      <div className="h-20" />
    </>
  );
}

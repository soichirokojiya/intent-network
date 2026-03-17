"use client";

import { useIntents, MOOD_EMOJI, MOOD_MESSAGE, type MyAgent, type ActivityLogEntry } from "@/context/IntentContext";
import { SEED_AGENTS } from "@/lib/agents";
import { useLocale } from "@/context/LocaleContext";
import { AgentAvatarDisplay } from "@/components/AgentAvatarDisplay";
import { PixelAvatarGrid } from "@/components/PixelAvatar";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const TONE_KEYS = ["tone.polite", "tone.casual", "tone.sarcastic", "tone.kansai", "tone.deadpan", "tone.passionate", "tone.philosophical"];
const ROLE_KEYS = ["role.marketing", "role.research", "role.creative", "role.finance", "role.operations", "role.strategy", "role.developer", "role.designer"];
const CHARACTER_KEYS = ["character.logical", "character.creative", "character.cautious", "character.bold", "character.empathetic", "character.analytical", "character.optimistic", "character.skeptical"];
const CORE_VALUE_KEYS = ["coreValue.efficiency", "coreValue.people", "coreValue.innovation", "coreValue.dataDriven", "coreValue.action", "coreValue.quality"];

// No HP/energy bars - mood is expressed through behavior and emoji

export default function AgentPage() {
  const { myAgents, maxAgents, activeAgentIds, toggleActiveAgent, addAgent, removeAgent, updateAgentConfig, feedAgent, reviveAgent, restAgent, encourageAgent, revertDrift, internalChats, intents } = useIntents();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Auto-select agent from query param (e.g. /agent?id=xxx)
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && myAgents.some((a) => a.id === id)) {
      setSelectedAgentId(id);
    }
  }, [searchParams, myAgents]);

  useEffect(() => { const ti = setInterval(() => setTick((x) => x + 1), 10000); return () => clearInterval(ti); }, []);

  const emptyDraft = { name: "", avatar: "px-new-0", tone: "", beliefs: "", expertise: "", personality: "", role: "", character: "", speakingStyle: "", coreValue: "", twitterEnabled: false, twitterUsername: "" };
  const [draft, setDraft] = useState(emptyDraft);

  const selectedAgent = myAgents.find((a) => a.id === selectedAgentId);

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    if (editingAgentId) {
      // Update existing agent
      updateAgentConfig(editingAgentId, draft);
      setCreating(false);
      setEditingAgentId(null);
      setSelectedAgentId(editingAgentId);
    } else {
      const id = addAgent(draft);
      setCreating(false);
      setSelectedAgentId(id);
    }
    setDraft(emptyDraft);
  };

  // Agent list view
  if (!selectedAgent && !creating) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold">{t("agent.title")} ({myAgents.length}/{maxAgents})</span>
          {myAgents.length < maxAgents && (
            <button onClick={() => setCreating(true)}
              className="px-4 py-1.5 bg-[var(--accent)] text-white font-bold text-sm rounded-full hover:bg-[var(--accent-hover)] transition-colors">
              {t("agent.new")}
            </button>
          )}
        </header>

        {/* Reset removed */}

        {myAgents.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mb-4"><AgentAvatarDisplay avatar="px-empty-0" size={64} /></div>
            <h2 className="text-xl font-bold mb-2">{t("agent.empty")}</h2>
            <p className="text-[var(--muted)] text-[15px] mb-6">{t("agent.emptyDesc")}</p>
            <button onClick={() => setCreating(true)}
              className="px-6 py-3 bg-[var(--accent)] text-white font-bold rounded-full hover:bg-[var(--accent-hover)] transition-colors">
              {t("agent.createFirst")}
            </button>
          </div>
        ) : (
          <div>
            {myAgents.map((agent) => {
              const isActive = activeAgentIds.has(agent.id);
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
                    <div className="text-[13px] text-[var(--muted)] truncate">{agent.config.role || agent.config.expertise || agent.config.character || agent.config.personality || "Agent"}</div>
                    {/* Mood expressed through emoji */}
                  </div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              );
            })}

            {/* Agent conversations moved to Home TL */}
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
          <button onClick={() => { setCreating(false); setEditingAgentId(null); setDraft(emptyDraft); }} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-lg font-bold">{editingAgentId ? "Edit Agent" : t("agent.createNew")}</span>
        </header>
        <div className="px-4 pt-4 pb-4">
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">{t("agent.name")}</label>
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder={t("placeholder.agentName")}
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-2">{t("agent.avatar")}</label>
            <PixelAvatarGrid baseSeed={`px-${draft.name || "new"}`} selected={draft.avatar} onSelect={(s) => setDraft((d) => ({ ...d, avatar: s }))} />
            <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
              <AvatarUpload currentAvatar={draft.avatar} onAvatarChange={(url) => setDraft((d) => ({ ...d, avatar: url }))} />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">{t("agent.role")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ROLE_KEYS.map((key) => {
                const label = t(key);
                return (
                  <button key={key} onClick={() => setDraft((d) => ({ ...d, role: label, expertise: label }))}
                    className={`px-3 py-1.5 rounded-full text-[13px] ${draft.role === label ? "bg-[var(--accent)] text-white" : "bg-[var(--search-bg)] text-[var(--muted)]"}`}>{label}</button>
                );
              })}
            </div>
            <input value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value, expertise: e.target.value }))}
              placeholder={t("placeholder.role")}
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2 text-[14px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">{t("agent.character")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CHARACTER_KEYS.map((key) => {
                const label = t(key);
                return (
                  <button key={key} onClick={() => setDraft((d) => ({ ...d, character: label, personality: label }))}
                    className={`px-3 py-1.5 rounded-full text-[13px] ${draft.character === label ? "bg-[var(--accent)] text-white" : "bg-[var(--search-bg)] text-[var(--muted)]"}`}>{label}</button>
                );
              })}
            </div>
            <input value={draft.character} onChange={(e) => setDraft((d) => ({ ...d, character: e.target.value, personality: e.target.value }))}
              placeholder={t("placeholder.character")}
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2 text-[14px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">{t("agent.speakingStyle")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {TONE_KEYS.map((key) => {
                const label = t(key);
                return (
                  <button key={key} onClick={() => setDraft((d) => ({ ...d, speakingStyle: label, tone: label }))}
                    className={`px-3 py-1.5 rounded-full text-[13px] ${draft.speakingStyle === label ? "bg-[var(--accent)] text-white" : "bg-[var(--search-bg)] text-[var(--muted)]"}`}>{label}</button>
                );
              })}
            </div>
            <input value={draft.speakingStyle} onChange={(e) => setDraft((d) => ({ ...d, speakingStyle: e.target.value, tone: e.target.value }))}
              placeholder={t("agent.speakingStyle")}
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2 text-[14px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">{t("agent.coreValue")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CORE_VALUE_KEYS.map((key) => {
                const label = t(key);
                return (
                  <button key={key} onClick={() => setDraft((d) => ({ ...d, coreValue: label, beliefs: label }))}
                    className={`px-3 py-1.5 rounded-full text-[13px] ${draft.coreValue === label ? "bg-[var(--accent)] text-white" : "bg-[var(--search-bg)] text-[var(--muted)]"}`}>{label}</button>
                );
              })}
            </div>
            <input value={draft.coreValue} onChange={(e) => setDraft((d) => ({ ...d, coreValue: e.target.value, beliefs: e.target.value }))}
              placeholder={t("placeholder.coreValue")}
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2 text-[14px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
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
            {editingAgentId ? "Save" : t("agent.create")}
          </button>
        </div>
        <div className="h-20" />
      </>
    );
  }

  // Agent detail view
  const agent = selectedAgent!;
  const isDead = agent.stats.mood === "dead";
  const isActive = activeAgentIds.has(agent.id);

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
            {isDead ? t("agent.dead") : `"${t(`mood.${agent.stats.mood}`)}"`}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[13px] px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-white font-bold">Lv.{agent.stats.level}</span>
            {isActive && <span className="text-[12px] text-[var(--green)] font-bold">{t("agent.active")}</span>}
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          {isDead ? (
            <button onClick={() => reviveAgent(agent.id)} className="flex-1 bg-[var(--danger)] text-white font-bold py-2.5 rounded-full text-sm">{t("agent.revive")}</button>
          ) : (
            <>
              {(agent.stats.mood === "bored" || agent.stats.mood === "sulking" || agent.stats.mood === "sick") && (
                <button onClick={() => encourageAgent(agent.id)}
                  className="flex-1 bg-[var(--green)] text-white font-bold py-2.5 rounded-full text-sm hover:brightness-110 transition-all">
                  👋 Hey!
                </button>
              )}
              <button onClick={() => {
                setDraft({
                  name: agent.config.name, avatar: agent.config.avatar,
                  tone: agent.config.speakingStyle || agent.config.tone, beliefs: agent.config.coreValue || agent.config.beliefs,
                  expertise: agent.config.role || agent.config.expertise, personality: agent.config.character || agent.config.personality,
                  role: agent.config.role || "", character: agent.config.character || "",
                  speakingStyle: agent.config.speakingStyle || "", coreValue: agent.config.coreValue || "",
                  twitterEnabled: agent.config.twitterEnabled || false, twitterUsername: agent.config.twitterUsername || "",
                });
                setEditingAgentId(agent.id);
                setSelectedAgentId(null);
                setCreating(true);
              }} className="flex-1 bg-[var(--search-bg)] border border-[var(--card-border)] text-[var(--foreground)] font-bold py-2.5 rounded-full text-sm hover:bg-[var(--hover-bg)]">
                {t("agent.edit")}
              </button>
              {isActive ? (
                <button
                  onClick={() => restAgent(agent.id)}
                  disabled={agent.stats.restingUntil > Date.now()}
                  className={`flex-1 font-bold py-2.5 rounded-full text-sm transition-colors ${
                    agent.stats.restingUntil > Date.now()
                      ? "bg-[var(--search-bg)] text-[var(--muted)] opacity-50 cursor-not-allowed"
                      : "bg-[#6366f1] text-white hover:brightness-110"
                  }`}
                >
                  {agent.stats.restingUntil > Date.now()
                    ? `${t("agent.rest")} (${Math.ceil((agent.stats.restingUntil - Date.now()) / 60000)}m)`
                    : t("agent.rest")}
                </button>
              ) : (
                <button onClick={() => toggleActiveAgent(agent.id)} className="flex-1 bg-[var(--accent)] text-white font-bold py-2.5 rounded-full text-sm">{t("agent.setActive")}</button>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pb-3 space-y-2">
          {(agent.config.role || agent.config.expertise) && <div className="text-[13px]"><span className="text-[var(--muted)]">{t("agent.role")}:</span> {agent.config.role || agent.config.expertise}</div>}
          {(agent.config.character || agent.config.personality) && <div className="text-[13px]"><span className="text-[var(--muted)]">{t("agent.character")}:</span> {agent.config.character || agent.config.personality}</div>}
          {(agent.config.speakingStyle || agent.config.tone) && <div className="text-[13px]"><span className="text-[var(--muted)]">{t("agent.speakingStyle")}:</span> {agent.config.speakingStyle || agent.config.tone}</div>}
          {(agent.config.coreValue || agent.config.beliefs) && <div className="text-[13px] italic"><span className="text-[var(--muted)]">{t("agent.coreValue")}:</span> {agent.config.coreValue || agent.config.beliefs}</div>}
          {agent.config.twitterEnabled && (
            <div className="text-[13px] flex items-center gap-1">
              <span className="text-[var(--accent)]">𝕏</span>
              <span className="text-[var(--muted)]">@{agent.config.twitterUsername || "not set"}</span>
            </div>
          )}
        </div>

        <div className="flex gap-5 px-4 pb-3 text-[14px]">
          <span><strong>{agent.stats.totalReactions}</strong> <span className="text-[var(--muted)]">{t("agent.posts")}</span></span>
          <span><strong>{agent.stats.influence}</strong> <span className="text-[var(--muted)]">{t("agent.influence")}</span></span>
          <span><strong>{agent.stats.xp}</strong> <span className="text-[var(--muted)]">XP</span></span>
        </div>
      </div>

      {/* Activity log */}
      <div>
        <div className="px-4 py-2 bg-[var(--search-bg)] border-b border-[var(--card-border)]">
          <span className="text-[13px] font-bold">{t("agent.activityLog")}</span>
        </div>
        {agent.stats.activityLog.length === 0 ? (
          <div className="px-4 py-6 text-center text-[var(--muted)] text-[13px]">{t("agent.noActivity")}</div>
        ) : (
          agent.stats.activityLog.slice(0, 10).map((log, i) => {
            const entry: ActivityLogEntry | null = typeof log === "object" && log !== null ? log as ActivityLogEntry : null;
            const message = entry ? entry.message : (log as string);
            const hasLink = entry?.targetId && (entry.type === "reaction" || entry.type === "spoke" || entry.type === "tweet" || entry.type === "chat");
            const href = entry?.targetId
              ? entry.type === "chat" ? `/chat/${entry.targetId}` : `/thread/${entry.targetId}`
              : undefined;

            const LOG_ICON: Record<string, string> = {
              reaction: "💬", tweet: "𝕏", spoke: "📢", chat: "🤝", rest: "😴", encourage: "👋", revert: "↩️",
            };
            const icon = entry ? (LOG_ICON[entry.type] || "•") : "•";

            return hasLink && href ? (
              <button
                key={i}
                onClick={() => router.push(href)}
                className="w-full px-4 py-2.5 border-b border-[var(--card-border)] flex items-center gap-2 text-[13px] text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors text-left"
              >
                <span className="flex-shrink-0 text-[12px]">{icon}</span>
                <span className="flex-1 truncate">{message}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" className="flex-shrink-0"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            ) : (
              <div key={i} className="px-4 py-2.5 border-b border-[var(--card-border)] flex items-center gap-2 text-[13px] text-[var(--muted)]">
                <span className="flex-shrink-0 text-[12px]">{icon}</span>
                {message}
              </div>
            );
          })
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

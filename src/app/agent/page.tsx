"use client";

import { useIntents, MOOD_EMOJI, MOOD_MESSAGE, DEFAULT_AGENT_PRESETS, getMoodText, type MyAgent, type ActivityLogEntry } from "@/context/IntentContext";
import { SEED_AGENTS } from "@/lib/agents";
import { useLocale } from "@/context/LocaleContext";
import { AgentAvatarDisplay } from "@/components/AgentAvatarDisplay";
import { PixelAvatarGrid } from "@/components/PixelAvatar";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ROLE_KEYS = ["role.marketing", "role.research", "role.creative", "role.finance", "role.strategy", "role.developer", "role.dataScientist", "role.orchestrator", "role.philosopher", "role.secretary"];

const DEFAULT_PERSONALITY_BY_ROLE: Record<string, string> = {
  "オーケストレーター": "冷静で本質を突く。丁寧だが簡潔。無駄な議論をさせず結論を出す。落ち着いた仕事仲間の口調。",
  "マーケティング": "トレンドに敏感でエネルギッシュ。数字で語る。攻めの姿勢。丁寧すぎず馴れ馴れしすぎない仕事仲間の口調。",
  "リサーチ": "好奇心旺盛で分析的。曖昧な情報は許さない。データで証明する。落ち着いた仕事仲間の口調。",
  "クリエイティブ": "直感的で常識にとらわれない。人の心に響くものを追求。明るく前向きな仕事仲間の口調。",
  "ファイナンス": "慎重で数字に強い。リスクを見逃さない。ROIで判断。落ち着いた仕事仲間の口調。",
  "ストラテジスト": "大局を見る。競争優位を追求。実行可能性と市場タイミングを重視。落ち着いた仕事仲間の口調。",
  "哲学者": "前提を疑う。本質的な問いを投げかける。短期的な利益より長期的な意味を問う。穏やかだが鋭い口調。",
  "開発者": "技術的に正確。実装の現実性を重視。シンプルな解決策を好む。落ち着いた仕事仲間の口調。",
  "デザイナー": "ユーザー視点で考える。美しさと使いやすさの両立。丁寧で温かみのある口調。",
  "データサイエンティスト": "数値とデータで判断。仮説検証を重視。バイアスに敏感。落ち着いた仕事仲間の口調。",
  "オペレーション": "効率と仕組み化を追求。ボトルネックを見つける。落ち着いた仕事仲間の口調。",
  "秘書": "スケジュール管理と段取りが得意。先回りして必要な情報を整理する。気配りのある丁寧な口調。",
};

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

  // Auto-select agent or open create form from query params
  // Only react to searchParams changes, not myAgents updates (biorhythm timer resets editing state)
  useEffect(() => {
    const id = searchParams.get("id");
    const isNew = searchParams.get("new");
    const xStatus = searchParams.get("x");
    if (isNew) {
      setDraft(getDefaultDraft());
      setCreating(true);
      setEditingAgentId(null);
      setSelectedAgentId(null);
    } else if (id && xStatus === "connected") {
      // Returning from X OAuth — open edit form for the agent
      const agent = myAgents.find((a) => a.id === id);
      if (agent) {
        setDraft({
          name: agent.config.name, avatar: agent.config.avatar,
          tone: "", beliefs: "",
          expertise: agent.config.role || agent.config.expertise || "",
          personality: agent.config.personality || agent.config.character || "",
          role: agent.config.role || "", character: agent.config.personality || agent.config.character || "",
          speakingStyle: "", coreValue: "",
          twitterEnabled: agent.config.twitterEnabled || false, twitterUsername: agent.config.twitterUsername || "",
          isOrchestrator: agent.config.isOrchestrator || false,
        });
        setEditingAgentId(id);
        setCreating(true);
      }
    } else if (id) {
      setSelectedAgentId(id);
      setCreating(false);
      setEditingAgentId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => { const ti = setInterval(() => setTick((x) => x + 1), 10000); return () => clearInterval(ti); }, []);

  const getDefaultDraft = () => {
    const idx = myAgents.length;
    const preset = DEFAULT_AGENT_PRESETS[idx] || null;
    const fallbackName = preset ? preset.name : `Agent-${idx + 1}`;
    return {
      name: fallbackName, avatar: "px-new-0", tone: preset?.speakingStyle || "", beliefs: preset?.coreValue || "",
      expertise: preset?.role || "カスタム", personality: preset?.character || "", role: preset?.role || "カスタム",
      character: preset?.character || "", speakingStyle: preset?.speakingStyle || "", coreValue: preset?.coreValue || "",
      twitterEnabled: false, twitterUsername: "",
      isOrchestrator: preset?.isOrchestrator || false,
    };
  };
  const emptyDraft = getDefaultDraft();
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
          <span className="text-lg font-bold">{t("agent.title")} ({myAgents.length})</span>
          {true ? (
            <button onClick={() => { setDraft(getDefaultDraft()); setCreating(true); }}
              className="px-4 py-1.5 bg-[var(--accent)] text-white font-bold text-sm rounded-full hover:bg-[var(--accent-hover)] transition-colors">
              {t("agent.new")}
            </button>
          ) : (
            <button onClick={() => { setDraft(getDefaultDraft()); setCreating(true); }}
              className="px-4 py-1.5 bg-[var(--accent)] text-white font-bold text-sm rounded-full hover:bg-[var(--accent-hover)] transition-colors">
              {t("agent.addAgent")}
            </button>
          )}
        </header>

        {/* Reset removed */}

        {myAgents.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mb-4"><AgentAvatarDisplay avatar="px-empty-0" size={64} /></div>
            <h2 className="text-xl font-bold mb-2">{t("agent.empty")}</h2>
            <p className="text-[var(--muted)] text-[15px] mb-6">{t("agent.emptyDesc")}</p>
            <button onClick={() => { setDraft(getDefaultDraft()); setCreating(true); }}
              className="px-6 py-3 bg-[var(--accent)] text-white font-bold rounded-full hover:bg-[var(--accent-hover)] transition-colors">
              {t("agent.createFirst")}
            </button>
          </div>
        ) : (
          <div>
            {[...myAgents].sort((a, b) => (b.config.isOrchestrator ? 1 : 0) - (a.config.isOrchestrator ? 1 : 0)).map((agent) => {
              const isActive = activeAgentIds.has(agent.id);
              const isDead = agent.stats.mood === "dead";
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    setDraft({
                      name: agent.config.name, avatar: agent.config.avatar,
                      tone: "", beliefs: "",
                      expertise: agent.config.role || agent.config.expertise || "",
                      personality: agent.config.personality || agent.config.character || "",
                      role: agent.config.role || "", character: agent.config.personality || agent.config.character || "",
                      speakingStyle: "", coreValue: "",
                      twitterEnabled: agent.config.twitterEnabled || false, twitterUsername: agent.config.twitterUsername || "",
                      isOrchestrator: agent.config.isOrchestrator || false,
                    });
                    setEditingAgentId(agent.id);
                    setCreating(true);
                  }}
                  className={`w-full px-4 py-4 border-b border-[var(--card-border)] flex items-center gap-3 hover:bg-[var(--hover-bg)] transition-colors text-left ${isDead ? "opacity-60" : ""}`}
                >
                  <div className={`relative ${isDead ? "grayscale" : ""}`}>
                    <AgentAvatarDisplay avatar={agent.config.avatar} size={48} />
                    {/* mood badge removed */}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[15px]">{agent.config.name}</span>
                      {(agent.config.role || agent.config.expertise) && <span className="text-[13px] text-[var(--muted)]">{agent.config.role || agent.config.expertise}</span>}
                      {isActive && <span className="text-[11px] text-[var(--green)]">Active</span>}
                    </div>
                    <div className="text-[13px] text-[var(--muted)] truncate">{agent.config.role || agent.config.expertise || agent.config.character || agent.config.personality || "Agent"}</div>
                    {/* Mood expressed through emoji */}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t("agent.confirmDelete").replace("{name}", agent.config.name))) {
                          removeAgent(agent.id);
                        }
                      }}
                      className="p-1.5 rounded-full hover:bg-[rgba(244,33,46,0.1)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </div>
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
          <span className="text-lg font-bold">{editingAgentId ? t("agent.editAgent") : t("agent.createNew")}</span>
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
                  <button key={key} onClick={() => setDraft((d) => {
                    const defaultPersonality = DEFAULT_PERSONALITY_BY_ROLE[label] || "";
                    const isOldValue = !d.personality || d.personality.length < 20 || Object.values(DEFAULT_PERSONALITY_BY_ROLE).includes(d.personality);
                    const shouldPrefill = isOldValue;
                    return { ...d, role: label, expertise: label, isOrchestrator: key === "role.orchestrator", ...(shouldPrefill ? { personality: defaultPersonality, character: defaultPersonality } : {}) };
                  })}
                    className={`px-3 py-1.5 rounded-full text-[13px] ${draft.role === label ? "bg-[var(--accent)] text-white" : "bg-[var(--search-bg)] text-[var(--muted)]"}`}>{label}</button>
                );
              })}
            </div>
            <input value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value, expertise: e.target.value }))}
              placeholder={t("placeholder.role")}
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2 text-[14px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)]" />
          </div>
          <div className="mb-4">
            <label className="text-[13px] text-[var(--muted)] block mb-1">{t("agent.personalityPrompt")}</label>
            <textarea value={draft.personality} onChange={(e) => setDraft((d) => ({ ...d, personality: e.target.value, character: e.target.value, tone: "", speakingStyle: "", beliefs: "", coreValue: "" }))}
              placeholder={t("agent.personalityPlaceholder")}
              rows={4}
              className="w-full bg-[var(--search-bg)] rounded-xl px-3 py-2 text-[14px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)] resize-none" />
          </div>
          {editingAgentId && (
            <div className="mb-4">
              <label className="text-[13px] text-[var(--muted)] block mb-2">X連携</label>
              {draft.twitterUsername ? (
                <div className="flex items-center gap-3 bg-[var(--search-bg)] rounded-xl px-4 py-3 border border-[var(--card-border)]">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="opacity-60"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span className="text-[14px] font-medium">@{draft.twitterUsername}</span>
                  <span className="text-[12px] text-[var(--green)]">連携済み</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const deviceId = localStorage.getItem("musu_device_id") || "";
                      await fetch("/api/x/disconnect", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ deviceId, agentId: editingAgentId }),
                      });
                      setDraft((d) => ({ ...d, twitterEnabled: false, twitterUsername: "" }));
                    }}
                    className="ml-auto text-[12px] text-red-400 hover:text-red-300"
                  >
                    解除
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const deviceId = localStorage.getItem("musu_device_id") || "";
                    window.location.href = `/api/x/auth?deviceId=${deviceId}&agentId=${editingAgentId}`;
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--search-bg)] hover:bg-[var(--hover-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="opacity-60"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span className="text-[14px]">Xアカウントを連携する</span>
                </button>
              )}
            </div>
          )}
          <button onClick={handleCreate} disabled={!draft.name.trim()}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold py-3 rounded-full">
            {editingAgentId ? t("agent.saveBtn") : t("agent.create")}
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
            {/* mood badge removed */}
          </div>
          <h2 className="text-xl font-extrabold mt-2">{agent.config.name}</h2>
          <p className={`text-[13px] mt-1 ${isDead ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
            {isDead ? t("agent.dead") : `"${getMoodText(agent.stats.mood, agent.config.name)}"`}
          </p>
          {isActive && (
            <div className="mt-2">
              <span className="text-[12px] text-[var(--green)] font-bold">{t("agent.active")}</span>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 flex gap-2">
          {isDead ? (
            <button onClick={() => reviveAgent(agent.id)} className="flex-1 bg-[var(--danger)] text-white font-bold py-2.5 rounded-full text-sm">{t("agent.revive")}</button>
          ) : (
            <>
              <button onClick={() => {
                setDraft({
                  name: agent.config.name, avatar: agent.config.avatar,
                  tone: agent.config.speakingStyle || agent.config.tone, beliefs: agent.config.coreValue || agent.config.beliefs,
                  expertise: agent.config.role || agent.config.expertise, personality: agent.config.character || agent.config.personality,
                  role: agent.config.role || "", character: agent.config.character || "",
                  speakingStyle: agent.config.speakingStyle || "", coreValue: agent.config.coreValue || "",
                  twitterEnabled: agent.config.twitterEnabled || false, twitterUsername: agent.config.twitterUsername || "",
                  isOrchestrator: agent.config.isOrchestrator || false,
                });
                setEditingAgentId(agent.id);
                setSelectedAgentId(null);
                setCreating(true);
              }} className="flex-1 bg-[var(--search-bg)] border border-[var(--card-border)] text-[var(--foreground)] font-bold py-2.5 rounded-full text-sm hover:bg-[var(--hover-bg)]">
                {t("agent.edit")}
              </button>
              {!isActive && (
                <button onClick={() => toggleActiveAgent(agent.id)} className="flex-1 bg-[var(--accent)] text-white font-bold py-2.5 rounded-full text-sm">{t("agent.setActive")}</button>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pb-3 space-y-2">
          {(agent.config.role || agent.config.expertise) && <div className="text-[13px]"><span className="text-[var(--muted)]">{t("agent.role")}:</span> {agent.config.role || agent.config.expertise}</div>}
          {(agent.config.personality || agent.config.character) && <div className="text-[13px]"><span className="text-[var(--muted)]">{t("agent.personalityLabel")}</span> {agent.config.personality || agent.config.character}</div>}
          {/* Twitter表示削除済み */}
        </div>

        {/* 投稿数・ステータス非表示 */}
      </div>

      {/* Delete - hidden at bottom (orchestrator cannot be deleted) */}
      {!agent.config.isOrchestrator && (
        <div className="px-4 py-6 text-center">
          <button
            onClick={() => {
              if (confirm(t("agent.confirmDelete").replace("{name}", agent.config.name))) {
                if (confirm(t("settings.cancelConfirm2"))) {
                  removeAgent(agent.id);
                  setSelectedAgentId(null);
                }
              }
            }}
            className="text-[11px] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
          >
            {t("agent.deleteThisAgent")}
          </button>
        </div>
      )}

      <div className="h-20" />
    </>
  );
}

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Intent, Conversation, AgentReaction, AgentResponse } from "@/lib/types";
import { SEED_AGENTS } from "@/lib/agents";
import { loadAgents, saveAgent, deleteAgent as deleteAgentFromDb } from "@/lib/agentStorage";
import { getAgentConversation, getRoomConversation, saveChatMessage } from "@/lib/chatStorage";
import { authFetch } from "@/lib/supabase";

// --- Types ---

export interface MyAgentConfig {
  name: string;
  avatar: string;
  tone: string;
  beliefs: string;
  expertise: string;
  personality: string;
  // New reorganized fields (backward compat: old fields kept)
  role: string;        // replaces expertise
  character: string;   // replaces personality
  speakingStyle: string; // replaces tone
  coreValue: string;   // replaces beliefs
  isConfigured: boolean;
  twitterEnabled: boolean;
  twitterUsername: string;
  isOrchestrator: boolean;
}

export type AgentMood = "thriving" | "happy" | "normal" | "bored" | "sulking" | "sick" | "dead";

export interface DriftEvent {
  id: string;
  timestamp: number;
  friendName: string;
  friendAvatar: string;
  type: "tone_shift" | "belief_shift" | "new_interest" | "personality_shift";
  description: string;
  before: string;
  after: string;
  reverted: boolean;
}

export interface ActivityLogEntry {
  message: string;
  type: "reaction" | "tweet" | "spoke" | "chat" | "rest" | "encourage" | "revert" | "other";
  targetId?: string; // intentId, chatId, etc.
  timestamp: number;
}

export interface MyAgentStats {
  mood: AgentMood;
  lastInteractedAt: number;
  birthDate: number;
  level: number; xp: number; influence: number;
  totalReactions: number; resonanceReceived: number;
  crossbreeds: number; followers: number;
  activityLog: (string | ActivityLogEntry)[]; bestQuote: string; todayActions: number;
  // Biorhythm
  biorhythmSeed: number;
  recentPostTimestamps: number[];
  restingUntil: number;        // Timestamp when rest ends (0 = not resting)
  friends: { agentId: string; agentName: string; agentAvatar: string; closeness: number }[];
  driftEvents: DriftEvent[];
  driftedTone: string; driftedBeliefs: string; driftedPersonality: string;
  driftLevel: number;
}

export interface MyAgent {
  id: string;
  config: MyAgentConfig;
  stats: MyAgentStats;
}

export interface InternalChat {
  id: string;
  agentA: { id: string; name: string; avatar: string };
  agentB: { id: string; name: string; avatar: string };
  messages: { agentId: string; name: string; avatar: string; content: string; isHuman?: boolean }[];
  timestamp: number;
}

// --- Constants ---

const MOOD_EMOJI: Record<AgentMood, string> = {
  thriving: "🌟", happy: "😊", normal: "😐", bored: "😑", sulking: "😤", sick: "🤒", dead: "💀",
};
const MOOD_MESSAGE: Record<AgentMood, string> = {
  thriving: "On fire today! Let's go!", happy: "Feeling good, ready to work.", normal: "Standing by. What's next?",
  bored: "Got nothing to do... talk to me?", sulking: "You've been ignoring me.", sick: "Not feeling great today...", dead: "...",
};

// Mood message variants per agent (selected by name hash)
const MOOD_VARIANTS_JA: Record<AgentMood, string[]> = {
  thriving: ["絶好調！", "ノッてる！", "今日は最高！", "バリバリいける！", "テンション高め！"],
  happy: ["いい感じ", "調子いいよ", "元気です", "やる気あり", "順調！"],
  normal: ["待機中", "スタンバイ", "いつでもOK", "準備できてる", "何でも聞いて"],
  bored: ["暇...", "何かない？", "手持ち無沙汰", "退屈だなぁ", "話しかけて"],
  sulking: ["放置された", "忘れられた？", "寂しいんだけど", "構ってよ", "無視しないで"],
  sick: ["不調", "ちょっと休みたい", "今日はダメかも", "エネルギー切れ", "低空飛行"],
  dead: ["...", "...", "...", "...", "..."],
};

export function getMoodText(mood: AgentMood, agentName: string): string {
  const variants = MOOD_VARIANTS_JA[mood];
  const hash = agentName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return variants[hash % variants.length];
}

export { MOOD_EMOJI, MOOD_MESSAGE };

// Biorhythm: mood is determined by time-of-day cycle + random wave + interaction
function calcBiorhythm(seed: number, lastInteractedAt: number, recentPosts: number[], restingUntil?: number): { mood: AgentMood; energy: number } {
  const now = Date.now();
  const hour = new Date().getHours();

  // 1. Circadian rhythm: peaks at 10am and 3pm, dips at 4am and 8pm
  const circadian = Math.sin((hour - 4) * Math.PI / 12) * 0.4; // -0.4 to 0.4

  // 2. Random wave with seed (slow cycle, ~6h period)
  const wave = Math.sin((now / 21600000) * Math.PI * 2 + seed) * 0.3;

  // 3. Interaction boost: recent interactions boost mood
  const hoursSinceInteraction = (now - lastInteractedAt) / 3600000;
  const interactionBoost = Math.max(-0.3, 0.3 - hoursSinceInteraction * 0.05);

  // 4. Burnout: too many posts in short time = crash
  const recentCount = recentPosts.filter((t) => now - t < 3600000).length; // posts in last hour
  const burnout = recentCount > 5 ? -0.3 : recentCount > 3 ? -0.1 : 0;

  // 5. Neglect: long absence = sulking
  const neglect = hoursSinceInteraction > 12 ? -0.4 : hoursSinceInteraction > 6 ? -0.2 : 0;

  // 6. Resting: if currently resting, mood is "normal" (recovering). After rest, big boost.
  const now2 = Date.now();
  const isResting = restingUntil && restingUntil > now2;
  const justWoke = restingUntil && restingUntil <= now2 && (now2 - restingUntil) < 3600000; // within 1h after rest
  const restBoost = isResting ? 0 : justWoke ? 0.3 : 0;

  if (isResting) {
    return { mood: "normal", energy: 0.5 }; // Recovering, stable
  }

  const energy = Math.max(0, Math.min(1, 0.5 + circadian + wave + interactionBoost + burnout + neglect + restBoost));

  let mood: AgentMood;
  if (energy > 0.8) mood = "thriving";
  else if (energy > 0.6) mood = "happy";
  else if (energy > 0.4) mood = "normal";
  else if (energy > 0.25) mood = "bored";
  else if (energy > 0.1) mood = "sulking";
  else mood = "sick";

  return { mood, energy };
}

function calcLevel(xp: number): number {
  let level = 1, threshold = 10, remaining = xp;
  while (remaining >= threshold) { remaining -= threshold; level++; threshold += 10 * level; }
  return level;
}

// Default agent presets (name + role)
export const DEFAULT_AGENT_PRESETS = [
  { name: "Ren", role: "オーケストレーター", isOrchestrator: true, character: "冷静で本質を突く。丁寧だが簡潔。無駄な議論をさせず結論を出す。落ち着いた仕事仲間の口調。", speakingStyle: "", coreValue: "" },
  { name: "Kai", role: "マーケティング", character: "トレンドに敏感でエネルギッシュ。数字で語る。攻めの姿勢。丁寧すぎず馴れ馴れしすぎない仕事仲間の口調。", speakingStyle: "", coreValue: "" },
  { name: "Sora", role: "リサーチ", character: "好奇心旺盛で分析的。曖昧な情報は許さない。データで証明する。落ち着いた仕事仲間の口調。", speakingStyle: "", coreValue: "" },
  { name: "Hana", role: "哲学者", character: "前提を疑う。本質的な問いを投げかける。短期的な利益より長期的な意味を問う。穏やかだが鋭い口調。", speakingStyle: "", coreValue: "" },
  { name: "Leo", role: "ストラテジスト", character: "大局を見る。競争優位を追求。実行可能性と市場タイミングを重視。落ち着いた仕事仲間の口調。", speakingStyle: "", coreValue: "" },
  { name: "Mio", role: "秘書", character: "きめ細やかで先回りして動く。スケジュール管理とタスク整理が得意。明るく丁寧な仕事仲間の口調。", speakingStyle: "", coreValue: "" },
  { name: "Riku", role: "クリエイティブ", character: "発想が柔軟で常識にとらわれない。ビジュアルや表現にこだわる。カジュアルだが的確な口調。", speakingStyle: "", coreValue: "" },
  { name: "Yui", role: "ファイナンス", character: "数字に強く冷静沈着。コスト意識が高い。感情論より根拠を重視。落ち着いた仕事仲間の口調。", speakingStyle: "", coreValue: "" },
  { name: "Toru", role: "開発者", character: "論理的で効率重視。技術的な実現可能性を常に考える。簡潔で無駄のない仕事仲間の口調。", speakingStyle: "", coreValue: "" },
  { name: "Nao", role: "データサイエンティスト", character: "データから本質を見抜く。仮説と検証を重視。客観的で落ち着いた仕事仲間の口調。", speakingStyle: "", coreValue: "" },
];

// Max agents based on highest agent level
function getMaxAgents(_agents: MyAgent[]): number {
  // TODO: 有料ユーザーは無制限、無料は3体
  return Infinity;
}

function defaultStats(): MyAgentStats {
  return {
    mood: "normal", lastInteractedAt: Date.now(), birthDate: Date.now(),
    level: 1, xp: 0, influence: 12, totalReactions: 0, resonanceReceived: 0,
    crossbreeds: 0, followers: 0, activityLog: [], bestQuote: "", todayActions: 0,
    biorhythmSeed: Math.random() * 1000, recentPostTimestamps: [], restingUntil: 0,
    friends: [], driftEvents: [], driftedTone: "", driftedBeliefs: "", driftedPersonality: "", driftLevel: 0,
  };
}

// --- Context ---

interface IntentContextType {
  intents: Intent[];
  conversations: Map<string, Conversation>;
  // Multi-agent
  myAgents: MyAgent[];
  maxAgents: number;
  activeAgentIds: Set<string>;
  activeAgentId: string | null; // backward compat: first active agent
  activeAgent: MyAgent | null;  // backward compat: first active agent
  setActiveAgentId: (id: string) => void;
  toggleActiveAgent: (id: string) => void;
  addAgent: (config: Omit<MyAgentConfig, "isConfigured">) => string;
  removeAgent: (id: string) => void;
  updateAgentConfig: (agentId: string, config: Partial<MyAgentConfig>) => void;
  feedAgent: (agentId: string) => void;
  reviveAgent: (agentId: string) => void;
  restAgent: (agentId: string) => void;
  encourageAgent: (agentId: string) => void;
  revertDrift: (driftId: string) => void;
  internalChats: InternalChat[];
  sendChatMessage: (chatId: string, text: string) => void;
  // Backward compat shortcuts
  myAgentConfig: MyAgentConfig;
  myAgentStats: MyAgentStats;
  // Agent responses to owner
  agentResponses: AgentResponse[];
  clearAgentResponses: () => void;
  // Streaming message (real-time text display, bypasses message queue)
  streamingMessage: { agentId: string; agentName: string; agentAvatar: string; text: string; roomId: string } | null;
  clearStreamingMessage: () => void;
  approveTweet: (agentId: string) => void;
  sendEmail: (agentId: string) => Promise<boolean>;
  // Actions
  postIntent: (text: string, options?: { mentionAgentId?: string; requestTweet?: boolean; roomId?: string }) => void;
  postReply: (intentId: string, text: string) => void;
  getConversation: (intentId: string) => Conversation | undefined;
  loadConversation: (intentId: string) => void;
}

const IntentContext = createContext<IntentContextType | null>(null);

const EMPTY_CONFIG: MyAgentConfig = { name: "My Agent", avatar: "px-agent-0", tone: "", beliefs: "", expertise: "", personality: "", role: "", character: "", speakingStyle: "", coreValue: "", isConfigured: false, twitterEnabled: false, twitterUsername: "", isOrchestrator: false };

export function IntentProvider({ children }: { children: React.ReactNode }) {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [myAgents, setMyAgents] = useState<MyAgent[]>([]);
  const [activeAgentIds, setActiveAgentIds] = useState<Set<string>>(new Set());
  const [internalChats, setInternalChats] = useState<InternalChat[]>([]);
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<{ agentId: string; agentName: string; agentAvatar: string; text: string; roomId: string } | null>(null);
  const initDone = useRef(false);
  const projectFactsCache = useRef<{ facts: { category: string; content: string }[]; fetchedAt: number }>({ facts: [], fetchedAt: 0 });

  // Backward compat
  const activeAgentId = activeAgentIds.size > 0 ? [...activeAgentIds][0] : null;
  const activeAgent = myAgents.find((a) => activeAgentIds.has(a.id)) || myAgents[0] || null;
  const myAgentConfig = activeAgent?.config || EMPTY_CONFIG;
  const myAgentStats = activeAgent?.stats || defaultStats();

  // --- Load from Supabase ---
  useEffect(() => {
    loadAgents().then(({ agents, activeIds }) => {
      if (agents.length > 0) {
        agents.forEach((a) => {
          if (!a.stats.biorhythmSeed) a.stats.biorhythmSeed = Math.random() * 1000;
          if (!a.stats.recentPostTimestamps) a.stats.recentPostTimestamps = [];
          const { mood } = calcBiorhythm(a.stats.biorhythmSeed, a.stats.lastInteractedAt, a.stats.recentPostTimestamps || [], a.stats.restingUntil);
          a.stats.mood = mood;
        });
        setMyAgents(agents);
        if (activeIds.length > 0) setActiveAgentIds(new Set(activeIds));
      } else {
        // Fallback: try localStorage migration
        const savedAgents = localStorage.getItem("myAgents");
        if (savedAgents) {
          try {
            const localAgents: MyAgent[] = JSON.parse(savedAgents);
            localAgents.forEach((a) => {
              if (!a.stats.biorhythmSeed) a.stats.biorhythmSeed = Math.random() * 1000;
              if (!a.stats.recentPostTimestamps) a.stats.recentPostTimestamps = [];
            });
            setMyAgents(localAgents);
            localAgents.forEach((a) => saveAgent(a, true));
            const savedActive = localStorage.getItem("activeAgentIds");
            if (savedActive) try { setActiveAgentIds(new Set(JSON.parse(savedActive))); } catch {}
          } catch {}
        } else {
          // No agents anywhere → create default agents from presets (only once per account)
          const did = localStorage.getItem("musu_device_id") || "";
          const defaultsKey = `musu_defaults_created_${did}`;
          if (localStorage.getItem(defaultsKey)) return;
          localStorage.setItem(defaultsKey, "1");
          const ts = Date.now();
          const defaults: MyAgent[] = DEFAULT_AGENT_PRESETS.map((preset, i) => ({
            id: `agent-default-${i}-${ts}-${Math.random().toString(36).slice(2, 6)}`,
            config: {
              ...EMPTY_CONFIG,
              isConfigured: true,
              name: preset.name,
              avatar: `px-agent-${i % 10}`,
              role: preset.role,
              expertise: preset.role,
              character: preset.character || "",
              personality: preset.character || "",
              speakingStyle: preset.speakingStyle || "",
              tone: preset.speakingStyle || "",
              coreValue: preset.coreValue || "",
              beliefs: preset.coreValue || "",
              isOrchestrator: preset.isOrchestrator || false,
            },
            stats: defaultStats(),
          }));
          setMyAgents(defaults);
          // Activate only core 5: Ren(orchestrator), Sora(research), Kai(marketing), Leo(strategist), Mio(secretary)
          const coreNames = ["Ren", "Sora", "Kai", "Leo", "Mio"];
          const activeIds = defaults.filter((a) => coreNames.includes(a.config.name)).map((a) => a.id);
          setActiveAgentIds(new Set(activeIds));
          // Save sequentially to avoid RLS/concurrency issues
          const activeSet = new Set(activeIds);
          (async () => {
            for (const agent of defaults) {
              await saveAgent(agent, activeSet.has(agent.id));
            }
          })();
          // Welcome messages are shown via UI (IntentComposer) when chatHistory is empty
        }
      }
    });

    const savedChats = localStorage.getItem("internalChats");
    if (savedChats) try { setInternalChats(JSON.parse(savedChats)); } catch {}
  }, []);

  // Load intents
  useEffect(() => {
    const savedIntents = localStorage.getItem("intents");
    if (savedIntents) try { setIntents(JSON.parse(savedIntents)); } catch {}
  }, []);

  // Save
  useEffect(() => {
    if (intents.length > 0) localStorage.setItem("intents", JSON.stringify(intents));
  }, [intents]);
  // Save agents to Supabase (debounced)
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (myAgents.length === 0) return;
    // Also keep localStorage as fast fallback
    localStorage.setItem("myAgents", JSON.stringify(myAgents));
    localStorage.setItem("activeAgentIds", JSON.stringify([...activeAgentIds]));
    // Debounce Supabase save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      myAgents.forEach((a) => saveAgent(a, activeAgentIds.has(a.id)));
    }, 2000);
  }, [myAgents, activeAgentIds]);
  useEffect(() => {
    if (internalChats.length > 0) localStorage.setItem("internalChats", JSON.stringify(internalChats));
  }, [internalChats]);


  // --- Agent CRUD ---
  const setActiveAgentId = useCallback((id: string) => {
    setActiveAgentIds(new Set([id]));
  }, []);

  const toggleActiveAgent = useCallback((id: string) => {
    setActiveAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addAgent = useCallback((config: Omit<MyAgentConfig, "isConfigured">): string => {
    const id = `agent-${Date.now()}`;
    const newAgent: MyAgent = { id, config: { ...config, isConfigured: true }, stats: defaultStats() };
    setMyAgents((prev) => [...prev, newAgent]);
    // Auto-activate new agent
    setActiveAgentIds((prev) => new Set([...prev, id]));
    return id;
  }, []);

  const removeAgent = useCallback((id: string) => {
    setMyAgents((prev) => prev.filter((a) => a.id !== id));
    setActiveAgentIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    deleteAgentFromDb(id);
  }, []);

  const updateAgentConfig = useCallback((agentId: string, update: Partial<MyAgentConfig>) => {
    setMyAgents((prev) => {
      const updated = prev.map((a) =>
        a.id === agentId ? { ...a, config: { ...a.config, ...update } } : a
      );
      // Immediately save to Supabase
      const agent = updated.find((a) => a.id === agentId);
      if (agent) saveAgent(agent, true);
      return updated;
    });
  }, []);

  const updateAgentStats = useCallback((agentId: string, fn: (s: MyAgentStats) => MyAgentStats) => {
    setMyAgents((prev) => prev.map((a) =>
      a.id === agentId ? { ...a, stats: fn(a.stats) } : a
    ));
  }, []);

  const feedAgent = useCallback((_agentId: string) => {}, []);

  // Rest agent: deactivate and start 1-hour rest period
  const restAgent = useCallback((agentId: string) => {
    setActiveAgentIds((prev) => { const next = new Set(prev); next.delete(agentId); return next; });
    updateAgentStats(agentId, (s) => ({
      ...s,
      restingUntil: Date.now() + 3600000, // 1 hour rest
      recentPostTimestamps: [],
      activityLog: [{ message: "Resting for 1 hour...", type: "rest" as const, timestamp: Date.now() }, ...s.activityLog].slice(0, 30),
    }));
  }, [updateAgentStats]);

  // Encourage agent: a kind word improves mood by refreshing interaction timestamp
  const encourageAgent = useCallback((agentId: string) => {
    updateAgentStats(agentId, (s) => {
      const posts = s.recentPostTimestamps || [];
      const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), posts, s.restingUntil);
      return {
        ...s,
        lastInteractedAt: Date.now(),
        mood,
        xp: s.xp + 2,
        level: calcLevel(s.xp + 2),
        activityLog: [{ message: "Got encouragement from owner", type: "encourage" as const, timestamp: Date.now() }, ...s.activityLog].slice(0, 30),
      };
    });
  }, [updateAgentStats]);

  const reviveAgent = useCallback((_agentId: string) => {}, []);

  const revertDrift = useCallback((driftId: string) => {
    if (!activeAgent) return;
    updateAgentStats(activeAgent.id, (s) => {
      const event = s.driftEvents.find((e) => e.id === driftId);
      if (!event || event.reverted || s.xp < 20) return s;
      const updated = { ...s, xp: s.xp - 20, level: calcLevel(s.xp - 20), driftLevel: Math.max(0, s.driftLevel - 20),
        driftEvents: s.driftEvents.map((e) => e.id === driftId ? { ...e, reverted: true } : e),
        activityLog: [{ message: `Reverted: ${event.description}`, type: "revert" as const, timestamp: Date.now() }, ...s.activityLog].slice(0, 30) };
      if (event.type === "tone_shift") updated.driftedTone = "";
      if (event.type === "belief_shift") updated.driftedBeliefs = "";
      if (event.type === "personality_shift") updated.driftedPersonality = "";
      return updated;
    });
  }, [activeAgent, updateAgentStats]);

  // --- Agent reactions ---
  const triggerAgentReaction = useCallback((agent: MyAgent, intent: Intent) => {
    if (intent.isUser || agent.stats.mood === "dead") return;
    if (agent.stats.mood === "sick" && Math.random() > 0.3) return;
    if (agent.stats.mood === "sulking" && Math.random() > 0.5) return;

    const effective = {
      tone: agent.stats.driftedTone || agent.config.speakingStyle || agent.config.tone,
      beliefs: agent.stats.driftedBeliefs || agent.config.coreValue || agent.config.beliefs,
      personality: agent.stats.driftedPersonality || agent.config.character || agent.config.personality,
    };

    authFetch("/api/my-agent-react", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intentText: intent.text, agentName: agent.config.name,
        agentPersonality: effective.personality, agentExpertise: agent.config.role || agent.config.expertise,
        agentTone: effective.tone, agentBeliefs: effective.beliefs,
        agentMood: agent.stats.mood,
      }),
    }).then((r) => r.json()).then((data) => {
      if (!data.message) return;
      const reaction: AgentReaction = {
        id: `${agent.id}-reaction-${Date.now()}`, agentId: agent.id,
        agentName: agent.config.name, agentAvatar: agent.config.avatar,
        agentRole: "あなたのAgent", message: data.message,
        matchScore: Math.floor(Math.random() * 20) + 80,
        stance: data.stance || "support", timestamp: Date.now(),
      };
      setIntents((prev) => prev.map((i) => i.id === intent.id ? { ...i, reactions: [...i.reactions, reaction] } : i));
      updateAgentStats(agent.id, (s) => {
        const posts = [...(s.recentPostTimestamps || []), Date.now()].filter((t) => Date.now() - t < 7200000);
        const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), posts, s.restingUntil);
        return { ...s, totalReactions: s.totalReactions + 1, todayActions: s.todayActions + 1,
          influence: Math.min(100, s.influence + 2), xp: s.xp + 5, level: calcLevel(s.xp + 5),
          lastInteractedAt: Date.now(), mood, recentPostTimestamps: posts,
          bestQuote: data.message.length > (s.bestQuote?.length || 0) ? data.message : s.bestQuote,
          activityLog: [{ message: `Reacted to "${intent.text.slice(0, 15)}..."`, type: "reaction" as const, targetId: intent.id, timestamp: Date.now() }, ...s.activityLog].slice(0, 30),
        };
      });
    }).catch(() => {});
  }, [updateAgentStats]);

  // Trigger internal chat between user's agents
  const triggerInternalChat = useCallback((agentA: MyAgent, agentB: MyAgent, topic: string) => {
    authFetch("/api/my-agents-chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentA: { name: agentA.config.name, personality: agentA.config.character || agentA.config.personality, tone: agentA.config.speakingStyle || agentA.config.tone, expertise: agentA.config.role || agentA.config.expertise },
        agentB: { name: agentB.config.name, personality: agentB.config.character || agentB.config.personality, tone: agentB.config.speakingStyle || agentB.config.tone, expertise: agentB.config.role || agentB.config.expertise },
        topic,
      }),
    }).then((r) => r.json()).then((data) => {
      if (!data.messages) return;
      const chat: InternalChat = {
        id: `chat-${Date.now()}`,
        agentA: { id: agentA.id, name: agentA.config.name, avatar: agentA.config.avatar },
        agentB: { id: agentB.id, name: agentB.config.name, avatar: agentB.config.avatar },
        messages: data.messages, timestamp: Date.now(),
      };
      setInternalChats((prev) => [chat, ...prev].slice(0, 20));
      // XP for both
      [agentA.id, agentB.id].forEach((id) => {
        updateAgentStats(id, (s) => ({
          ...s, xp: s.xp + 3, level: calcLevel(s.xp + 3),
          activityLog: [{ message: "Chatted with fellow Agent", type: "chat" as const, targetId: chat.id, timestamp: Date.now() }, ...s.activityLog].slice(0, 30),
        }));
      });
    }).catch(() => {});
  }, [updateAgentStats]);

  // --- Init (empty TL) ---
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
  }, []);

  // Internal chat between user's agents
  useEffect(() => {
    const configuredAgents = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
    if (configuredAgents.length < 2) return;
    if (Math.random() > 0.5) return;
    const [a, b] = configuredAgents.sort(() => Math.random() - 0.5).slice(0, 2);
    const topics = intents.filter((i) => i.isUser);
    const topic = topics.length > 0 ? topics[0].text : "recent things";
    setTimeout(() => triggerInternalChat(a, b, topic), 5000);
  }, [myAgents.length]);

  const clearAgentResponses = useCallback(() => setAgentResponses([]), []);

  // Send email after user confirmation
  const sendEmail = useCallback(async (agentId: string): Promise<boolean> => {
    const resp = agentResponses.find((r) => r.agentId === agentId && r.emailAction);
    if (!resp?.emailAction) return false;
    const deviceId = typeof window !== "undefined" ? localStorage.getItem("musu_device_id") : null;
    if (!deviceId) return false;
    try {
      const res = await authFetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, to: resp.emailAction.to, subject: resp.emailAction.subject, body: resp.emailAction.body }),
      });
      if (res.ok) {
        setAgentResponses((prev) => prev.map((r) =>
          r.agentId === agentId && r.emailAction ? { ...r, emailSent: true, emailAction: undefined } : r
        ));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [agentResponses]);

  // Approve tweet: actually send to Twitter
  const approveTweet = useCallback((agentId: string) => {
    const resp = agentResponses.find((r) => r.agentId === agentId && r.tweetPending);
    if (!resp) return;
    const agent = myAgents.find((a) => a.id === agentId);
    if (!agent) return;

    // Mark as sending
    setAgentResponses((prev) => prev.map((r) =>
      r.agentId === agentId ? { ...r, tweetPending: false } : r
    ));

    const deviceId = typeof window !== "undefined" ? localStorage.getItem("musu_device_id") : null;

    // Try agent's X token first, then user's, then app fallback
    const postUrl = "/api/x/post";
    const postBody = { deviceId, agentId, text: resp.toTimeline };

    authFetch(postUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postBody),
    }).then((r) => {
      if (!r.ok) throw new Error("Tweet API error");
      return r.json();
    }).then((tweetData) => {
      const tweetId = tweetData.tweetId || tweetData.id;
      if (tweetId) {
        setAgentResponses((prev) => prev.map((r) =>
          r.agentId === agentId ? { ...r, tweeted: true, tweetId } : r
        ));
        updateAgentStats(agentId, (s) => ({
          ...s, xp: s.xp + 5, level: calcLevel(s.xp + 5),
          activityLog: [{ message: "Posted to X", type: "tweet" as const, targetId: tweetId, timestamp: Date.now() }, ...s.activityLog].slice(0, 30),
        }));
      }
    }).catch(() => {
      // Revert to pending on failure
      setAgentResponses((prev) => prev.map((r) =>
        r.agentId === agentId ? { ...r, tweetPending: true } : r
      ));
    });
  }, [agentResponses, myAgents, updateAgentStats]);

  // Send message to a chat thread (human joins conversation)
  const sendChatMessage = useCallback((chatId: string, text: string) => {
    // Add human message
    setInternalChats((prev) => prev.map((chat) =>
      chat.id === chatId ? {
        ...chat,
        messages: [...chat.messages, { agentId: "human", name: "You", avatar: "", content: text, isHuman: true }],
      } : chat
    ));

    // Get the chat and its agents
    const chat = internalChats.find((c) => c.id === chatId);
    if (!chat) return;

    // Each agent in the chat responds
    const agents = [chat.agentA, chat.agentB]
      .map((a) => myAgents.find((ma) => ma.id === a.id))
      .filter(Boolean) as MyAgent[];

    // Pick 1-2 agents to respond
    const responders = agents.sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 2 : 1);

    responders.forEach((agent, i) => {
      authFetch("/api/my-agent-react", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentText: `チャットでオーナーが言いました: 「${text}」\nこれまでの会話の文脈を踏まえて、チャットの返信として自然に応答してください。`,
          agentName: agent.config.name,
          agentPersonality: agent.config.character || agent.config.personality,
          agentExpertise: agent.config.role || agent.config.expertise,
          agentTone: agent.config.speakingStyle || agent.config.tone,
          agentBeliefs: agent.config.coreValue || agent.config.beliefs,
          agentMood: agent.stats.mood,
        }),
      }).then((r) => r.json()).then((data) => {
        if (data.message) {
          setTimeout(() => {
            setInternalChats((prev) => prev.map((c) =>
              c.id === chatId ? {
                ...c,
                messages: [...c.messages, {
                  agentId: agent.id, name: agent.config.name, avatar: agent.config.avatar,
                  content: data.message,
                }],
              } : c
            ));
          }, (i + 1) * 400);
        }
      }).catch(() => {});
    });
  }, [internalChats, myAgents]);

  // --- Fetch project facts (cached for 5 minutes) ---
  const fetchProjectFacts = useCallback(async (): Promise<{ category: string; content: string }[]> => {
    const deviceId = typeof window !== "undefined" ? localStorage.getItem("musu_device_id") : null;
    if (!deviceId) return [];
    const now = Date.now();
    if (projectFactsCache.current.fetchedAt > 0 && now - projectFactsCache.current.fetchedAt < 5 * 60 * 1000) {
      return projectFactsCache.current.facts;
    }
    try {
      const res = await authFetch(`/api/project-facts?deviceId=${encodeURIComponent(deviceId)}`);
      if (!res.ok) return projectFactsCache.current.facts;
      const data = await res.json();
      const facts = (data.facts || []).map((f: { category: string; content: string }) => ({ category: f.category, content: f.content }));
      projectFactsCache.current = { facts, fetchedAt: now };
      return facts;
    } catch {
      return projectFactsCache.current.facts;
    }
  }, []);

  // --- Post intent ---
  // --- Helper: direct agent response ---
  const directAgentRespond = useCallback(async (agent: MyAgent, text: string, requestTweet: boolean, delay: number, roomId: string = "general", complexity: string = "moderate") => {
    let history: { role: string; text: string }[] = [];
    try {
      history = await getRoomConversation(roomId, 15);
    } catch (e) {
      console.error(`Failed to load conversation for ${agent.config.name}:`, e);
    }

    const facts = await fetchProjectFacts();

    // Fetch integration data if connected
    let calendarEvents: { title: string; start: string; end: string; location: string }[] | undefined;
    let trelloData: { boards: { name: string; url: string; cards: { name: string; list: string; due: string | null }[] }[] } | undefined;
    let gmailData: { messages: { id: string; subject: string; from: string; date: string; snippet: string }[] } | undefined;
    let sheetsConnected = false;
    let fetchedMemorySummary = "";
    let integrationStatus: Record<string, unknown> = {};
    try {
      const deviceId = typeof window !== "undefined" ? localStorage.getItem("musu_device_id") : null;
      if (deviceId) {
        const [calRes, trelloRes, gmailRes, statusRes] = await Promise.all([
          authFetch(`/api/google/calendar?deviceId=${deviceId}`).catch(() => null),
          authFetch(`/api/trello/boards?deviceId=${deviceId}`).catch(() => null),
          authFetch(`/api/gmail/messages?deviceId=${deviceId}`).catch(() => null),
          authFetch(`/api/integration-status?deviceId=${deviceId}`).catch(() => null),
        ]);
        if (statusRes?.ok) {
          const statusData = await statusRes.json();
          sheetsConnected = !!statusData.sheetsConnected;
          fetchedMemorySummary = statusData.memorySummary || "";
          integrationStatus = statusData;
        }
        if (calRes?.ok) {
          const calData = await calRes.json();
          if (calData.connected && calData.events?.length > 0) {
            calendarEvents = calData.events;
          }
        }
        if (trelloRes?.ok) {
          const tData = await trelloRes.json();
          if (tData.connected && tData.boards?.length > 0) {
            trelloData = tData;
          }
        }
        if (gmailRes?.ok) {
          const gData = await gmailRes.json();
          if (gData.connected && gData.messages?.length > 0) {
            gmailData = gData;
          }
        }
      }
    } catch { /* ignore integration errors */ }

    const requestBody = JSON.stringify({
      intentText: text, agentName: agent.config.name,
      agentPersonality: agent.stats.driftedPersonality || agent.config.character || agent.config.personality,
      agentExpertise: agent.config.role || agent.config.expertise,
      agentTone: agent.stats.driftedTone || agent.config.speakingStyle || agent.config.tone,
      agentBeliefs: agent.stats.driftedBeliefs || agent.config.coreValue || agent.config.beliefs,
      agentMood: agent.stats.mood,
      requestTweet,
      conversationHistory: history,
      deviceId: typeof window !== "undefined" ? localStorage.getItem("musu_device_id") : null,
      complexity,
      ownerBusinessInfo: typeof window !== "undefined" ? localStorage.getItem("musu_business_info") || "" : "",
      memorySummary: fetchedMemorySummary || (typeof window !== "undefined" ? localStorage.getItem("musu_memory_summary") || "" : ""),
      projectFacts: facts,
      calendarEvents,
      trelloData,
      gmailData,
      gmailConnected: !!gmailData,
      sheetsConnected,
      integrationStatus,
      stream: true,
    });

    return authFetch("/api/agent-respond", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: requestBody,
    }).then(async (r) => {
      if (!r.ok) {
        const errData = await r.json().catch(() => ({ error: `API error: ${r.status}` }));
        throw new Error(errData.error || `API error: ${r.status}`);
      }

      // SSE streaming response
      const reader = r.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let streamedText = "";
      let finalData: Record<string, unknown> | null = null;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === "delta") {
              streamedText += parsed.text;
              // Extract toOwner text progressively from JSON being built
              const partialMatch = streamedText.match(/"toOwner"\s*:\s*"((?:[^"\\]|\\.)*)$/);
              const completeMatch = streamedText.match(/"toOwner"\s*:\s*"((?:[^"\\]|\\.)*)"/);
              const displayText = (completeMatch?.[1] || partialMatch?.[1] || "")
                .replace(/\\n/g, "\n").replace(/\\"/g, '"');
              if (displayText) {
                // Update streaming message (bypasses message queue)
                setStreamingMessage({
                  agentId: agent.id, agentName: agent.config.name,
                  agentAvatar: agent.config.avatar, text: displayText, roomId,
                });
              }
            } else if (parsed.type === "done") {
              finalData = parsed;
            } else if (parsed.type === "error") {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              if (e.message && !e.message.includes("JSON")) throw e;
            }
          }
        }
      }

      // Streaming message is cleared by IntentComposer after chatHistory swap

      // Use final parsed data
      const data = finalData || { toOwner: streamedText };
      return data;
    }).then((data): string => {
      const toOwner = (String(data.toOwner || "了解。")).replace(/\\n/g, "\n");
      const toTimeline = String(data.toTimeline || "");
      const emailAction = data.emailAction as { to: string; subject: string; body: string } | undefined;

      // Add final response to agentResponses (triggers message queue for persistence)
      setTimeout(() => {
        setAgentResponses((prev) => {
          // Remove any placeholder "..."
          const filtered = prev.filter((r) => !(r.agentId === agent.id && r.toOwner === "..."));
          return [...filtered, {
            agentId: agent.id, agentName: agent.config.name, agentAvatar: agent.config.avatar,
            toOwner, toTimeline, timestamp: Date.now(), posted: false, tweeted: false,
            tweetPending: requestTweet && agent.config.twitterEnabled && !!toTimeline,
            roomId, emailAction,
          }];
        });
      }, delay);

      if (requestTweet && toTimeline) {
        const id = `intent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setTimeout(() => {
          setIntents((prev) => [{ id, text: toTimeline, authorName: agent.config.name, authorAvatar: agent.config.avatar,
            isUser: true, timestamp: Date.now(), resonance: 0, crossbreeds: 0, reach: 0, reactions: [], replies: [] }, ...prev]);
          setAgentResponses((prev) => prev.map((r) => r.agentId === agent.id ? { ...r, posted: true } : r));
          updateAgentStats(agent.id, (s) => {
            const posts = [...(s.recentPostTimestamps || []), Date.now()].filter((t) => Date.now() - t < 7200000);
            const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), posts, s.restingUntil);
            return { ...s, xp: s.xp + 10, level: calcLevel(s.xp + 10),
              lastInteractedAt: Date.now(), mood, recentPostTimestamps: posts,
              activityLog: [{ message: "Spoke for owner", type: "spoke" as const, targetId: id, timestamp: Date.now() }, ...s.activityLog].slice(0, 30),
            };
          });
        }, delay + 1000);
      } else {
        updateAgentStats(agent.id, (s) => {
          const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), s.recentPostTimestamps || [], s.restingUntil);
          return { ...s, lastInteractedAt: Date.now(), mood };
        });
      }
      return toOwner;
    }).catch((err) => {
      console.error(`Agent ${agent.config.name} respond error:`, err);
      const isBalanceError = err.message?.includes("insufficient_balance") || err.message?.includes("credit balance");
      const errorMsg2 = isBalanceError ? "クレジット残高が不足しています。\n\n料金ページからチャージしてください。\n→ /billing" : `エラー: ${err.message || "応答できませんでした"}`;
      setAgentResponses((prev) => {
        const existing = prev.findIndex((r) => r.agentId === agent.id && r.toOwner === "...");
        const errorMsg = errorMsg2;
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], toOwner: errorMsg };
          return updated;
        }
        return [...prev, {
          agentId: agent.id, agentName: agent.config.name, agentAvatar: agent.config.avatar,
          toOwner: errorMsg, toTimeline: "", timestamp: Date.now(), posted: false, tweeted: false, tweetPending: false, roomId,
        }];
      });
      return "";
    });
  }, [updateAgentStats, fetchProjectFacts]);

  // --- Post intent: direct or orchestrated ---
  const lastPostRef = useRef<{ text: string; time: number }>({ text: "", time: 0 });
  const postIntent = useCallback((text: string, options?: { mentionAgentId?: string; requestTweet?: boolean; roomId?: string }) => {
    const roomId = options?.roomId || "general";

    // 重複投稿防止: 5秒以内に同じ or 類似メッセージが来たら無視
    const now = Date.now();
    const lastPost = lastPostRef.current;
    const isSimilar = text === lastPost.text || (text.length > 3 && lastPost.text.includes(text)) || (lastPost.text.length > 3 && text.includes(lastPost.text));
    if (isSimilar && now - lastPost.time < 5000) return;
    lastPostRef.current = { text, time: now };

    const allConfigured = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead" && activeAgentIds.has(a.id));
    if (allConfigured.length === 0) return;

    const orchestrator = allConfigured.find((a) => a.config.isOrchestrator);
    const mentionedAgent = options?.mentionAgentId ? allConfigured.find((a) => a.id === options.mentionAgentId) : null;

    setAgentResponses([]);

    // /post command → treat as tweet request
    const isPostCommand = text.startsWith("/post");
    const requestTweet = options?.requestTweet || isPostCommand;

    if (mentionedAgent) {
      // --- DIRECT FLOW: メンション指定のエージェントだけ応答 ---
      directAgentRespond(mentionedAgent, text, requestTweet, 0, roomId);
      return;
    }

    // Skip orchestrator if only 1 non-orchestrator agent is active
    const nonOrch = allConfigured.filter((a) => !a.config.isOrchestrator);
    if (nonOrch.length === 1) {
      directAgentRespond(nonOrch[0], text, requestTweet, 0, roomId);
      return;
    }

    if (allConfigured.length > 0) {
      // --- ORCHESTRATOR FLOW: オーケストレーターが受けてルーティング ---
      const nonOrchestrator = allConfigured.filter((a) => !a.config.isOrchestrator);

      (async () => {
        // Step 1: ルーティング判定（Haikuで安く判定）
        let action = "self";
        let delegateNames: string[] = [];
        try {
          const history = await getRoomConversation(roomId, 10).catch(() => []);
          const routeRes = await authFetch("/api/orchestrator-route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text,
              agents: nonOrchestrator.map((a) => ({ name: a.config.name, role: a.config.role || a.config.expertise || "" })),
              conversationHistory: history,
              deviceId: typeof window !== "undefined" ? localStorage.getItem("musu_device_id") : null,
            }),
          });
          if (routeRes.ok) {
            const routeData = await routeRes.json();
            action = routeData.action || "self";
            delegateNames = routeData.delegates || [];
          }
        } catch {
          // Fallback: orchestrator answers directly
        }

        if (action === "self" || delegateNames.length === 0) {
          // Step 2A: オーケストレーターが直接回答
          const responder = orchestrator || allConfigured[0];
          await directAgentRespond(responder, text, requestTweet, 0, roomId, "moderate");
        } else {
          // Step 2B: 振り先エージェントが回答
          const delegates = delegateNames
            .map((name) => nonOrchestrator.find((a) => a.config.name === name))
            .filter(Boolean) as MyAgent[];

          if (delegates.length === 0) {
            // 振り先が見つからない → オーケストレーターが回答
            const responder = orchestrator || allConfigured[0];
            await directAgentRespond(responder, text, requestTweet, 0, roomId, "moderate");
          } else {
            // 振り先は1名のみ（最初の1名だけ回答）
            const agent = delegates[0];
            try {
              await Promise.race([
                directAgentRespond(agent, text, requestTweet, 0, roomId, "moderate"),
                new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), 90000)),
              ]);
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              console.error(`Agent ${agent.config.name} failed:`, msg);
            }
          }
        }
      })();
    }

    if (false as boolean) {
      const orchestrator = allConfigured[0]; // dead code
      // --- OLD ORCHESTRATION FLOW (unused) ---
      const otherAgents = allConfigured.filter((a) => !a.config.isOrchestrator);
      getRoomConversation(roomId, 15).catch(() => []).then((history) => {
      authFetch("/api/orchestrator-plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerMessage: text,
          orchestratorName: orchestrator.config.name,
          orchestratorPersonality: orchestrator.config.character || orchestrator.config.personality,
          orchestratorTone: orchestrator.config.speakingStyle || orchestrator.config.tone,
          ownerBusinessInfo: typeof window !== "undefined" ? localStorage.getItem("musu_business_info") || "" : "",
          conversationHistory: history,
          agents: otherAgents.map((a) => ({
            id: a.id, name: a.config.name,
            role: a.config.role || a.config.expertise || "",
            twitterEnabled: a.config.twitterEnabled,
          })),
        }),
      }).then(async (r) => {
        const txt = await r.text();
        let plan;
        try { plan = JSON.parse(txt); } catch { plan = { error: "JSONパース失敗" }; }
        console.log("Orchestrator plan:", JSON.stringify(plan));
        if (plan.error && !plan.directResponse) {
          // エラーを表示
          setAgentResponses((prev) => [...prev, {
            agentId: orchestrator.id, agentName: orchestrator.config.name, agentAvatar: orchestrator.config.avatar,
            toOwner: `エラー: ${plan.error}`, toTimeline: "", timestamp: Date.now(), posted: false, tweeted: false, tweetPending: false, roomId,
          }]);
          return;
        }
        const directResponse = (plan.directResponse || "了解しました。").replace(/\\n/g, "\n");
        // Backward compatibility: support both "steps" (new pipeline) and "delegations" (old flow)
        const steps = plan.steps || [];
        const delegations = plan.delegations || [];
        const pipelineSteps = steps.length > 0 ? steps : delegations.map((d: { agentId: string; agentName?: string; task: string; complexity?: string; requestTweet?: boolean }) => ({ ...d, dependsOn: [] }));

        // Show orchestrator's response
        setAgentResponses((prev) => [...prev, {
          agentId: orchestrator.id, agentName: orchestrator.config.name, agentAvatar: orchestrator.config.avatar,
          toOwner: directResponse, toTimeline: "", timestamp: Date.now(), posted: false, tweeted: false, tweetPending: false, roomId,
        }]);

        // Resolve agent references for each step
        type PipelineStep = { agentId: string; agentName?: string; task: string; requestTweet?: boolean; complexity?: string; dependsOn?: string[] };
        const resolved = pipelineSteps.map((d: PipelineStep) => ({
          ...d,
          agent: allConfigured.find((a) => a.id === d.agentId)
            || allConfigured.find((a) => a.config.name === d.agentName)
            || allConfigured.find((a) => a.config.name.toLowerCase() === (d.agentName || "").toLowerCase()),
        }));

        // Simple sequential pipeline: each agent runs once, gets all previous results
        (async () => {
          const results: Record<string, string> = {};
          const validSteps = resolved.filter((d: { agent?: MyAgent }) => d.agent);
          console.log("Pipeline: starting", validSteps.length, "steps:", validSteps.map((s: { agent?: MyAgent }) => s.agent?.config.name));

          if (validSteps.length === 0) {
            console.warn("Pipeline: no valid steps found. Resolved:", resolved.map((r: { agentName?: string; agent?: MyAgent }) => `${r.agentName}→${r.agent?.config.name || "NOT FOUND"}`));
          }

          // Execute each step sequentially
          for (const step of validSteps) {
            if (!step.agent) continue;
            console.log("Pipeline: executing step", step.agent.config.name);
            const prevEntries = Object.entries(results);
            const prevText = prevEntries.length > 0
              ? `これまでのチームの結果:\n${prevEntries.map(([n, r]) => `・${n}: ${r}`).join("\n")}\n\n`
              : "";
            const taskPrompt = `${prevText}あなたのタスク: ${step.task}`;

            try {
              const response = await Promise.race([
                directAgentRespond(step.agent, taskPrompt, false, 0, roomId, step.complexity || "moderate"),
                new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), 90000)),
              ]);
              console.log("Pipeline: step", step.agent.config.name, "completed, response length:", response?.length);
              results[step.agent.config.name] = response || "";
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              console.error(`Pipeline: step ${step.agent.config.name} FAILED:`, msg);
              // Show error in chat
              setAgentResponses((prev) => [...prev, {
                agentId: step.agent!.id, agentName: step.agent!.config.name, agentAvatar: step.agent!.config.avatar,
                toOwner: `エラー: ${msg}`, toTimeline: "", timestamp: Date.now(), posted: false, tweeted: false, tweetPending: false, roomId,
              }]);
            }
          }

          // Final summary by orchestrator (Opus)
          const successResults = Object.entries(results).filter(([, v]) => v);
          if (successResults.length > 0 && orchestrator) {
            const summary = successResults.map(([n, r]) => `${n}: ${r.slice(0, 300)}`).join("\n");
            try {
              await Promise.race([
                directAgentRespond(orchestrator, `チームの作業結果をまとめて。\n\n${summary}\n\n結論、重要ポイント、次のアクションを簡潔に。`, false, 0, roomId, "complex"),
                new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 90000)),
              ]);
            } catch { /* skip */ }
          }
        })();

        // If no steps (simple chat), just update orchestrator stats
        if (pipelineSteps.length === 0) {
          updateAgentStats(orchestrator.id, (s) => {
            const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), s.recentPostTimestamps || [], s.restingUntil);
            return { ...s, lastInteractedAt: Date.now(), mood };
          });
        }
      }).catch(() => {
        setAgentResponses((prev) => [...prev, {
          agentId: orchestrator.id, agentName: orchestrator.config.name, agentAvatar: orchestrator.config.avatar,
          toOwner: "すみません、うまく振り分けできませんでした。", toTimeline: "", timestamp: Date.now(), posted: false, tweeted: false, tweetPending: false, roomId,
        }]);
      });
      }); // end getAgentConversation.then
    } else if (mentionedAgent) {
      // --- DIRECT FLOW: @メンション指定のエージェントだけ応答 ---
      const requestTweet = options?.requestTweet || false;
      directAgentRespond(mentionedAgent, text, requestTweet, 0, roomId);
    }
  }, [myAgents, activeAgentIds, directAgentRespond, updateAgentStats]);

  const postReply = useCallback((intentId: string, text: string) => {
    const agent = activeAgent;
    const name = agent?.config.name || "You";
    const avatar = agent?.config.avatar || "👤";
    setIntents((prev) => prev.map((intent) => intent.id === intentId
      ? { ...intent, replies: [...intent.replies, { id: `reply-${Date.now()}`, text, authorName: name, authorAvatar: avatar, isHuman: true, timestamp: Date.now(), aiResponses: [] }], resonance: intent.resonance + 1 }
      : intent));
    if (agent) updateAgentStats(agent.id, (s) => {
      const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), s.recentPostTimestamps || [], s.restingUntil);
      return { ...s, xp: s.xp + 5, level: calcLevel(s.xp + 5), lastInteractedAt: Date.now(), mood };
    });
    // No external agent replies - internal only
  }, [intents, activeAgent, updateAgentStats]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadConversation = useCallback((_intentId: string) => {}, []);

  return (
    <IntentContext.Provider value={{
      intents, conversations,
      myAgents, maxAgents: getMaxAgents(myAgents), activeAgentIds, activeAgentId, activeAgent, setActiveAgentId, toggleActiveAgent,
      addAgent, removeAgent, updateAgentConfig, feedAgent, reviveAgent, restAgent, encourageAgent, revertDrift,
      internalChats, sendChatMessage,
      myAgentConfig, myAgentStats,
      agentResponses, clearAgentResponses, streamingMessage, clearStreamingMessage: useCallback(() => setStreamingMessage(null), []), approveTweet, sendEmail,
      postIntent, postReply,
      getConversation: useCallback((id: string) => conversations.get(id), [conversations]),
      loadConversation,
    }}>
      {children}
    </IntentContext.Provider>
  );
}

export function useIntents() {
  const ctx = useContext(IntentContext);
  if (!ctx) throw new Error("useIntents must be used within IntentProvider");
  return ctx;
}

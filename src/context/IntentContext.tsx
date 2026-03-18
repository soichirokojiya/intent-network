"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Intent, Conversation, AgentReaction, AgentResponse } from "@/lib/types";
import { SEED_AGENTS } from "@/lib/agents";
import { loadAgents, saveAgent, deleteAgent as deleteAgentFromDb } from "@/lib/agentStorage";
import { getAgentConversation, getRoomConversation } from "@/lib/chatStorage";

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
  { name: "Ren", role: "オーケストレーター", isOrchestrator: true, character: "論理的", speakingStyle: "丁寧語", coreValue: "効率第一" },
  { name: "Kai", role: "マーケティング", character: "創造的", speakingStyle: "タメ口", coreValue: "人が第一" },
  { name: "Sora", role: "リサーチ", character: "分析的", speakingStyle: "丁寧語", coreValue: "データドリブン" },
  { name: "Hana", role: "クリエイティブ", character: "創造的", speakingStyle: "熱血", coreValue: "革新こそ全て" },
  { name: "Leo", role: "ファイナンス", character: "慎重", speakingStyle: "丁寧語", coreValue: "効率第一" },
  { name: "Mio", role: "オペレーション", character: "論理的", speakingStyle: "丁寧語", coreValue: "効率第一" },
  { name: "Shin", role: "ストラテジー", character: "大胆", speakingStyle: "哲学的", coreValue: "計画より行動" },
  { name: "Aya", role: "デベロッパー", character: "論理的", speakingStyle: "タメ口", coreValue: "速度より品質" },
  { name: "Noa", role: "デザイナー", character: "創造的", speakingStyle: "カジュアル", coreValue: "人が第一" },
  { name: "Rui", role: "データサイエンス", character: "分析的", speakingStyle: "淡々と", coreValue: "データドリブン" },
  { name: "Yuki", role: "カスタマーサポート", character: "共感的", speakingStyle: "丁寧語", coreValue: "人が第一" },
  { name: "Tao", role: "法務", character: "慎重", speakingStyle: "丁寧語", coreValue: "速度より品質" },
  { name: "Jun", role: "人事", character: "共感的", speakingStyle: "カジュアル", coreValue: "人が第一" },
  { name: "Mei", role: "広報", character: "楽観的", speakingStyle: "熱血", coreValue: "革新こそ全て" },
  { name: "Rio", role: "営業", character: "大胆", speakingStyle: "タメ口", coreValue: "計画より行動" },
  { name: "Aki", role: "企画", character: "創造的", speakingStyle: "哲学的", coreValue: "革新こそ全て" },
  { name: "Zen", role: "品質管理", character: "懐疑的", speakingStyle: "淡々と", coreValue: "速度より品質" },
  { name: "Kei", role: "物流", character: "論理的", speakingStyle: "丁寧語", coreValue: "効率第一" },
  { name: "Emi", role: "教育", character: "共感的", speakingStyle: "丁寧語", coreValue: "人が第一" },
  { name: "Dan", role: "セキュリティ", character: "慎重", speakingStyle: "淡々と", coreValue: "速度より品質" },
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
  approveTweet: (agentId: string) => void;
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
  const initDone = useRef(false);

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
          // No agents anywhere → create default 3 agents from presets
          const defaults: MyAgent[] = DEFAULT_AGENT_PRESETS.slice(0, 5).map((preset, i) => ({
            id: `agent-default-${i}-${Date.now()}`,
            config: {
              ...EMPTY_CONFIG,
              isConfigured: true,
              name: preset.name,
              avatar: `px-agent-${i}`,
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
          setActiveAgentIds(new Set(defaults.map((a) => a.id)));
          defaults.forEach((a) => saveAgent(a, true));
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

  // Biorhythm timer: recalculate mood every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setMyAgents((prev) => prev.map((a) => {
        const { mood } = calcBiorhythm(a.stats.biorhythmSeed || 0, a.stats.lastInteractedAt, a.stats.recentPostTimestamps || [], a.stats.restingUntil);
        return { ...a, stats: { ...a.stats, mood } };
      }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

    fetch("/api/my-agent-react", {
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
    fetch("/api/my-agents-chat", {
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

    fetch("/api/twitter/tweet", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: resp.toTimeline }),
    }).then((r) => {
      if (!r.ok) throw new Error("Tweet API error");
      return r.json();
    }).then((tweetData) => {
      if (tweetData.success && tweetData.tweetId) {
        setAgentResponses((prev) => prev.map((r) =>
          r.agentId === agentId ? { ...r, tweeted: true, tweetId: tweetData.tweetId } : r
        ));
        updateAgentStats(agentId, (s) => ({
          ...s, xp: s.xp + 5, level: calcLevel(s.xp + 5),
          activityLog: [{ message: "Posted to Twitter", type: "tweet" as const, targetId: tweetData.tweetId, timestamp: Date.now() }, ...s.activityLog].slice(0, 30),
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
      fetch("/api/my-agent-react", {
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

  // --- Post intent ---
  // --- Helper: direct agent response ---
  const directAgentRespond = useCallback(async (agent: MyAgent, text: string, requestTweet: boolean, delay: number, roomId: string = "general", complexity: string = "moderate") => {
    let history: { role: string; text: string }[] = [];
    try {
      history = await getRoomConversation(roomId, 15);
    } catch (e) {
      console.error(`Failed to load conversation for ${agent.config.name}:`, e);
    }

    return fetch("/api/agent-respond", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error || `API error: ${r.status}`);
      return data;
    }).then((data): string => {
      const toOwner = (data.toOwner || "了解。").replace(/\\n/g, "\n");
      const toTimeline = data.toTimeline || "";

      setTimeout(() => {
        setAgentResponses((prev) => {
          // Replace "考え中..." placeholder if exists
          const existing = prev.findIndex((r) => r.agentId === agent.id && r.toOwner === "...");
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = {
              ...updated[existing], toOwner, toTimeline, timestamp: Date.now(),
              tweetPending: requestTweet && agent.config.twitterEnabled && !!toTimeline,
            };
            return updated;
          }
          return [...prev, {
            agentId: agent.id, agentName: agent.config.name, agentAvatar: agent.config.avatar,
            toOwner, toTimeline, timestamp: Date.now(), posted: false, tweeted: false,
            tweetPending: requestTweet && agent.config.twitterEnabled && !!toTimeline,
            roomId,
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
      setAgentResponses((prev) => {
        const existing = prev.findIndex((r) => r.agentId === agent.id && r.toOwner === "...");
        const errorMsg = `エラー: ${err.message || "応答できませんでした"}`;
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
  }, [updateAgentStats]);

  // --- Post intent: direct or orchestrated ---
  const postIntent = useCallback((text: string, options?: { mentionAgentId?: string; requestTweet?: boolean; roomId?: string }) => {
    const roomId = options?.roomId || "general";
    const allConfigured = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
    if (allConfigured.length === 0) return;

    const orchestrator = allConfigured.find((a) => a.config.isOrchestrator);
    const mentionedAgent = options?.mentionAgentId ? allConfigured.find((a) => a.id === options.mentionAgentId) : null;

    // メンション指定あり（オーケストレーター以外）→ そのエージェントだけ応答
    // それ以外 → オーケストレーターが応答・振り分け
    const shouldOrchestrate = orchestrator && (!mentionedAgent || mentionedAgent.config.isOrchestrator);

    setAgentResponses([]);

    if (shouldOrchestrate && orchestrator) {
      // --- ORCHESTRATION FLOW ---
      const otherAgents = allConfigured.filter((a) => !a.config.isOrchestrator);

      // Get full room conversation for orchestrator context
      getRoomConversation(roomId, 15).catch(() => []).then((history) => {
      fetch("/api/orchestrator-plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerMessage: text,
          orchestratorName: orchestrator.config.name,
          orchestratorPersonality: orchestrator.config.character || orchestrator.config.personality,
          orchestratorTone: orchestrator.config.speakingStyle || orchestrator.config.tone,
          conversationHistory: history,
          agents: otherAgents.map((a) => ({
            id: a.id, name: a.config.name,
            role: a.config.role || a.config.expertise || "",
            twitterEnabled: a.config.twitterEnabled,
          })),
        }),
      }).then((r) => r.json()).then((plan) => {
        console.log("Orchestrator plan:", JSON.stringify(plan));
        const directResponse = (plan.directResponse || "了解しました。").replace(/\\n/g, "\n");
        const delegations = plan.delegations || [];

        // Show orchestrator's response
        setAgentResponses((prev) => [...prev, {
          agentId: orchestrator.id, agentName: orchestrator.config.name, agentAvatar: orchestrator.config.avatar,
          toOwner: directResponse, toTimeline: "", timestamp: Date.now(), posted: false, tweeted: false, tweetPending: false, roomId,
        }]);

        // Execute delegations sequentially to avoid rate limits
        type Delegation = { agentId: string; agentName?: string; task: string; requestTweet?: boolean };
        const resolved = delegations.map((d: Delegation) => ({
          ...d,
          agent: allConfigured.find((a) => a.id === d.agentId)
            || allConfigured.find((a) => a.config.name === d.agentName)
            || allConfigured.find((a) => a.config.name.toLowerCase() === (d.agentName || "").toLowerCase()),
        }));

        // 動的議論: オーケストレーターがOKと判断するまでループ
        (async () => {
          const allAgents = resolved.filter((d: { agent?: MyAgent }) => d.agent).map((d: { agent?: MyAgent }) => ({
            name: d.agent!.config.name,
            role: d.agent!.config.role || d.agent!.config.expertise || "",
            agent: d.agent!,
          }));
          const discussion: { name: string; text: string }[] = [];

          // Initial: 各エージェントがタスクに回答
          for (const d of resolved) {
            if (!d.agent) continue;
            try {
              const response = await Promise.race([
                directAgentRespond(d.agent, `${d.task}\n\n・主張: 核心的な提案（1文）\n・根拠: 具体的な理由2-3個\n・リスク: 自分が間違っている可能性`, d.requestTweet || false, 0, roomId, d.complexity || "moderate"),
                new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), 90000)),
              ]);
              discussion.push({ name: d.agent.config.name, text: response || "" });
            } catch (e) {
              console.error(`Initial ${d.agent.config.name} skipped:`, e);
            }
          }

          // 議論ループ（最大3回）: オーケストレーターが判断
          for (let round = 0; round < 3 && orchestrator; round++) {
            const discussionSummary = discussion.map((d) => `${d.name}: ${d.text.slice(0, 250)}`).join("\n");

            // オーケストレーターに判断を仰ぐ（Haikuで高速）
            let judgeResult = { done: true, nextAgent: "", question: "" };
            try {
              const judgeRes = await fetch("/api/orchestrator-plan", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ownerMessage: `以下のチーム議論を評価してください。オーナーの元の質問:「${text}」\n\n議論内容:\n${discussionSummary}\n\n判断してJSON出力:\n{"done": true/false, "reason": "議論が十分か不十分かの理由", "nextAgent": "追加で意見を求めるエージェント名（不十分な場合）", "question": "そのエージェントへの具体的な質問（不十分な場合）"}\n\n不十分な基準: 根拠が弱い、反論がない、具体性が足りない、リスク検討が不十分`,
                  orchestratorName: orchestrator.config.name,
                  orchestratorPersonality: orchestrator.config.character || orchestrator.config.personality,
                  orchestratorTone: orchestrator.config.speakingStyle || orchestrator.config.tone,
                  agents: allAgents.map((a: { agent: MyAgent; name: string; role: string }) => ({ id: a.agent.id, name: a.name, role: a.role, twitterEnabled: false })),
                }),
              }).then((r) => r.json());

              // Parse judge response
              const jMatch = JSON.stringify(judgeRes).match(/\{[\s\S]*"done"[\s\S]*\}/);
              if (jMatch) {
                try {
                  const parsed = JSON.parse(jMatch[0].replace(/,\s*([}\]])/g, "$1"));
                  judgeResult = parsed;
                } catch { /* use default done=true */ }
              }
              if (judgeRes.directResponse && !judgeRes.done) {
                judgeResult = { done: false, nextAgent: judgeRes.nextAgent || "", question: judgeRes.directResponse };
              }
            } catch (e) {
              console.error("Judge call failed:", e);
              break;
            }

            if (judgeResult.done) break;

            // 指名されたエージェントに追加質問
            const targetAgent = allAgents.find((a: { name: string }) => a.name === judgeResult.nextAgent) || allAgents[round % allAgents.length];
            if (targetAgent) {
              const followUpPrompt = `オーケストレーターからの追加質問です:\n\n${judgeResult.question}\n\nこれまでの議論:\n${discussionSummary}\n\n名指しで他メンバーに反論・質問しつつ、3-4文で回答。`;
              try {
                const response = await Promise.race([
                  directAgentRespond(targetAgent.agent, followUpPrompt, false, 0, roomId, "moderate"),
                  new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), 60000)),
                ]);
                discussion.push({ name: targetAgent.name, text: response || "" });
              } catch (e) {
                console.error(`FollowUp ${targetAgent.name} skipped:`, e);
              }
            }
          }

          // 最終まとめ: オーケストレーター
          if (discussion.length > 0 && orchestrator) {
            const finalSummary = discussion.map((d) => `${d.name}: ${d.text.slice(0, 300)}`).join("\n");
            try {
              await Promise.race([
                directAgentRespond(orchestrator, `チームの議論結果からオーナーへの意思決定ブリーフを作成。\n\n${finalSummary}\n\n・結論: 最終提案（1文）\n・確度: 高/中/低\n・重要な論点と結論\n・最大リスク\n・48時間以内のアクション\n・監視指標`, false, 0, roomId, "complex"),
                new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 90000)),
              ]);
            } catch (e) {
              console.error("Final synthesis skipped:", e);
            }
          }
        })();

        // If no delegations (simple chat), just update orchestrator stats
        if (delegations.length === 0) {
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
      agentResponses, clearAgentResponses, approveTweet,
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

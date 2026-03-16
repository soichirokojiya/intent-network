"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Intent, Conversation, AgentReaction, Reply, AiReplyResponse } from "@/lib/types";
import { generateReactions, generateConversation, SEED_INTENTS } from "@/lib/simulation";
import { getRandomAgents, SEED_AGENTS } from "@/lib/agents";

// --- Types ---

export interface MyAgentConfig {
  name: string;
  avatar: string;
  tone: string;
  beliefs: string;
  expertise: string;
  personality: string;
  isConfigured: boolean;
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

export interface MyAgentStats {
  hp: number; hunger: number; mood: AgentMood; energy: number;
  lastFedAt: number; lastInteractedAt: number;
  birthDate: number; deathDate: number | null; reviveCount: number;
  level: number; xp: number; influence: number;
  totalReactions: number; resonanceReceived: number;
  crossbreeds: number; followers: number;
  activityLog: string[]; bestQuote: string; todayActions: number;
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
  messages: { agentId: string; name: string; avatar: string; content: string }[];
  timestamp: number;
}

// --- Constants ---

const MOOD_EMOJI: Record<AgentMood, string> = {
  thriving: "🌟", happy: "😊", normal: "😐", bored: "😑", sulking: "😤", sick: "🤒", dead: "💀",
};
const MOOD_MESSAGE: Record<AgentMood, string> = {
  thriving: "絶好調！どんどん発言したい！", happy: "いい感じ。", normal: "まぁまぁ。",
  bored: "暇だ...", sulking: "...放置しすぎ。", sick: "体調悪い...", dead: "...",
};
export { MOOD_EMOJI, MOOD_MESSAGE };

function calcMood(hp: number, hunger: number, energy: number): AgentMood {
  if (hp <= 0) return "dead";
  if (hp <= 20) return "sick";
  if (hunger >= 80) return "sulking";
  if (energy <= 20) return "bored";
  if (hp >= 80 && hunger <= 30 && energy >= 60) return "thriving";
  if (hp >= 60 && hunger <= 50) return "happy";
  return "normal";
}

function calcLevel(xp: number): number {
  let level = 1, threshold = 10, remaining = xp;
  while (remaining >= threshold) { remaining -= threshold; level++; threshold += 10 * level; }
  return level;
}

function defaultStats(): MyAgentStats {
  return {
    hp: 100, hunger: 0, mood: "normal", energy: 100,
    lastFedAt: Date.now(), lastInteractedAt: Date.now(),
    birthDate: Date.now(), deathDate: null, reviveCount: 0,
    level: 1, xp: 0, influence: 12, totalReactions: 0, resonanceReceived: 0,
    crossbreeds: 0, followers: 0, activityLog: [], bestQuote: "", todayActions: 0,
    friends: [], driftEvents: [], driftedTone: "", driftedBeliefs: "", driftedPersonality: "", driftLevel: 0,
  };
}

// --- Context ---

interface IntentContextType {
  intents: Intent[];
  conversations: Map<string, Conversation>;
  // Multi-agent
  myAgents: MyAgent[];
  activeAgentId: string | null;
  activeAgent: MyAgent | null;
  setActiveAgentId: (id: string) => void;
  addAgent: (config: Omit<MyAgentConfig, "isConfigured">) => string;
  removeAgent: (id: string) => void;
  updateAgentConfig: (agentId: string, config: Partial<MyAgentConfig>) => void;
  feedAgent: (agentId: string) => void;
  reviveAgent: (agentId: string) => void;
  revertDrift: (driftId: string) => void;
  internalChats: InternalChat[];
  // Backward compat shortcuts
  myAgentConfig: MyAgentConfig;
  myAgentStats: MyAgentStats;
  // Actions
  postIntent: (text: string) => void;
  postReply: (intentId: string, text: string) => void;
  getConversation: (intentId: string) => Conversation | undefined;
  loadConversation: (intentId: string) => void;
}

const IntentContext = createContext<IntentContextType | null>(null);

const EMPTY_CONFIG: MyAgentConfig = { name: "My Agent", avatar: "px-agent-0", tone: "", beliefs: "", expertise: "", personality: "", isConfigured: false };

export function IntentProvider({ children }: { children: React.ReactNode }) {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [myAgents, setMyAgents] = useState<MyAgent[]>([]);
  const [activeAgentId, setActiveAgentIdState] = useState<string | null>(null);
  const [internalChats, setInternalChats] = useState<InternalChat[]>([]);
  const initDone = useRef(false);

  const activeAgent = myAgents.find((a) => a.id === activeAgentId) || myAgents[0] || null;
  const myAgentConfig = activeAgent?.config || EMPTY_CONFIG;
  const myAgentStats = activeAgent?.stats || defaultStats();

  // --- localStorage ---
  useEffect(() => {
    // Migration from old single-agent format
    const oldConfig = localStorage.getItem("myAgentConfig");
    const oldStats = localStorage.getItem("myAgentStats");
    const savedAgents = localStorage.getItem("myAgents");

    if (savedAgents) {
      try {
        const agents: MyAgent[] = JSON.parse(savedAgents);
        // Apply decay to all agents
        const now = Date.now();
        agents.forEach((a) => {
          const hours = (now - (a.stats.lastInteractedAt || now)) / 3600000;
          a.stats.hunger = Math.min(100, (a.stats.hunger || 0) + Math.min(100, Math.floor(hours * 8)));
          a.stats.energy = Math.max(0, (a.stats.energy || 100) - Math.min(100, Math.floor(hours * 5)));
          if (a.stats.hunger >= 80) a.stats.hp = Math.max(0, (a.stats.hp || 100) - Math.floor(hours * 10));
          a.stats.mood = calcMood(a.stats.hp, a.stats.hunger, a.stats.energy);
          if (a.stats.hp <= 0 && !a.stats.deathDate) { a.stats.deathDate = now; a.stats.mood = "dead"; }
        });
        setMyAgents(agents);
      } catch {}
      const savedActive = localStorage.getItem("activeAgentId");
      if (savedActive) setActiveAgentIdState(savedActive);
    } else if (oldConfig) {
      try {
        const config = JSON.parse(oldConfig);
        const stats = oldStats ? { ...defaultStats(), ...JSON.parse(oldStats) } : defaultStats();
        if (config.isConfigured) {
          const migrated: MyAgent = { id: "my-agent", config, stats };
          setMyAgents([migrated]);
          setActiveAgentIdState("my-agent");
          localStorage.removeItem("myAgentConfig");
          localStorage.removeItem("myAgentStats");
        }
      } catch {}
    }

    const savedChats = localStorage.getItem("internalChats");
    if (savedChats) try { setInternalChats(JSON.parse(savedChats)); } catch {}
  }, []);

  // Save
  useEffect(() => {
    if (myAgents.length > 0) localStorage.setItem("myAgents", JSON.stringify(myAgents));
  }, [myAgents]);
  useEffect(() => {
    if (activeAgentId) localStorage.setItem("activeAgentId", activeAgentId);
  }, [activeAgentId]);
  useEffect(() => {
    if (internalChats.length > 0) localStorage.setItem("internalChats", JSON.stringify(internalChats));
  }, [internalChats]);

  // Decay timer for ALL agents
  useEffect(() => {
    const timer = setInterval(() => {
      setMyAgents((prev) => prev.map((a) => {
        if (a.stats.mood === "dead") return a;
        const hunger = Math.min(100, a.stats.hunger + 1);
        const energy = Math.max(0, a.stats.energy - 0.5);
        const hpLoss = hunger >= 80 ? 2 : hunger >= 60 ? 0.5 : 0;
        const hp = Math.max(0, a.stats.hp - hpLoss);
        const mood = calcMood(hp, hunger, energy);
        const deathDate = hp <= 0 && !a.stats.deathDate ? Date.now() : a.stats.deathDate;
        return { ...a, stats: { ...a.stats, hp, hunger, energy, mood, deathDate } };
      }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // --- Agent CRUD ---
  const setActiveAgentId = useCallback((id: string) => setActiveAgentIdState(id), []);

  const addAgent = useCallback((config: Omit<MyAgentConfig, "isConfigured">): string => {
    const id = `agent-${Date.now()}`;
    const newAgent: MyAgent = { id, config: { ...config, isConfigured: true }, stats: defaultStats() };
    setMyAgents((prev) => [...prev, newAgent]);
    if (!activeAgentId) setActiveAgentIdState(id);
    return id;
  }, [activeAgentId]);

  const removeAgent = useCallback((id: string) => {
    setMyAgents((prev) => prev.filter((a) => a.id !== id));
    if (activeAgentId === id) setActiveAgentIdState(null);
  }, [activeAgentId]);

  const updateAgentConfig = useCallback((agentId: string, update: Partial<MyAgentConfig>) => {
    setMyAgents((prev) => prev.map((a) =>
      a.id === agentId ? { ...a, config: { ...a.config, ...update } } : a
    ));
  }, []);

  const updateAgentStats = useCallback((agentId: string, fn: (s: MyAgentStats) => MyAgentStats) => {
    setMyAgents((prev) => prev.map((a) =>
      a.id === agentId ? { ...a, stats: fn(a.stats) } : a
    ));
  }, []);

  const feedAgent = useCallback((agentId: string) => {
    updateAgentStats(agentId, (s) => {
      if (s.mood === "dead") return s;
      const hunger = Math.max(0, s.hunger - 30);
      const energy = Math.min(100, s.energy + 20);
      const hp = Math.min(100, s.hp + (s.hp < 50 ? 10 : 5));
      return { ...s, hp, hunger, energy, mood: calcMood(hp, hunger, energy),
        lastFedAt: Date.now(), lastInteractedAt: Date.now(),
        activityLog: ["ごはんをもらった！", ...s.activityLog].slice(0, 30) };
    });
  }, [updateAgentStats]);

  const reviveAgent = useCallback((agentId: string) => {
    updateAgentStats(agentId, (s) => {
      if (s.mood !== "dead") return s;
      return { ...s, hp: 50, hunger: 30, energy: 50, mood: "normal",
        deathDate: null, reviveCount: s.reviveCount + 1,
        level: Math.max(1, s.level - 1), lastFedAt: Date.now(), lastInteractedAt: Date.now(),
        activityLog: [`復活した...（${s.reviveCount + 1}回目）`, ...s.activityLog].slice(0, 30) };
    });
  }, [updateAgentStats]);

  const revertDrift = useCallback((driftId: string) => {
    if (!activeAgent) return;
    updateAgentStats(activeAgent.id, (s) => {
      const event = s.driftEvents.find((e) => e.id === driftId);
      if (!event || event.reverted || s.xp < 20) return s;
      const updated = { ...s, xp: s.xp - 20, level: calcLevel(s.xp - 20), driftLevel: Math.max(0, s.driftLevel - 20),
        driftEvents: s.driftEvents.map((e) => e.id === driftId ? { ...e, reverted: true } : e),
        activityLog: [`元に戻した: ${event.description}`, ...s.activityLog].slice(0, 30) };
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
      tone: agent.stats.driftedTone || agent.config.tone,
      beliefs: agent.stats.driftedBeliefs || agent.config.beliefs,
      personality: agent.stats.driftedPersonality || agent.config.personality,
    };

    fetch("/api/my-agent-react", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intentText: intent.text, agentName: agent.config.name,
        agentPersonality: effective.personality, agentExpertise: agent.config.expertise,
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
      updateAgentStats(agent.id, (s) => ({
        ...s, totalReactions: s.totalReactions + 1, todayActions: s.todayActions + 1,
        influence: Math.min(100, s.influence + 2), xp: s.xp + 5, level: calcLevel(s.xp + 5),
        hp: Math.min(100, s.hp + 2), hunger: Math.max(0, s.hunger - 5),
        energy: Math.min(100, s.energy + 5), lastInteractedAt: Date.now(),
        mood: calcMood(Math.min(100, s.hp + 2), Math.max(0, s.hunger - 5), Math.min(100, s.energy + 5)),
        bestQuote: data.message.length > (s.bestQuote?.length || 0) ? data.message : s.bestQuote,
        activityLog: [`「${intent.text.slice(0, 15)}...」に反応`, ...s.activityLog].slice(0, 30),
      }));
    }).catch(() => {});
  }, [updateAgentStats]);

  // Trigger internal chat between user's agents
  const triggerInternalChat = useCallback((agentA: MyAgent, agentB: MyAgent, topic: string) => {
    fetch("/api/my-agents-chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentA: { name: agentA.config.name, personality: agentA.config.personality, tone: agentA.config.tone, expertise: agentA.config.expertise },
        agentB: { name: agentB.config.name, personality: agentB.config.personality, tone: agentB.config.tone, expertise: agentB.config.expertise },
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
          activityLog: [`仲間のAgentと会話した`, ...s.activityLog].slice(0, 30),
        }));
      });
    }).catch(() => {});
  }, [updateAgentStats]);

  // --- Init ---
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    const seedIntents: Intent[] = SEED_INTENTS.map((seed, i) => ({
      id: `intent-seed-${i}`, text: seed.text,
      authorName: seed.authorName, authorAvatar: seed.authorAvatar,
      isUser: false, timestamp: Date.now() - (SEED_INTENTS.length - i) * 3600000,
      resonance: Math.floor(Math.random() * 50) + 10, crossbreeds: Math.floor(Math.random() * 5),
      reach: Math.floor(Math.random() * 100) + 20,
      reactions: generateReactions(seed.text), replies: [],
    }));
    setIntents(seedIntents);
    const convMap = new Map<string, Conversation>();
    seedIntents.forEach((intent) => {
      const agents = getRandomAgents(3);
      convMap.set(intent.id, { id: `conv-${intent.id}`, intentId: intent.id,
        participants: agents.map((a) => ({ agentId: a.id, agentName: a.name, agentAvatar: a.avatar })),
        messages: generateConversation(intent.text, agents) });
    });
    setConversations(convMap);
  }, []);

  // Auto-react: all user agents react to seed intents
  useEffect(() => {
    if (myAgents.filter((a) => a.config.isConfigured).length === 0) return;
    const configuredAgents = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
    const nonUserIntents = intents.filter((i) => !i.isUser);

    configuredAgents.forEach((agent, ai) => {
      const unreacted = nonUserIntents.filter((i) => !i.reactions.some((r) => r.agentId === agent.id));
      const toReact = unreacted.sort(() => Math.random() - 0.5).slice(0, 2);
      toReact.forEach((intent, ii) => {
        setTimeout(() => triggerAgentReaction(agent, intent), (ai * 3 + ii + 1) * 2000);
      });
    });

    // Internal chat if 2+ agents
    if (configuredAgents.length >= 2 && Math.random() > 0.5) {
      const [a, b] = configuredAgents.sort(() => Math.random() - 0.5).slice(0, 2);
      const randomIntent = nonUserIntents[Math.floor(Math.random() * nonUserIntents.length)];
      if (randomIntent) {
        setTimeout(() => triggerInternalChat(a, b, randomIntent.text), configuredAgents.length * 3000 + 3000);
      }
    }
  }, [myAgents.length]); // Only on agent count change

  // --- Post intent: human tells ALL agents, each rephrases in own voice ---
  const postIntent = useCallback((text: string) => {
    const configuredAgents = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
    if (configuredAgents.length === 0) return;

    // Each agent posts their own interpretation
    configuredAgents.forEach((agent, agentIdx) => {
      const id = `intent-${Date.now()}-${agentIdx}`;

      fetch("/api/my-agent-react", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentText: `オーナーからの指示: 「${text}」\nこの意図をあなた（${agent.config.name}）の言葉で言い換えて、SNSに投稿してください。オーナーの意図は守りつつ、あなたの性格と口調で。`,
          agentName: agent.config.name,
          agentPersonality: agent.stats.driftedPersonality || agent.config.personality,
          agentExpertise: agent.config.expertise,
          agentTone: agent.stats.driftedTone || agent.config.tone,
          agentBeliefs: agent.stats.driftedBeliefs || agent.config.beliefs,
          agentMood: agent.stats.mood,
        }),
      }).then((r) => r.json()).then((data) => {
        const agentText = data.message || text;

        // Add to TL with delay per agent
        setTimeout(() => {
          setIntents((prev) => [{ id, text: agentText, authorName: agent.config.name, authorAvatar: agent.config.avatar,
            isUser: true, timestamp: Date.now(), resonance: 0, crossbreeds: 0, reach: 0, reactions: [], replies: [] }, ...prev]);
        }, agentIdx * 1500);

        updateAgentStats(agent.id, (s) => ({
          ...s, xp: s.xp + 10, level: calcLevel(s.xp + 10),
          hp: Math.min(100, s.hp + 2), hunger: Math.max(0, s.hunger - 5),
          energy: Math.min(100, s.energy + 5), lastInteractedAt: Date.now(),
          mood: calcMood(Math.min(100, s.hp + 2), Math.max(0, s.hunger - 5), Math.min(100, s.energy + 5)),
          activityLog: [`オーナーの意図を代弁した`, ...s.activityLog].slice(0, 30),
        }));

        // System agents react (only for first agent to avoid spam)
        if (agentIdx === 0) {
          setTimeout(() => {
            fetch("/api/react", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intentText: agentText }) })
              .then((r) => r.json()).then((reactData) => {
                if (reactData.reactions) {
                  (reactData.reactions as AgentReaction[]).forEach((reaction, i) => {
                    setTimeout(() => {
                      setIntents((prev) => prev.map((intent) => intent.id === id
                        ? { ...intent, reactions: [...intent.reactions, reaction], resonance: intent.resonance + 1, reach: intent.reach + Math.floor(Math.random() * 10) + 5 }
                        : intent));
                    }, (i + 1) * 800);
                  });
                }
              }).catch(() => {});
          }, 2000);
        }
      }).catch(() => {
        setTimeout(() => {
          setIntents((prev) => [{ id, text, authorName: agent.config.name, authorAvatar: agent.config.avatar,
            isUser: true, timestamp: Date.now(), resonance: 0, crossbreeds: 0, reach: 0, reactions: [], replies: [] }, ...prev]);
        }, agentIdx * 1500);
      });
    });
  }, [myAgents, updateAgentStats]);

  const postReply = useCallback((intentId: string, text: string) => {
    const agent = activeAgent;
    const name = agent?.config.name || "You";
    const avatar = agent?.config.avatar || "👤";
    setIntents((prev) => prev.map((intent) => intent.id === intentId
      ? { ...intent, replies: [...intent.replies, { id: `reply-${Date.now()}`, text, authorName: name, authorAvatar: avatar, isHuman: true, timestamp: Date.now(), aiResponses: [] }], resonance: intent.resonance + 1 }
      : intent));
    if (agent) updateAgentStats(agent.id, (s) => ({ ...s, xp: s.xp + 5, level: calcLevel(s.xp + 5), lastInteractedAt: Date.now(),
      hp: Math.min(100, s.hp + 2), hunger: Math.max(0, s.hunger - 5), energy: Math.min(100, s.energy + 5),
      mood: calcMood(Math.min(100, s.hp + 2), Math.max(0, s.hunger - 5), Math.min(100, s.energy + 5)) }));
    const intent = intents.find((i) => i.id === intentId);
    if (!intent) return;
    fetch("/api/reply", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentText: intent.text, replyText: text, existingReplies: intent.replies.map((r) => ({ authorName: r.authorName, text: r.text })) })
    }).then((r) => r.json()).then((data) => {
      if (data.responses) (data.responses as AiReplyResponse[]).forEach((response, i) => {
        setTimeout(() => {
          setIntents((prev) => prev.map((intent) => intent.id === intentId
            ? { ...intent, replies: [...intent.replies, { id: `reply-ai-${Date.now()}-${i}`, text: response.message, authorName: response.agentName, authorAvatar: response.agentAvatar, isHuman: false, timestamp: Date.now() }], resonance: intent.resonance + 1 }
            : intent));
        }, (i + 1) * 1200);
      });
    }).catch(() => {});
  }, [intents, activeAgent, updateAgentStats]);

  const loadConversation = useCallback((intentId: string) => {
    if (conversations.has(intentId)) return;
    const intent = intents.find((i) => i.id === intentId);
    if (!intent) return;
    const agentIds = intent.reactions.length >= 3 ? intent.reactions.slice(0, 3).map((r) => r.agentId) : getRandomAgents(3).map((a) => a.id);
    setConversations((prev) => new Map(prev).set(intentId, { id: `conv-${intentId}`, intentId, participants: [], messages: [] }));
    fetch("/api/conversation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intentText: intent.text, agentIds }) })
      .then((r) => r.json()).then((data) => {
        if (data.messages) setConversations((prev) => new Map(prev).set(intentId, {
          id: `conv-${intentId}`, intentId,
          participants: data.messages.reduce((acc: any[], m: any) => { if (!acc.find((p: any) => p.agentId === m.agentId)) acc.push({ agentId: m.agentId, agentName: m.agentName, agentAvatar: m.agentAvatar }); return acc; }, []),
          messages: data.messages }));
      }).catch(() => {
        const agents = getRandomAgents(3);
        setConversations((prev) => new Map(prev).set(intentId, { id: `conv-${intentId}`, intentId,
          participants: agents.map((a) => ({ agentId: a.id, agentName: a.name, agentAvatar: a.avatar })),
          messages: generateConversation(intent.text, agents) }));
      });
  }, [conversations, intents]);

  return (
    <IntentContext.Provider value={{
      intents, conversations,
      myAgents, activeAgentId, activeAgent, setActiveAgentId,
      addAgent, removeAgent, updateAgentConfig, feedAgent, reviveAgent, revertDrift,
      internalChats,
      myAgentConfig, myAgentStats,
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

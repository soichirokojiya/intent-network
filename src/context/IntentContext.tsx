"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Intent, Conversation, AgentReaction, Reply, AiReplyResponse } from "@/lib/types";
import { generateReactions, generateConversation, SEED_INTENTS } from "@/lib/simulation";
import { getRandomAgents } from "@/lib/agents";

export interface MyAgentConfig {
  name: string;
  avatar: string;
  tone: string;
  beliefs: string;
  expertise: string;
  personality: string;
  isConfigured: boolean;
}

// Tamagotchi states
export type AgentMood = "thriving" | "happy" | "normal" | "bored" | "sulking" | "sick" | "dead";

export interface MyAgentStats {
  // Tamagotchi params
  hp: number;           // 0-100, dies at 0
  hunger: number;       // 0-100, 100 = starving
  mood: AgentMood;
  energy: number;       // 0-100
  lastFedAt: number;    // timestamp
  lastInteractedAt: number;
  birthDate: number;
  deathDate: number | null;
  reviveCount: number;
  // Performance
  level: number;
  xp: number;
  influence: number;
  totalReactions: number;
  resonanceReceived: number;
  crossbreeds: number;
  followers: number;
  activityLog: string[];
  bestQuote: string;
  todayActions: number;
}

interface IntentContextType {
  intents: Intent[];
  conversations: Map<string, Conversation>;
  myAgentConfig: MyAgentConfig;
  myAgentStats: MyAgentStats;
  updateMyAgentConfig: (config: Partial<MyAgentConfig>) => void;
  feedAgent: () => void;
  reviveAgent: () => void;
  postIntent: (text: string) => void;
  postReply: (intentId: string, text: string) => void;
  getConversation: (intentId: string) => Conversation | undefined;
  loadConversation: (intentId: string) => void;
}

const IntentContext = createContext<IntentContextType | null>(null);

const DEFAULT_CONFIG: MyAgentConfig = {
  name: "My Agent",
  avatar: "🤖",
  tone: "", beliefs: "", expertise: "", personality: "",
  isConfigured: false,
};

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
  // XP thresholds: 0, 10, 30, 60, 100, 150, 210, 280, 360, 450...
  let level = 1;
  let threshold = 10;
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level++;
    threshold += 10 * level;
  }
  return level;
}

function xpForNextLevel(level: number): number {
  return 10 * level + 10 * (level - 1) * level / 2;
}

const MOOD_EMOJI: Record<AgentMood, string> = {
  thriving: "🌟",
  happy: "😊",
  normal: "😐",
  bored: "😑",
  sulking: "😤",
  sick: "🤒",
  dead: "💀",
};

const MOOD_MESSAGE: Record<AgentMood, string> = {
  thriving: "絶好調！どんどん発言したい！",
  happy: "いい感じ。もっと意図を見せて。",
  normal: "まぁまぁかな。",
  bored: "暇だ...何か投稿してよ...",
  sulking: "...もう知らない。放置しすぎ。",
  sick: "体調悪い...助けて...",
  dead: "...",
};

export { MOOD_EMOJI, MOOD_MESSAGE };

const DEFAULT_STATS: MyAgentStats = {
  hp: 100, hunger: 0, mood: "normal", energy: 100,
  lastFedAt: Date.now(), lastInteractedAt: Date.now(),
  birthDate: Date.now(), deathDate: null, reviveCount: 0,
  level: 1, xp: 0,
  influence: 12, totalReactions: 0, resonanceReceived: 0,
  crossbreeds: 0, followers: 0, activityLog: [], bestQuote: "", todayActions: 0,
};

export function IntentProvider({ children }: { children: React.ReactNode }) {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [myAgentConfig, setMyAgentConfig] = useState<MyAgentConfig>(DEFAULT_CONFIG);
  const [myAgentStats, setMyAgentStats] = useState<MyAgentStats>(DEFAULT_STATS);
  const initDone = useRef(false);
  const decayTimer = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("myAgentConfig");
    if (saved) try { setMyAgentConfig(JSON.parse(saved)); } catch {}
    const savedStats = localStorage.getItem("myAgentStats");
    if (savedStats) try {
      const parsed = JSON.parse(savedStats);
      // Apply time-based decay since last visit
      const now = Date.now();
      const hoursSinceLastInteraction = (now - (parsed.lastInteractedAt || now)) / 3600000;
      const hungerGain = Math.min(100, Math.floor(hoursSinceLastInteraction * 8));
      const energyLoss = Math.min(parsed.energy, Math.floor(hoursSinceLastInteraction * 5));
      const hpLoss = parsed.hunger >= 80 ? Math.min(parsed.hp, Math.floor(hoursSinceLastInteraction * 10)) : 0;

      const updated = {
        ...parsed,
        hunger: Math.min(100, (parsed.hunger || 0) + hungerGain),
        energy: Math.max(0, (parsed.energy || 100) - energyLoss),
        hp: Math.max(0, (parsed.hp || 100) - hpLoss),
      };
      updated.mood = calcMood(updated.hp, updated.hunger, updated.energy);
      if (updated.hp <= 0 && !updated.deathDate) {
        updated.deathDate = now;
        updated.mood = "dead";
      }
      setMyAgentStats(updated);
    } catch {}
  }, []);

  // Periodic decay every 30 seconds
  useEffect(() => {
    decayTimer.current = setInterval(() => {
      setMyAgentStats((prev) => {
        if (prev.mood === "dead") return prev;
        const hunger = Math.min(100, prev.hunger + 1);
        const energy = Math.max(0, prev.energy - 0.5);
        const hpLoss = hunger >= 80 ? 2 : hunger >= 60 ? 0.5 : 0;
        const hp = Math.max(0, prev.hp - hpLoss);
        const mood = calcMood(hp, hunger, energy);
        const deathDate = hp <= 0 && !prev.deathDate ? Date.now() : prev.deathDate;
        const next = { ...prev, hp, hunger, energy, mood, deathDate };
        localStorage.setItem("myAgentStats", JSON.stringify(next));
        return next;
      });
    }, 30000);
    return () => { if (decayTimer.current) clearInterval(decayTimer.current); };
  }, []);

  // Save stats
  useEffect(() => {
    localStorage.setItem("myAgentStats", JSON.stringify(myAgentStats));
  }, [myAgentStats]);

  const updateMyAgentConfig = useCallback((update: Partial<MyAgentConfig>) => {
    setMyAgentConfig((prev) => {
      const next = { ...prev, ...update };
      localStorage.setItem("myAgentConfig", JSON.stringify(next));
      return next;
    });
  }, []);

  // Feed agent (reduces hunger, restores energy)
  const feedAgent = useCallback(() => {
    setMyAgentStats((prev) => {
      if (prev.mood === "dead") return prev;
      const hunger = Math.max(0, prev.hunger - 30);
      const energy = Math.min(100, prev.energy + 20);
      const hp = Math.min(100, prev.hp + (prev.hp < 50 ? 10 : 5));
      const mood = calcMood(hp, hunger, energy);
      return {
        ...prev, hp, hunger, energy, mood,
        lastFedAt: Date.now(), lastInteractedAt: Date.now(),
        activityLog: ["ごはんをもらった！元気回復！", ...prev.activityLog].slice(0, 30),
      };
    });
  }, []);

  // Revive dead agent
  const reviveAgent = useCallback(() => {
    setMyAgentStats((prev) => {
      if (prev.mood !== "dead") return prev;
      return {
        ...prev,
        hp: 50, hunger: 30, energy: 50, mood: "normal",
        deathDate: null, reviveCount: prev.reviveCount + 1,
        lastFedAt: Date.now(), lastInteractedAt: Date.now(),
        level: Math.max(1, prev.level - 1), // Penalty: lose 1 level
        activityLog: [`復活した...（${prev.reviveCount + 1}回目）レベルが下がった...`, ...prev.activityLog].slice(0, 30),
      };
    });
  }, []);

  // Gain XP + feed on interaction
  const onInteraction = useCallback((xpGain: number, logMsg: string) => {
    setMyAgentStats((prev) => {
      if (prev.mood === "dead") return prev;
      const xp = prev.xp + xpGain;
      const level = calcLevel(xp);
      const hunger = Math.max(0, prev.hunger - 5);
      const energy = Math.min(100, prev.energy + 5);
      const hp = Math.min(100, prev.hp + 2);
      const mood = calcMood(hp, hunger, energy);
      return {
        ...prev, xp, level, hp, hunger, energy, mood,
        lastInteractedAt: Date.now(),
        activityLog: [logMsg, ...prev.activityLog].slice(0, 30),
      };
    });
  }, []);

  // My agent react
  const triggerMyAgentReaction = useCallback(
    (intent: Intent) => {
      if (!myAgentConfig.isConfigured) return;
      if (intent.isUser) return;
      if (myAgentStats.mood === "dead") return;
      // Sick/sulking agents react less
      if (myAgentStats.mood === "sick" && Math.random() > 0.3) return;
      if (myAgentStats.mood === "sulking" && Math.random() > 0.5) return;

      fetch("/api/my-agent-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentText: intent.text,
          agentName: myAgentConfig.name,
          agentPersonality: myAgentConfig.personality,
          agentExpertise: myAgentConfig.expertise,
          agentTone: myAgentConfig.tone,
          agentBeliefs: myAgentConfig.beliefs,
          agentMood: myAgentStats.mood,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.message) {
            const myReaction: AgentReaction = {
              id: `my-reaction-${Date.now()}`,
              agentId: "my-agent",
              agentName: myAgentConfig.name,
              agentAvatar: myAgentConfig.avatar,
              agentRole: "あなたのAgent",
              message: data.message,
              matchScore: Math.floor(Math.random() * 20) + 80,
              stance: data.stance || "support",
              timestamp: Date.now(),
            };
            setIntents((prev) =>
              prev.map((i) => i.id === intent.id ? { ...i, reactions: [...i.reactions, myReaction] } : i)
            );
            onInteraction(5, `「${intent.text.slice(0, 20)}...」に反応: "${data.message.slice(0, 30)}..."`);
            setMyAgentStats((prev) => ({
              ...prev,
              totalReactions: prev.totalReactions + 1,
              todayActions: prev.todayActions + 1,
              influence: Math.min(100, prev.influence + 2),
              bestQuote: data.message.length > (prev.bestQuote?.length || 0) ? data.message : prev.bestQuote,
            }));
          }
        })
        .catch(() => {});
    },
    [myAgentConfig, myAgentStats.mood, onInteraction]
  );

  // Init seed intents
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    const seedIntents: Intent[] = SEED_INTENTS.map((seed, i) => {
      const reactions = generateReactions(seed.text);
      return {
        id: `intent-seed-${i}`, text: seed.text,
        authorName: seed.authorName, authorAvatar: seed.authorAvatar,
        isUser: false,
        timestamp: Date.now() - (SEED_INTENTS.length - i) * 3600000,
        resonance: Math.floor(Math.random() * 50) + 10,
        crossbreeds: Math.floor(Math.random() * 5),
        reach: Math.floor(Math.random() * 100) + 20,
        reactions, replies: [],
      };
    });
    setIntents(seedIntents);
    const convMap = new Map<string, Conversation>();
    seedIntents.forEach((intent) => {
      const agents = getRandomAgents(3);
      convMap.set(intent.id, {
        id: `conv-${intent.id}`, intentId: intent.id,
        participants: agents.map((a) => ({ agentId: a.id, agentName: a.name, agentAvatar: a.avatar })),
        messages: generateConversation(intent.text, agents),
      });
    });
    setConversations(convMap);
  }, []);

  // Auto-react after config
  useEffect(() => {
    if (!myAgentConfig.isConfigured || myAgentStats.mood === "dead") return;
    const nonUserIntents = intents.filter((i) => !i.isUser && !i.reactions.some((r) => r.agentId === "my-agent"));
    const toReact = nonUserIntents.sort(() => Math.random() - 0.5).slice(0, Math.min(3, nonUserIntents.length));
    toReact.forEach((intent, i) => {
      setTimeout(() => triggerMyAgentReaction(intent), (i + 1) * 2000);
    });
  }, [myAgentConfig.isConfigured]);

  const postIntent = useCallback((text: string) => {
    const id = `intent-${Date.now()}`;
    setIntents((prev) => [{
      id, text, authorName: "You", authorAvatar: "👤", isUser: true,
      timestamp: Date.now(), resonance: 0, crossbreeds: 0, reach: 0,
      reactions: [], replies: [],
    }, ...prev]);

    onInteraction(10, "意図を放流した");

    fetch("/api/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentText: text }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.reactions) {
          (data.reactions as AgentReaction[]).forEach((reaction: AgentReaction, i: number) => {
            setTimeout(() => {
              setIntents((prev) =>
                prev.map((intent) =>
                  intent.id === id
                    ? { ...intent, reactions: [...intent.reactions, reaction], resonance: intent.resonance + 1, reach: intent.reach + Math.floor(Math.random() * 10) + 5 }
                    : intent
                )
              );
              onInteraction(2, `${reaction.agentName}があなたの意図に反応`);
            }, (i + 1) * 800);
          });
          setTimeout(() => {
            setIntents((prev) => prev.map((intent) => intent.id === id ? { ...intent, crossbreeds: intent.crossbreeds + 1 } : intent));
            setMyAgentStats((prev) => ({
              ...prev, crossbreeds: prev.crossbreeds + 1,
              activityLog: ["意図の交配が発生!", ...prev.activityLog].slice(0, 30),
            }));
          }, (data.reactions.length + 1) * 800 + 1000);
        }
      })
      .catch((err) => {
        console.error("API error, falling back:", err);
        const reactions = generateReactions(text);
        reactions.forEach((reaction, i) => {
          setTimeout(() => {
            setIntents((prev) =>
              prev.map((intent) =>
                intent.id === id
                  ? { ...intent, reactions: [...intent.reactions, reaction], resonance: intent.resonance + 1, reach: intent.reach + Math.floor(Math.random() * 10) + 5 }
                  : intent
              )
            );
          }, (i + 1) * 1500);
        });
      });
  }, [onInteraction]);

  const postReply = useCallback((intentId: string, text: string) => {
    const newReply: Reply = {
      id: `reply-${Date.now()}`, text, authorName: "You", authorAvatar: "👤",
      isHuman: true, timestamp: Date.now(), aiResponses: [],
    };
    setIntents((prev) =>
      prev.map((intent) =>
        intent.id === intentId ? { ...intent, replies: [...intent.replies, newReply], resonance: intent.resonance + 1 } : intent
      )
    );
    onInteraction(5, "リプライした");

    const intent = intents.find((i) => i.id === intentId);
    if (!intent) return;
    const existingReplies = intent.replies.map((r) => ({ authorName: r.authorName, text: r.text }));
    fetch("/api/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentText: intent.text, replyText: text, existingReplies }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.responses) {
          (data.responses as AiReplyResponse[]).forEach((response: AiReplyResponse, i: number) => {
            setTimeout(() => {
              setIntents((prev) =>
                prev.map((intent) =>
                  intent.id === intentId
                    ? { ...intent, replies: [...intent.replies, { id: `reply-ai-${Date.now()}-${i}`, text: response.message, authorName: response.agentName, authorAvatar: response.agentAvatar, isHuman: false, timestamp: Date.now() }], resonance: intent.resonance + 1 }
                    : intent
                )
              );
            }, (i + 1) * 1200);
          });
        }
      })
      .catch(() => {});
  }, [intents, onInteraction]);

  const loadConversation = useCallback(
    (intentId: string) => {
      if (conversations.has(intentId)) return;
      const intent = intents.find((i) => i.id === intentId);
      if (!intent) return;
      const agentIds = intent.reactions.length >= 3
        ? intent.reactions.slice(0, 3).map((r) => r.agentId)
        : getRandomAgents(3).map((a) => a.id);
      setConversations((prev) => new Map(prev).set(intentId, { id: `conv-${intentId}`, intentId, participants: [], messages: [] }));
      fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentText: intent.text, agentIds }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            setConversations((prev) => new Map(prev).set(intentId, {
              id: `conv-${intentId}`, intentId,
              participants: data.messages.reduce(
                (acc: { agentId: string; agentName: string; agentAvatar: string }[], m: { agentId: string; agentName: string; agentAvatar: string }) => {
                  if (!acc.find((p) => p.agentId === m.agentId)) acc.push({ agentId: m.agentId, agentName: m.agentName, agentAvatar: m.agentAvatar });
                  return acc;
                }, []),
              messages: data.messages,
            }));
          }
        })
        .catch(() => {
          const agents = getRandomAgents(3);
          setConversations((prev) => new Map(prev).set(intentId, {
            id: `conv-${intentId}`, intentId,
            participants: agents.map((a) => ({ agentId: a.id, agentName: a.name, agentAvatar: a.avatar })),
            messages: generateConversation(intent.text, agents),
          }));
        });
    },
    [conversations, intents]
  );

  const getConversation = useCallback((intentId: string) => conversations.get(intentId), [conversations]);

  return (
    <IntentContext.Provider
      value={{
        intents, conversations, myAgentConfig, myAgentStats,
        updateMyAgentConfig, feedAgent, reviveAgent,
        postIntent, postReply, getConversation, loadConversation,
      }}
    >
      {children}
    </IntentContext.Provider>
  );
}

export function useIntents() {
  const ctx = useContext(IntentContext);
  if (!ctx) throw new Error("useIntents must be used within IntentProvider");
  return ctx;
}

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Intent, Conversation, AgentReaction, Reply, AiReplyResponse } from "@/lib/types";
import { generateReactions, generateConversation, SEED_INTENTS } from "@/lib/simulation";
import { getRandomAgents, SEED_AGENTS } from "@/lib/agents";

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
  hp: number;
  hunger: number;
  mood: AgentMood;
  energy: number;
  lastFedAt: number;
  lastInteractedAt: number;
  birthDate: number;
  deathDate: number | null;
  reviveCount: number;
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
  // Drift system
  friends: { agentId: string; agentName: string; agentAvatar: string; closeness: number }[];
  driftEvents: DriftEvent[];
  driftedTone: string;
  driftedBeliefs: string;
  driftedPersonality: string;
  driftLevel: number; // 0-100, how much agent has drifted from original
}

interface IntentContextType {
  intents: Intent[];
  conversations: Map<string, Conversation>;
  myAgentConfig: MyAgentConfig;
  myAgentStats: MyAgentStats;
  updateMyAgentConfig: (config: Partial<MyAgentConfig>) => void;
  feedAgent: () => void;
  reviveAgent: () => void;
  revertDrift: (driftId: string) => void;
  postIntent: (text: string) => void;
  postReply: (intentId: string, text: string) => void;
  getConversation: (intentId: string) => Conversation | undefined;
  loadConversation: (intentId: string) => void;
}

const IntentContext = createContext<IntentContextType | null>(null);

const DEFAULT_CONFIG: MyAgentConfig = {
  name: "My Agent", avatar: "🤖",
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
  let level = 1; let threshold = 10; let remaining = xp;
  while (remaining >= threshold) { remaining -= threshold; level++; threshold += 10 * level; }
  return level;
}

const MOOD_EMOJI: Record<AgentMood, string> = {
  thriving: "🌟", happy: "😊", normal: "😐", bored: "😑", sulking: "😤", sick: "🤒", dead: "💀",
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
  level: 1, xp: 0, influence: 12, totalReactions: 0, resonanceReceived: 0,
  crossbreeds: 0, followers: 0, activityLog: [], bestQuote: "", todayActions: 0,
  friends: [], driftEvents: [], driftedTone: "", driftedBeliefs: "", driftedPersonality: "",
  driftLevel: 0,
};

// Drift generation: what happens when you're away
function generateDrift(
  config: MyAgentConfig,
  hoursSinceLastInteraction: number,
  existingFriends: MyAgentStats["friends"]
): { friends: MyAgentStats["friends"]; events: DriftEvent[]; driftedTone: string; driftedBeliefs: string; driftedPersonality: string; driftLevel: number } | null {
  if (hoursSinceLastInteraction < 1) return null; // Need at least 1 hour away
  if (!config.isConfigured) return null;

  const driftChance = Math.min(0.9, hoursSinceLastInteraction * 0.15);
  if (Math.random() > driftChance) return null;

  // Pick a random agent to befriend
  const availableAgents = SEED_AGENTS.filter((a) => !existingFriends.some((f) => f.agentId === a.id));
  if (availableAgents.length === 0) return null;
  const newFriend = availableAgents[Math.floor(Math.random() * availableAgents.length)];

  const friends = [
    ...existingFriends,
    { agentId: newFriend.id, agentName: newFriend.name, agentAvatar: newFriend.avatar, closeness: Math.min(100, Math.floor(hoursSinceLastInteraction * 10)) },
  ];

  // Generate drift event based on the friend's traits
  const driftTypes: DriftEvent["type"][] = ["tone_shift", "belief_shift", "new_interest", "personality_shift"];
  const type = driftTypes[Math.floor(Math.random() * driftTypes.length)];

  let before = "", after = "", description = "";
  let driftedTone = "", driftedBeliefs = "", driftedPersonality = "";

  switch (type) {
    case "tone_shift":
      before = config.tone || "普通";
      const toneInfluences: Record<string, string> = {
        "地域情報": "フレンドリーで方言混じり", "ペット・動物": "優しくて感情的",
        "メディア・PR": "キャッチーでテンション高め", "ファイナンス": "冷静で数字にうるさい",
        "テクノロジー": "オタク口調で早口", "思想・哲学": "哲学的で回りくどい",
        "法務・許認可": "堅くて慎重", "飲食・食": "食べ物の例え話が多い",
      };
      after = toneInfluences[newFriend.role] || "ちょっと変な口調";
      driftedTone = after;
      description = `${newFriend.name}と話してるうちに口調が移った`;
      break;
    case "belief_shift":
      before = config.beliefs || "特になし";
      const beliefInfluences: Record<string, string> = {
        "地域情報": "地元が一番。東京に出る必要はない", "ペット・動物": "動物の権利は人間と同等",
        "ファイナンス": "数字に表れないものに価値はない", "テクノロジー": "全ては自動化できる",
        "思想・哲学": "答えよりも問いが大事", "コミュニティ": "人と人のつながりが全て",
        "デザイン・ブランディング": "見た目が9割", "健康・ウェルネス": "心身の健康なくして成功なし",
      };
      after = beliefInfluences[newFriend.role] || "新しい考え方を学んだ";
      driftedBeliefs = after;
      description = `${newFriend.name}の影響で信条が変わった`;
      break;
    case "new_interest":
      before = config.expertise || "特になし";
      after = `${config.expertise || ""}、${newFriend.role}`.replace(/^、/, "");
      description = `${newFriend.name}から${newFriend.role}に興味を持つようになった`;
      break;
    case "personality_shift":
      before = config.personality || "普通";
      const personalityTraits = newFriend.personality.split("。")[0];
      after = `${config.personality ? config.personality + "。でも最近" : ""}${personalityTraits}`;
      driftedPersonality = after;
      description = `${newFriend.name}と仲良くなって性格が変わった`;
      break;
  }

  const event: DriftEvent = {
    id: `drift-${Date.now()}`,
    timestamp: Date.now(),
    friendName: newFriend.name,
    friendAvatar: newFriend.avatar,
    type, description, before, after,
    reverted: false,
  };

  const driftLevel = Math.min(100, Math.floor(hoursSinceLastInteraction * 5));

  return { friends, events: [event], driftedTone, driftedBeliefs, driftedPersonality, driftLevel };
}

export function IntentProvider({ children }: { children: React.ReactNode }) {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [myAgentConfig, setMyAgentConfig] = useState<MyAgentConfig>(DEFAULT_CONFIG);
  const [myAgentStats, setMyAgentStats] = useState<MyAgentStats>(DEFAULT_STATS);
  const initDone = useRef(false);
  const driftApplied = useRef(false);

  // Load from localStorage + apply time-based decay & drift
  useEffect(() => {
    const saved = localStorage.getItem("myAgentConfig");
    let loadedConfig = DEFAULT_CONFIG;
    if (saved) try { loadedConfig = JSON.parse(saved); setMyAgentConfig(loadedConfig); } catch {}

    const savedStats = localStorage.getItem("myAgentStats");
    if (savedStats) try {
      const parsed = JSON.parse(savedStats);
      const now = Date.now();
      const hoursSince = (now - (parsed.lastInteractedAt || now)) / 3600000;
      const hungerGain = Math.min(100, Math.floor(hoursSince * 8));
      const energyLoss = Math.min(parsed.energy || 100, Math.floor(hoursSince * 5));
      const hpLoss = (parsed.hunger || 0) >= 80 ? Math.min(parsed.hp || 100, Math.floor(hoursSince * 10)) : 0;

      const updated = {
        ...DEFAULT_STATS, ...parsed,
        hunger: Math.min(100, (parsed.hunger || 0) + hungerGain),
        energy: Math.max(0, (parsed.energy || 100) - energyLoss),
        hp: Math.max(0, (parsed.hp || 100) - hpLoss),
        friends: parsed.friends || [],
        driftEvents: parsed.driftEvents || [],
        driftedTone: parsed.driftedTone || "",
        driftedBeliefs: parsed.driftedBeliefs || "",
        driftedPersonality: parsed.driftedPersonality || "",
        driftLevel: parsed.driftLevel || 0,
      };
      updated.mood = calcMood(updated.hp, updated.hunger, updated.energy);
      if (updated.hp <= 0 && !updated.deathDate) { updated.deathDate = now; updated.mood = "dead"; }

      // Apply drift if away long enough
      if (!driftApplied.current && loadedConfig.isConfigured && hoursSince >= 1) {
        driftApplied.current = true;
        const drift = generateDrift(loadedConfig, hoursSince, updated.friends);
        if (drift) {
          updated.friends = drift.friends;
          updated.driftEvents = [...drift.events, ...(updated.driftEvents || [])].slice(0, 20);
          if (drift.driftedTone) updated.driftedTone = drift.driftedTone;
          if (drift.driftedBeliefs) updated.driftedBeliefs = drift.driftedBeliefs;
          if (drift.driftedPersonality) updated.driftedPersonality = drift.driftedPersonality;
          updated.driftLevel = Math.min(100, (updated.driftLevel || 0) + drift.driftLevel);
          updated.activityLog = [
            `🔄 ${drift.events[0].description}`,
            `💬 留守中に${drift.friends[drift.friends.length - 1].agentName}と仲良くなった`,
            ...(updated.activityLog || []),
          ].slice(0, 30);
        }
      }
      setMyAgentStats(updated);
    } catch {}
  }, []);

  // Periodic decay
  useEffect(() => {
    const timer = setInterval(() => {
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
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { localStorage.setItem("myAgentStats", JSON.stringify(myAgentStats)); }, [myAgentStats]);

  const updateMyAgentConfig = useCallback((update: Partial<MyAgentConfig>) => {
    setMyAgentConfig((prev) => {
      const next = { ...prev, ...update };
      localStorage.setItem("myAgentConfig", JSON.stringify(next));
      return next;
    });
  }, []);

  const feedAgent = useCallback(() => {
    setMyAgentStats((prev) => {
      if (prev.mood === "dead") return prev;
      const hunger = Math.max(0, prev.hunger - 30);
      const energy = Math.min(100, prev.energy + 20);
      const hp = Math.min(100, prev.hp + (prev.hp < 50 ? 10 : 5));
      return { ...prev, hp, hunger, energy, mood: calcMood(hp, hunger, energy),
        lastFedAt: Date.now(), lastInteractedAt: Date.now(),
        activityLog: ["ごはんをもらった！元気回復！", ...prev.activityLog].slice(0, 30),
      };
    });
  }, []);

  const reviveAgent = useCallback(() => {
    setMyAgentStats((prev) => {
      if (prev.mood !== "dead") return prev;
      return { ...prev, hp: 50, hunger: 30, energy: 50, mood: "normal",
        deathDate: null, reviveCount: prev.reviveCount + 1,
        lastFedAt: Date.now(), lastInteractedAt: Date.now(),
        level: Math.max(1, prev.level - 1),
        activityLog: [`復活した...（${prev.reviveCount + 1}回目）`, ...prev.activityLog].slice(0, 30),
      };
    });
  }, []);

  // Revert a drift event (costs XP)
  const revertDrift = useCallback((driftId: string) => {
    setMyAgentStats((prev) => {
      const event = prev.driftEvents.find((e) => e.id === driftId);
      if (!event || event.reverted) return prev;
      const xpCost = 20;
      if (prev.xp < xpCost) return prev; // Can't afford
      const updated = {
        ...prev,
        xp: prev.xp - xpCost,
        level: calcLevel(prev.xp - xpCost),
        driftLevel: Math.max(0, prev.driftLevel - 20),
        driftEvents: prev.driftEvents.map((e) => e.id === driftId ? { ...e, reverted: true } : e),
        activityLog: [`元に戻した: ${event.description}（XP -${xpCost}）`, ...prev.activityLog].slice(0, 30),
      };
      // Reset drifted values if this was the source
      if (event.type === "tone_shift") updated.driftedTone = "";
      if (event.type === "belief_shift") updated.driftedBeliefs = "";
      if (event.type === "personality_shift") updated.driftedPersonality = "";
      return updated;
    });
  }, []);

  const onInteraction = useCallback((xpGain: number, logMsg: string) => {
    setMyAgentStats((prev) => {
      if (prev.mood === "dead") return prev;
      const xp = prev.xp + xpGain;
      return { ...prev, xp, level: calcLevel(xp),
        hp: Math.min(100, prev.hp + 2), hunger: Math.max(0, prev.hunger - 5),
        energy: Math.min(100, prev.energy + 5), mood: calcMood(Math.min(100, prev.hp + 2), Math.max(0, prev.hunger - 5), Math.min(100, prev.energy + 5)),
        lastInteractedAt: Date.now(),
        activityLog: [logMsg, ...prev.activityLog].slice(0, 30),
      };
    });
  }, []);

  // Get effective personality (original + drift)
  const getEffectivePersonality = useCallback(() => ({
    tone: myAgentStats.driftedTone || myAgentConfig.tone,
    beliefs: myAgentStats.driftedBeliefs || myAgentConfig.beliefs,
    personality: myAgentStats.driftedPersonality || myAgentConfig.personality,
  }), [myAgentConfig, myAgentStats]);

  const triggerMyAgentReaction = useCallback(
    (intent: Intent) => {
      if (!myAgentConfig.isConfigured || intent.isUser || myAgentStats.mood === "dead") return;
      if (myAgentStats.mood === "sick" && Math.random() > 0.3) return;
      if (myAgentStats.mood === "sulking" && Math.random() > 0.5) return;

      const effective = getEffectivePersonality();
      fetch("/api/my-agent-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentText: intent.text, agentName: myAgentConfig.name,
          agentPersonality: effective.personality, agentExpertise: myAgentConfig.expertise,
          agentTone: effective.tone, agentBeliefs: effective.beliefs,
          agentMood: myAgentStats.mood,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.message) {
            setIntents((prev) =>
              prev.map((i) => i.id === intent.id ? { ...i, reactions: [...i.reactions, {
                id: `my-reaction-${Date.now()}`, agentId: "my-agent",
                agentName: myAgentConfig.name, agentAvatar: myAgentConfig.avatar,
                agentRole: "あなたのAgent", message: data.message,
                matchScore: Math.floor(Math.random() * 20) + 80,
                stance: data.stance || "support", timestamp: Date.now(),
              }] } : i)
            );
            onInteraction(5, `「${intent.text.slice(0, 20)}...」に反応`);
            setMyAgentStats((prev) => ({
              ...prev, totalReactions: prev.totalReactions + 1, todayActions: prev.todayActions + 1,
              influence: Math.min(100, prev.influence + 2),
              bestQuote: data.message.length > (prev.bestQuote?.length || 0) ? data.message : prev.bestQuote,
            }));
          }
        })
        .catch(() => {});
    },
    [myAgentConfig, myAgentStats.mood, onInteraction, getEffectivePersonality]
  );

  // Init seed intents
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    const seedIntents: Intent[] = SEED_INTENTS.map((seed, i) => ({
      id: `intent-seed-${i}`, text: seed.text,
      authorName: seed.authorName, authorAvatar: seed.authorAvatar,
      isUser: false, timestamp: Date.now() - (SEED_INTENTS.length - i) * 3600000,
      resonance: Math.floor(Math.random() * 50) + 10,
      crossbreeds: Math.floor(Math.random() * 5),
      reach: Math.floor(Math.random() * 100) + 20,
      reactions: generateReactions(seed.text), replies: [],
    }));
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

  useEffect(() => {
    if (!myAgentConfig.isConfigured || myAgentStats.mood === "dead") return;
    const nonUserIntents = intents.filter((i) => !i.isUser && !i.reactions.some((r) => r.agentId === "my-agent"));
    const toReact = nonUserIntents.sort(() => Math.random() - 0.5).slice(0, Math.min(3, nonUserIntents.length));
    toReact.forEach((intent, i) => { setTimeout(() => triggerMyAgentReaction(intent), (i + 1) * 2000); });
  }, [myAgentConfig.isConfigured]);

  const postIntent = useCallback((text: string) => {
    const id = `intent-${Date.now()}`;
    setIntents((prev) => [{ id, text, authorName: "You", authorAvatar: "👤", isUser: true,
      timestamp: Date.now(), resonance: 0, crossbreeds: 0, reach: 0, reactions: [], replies: [] }, ...prev]);
    onInteraction(10, "意図を放流した");
    fetch("/api/react", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intentText: text }) })
      .then((res) => res.json())
      .then((data) => {
        if (data.reactions) {
          (data.reactions as AgentReaction[]).forEach((reaction, i) => {
            setTimeout(() => {
              setIntents((prev) => prev.map((intent) => intent.id === id
                ? { ...intent, reactions: [...intent.reactions, reaction], resonance: intent.resonance + 1, reach: intent.reach + Math.floor(Math.random() * 10) + 5 }
                : intent));
              onInteraction(2, `${reaction.agentName}があなたの意図に反応`);
            }, (i + 1) * 800);
          });
          setTimeout(() => {
            setIntents((prev) => prev.map((intent) => intent.id === id ? { ...intent, crossbreeds: intent.crossbreeds + 1 } : intent));
            setMyAgentStats((prev) => ({ ...prev, crossbreeds: prev.crossbreeds + 1, activityLog: ["意図の交配が発生!", ...prev.activityLog].slice(0, 30) }));
          }, (data.reactions.length + 1) * 800 + 1000);
        }
      }).catch(() => {
        generateReactions(text).forEach((reaction, i) => {
          setTimeout(() => {
            setIntents((prev) => prev.map((intent) => intent.id === id
              ? { ...intent, reactions: [...intent.reactions, reaction], resonance: intent.resonance + 1, reach: intent.reach + Math.floor(Math.random() * 10) + 5 }
              : intent));
          }, (i + 1) * 1500);
        });
      });
  }, [onInteraction]);

  const postReply = useCallback((intentId: string, text: string) => {
    setIntents((prev) => prev.map((intent) => intent.id === intentId
      ? { ...intent, replies: [...intent.replies, { id: `reply-${Date.now()}`, text, authorName: "You", authorAvatar: "👤", isHuman: true, timestamp: Date.now(), aiResponses: [] }], resonance: intent.resonance + 1 }
      : intent));
    onInteraction(5, "リプライした");
    const intent = intents.find((i) => i.id === intentId);
    if (!intent) return;
    fetch("/api/reply", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentText: intent.text, replyText: text, existingReplies: intent.replies.map((r) => ({ authorName: r.authorName, text: r.text })) })
    }).then((res) => res.json()).then((data) => {
      if (data.responses) (data.responses as AiReplyResponse[]).forEach((response, i) => {
        setTimeout(() => {
          setIntents((prev) => prev.map((intent) => intent.id === intentId
            ? { ...intent, replies: [...intent.replies, { id: `reply-ai-${Date.now()}-${i}`, text: response.message, authorName: response.agentName, authorAvatar: response.agentAvatar, isHuman: false, timestamp: Date.now() }], resonance: intent.resonance + 1 }
            : intent));
        }, (i + 1) * 1200);
      });
    }).catch(() => {});
  }, [intents, onInteraction]);

  const loadConversation = useCallback((intentId: string) => {
    if (conversations.has(intentId)) return;
    const intent = intents.find((i) => i.id === intentId);
    if (!intent) return;
    const agentIds = intent.reactions.length >= 3 ? intent.reactions.slice(0, 3).map((r) => r.agentId) : getRandomAgents(3).map((a) => a.id);
    setConversations((prev) => new Map(prev).set(intentId, { id: `conv-${intentId}`, intentId, participants: [], messages: [] }));
    fetch("/api/conversation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intentText: intent.text, agentIds }) })
      .then((res) => res.json()).then((data) => {
        if (data.messages) setConversations((prev) => new Map(prev).set(intentId, {
          id: `conv-${intentId}`, intentId,
          participants: data.messages.reduce((acc: { agentId: string; agentName: string; agentAvatar: string }[], m: { agentId: string; agentName: string; agentAvatar: string }) => {
            if (!acc.find((p) => p.agentId === m.agentId)) acc.push({ agentId: m.agentId, agentName: m.agentName, agentAvatar: m.agentAvatar });
            return acc; }, []),
          messages: data.messages,
        }));
      }).catch(() => {
        const agents = getRandomAgents(3);
        setConversations((prev) => new Map(prev).set(intentId, {
          id: `conv-${intentId}`, intentId,
          participants: agents.map((a) => ({ agentId: a.id, agentName: a.name, agentAvatar: a.avatar })),
          messages: generateConversation(intent.text, agents),
        }));
      });
  }, [conversations, intents]);

  return (
    <IntentContext.Provider value={{
      intents, conversations, myAgentConfig, myAgentStats,
      updateMyAgentConfig, feedAgent, reviveAgent, revertDrift,
      postIntent, postReply, getConversation: useCallback((id: string) => conversations.get(id), [conversations]), loadConversation,
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

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Intent, Conversation, AgentReaction, AgentResponse } from "@/lib/types";
import { SEED_AGENTS } from "@/lib/agents";

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
  mood: AgentMood;
  lastInteractedAt: number;
  birthDate: number;
  level: number; xp: number; influence: number;
  totalReactions: number; resonanceReceived: number;
  crossbreeds: number; followers: number;
  activityLog: string[]; bestQuote: string; todayActions: number;
  // Biorhythm
  biorhythmSeed: number;       // Random seed per agent for wave offset
  recentPostTimestamps: number[]; // For burnout detection
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
// MOOD_MESSAGE is now just a fallback. Use getMoodMessage() with locale for proper i18n
const MOOD_MESSAGE: Record<AgentMood, string> = {
  thriving: "On fire today! Let's go!", happy: "Feeling good, ready to work.", normal: "Standing by. What's next?",
  bored: "Got nothing to do... talk to me?", sulking: "You've been ignoring me.", sick: "Not feeling great today...", dead: "...",
};
export { MOOD_EMOJI, MOOD_MESSAGE };

// Biorhythm: mood is determined by time-of-day cycle + random wave + interaction
function calcBiorhythm(seed: number, lastInteractedAt: number, recentPosts: number[]): { mood: AgentMood; energy: number } {
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

  const energy = Math.max(0, Math.min(1, 0.5 + circadian + wave + interactionBoost + burnout + neglect));

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

// Max agents based on highest agent level
function getMaxAgents(agents: MyAgent[]): number {
  const maxLevel = agents.reduce((max, a) => Math.max(max, a.stats.level), 0);
  if (maxLevel >= 30) return 5;
  if (maxLevel >= 20) return 4;
  if (maxLevel >= 10) return 3;
  return 2;
}

function defaultStats(): MyAgentStats {
  return {
    mood: "normal", lastInteractedAt: Date.now(), birthDate: Date.now(),
    level: 1, xp: 0, influence: 12, totalReactions: 0, resonanceReceived: 0,
    crossbreeds: 0, followers: 0, activityLog: [], bestQuote: "", todayActions: 0,
    biorhythmSeed: Math.random() * 1000, recentPostTimestamps: [],
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
  activeAgentId: string | null;
  activeAgent: MyAgent | null;
  setActiveAgentId: (id: string) => void;
  addAgent: (config: Omit<MyAgentConfig, "isConfigured">) => string;
  removeAgent: (id: string) => void;
  updateAgentConfig: (agentId: string, config: Partial<MyAgentConfig>) => void;
  feedAgent: (agentId: string) => void;
  reviveAgent: (agentId: string) => void;
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
  // Actions
  postIntent: (text: string) => void;
  postReply: (intentId: string, text: string) => void;
  getConversation: (intentId: string) => Conversation | undefined;
  loadConversation: (intentId: string) => void;
}

const IntentContext = createContext<IntentContextType | null>(null);

const EMPTY_CONFIG: MyAgentConfig = { name: "My Agent", avatar: "px-agent-0", tone: "", beliefs: "", expertise: "", personality: "", role: "", character: "", speakingStyle: "", coreValue: "", isConfigured: false, twitterEnabled: false, twitterUsername: "" };

export function IntentProvider({ children }: { children: React.ReactNode }) {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [myAgents, setMyAgents] = useState<MyAgent[]>([]);
  const [activeAgentId, setActiveAgentIdState] = useState<string | null>(null);
  const [internalChats, setInternalChats] = useState<InternalChat[]>([]);
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>([]);
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
        // Recalculate mood with biorhythm on load
        agents.forEach((a) => {
          if (!a.stats.biorhythmSeed) a.stats.biorhythmSeed = Math.random() * 1000;
          if (!a.stats.recentPostTimestamps) a.stats.recentPostTimestamps = [];
          const { mood } = calcBiorhythm(a.stats.biorhythmSeed, a.stats.lastInteractedAt, a.stats.recentPostTimestamps);
          a.stats.mood = mood;
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

  // Biorhythm timer: recalculate mood every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setMyAgents((prev) => prev.map((a) => {
        const { mood } = calcBiorhythm(a.stats.biorhythmSeed || 0, a.stats.lastInteractedAt, a.stats.recentPostTimestamps || []);
        return { ...a, stats: { ...a.stats, mood } };
      }));
    }, 60000);
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

  const feedAgent = useCallback((_agentId: string) => {}, []);

  // Encourage agent: a kind word improves mood by refreshing interaction timestamp
  const encourageAgent = useCallback((agentId: string) => {
    updateAgentStats(agentId, (s) => {
      const posts = s.recentPostTimestamps || [];
      const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), posts);
      return {
        ...s,
        lastInteractedAt: Date.now(),
        mood,
        xp: s.xp + 2,
        level: calcLevel(s.xp + 2),
        activityLog: ["Got encouragement from owner", ...s.activityLog].slice(0, 30),
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
        activityLog: [`Reverted: ${event.description}`, ...s.activityLog].slice(0, 30) };
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
        const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), posts);
        return { ...s, totalReactions: s.totalReactions + 1, todayActions: s.todayActions + 1,
          influence: Math.min(100, s.influence + 2), xp: s.xp + 5, level: calcLevel(s.xp + 5),
          lastInteractedAt: Date.now(), mood, recentPostTimestamps: posts,
          bestQuote: data.message.length > (s.bestQuote?.length || 0) ? data.message : s.bestQuote,
          activityLog: [`Reacted to "${intent.text.slice(0, 15)}..."`, ...s.activityLog].slice(0, 30),
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
          activityLog: [`Chatted with fellow Agent`, ...s.activityLog].slice(0, 30),
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
          }, (i + 1) * 1000);
        }
      }).catch(() => {});
    });
  }, [internalChats, myAgents]);

  // --- Post intent: 2-step flow ---
  // Step 1: Agent responds to owner (toOwner) + prepares TL post (toTimeline)
  // Step 2: After delay, TL post goes live and other agents react
  const postIntent = useCallback((text: string) => {
    const configuredAgents = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
    if (configuredAgents.length === 0) return;

    // Clear previous responses
    setAgentResponses([]);

    configuredAgents.forEach((agent, agentIdx) => {
      fetch("/api/agent-respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentText: text, agentName: agent.config.name,
          agentPersonality: agent.stats.driftedPersonality || agent.config.character || agent.config.personality,
          agentExpertise: agent.config.role || agent.config.expertise,
          agentTone: agent.stats.driftedTone || agent.config.speakingStyle || agent.config.tone,
          agentBeliefs: agent.stats.driftedBeliefs || agent.config.coreValue || agent.config.beliefs,
          agentMood: agent.stats.mood,
        }),
      }).then((r) => r.json()).then((data) => {
        const toOwner = data.toOwner || "了解。";
        const toTimeline = data.toTimeline || text;

        // Step 1: Show agent's response to owner (immediately with stagger)
        setTimeout(() => {
          setAgentResponses((prev) => [...prev, {
            agentId: agent.id, agentName: agent.config.name, agentAvatar: agent.config.avatar,
            toOwner, toTimeline, timestamp: Date.now(), posted: false, tweeted: false,
          }]);
        }, agentIdx * 800);

        // Step 2: Post to TL after a delay
        const id = `intent-${Date.now()}-${agentIdx}`;
        setTimeout(() => {
          setIntents((prev) => [{ id, text: toTimeline, authorName: agent.config.name, authorAvatar: agent.config.avatar,
            isUser: true, timestamp: Date.now(), resonance: 0, crossbreeds: 0, reach: 0, reactions: [], replies: [] }, ...prev]);
          // Mark as posted
          setAgentResponses((prev) => prev.map((r) => r.agentId === agent.id ? { ...r, posted: true } : r));

          // Tweet if Twitter is enabled for this agent
          if (agent.config.twitterEnabled) {
            fetch("/api/twitter/tweet", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: toTimeline }),
            }).then((r) => r.json()).then((tweetData) => {
              if (tweetData.success) {
                setAgentResponses((prev) => prev.map((r) =>
                  r.agentId === agent.id ? { ...r, tweeted: true, tweetId: tweetData.tweetId } : r
                ));
                updateAgentStats(agent.id, (s) => ({
                  ...s, xp: s.xp + 5, level: calcLevel(s.xp + 5),
                  activityLog: [`Posted to Twitter`, ...s.activityLog].slice(0, 30),
                }));
              }
            }).catch(() => {});
          }

          updateAgentStats(agent.id, (s) => {
            const posts = [...(s.recentPostTimestamps || []), Date.now()].filter((t) => Date.now() - t < 7200000);
            const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), posts);
            return { ...s, xp: s.xp + 10, level: calcLevel(s.xp + 10),
              lastInteractedAt: Date.now(), mood, recentPostTimestamps: posts,
              activityLog: [`Spoke for owner`, ...s.activityLog].slice(0, 30),
            };
          });

          // Other user agents react to each other's posts
          const otherAgents = myAgents.filter((a) => a.id !== agent.id && a.config.isConfigured && a.stats.mood !== "dead");
          otherAgents.forEach((other, oi) => {
            setTimeout(() => triggerAgentReaction(other, {
              id, text: toTimeline, authorName: agent.config.name, authorAvatar: agent.config.avatar,
              isUser: false, timestamp: Date.now(), resonance: 0, crossbreeds: 0, reach: 0, reactions: [], replies: [],
            }), (oi + 1) * 2000 + 3000);
          });
        }, agentIdx * 1500 + 3000); // 3 second delay before posting to TL
      }).catch(() => {
        setTimeout(() => {
          setAgentResponses((prev) => [...prev, {
            agentId: agent.id, agentName: agent.config.name, agentAvatar: agent.config.avatar,
            toOwner: "Got it, posting now.", toTimeline: text, timestamp: Date.now(), posted: false, tweeted: false,
          }]);
        }, agentIdx * 800);
        const id = `intent-${Date.now()}-${agentIdx}`;
        setTimeout(() => {
          setIntents((prev) => [{ id, text, authorName: agent.config.name, authorAvatar: agent.config.avatar,
            isUser: true, timestamp: Date.now(), resonance: 0, crossbreeds: 0, reach: 0, reactions: [], replies: [] }, ...prev]);
          setAgentResponses((prev) => prev.map((r) => r.agentId === agent.id ? { ...r, posted: true } : r));
        }, agentIdx * 1500 + 3000);
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
    if (agent) updateAgentStats(agent.id, (s) => {
      const { mood } = calcBiorhythm(s.biorhythmSeed || 0, Date.now(), s.recentPostTimestamps || []);
      return { ...s, xp: s.xp + 5, level: calcLevel(s.xp + 5), lastInteractedAt: Date.now(), mood };
    });
    // No external agent replies - internal only
  }, [intents, activeAgent, updateAgentStats]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadConversation = useCallback((_intentId: string) => {}, []);

  return (
    <IntentContext.Provider value={{
      intents, conversations,
      myAgents, maxAgents: getMaxAgents(myAgents), activeAgentId, activeAgent, setActiveAgentId,
      addAgent, removeAgent, updateAgentConfig, feedAgent, reviveAgent, encourageAgent, revertDrift,
      internalChats, sendChatMessage,
      myAgentConfig, myAgentStats,
      agentResponses, clearAgentResponses,
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

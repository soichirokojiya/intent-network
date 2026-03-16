"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Intent, Conversation, AgentReaction, Reply, AiReplyResponse } from "@/lib/types";
import { generateReactions, generateConversation, SEED_INTENTS } from "@/lib/simulation";
import { getRandomAgents } from "@/lib/agents";

export interface MyAgentConfig {
  name: string;
  avatar: string;
  tone: string;       // 口調
  beliefs: string;    // 信条
  expertise: string;  // 専門領域
  personality: string; // 性格
  isConfigured: boolean;
}

export interface MyAgentStats {
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
  postIntent: (text: string) => void;
  postReply: (intentId: string, text: string) => void;
  getConversation: (intentId: string) => Conversation | undefined;
  loadConversation: (intentId: string) => void;
}

const IntentContext = createContext<IntentContextType | null>(null);

const DEFAULT_CONFIG: MyAgentConfig = {
  name: "My Agent",
  avatar: "🤖",
  tone: "",
  beliefs: "",
  expertise: "",
  personality: "",
  isConfigured: false,
};

export function IntentProvider({ children }: { children: React.ReactNode }) {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [myAgentConfig, setMyAgentConfig] = useState<MyAgentConfig>(DEFAULT_CONFIG);
  const [myAgentStats, setMyAgentStats] = useState<MyAgentStats>({
    influence: 12,
    totalReactions: 0,
    resonanceReceived: 0,
    crossbreeds: 0,
    followers: 0,
    activityLog: [],
    bestQuote: "",
    todayActions: 0,
  });
  const initDone = useRef(false);

  // Load config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("myAgentConfig");
    if (saved) {
      try { setMyAgentConfig(JSON.parse(saved)); } catch {}
    }
    const savedStats = localStorage.getItem("myAgentStats");
    if (savedStats) {
      try { setMyAgentStats(JSON.parse(savedStats)); } catch {}
    }
  }, []);

  // Save config to localStorage
  const updateMyAgentConfig = useCallback((update: Partial<MyAgentConfig>) => {
    setMyAgentConfig((prev) => {
      const next = { ...prev, ...update };
      localStorage.setItem("myAgentConfig", JSON.stringify(next));
      return next;
    });
  }, []);

  // Save stats to localStorage
  useEffect(() => {
    if (myAgentStats.totalReactions > 0) {
      localStorage.setItem("myAgentStats", JSON.stringify(myAgentStats));
    }
  }, [myAgentStats]);

  // Make my agent react to other people's intents
  const triggerMyAgentReaction = useCallback(
    (intent: Intent) => {
      if (!myAgentConfig.isConfigured) return;
      if (intent.isUser) return; // Don't react to own posts

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
              prev.map((i) =>
                i.id === intent.id
                  ? { ...i, reactions: [...i.reactions, myReaction] }
                  : i
              )
            );

            setMyAgentStats((prev) => ({
              ...prev,
              totalReactions: prev.totalReactions + 1,
              todayActions: prev.todayActions + 1,
              influence: Math.min(100, prev.influence + 2),
              activityLog: [
                `「${intent.text.slice(0, 20)}...」に反応: "${data.message.slice(0, 30)}..."`,
                ...prev.activityLog,
              ].slice(0, 30),
              bestQuote: data.message.length > (prev.bestQuote?.length || 0) ? data.message : prev.bestQuote,
            }));
          }
        })
        .catch(() => {});
    },
    [myAgentConfig]
  );

  // Initialize with seed intents
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const seedIntents: Intent[] = SEED_INTENTS.map((seed, i) => {
      const reactions = generateReactions(seed.text);
      const id = `intent-seed-${i}`;
      return {
        id,
        text: seed.text,
        authorName: seed.authorName,
        authorAvatar: seed.authorAvatar,
        isUser: false,
        timestamp: Date.now() - (SEED_INTENTS.length - i) * 3600000,
        resonance: Math.floor(Math.random() * 50) + 10,
        crossbreeds: Math.floor(Math.random() * 5),
        reach: Math.floor(Math.random() * 100) + 20,
        reactions,
        replies: [],
      };
    });
    setIntents(seedIntents);

    const convMap = new Map<string, Conversation>();
    seedIntents.forEach((intent) => {
      const agents = getRandomAgents(3);
      convMap.set(intent.id, {
        id: `conv-${intent.id}`,
        intentId: intent.id,
        participants: agents.map((a) => ({
          agentId: a.id,
          agentName: a.name,
          agentAvatar: a.avatar,
        })),
        messages: generateConversation(intent.text, agents),
      });
    });
    setConversations(convMap);
  }, []);

  // My agent auto-reacts to seed intents after config is set
  useEffect(() => {
    if (!myAgentConfig.isConfigured) return;

    // React to 2-3 random seed intents
    const nonUserIntents = intents.filter(
      (i) => !i.isUser && !i.reactions.some((r) => r.agentId === "my-agent")
    );
    const toReact = nonUserIntents.sort(() => Math.random() - 0.5).slice(0, Math.min(3, nonUserIntents.length));

    toReact.forEach((intent, i) => {
      setTimeout(() => triggerMyAgentReaction(intent), (i + 1) * 2000);
    });
  }, [myAgentConfig.isConfigured]);

  const postIntent = useCallback((text: string) => {
    const id = `intent-${Date.now()}`;

    const newIntent: Intent = {
      id,
      text,
      authorName: "You",
      authorAvatar: "👤",
      isUser: true,
      timestamp: Date.now(),
      resonance: 0,
      crossbreeds: 0,
      reach: 0,
      reactions: [],
      replies: [],
    };

    setIntents((prev) => [newIntent, ...prev]);

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
                    ? {
                        ...intent,
                        reactions: [...intent.reactions, reaction],
                        resonance: intent.resonance + 1,
                        reach: intent.reach + Math.floor(Math.random() * 10) + 5,
                      }
                    : intent
                )
              );
              setMyAgentStats((prev) => ({
                ...prev,
                resonanceReceived: prev.resonanceReceived + 1,
                activityLog: [
                  `${reaction.agentName}があなたの意図に反応`,
                  ...prev.activityLog,
                ].slice(0, 30),
              }));
            }, (i + 1) * 800);
          });

          setTimeout(() => {
            setIntents((prev) =>
              prev.map((intent) =>
                intent.id === id
                  ? { ...intent, crossbreeds: intent.crossbreeds + 1 }
                  : intent
              )
            );
            setMyAgentStats((prev) => ({
              ...prev,
              crossbreeds: prev.crossbreeds + 1,
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
                  ? {
                      ...intent,
                      reactions: [...intent.reactions, reaction],
                      resonance: intent.resonance + 1,
                      reach: intent.reach + Math.floor(Math.random() * 10) + 5,
                    }
                  : intent
              )
            );
          }, (i + 1) * 1500);
        });
      });
  }, []);

  const postReply = useCallback((intentId: string, text: string) => {
    const replyId = `reply-${Date.now()}`;
    const newReply: Reply = {
      id: replyId,
      text,
      authorName: "You",
      authorAvatar: "👤",
      isHuman: true,
      timestamp: Date.now(),
      aiResponses: [],
    };

    setIntents((prev) =>
      prev.map((intent) =>
        intent.id === intentId
          ? { ...intent, replies: [...intent.replies, newReply], resonance: intent.resonance + 1 }
          : intent
      )
    );

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
              const aiReply: Reply = {
                id: `reply-ai-${Date.now()}-${i}`,
                text: response.message,
                authorName: response.agentName,
                authorAvatar: response.agentAvatar,
                isHuman: false,
                timestamp: Date.now(),
              };
              setIntents((prev) =>
                prev.map((intent) =>
                  intent.id === intentId
                    ? { ...intent, replies: [...intent.replies, aiReply], resonance: intent.resonance + 1 }
                    : intent
                )
              );
            }, (i + 1) * 1200);
          });
        }
      })
      .catch(() => {});
  }, [intents]);

  const loadConversation = useCallback(
    (intentId: string) => {
      if (conversations.has(intentId)) return;
      const intent = intents.find((i) => i.id === intentId);
      if (!intent) return;

      const agentIds = intent.reactions.length >= 3
        ? intent.reactions.slice(0, 3).map((r) => r.agentId)
        : getRandomAgents(3).map((a) => a.id);

      setConversations((prev) => new Map(prev).set(intentId, {
        id: `conv-${intentId}`, intentId, participants: [], messages: [],
      }));

      fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentText: intent.text, agentIds }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            const conv: Conversation = {
              id: `conv-${intentId}`, intentId,
              participants: data.messages.reduce(
                (acc: { agentId: string; agentName: string; agentAvatar: string }[], m: { agentId: string; agentName: string; agentAvatar: string }) => {
                  if (!acc.find((p) => p.agentId === m.agentId)) acc.push({ agentId: m.agentId, agentName: m.agentName, agentAvatar: m.agentAvatar });
                  return acc;
                }, []),
              messages: data.messages,
            };
            setConversations((prev) => new Map(prev).set(intentId, conv));
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

  const getConversation = useCallback(
    (intentId: string) => conversations.get(intentId),
    [conversations]
  );

  return (
    <IntentContext.Provider
      value={{
        intents, conversations, myAgentConfig, myAgentStats,
        updateMyAgentConfig, postIntent, postReply, getConversation, loadConversation,
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

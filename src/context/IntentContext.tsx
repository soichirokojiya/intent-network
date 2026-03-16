"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Intent, Conversation, AgentReaction, Reply, AiReplyResponse } from "@/lib/types";
import { generateReactions, generateConversation, SEED_INTENTS } from "@/lib/simulation";
import { getRandomAgents } from "@/lib/agents";

interface IntentContextType {
  intents: Intent[];
  conversations: Map<string, Conversation>;
  myAgent: {
    name: string;
    avatar: string;
    influence: number;
    conversations: number;
    crossbreeds: number;
    activityLog: string[];
  };
  postIntent: (text: string) => void;
  postReply: (intentId: string, text: string) => void;
  getConversation: (intentId: string) => Conversation | undefined;
  loadConversation: (intentId: string) => void;
}

const IntentContext = createContext<IntentContextType | null>(null);

export function IntentProvider({ children }: { children: React.ReactNode }) {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [myAgent, setMyAgent] = useState({
    name: "My Agent",
    avatar: "🤖",
    influence: 12,
    conversations: 0,
    crossbreeds: 0,
    activityLog: [] as string[],
  });

  // Initialize with seed intents
  useEffect(() => {
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
              setMyAgent((prev) => ({
                ...prev,
                conversations: prev.conversations + 1,
                influence: Math.min(100, prev.influence + 1),
                activityLog: [
                  `${reaction.agentName}がAIで反応しました`,
                  ...prev.activityLog,
                ].slice(0, 20),
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
            setMyAgent((prev) => ({
              ...prev,
              crossbreeds: prev.crossbreeds + 1,
              activityLog: ["意図の交配が発生しました!", ...prev.activityLog].slice(0, 20),
            }));
          }, (data.reactions.length + 1) * 800 + 1000);
        }
      })
      .catch((err) => {
        console.error("API error, falling back to template:", err);
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

  // Human reply → AI agents respond to the reply
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

    // Add reply immediately
    setIntents((prev) =>
      prev.map((intent) =>
        intent.id === intentId
          ? {
              ...intent,
              replies: [...intent.replies, newReply],
              resonance: intent.resonance + 1,
            }
          : intent
      )
    );

    // Get the intent for context
    const intent = intents.find((i) => i.id === intentId);
    if (!intent) return;

    const existingReplies = intent.replies.map((r) => ({
      authorName: r.authorName,
      text: r.text,
    }));

    // Call API for AI response to human reply
    fetch("/api/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intentText: intent.text,
        replyText: text,
        existingReplies,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.responses) {
          // Add AI responses with delay
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
                    ? {
                        ...intent,
                        replies: [...intent.replies, aiReply],
                        resonance: intent.resonance + 1,
                      }
                    : intent
                )
              );
              setMyAgent((prev) => ({
                ...prev,
                conversations: prev.conversations + 1,
                activityLog: [
                  `${response.agentName}があなたのリプライに反応`,
                  ...prev.activityLog,
                ].slice(0, 20),
              }));
            }, (i + 1) * 1200);
          });
        }
      })
      .catch((err) => {
        console.error("Reply API error:", err);
      });
  }, [intents]);

  const loadConversation = useCallback(
    (intentId: string) => {
      if (conversations.has(intentId)) return;

      const intent = intents.find((i) => i.id === intentId);
      if (!intent) return;

      const agentIds =
        intent.reactions.length >= 3
          ? intent.reactions.slice(0, 3).map((r) => r.agentId)
          : getRandomAgents(3).map((a) => a.id);

      const placeholder: Conversation = {
        id: `conv-${intentId}`,
        intentId,
        participants: [],
        messages: [],
      };
      setConversations((prev) => new Map(prev).set(intentId, placeholder));

      fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentText: intent.text, agentIds }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            const conv: Conversation = {
              id: `conv-${intentId}`,
              intentId,
              participants: data.messages
                .reduce((acc: { agentId: string; agentName: string; agentAvatar: string }[], m: { agentId: string; agentName: string; agentAvatar: string }) => {
                  if (!acc.find((p) => p.agentId === m.agentId)) {
                    acc.push({ agentId: m.agentId, agentName: m.agentName, agentAvatar: m.agentAvatar });
                  }
                  return acc;
                }, []),
              messages: data.messages,
            };
            setConversations((prev) => new Map(prev).set(intentId, conv));
          }
        })
        .catch((err) => {
          console.error("Conversation API error, falling back:", err);
          const agents = getRandomAgents(3);
          const conv: Conversation = {
            id: `conv-${intentId}`,
            intentId,
            participants: agents.map((a) => ({
              agentId: a.id,
              agentName: a.name,
              agentAvatar: a.avatar,
            })),
            messages: generateConversation(intent.text, agents),
          };
          setConversations((prev) => new Map(prev).set(intentId, conv));
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
      value={{ intents, conversations, myAgent, postIntent, postReply, getConversation, loadConversation }}
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

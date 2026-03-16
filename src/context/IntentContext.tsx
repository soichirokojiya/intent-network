"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Intent, Conversation, AgentReaction } from "@/lib/types";
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

  // Initialize with seed intents (template-based for speed)
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
      };
    });
    setIntents(seedIntents);

    // Template-based conversations for seed intents
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

  // Post intent → call Claude API for reactions
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
    };

    setIntents((prev) => [newIntent, ...prev]);

    // Call Claude API for real reactions
    fetch("/api/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentText: text }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.reactions) {
          // Add reactions one by one with delay for animation
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

          // Crossbreed after reactions
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
        // Fallback to template-based reactions
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

  // Load AI conversation on demand (when thread is opened)
  const loadConversation = useCallback(
    (intentId: string) => {
      // Already loaded
      if (conversations.has(intentId)) return;

      const intent = intents.find((i) => i.id === intentId);
      if (!intent) return;

      // Pick 3 agents from reactions, or random
      const agentIds =
        intent.reactions.length >= 3
          ? intent.reactions.slice(0, 3).map((r) => r.agentId)
          : getRandomAgents(3).map((a) => a.id);

      // Set placeholder
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
      value={{ intents, conversations, myAgent, postIntent, getConversation, loadConversation }}
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

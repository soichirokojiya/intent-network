"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Intent, Conversation } from "@/lib/types";
import { generateReactions, generateConversation, SEED_INTENTS, generateCrossbreed } from "@/lib/simulation";
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
      };
    });
    setIntents(seedIntents);

    // Generate conversations for seed intents
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
    const reactions = generateReactions(text);

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

    // Simulate reactions appearing over time
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
        setMyAgent((prev) => ({
          ...prev,
          conversations: prev.conversations + 1,
          influence: Math.min(100, prev.influence + 1),
          activityLog: [
            `${reaction.agentName}と会話しました`,
            ...prev.activityLog,
          ].slice(0, 20),
        }));
      }, (i + 1) * 1500);
    });

    // Simulate crossbreed after reactions
    setTimeout(() => {
      setIntents((prev) => {
        const otherIntents = prev.filter((p) => p.id !== id && p.text);
        if (otherIntents.length > 0) {
          const partner = otherIntents[Math.floor(Math.random() * otherIntents.length)];
          const crossbreedText = generateCrossbreed(text, partner.text);

          return prev.map((intent) =>
            intent.id === id
              ? { ...intent, crossbreeds: intent.crossbreeds + 1 }
              : intent
          );
        }
        return prev;
      });
      setMyAgent((prev) => ({
        ...prev,
        crossbreeds: prev.crossbreeds + 1,
        activityLog: ["意図の交配が発生しました!", ...prev.activityLog].slice(0, 20),
      }));
    }, reactions.length * 1500 + 2000);

    // Generate conversation
    const agents = getRandomAgents(3);
    const conv: Conversation = {
      id: `conv-${id}`,
      intentId: id,
      participants: agents.map((a) => ({
        agentId: a.id,
        agentName: a.name,
        agentAvatar: a.avatar,
      })),
      messages: generateConversation(text, agents),
    };
    setConversations((prev) => new Map(prev).set(id, conv));
  }, []);

  const getConversation = useCallback(
    (intentId: string) => conversations.get(intentId),
    [conversations]
  );

  return (
    <IntentContext.Provider
      value={{ intents, conversations, myAgent, postIntent, getConversation }}
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

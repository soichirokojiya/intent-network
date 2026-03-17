"use client";

import { useState, useRef, useEffect } from "react";
import { useIntents } from "@/context/IntentContext";
import { useLocale } from "@/context/LocaleContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import { AgentResponse } from "@/lib/types";

interface ChatMessage {
  id: string;
  type: "user" | "agent";
  agentName?: string;
  agentAvatar?: string;
  text: string;
  timestamp: number;
  tweetPreview?: string; // tweet content waiting for approval
  agentId?: string;
}

// Simple intent detection from user message
function detectIntent(text: string): "approve" | "reject" | "rest" | "message" {
  const lower = text.trim().toLowerCase();
  const approveWords = ["ok", "おk", "いいよ", "いいね", "それで", "お願い", "投稿して", "ツイートして", "それでいい", "大丈夫", "問題ない", "頼む", "よろしく", "オッケー", "おけ", "ええよ", "ええで", "go", "yes", "sure", "いい感じ", "完璧", "バッチリ"];
  const rejectWords = ["やめて", "やめ", "やり直し", "修正", "変えて", "違う", "ダメ", "だめ", "no", "nope", "cancel", "キャンセル", "やっぱやめ", "なし"];
  const restWords = ["休んで", "休憩", "少し休んで", "ちょっと休んで", "疲れた", "おやすみ", "休め", "寝て"];

  if (restWords.some((w) => lower.includes(w))) return "rest";
  if (approveWords.some((w) => lower === w || lower.includes(w))) return "approve";
  if (rejectWords.some((w) => lower === w || lower.includes(w))) return "reject";
  return "message";
}

export function IntentComposer() {
  const [text, setText] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const isComposing = useRef(false);
  const { postIntent, myAgents, activeAgentIds, agentResponses, clearAgentResponses, approveTweet, restAgent } = useIntents();
  const { t } = useLocale();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const processedResponseIds = useRef<Set<string>>(new Set());

  const configured = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
  const hasAgent = configured.length > 0;

  // Track pending tweet agent
  const pendingTweetAgentId = agentResponses.find((r) => r.tweetPending)?.agentId || null;

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Convert agent responses to chat messages
  useEffect(() => {
    agentResponses.forEach((resp) => {
      const key = `${resp.agentId}-${resp.timestamp}`;
      if (processedResponseIds.current.has(key)) return;
      processedResponseIds.current.add(key);

      // Agent's response to owner
      const msgs: ChatMessage[] = [{
        id: `agent-${key}`,
        type: "agent",
        agentName: resp.agentName,
        agentAvatar: resp.agentAvatar,
        agentId: resp.agentId,
        text: resp.toOwner,
        timestamp: resp.timestamp,
      }];

      // If tweet is pending, add tweet preview message
      if (resp.tweetPending) {
        msgs.push({
          id: `tweet-preview-${key}`,
          type: "agent",
          agentName: resp.agentName,
          agentAvatar: resp.agentAvatar,
          agentId: resp.agentId,
          text: `このツイートでいいですか？\n\n「${resp.toTimeline}」`,
          timestamp: resp.timestamp + 1,
          tweetPreview: resp.toTimeline,
        });
      }

      setChatHistory((prev) => [...prev, ...msgs]);
    });
  }, [agentResponses]);

  // Watch for tweet approval/rejection results
  useEffect(() => {
    agentResponses.forEach((resp) => {
      if (resp.tweeted) {
        const tweetedKey = `tweeted-${resp.agentId}`;
        if (!processedResponseIds.current.has(tweetedKey)) {
          processedResponseIds.current.add(tweetedKey);
          setChatHistory((prev) => [...prev, {
            id: tweetedKey,
            type: "agent",
            agentName: resp.agentName,
            agentAvatar: resp.agentAvatar,
            agentId: resp.agentId,
            text: "Xに投稿しました！ ✓",
            timestamp: Date.now(),
          }]);
        }
      }
    });
  }, [agentResponses]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    const userText = text.trim();

    // Add user message to chat
    setChatHistory((prev) => [...prev, {
      id: `user-${Date.now()}`,
      type: "user",
      text: userText,
      timestamp: Date.now(),
    }]);

    const intent = detectIntent(userText);

    if (intent === "approve" && pendingTweetAgentId) {
      approveTweet(pendingTweetAgentId);
      setText("");
      return;
    }

    if (intent === "reject" && pendingTweetAgentId) {
      setChatHistory((prev) => [...prev, {
        id: `agent-reject-${Date.now()}`,
        type: "agent",
        agentName: agentResponses.find((r) => r.agentId === pendingTweetAgentId)?.agentName,
        agentAvatar: agentResponses.find((r) => r.agentId === pendingTweetAgentId)?.agentAvatar,
        agentId: pendingTweetAgentId,
        text: "了解、ツイートはやめておきますね。",
        timestamp: Date.now(),
      }]);
      // Clear the pending state
      clearAgentResponses();
      setText("");
      return;
    }

    if (intent === "rest") {
      const activeAgents = myAgents.filter((a) => activeAgentIds.has(a.id));
      activeAgents.forEach((agent) => {
        restAgent(agent.id);
        setChatHistory((prev) => [...prev, {
          id: `rest-${agent.id}-${Date.now()}`,
          type: "agent",
          agentName: agent.config.name,
          agentAvatar: agent.config.avatar,
          agentId: agent.id,
          text: "わかりました、少し休憩しますね。1時間後に戻ります 😴",
          timestamp: Date.now(),
        }]);
      });
      setText("");
      return;
    }

    // Normal message → post intent
    clearAgentResponses();
    processedResponseIds.current.clear();
    postIntent(userText);
    setText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {chatHistory.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[var(--muted)] text-[14px]">{t("home.placeholder")}</p>
          </div>
        )}

        {chatHistory.map((msg) => (
          msg.type === "user" ? (
            // User message (right side)
            <div key={msg.id} className="flex justify-end animate-fade-in">
              <div className="max-w-[75%] bg-[var(--accent)] text-white px-4 py-2.5 rounded-2xl rounded-br-sm">
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ) : (
            // Agent message (left side)
            <div key={msg.id} className="flex gap-2 animate-fade-in">
              <div className="flex-shrink-0 mt-1">
                <AgentAvatarDisplay avatar={msg.agentAvatar || ""} size={32} />
              </div>
              <div className="max-w-[75%]">
                <span className="text-[11px] text-[var(--muted)] ml-1">{msg.agentName}</span>
                <div className={`mt-0.5 px-4 py-2.5 rounded-2xl rounded-bl-sm ${
                  msg.tweetPreview
                    ? "bg-[var(--search-bg)] border border-[var(--accent)] border-opacity-50"
                    : "bg-[var(--search-bg)]"
                }`}>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            </div>
          )
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input area (fixed bottom) */}
      <div className="border-t border-[var(--card-border)] bg-[var(--background)] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={hasAgent ? t("home.placeholder") : "エージェントを作成してください"}
            className="flex-1 bg-[var(--search-bg)] rounded-2xl px-4 py-2.5 text-[15px] outline-none border border-[var(--card-border)] focus:border-[var(--accent)] resize-none max-h-[120px]"
            rows={1}
            onCompositionStart={() => { isComposing.current = true; }}
            onCompositionEnd={() => { isComposing.current = false; }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isComposing.current) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || !hasAgent}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-30 text-white p-2.5 rounded-full transition-colors flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

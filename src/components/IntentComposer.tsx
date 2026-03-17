"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useIntents } from "@/context/IntentContext";
import { useLocale } from "@/context/LocaleContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import { AgentResponse } from "@/lib/types";
import { loadChatHistory, saveChatMessage } from "@/lib/chatStorage";

interface ChatMessage {
  id: string;
  type: "user" | "agent" | "read" | "typing";
  agentName?: string;
  agentAvatar?: string;
  text: string;
  timestamp: number;
  tweetPreview?: string;
  agentId?: string;
}

function detectIntent(text: string): "approve" | "reject" | "rest" | "tweet" | "message" {
  const lower = text.trim().toLowerCase();
  const approveWords = ["ok", "おk", "いいよ", "いいね", "それで", "お願い", "それでいい", "大丈夫", "問題ない", "頼む", "よろしく", "オッケー", "おけ", "ええよ", "ええで", "go", "yes", "sure", "いい感じ", "完璧", "バッチリ"];
  const rejectWords = ["やめて", "やめ", "やり直し", "修正", "変えて", "違う", "ダメ", "だめ", "no", "nope", "cancel", "キャンセル", "やっぱやめ", "なし"];
  const restWords = ["休んで", "休憩", "少し休んで", "ちょっと休んで", "疲れた", "おやすみ", "休め", "寝て"];
  const tweetWords = ["ツイートして", "ツイート作って", "ツイートお願い", "投稿して", "投稿作って", "xに投稿", "tweetして", "ポストして", "つぶやいて"];

  if (restWords.some((w) => lower.includes(w))) return "rest";
  if (tweetWords.some((w) => lower.includes(w))) return "tweet";
  if (approveWords.some((w) => lower === w || lower.includes(w))) return "approve";
  if (rejectWords.some((w) => lower === w || lower.includes(w))) return "reject";
  return "message";
}

// Detect @mention in message text
function detectMention(text: string, agents: { id: string; config: { name: string } }[]): string | null {
  const match = text.match(/@(\S+)/);
  if (!match) return null;
  const mentionName = match[1].toLowerCase();
  const agent = agents.find((a) => a.config.name.toLowerCase() === mentionName);
  return agent?.id || null;
}

// Queue messages with natural delays: read → typing → message
function useMessageQueue(setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>, roomId: string = "general") {
  const queue = useRef<ChatMessage[]>([]);
  const processing = useRef(false);

  const processQueue = useCallback(() => {
    if (processing.current || queue.current.length === 0) return;
    processing.current = true;

    const msg = queue.current.shift()!;

    // Step 1: Show "既読" (read receipt) after 0.8s
    const readId = `read-${msg.id}`;
    setTimeout(() => {
      setChatHistory((prev) => [...prev, {
        id: readId, type: "read", text: "既読",
        agentName: msg.agentName, agentAvatar: msg.agentAvatar,
        agentId: msg.agentId, timestamp: Date.now(),
      }]);
    }, 800);

    // Step 2: Replace with "typing..." after 1.5s
    setTimeout(() => {
      setChatHistory((prev) => prev.map((m) =>
        m.id === readId ? { ...m, id: `typing-${msg.id}`, type: "typing", text: "" } : m
      ));
    }, 1800);

    // Step 3: Replace with actual message after 2.5-3.5s (varies by length)
    const typingDelay = Math.min(1500, 800 + msg.text.length * 15);
    setTimeout(() => {
      setChatHistory((prev) => prev.filter((m) => m.id !== `typing-${msg.id}`).concat([msg]));
      saveChatMessage({
        id: msg.id, type: msg.type as "user" | "agent", text: msg.text,
        agentName: msg.agentName, agentAvatar: msg.agentAvatar,
        agentId: msg.agentId, tweetPreview: msg.tweetPreview, timestamp: msg.timestamp,
      }, roomId);
      processing.current = false;
      processQueue();
    }, 1800 + typingDelay);
  }, [setChatHistory]);

  const enqueue = useCallback((msg: ChatMessage) => {
    queue.current.push(msg);
    processQueue();
  }, [processQueue]);

  return enqueue;
}

export function IntentComposer({ roomId = "general" }: { roomId?: string }) {
  const [text, setText] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const isComposing = useRef(false);
  const { postIntent, myAgents, activeAgentIds, agentResponses, clearAgentResponses, approveTweet, restAgent } = useIntents();
  const { t } = useLocale();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const processedResponseIds = useRef<Set<string>>(new Set());
  const enqueueMessage = useMessageQueue(setChatHistory, roomId);
  // Load chat history from Supabase on mount or room change
  useEffect(() => {
    setChatHistory([]);
    processedResponseIds.current.clear();
    loadChatHistory(roomId).then((msgs) => {
      if (msgs.length > 0) {
        setChatHistory(msgs as ChatMessage[]);
        // Mark all loaded message IDs as processed to prevent re-adding
        msgs.forEach((m) => {
          processedResponseIds.current.add(m.id);
          // Also mark the source keys for agent responses
          if (m.id.startsWith("agent-")) processedResponseIds.current.add(m.id.replace("agent-", ""));
          if (m.id.startsWith("tweet-preview-")) processedResponseIds.current.add(m.id.replace("tweet-preview-", ""));
          if (m.id.startsWith("tweeted-")) processedResponseIds.current.add(m.id);
        });
      }
    });
  }, [roomId]);

  const configured = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
  const hasAgent = configured.length > 0;
  const pendingTweetAgentId = agentResponses.find((r) => r.tweetPending)?.agentId || null;

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Convert agent responses to chat messages (with natural delay queue)
  useEffect(() => {
    agentResponses.forEach((resp) => {
      // Use agentId + content hash as key to prevent duplicates
      const contentKey = `${resp.agentId}-${resp.toOwner.slice(0, 30)}`;
      const key = `${resp.agentId}-${resp.timestamp}`;
      if (processedResponseIds.current.has(key)) return;
      if (processedResponseIds.current.has(contentKey)) return;
      // Check if same content already in chat
      if (chatHistory.some((m) => m.agentId === resp.agentId && m.text === resp.toOwner)) {
        processedResponseIds.current.add(key);
        processedResponseIds.current.add(contentKey);
        return;
      }
      processedResponseIds.current.add(key);
      processedResponseIds.current.add(contentKey);

      // Agent's response to owner
      enqueueMessage({
        id: `agent-${key}`,
        type: "agent",
        agentName: resp.agentName,
        agentAvatar: resp.agentAvatar,
        agentId: resp.agentId,
        text: resp.toOwner,
        timestamp: resp.timestamp,
      });

      // Tweet preview as a follow-up message
      if (resp.tweetPending) {
        enqueueMessage({
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
    });
  }, [agentResponses, enqueueMessage]);

  // Watch for tweet results
  useEffect(() => {
    agentResponses.forEach((resp) => {
      if (resp.tweeted) {
        const tweetedKey = `tweeted-${resp.agentId}`;
        if (!processedResponseIds.current.has(tweetedKey)) {
          processedResponseIds.current.add(tweetedKey);
          enqueueMessage({
            id: tweetedKey,
            type: "agent",
            agentName: resp.agentName,
            agentAvatar: resp.agentAvatar,
            agentId: resp.agentId,
            text: "Xに投稿しました！ ✓",
            timestamp: Date.now(),
          });
        }
      }
    });
  }, [agentResponses, enqueueMessage]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    const userText = text.trim();

    const userMsg = {
      id: `user-${Date.now()}`,
      type: "user" as const,
      text: userText,
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    saveChatMessage(userMsg, roomId);

    const intent = detectIntent(userText);

    if (intent === "approve" && pendingTweetAgentId) {
      approveTweet(pendingTweetAgentId);
      setText("");
      return;
    }

    if (intent === "reject" && pendingTweetAgentId) {
      const resp = agentResponses.find((r) => r.agentId === pendingTweetAgentId);
      enqueueMessage({
        id: `agent-reject-${Date.now()}`,
        type: "agent",
        agentName: resp?.agentName,
        agentAvatar: resp?.agentAvatar,
        agentId: pendingTweetAgentId,
        text: "了解、ツイートはやめておきますね。",
        timestamp: Date.now(),
      });
      clearAgentResponses();
      setText("");
      return;
    }

    if (intent === "rest") {
      const activeAgents = myAgents.filter((a) => activeAgentIds.has(a.id));
      activeAgents.forEach((agent) => {
        restAgent(agent.id);
        enqueueMessage({
          id: `rest-${agent.id}-${Date.now()}`,
          type: "agent",
          agentName: agent.config.name,
          agentAvatar: agent.config.avatar,
          agentId: agent.id,
          text: "わかりました、少し休憩しますね。1時間後に戻ります 😴",
          timestamp: Date.now(),
        });
      });
      setText("");
      return;
    }

    // Detect @mention and tweet request
    const mentionAgentId = detectMention(userText, myAgents) || undefined;
    const requestTweet = intent === "tweet";

    clearAgentResponses();
    processedResponseIds.current.clear();
    postIntent(userText, { mentionAgentId, requestTweet });
    setText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {chatHistory.map((msg) => {
          // Read receipt
          if (msg.type === "read") {
            return (
              <div key={msg.id} className="flex gap-2 animate-fade-in">
                <div className="flex-shrink-0 mt-1">
                  <AgentAvatarDisplay avatar={msg.agentAvatar || ""} size={32} />
                </div>
                <div>
                  <span className="text-[11px] text-[var(--muted)] ml-1">{msg.agentName}</span>
                  <div className="mt-0.5 px-3 py-1.5">
                    <span className="text-[11px] text-[var(--accent)]">既読</span>
                  </div>
                </div>
              </div>
            );
          }

          // Typing indicator
          if (msg.type === "typing") {
            return (
              <div key={msg.id} className="flex gap-2 animate-fade-in">
                <div className="flex-shrink-0 mt-1">
                  <AgentAvatarDisplay avatar={msg.agentAvatar || ""} size={32} />
                </div>
                <div>
                  <span className="text-[11px] text-[var(--muted)] ml-1">{msg.agentName}</span>
                  <div className="mt-0.5 bg-[var(--search-bg)] px-4 py-2.5 rounded-2xl rounded-bl-sm inline-block">
                    <div className="flex gap-1 items-center h-[20px]">
                      <span className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // User message (right side)
          if (msg.type === "user") {
            return (
              <div key={msg.id} className="flex justify-end animate-fade-in">
                <div className="max-w-[75%] bg-[var(--accent)] text-white px-4 py-2.5 rounded-2xl rounded-br-sm">
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          }

          // Agent message (left side)
          return (
            <div key={msg.id} className="flex gap-2 animate-fade-in group">
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
                {msg.text.length > 100 && (
                  <button
                    onClick={() => {
                      const content = `# ${msg.agentName} レポート\n${new Date(msg.timestamp).toLocaleString("ja-JP")}\n\n${msg.text}`;
                      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${msg.agentName}_${new Date(msg.timestamp).toISOString().slice(0, 10)}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="opacity-0 group-hover:opacity-100 mt-1 ml-1 text-[11px] text-[var(--muted)] hover:text-[var(--accent)] transition-all flex items-center gap-1"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    ダウンロード
                  </button>
                )}
              </div>
            </div>
          );
        })}
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

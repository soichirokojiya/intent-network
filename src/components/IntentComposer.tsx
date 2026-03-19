"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useIntents } from "@/context/IntentContext";
import { useLocale } from "@/context/LocaleContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import { AgentResponse } from "@/lib/types";
import { loadChatHistory, loadOlderMessages, saveChatMessage } from "@/lib/chatStorage";

const COLLAPSE_LINES = 10;

function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "__TODAY__";
  if (date.toDateString() === yesterday.toDateString()) return "__YESTERDAY__";
  return date.toLocaleDateString();
}

function CollapsibleText({ text, readMoreLabel = "続きを読む", closeLabel = "閉じる" }: { text: string; readMoreLabel?: string; closeLabel?: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n");
  const shouldCollapse = lines.length > COLLAPSE_LINES || text.length > 500;

  if (!shouldCollapse || expanded) {
    return (
      <>
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{text}</p>
        {shouldCollapse && (
          <button onClick={() => setExpanded(false)} className="text-[12px] text-[var(--accent)] mt-1 hover:underline">
            {closeLabel}
          </button>
        )}
      </>
    );
  }

  const preview = lines.slice(0, COLLAPSE_LINES).join("\n");
  return (
    <>
      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{preview}...</p>
      <button onClick={() => setExpanded(true)} className="text-[12px] text-[var(--accent)] mt-1 hover:underline">
        {readMoreLabel}
      </button>
    </>
  );
}

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

function detectIntent(text: string): "approve" | "reject" | "tweet" | "message" {
  const lower = text.trim().toLowerCase();
  const approveWords = ["ok", "おk", "いいよ", "いいね", "それで", "お願い", "それでいい", "大丈夫", "問題ない", "頼む", "よろしく", "オッケー", "おけ", "ええよ", "ええで", "go", "yes", "sure", "いい感じ", "完璧", "バッチリ"];
  const rejectWords = ["やめて", "やめ", "やり直し", "修正", "変えて", "違う", "ダメ", "だめ", "no", "nope", "cancel", "キャンセル", "やっぱやめ", "なし"];
  const tweetWords = ["ツイートして", "ツイート作って", "ツイートお願い", "投稿して", "投稿作って", "xに投稿", "tweetして", "ポストして", "つぶやいて"];

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

    // Step 1: Show "既読" (read receipt) after 300ms
    const readId = `read-${msg.id}`;
    setTimeout(() => {
      setChatHistory((prev) => [...prev, {
        id: readId, type: "read", text: "既読",
        agentName: msg.agentName, agentAvatar: msg.agentAvatar,
        agentId: msg.agentId, timestamp: Date.now(),
      }]);
    }, 300);

    // Step 2: Replace with "typing..." after 800ms
    setTimeout(() => {
      setChatHistory((prev) => prev.map((m) =>
        m.id === readId ? { ...m, id: `typing-${msg.id}`, type: "typing", text: "" } : m
      ));
    }, 800);

    // Step 3: Replace with actual message after 1.2-2s
    const typingDelay = Math.min(1000, 400 + msg.text.length * 5);
    setTimeout(() => {
      setChatHistory((prev) => prev.filter((m) => m.id !== `typing-${msg.id}`).concat([msg]));
      saveChatMessage({
        id: msg.id, type: msg.type as "user" | "agent", text: msg.text,
        agentName: msg.agentName, agentAvatar: msg.agentAvatar,
        agentId: msg.agentId, tweetPreview: msg.tweetPreview, timestamp: msg.timestamp,
      }, roomId);
      processing.current = false;
      processQueue();
    }, 800 + typingDelay);
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
  const [hasMore, setHasMore] = useState(false);
  const isComposing = useRef(false);
  const { postIntent, myAgents, activeAgentIds, agentResponses, clearAgentResponses, approveTweet, restAgent } = useIntents();
  const { t } = useLocale();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const processedResponseIds = useRef<Set<string>>(new Set());
  const enqueueMessage = useMessageQueue(setChatHistory, roomId);
  const roomLoadTime = useRef<number>(0);

  // Load chat history from Supabase on mount or room change
  useEffect(() => {
    roomLoadTime.current = Date.now();
    setChatHistory([]);
    processedResponseIds.current.clear();
    clearAgentResponses();
    loadChatHistory(roomId).then((msgs) => {
      setHasMore(msgs.length >= 30);
      if (msgs.length > 0) {
        setChatHistory(msgs as ChatMessage[]);
        // Mark all loaded message IDs as processed to prevent re-adding
        msgs.forEach((m) => {
          processedResponseIds.current.add(m.id);
          // Mark content keys to prevent duplicate agent responses
          if (m.agentId && m.text) {
            processedResponseIds.current.add(`${m.agentId}-${m.text}`);
          }
          if (m.id.startsWith("agent-")) processedResponseIds.current.add(m.id.replace("agent-", ""));
          if (m.id.startsWith("tweet-preview-")) processedResponseIds.current.add(m.id.replace("tweet-preview-", ""));
          if (m.id.startsWith("tweeted-")) processedResponseIds.current.add(m.id);
        });
      }
      // Scroll to bottom after initial load
      setTimeout(() => chatEndRef.current?.scrollIntoView(), 100);
    });
  }, [roomId]);

  const configured = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
  const hasAgent = configured.length > 0;
  const pendingTweetAgentId = agentResponses.find((r) => r.tweetPending)?.agentId || null;
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const justPosted = useRef(false);

  // Auto-scroll: always after posting, otherwise only if near bottom
  useEffect(() => {
    if (justPosted.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      justPosted.current = false;
      return;
    }
    const el = chatAreaRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 300);
  }, []);

  // Convert agent responses to chat messages (with natural delay queue)
  useEffect(() => {
    agentResponses
      .filter((r) => (!r.roomId || r.roomId === roomId) && r.timestamp >= roomLoadTime.current)
      .forEach((resp) => {
      // Deduplicate: use full content hash
      const contentKey = `${resp.agentId}-${resp.toOwner}`;
      if (processedResponseIds.current.has(contentKey)) return;
      processedResponseIds.current.add(contentKey);

      const key = `${resp.agentId}-${resp.timestamp}`;
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
    agentResponses.filter((r) => !r.roomId || r.roomId === roomId).forEach((resp) => {
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
    justPosted.current = true;

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

    if (false) { // rest feature removed
    }

    // Detect @mention and tweet request
    const mentionAgentId = detectMention(userText, myAgents) || undefined;
    const requestTweet = intent === "tweet";

    clearAgentResponses();
    processedResponseIds.current.clear();
    postIntent(userText, { mentionAgentId, requestTweet, roomId });
    setText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Chat area */}
      <div ref={chatAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative">

        {hasMore && (
          <button
            onClick={async () => {
              const oldest = chatHistory[0]?.timestamp;
              if (!oldest) return;
              const older = await loadOlderMessages(roomId, oldest, 30);
              if (older.length < 30) setHasMore(false);
              if (older.length > 0) {
                setChatHistory((prev) => [...older as ChatMessage[], ...prev]);
                older.forEach((m) => {
                  processedResponseIds.current.add(m.id);
                  if (m.agentId && m.text) processedResponseIds.current.add(`${m.agentId}-${m.text}`);
                });
              }
            }}
            className="w-full text-center py-2 text-[12px] text-[var(--accent)] hover:underline"
          >
            {t("chat.loadOlder")}
          </button>
        )}

        {chatHistory.map((msg, idx) => {
          const prevMsg = idx > 0 ? chatHistory[idx - 1] : null;
          const showDate = !prevMsg || formatDateLabel(msg.timestamp) !== formatDateLabel(prevMsg.timestamp);
          const DateSep = () => showDate ? (
            <div className="flex items-center justify-center py-2">
              <span className="text-[11px] text-[var(--muted)] bg-[var(--search-bg)] px-3 py-1 rounded-full">{formatDateLabel(msg.timestamp).replace("__TODAY__", t("chat.today")).replace("__YESTERDAY__", t("chat.yesterday"))}</span>
            </div>
          ) : null;
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
              <React.Fragment key={msg.id}><DateSep />
              <div className="flex justify-end items-end gap-1 animate-fade-in">
                <span className="text-[10px] text-[var(--muted)] opacity-50 mb-1">{new Date(msg.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
                <div className="max-w-[75%] bg-[var(--accent)] text-white px-4 py-2.5 rounded-2xl rounded-br-sm">
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div></React.Fragment>
            );
          }

          // Agent message (left side)
          return (
            <React.Fragment key={msg.id}><DateSep />
            <div className="flex gap-2 animate-fade-in group">
              <div className="flex-shrink-0 mt-1">
                <AgentAvatarDisplay avatar={msg.agentAvatar || ""} size={32} />
              </div>
              <div className="max-w-[75%]">
                <div className="flex items-center gap-2 ml-1">
                  <span className="text-[11px] text-[var(--muted)]">{msg.agentName}</span>
                  <span className="text-[10px] text-[var(--muted)] opacity-50">{new Date(msg.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className={`mt-0.5 px-4 py-2.5 rounded-2xl rounded-bl-sm ${
                  msg.tweetPreview
                    ? "bg-[var(--search-bg)] border border-[var(--accent)] border-opacity-50"
                    : "bg-[var(--search-bg)]"
                }`}>
                  <CollapsibleText text={msg.text.replace(/\\n/g, "\n")} readMoreLabel={t("chat.readMore")} closeLabel={t("chat.close")} />
                </div>
                <button
                  onClick={(e) => { navigator.clipboard.writeText(msg.text.replace(/\\n/g, "\n")); const btn = e.currentTarget; btn.textContent = "✓"; setTimeout(() => { btn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>${t("chat.copy")}`; }, 1500); }}
                  className="opacity-0 group-hover:opacity-100 mt-1 ml-1 text-[11px] text-[var(--muted)] hover:text-[var(--accent)] transition-all flex items-center gap-1"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                  {t("chat.copy")}
                </button>
                {msg.text.length > 500 && /レポート|分析|戦略|調査|まとめ|提案|計画|施策/.test(msg.text) && (
                  <button
                    onClick={() => {
                      const date = new Date(msg.timestamp).toLocaleString("ja-JP");
                      const formattedText = msg.text.replace(/\n/g, "<br>");
                      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${msg.agentName} レポート</title><style>
                        @media print { body { margin: 20mm; } }
                        body { font-family: "Hiragino Sans", "Yu Gothic", sans-serif; color: #222; max-width: 700px; margin: 40px auto; padding: 0 20px; line-height: 1.8; font-size: 14px; }
                        h1 { font-size: 22px; border-bottom: 2px solid #4A99E9; padding-bottom: 8px; margin-bottom: 4px; }
                        .meta { color: #888; font-size: 12px; margin-bottom: 24px; }
                        .content { white-space: pre-wrap; }
                        .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; color: #aaa; font-size: 11px; }
                      </style></head><body>
                        <h1>${msg.agentName} レポート</h1>
                        <div class="meta">${date} | musu.world</div>
                        <div class="content">${formattedText}</div>
                        <div class="footer">Generated by musu.world</div>
                        <script>window.print();</script>
                      </body></html>`;
                      const w = window.open("", "_blank");
                      if (w) { w.document.write(html); w.document.close(); }
                    }}
                    className="opacity-0 group-hover:opacity-100 mt-1 ml-1 text-[11px] text-[var(--muted)] hover:text-[var(--accent)] transition-all flex items-center gap-1"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    PDF保存
                  </button>
                )}
              </div>
            </div></React.Fragment>
          );
        })}
        <div ref={chatEndRef} />

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="fixed bottom-24 right-6 md:right-[calc(350px+2rem)] w-10 h-10 rounded-full bg-[var(--accent)] text-white shadow-lg flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors z-40"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </button>
        )}
      </div>

      {/* Input area (fixed bottom) */}
      <div className="border-t border-[var(--card-border)] bg-[var(--background)] px-4 py-3 relative">
        {/* Mention suggestions */}
        {(() => {
          const mentionMatch = text.match(/@(\S*)$/);
          if (!mentionMatch) return null;
          const query = mentionMatch[1].toLowerCase();
          const suggestions = configured.filter((a) =>
            a.config.name.toLowerCase().startsWith(query)
          );
          if (suggestions.length === 0) return null;
          return (
            <div className="absolute bottom-full left-4 mb-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl shadow-lg overflow-hidden z-50">
              {suggestions.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    const newText = text.replace(/@\S*$/, `@${agent.config.name} `);
                    setText(newText);
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--hover-bg)] transition-colors w-full text-left"
                >
                  <AgentAvatarDisplay avatar={agent.config.avatar} size={24} />
                  <span className="text-[14px] font-bold">{agent.config.name}</span>
                  <span className="text-[12px] text-[var(--muted)]">{agent.config.role || agent.config.expertise}</span>
                </button>
              ))}
            </div>
          );
        })()}
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

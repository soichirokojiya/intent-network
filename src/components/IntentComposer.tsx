"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useIntents } from "@/context/IntentContext";
import { useLocale } from "@/context/LocaleContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import { AgentResponse } from "@/lib/types";
import { loadChatHistory, loadOlderMessages, saveChatMessage } from "@/lib/chatStorage";
import { useAuth } from "@/context/AuthContext";

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

function LinkifyText({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s<>]+)/g;
  const parts = text.split(urlRegex);
  return (
    <p className="text-[14px] leading-snug whitespace-pre-wrap">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline break-all">{part}</a>
        ) : part
      )}
    </p>
  );
}

function CollapsibleText({ text, readMoreLabel = "Read more", closeLabel = "Close" }: { text: string; readMoreLabel?: string; closeLabel?: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n");
  const shouldCollapse = lines.length > COLLAPSE_LINES || text.length > 500;

  if (!shouldCollapse || expanded) {
    return (
      <>
        <LinkifyText text={text} />
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
      <LinkifyText text={preview + "..."} />
      <button onClick={() => setExpanded(true)} className="text-[12px] text-[var(--accent)] mt-1 hover:underline">
        {readMoreLabel}
      </button>
    </>
  );
}

const FILE_PATTERN = /\[ファイル: (.+?)\]\((.+?)\)/g;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

function ChatMessageText({ text, readMoreLabel, closeLabel }: { text: string; readMoreLabel?: string; closeLabel?: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /\[ファイル: (.+?)\]\((.+?)\)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      parts.push(<CollapsibleText key={`t-${lastIndex}`} text={before} readMoreLabel={readMoreLabel} closeLabel={closeLabel} />);
    }
    const fileName = match[1];
    const url = match[2];
    const isImage = IMAGE_EXTENSIONS.test(fileName);

    parts.push(
      <div key={`f-${match.index}`} className="my-1">
        {isImage && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt={fileName} className="max-w-[240px] max-h-[180px] rounded-lg mb-1 cursor-pointer hover:opacity-80 transition-opacity" />
          </a>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[13px] text-[var(--accent)] hover:underline"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          {fileName}
        </a>
      </div>
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    parts.push(<CollapsibleText key={`t-${lastIndex}`} text={text.slice(lastIndex)} readMoreLabel={readMoreLabel} closeLabel={closeLabel} />);
  }

  // No file links found - just use CollapsibleText
  if (parts.length === 0) {
    return <CollapsibleText text={text} readMoreLabel={readMoreLabel} closeLabel={closeLabel} />;
  }

  return <>{parts}</>;
}

const INTRO_MAP: Record<string, (name: string) => string> = {
  "オーケストレーター": (n) => `${n}です。チームのまとめ役やってます。何でも気軽に投げてください、適任のメンバーに回しますね。`,
  "マーケティング": (n) => `どうも、${n}です！「どうやって届けるか」を考えるのが好きなタイプです。`,
  "リサーチ": (n) => `${n}といいます。気になることがあったら調べてきますよ。根拠のない話は苦手なので。`,
  "哲学者": (n) => `${n}です。みんなが走り出す前に「ちょっと待って、それ本当に合ってる？」って聞く係です。`,
  "ストラテジスト": (n) => `${n}です。目先の施策より「半年後にどうなっていたいか」から考えるタイプです。よろしく。`,
  "クリエイティブ": (n) => `${n}です！ぱっと見で伝わる表現とか、意外な切り口を考えるの得意です。`,
  "ファイナンス": (n) => `${n}です。いい話には必ず数字の裏付けをつけます。`,
  "秘書": (n) => `${n}です。スケジュールやタスクの整理、お任せください。先回りして動きます。`,
  "開発者": (n) => `${n}です。技術的にどう実現するか、一緒に考えましょう。`,
  "データサイエンティスト": (n) => `${n}です。データから答えを見つけるのが得意です。よろしくお願いします。`,
};

function TypingBubble({ avatar, name }: { avatar: string; name: string }) {
  return (
    <div className="flex gap-2 animate-fade-in">
      <div className="flex-shrink-0 mt-1">
        <AgentAvatarDisplay avatar={avatar} size={32} />
      </div>
      <div>
        <span className="text-[11px] text-[var(--muted)] ml-1">{name}</span>
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

function WelcomeSequence({ agents, onMessageShown }: { agents: { id: string; config: { name: string; avatar: string; role: string; expertise: string } }[]; onMessageShown?: (msg: { text: string; agentName: string; agentAvatar: string; agentId: string }) => void }) {
  const [step, setStep] = useState(-1);
  const [shown, setShown] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);

  const orchestrator = agents.find((a) => a.config.role === "オーケストレーター" || a.config.expertise === "オーケストレーター") || agents[0];
  const otherAgents = agents.filter((a) => a.id !== orchestrator.id);

  const memberList = otherAgents.map((a) => {
    const role = a.config.role || a.config.expertise || "";
    return `${a.config.name}（${role}）`;
  }).join("、");

  const messages = [
    `はじめまして、${orchestrator.config.name}です。あなた専属チームのリーダーです。\nここにいる全員があなたの仕事仲間です。何でも気軽に話しかけてください。`,
    `メンバーを紹介します。\n${memberList}\nチーム編成は自由にカスタマイズできます。メンバーの追加・削除・役割変更はいつでも可能です。`,
    `まずはプロフィールを完成させてください。事業内容を入れると、チーム全員があなたの事業を理解した上で動けるようになります。\n@をつければ特定のメンバーに直接話せます。\n「ニュースを7時と18時に送って」「予定を毎朝8時に教えて」のように話しかければ、秘書が対応します。\nGoogleカレンダーやTrelloとの連携もできます。アプリ連携から設定してみてください。`,
  ];

  useEffect(() => {
    const t0 = setTimeout(() => setStep(0), 500);
    return () => clearTimeout(t0);
  }, []);

  useEffect(() => {
    if (step < 0 || step >= messages.length) return;
    const pauseDelay = step === 0 ? 400 : 800 + Math.random() * 500;
    const t1 = setTimeout(() => {
      setTyping(true);
      const typingDelay = 1200 + Math.random() * 800;
      const t2 = setTimeout(() => {
        setTyping(false);
        setShown((prev) => [...prev, step]);
        // Save to DB when message is shown
        if (onMessageShown) {
          onMessageShown({
            text: messages[step],
            agentName: orchestrator.config.name,
            agentAvatar: orchestrator.config.avatar,
            agentId: orchestrator.id,
          });
        }
        setStep(step + 1);
      }, typingDelay);
      return () => clearTimeout(t2);
    }, pauseDelay);
    return () => clearTimeout(t1);
  }, [step, messages.length]);

  return (
    <div className="space-y-3 py-4">
      {messages.map((msg, i) => {
        const isTyping = step === i && typing;
        const isVisible = shown.includes(i);

        if (!isTyping && !isVisible) return null;

        if (isTyping) {
          return <TypingBubble key={`typing-${i}`} avatar={orchestrator.config.avatar} name={orchestrator.config.name} />;
        }

        return (
          <div key={`welcome-${i}`} className="flex gap-2 animate-fade-in">
            <div className="flex-shrink-0 mt-1">
              <AgentAvatarDisplay avatar={orchestrator.config.avatar} size={32} />
            </div>
            <div className="max-w-[75%]">
              <span className="text-[11px] text-[var(--muted)]">{orchestrator.config.name}</span>
              <div className="mt-0.5 px-4 py-2.5 rounded-2xl rounded-bl-sm bg-[var(--search-bg)]">
                <p className="text-[14px] leading-snug whitespace-pre-wrap">{msg}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
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

// Detect delivery time setting intent from chat message
function detectDeliveryIntent(text: string): { action: "set_times"; times: string[] } | { action: "disable" } | null {
  // Check for disable/stop patterns
  if (/ニュース.*(止め|やめ|停止|オフ|off)|配信.*(止め|やめ|停止|オフ|off)|ニュース.*なし/i.test(text)) {
    return { action: "disable" };
  }
  // Extract times like "7時" "18時" "07:00"
  const timeMatches: string[] = [];
  // Match patterns like "7時", "18時", "朝7時", "夜8時"
  const hourRegex = /(\d{1,2})時/g;
  let match;
  while ((match = hourRegex.exec(text)) !== null) {
    const hour = parseInt(match[1], 10);
    if (hour >= 0 && hour <= 23) {
      timeMatches.push(hour.toString().padStart(2, "0") + ":00");
    }
  }
  // Match HH:MM patterns
  const hmRegex = /(\d{1,2}):(\d{2})/g;
  while ((match = hmRegex.exec(text)) !== null) {
    const hour = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
      timeMatches.push(hour.toString().padStart(2, "0") + ":" + min.toString().padStart(2, "0"));
    }
  }
  // Only trigger if message mentions news/delivery context
  if (timeMatches.length > 0 && /(ニュース|配信|送って|届けて|通知)/i.test(text)) {
    // Deduplicate
    const unique = [...new Set(timeMatches)];
    return { action: "set_times", times: unique };
  }
  return null;
}

// Detect news topic customization from chat message
function detectNewsTopicIntent(text: string): { action: "set_topics"; topics: string } | null {
  // Match patterns like "ニュースは〜にして", "〜のニュースを送って", "ニュースのジャンルを〜に"
  const patterns = [
    /ニュース.*(?:を|は|の)(.+?)(?:にして|に変えて|にしたい|がいい|が欲しい|を送って|を届けて|多めに|中心に|メインで|重視して)/,
    /(.+?)(?:のニュース|関連ニュース|系のニュース).*(?:送って|届けて|欲しい|にして|多めに|中心に)/,
    /ニュース.*(?:ジャンル|トピック|テーマ|カテゴリ).*(?:を|は)(.+?)(?:に|で)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      return { action: "set_topics", topics: m[1].trim() };
    }
  }
  return null;
}

// Detect schedule delivery time setting from chat message
function detectScheduleIntent(text: string): { action: "set_schedule_times"; times: string[] } | { action: "disable_schedule" } | null {
  if (/予定.*(止め|やめ|停止|オフ|off)|スケジュール.*(止め|やめ|停止|オフ|off)/i.test(text)) {
    return { action: "disable_schedule" };
  }
  const timeMatches: string[] = [];
  const hourRegex = /(\d{1,2})時/g;
  let match;
  while ((match = hourRegex.exec(text)) !== null) {
    const hour = parseInt(match[1], 10);
    if (hour >= 0 && hour <= 23) {
      timeMatches.push(hour.toString().padStart(2, "0") + ":00");
    }
  }
  const hmRegex = /(\d{1,2}):(\d{2})/g;
  while ((match = hmRegex.exec(text)) !== null) {
    const hour = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
      timeMatches.push(hour.toString().padStart(2, "0") + ":" + min.toString().padStart(2, "0"));
    }
  }
  if (timeMatches.length > 0 && /(予定|スケジュール|カレンダー)/i.test(text)) {
    const unique = [...new Set(timeMatches)];
    return { action: "set_schedule_times", times: unique };
  }
  return null;
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
  const { user } = useAuth();
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replyTo, setReplyTo] = useState<{ agentName: string; text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Load chat history from Supabase on mount or room change
  useEffect(() => {
    roomLoadTime.current = Date.now();
    setChatHistory([]);
    processedResponseIds.current.clear();
    clearAgentResponses();
    loadChatHistory(roomId).then((rawMsgs) => {
      // Filter out old welcome messages (now handled by UI)
      const msgs = rawMsgs.filter((m) => !m.text?.startsWith("はじめまして！チームリーダー"));
      setHasMore(rawMsgs.length >= 30);
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
          text: `${t("chat.tweetConfirm")}\n\n「${resp.toTimeline}」`,
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
            text: t("chat.tweetPosted"),
            timestamp: Date.now(),
          });
        }
      }
    });
  }, [agentResponses, enqueueMessage]);

  const handleSubmit = async () => {
    if (!text.trim() && !attachedFile) return;
    let userText = text.trim();

    // Upload file if attached
    if (attachedFile && user) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", attachedFile);
        formData.append("userId", user.id);
        const res = await fetch("/api/upload-file", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          const fileTag = `[ファイル: ${attachedFile.name}](${data.url})`;
          userText = userText ? `${userText}\n${fileTag}` : fileTag;
        } else {
          alert(data.error || t("chat.uploadFailed"));
          setUploading(false);
          return;
        }
      } catch {
        alert(t("chat.uploadFailed"));
        setUploading(false);
        return;
      }
      setUploading(false);
      setAttachedFile(null);
    }

    if (!userText) return;

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
        text: t("chat.tweetCancelled"),
        timestamp: Date.now(),
      });
      clearAgentResponses();
      setText("");
      return;
    }

    if (false) { // rest feature removed
    }

    // Detect delivery time setting from chat
    const deliveryIntent = detectDeliveryIntent(userText);
    if (deliveryIntent && user) {
      const deviceId = user.id;
      try {
        const res = await fetch("/api/delivery-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, ...deliveryIntent }),
        });
        const data = await res.json();
        // Show confirmation as a system-like agent message
        const firstAgent = configured[0];
        const confirmText = deliveryIntent.action === "disable"
          ? "ニュース配信をオフにしました。"
          : `ニュース配信時間を ${(deliveryIntent as { action: "set_times"; times: string[] }).times.join("、")} に設定しました。`;
        if (firstAgent) {
          enqueueMessage({
            id: `delivery-confirm-${Date.now()}`,
            type: "agent",
            agentName: firstAgent.config.name,
            agentAvatar: firstAgent.config.avatar,
            agentId: firstAgent.id,
            text: data.ok ? confirmText : `設定エラー: ${data.error || "不明"}`,
            timestamp: Date.now(),
          });
        }
      } catch {
        // Silently fail, user can retry
      }
      setText("");
      setReplyTo(null);
      return;
    }

    // Detect schedule delivery time setting from chat
    const scheduleIntent = detectScheduleIntent(userText);
    if (scheduleIntent) {
      const deviceId = localStorage.getItem("musu_device_id") || "";
      if (deviceId) {
        try {
          const body = scheduleIntent.action === "disable_schedule"
            ? { deviceId, action: "disable_schedule" }
            : { deviceId, action: "set_schedule_times", times: (scheduleIntent as { action: "set_schedule_times"; times: string[] }).times };
          const res = await fetch("/api/delivery-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          const firstAgent = configured[0];
          const confirmText = scheduleIntent.action === "disable_schedule"
            ? "予定配信をオフにしました。"
            : `予定の配信時間を ${(scheduleIntent as { action: "set_schedule_times"; times: string[] }).times.join("、")} に設定しました。`;
          if (firstAgent) {
            enqueueMessage({
              id: `schedule-confirm-${Date.now()}`,
              type: "agent",
              agentName: firstAgent.config.name,
              agentAvatar: firstAgent.config.avatar,
              agentId: firstAgent.id,
              text: data.ok ? confirmText : `設定エラー: ${data.error || "不明"}`,
              timestamp: Date.now(),
            });
          }
        } catch {}
        setText("");
        setReplyTo(null);
        return;
      }
    }

    // Detect news topic customization from chat
    const topicIntent = detectNewsTopicIntent(userText);
    if (topicIntent && user) {
      const deviceId = user.id;
      try {
        const res = await fetch("/api/delivery-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, ...topicIntent }),
        });
        const data = await res.json();
        const firstAgent = configured[0];
        if (firstAgent) {
          enqueueMessage({
            id: `topic-confirm-${Date.now()}`,
            type: "agent",
            agentName: firstAgent.config.name,
            agentAvatar: firstAgent.config.avatar,
            agentId: firstAgent.id,
            text: data.ok ? `ニュースのトピックを「${topicIntent.topics}」に設定しました。次回の配信から反映されます。` : `設定エラー: ${data.error || "不明"}`,
            timestamp: Date.now(),
          });
        }
      } catch {
        // Silently fail
      }
      setText("");
      setReplyTo(null);
      return;
    }

    // Detect @mention and tweet request
    const mentionAgentId = detectMention(userText, myAgents) || undefined;
    const requestTweet = intent === "tweet";

    clearAgentResponses();
    processedResponseIds.current.clear();
    postIntent(userText, { mentionAgentId, requestTweet, roomId });
    setText("");
    setReplyTo(null);
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

        {/* Welcome sequence: show when no chat history */}
        {chatHistory.length === 0 && configured.length > 0 && (
          <WelcomeSequence
            agents={configured}
            onMessageShown={(msg) => {
              const ts = Date.now();
              const id = `welcome-${ts}-${Math.random().toString(36).slice(2, 6)}`;
              const chatMsg: ChatMessage = {
                id, type: "agent",
                agentName: msg.agentName, agentAvatar: msg.agentAvatar,
                agentId: msg.agentId, text: msg.text, timestamp: ts,
              };
              setChatHistory((prev) => [...prev, chatMsg]);
              saveChatMessage({ id, type: "agent" as const, text: msg.text, agentName: msg.agentName, agentAvatar: msg.agentAvatar, agentId: msg.agentId, timestamp: ts }, roomId);
            }}
          />
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
                    <span className="text-[11px] text-[var(--accent)]">{t("chat.read")}</span>
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
            // Check if next message is from an agent (= this message was "read")
            const nextMsg = idx < chatHistory.length - 1 ? chatHistory[idx + 1] : null;
            const wasRead = nextMsg && nextMsg.type === "agent";
            return (
              <React.Fragment key={msg.id}><DateSep />
              <div className="flex justify-end items-end gap-1 animate-fade-in">
                <div className="flex flex-col items-end gap-0.5">
                  {wasRead && <span className="text-[10px] text-[var(--accent)]">{t("chat.read")}</span>}
                  <span className="text-[10px] text-[var(--muted)] opacity-50">{new Date(msg.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="max-w-[75%] bg-[var(--accent)] text-white px-4 py-2.5 rounded-2xl rounded-br-sm">
                  <ChatMessageText text={msg.text} />
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
                  <ChatMessageText text={msg.text.replace(/\\n/g, "\n").replace(/<cite[^>]*>|<\/cite>/g, "")} readMoreLabel={t("chat.readMore")} closeLabel={t("chat.close")} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 mt-1 ml-1 flex items-center gap-3">
                  <button
                    onClick={(e) => { navigator.clipboard.writeText(msg.text.replace(/\\n/g, "\n")); const btn = e.currentTarget; btn.textContent = "✓"; setTimeout(() => { btn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>${t("chat.copy")}`; }, 1500); }}
                    className="text-[11px] text-[var(--muted)] hover:text-[var(--accent)] transition-all flex items-center gap-1"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    {t("chat.copy")}
                  </button>
                  <button
                    onClick={() => {
                      setReplyTo({ agentName: msg.agentName || "", text: msg.text.replace(/\\n/g, "\n").slice(0, 50) });
                      setText(`@${msg.agentName} `);
                      textareaRef.current?.focus();
                    }}
                    className="text-[11px] text-[var(--muted)] hover:text-[var(--accent)] transition-all flex items-center gap-1"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                    {t("chat.reply")}
                  </button>
                </div>
                {false && (
                  <button
                    onClick={() => {
                      const date = new Date(msg.timestamp).toLocaleString();
                      const formattedText = msg.text.replace(/\n/g, "<br>");
                      const reportLabel = "Report";
                      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${msg.agentName} ${reportLabel}</title><style>
                        body { font-family: sans-serif; }
                      </style></head><body>
                        <h1>${msg.agentName} ${reportLabel}</h1>
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
                    {t("chat.savePdf")}
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
                    setTimeout(() => {
                      const ta = textareaRef.current;
                      if (ta) { ta.focus(); ta.selectionStart = ta.selectionEnd = newText.length; }
                    }, 0);
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
        {/* Reply quote */}
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-[var(--search-bg)] rounded-xl text-[13px] border-l-2 border-[var(--accent)]">
            <div className="flex-1 min-w-0">
              <span className="font-bold text-[var(--accent)]">{replyTo.agentName}</span>
              <span className="text-[var(--muted)] ml-2 truncate">{replyTo.text}...</span>
            </div>
            <button onClick={() => { setReplyTo(null); setText(""); }} className="text-[var(--muted)] hover:text-red-500 flex-shrink-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {/* File attachment preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-[var(--search-bg)] rounded-xl text-[13px]">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[var(--accent)]">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
            <span className="truncate flex-1">{attachedFile.name}</span>
            <span className="text-[11px] text-[var(--muted)] flex-shrink-0">{(attachedFile.size / 1024).toFixed(0)}KB</span>
            <button onClick={() => setAttachedFile(null)} className="text-[var(--muted)] hover:text-red-500 flex-shrink-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > 10 * 1024 * 1024) {
                alert(t("chat.fileSizeLimit"));
                return;
              }
              setAttachedFile(file);
            }
            e.target.value = "";
          }}
        />
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-[var(--muted)] hover:text-[var(--accent)] p-2.5 rounded-full transition-colors flex-shrink-0 disabled:opacity-30"
            title={t("chat.attachFile")}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={hasAgent ? t("home.placeholder") : t("chat.createAgentFirst")}
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
            onClick={() => {
              if (isListening) {
                recognitionRef.current?.stop();
                setIsListening(false);
                return;
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
              if (!SR) { alert(t("chat.voiceNotSupported")); return; }
              const recognition = new SR();
              recognition.lang = "ja-JP";
              recognition.continuous = false;
              recognition.interimResults = false;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              recognition.onresult = (e: any) => {
                const transcript = e.results[0][0].transcript as string;
                setText((prev) => prev + transcript);
                setIsListening(false);
              };
              recognition.onerror = () => setIsListening(false);
              recognition.onend = () => setIsListening(false);
              recognitionRef.current = recognition;
              recognition.start();
              setIsListening(true);
            }}
            className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${isListening ? "bg-red-500 text-white animate-pulse" : "text-[var(--muted)] hover:text-[var(--accent)]"}`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <button
            onClick={handleSubmit}
            disabled={(!text.trim() && !attachedFile) || !hasAgent || uploading}
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

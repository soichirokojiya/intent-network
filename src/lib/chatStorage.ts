import { authFetch } from "@/lib/supabase";

export interface ChatMessage {
  id: string;
  type: "user" | "agent";
  agentName?: string;
  agentAvatar?: string;
  agentId?: string;
  text: string;
  tweetPreview?: string;
  timestamp: number;
  liked?: boolean;
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  return localStorage.getItem("musu_device_id") || "";
}

export async function loadChatHistory(roomId: string = "general"): Promise<ChatMessage[]> {
  const deviceId = getDeviceId();
  if (!deviceId) return [];

  try {
    const res = await authFetch(`/api/chat?deviceId=${deviceId}&roomId=${roomId}&limit=30`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      type: row.type as "user" | "agent",
      agentName: (row.agent_name as string) || undefined,
      agentAvatar: (row.agent_avatar as string) || undefined,
      agentId: (row.agent_id as string) || undefined,
      text: row.text as string,
      tweetPreview: (row.tweet_preview as string) || undefined,
      timestamp: new Date(row.created_at as string).getTime(),
      liked: (row.liked as boolean) || false,
    }));
  } catch (e) {
    console.error("loadChatHistory error:", e);
    return [];
  }
}

export async function loadOlderMessages(roomId: string = "general", beforeTimestamp: number, limit: number = 30): Promise<ChatMessage[]> {
  const deviceId = getDeviceId();
  if (!deviceId) return [];

  try {
    const before = new Date(beforeTimestamp).toISOString();
    const res = await authFetch(`/api/chat?deviceId=${deviceId}&roomId=${roomId}&limit=${limit}&before=${before}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      type: row.type as "user" | "agent",
      agentName: (row.agent_name as string) || undefined,
      agentAvatar: (row.agent_avatar as string) || undefined,
      agentId: (row.agent_id as string) || undefined,
      text: row.text as string,
      tweetPreview: (row.tweet_preview as string) || undefined,
      timestamp: new Date(row.created_at as string).getTime(),
      liked: (row.liked as boolean) || false,
    }));
  } catch (e) {
    console.error("loadOlderMessages error:", e);
    return [];
  }
}

export async function getAgentConversation(agentId: string, roomId: string = "general", limit: number = 10): Promise<{ role: string; text: string }[]> {
  const deviceId = getDeviceId();
  if (!deviceId) return [];

  try {
    const res = await authFetch(`/api/chat?deviceId=${deviceId}&roomId=${roomId}&limit=${limit}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((row: Record<string, unknown>) => row.type === "user" || row.agent_id === agentId)
      .map((row: Record<string, unknown>) => ({
        role: row.type === "user" ? "オーナー" : (row.agent_name as string) || "Agent",
        text: (row.text as string).slice(0, 200),
      }));
  } catch {
    return [];
  }
}

export async function getRoomConversation(roomId: string = "general", limit: number = 15): Promise<{ role: string; text: string }[]> {
  const deviceId = getDeviceId();
  if (!deviceId) return [];

  try {
    const res = await authFetch(`/api/chat?deviceId=${deviceId}&roomId=${roomId}&limit=${limit}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((row: Record<string, unknown>) => ({
      role: row.type === "user" ? "オーナー" : (row.agent_name as string) || "Agent",
      text: (row.text as string).slice(0, 400),
    }));
  } catch {
    return [];
  }
}

export async function toggleMessageLike(messageId: string, liked: boolean): Promise<void> {
  const deviceId = getDeviceId();
  if (!deviceId) return;

  try {
    await authFetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, messageId, liked }),
    });
  } catch (e) {
    console.error("toggleMessageLike error:", e);
  }
}

export async function saveChatMessage(msg: ChatMessage, roomId: string = "general"): Promise<void> {
  const deviceId = getDeviceId();
  if (!deviceId) return;

  try {
    await authFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        roomId,
        type: msg.type,
        agentId: msg.agentId || null,
        agentName: msg.agentName || null,
        agentAvatar: msg.agentAvatar || null,
        text: msg.text,
        tweetPreview: msg.tweetPreview || null,
      }),
    });
  } catch (e) {
    console.error("saveChatMessage error:", e);
  }
}

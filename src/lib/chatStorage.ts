import { supabase } from "./supabase";

export interface ChatMessage {
  id: string;
  type: "user" | "agent";
  agentName?: string;
  agentAvatar?: string;
  agentId?: string;
  text: string;
  tweetPreview?: string;
  timestamp: number;
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("musu_device_id");
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("musu_device_id", id);
  }
  return id;
}

export async function loadChatHistory(roomId: string = "general"): Promise<ChatMessage[]> {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from("owner_chats")
    .select("*")
    .eq("device_id", deviceId)
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    type: row.type as "user" | "agent",
    agentName: row.agent_name || undefined,
    agentAvatar: row.agent_avatar || undefined,
    agentId: row.agent_id || undefined,
    text: row.text,
    tweetPreview: row.tweet_preview || undefined,
    timestamp: new Date(row.created_at).getTime(),
  }));
}

// Get recent conversation for an agent (for context injection)
export async function getAgentConversation(agentId: string, roomId: string = "general", limit: number = 10): Promise<{ role: string; text: string }[]> {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from("owner_chats")
    .select("*")
    .eq("device_id", deviceId)
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  // Filter to only this agent's messages and user messages near them
  return data
    .reverse()
    .filter((row) => row.type === "user" || row.agent_id === agentId)
    .map((row) => ({
      role: row.type === "user" ? "オーナー" : row.agent_name || "Agent",
      text: row.text,
    }));
}

export async function saveChatMessage(msg: ChatMessage, roomId: string = "general"): Promise<void> {
  const deviceId = getDeviceId();
  await supabase.from("owner_chats").insert({
    device_id: deviceId,
    room_id: roomId,
    type: msg.type,
    agent_id: msg.agentId || null,
    agent_name: msg.agentName || null,
    agent_avatar: msg.agentAvatar || null,
    text: msg.text,
    tweet_preview: msg.tweetPreview || null,
  });
}

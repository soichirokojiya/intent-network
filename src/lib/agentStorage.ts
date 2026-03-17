import { supabase } from "./supabase";
import type { MyAgent } from "@/context/IntentContext";

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("musu_device_id");
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("musu_device_id", id);
  }
  return id;
}

export async function loadAgents(): Promise<{ agents: MyAgent[]; activeIds: string[] }> {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from("owner_agents")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: true });

  if (error || !data) return { agents: [], activeIds: [] };

  const agents: MyAgent[] = data.map((row) => ({
    id: row.id,
    config: row.config,
    stats: row.stats,
  }));

  const activeIds = data.filter((row) => row.is_active).map((row) => row.id);
  return { agents, activeIds };
}

export async function saveAgent(agent: MyAgent, isActive: boolean): Promise<void> {
  const deviceId = getDeviceId();
  await supabase.from("owner_agents").upsert({
    id: agent.id,
    device_id: deviceId,
    config: agent.config,
    stats: agent.stats,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteAgent(agentId: string): Promise<void> {
  await supabase.from("owner_agents").delete().eq("id", agentId);
}

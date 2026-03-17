import { supabase } from "./supabase";

export interface Room {
  id: string;
  name: string;
  createdAt: number;
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

export async function loadRooms(): Promise<Room[]> {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from("project_rooms")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    // Create default room on first load (only once)
    const defaultRoom = await createRoom("ワークスペース");
    return [defaultRoom];
  }
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

export async function createRoom(name: string): Promise<Room> {
  const deviceId = getDeviceId();
  const id = `room-${Date.now()}`;
  await supabase.from("project_rooms").insert({
    id,
    device_id: deviceId,
    name,
  });
  return { id, name, createdAt: Date.now() };
}

export async function renameRoom(roomId: string, name: string): Promise<void> {
  await supabase.from("project_rooms").update({ name }).eq("id", roomId);
}

export async function deleteRoom(roomId: string): Promise<void> {
  await supabase.from("project_rooms").delete().eq("id", roomId);
  await supabase.from("owner_chats").delete().eq("room_id", roomId);
}

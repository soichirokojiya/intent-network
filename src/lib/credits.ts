import { supabase } from "./supabase";

const MARGIN = 1.5; // 50% margin

// Opus 4 pricing per token (USD)
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-20250514": { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  "claude-haiku-4-5-20251001": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
};

const USD_TO_JPY = 150;

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("musu_device_id");
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("musu_device_id", id);
  }
  return id;
}

export function calcCostYen(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = PRICING[model] || PRICING["claude-opus-4-20250514"];
  const costUsd = inputTokens * pricing.input + outputTokens * pricing.output;
  return Math.round(costUsd * USD_TO_JPY * MARGIN * 1000) / 1000; // round to 3 decimals
}

export async function getBalance(): Promise<number> {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from("user_credits")
    .select("balance_yen")
    .eq("device_id", deviceId)
    .single();

  if (!data) {
    // Create initial credit
    await supabase.from("user_credits").insert({
      device_id: deviceId,
      balance_yen: 1000,
    });
    return 1000;
  }
  return Number(data.balance_yen);
}

export async function deductCredit(costYen: number): Promise<{ ok: boolean; balance: number }> {
  const deviceId = getDeviceId();
  const balance = await getBalance();
  if (balance < costYen) return { ok: false, balance };

  const newBalance = Math.round((balance - costYen) * 1000) / 1000;
  await supabase
    .from("user_credits")
    .update({
      balance_yen: newBalance,
      total_used_yen: balance - newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("device_id", deviceId);

  return { ok: true, balance: newBalance };
}

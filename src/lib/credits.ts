import { supabase } from "./supabase";

const MARGIN = 1.5; // 50% margin

// Pricing per token (USD)
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 5 / 1_000_000, output: 25 / 1_000_000 },
  "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
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
  const pricing = PRICING[model] || PRICING["claude-opus-4-6"];
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
    // Get initial credit amount from site_settings (default 1000)
    let initialCredit = 1000;
    try {
      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "initial_credit_yen")
        .single();
      if (setting?.value) initialCredit = Number(setting.value) || 1000;
    } catch {}
    await supabase.from("user_credits").insert({
      device_id: deviceId,
      user_id: deviceId,
      balance_yen: initialCredit,
    });
    return initialCredit;
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

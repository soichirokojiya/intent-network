import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("profiles")
    .select("news_enabled, news_time, news_times")
    .eq("id", deviceId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let times: string[] = ["07:00"];
  try {
    const parsed = data?.news_times ? JSON.parse(data.news_times) : null;
    times = Array.isArray(parsed) && parsed.length > 0 ? parsed : [data?.news_time || "07:00"];
  } catch {
    times = [data?.news_time || "07:00"];
  }

  return NextResponse.json({
    newsEnabled: data?.news_enabled ?? false,
    newsTime: data?.news_time || "07:00",
    newsTimes: times,
  });
}

export async function POST(req: Request) {
  const { deviceId, enabled, time, times } = await req.json();
  if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });

  const effectiveTimes = times || [time || "07:00"];
  const { error } = await supabase
    .from("profiles")
    .update({
      news_enabled: enabled,
      news_time: time || effectiveTimes[0],
      news_times: JSON.stringify(effectiveTimes),
      updated_at: new Date().toISOString(),
    })
    .eq("id", deviceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

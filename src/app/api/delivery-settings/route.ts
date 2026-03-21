import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { deviceId, action, times, topics } = await req.json();

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    if (!["set_times", "set_topics", "enable", "disable", "set_schedule_times", "enable_schedule", "disable_schedule"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "set_schedule_times") {
      if (!Array.isArray(times) || times.length === 0) {
        return NextResponse.json({ error: "times array required" }, { status: 400 });
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          schedule_times: JSON.stringify(times),
          schedule_delivery_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, times });
    }

    if (action === "enable_schedule") {
      const { error } = await supabase
        .from("profiles")
        .update({ schedule_delivery_enabled: true, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, enabled: true });
    }

    if (action === "disable_schedule") {
      const { error } = await supabase
        .from("profiles")
        .update({ schedule_delivery_enabled: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, enabled: false });
    }

    if (action === "set_topics") {
      if (!topics || typeof topics !== "string") {
        return NextResponse.json({ error: "topics string required" }, { status: 400 });
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          news_topics: topics,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, topics });
    }

    if (action === "set_times") {
      if (!Array.isArray(times) || times.length === 0) {
        return NextResponse.json({ error: "times array required" }, { status: 400 });
      }
      // Validate HH:MM format
      for (const t of times) {
        if (!/^\d{2}:\d{2}$/.test(t)) {
          return NextResponse.json({ error: `Invalid time format: ${t}` }, { status: 400 });
        }
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          news_times: JSON.stringify(times),
          news_time: times[0], // backward compat: keep first time in news_time
          news_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, times, enabled: true });
    }

    if (action === "enable") {
      const { error } = await supabase
        .from("profiles")
        .update({ news_enabled: true, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, enabled: true });
    }

    if (action === "disable") {
      const { error } = await supabase
        .from("profiles")
        .update({ news_enabled: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, enabled: false });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

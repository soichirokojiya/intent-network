import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all profiles that have chat messages
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id");

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ processed: 0, total: 0 });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        const baseUrl = new URL(req.url).origin;
        const res = await fetch(`${baseUrl}/api/summarize-memory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: profile.id }),
        });

        const result = await res.json();
        if (result.ok) {
          processed++;
        }
        // skipped is fine, not an error
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${profile.id}: ${msg}`);
      }
    }

    return NextResponse.json({
      processed,
      total: profiles.length,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("summarize-all cron error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

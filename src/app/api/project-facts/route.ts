import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("project_facts")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ facts: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { deviceId, category, content, sourceAgent } = await req.json();
    if (!deviceId || !category || !content) {
      return NextResponse.json({ error: "deviceId, category, content required" }, { status: 400 });
    }

    const validCategories = ["decision", "spec", "task", "policy"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: `category must be one of: ${validCategories.join(", ")}` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("project_facts")
      .insert({
        device_id: deviceId,
        category,
        content,
        source_agent: sourceAgent || "system",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ fact: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

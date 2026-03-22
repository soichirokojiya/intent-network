import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// GET: Get all settings
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("site_settings").select("key, value");
  const settings: Record<string, string> = {};
  (data || []).forEach((row) => { settings[row.key] = row.value; });

  return NextResponse.json(settings);
}

// PATCH: Update a setting
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, value } = await req.json();
  if (!key || value === undefined) return NextResponse.json({ error: "key and value required" }, { status: 400 });

  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

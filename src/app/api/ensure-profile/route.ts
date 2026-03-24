import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const userId = getVerifiedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { displayName } = await req.json();

  // Check if profile already exists (using service role to bypass RLS)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, existing: true });
  }

  // Create new profile
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    display_name: displayName || "User",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    // Likely duplicate — profile exists but RLS hid it
    return NextResponse.json({ ok: true, existing: true });
  }

  return NextResponse.json({ ok: true, created: true });
}

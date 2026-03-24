import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";
import { encrypt, decrypt } from "@/lib/crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET: List saved credentials (passwords masked)
export async function GET(req: NextRequest) {
  const userId = getVerifiedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("saved_credentials")
    .select("id, site_name, site_url, notes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ credentials: data });
}

// POST: Save new credential
export async function POST(req: NextRequest) {
  const userId = getVerifiedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteName, siteUrl, username, password, notes } = await req.json();
  if (!siteName || !username || !password) {
    return NextResponse.json({ error: "Missing siteName, username, or password" }, { status: 400 });
  }

  try {
    const { error } = await supabase.from("saved_credentials").insert({
      user_id: userId,
      site_name: siteName,
      site_url: siteUrl || null,
      username_encrypted: encrypt(username),
      password_encrypted: encrypt(password),
      notes: notes || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Encryption failed" }, { status: 500 });
  }
}

// DELETE: Remove a credential
export async function DELETE(req: NextRequest) {
  const userId = getVerifiedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase
    .from("saved_credentials")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

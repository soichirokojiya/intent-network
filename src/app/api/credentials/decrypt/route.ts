import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";
import { decrypt } from "@/lib/crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST: Decrypt credentials for internal use (agent browser sessions)
// Only accessible via internal secret header
export async function POST(req: NextRequest) {
  const userId = getVerifiedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteName } = await req.json();
  if (!siteName) return NextResponse.json({ error: "Missing siteName" }, { status: 400 });

  const { data, error } = await supabase
    .from("saved_credentials")
    .select("username_encrypted, password_encrypted, site_url")
    .eq("user_id", userId)
    .ilike("site_name", `%${siteName}%`)
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: `Credential not found for "${siteName}"` }, { status: 404 });
  }

  try {
    return NextResponse.json({
      username: decrypt(data.username_encrypted),
      password: decrypt(data.password_encrypted),
      siteUrl: data.site_url,
    });
  } catch {
    return NextResponse.json({ error: "Decryption failed" }, { status: 500 });
  }
}

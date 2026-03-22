import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET: Check if signup is enabled
export async function GET() {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "signup_enabled")
    .single();

  const enabled = data?.value !== "false";
  return NextResponse.json({ signupEnabled: enabled });
}

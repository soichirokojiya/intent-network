import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/serverAuth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET: List pending journal drafts
export async function GET(req: NextRequest) {
  const deviceId = getVerifiedUserId(req) || req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "pending";
  const { data, error } = await supabase
    .from("mf_journal_drafts")
    .select("*")
    .eq("device_id", deviceId)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST: Create a journal draft (called by agent tool)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const internalSecret = req.headers.get("x-internal-secret");
  const deviceId = internalSecret
    ? (req.headers.get("x-verified-user-id") || body.deviceId)
    : getVerifiedUserId(req);

  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { journal_data, summary, agent_name } = body;
  if (!journal_data) {
    return NextResponse.json({ error: "journal_data required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("mf_journal_drafts")
    .insert({
      device_id: deviceId,
      agent_name: agent_name || "Yabusaki",
      journal_data,
      summary: summary || "",
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: Approve or reject a draft
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const deviceId = getVerifiedUserId(req) || body.deviceId;
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action } = body;
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  if (action === "approve") {
    // Get the draft
    const { data: draft, error: fetchErr } = await supabase
      .from("mf_journal_drafts")
      .select("*")
      .eq("id", id)
      .eq("device_id", deviceId)
      .single();

    if (fetchErr || !draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Get MF token
    const { data: profile } = await supabase
      .from("profiles")
      .select("mf_token, mf_refresh_token")
      .eq("id", deviceId)
      .single();

    if (!profile?.mf_token) {
      return NextResponse.json({ error: "マネーフォワード未連携" }, { status: 401 });
    }

    // Create journal via MF API
    let token = profile.mf_token;
    let res = await fetch("https://api-accounting.moneyforward.com/api/v3/journals", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ journal: draft.journal_data }),
    });

    // Token refresh on 401
    if (res.status === 401 && profile.mf_refresh_token) {
      const refreshRes = await fetch("https://api.biz.moneyforward.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.MF_CLIENT_ID!,
          client_secret: process.env.MF_CLIENT_SECRET!,
          refresh_token: profile.mf_refresh_token,
        }),
      });
      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        token = refreshData.access_token;
        await supabase.from("profiles").update({
          mf_token: token,
          mf_refresh_token: refreshData.refresh_token || profile.mf_refresh_token,
        }).eq("id", deviceId);

        res = await fetch("https://api-accounting.moneyforward.com/api/v3/journals", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ journal: draft.journal_data }),
        });
      }
    }

    const result = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

    if (res.ok) {
      await supabase.from("mf_journal_drafts").update({
        status: "approved",
        updated_at: new Date().toISOString(),
      }).eq("id", id);

      return NextResponse.json({ ok: true, journal: result });
    } else {
      return NextResponse.json({ error: result.errors?.[0]?.message || "仕訳の登録に失敗しました", details: result }, { status: res.status });
    }
  }

  if (action === "reject") {
    await supabase.from("mf_journal_drafts").update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    }).eq("id", id).eq("device_id", deviceId);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

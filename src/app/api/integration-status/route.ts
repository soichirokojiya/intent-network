import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("google_calendar_connected, trello_connected, schedule_delivery_enabled, google_drive_connected, notion_connected, notion_auto_save, x_connected, gmail_connected, slack_connected, line_connected")
    .eq("id", deviceId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    googleCalendarConnected: data?.google_calendar_connected ?? false,
    trelloConnected: data?.trello_connected ?? false,
    scheduleDeliveryEnabled: data?.schedule_delivery_enabled ?? false,
    googleDriveConnected: data?.google_drive_connected ?? false,
    notionConnected: data?.notion_connected ?? false,
    notionAutoSave: data?.notion_auto_save ?? false,
    xConnected: data?.x_connected ?? false,
    gmailConnected: data?.gmail_connected ?? false,
    slackConnected: data?.slack_connected ?? false,
    lineConnected: data?.line_connected ?? false,
  });
}

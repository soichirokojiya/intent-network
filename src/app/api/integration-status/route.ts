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

  // Select only columns that definitely exist (core + well-established integrations)
  // Use wildcard select to avoid "column does not exist" errors when new columns haven't been migrated yet
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
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
    sheetsConnected: data?.google_sheets_connected ?? false,
    chatworkConnected: data?.chatwork_connected ?? false,
    freeeConnected: data?.freee_connected ?? false,
    squareConnected: data?.square_connected ?? false,
    metaConnected: data?.meta_connected ?? false,
    metaPageName: data?.meta_page_name || "",
    youtubeConnected: data?.youtube_connected ?? false,
    youtubeChannelName: data?.youtube_channel_name || "",
    memorySummary: data?.memory_summary || "",
  });
}

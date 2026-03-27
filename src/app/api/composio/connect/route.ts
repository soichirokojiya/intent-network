import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/serverAuth";
import { initiateConnection, COMPOSIO_APP_MAP } from "@/lib/composio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceId = getVerifiedUserId(req) || body.deviceId;
    if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { service } = body;
    if (!service) return NextResponse.json({ error: "service required" }, { status: 400 });

    const composioApp = COMPOSIO_APP_MAP[service];
    if (!composioApp) {
      return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 400 });
    }

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://musu.world"}/api/composio/callback`;
    const result = await initiateConnection(deviceId, composioApp, redirectUrl);

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      connectionId: result.connectionId,
    });
  } catch (err) {
    console.error("[composio/connect] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

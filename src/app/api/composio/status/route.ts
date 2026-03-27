import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/serverAuth";
import { getConnectedApps, COMPOSIO_APP_MAP, COMPOSIO_APP_REVERSE_MAP } from "@/lib/composio";

export async function GET(req: NextRequest) {
  try {
    const deviceId = getVerifiedUserId(req);
    if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const connectedApps = await getConnectedApps(deviceId);

    // Build status map: musu service name → connected boolean
    const status: Record<string, boolean> = {};
    for (const musuService of Object.keys(COMPOSIO_APP_MAP)) {
      const composioApp = COMPOSIO_APP_MAP[musuService];
      status[musuService] = connectedApps.includes(composioApp);
    }

    // Also include raw Composio app names for debugging
    return NextResponse.json({
      status,
      connectedApps,
      availableServices: Object.keys(COMPOSIO_APP_MAP),
    });
  } catch (err) {
    console.error("[composio/status] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createOAuthState } from "@/lib/oauthState";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.MF_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "MoneyForward OAuth not configured" }, { status: 500 });
  }

  const scope = "mfc/accounting/offices.read mfc/accounting/accounts.read mfc/accounting/departments.read mfc/accounting/journal.read mfc/accounting/journal.write";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: "https://musu.world/api/moneyforward/callback",
    scope,
    state: createOAuthState({ deviceId }),
  });

  return NextResponse.redirect(`https://api.biz.moneyforward.com/authorize?${params.toString()}`);
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "X OAuth not configured" }, { status: 500 });
  }

  // Generate PKCE values
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // Encode deviceId + codeVerifier + agentId in state (base64url)
  const stateData = Buffer.from(
    JSON.stringify({ deviceId, codeVerifier, agentId: agentId || null }),
  ).toString("base64url");

  const redirectUri = "https://musu.world/api/x/callback";
  const scope = "tweet.read tweet.write users.read offline.access";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: stateData,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(
    `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
  );
}

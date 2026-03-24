import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/serverAuth";

export const maxDuration = 60;

const STEEL_API_URL = "https://api.steel.dev/v1";
const BROWSER_COST_YEN = 10; // 1回あたり約10円

async function logBrowserUsage(deviceId: string, action: string, url: string, baseUrl: string) {
  try {
    await fetch(`${baseUrl}/api/credits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!,
        "x-verified-user-id": deviceId,
      },
      body: JSON.stringify({
        inputTokens: 0,
        outputTokens: 0,
        costYen: BROWSER_COST_YEN,
        model: `steel-${action}`,
        apiRoute: "browser/run",
      }),
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  const deviceId = getVerifiedUserId(req);
  if (!deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.STEEL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Steel API key not configured" }, { status: 500 });
  }

  const { action, url, fullPage } = await req.json();

  if (!url || !action) {
    return NextResponse.json({ error: "Missing url or action" }, { status: 400 });
  }

  const headers = {
    "Content-Type": "application/json",
    "Steel-Api-Key": apiKey,
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";

  try {
    switch (action) {
      case "scrape": {
        const res = await fetch(`${STEEL_API_URL}/scrape`, {
          method: "POST",
          headers,
          body: JSON.stringify({ url, delay: 2000 }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json({ error: `Steel scrape failed: ${errText}` }, { status: res.status });
        }
        const data = await res.json();
        const html = data.content?.html || data.content || "";
        const rawHtml = typeof html === "string" ? html : JSON.stringify(html);
        const content = rawHtml
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 15000);
        // Log usage after successful scrape
        await logBrowserUsage(deviceId, action, url, baseUrl);
        return NextResponse.json({ success: true, content });
      }

      case "screenshot": {
        const res = await fetch(`${STEEL_API_URL}/screenshot`, {
          method: "POST",
          headers,
          body: JSON.stringify({ url, fullPage: fullPage ?? false }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json({ error: `Steel screenshot failed: ${errText}` }, { status: res.status });
        }
        // Steel returns { url: "https://images.steel.dev/..." }
        const data = await res.json();
        const screenshotUrl = data.url;
        // Log usage after successful screenshot
        await logBrowserUsage(deviceId, action, url, baseUrl);
        return NextResponse.json({ success: true, screenshotUrl });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}. Supported: scrape, screenshot` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Browser action failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}

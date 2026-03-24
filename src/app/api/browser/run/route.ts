import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/serverAuth";

export const maxDuration = 60;

const STEEL_API_URL = "https://api.steel.dev/v1";
const BROWSER_COST_YEN = 10;
const SESSION_COST_YEN = 20; // セッション操作は高め

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function logBrowserUsage(deviceId: string, action: string, costYen: number, baseUrl: string) {
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
        costYen,
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

  const { action, url, fullPage, steps } = await req.json();

  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const steelHeaders = {
    "Content-Type": "application/json",
    "Steel-Api-Key": apiKey,
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";

  try {
    switch (action) {
      // Simple stateless actions (no session needed)
      case "scrape": {
        if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
        const res = await fetch(`${STEEL_API_URL}/scrape`, {
          method: "POST",
          headers: steelHeaders,
          body: JSON.stringify({ url, delay: 2000 }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json({ error: `Steel scrape failed: ${errText}` }, { status: res.status });
        }
        const data = await res.json();
        const html = data.content?.html || data.content || "";
        const content = stripHtml(typeof html === "string" ? html : JSON.stringify(html)).slice(0, 15000);
        await logBrowserUsage(deviceId, action, BROWSER_COST_YEN, baseUrl);
        return NextResponse.json({ success: true, content });
      }

      case "screenshot": {
        if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
        const res = await fetch(`${STEEL_API_URL}/screenshot`, {
          method: "POST",
          headers: steelHeaders,
          body: JSON.stringify({ url, fullPage: fullPage ?? false }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json({ error: `Steel screenshot failed: ${errText}` }, { status: res.status });
        }
        const data = await res.json();
        await logBrowserUsage(deviceId, action, BROWSER_COST_YEN, baseUrl);
        return NextResponse.json({ success: true, screenshotUrl: data.url });
      }

      // Interactive session: login, click, type, navigate, then scrape
      case "session": {
        if (!steps || !Array.isArray(steps) || steps.length === 0) {
          return NextResponse.json({ error: "Missing steps array for session action" }, { status: 400 });
        }

        const { default: Steel } = await import("steel-sdk");
        const { chromium } = await import("playwright-core");

        const steel = new Steel({ steelAPIKey: apiKey });
        const session = await steel.sessions.create({ timeout: 50000 });

        try {
          const browser = await chromium.connectOverCDP(
            `wss://connect.steel.dev?apiKey=${apiKey}&sessionId=${session.id}`
          );
          const context = browser.contexts()[0];
          const page = context.pages()[0] || await context.newPage();

          const results: string[] = [];

          for (const step of steps) {
            switch (step.type) {
              case "goto":
                await page.goto(step.url, { waitUntil: "domcontentloaded", timeout: 15000 });
                results.push(`Navigated to ${step.url}`);
                break;
              case "click":
                await page.click(step.selector, { timeout: 10000 });
                results.push(`Clicked ${step.selector}`);
                break;
              case "type":
                await page.fill(step.selector, step.text, { timeout: 10000 });
                results.push(`Typed into ${step.selector}`);
                break;
              case "wait":
                await page.waitForSelector(step.selector, { timeout: 10000 });
                results.push(`Found ${step.selector}`);
                break;
              case "delay":
                await page.waitForTimeout(Math.min(step.ms || 2000, 5000));
                results.push(`Waited ${step.ms || 2000}ms`);
                break;
              case "scrape": {
                const html = await page.content();
                const text = stripHtml(html).slice(0, 15000);
                results.push(`Page content: ${text}`);
                break;
              }
              case "screenshot": {
                // Take screenshot via Steel API for the current session page
                const currentUrl = page.url();
                results.push(`Current URL: ${currentUrl}`);
                break;
              }
              default:
                results.push(`Unknown step type: ${step.type}`);
            }
          }

          await browser.close();
          await logBrowserUsage(deviceId, action, SESSION_COST_YEN, baseUrl);
          return NextResponse.json({ success: true, results });
        } finally {
          await steel.sessions.release(session.id).catch(() => {});
        }
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}. Supported: scrape, screenshot, session` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Browser action failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}

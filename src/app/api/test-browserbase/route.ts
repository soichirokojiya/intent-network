import { NextResponse } from "next/server";

export async function GET() {
  const steps: string[] = [];
  try {
    const apiKey = process.env.BROWSERBASE_API_KEY;
    const projectId = process.env.BROWSERBASE_PROJECT_ID;
    steps.push(`API Key: ${apiKey ? apiKey.substring(0, 10) + "..." : "NOT SET"}`);
    steps.push(`Project ID: ${projectId ? projectId.substring(0, 10) + "..." : "NOT SET"}`);

    if (!apiKey || !projectId) {
      return NextResponse.json({ ok: false, steps, error: "Missing env vars" });
    }

    const { default: Browserbase } = await import("@browserbasehq/sdk");
    steps.push("SDK imported");

    const bb = new Browserbase({ apiKey });
    steps.push("Client created");

    const session = await bb.sessions.create({ projectId, browserSettings: { blockAds: true } });
    steps.push(`Session created: ${session.id}`);
    steps.push(`connectUrl: ${session.connectUrl.substring(0, 60)}...`);

    const { chromium } = await import("playwright-core");
    steps.push("Playwright imported");

    const browser = await chromium.connectOverCDP(session.connectUrl);
    steps.push("Browser connected");

    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    steps.push("Page ready");

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("https://example.com", { timeout: 15000 });
    const title = await page.title();
    steps.push(`Title: ${title}`);

    await browser.close();
    steps.push("Browser closed");

    return NextResponse.json({ ok: true, steps });
  } catch (err) {
    steps.push(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ ok: false, steps, error: err instanceof Error ? err.stack : String(err) });
  }
}

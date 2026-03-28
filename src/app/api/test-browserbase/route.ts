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

    // Try direct REST API instead of SDK (to diagnose SDK vs network issue)
    steps.push("Trying direct REST API...");
    const res = await fetch("https://api.browserbase.com/v1/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bb-api-key": apiKey,
      },
      body: JSON.stringify({
        projectId,
        browserSettings: { blockAds: true },
      }),
    });
    steps.push(`REST status: ${res.status}`);
    const data = await res.json();

    if (!res.ok) {
      steps.push(`REST error: ${JSON.stringify(data)}`);
      return NextResponse.json({ ok: false, steps });
    }

    steps.push(`Session ID: ${data.id}`);
    steps.push(`connectUrl: ${data.connectUrl?.substring(0, 60) || "N/A"}...`);

    // Try Playwright connection
    if (data.connectUrl) {
      const { chromium } = await import("playwright-core");
      steps.push("Connecting Playwright...");
      const browser = await chromium.connectOverCDP(data.connectUrl);
      steps.push("Browser connected!");
      const context = browser.contexts()[0];
      const page = context.pages()[0] || await context.newPage();
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("https://example.com", { timeout: 15000 });
      steps.push(`Title: ${await page.title()}`);
      await browser.close();
      steps.push("Done!");
    }

    return NextResponse.json({ ok: true, steps });
  } catch (err) {
    steps.push(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ ok: false, steps, error: err instanceof Error ? err.stack : String(err) });
  }
}

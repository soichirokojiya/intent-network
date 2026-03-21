import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get("pw");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call morning-schedule with CRON_SECRET
  const res = await fetch(new URL("/api/cron/morning-schedule", req.url).toString(), {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const data = await res.json();
  return NextResponse.json(data);
}

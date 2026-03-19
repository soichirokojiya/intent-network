import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "chat-files";
const MAX_AGE_DAYS = 30;

export async function GET(req: Request) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
    const cutoffISO = cutoff.toISOString();

    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "created_at", order: "asc" } });

    if (listError) {
      console.error("Failed to list files:", listError);
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ deleted: 0, message: "No files found" });
    }

    // Filter files older than cutoff
    const oldFiles = files.filter((f) => {
      if (!f.created_at) return false;
      return f.created_at < cutoffISO;
    });

    if (oldFiles.length === 0) {
      return NextResponse.json({ deleted: 0, message: "No old files to delete" });
    }

    // Delete old files
    const paths = oldFiles.map((f) => f.name);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET)
      .remove(paths);

    if (deleteError) {
      console.error("Failed to delete files:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log(`Cleaned up ${paths.length} files older than ${MAX_AGE_DAYS} days`);
    return NextResponse.json({ deleted: paths.length });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

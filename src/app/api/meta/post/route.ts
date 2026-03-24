import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserIdWithBody } from "@/lib/serverAuth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const GRAPH_API = "https://graph.facebook.com/v21.0";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const deviceId = getVerifiedUserIdWithBody(req, body);
  if (!deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform, message, imageUrl } = body;
  // platform: "facebook" | "instagram" | "both"

  if (!platform || !message) {
    return NextResponse.json({ error: "Missing platform or message" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("meta_page_id, meta_page_token, meta_ig_business_id, meta_connected")
    .eq("id", deviceId)
    .single();

  if (!profile?.meta_connected || !profile.meta_page_token) {
    return NextResponse.json({ error: "Meta not connected" }, { status: 400 });
  }

  const results: { facebook?: string; instagram?: string; errors: string[] } = { errors: [] };

  // Post to Facebook
  if (platform === "facebook" || platform === "both") {
    try {
      const endpoint = imageUrl
        ? `${GRAPH_API}/${profile.meta_page_id}/photos`
        : `${GRAPH_API}/${profile.meta_page_id}/feed`;

      const fbBody: Record<string, string> = { access_token: profile.meta_page_token };
      if (imageUrl) {
        fbBody.url = imageUrl;
        fbBody.message = message;
      } else {
        fbBody.message = message;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(fbBody),
      });
      const data = await res.json();

      if (data.id) {
        results.facebook = data.id;
      } else {
        results.errors.push(`Facebook: ${data.error?.message || "Unknown error"}`);
      }
    } catch (err) {
      results.errors.push(`Facebook: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Post to Instagram (requires image)
  if ((platform === "instagram" || platform === "both") && profile.meta_ig_business_id) {
    if (!imageUrl) {
      results.errors.push("Instagram: 画像URLが必要です");
    } else {
      try {
        // Step 1: Create media container
        const containerRes = await fetch(`${GRAPH_API}/${profile.meta_ig_business_id}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            image_url: imageUrl,
            caption: message,
            access_token: profile.meta_page_token,
          }),
        });
        const containerData = await containerRes.json();

        if (!containerData.id) {
          results.errors.push(`Instagram: ${containerData.error?.message || "Container creation failed"}`);
        } else {
          // Step 2: Publish
          const publishRes = await fetch(`${GRAPH_API}/${profile.meta_ig_business_id}/media_publish`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              creation_id: containerData.id,
              access_token: profile.meta_page_token,
            }),
          });
          const publishData = await publishRes.json();

          if (publishData.id) {
            results.instagram = publishData.id;
          } else {
            results.errors.push(`Instagram: ${publishData.error?.message || "Publish failed"}`);
          }
        }
      } catch (err) {
        results.errors.push(`Instagram: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  const success = !!(results.facebook || results.instagram);
  return NextResponse.json({ success, ...results });
}

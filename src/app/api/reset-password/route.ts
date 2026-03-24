import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

// Rate limit: max 3 requests per email per 15 minutes
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 3;

  const timestamps = (rateLimitMap.get(email) || []).filter((t) => now - t < window);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  rateLimitMap.set(email, timestamps);
  return true;
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  if (!checkRateLimit(email)) {
    return NextResponse.json({ error: "しばらく時間をおいてから再度お試しください。" }, { status: 429 });
  }

  // Generate password reset link via Supabase Admin API
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: "https://musu.world/settings" },
  });

  if (error || !data.properties?.action_link) {
    return NextResponse.json({ error: error?.message || "Failed to generate link" }, { status: 500 });
  }

  // Send email via Resend
  const { error: sendError } = await getResend().emails.send({
    from: "musu <admin@musu.world>",
    to: email,
    subject: "パスワードリセット - musu",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: bold;">パスワードリセット</h2>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          以下のボタンをクリックして、新しいパスワードを設定してください。
        </p>
        <a href="${data.properties.action_link}"
           style="display: inline-block; background: #4A99E9; color: white; font-weight: bold; padding: 12px 32px; border-radius: 24px; text-decoration: none; margin: 16px 0;">
          パスワードをリセット
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          このメールに心当たりがない場合は無視してください。
        </p>
      </div>
    `,
  });

  if (sendError) {
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

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

// Rate limit: max 3 signups per IP per 15 minutes
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const max = 3;
  const timestamps = (rateLimitMap.get(key) || []).filter((t) => now - t < window);
  if (timestamps.length >= max) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してください。" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "パスワードは6文字以上必要です。" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "しばらく時間をおいてから再度お試しください。" }, { status: 429 });
  }

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const exists = existingUsers?.users?.some((u) => u.email === email);
  if (exists) {
    return NextResponse.json({ error: "このメールアドレスは既に登録されています。", isExisting: true }, { status: 409 });
  }

  // Create user without email confirmation (we handle it ourselves)
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // Generate email confirmation link
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo: "https://musu.world/" },
  });

  if (linkError || !linkData.properties?.action_link) {
    return NextResponse.json({ error: "確認メールの生成に失敗しました。" }, { status: 500 });
  }

  // Send confirmation email via Resend
  const { error: sendError } = await getResend().emails.send({
    from: "musu <admin@musu.world>",
    to: email,
    subject: "メールアドレスの確認 - musu",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: bold;">ようこそ、musuへ</h2>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          以下のボタンをクリックして、メールアドレスを確認してください。
        </p>
        <a href="${linkData.properties.action_link}"
           style="display: inline-block; background: #4A99E9; color: white; font-weight: bold; padding: 12px 32px; border-radius: 24px; text-decoration: none; margin: 16px 0;">
          メールアドレスを確認
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          このメールに心当たりがない場合は無視してください。
        </p>
      </div>
    `,
  });

  if (sendError) {
    return NextResponse.json({ error: "確認メールの送信に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold">プライバシーポリシー</span>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto text-[14px] leading-relaxed space-y-6">
        <p className="text-[var(--muted)] text-[12px]">最終更新日: 2026年3月18日</p>

        <section>
          <h2 className="font-bold text-[16px] mb-2">1. 収集する情報</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>アカウント情報:</strong> メールアドレス、表示名</li>
            <li><strong>利用データ:</strong> チャット内容、エージェント設定、トークン消費量</li>
            <li><strong>決済情報:</strong> Stripeを通じて処理されます。クレジットカード情報は当社サーバーに保存されません。</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">2. 情報の利用目的</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>サービスの提供・運営</li>
            <li>AIエージェントの応答品質向上</li>
            <li>課金・請求処理</li>
            <li>サービスの改善・新機能開発</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">3. 情報の第三者提供</h2>
          <p>以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>サービス提供に必要な外部サービス（Stripe, Supabase, Anthropic）への連携</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">4. AIとデータの取り扱い</h2>
          <p>チャット内容はAI（Anthropic Claude）に送信され、応答の生成に使用されます。Anthropicのデータポリシーに従い、API経由のデータはモデルのトレーニングには使用されません。</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">5. データの保管</h2>
          <p>ユーザーデータはSupabase（クラウドデータベース）に保管されます。適切なセキュリティ対策を講じていますが、インターネット上の通信は完全な安全性を保証できません。</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">6. データの削除</h2>
          <p>アカウント削除時に、全てのユーザーデータ（チャット履歴、エージェント、利用ログ）は完全に削除されます。</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">7. お問い合わせ</h2>
          <p>プライバシーに関するお問い合わせは、アプリ内のお問い合わせフォームよりご連絡ください。</p>
        </section>
      </div>
      <div className="h-20" />
    </>
  );
}

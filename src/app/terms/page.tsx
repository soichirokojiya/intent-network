"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold">利用規約</span>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto text-[14px] leading-relaxed space-y-6">
        <p className="text-[var(--muted)] text-[12px]">最終更新日: 2026年3月18日</p>

        <section>
          <h2 className="font-bold text-[16px] mb-2">第1条（サービス内容）</h2>
          <p>musu.world（以下「本サービス」）は、AIエージェントを活用した業務支援チャットサービスです。ユーザーはAIエージェントを作成・管理し、業務上の調査・分析・コンテンツ作成等に利用できます。</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">第2条（アカウント登録）</h2>
          <p>本サービスの利用にはアカウント登録が必要です。登録時に提供する情報は正確かつ最新のものである必要があります。アカウントの管理責任はユーザーに帰属します。</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">第3条（料金・課金）</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>本サービスはデポジット制の従量課金です。</li>
            <li>新規登録時に¥1,000分の無料クレジットが付与されます。</li>
            <li>クレジットはAIエージェントの利用（トークン消費）に応じて消費されます。</li>
            <li>残高が不足した場合、チャージが必要です。</li>
            <li>解約時にデポジット残高がある場合、残高は無効となり返金はいたしません。</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">第4条（禁止事項）</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>法令に違反する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>他のユーザーに迷惑をかける行為</li>
            <li>不正アクセスやシステムへの攻撃</li>
            <li>複数アカウントの不正利用</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">第5条（免責事項）</h2>
          <p>AIエージェントの回答は参考情報であり、正確性・完全性を保証するものではありません。AIの回答に基づいて行った判断・行動による損害について、当社は責任を負いません。</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">第6条（サービスの変更・停止）</h2>
          <p>当社は、事前の通知なくサービス内容の変更、一時停止、または終了を行う場合があります。</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">第7条（解約）</h2>
          <p>ユーザーはいつでもアカウントを削除し、本サービスの利用を終了できます。解約時、全てのデータ（エージェント、チャット履歴、クレジット残高）は削除され、復元できません。</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">第8条（準拠法・管轄）</h2>
          <p>本規約は日本法に準拠します。本サービスに関する紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </section>
      </div>
      <div className="h-20" />
    </>
  );
}

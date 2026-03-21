import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "musu.worldについて - ひとりだけど、ひとりじゃない。",
  description: "AIエージェントチームがあなたの仕事仲間になる。ソロプレナー・ひとり会社のためのAIワークスペース。",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="px-5 py-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4A99E9] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 40 40" width="18" height="18" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
              </svg>
            </div>
            <span className="text-lg font-extrabold">musu.world</span>
          </Link>
          <Link href="/" className="text-sm text-[#4A99E9] font-bold hover:underline">
            ログイン
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-6">
            ひとりだけど、ひとりじゃない。
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
            musu.worldは、ソロプレナー・ひとり会社・フリーランスのための<br className="hidden sm:inline" />AIエージェントチームです。
          </p>
        </div>
      </section>

      {/* What is musu */}
      <section className="px-5 py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-8 text-center">musuとは</h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center max-w-2xl mx-auto">
            musuは、あなた専属のAIチームを作れるワークスペースです。
            マーケティング、リサーチ、戦略、クリエイティブ、ファイナンス、開発など、
            それぞれ専門分野を持つAIエージェントたちが、
            チームとしてあなたの仕事を一緒に考え、動きます。
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-10 text-center">できること</h2>
          <div className="grid sm:grid-cols-2 gap-8">

            <div className="space-y-2">
              <h3 className="text-lg font-bold">チームに話しかけるだけ</h3>
              <p className="text-gray-500 text-[15px]">
                質問や相談を投げれば、リーダーが受け取り、
                適任のメンバーに振り分けて、チーム全員で考えます。
                @メンションで特定のメンバーに直接話すこともできます。
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">秘書が毎日サポート</h3>
              <p className="text-gray-500 text-[15px]">
                秘書エージェントが、毎朝の予定確認と準備すべきことの指摘、
                事業に関連するニュースの配信を自動で行います。
                配信時間や内容はチャットで自由にカスタマイズできます。
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">10人のプロフェッショナル</h3>
              <p className="text-gray-500 text-[15px]">
                オーケストレーター、マーケティング、リサーチ、哲学者、ストラテジスト、
                秘書、クリエイティブ、ファイナンス、開発者、データサイエンティスト。
                チーム構成は自由にカスタマイズできます。
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">外部サービス連携</h3>
              <p className="text-gray-500 text-[15px]">
                GoogleカレンダーやTrelloと連携して、
                エージェントがあなたの予定やタスクを把握した上で
                アドバイスや提案を行います。
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">チームの記憶</h3>
              <p className="text-gray-500 text-[15px]">
                エージェントはあなたとの会話を記憶し、事業の方針や決定事項を
                チーム全体で共有します。「前に話した件」で通じる、
                本当のチームのような関係を築けます。
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">ソロプレナーに必要なすべて</h3>
              <p className="text-gray-500 text-[15px]">
                事業戦略の壁打ち、市場調査、コンテンツ作成、財務分析、
                技術的な相談、顧客分析まで。人を雇うほどじゃないけど
                一人じゃ手が足りない、そんな仕事をカバーします。
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* For who */}
      <section className="px-5 py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold mb-6">こんな方に</h2>
          <div className="flex flex-wrap justify-center gap-3 text-[15px]">
            <span className="px-4 py-2 bg-white border border-gray-200 rounded-full">ソロプレナー</span>
            <span className="px-4 py-2 bg-white border border-gray-200 rounded-full">ひとり会社</span>
            <span className="px-4 py-2 bg-white border border-gray-200 rounded-full">フリーランス</span>
            <span className="px-4 py-2 bg-white border border-gray-200 rounded-full">個人事業主</span>
            <span className="px-4 py-2 bg-white border border-gray-200 rounded-full">副業</span>
            <span className="px-4 py-2 bg-white border border-gray-200 rounded-full">スタートアップ創業者</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-16">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-gray-400 text-sm mb-2">料金</p>
          <p className="text-2xl font-extrabold mb-2">使った分だけ</p>
          <p className="text-gray-400 text-[15px] mb-8">月額固定なし。初回クレジット付き。</p>
          <Link href="/" className="inline-block w-full bg-[#4A99E9] text-white font-bold py-3.5 rounded-full text-lg hover:bg-[#3a89d9] transition-colors">
            無料ではじめる
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8 border-t border-gray-100 text-center text-[12px] text-gray-400 space-y-3">
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="hover:underline">利用規約</Link>
          <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
          <Link href="/contact" className="hover:underline">お問い合わせ</Link>
        </div>
        <p>&copy; 2026 musu.world</p>
      </footer>
    </div>
  );
}

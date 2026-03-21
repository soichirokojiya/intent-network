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
                Google、Notion、Slack、X、freeeなど主要サービスと連携。
                エージェントがあなたの予定・タスク・ファイル・会計データを把握した上で
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

      {/* Integrations logos */}
      <section className="px-5 py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-8">連携サービス</p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 opacity-70">
            {/* Google */}
            <svg viewBox="0 0 24 24" className="h-8 w-auto" aria-label="Google">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {/* Gmail */}
            <svg viewBox="0 0 24 24" className="h-7 w-auto" aria-label="Gmail">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
            </svg>
            {/* Notion */}
            <svg viewBox="0 0 100 100" className="h-8 w-auto" aria-label="Notion">
              <path d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.3 79.94c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 6.017-6.8z" fill="#fff"/>
              <path d="M61.35.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723.967 5.053 3.3 8.167l12.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257-3.89c5.433-.387 6.99-2.917 6.99-7.193V17.64c0-2.21-.88-2.847-3.443-4.733L74.167 1.14C69.893-1.96 68.147-2.35 61.35.227zM25.6 19.013c-5.2.34-6.38.417-9.34-1.907l-5.22-4.127c-.86-.777-.39-1.753 1.557-1.943l50.88-3.723c4.277-.393 6.417.97 8.163 2.33l6.227 4.513c.293.193.683.91.1.91l-52.77 3.273-.1.673zm-2.89 73.32V28.187c0-2.527.777-3.693 3.107-3.887l58.05-3.5c2.14-.193 3.107 1.167 3.107 3.693v63.76c0 2.53-.39 4.667-3.883 4.863l-55.6 3.307c-3.497.193-4.78-.97-4.78-3.69zM76.5 31.96c.39 1.75 0 3.5-1.75 3.697l-2.72.527v47.127c-2.333 1.25-4.473 1.947-6.223 1.947-2.913 0-3.65-.917-5.8-3.5L40.097 51.817v28.527l5.607 1.26s0 3.5-4.86 3.5l-13.397.78c-.393-.787 0-2.723 1.36-3.11l3.497-.937V42.187L27.8 41.64c-.393-1.75.583-4.277 3.3-4.47l14.367-.947 20.563 31.397V41.25l-4.667-.583c-.39-2.14 1.167-3.694 3.107-3.887l13.03-.82z" fill="#000"/>
            </svg>
            {/* Slack */}
            <svg viewBox="0 0 24 24" className="h-8 w-auto" aria-label="Slack">
              <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#E01E5A"/>
              <path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36C5F0"/>
              <path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.163 0a2.528 2.528 0 012.523 2.522v6.312z" fill="#2EB67D"/>
              <path d="M15.163 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.163 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 01-2.52-2.523 2.527 2.527 0 012.52-2.52h6.315A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.522 2.523h-6.315z" fill="#ECB22E"/>
            </svg>
            {/* Trello */}
            <svg viewBox="0 0 24 24" className="h-7 w-auto" aria-label="Trello">
              <rect width="24" height="24" rx="4" fill="#0079BF"/>
              <rect x="4" y="4" width="6.5" height="14" rx="1.2" fill="#fff"/>
              <rect x="13.5" y="4" width="6.5" height="9" rx="1.2" fill="#fff"/>
            </svg>
            {/* X */}
            <svg viewBox="0 0 24 24" className="h-6 w-auto" aria-label="X">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000"/>
            </svg>
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

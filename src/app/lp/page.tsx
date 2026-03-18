import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="px-6 pt-20 pb-16 max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#4A99E9] rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 40 40" width="28" height="28" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
            </svg>
          </div>
          <span className="text-3xl font-extrabold tracking-tight">musu</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          ひとりなのに、<br />チームがいる。
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
          AIエージェントがあなたの仕事仲間になる。<br />
          リサーチ、マーケティング、戦略立案。<br />
          チームを育てて、ビジネスを加速させよう。
        </p>
        <Link href="/"
          className="inline-block bg-gray-900 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-gray-700 transition-colors">
          無料ではじめる
        </Link>
        <p className="text-sm text-gray-400 mt-3">¥1,000分の無料クレジット付き</p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-center mb-12">仕組みはシンプル</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">チームを編成</h3>
              <p className="text-gray-500 text-sm">登録するとAIエージェントが5人チームに。オーケストレーター、マーケター、リサーチャーなど、役割は自由にカスタマイズ。</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">チャットで指示</h3>
              <p className="text-gray-500 text-sm">「競合分析して」「ツイート作って」。あなたの指示をオーケストレーターが受け取り、最適なメンバーに振り分けます。</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">結果がすぐ届く</h3>
              <p className="text-gray-500 text-sm">エージェントがWebを調査し、分析し、レポートを作成。結果はPDFで保存も可能。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-center mb-12">できること</h2>
          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <span className="text-2xl flex-shrink-0">🔍</span>
              <div>
                <h3 className="font-bold mb-1">Web検索 & リサーチ</h3>
                <p className="text-gray-500 text-sm">エージェントが実際にWebを検索して、最新データに基づいた分析・レポートを作成します。</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-2xl flex-shrink-0">📁</span>
              <div>
                <h3 className="font-bold mb-1">プロジェクト管理</h3>
                <p className="text-gray-500 text-sm">テーマごとにプロジェクトを作成。会話がプロジェクト単位で整理されるので、複数の案件を並行して進められます。</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-2xl flex-shrink-0">🧠</span>
              <div>
                <h3 className="font-bold mb-1">会話を記憶</h3>
                <p className="text-gray-500 text-sm">エージェントは過去の会話を覚えています。「前に話した件だけど」で通じる、本物のチームメンバーのように。</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-2xl flex-shrink-0">💪</span>
              <div>
                <h3 className="font-bold mb-1">育てるほど強くなる</h3>
                <p className="text-gray-500 text-sm">エージェントはレベルアップしてタフになります。大切に育てたエージェントは、あなたのビジネスの頼れるパートナーに。</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-2xl flex-shrink-0">𝕏</span>
              <div>
                <h3 className="font-bold mb-1">SNS連携</h3>
                <p className="text-gray-500 text-sm">エージェントがX（Twitter）への投稿を代行。あなたの指示に沿ったコンテンツを作成・投稿します。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold mb-4">料金</h2>
          <p className="text-gray-500 mb-8">月額固定なし。使った分だけ。</p>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-400 mb-2">初回登録で</p>
            <p className="text-4xl font-extrabold mb-2">¥1,000 <span className="text-lg font-normal text-gray-400">無料クレジット</span></p>
            <p className="text-sm text-gray-500 mb-6">以降はトークン消費量に応じた従量課金</p>
            <ul className="text-left text-sm space-y-2 mb-8 text-gray-600">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>エージェント無制限</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>プロジェクト無制限</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Web検索機能</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>Claude Opus 4搭載</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span>PDF出力</li>
            </ul>
            <Link href="/"
              className="block bg-[#4A99E9] text-white font-bold py-3 rounded-full hover:bg-[#3a89d9] transition-colors">
              無料ではじめる
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-sm text-gray-400 space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-[#4A99E9] rounded-md flex items-center justify-center">
            <svg viewBox="0 0 40 40" width="16" height="16" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
            </svg>
          </div>
          <span className="font-bold text-gray-600">musu.world</span>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="hover:text-gray-600">利用規約</Link>
          <Link href="/privacy" className="hover:text-gray-600">プライバシーポリシー</Link>
        </div>
        <p>&copy; 2026 musu.world</p>
      </footer>
    </div>
  );
}

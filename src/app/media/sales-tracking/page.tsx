import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "「今月いくら売れた？」に即答できるようになった話 | musu",
  description:
    "Squareの決済データをGoogleスプレッドシートに記録。売上の集計から分析まで、musuに聞くだけ。",
  openGraph: {
    title:
      "「今月いくら売れた？」に即答できるようになった話 | musu",
    description:
      "Squareの決済データをGoogleスプレッドシートに記録。売上の集計から分析まで、musuに聞くだけ。",
    images: [
      {
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "「今月いくら売れた？」に即答できるようになった話 | musu",
    description:
      "Squareの決済データをGoogleスプレッドシートに記録。売上の集計から分析まで、musuに聞くだけ。",
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop",
    ],
  },
};

export default function SalesTrackingArticle() {
  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ lineHeight: 1.8 }}>
      {/* Header */}
      <header className="px-5 md:px-10 py-5 border-b border-gray-200 flex items-center gap-3">
        <Link
          href="/"
          className="text-[22px] font-bold text-gray-900 no-underline font-serif"
        >
          musu
        </Link>
        <Link
          href="/media"
          className="text-xs text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded-full no-underline hover:border-[#4A99E9] transition-colors"
        >
          lab
        </Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4A99E9] via-[#3a7bd5] to-[#2d6bc4] text-white px-5 md:px-10 py-16 md:py-24">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5" />
        </div>
        <div className="max-w-[760px] mx-auto relative">
          <div className="text-[13px] tracking-[0.15em] text-white/50 mb-5 uppercase">
            musu lab
          </div>
          <h1 className="font-serif text-3xl md:text-[42px] font-bold leading-snug mb-6">
            「今月いくら売れた？」
            <br />
            に即答できるように
            <br />
            なった話
          </h1>
          <p className="text-base text-white/70 max-w-[560px] leading-loose">
            Squareの決済データをGoogleスプレッドシートに記録。売上の集計から分析まで、musuに聞くだけ。
          </p>
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-[760px] mx-auto px-5 md:px-6 py-10 md:py-16 pb-20 md:pb-24">
        <p className="text-base text-[#333] mb-6 leading-loose">
          売上データを確認するたびに、Squareのダッシュボードにログインしていた。月末になると、そこから数字を拾ってスプレッドシートに転記して、集計して。たった2時間の作業だけど、毎月やるとなると面倒だし、つい後回しにしてしまう。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          「musuに聞くだけで売上が分かるようにしたい」。経理エージェントのNaoに話しかけてみた。
        </p>

        {/* Chat demo */}
        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="text-xs text-gray-500 tracking-wider mb-5 uppercase">
            実際の会話
          </div>
          <div className="flex flex-col gap-4">
            {/* User bubble */}
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                私
              </div>
              <div>
                <div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  Squareの今月の売上をスプレッドシートにまとめて
                </div>
              </div>
            </div>

            {/* AI bubble */}
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
                N
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Nao・経理</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  Squareから今月の決済データ取得したよ。
                  <br />
                  <br />
                  ・取引件数: 23件
                  <br />
                  ・合計金額: &yen;187,500
                  <br />
                  <br />
                  スプレッドシートに入れていい？
                </div>
              </div>
            </div>

            {/* User bubble */}
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                私
              </div>
              <div>
                <div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  ok
                </div>
              </div>
            </div>

            {/* AI bubble */}
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
                N
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Nao・経理</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  入れたよ。商品別の内訳もまとめておいた。
                  <br />
                  <br />
                  ・MOIRAI ORGANICS: 15件 &yen;142,800
                  <br />
                  ・島素材シリーズ: 8件 &yen;44,700
                  <br />
                  <br />
                  先月比だと+12%。MOIRAI ORGANICSが好調だね
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          チャットで「まとめて」と言うだけで、Squareからデータを取得して、スプレッドシートに記録して、商品別の内訳まで出してくれた。しかも先月比まで。
        </p>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          「今月の売上は？」に即答
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          一度スプレッドシートにデータを入れておけば、あとは聞くだけでいい。
        </p>

        {/* Quick question demo */}
        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="text-xs text-gray-500 tracking-wider mb-5 uppercase">
            日常の使い方
          </div>
          <div className="flex flex-col gap-4">
            {/* User bubble */}
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                私
              </div>
              <div>
                <div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  今月の売上は？
                </div>
              </div>
            </div>

            {/* AI bubble */}
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
                N
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Nao・経理</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  今月は23件、&yen;187,500だよ。先月比+12%。一番売れてるのはMOIRAI ORGANICSで全体の76%を占めてる
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          何をしたのか、整理すると
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          SquareとGoogleスプレッドシートをmusuに連携して、「まとめて」と話しかけるだけ。あとはNaoがデータ取得から集計まで全部やってくれる。
        </p>

        {/* Steps */}
        <div className="my-8 flex flex-col gap-5">
          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              1
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                SquareとGoogleスプレッドシートをmusuに連携
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                管理画面からOAuth接続。Squareのアカウントを認証するだけ。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              2
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                「まとめて」とNaoに話す
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                Squareから決済データを取得し、確認後にスプレッドシートに記録。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              3
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                自動で集計・分析
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                商品別の内訳や先月比など、数字の分析まで自動でやってくれる。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              4
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                いつでも「今月の売上は？」で即答
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                スプレッドシートのデータを参照して、聞くだけで売上状況を教えてくれる。
              </p>
            </div>
          </div>
        </div>

        {/* Result box */}
        <div className="bg-[#111] text-white rounded-2xl p-7 my-8">
          <div className="text-[13px] opacity-50 mb-4 tracking-wider">
            導入後の変化
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10 text-[15px]">
            <span className="opacity-60">月末集計の作業時間</span>
            <span className="font-bold text-[#5dca8a]">2時間 → チャット1分</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10 text-[15px]">
            <span className="opacity-60">売上確認</span>
            <span className="font-bold text-[#5dca8a]">聞くだけで即答</span>
          </div>
          <div className="flex justify-between py-2.5 text-[15px]">
            <span className="opacity-60">商品別分析</span>
            <span className="font-bold text-[#5dca8a]">自動で内訳表示</span>
          </div>
        </div>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          現在できること・これからできること
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          現時点では、チャットで「Squareの売上をまとめて」と話しかけることで、データの取得からスプレッドシートへの記録まで実行できる。つまり、自分から聞けばすぐに対応してくれる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          今後は、決済が発生するたびに自動で検知してスプレッドシートに記録する仕組みも開発中だ。完全自動化まであと一歩。
        </p>

        {/* Highlight box */}
        <div className="bg-[#e8f0fe] border-l-4 border-[#4A99E9] rounded-r-xl px-6 py-5 my-8">
          <p className="text-[#1a3a6e] font-medium !mb-0">
            今は「聞いたらやってくれる」段階。近い将来「聞かなくても勝手にやってくれる」段階へ。売上データの自動記録は、musuが進化していく過程をリアルタイムで体験できる機能のひとつだ。
          </p>
        </div>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          ソロプレナーに伝えたいこと
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          売上の数字をリアルタイムで把握できることは、意思決定のスピードに直結する。「今月いくら売れた？」にすぐ答えられるだけで、次の打ち手が見えてくる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          Squareのダッシュボードを開く必要はもうない。musuに聞くだけでいい。
        </p>

        {/* CTA */}
        <div className="bg-[#4A99E9] text-white rounded-[20px] px-6 md:px-10 py-12 text-center mt-16">
          <h2 className="font-serif text-2xl md:text-[26px] font-bold mb-3">
            ひとりだけど、ひとりじゃない。
          </h2>
          <p className="opacity-85 mb-7">
            育てるほど、任せられる。あなただけの仲間を持とう。
            <br />
            初回クレジット付きで、まずは無料で試せます。
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-[#4A99E9] font-bold text-base px-10 py-3.5 rounded-full no-underline hover:-translate-y-0.5 transition-transform"
          >
            musuをはじめる &rarr;
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="text-center py-10 text-[13px] text-gray-500 border-t border-gray-200">
        &copy; 2026 musu.world — ソロプレナーのためのAIエージェントチーム
      </footer>
    </div>
  );
}

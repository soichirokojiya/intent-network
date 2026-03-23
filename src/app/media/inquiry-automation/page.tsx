import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "「問い合わせメール、もう見落とさない」を仕組みにした話 | musu",
  description:
    "Gmailの問い合わせを自動で分類・返信文案を作成。Slackに通知して、OKで返信。対応履歴はNotionに自動保存。",
  openGraph: {
    title:
      "「問い合わせメール、もう見落とさない」を仕組みにした話 | musu",
    description:
      "Gmailの問い合わせを自動で分類・返信文案を作成。Slackに通知して、OKで返信。対応履歴はNotionに自動保存。",
    images: [
      {
        url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "「問い合わせメール、もう見落とさない」を仕組みにした話 | musu",
    description:
      "Gmailの問い合わせを自動で分類・返信文案を作成。Slackに通知して、OKで返信。対応履歴はNotionに自動保存。",
    images: [
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop",
    ],
  },
};

export default function InquiryAutomationArticle() {
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
            「問い合わせメール、
            <br />
            もう見落とさない」
            <br />
            を仕組みにした話
          </h1>
          <p className="text-base text-white/70 max-w-[560px] leading-loose">
            Gmailの問い合わせを自動で分類・返信文案を作成。Slackに通知して、OKで返信。対応履歴はNotionに自動保存。
          </p>
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-[760px] mx-auto px-5 md:px-6 py-10 md:py-16 pb-20 md:pb-24">
        <p className="text-base text-[#333] mb-6 leading-loose">
          問い合わせメールの対応、地味に大変だ。見落として返信が遅れたり、誰がいつ対応したのか分からなくなったり。スプレッドシートに履歴を書こうとしても、忙しいと後回しになる。月に3〜4件は「返信し忘れてた」が発生していた。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          musuの秘書エージェント「Mio」に、問い合わせ対応の仕組みを作ってもらうことにした。
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
                  問い合わせメールが来たら、Slackに通知して返信案を作ってほしい
                </div>
              </div>
            </div>

            {/* AI bubble */}
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
                M
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Mio・秘書</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  自動化ルール作ったよ。こんな流れでどう？
                  <br />
                  <br />
                  1. Gmailで問い合わせメール検知
                  <br />
                  2. 内容を分類（料金/予約/その他）
                  <br />
                  3. 返信文案を作成
                  <br />
                  4. Slackに通知
                  <br />
                  5. 承認したら返信送信
                  <br />
                  6. Notionに対応履歴を保存
                  <br />
                  <br />
                  これでOKなら設定するよ〜
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
                  いいね、お願い
                </div>
              </div>
            </div>

            {/* AI bubble - report */}
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
                M
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Mio・秘書</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  今日の問い合わせ2件処理したよ。
                  <br />
                  <br />
                  ・料金についての質問 → 回答済み
                  <br />
                  ・予約確認の依頼 → Slackに通知済み、返信待ち
                  <br />
                  <br />
                  Notionにも履歴保存したから確認してね
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          設定は会話だけで完了。あとはメールが届くたびにMioが自動で分類し、返信文案をSlackに送ってくれる。「これで返信していい？」と聞いてくれるから、内容を確認してOKを押すだけ。
        </p>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          何をしたのか、整理すると
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          Gmail、Slack、Notionの3つを連携させて、問い合わせ対応の流れを自動化した。やったことはmusuに「こうしてほしい」と伝えただけ。
        </p>

        {/* Steps */}
        <div className="my-8 flex flex-col gap-5">
          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              1
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                Gmail・Slack・Notionをmusuに連携
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                管理画面からOAuth接続するだけ。数クリックで完了。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              2
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                対応ルールをチャットで伝える
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                「問い合わせが来たらSlackに通知して、返信案を作って」と話すだけ。分類条件も会話で設定。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              3
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                Mioが自動で分類・返信案を作成
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                メールの内容を読み取り、カテゴリ分類と返信文案を自動生成。Slackに通知が届く。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              4
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                承認→返信→Notionに履歴保存
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                Slackで承認するだけで返信が送信され、対応履歴がNotionに自動保存される。
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
            <span className="opacity-60">対応漏れ</span>
            <span className="font-bold text-[#5dca8a]">月3〜4件 → 0件</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10 text-[15px]">
            <span className="opacity-60">平均返信時間</span>
            <span className="font-bold text-[#5dca8a]">半日 → 1時間以内</span>
          </div>
          <div className="flex justify-between py-2.5 text-[15px]">
            <span className="opacity-60">対応履歴の管理</span>
            <span className="font-bold text-[#5dca8a]">Notionに自動蓄積</span>
          </div>
        </div>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          「返信案を作ってくれる」のが地味にすごい
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          問い合わせの内容を読んで、過去の対応パターンも踏まえて返信案を作ってくれる。もちろんそのまま送ることもできるし、修正してから送ることもできる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          特に「よくある質問」への返信は、ほぼそのまま使えるクオリティ。返信文を考える時間がゼロになった。
        </p>

        {/* Highlight box */}
        <div className="bg-[#e8f0fe] border-l-4 border-[#4A99E9] rounded-r-xl px-6 py-5 my-8">
          <p className="text-[#1a3a6e] font-medium !mb-0">
            問い合わせ対応は「見つける→読む→考える→書く→送る→記録する」の6ステップ。musuを使うと、人間がやるのは「確認する→承認する」の2ステップだけになる。
          </p>
        </div>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          ソロプレナーに伝えたいこと
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          ひとりで事業をやっていると、問い合わせ対応は後回しになりがちだ。でも返信が遅いと、それだけで信用を失う。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          musuに任せれば、問い合わせを見落とすことはなくなる。返信も速くなる。対応品質を落とさずに、自分の時間を取り戻せる。
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

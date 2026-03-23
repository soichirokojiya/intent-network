import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "「SNS投稿、チームに任せたら楽すぎた」AIと一緒にX運用を始めた話 | musu",
  description:
    "マーケティング戦略をAIチームと議論して、投稿文を作成、承認ボタンひとつでXに投稿。ソロプレナーのSNS運用が変わった。",
  openGraph: {
    title:
      "「SNS投稿、チームに任せたら楽すぎた」AIと一緒にX運用を始めた話 | musu",
    description:
      "マーケティング戦略をAIチームと議論して、投稿文を作成、承認ボタンひとつでXに投稿。ソロプレナーのSNS運用が変わった。",
  },
};

export default function XMarketingPostArticle() {
  return (
    <div
      className="min-h-screen bg-white text-[#111]"
      style={{ lineHeight: 1.8 }}
    >
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
            SNS投稿、
            <br />
            チームに任せたら
            <br />
            楽すぎた。
          </h1>
          <p className="text-base text-white/70 max-w-[560px] leading-loose">
            マーケティング戦略をAIチームと議論して、投稿文を作成。承認ボタンひとつでXに投稿。ソロプレナーのSNS運用が変わった。
          </p>
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-[760px] mx-auto px-5 md:px-6 py-10 md:py-16 pb-20 md:pb-24">
        <p className="text-base text-[#333] mb-6 leading-loose">
          ソロプレナーにとって、SNS運用は地味にきつい。投稿の内容を考えて、文章を書いて、タイミングを見計らって投稿する。これを毎日やるのは、本業のかたわらでは正直しんどい。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          でも、SNSをやらないと存在を知ってもらえない。このジレンマに悩んでいた時、musuのマーケティング担当エージェントに相談してみた。
        </p>

        {/* Section 1 */}
        <h2 className="font-serif text-[22px] font-bold pl-4 border-l-4 border-[#4A99E9] mt-14 mb-5">
          まずはマーケティング戦略を相談
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          最初から「投稿して」と言ってもいい。でも、せっかくチームがいるなら戦略から考えてもらったほうがいい。まずは方向性の相談から始めた。
        </p>

        {/* Chat demo 1 */}
        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="text-xs text-gray-500 tracking-wider mb-5 uppercase">
            実際の会話
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                私
              </div>
              <div>
                <div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  うちのサービス、ソロプレナー向けなんだけど、Xでどんな投稿をすれば刺さるかな？
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#e74c3c] text-white flex items-center justify-center text-sm font-bold shrink-0">
                K
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">
                  Kai・マーケティング
                </div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  ソロプレナーが反応するのは「あるある共感」と「具体的な解決策」の2軸だね。
                  <br />
                  <br />
                  まず共感系で認知を取って、そこから「こうやって解決した」って事例を出す流れがいいと思う。宣伝臭は出さずに、価値提供ベースで。
                </div>
              </div>
            </div>

            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                私
              </div>
              <div>
                <div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  なるほど。じゃあ「あるある共感」系で一つ書いてみて
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          普通にマーケティングの相談ができる。しかもmusuのKaiは自分の事業内容を覚えているから、的外れな提案が来ない。
        </p>

        {/* Section 2 */}
        <h2 className="font-serif text-[22px] font-bold pl-4 border-l-4 border-[#4A99E9] mt-14 mb-5">
          投稿文を作成して、承認ボタンで投稿
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          戦略が固まったら、具体的な投稿文の作成を依頼する。「Xに投稿して」と言うだけで、Kaiが投稿案を作ってくれる。
        </p>

        {/* Chat demo 2 */}
        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="text-xs text-gray-500 tracking-wider mb-5 uppercase">
            実際の会話
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                私
              </div>
              <div>
                <div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  @Kai Xに投稿して。ソロプレナーの共感系で
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#e74c3c] text-white flex items-center justify-center text-sm font-bold shrink-0">
                K
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">
                  Kai・マーケティング
                </div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm border border-[#4A99E9]/30">
                  これでいく？
                  <br />
                  <br />
                  <span className="text-[#333]">
                    「ひとりで抱えすぎてない？マーケ・リサーチ・メール対応、複数アプリをまたぐ自動化まで、AIチームが丸ごと動きます。 #ソロプレナー #AI」
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <div className="px-3 py-1 bg-[#4A99E9] text-white text-[12px] font-bold rounded-lg">
                    投稿する
                  </div>
                  <div className="px-3 py-1 border border-gray-300 text-[12px] rounded-lg text-gray-600">
                    キャンセル
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          投稿案の下に「投稿する」ボタンが表示される。内容を確認して、OKなら押すだけ。自分のXアカウントに即投稿される。
        </p>

        {/* Highlight */}
        <div className="bg-[#e8f0fe] border-l-4 border-[#4A99E9] rounded-r-xl px-6 py-5 my-8">
          <p className="text-[#1a3a6e] font-medium text-[15px] leading-relaxed">
            勝手に投稿されることはない。必ず自分の目で確認して、承認してから投稿される。AIに任せつつ、最終判断は自分。
          </p>
        </div>

        {/* Section 3 */}
        <h2 className="font-serif text-[22px] font-bold pl-4 border-l-4 border-[#4A99E9] mt-14 mb-5">
          スケジュール投稿も、チャットで設定
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          毎回「投稿して」と言うのも手間になってくる。そんなときは、スケジュールを設定すればいい。
        </p>

        {/* Chat demo 3 */}
        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="text-xs text-gray-500 tracking-wider mb-5 uppercase">
            実際の会話
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                私
              </div>
              <div>
                <div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  @Kai 毎日9時と18時にX投稿して
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#e74c3c] text-white flex items-center justify-center text-sm font-bold shrink-0">
                K
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">
                  Kai・マーケティング
                </div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  X投稿のスケジュールを 09:00、18:00 に設定しました！その時間に投稿案を提案しますね。
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          設定した時間になると、Kaiが自動で投稿案をチャットに送ってくる。あとは「投稿する」を押すか、「キャンセル」するか選ぶだけ。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          忙しくて見れなかった？大丈夫。承認されなかった投稿案は次の提案まで待ってくれる。溜まることもない。
        </p>

        {/* Section 4 */}
        <h2 className="font-serif text-[22px] font-bold pl-4 border-l-4 border-[#4A99E9] mt-14 mb-5">
          やってみてわかったこと
        </h2>

        {/* Steps */}
        <div className="flex flex-col gap-5 my-8">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-[15px]">
                「何を投稿するか」を考えなくていい
              </h4>
              <p className="text-[15px] text-gray-500">
                事業内容を理解したうえで提案してくれるから、ゼロから考える負担がなくなった。
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-[15px]">
                投稿の質が安定する
              </h4>
              <p className="text-[15px] text-gray-500">
                自分で書くと日によってムラが出る。AIが過去の反応データも踏まえて書くから、トーンが安定する。
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-[15px]">
                勝手に投稿されない安心感
              </h4>
              <p className="text-[15px] text-gray-500">
                最終的には自分が承認ボタンを押す。完全自動じゃないからこそ、安心して任せられる。
              </p>
            </div>
          </div>
        </div>

        {/* Result box */}
        <div className="bg-[#111] text-white rounded-2xl p-7 my-8">
          <div className="text-xs text-gray-400 tracking-wider mb-4 uppercase">
            導入の効果
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10">
            <span className="text-gray-300">投稿作成にかかる時間</span>
            <span className="text-[#5dca8a] font-bold">30分 → 1分</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10">
            <span className="text-gray-300">投稿頻度</span>
            <span className="text-[#5dca8a] font-bold">週1〜2回 → 毎日</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-gray-300">ネタ切れのストレス</span>
            <span className="text-[#5dca8a] font-bold">ほぼゼロ</span>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          SNS運用は「やらなきゃ」と思いつつ後回しにしがちなタスクの代表格。それがmusuを使うと、チャットで相談 → 承認ボタンを押す、の2ステップに変わる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          AIに全部任せるんじゃない。チームに相談して、一緒に考えて、最終判断は自分がする。この「ちょうどいい距離感」がソロプレナーには合っている。
        </p>

        {/* CTA */}
        <div className="mt-16 bg-[#4A99E9] text-white rounded-[20px] px-6 md:px-10 py-12 text-center">
          <h2 className="font-serif text-2xl md:text-[26px] font-bold mb-4">
            あなたのチームを持とう
          </h2>
          <p className="text-white/80 mb-8 text-[15px] leading-relaxed max-w-md mx-auto">
            musuは、ソロプレナーのためのAIチーム。マーケティング、リサーチ、秘書。育てるほど、任せられる。
          </p>
          <Link
            href="/?signup=1"
            className="inline-block bg-white text-[#4A99E9] font-bold px-10 py-3.5 rounded-full text-[15px] no-underline hover:-translate-y-0.5 transition-transform shadow-lg"
          >
            無料ではじめる
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="text-center py-10 text-[13px] text-gray-500 border-t border-gray-200">
        © 2026 musu.world
      </footer>
    </div>
  );
}

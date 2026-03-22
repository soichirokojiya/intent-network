import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "「メールのデータ、スプレッドシートに入れといて」が現実になった話 | musu",
  description:
    "Gmailに届く売上メールを読んで、Googleスプレッドシートに自動で記録。musuのAIチームに頼んだら、仕様を伝えるだけで動き出した。",
  openGraph: {
    title:
      "「メールのデータ、スプレッドシートに入れといて」が現実になった話 | musu",
    description:
      "Gmailに届く売上メールを読んで、Googleスプレッドシートに自動で記録。musuのAIチームに頼んだら、仕様を伝えるだけで動き出した。",
  },
};

export default function EmailToSpreadsheetArticle() {
  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ lineHeight: 1.8 }}>
      {/* Header */}
      <header className="px-5 md:px-10 py-5 border-b border-gray-200 flex items-center gap-3">
        <Link
          href="/"
          className="text-[22px] font-bold text-[#4A99E9] no-underline font-serif"
        >
          musu
        </Link>
        <Link
          href="/media"
          className="text-xs text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded-full no-underline hover:border-[#4A99E9] transition-colors"
        >
          活用事例
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
            musu 活用事例
          </div>
          <h1 className="font-serif text-3xl md:text-[42px] font-bold leading-snug mb-6">
            「メールのデータ、
            <br />
            スプレッドシートに入れといて」
            <br />
            が現実になった話
          </h1>
          <p className="text-base text-white/70 max-w-[560px] leading-loose">
            Gmailに届く売上メールを読んで、Googleスプレッドシートに自動で記録。musuのAIチームに頼んだら、仕様を伝えるだけで動き出した。
          </p>
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-[760px] mx-auto px-5 md:px-6 py-10 md:py-16 pb-20 md:pb-24">
        <p className="text-base text-[#333] mb-6 leading-loose">
          道の駅の売上通知メールが、毎回届くたびに手作業でスプレッドシートに転記していた。日付、商品名、数量、金額。たった数行の作業でも、毎回やるとなると地味に時間がかかる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          ある日、musuの秘書エージェント「Mio」にこう話しかけてみた。
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
                  ではメールからとったデータを入れていって
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
                  道の駅むなかたの売上メールから17日分のデータ抽出したよ。以下の内容をA2以降に入れていい？
                  <br />
                  <br />
                  ・2026/1/21 MOIRAI ORGANICS &yen;2,380&times;1 / 島素材(猪肉ドッグフード)
                  &yen;880&times;1
                  <br />
                  ・2/8 MOIRAI ORGANICS &yen;2,380&times;1
                  <br />
                  ・2/11 MOIRAI ORGANICS &yen;2,380&times;2
                  <br />
                  …全部で26行になるけど、これでOKならそのまま書き込むよ〜
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
                M
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Mio・秘書</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  全23行入れたよ〜。1/21〜3/17の道の駅むなかた最終売上メール全件分。
                  <br />
                  <br />
                  MOIRAI ORGANICSが14点&yen;33,320、島素材(猪肉ドッグフード)が20点&yen;17,600、合計&yen;50,920。
                  <br />
                  <br />
                  シート確認してみて。あと今後の売上メールも自動でこのシートに反映する仕組み作る？
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          承認してから数秒でスプレッドシートへの書き込みが完了。合計金額の集計まで自動でやってくれた。これまで15分かかっていた作業が、チャット2往復で終わった。
        </p>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          何をしたのか、整理すると
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          難しいことは何もしていない。musuにGmailとGoogleスプレッドシートを連携させて、「こういう仕様でデータを入れてほしい」と話しかけただけだ。
        </p>

        {/* Steps */}
        <div className="my-8 flex flex-col gap-5">
          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              1
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                GmailとGoogleスプレッドシートをmusuに連携
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                管理画面から数クリックでOAuth接続。コードは一切不要。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              2
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                スプレッドシートの仕様をチャットで伝える
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                「日付・商品カテゴリ・商品名・単価・数量・売上金額の順で入れて」と話すだけ。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              3
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                エージェントがメールを読んでデータを抽出
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                Gmailの売上通知メールを自動で読み取り、必要なデータだけを整理する。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              4
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                確認して「ok」と返すだけ
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                書き込む前に内容を見せてくれるので、承認してから実行される。安心して任せられる。
              </p>
            </div>
          </div>
        </div>

        {/* Result box */}
        <div className="bg-[#111] text-white rounded-2xl p-7 my-8">
          <div className="text-[13px] opacity-50 mb-4 tracking-wider">
            自動集計された結果
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10 text-[15px]">
            <span className="opacity-60">MOIRAI ORGANICS</span>
            <span className="font-bold text-[#5dca8a]">14点 &yen;33,320</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10 text-[15px]">
            <span className="opacity-60">島素材（猪肉ドッグフード）</span>
            <span className="font-bold text-[#5dca8a]">20点 &yen;17,600</span>
          </div>
          <div className="flex justify-between py-2.5 text-[15px]">
            <span className="opacity-60">合計</span>
            <span className="font-bold text-[#5dca8a]">&yen;50,920</span>
          </div>
        </div>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          ポイントは「承認してから実行」という設計
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          musuは勝手に動くのではなく、実行前に必ず確認を取ってくれる。「これでいい？」と聞いてくれるから、間違いがあれば止められる。AIに任せることへの不安が、この一手間で消える。
        </p>

        {/* Highlight box */}
        <div className="bg-[#e8f0fe] border-l-4 border-[#4A99E9] rounded-r-xl px-6 py-5 my-8">
          <p className="text-[#1a3a6e] font-medium !mb-0">
            「育てるほど、任せられる」というmusuのコンセプトはここにある。最初は確認しながら、慣れてきたら自動実行へ。信頼を積み重ねながら、少しずつ任せる範囲を広げていける。
          </p>
        </div>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          次のステップ：今後は自動で反映される
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          Mioが最後にこう聞いてきた。「今後の売上メールも自動でこのシートに反映する仕組み作る？」
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          そう、一度仕様を覚えたmusuは、次からは自動で動いてくれる。メールが届くたびに通知が来て、確認→反映まで完結する。手作業はゼロになる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          これがmusuの本質だ。最初は「やり方を教える」ところから始まって、使えば使うほど任せられる範囲が広がっていく。
        </p>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          ソロプレナーに伝えたいこと
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          エンジニアじゃなくていい。プログラミングの知識もいらない。「こういうことをしてほしい」と話しかけるだけで、AIチームが動いてくれる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          あなたがやるべきは、仕様を伝えることだけだ。
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

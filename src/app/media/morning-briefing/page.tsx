import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "朝起きたら、今日やることが整理されている生活 | musu",
  description:
    "Googleカレンダーの予定、重要メール、業界ニュース。毎朝musuが自動でブリーフィングを届けてくれる。",
  openGraph: {
    title:
      "朝起きたら、今日やることが整理されている生活 | musu",
    description:
      "Googleカレンダーの予定、重要メール、業界ニュース。毎朝musuが自動でブリーフィングを届けてくれる。",
    images: [
      {
        url: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "朝起きたら、今日やることが整理されている生活 | musu",
    description:
      "Googleカレンダーの予定、重要メール、業界ニュース。毎朝musuが自動でブリーフィングを届けてくれる。",
    images: [
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=630&fit=crop",
    ],
  },
};

export default function MorningBriefingArticle() {
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
            朝起きたら、
            <br />
            今日やることが
            <br />
            整理されている生活
          </h1>
          <p className="text-base text-white/70 max-w-[560px] leading-loose">
            Googleカレンダーの予定、重要メール、業界ニュース。毎朝musuが自動でブリーフィングを届けてくれる。
          </p>
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-[760px] mx-auto px-5 md:px-6 py-10 md:py-16 pb-20 md:pb-24">
        <p className="text-base text-[#333] mb-6 leading-loose">
          朝起きてからの30分。カレンダーを確認して、メールをチェックして、ニュースを見て、SNSの投稿を考える。毎日同じルーティンなのに、毎日同じ時間がかかる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          「これ、musuに任せられないかな」と思って、秘書エージェントのMioに設定してみた。
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
                  毎朝8時に今日の予定とニュースを教えて
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
                  設定したよ。毎朝8時にこの3つをまとめて送るね。
                  <br />
                  <br />
                  ・Googleカレンダーの今日の予定
                  <br />
                  ・重要なメールのサマリー
                  <br />
                  ・事業に関連するニュース
                  <br />
                  <br />
                  明日の朝から届くよ〜
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          翌朝、8時ちょうどにMioからメッセージが届いた。
        </p>

        {/* Morning briefing demo */}
        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="text-xs text-gray-500 tracking-wider mb-5 uppercase">
            朝のブリーフィング
          </div>
          <div className="flex flex-col gap-4">
            {/* AI bubble - briefing */}
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
                M
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Mio・秘書</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  おはよう。今日のブリーフィングだよ。
                  <br />
                  <br />
                  <strong>今日の予定</strong>
                  <br />
                  ・10:00 ○○ミーティング（Zoom）
                  <br />
                  ・14:00 取引先訪問（○○ビル）
                  <br />
                  ・17:00 経理作業（リマインダー）
                  <br />
                  <br />
                  <strong>重要メール</strong>
                  <br />
                  ・○○株式会社から見積依頼（昨夜22:30着）
                  <br />
                  <br />
                  <strong>ニュース</strong>
                  <br />
                  ・○○業界で新規制の動き。来月施行予定で、影響ありそう
                </div>
              </div>
            </div>

            {/* AI bubble - tweet suggestion */}
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">
                M
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Mio・秘書</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  ニュースに関連して、こんなポストどう？
                  <br />
                  <br />
                  「○○業界に新しい規制。現場でやってる身としては△△の影響が大きそう。準備しておきたいポイントをまとめます」
                  <br />
                  <br />
                  投稿する？
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
                  いいね、投稿して
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
                  投稿したよ。今日もいい一日を！
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          スマホを開いたら、もう今日やるべきことが整理されている。メールもニュースもチェック済み。SNSの投稿まで準備されている。朝の30分が、ゼロになった。
        </p>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          何をしたのか、整理すると
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          Googleカレンダー、Gmail、ニュース取得を連携させて、毎朝の定時実行を設定しただけ。やったことは「毎朝8時に教えて」と伝えたこと。
        </p>

        {/* Steps */}
        <div className="my-8 flex flex-col gap-5">
          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              1
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                Googleカレンダー・Gmailをmusuに連携
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                OAuth接続で数クリック。ニュース取得は連携不要で使える。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              2
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                「毎朝8時に教えて」と伝える
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                定時実行のスケジュールを会話で設定。曜日指定も可能。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              3
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                毎朝ブリーフィングが届く
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                予定・メール・ニュースが1つのメッセージにまとまって届く。
              </p>
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">
              4
            </div>
            <div>
              <h4 className="text-base font-bold mb-1.5">
                SNS投稿案も提案してくれる
              </h4>
              <p className="text-[15px] text-gray-500 !mb-0">
                ニュースに関連したポスト案を作成。承認するだけで投稿完了。
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
            <span className="opacity-60">朝の準備時間</span>
            <span className="font-bold text-[#5dca8a]">30分 → 0分</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10 text-[15px]">
            <span className="opacity-60">情報収集</span>
            <span className="font-bold text-[#5dca8a]">musuが先にやってくれる</span>
          </div>
          <div className="flex justify-between py-2.5 text-[15px]">
            <span className="opacity-60">SNS投稿</span>
            <span className="font-bold text-[#5dca8a]">承認するだけ</span>
          </div>
        </div>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          「自分の秘書がいる」という感覚
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          大企業の社長には秘書がいて、朝一番に今日のスケジュールと重要な情報を整理してくれる。ソロプレナーにはそれがない。でもmusuがあれば、同じことができる。
        </p>

        {/* Highlight box */}
        <div className="bg-[#e8f0fe] border-l-4 border-[#4A99E9] rounded-r-xl px-6 py-5 my-8">
          <p className="text-[#1a3a6e] font-medium !mb-0">
            朝のブリーフィングは、musuで既に実装済みの機能。Googleカレンダー連携とニュース取得を組み合わせて、毎朝自動で実行される。設定は会話だけで完了する。
          </p>
        </div>

        {/* H2 */}
        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          ソロプレナーに伝えたいこと
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          毎朝のルーティンは「やらなきゃいけないこと」であって「やりたいこと」ではない。その時間をmusuに任せれば、朝一番から本当にやりたい仕事に集中できる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          起きたら、もう準備が終わっている。そんな生活が、チャット一つで手に入る。
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

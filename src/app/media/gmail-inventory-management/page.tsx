import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Gmailの売上メールから在庫管理を自動化した話 | musu",
  description:
    "売上通知メールが届くたびに手動で在庫を更新していた作業を、musuに任せたら完全自動化できた。スプレッドシートで在庫管理システムを作った実例。",
  openGraph: {
    title: "Gmailの売上メールから在庫管理を自動化した話 | musu",
    description:
      "売上通知メールが届くたびに手動で在庫を更新していた作業を、musuに任せたら完全自動化できた。",
  },
};

export default function GmailInventoryArticle() {
  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ lineHeight: 1.8 }}>
      {/* Header */}
      <header className="px-5 md:px-10 py-5 border-b border-gray-200 flex items-center gap-3">
        <Link href="/" className="text-[22px] font-bold text-[#4A99E9] no-underline font-serif">musu</Link>
        <Link href="/media" className="text-xs text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded-full no-underline hover:border-[#4A99E9] transition-colors">活用事例</Link>
      </header>

      {/* Hero */}
      <section className="bg-[#4A99E9] text-white px-5 md:px-10 py-12 md:py-20 relative overflow-hidden">
        <div className="absolute -top-[60px] -right-[60px] w-[300px] h-[300px] rounded-full bg-white/5" />
        <div className="max-w-[760px] mx-auto relative">
          <div className="text-[13px] tracking-wider opacity-70 mb-5 uppercase">musu 活用事例</div>
          <h1 className="font-serif text-2xl md:text-4xl font-bold leading-snug mb-6">
            Gmailの売上メールから
            <br />
            在庫管理を自動化した話
          </h1>
          <p className="text-base opacity-85 max-w-[560px] leading-loose">
            売上通知メールが届くたびに手動で在庫を更新していた。musuに「売れた分を引いて」と頼んだら、在庫管理システムが出来上がった。
          </p>
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-[760px] mx-auto px-5 md:px-6 py-10 md:py-16 pb-20 md:pb-24">
        <p className="text-base text-[#333] mb-6 leading-loose">
          道の駅に商品を卸している。売れるたびに通知メールが届くのだが、そのデータをもとに在庫数を手動で管理していた。Excelを開いて、メールを見て、数量を引く。単純だが、毎日やると積もる。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          ある日、musuのデータサイエンティスト「Nao」にこう相談してみた。
        </p>

        {/* Chat demo 1 */}
        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="text-xs text-gray-500 tracking-wider mb-5 uppercase">実際の会話</div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">私</div>
              <div><div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">在庫管理のスプレッドシート作ってくれない？商品名・現在庫数・最終更新日が入ってるやつ</div></div>
            </div>
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">N</div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Nao・データサイエンティスト</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  作ったよ。「在庫管理」ってタイトルでスプレッドシート作成した。
                  <br /><br />
                  シート構成はこう:
                  <br />
                  ・A列: 商品名
                  <br />
                  ・B列: 現在庫数
                  <br />
                  ・C列: 最終更新日
                  <br /><br />
                  まず商品と初期在庫を教えて。入力しておくよ。
                </div>
              </div>
            </div>
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">私</div>
              <div><div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">MOIRAI ORGANICS 50個、猪肉ドッグフード 100個</div></div>
            </div>
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">N</div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Nao・データサイエンティスト</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  入力したよ。
                  <br /><br />
                  ・MOIRAI ORGANICS: 50個
                  <br />
                  ・猪肉ドッグフード: 100個
                  <br /><br />
                  次は自動化だね。売上メールが来たら自動で在庫を引く仕組みも作る？
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          数秒でスプレッドシートが作られ、初期データも入った。ここまではまだ手動の範囲。本番はここからだ。
        </p>

        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          売上メールから自動で在庫を引く
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          在庫管理で一番面倒なのは「売れた分を引く」作業だ。メールを見て、どの商品が何個売れたか確認して、シートを開いて数字を修正する。これを毎日やっていた。
        </p>

        {/* Chat demo 2 */}
        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="text-xs text-gray-500 tracking-wider mb-5 uppercase">自動化の設定</div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">私</div>
              <div><div className="bg-[#4A99E9] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">道の駅の売上メールが来たら、自動で在庫を引いてほしい</div></div>
            </div>
            <div className="flex gap-2.5 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">N</div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">Nao・データサイエンティスト</div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                  自動化ルールを作ったよ。
                  <br /><br />
                  ・トリガー: 道の駅むなかたからの売上メール受信
                  <br />
                  ・処理: メールから商品名と数量を抽出
                  <br />
                  ・アクション: 在庫シートの該当商品の数量を減算
                  <br /><br />
                  1時間ごとにメールをチェックするよ。売上があったら在庫を自動で更新して、チャットで報告する。
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          これだけで設定完了。翌日から、こんな報告がチャットに届くようになった。
        </p>

        {/* Notification example */}
        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="text-xs text-gray-500 tracking-wider mb-5 uppercase">自動実行の報告</div>
          <div className="flex gap-2.5 items-start">
            <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">N</div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">Nao・データサイエンティスト</div>
              <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                在庫更新したよ。道の駅むなかたの売上メール2件を処理した。
                <br /><br />
                ・MOIRAI ORGANICS: 50→47（3個売れた）
                <br />
                ・猪肉ドッグフード: 100→95（5個売れた）
                <br /><br />
                在庫シートを更新済み。
              </div>
            </div>
          </div>
        </div>

        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          何が変わったか
        </h2>

        {/* Result box */}
        <div className="bg-[#111] text-white rounded-2xl p-7 my-8">
          <div className="text-[13px] opacity-50 mb-4 tracking-wider">ビフォー・アフター</div>
          <div className="flex justify-between py-2.5 border-b border-white/10 text-[15px]">
            <span className="opacity-60">在庫確認の作業時間</span>
            <span className="font-bold text-[#5dca8a]">15分/日 → 0分</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10 text-[15px]">
            <span className="opacity-60">在庫数のズレ</span>
            <span className="font-bold text-[#5dca8a]">月2〜3回 → 0回</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-white/10 text-[15px]">
            <span className="opacity-60">欠品の見落とし</span>
            <span className="font-bold text-[#5dca8a]">あった → なくなった</span>
          </div>
          <div className="flex justify-between py-2.5 text-[15px]">
            <span className="opacity-60">セットアップ時間</span>
            <span className="font-bold text-[#5dca8a]">チャット5分</span>
          </div>
        </div>

        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          仕組みはシンプル
        </h2>

        <div className="my-8 flex flex-col gap-5">
          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">1</div>
            <div>
              <h4 className="text-base font-bold mb-1.5">GmailとGoogleスプレッドシートを連携</h4>
              <p className="text-[15px] text-gray-500 !mb-0">アプリ連携画面から数クリック。コードは不要。</p>
            </div>
          </div>
          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">2</div>
            <div>
              <h4 className="text-base font-bold mb-1.5">在庫管理シートを作成してもらう</h4>
              <p className="text-[15px] text-gray-500 !mb-0">「在庫管理のシート作って」と話しかけるだけ。商品と数量を伝えれば初期データも入る。</p>
            </div>
          </div>
          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">3</div>
            <div>
              <h4 className="text-base font-bold mb-1.5">自動化ルールを設定</h4>
              <p className="text-[15px] text-gray-500 !mb-0">「売上メールが来たら在庫を引いて」と伝えるだけ。エージェントがルールを作成する。</p>
            </div>
          </div>
          <div className="flex gap-5 items-start">
            <div className="w-10 h-10 rounded-full bg-[#4A99E9] text-white flex items-center justify-center font-bold text-base shrink-0">4</div>
            <div>
              <h4 className="text-base font-bold mb-1.5">あとは放っておくだけ</h4>
              <p className="text-[15px] text-gray-500 !mb-0">メールが届くたびに自動で在庫が更新される。結果はチャットで報告してくれる。</p>
            </div>
          </div>
        </div>

        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          在庫が少なくなったら教えてくれる
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          さらに便利なのは、在庫が少なくなった時にエージェントが気づいて教えてくれることだ。
        </p>

        <div className="bg-[#f0f4f8] rounded-2xl p-6 md:p-7 my-8">
          <div className="flex gap-2.5 items-start">
            <div className="w-9 h-9 rounded-full bg-[#4A99E9] text-white flex items-center justify-center text-sm font-bold shrink-0">N</div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">Nao・データサイエンティスト</div>
              <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm">
                そういえば、MOIRAI ORGANICSの在庫が残り5個になってるよ。そろそろ追加納品のタイミングじゃない？
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-[#333] mb-6 leading-loose">
          これはmusuの「能動的な声かけ」機能だ。エージェントがデータを見て、気づいたことを自発的に教えてくれる。言われて初めて「あ、発注しなきゃ」と気づく。欠品を防げるのは、この一言のおかげだ。
        </p>

        <div className="bg-[#e8f0fe] border-l-4 border-[#4A99E9] rounded-r-xl px-6 py-5 my-8">
          <p className="text-[#1a3a6e] font-medium !mb-0">
            在庫管理に必要なのは、高機能なシステムではない。「売れたら引く」「少なくなったら教える」。それだけのことを、確実にやってくれる仲間がいればいい。
          </p>
        </div>

        <h2 className="font-serif text-[22px] font-bold text-[#111] mt-14 mb-5 pl-4 border-l-4 border-[#4A99E9]">
          ソロプレナーの在庫管理
        </h2>

        <p className="text-base text-[#333] mb-6 leading-loose">
          大企業向けの在庫管理システムは高い。月額数万円、導入に数ヶ月。ソロプレナーにはオーバースペックだ。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          musuなら、スプレッドシート1枚とチャット5分で在庫管理が始まる。売上メールを読んで、在庫を引いて、少なくなったら教えてくれる。それで十分だ。
        </p>

        <p className="text-base text-[#333] mb-6 leading-loose">
          あなたがやるべきは、「こういう管理をしたい」と伝えることだけ。あとはチームが動いてくれる。
        </p>

        {/* CTA */}
        <div className="bg-[#4A99E9] text-white rounded-[20px] px-6 md:px-10 py-12 text-center mt-16">
          <h2 className="font-serif text-2xl md:text-[26px] font-bold mb-3">ひとりだけど、ひとりじゃない。</h2>
          <p className="opacity-85 mb-7">
            育てるほど、任せられる。あなただけの仲間を持とう。
            <br />
            初回クレジット付きで、まずは無料で試せます。
          </p>
          <Link href="/" className="inline-block bg-white text-[#4A99E9] font-bold text-base px-10 py-3.5 rounded-full no-underline hover:-translate-y-0.5 transition-transform">
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

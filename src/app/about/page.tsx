import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "musuについて - ソロプレナーのためのAIエージェントチーム",
  description:
    "ひとりだけど、ひとりじゃない。育てるほど、任せられる。あなただけの仲間を持とう。musuはソロプレナーのためのAIワークスペースです。",
  openGraph: {
    title: "ひとりだけど、ひとりじゃない。- musu",
    description:
      "育てるほど、任せられる。あなただけの仲間を持とう。musuはソロプレナーのためのAIワークスペースです。",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const painPoints = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "朝から晩まで、全部ひとり",
    desc: "営業、経理、マーケ、事務。ひとり何役もこなす毎日。本当にやりたい仕事に集中できていますか？",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "人を雇う余裕はない",
    desc: "アシスタントが欲しい。でも固定費は増やせない。採用・教育のコストも時間もない。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </svg>
    ),
    title: "相談相手がいない",
    desc: "壁打ち、戦略の確認、ちょっとした判断。ひとりだと、誰にも聞けない瞬間がある。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    title: "同じ作業を毎日繰り返している",
    desc: "メールを見て、スプレッドシートに転記して、在庫を確認して。自動化したいけど、エンジニアじゃないから仕組みが作れない。",
  },
];

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "専門チームがつく",
    desc: "マーケティング、リサーチ、戦略、秘書。それぞれ専門のAIが、あなたのチームとして動きます。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "話すだけで動く",
    desc: "「競合を調べて」「来週の予定を教えて」「この内容でメールして」。話しかけるだけで、チームが動きます。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    title: "あなたの事業を覚える",
    desc: "方針、決定事項、お客さん情報。会話するほど、チームはあなたの事業を理解していきます。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "毎朝のブリーフィング",
    desc: "今日の予定、業界ニュース、タスクの状況。朝チャットを開くだけで、1日の見通しが立ちます。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: "メール・SNSも任せる",
    desc: "「/mail」でメール作成、「/post」でX投稿。文面を確認してからワンタップで送信。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "月額固定費ゼロ",
    desc: "使った分だけ。初回クレジット付きで、まずは無料で試せます。500円からチャージ可能。",
  },
];

const integrations = [
  { name: "Gmail", desc: "メール送受信", logo: "/logos/gmail.webp" },
  { name: "Google Calendar", desc: "予定管理", logo: "/logos/google-calendar.jpg" },
  { name: "Google Drive", desc: "ファイル参照", logo: "/logos/google-drive.jpeg" },
  { name: "Notion", desc: "ナレッジ同期", logo: "/logos/notion.png" },
  { name: "Slack", desc: "チャット連携", logo: "/logos/slack.png" },
  { name: "Trello", desc: "タスク管理", logo: "/logos/trello.svg" },
  { name: "X (Twitter)", desc: "SNS投稿", logo: "/logos/x.svg" },
  { name: "LINE", desc: "ログイン連携", logo: "/logos/line.svg" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4A99E9] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 40 40" width="18" height="18" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
              </svg>
            </div>
            <span className="text-lg font-extrabold">musu</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/media" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
              musu lab
            </Link>
            <Link href="/help" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
              ヘルプ
            </Link>
            <Link
              href="/"
              className="text-sm font-bold text-white bg-[#4A99E9] hover:bg-[#3a89d9] px-4 py-2 rounded-full transition-colors"
            >
              無料ではじめる
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#4A99E9] font-bold text-sm tracking-wide mb-4">
            ソロプレナーのためのAIワークスペース
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            ひとりだけど、
            <br />
            ひとりじゃない。
          </h1>
          <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-4 max-w-xl mx-auto">
            育てるほど、任せられる。
          </p>
          <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto">
            あなただけの仲間を持とう。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto text-center bg-[#4A99E9] hover:bg-[#3a89d9] text-white font-bold px-8 py-3.5 rounded-full text-[16px] transition-colors"
            >
              無料ではじめる
            </Link>
            <Link
              href="/help"
              className="w-full sm:w-auto text-center border border-gray-200 hover:border-gray-300 text-gray-700 font-bold px-8 py-3.5 rounded-full text-[16px] transition-colors"
            >
              使い方を見る
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="px-5 py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4">
            こんな悩み、ありませんか？
          </h2>
          <p className="text-gray-400 text-center mb-12">
            ソロプレナーの日常は、常にリソース不足との戦い。
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-2xl p-6 border border-gray-100"
              >
                <div className="text-gray-400 mb-4">{p.icon}</div>
                <h3 className="font-extrabold text-lg mb-2">{p.title}</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Intro */}
      <section className="px-5 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#4A99E9] font-bold text-sm px-4 py-2 rounded-full mb-6">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            musuの解決策
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
            AIの専門チームを、
            <br className="hidden md:inline" />
            あなたの会社に。
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-xl mx-auto">
            musuは、それぞれ専門分野を持つAIエージェントが
            チームとしてあなたの仕事をサポートするワークスペースです。
            雇用コストゼロで、即戦力のチームが手に入ります。
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12">
            できること
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#4A99E9] mb-4">
                  {f.icon}
                </div>
                <h3 className="font-extrabold mb-2">{f.title}</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-5 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#4A99E9] font-bold text-sm px-4 py-2 rounded-full mb-6">
              musu lab
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
              話しかけるだけで、仕事が動く。
            </h2>
            <p className="text-gray-500">
              musuを使っているソロプレナーたちのリアルな事例。
            </p>
          </div>

          {/* Case 1: メール→スプレッドシート */}
          <div className="border border-gray-200 rounded-2xl p-6 md:p-8 mb-6">
            <h3 className="font-extrabold text-lg mb-4">「メールのデータ、スプレッドシートに入れといて」</h3>
            <div className="bg-[#f0f4f8] rounded-2xl p-5 mb-6">
              <div className="space-y-3">
                <div className="flex justify-end gap-2">
                  <div className="bg-[#4A99E9] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%]">
                    メールからとったデータをスプレッドシートに入れていって
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-[#4A99E9] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">M</div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[85%] shadow-sm">
                    17日分のデータ抽出したよ。26行になるけど、OKならそのまま書き込むよ〜
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 text-white rounded-xl p-5 mb-5">
              <div className="flex justify-between py-2 text-sm">
                <span className="opacity-60">MOIRAI ORGANICS</span>
                <span className="font-bold text-[#5dca8a]">14点 ¥33,320</span>
              </div>
              <div className="flex justify-between py-2 text-sm border-t border-white/10">
                <span className="opacity-60">合計</span>
                <span className="font-bold text-[#5dca8a]">¥50,920</span>
              </div>
            </div>
            <Link href="/media/email-to-spreadsheet" className="text-[#4A99E9] font-bold text-sm hover:underline">
              この事例の詳細を読む →
            </Link>
          </div>

          {/* Case 2: 在庫管理 */}
          <div className="border border-gray-200 rounded-2xl p-6 md:p-8 mb-6">
            <h3 className="font-extrabold text-lg mb-4">「売上メールが来たら、自動で在庫を引いて」</h3>
            <div className="bg-[#f0f4f8] rounded-2xl p-5 mb-6">
              <div className="space-y-3">
                <div className="flex justify-end gap-2">
                  <div className="bg-[#4A99E9] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%]">
                    道の駅の売上メールが来たら、自動で在庫を引いてほしい
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-[#4A99E9] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">N</div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[85%] shadow-sm">
                    自動化ルール作ったよ。1時間ごとにメールをチェックして、売上があったら在庫を更新するね。
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 text-white rounded-xl p-5 mb-5">
              <div className="flex justify-between py-2 text-sm">
                <span className="opacity-60">在庫確認の作業時間</span>
                <span className="font-bold text-[#5dca8a]">15分/日 → 0分</span>
              </div>
              <div className="flex justify-between py-2 text-sm border-t border-white/10">
                <span className="opacity-60">セットアップ</span>
                <span className="font-bold text-[#5dca8a]">チャット5分</span>
              </div>
            </div>
            <Link href="/media/gmail-inventory-management" className="text-[#4A99E9] font-bold text-sm hover:underline">
              この事例の詳細を読む →
            </Link>
          </div>

          <div className="bg-blue-50 border-l-4 border-[#4A99E9] rounded-r-xl p-5">
            <p className="text-[#1a3a6e] text-sm font-medium leading-relaxed">
              「育てるほど、任せられる」というmusuのコンセプトはここにある。最初は確認しながら、慣れてきたら自動実行へ。信頼を積み重ねながら、少しずつ任せる範囲を広げていける。
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12">
            使い方はシンプル
          </h2>
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "話しかける",
                desc: "「競合を調べて」「来週の予定を教えて」。チャットで話しかけるだけ。",
              },
              {
                step: "2",
                title: "チームが動く",
                desc: "最適なメンバーが自動で担当。マーケの相談はマーケ担当、調べ物はリサーチ担当へ。",
              },
              {
                step: "3",
                title: "仕事が進む",
                desc: "メール作成、SNS投稿、リサーチ結果、戦略提案。チームがあなたの手足になります。",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-5 items-start">
                <div className="w-10 h-10 bg-[#4A99E9] rounded-full flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg mb-1">{s.title}</h3>
                  <p className="text-[15px] text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="px-5 py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-4">
            いつものツールと連携
          </h2>
          <p className="text-gray-400 text-center mb-12">
            すでに使っているサービスをつなぐだけ。データの移行は不要です。
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {integrations.map((i) => (
              <div
                key={i.name}
                className="bg-white rounded-xl p-5 border border-gray-100 text-center flex flex-col items-center"
              >
                <img src={i.logo} alt={i.name} width={32} height={32} className="mb-3 rounded-md object-contain" />
                <p className="font-bold text-[14px] mb-1">{i.name}</p>
                <p className="text-[12px] text-gray-400">{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 py-16 md:py-24">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">料金</h2>
          <p className="text-gray-500 mb-8">
            月額固定費なし。使った分だけ。
          </p>
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <p className="text-[#4A99E9] font-bold text-sm mb-2">従量課金</p>
            <p className="text-4xl font-extrabold mb-1">
              ¥0<span className="text-lg text-gray-400 font-normal"> / 月額基本料</span>
            </p>
            <p className="text-[14px] text-gray-400 mb-6">
              初回クレジット付き。500円からチャージ可能。
            </p>
            <ul className="text-left text-[14px] text-gray-600 space-y-2 mb-6 max-w-xs mx-auto">
              {[
                "AIチームメンバー無制限",
                "全アプリ連携対応",
                "メール・SNS投稿機能",
                "記憶・ナレッジ共有",
                "毎朝のブリーフィング",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#4A99E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/"
              className="inline-block w-full bg-[#4A99E9] hover:bg-[#3a89d9] text-white font-bold py-3 rounded-full text-[15px] transition-colors"
            >
              無料ではじめる
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20 md:py-28 bg-[#4A99E9] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            ひとりの限界を、
            <br />
            チームで超えよう。
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            musuがあれば、ひとり会社でもチームで動ける。
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-[#4A99E9] font-bold px-10 py-4 rounded-full text-[16px] hover:bg-blue-50 transition-colors"
          >
            無料ではじめる
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#4A99E9] rounded-md flex items-center justify-center">
              <svg viewBox="0 0 40 40" width="14" height="14" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
              </svg>
            </div>
            <span className="text-sm font-extrabold">musu</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-[12px] text-gray-400">
            <Link href="/help" className="hover:underline">ヘルプ</Link>
            <Link href="/contact" className="hover:underline">お問い合わせ</Link>
            <Link href="/terms" className="hover:underline">利用規約</Link>
            <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
            <a href="https://cfac.co.jp/" target="_blank" rel="noopener noreferrer" className="hover:underline">運営会社</a>
          </div>
          <p className="text-[12px] text-gray-400">&copy; 2026 musu.world</p>
        </div>
      </footer>
    </div>
  );
}

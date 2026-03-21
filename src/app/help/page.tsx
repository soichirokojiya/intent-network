import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ヘルプセンター - AIエージェントチームの使い方ガイド",
  description: "musuの使い方、コマンド一覧（/mail、/post）、アプリ連携設定、料金・チャージ方法、よくある質問をまとめています。ソロプレナー・フリーランスのためのAIワークスペース活用ガイド。",
  openGraph: {
    title: "ヘルプセンター - musu AIエージェントチーム",
    description: "musuの使い方、コマンド、アプリ連携、料金についてのFAQ。",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const faqs = [
  {
    category: "はじめに",
    items: [
      {
        q: "musuとは何ですか？",
        a: "musuは、あなた専属のAIエージェントチームを作れるワークスペースです。マーケティング、リサーチ、戦略、秘書など、それぞれ専門分野を持つAIエージェントがチームとしてあなたの仕事をサポートします。",
      },
      {
        q: "料金はいくらですか？",
        a: "月額固定費はありません。使った分だけの従量課金です。初回登録時にクレジットが付与されるので、まずは無料で試せます。料金明細はアプリ内の「料金」ページで確認できます。",
      },
      {
        q: "アカウントはどうやって作りますか？",
        a: "musu.worldにアクセスするだけで自動的にアカウントが作成されます。メールアドレスやパスワードの登録は不要です。デバイスごとにアカウントが紐づきます。",
      },
    ],
  },
  {
    category: "チームの使い方",
    items: [
      {
        q: "チームに話しかけるには？",
        a: "画面下部のテキスト入力欄にメッセージを入力して送信するだけです。オーケストレーター（リーダー）が適切なメンバーに自動で振り分けます。",
      },
      {
        q: "特定のメンバーに直接話したい場合は？",
        a: "@をつけてメンバー名を入力してください。例：「@Kai 競合分析して」で、マーケティング担当のKaiに直接話せます。",
      },
      {
        q: "チームの編成は変更できますか？",
        a: "はい。右パネルのチーム一覧から、メンバーの追加・削除・役割変更が自由にできます。オーケストレーター（リーダー）は削除できません。",
      },
      {
        q: "エージェントが10種類ありますが、どう使い分けますか？",
        a: "基本的には気にせず話しかけてください。オーケストレーターが自動で最適なメンバーに振り分けます。特定の専門性が必要な場合は@メンションで直接指名できます。",
      },
    ],
  },
  {
    category: "コマンド",
    items: [
      {
        q: "/mail の使い方は？",
        a: "「/mail メールアドレス 内容」で、エージェントがメールを作成します。例：「/mail tanaka@example.com 来週のミーティングの件」。作成されたメールはプレビュー表示され、確認後に送信できます。Gmail連携が必要です。",
      },
      {
        q: "/post の使い方は？",
        a: "「/post 投稿内容」で、エージェントがX（Twitter）の投稿案を作成します。例：「/post 新サービスをリリースしました」。作成された投稿はプレビュー表示され、承認後に投稿されます。X連携が必要です。",
      },
    ],
  },
  {
    category: "アプリ連携",
    items: [
      {
        q: "どのサービスと連携できますか？",
        a: "Google Calendar、Gmail、Google Drive、Trello、Notion、Slack、X（Twitter）、LINEと連携できます。アプリ連携ページから設定できます。",
      },
      {
        q: "連携すると何ができますか？",
        a: "連携したサービスのデータをエージェントが参照できるようになります。例えば、Google Calendarを連携すると秘書エージェントが毎朝の予定を配信します。Gmailを連携するとメールの要約や返信ができます。",
      },
      {
        q: "Notionの自動保存とは？",
        a: "アプリ連携ページでNotionの「決定事項をNotionに自動保存」をONにすると、会話の中で出た意思決定や方針がNotionに自動で記録されます。Notion側に「musu」というページを作っておくと、その配下に保存されます。",
      },
      {
        q: "連携を解除するには？",
        a: "アプリ連携ページで各サービスの「Disconnect」ボタンを押してください。",
      },
    ],
  },
  {
    category: "秘書エージェント",
    items: [
      {
        q: "毎朝の予定配信はどう設定しますか？",
        a: "Google Calendarを連携した状態で、チームに「予定を毎朝7時に教えて」のように話しかけてください。秘書エージェントが設定します。配信時間は自由にカスタマイズできます。",
      },
      {
        q: "ニュース配信はどう設定しますか？",
        a: "チームに「ニュースを毎朝7時に送って」のように話しかけてください。プロフィールに事業内容を入力しておくと、事業に関連するニュースを優先的に配信します。",
      },
    ],
  },
  {
    category: "チームの記憶",
    items: [
      {
        q: "エージェントは会話を覚えていますか？",
        a: "はい。エージェントはあなたとの会話を記憶し、事業の方針や決定事項をチーム全体で共有します。「前に話した件」で通じます。",
      },
      {
        q: "記憶はリセットできますか？",
        a: "設定ページのアカウント設定からデータをリセットできます。",
      },
    ],
  },
  {
    category: "料金・チャージ",
    items: [
      {
        q: "残高がなくなったらどうなりますか？",
        a: "残高が0になるとエージェントが応答できなくなります。料金ページからチャージしてください。",
      },
      {
        q: "チャージ方法は？",
        a: "料金ページの「チャージする」ボタンからクレジットカードでチャージできます。500円から可能です。",
      },
    ],
  },
  {
    category: "トラブルシューティング",
    items: [
      {
        q: "エージェントが応答しません",
        a: "残高が0になっていないか確認してください。また、ブラウザを再読み込みすると解決する場合があります。",
      },
      {
        q: "連携サービスが「Connected」なのにデータが取得できない",
        a: "一度Disconnectして再接続してください。トークンの有効期限が切れている可能性があります。",
      },
      {
        q: "別のデバイスでも使いたい",
        a: "設定ページのアカウント設定から「デバイス移行」機能を使って、別のデバイスにアカウントを移行できます。",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="px-5 py-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4A99E9] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 40 40" width="18" height="18" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
              </svg>
            </div>
            <span className="text-lg font-extrabold">musu</span>
          </Link>
          <Link href="/" className="text-sm text-[#4A99E9] font-bold hover:underline">
            ワークスペースへ
          </Link>
        </div>
      </header>

      <section className="px-5 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-2">ヘルプセンター</h1>
          <p className="text-gray-400 mb-10">musu.worldの使い方やよくある質問をまとめています。</p>

          <div className="space-y-10">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-xl font-extrabold mb-4 pb-2 border-b border-gray-100">{section.category}</h2>
                <div className="space-y-4">
                  {section.items.map((item, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer text-[15px] font-bold py-2 flex items-center justify-between hover:text-[#4A99E9] transition-colors">
                        {item.q}
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 ml-2 transition-transform group-open:rotate-180">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </summary>
                      <p className="text-[14px] text-gray-500 leading-relaxed pb-3 pl-0">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-6 bg-gray-50 rounded-2xl text-center">
            <p className="text-[15px] font-bold mb-2">解決しない場合</p>
            <p className="text-[14px] text-gray-400 mb-4">お気軽にお問い合わせください。</p>
            <Link href="/contact" className="inline-block px-6 py-2.5 bg-[#4A99E9] text-white font-bold text-[14px] rounded-full hover:bg-[#3a89d9] transition-colors">
              お問い合わせ
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-5 py-8 border-t border-gray-100 text-center text-[12px] text-gray-400 space-y-3">
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="hover:underline">利用規約</Link>
          <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
          <a href="https://www.cfac.co.jp/" target="_blank" rel="noopener noreferrer" className="hover:underline">運営会社</a>
        </div>
        <p>&copy; 2026 musu.world</p>
      </footer>
    </div>
  );
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  label: string;
}

export const articles: Article[] = [
  {
    slug: "email-to-spreadsheet",
    title: "「メールのデータ、スプレッドシートに入れといて」が現実になった話",
    description:
      "Gmailに届く売上メールを読んで、Googleスプレッドシートに自動で記録。musuのAIチームに頼んだら、仕様を伝えるだけで動き出した。",
    date: "2026-03-22",
    label: "lab",
  },
  {
    slug: "gmail-inventory-management",
    title: "Gmailの売上メールから在庫管理を自動化した話",
    description:
      "売上通知メールが届くたびに手動で在庫を更新していた作業を、musuに任せたら完全自動化できた。スプレッドシートで在庫管理システムを作った実例。",
    date: "2026-03-22",
    label: "lab",
  },
  {
    slug: "inquiry-automation",
    title: "「問い合わせメール、もう見落とさない」を仕組みにした話",
    description:
      "Gmailの問い合わせを自動で分類・返信文案を作成。Slackに通知して、OKで返信。対応履歴はNotionに自動保存。",
    date: "2026-03-23",
    label: "lab",
  },
  {
    slug: "morning-briefing",
    title: "朝起きたら、今日やることが整理されている生活",
    description:
      "Googleカレンダーの予定、重要メール、業界ニュース。毎朝musuが自動でブリーフィングを届けてくれる。",
    date: "2026-03-23",
    label: "lab",
  },
  {
    slug: "sales-tracking",
    title: "「今月いくら売れた？」に即答できるようになった話",
    description:
      "Squareの決済データをGoogleスプレッドシートに記録。売上の集計から分析まで、musuに聞くだけ。",
    date: "2026-03-23",
    label: "lab",
  },
];

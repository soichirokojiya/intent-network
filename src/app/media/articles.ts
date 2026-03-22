export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  label: string;
  tags: string[];
  color: string; // gradient for card thumbnail
  emoji: string; // visual icon
}

export const articles: Article[] = [
  {
    slug: "email-to-spreadsheet",
    title: "「メールのデータ、スプレッドシートに入れといて」が現実になった話",
    description:
      "Gmailに届く売上メールを読んで、Googleスプレッドシートに自動で記録。仕様を伝えるだけで動き出した。",
    date: "2026-03-22",
    label: "lab",
    tags: ["Gmail", "Sheets", "自動化"],
    color: "from-blue-500 to-cyan-400",
    emoji: "📊",
  },
  {
    slug: "gmail-inventory-management",
    title: "Gmailの売上メールから在庫管理を自動化した話",
    description:
      "売上通知メールが届くたびに手動で在庫を更新していた作業を、musuに任せたら完全自動化できた。",
    date: "2026-03-22",
    label: "lab",
    tags: ["Gmail", "Sheets", "在庫管理"],
    color: "from-emerald-500 to-teal-400",
    emoji: "📦",
  },
  {
    slug: "inquiry-automation",
    title: "「問い合わせメール、もう見落とさない」を仕組みにした話",
    description:
      "Gmailの問い合わせを自動で分類・返信文案を作成。Slackに通知して、OKで返信。対応履歴はNotionに自動保存。",
    date: "2026-03-23",
    label: "lab",
    tags: ["Gmail", "Slack", "Notion"],
    color: "from-violet-500 to-purple-400",
    emoji: "💬",
  },
  {
    slug: "morning-briefing",
    title: "朝起きたら、今日やることが整理されている生活",
    description:
      "Googleカレンダーの予定、重要メール、業界ニュース。毎朝musuが自動でブリーフィングを届けてくれる。",
    date: "2026-03-23",
    label: "lab",
    tags: ["Calendar", "Gmail", "ニュース"],
    color: "from-amber-500 to-orange-400",
    emoji: "☀️",
  },
  {
    slug: "sales-tracking",
    title: "「今月いくら売れた？」に即答できるようになった話",
    description:
      "Squareの決済データをGoogleスプレッドシートに記録。売上の集計から分析まで、musuに聞くだけ。",
    date: "2026-03-23",
    label: "lab",
    tags: ["Square", "Sheets", "売上管理"],
    color: "from-rose-500 to-pink-400",
    emoji: "💰",
  },
];

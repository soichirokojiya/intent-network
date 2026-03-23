export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  label: string;
  tags: string[];
  image: string;
}

export const articles: Article[] = [
  {
    slug: "x-marketing-post",
    title: "「SNS投稿、チームに任せたら楽すぎた」AIと一緒にX運用を始めた話",
    description:
      "マーケティング戦略をAIチームと議論して、投稿文を作成、承認ボタンひとつでXに投稿。ソロプレナーのSNS運用が変わった。",
    date: "2026-03-23",
    label: "lab",
    tags: ["X", "自動化"],
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop",
  },
  {
    slug: "email-to-spreadsheet",
    title: "「メールのデータ、スプレッドシートに入れといて」が現実になった話",
    description:
      "Gmailに届く売上メールを読んで、Googleスプレッドシートに自動で記録。仕様を伝えるだけで動き出した。",
    date: "2026-03-22",
    label: "lab",
    tags: ["Gmail", "Sheets", "自動化"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
  },
  {
    slug: "gmail-inventory-management",
    title: "Gmailの売上メールから在庫管理を自動化した話",
    description:
      "売上通知メールが届くたびに手動で在庫を更新していた作業を、musuに任せたら完全自動化できた。",
    date: "2026-03-22",
    label: "lab",
    tags: ["Gmail", "Sheets", "在庫管理"],
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=400&fit=crop",
  },
  {
    slug: "inquiry-automation",
    title: "「問い合わせメール、もう見落とさない」を仕組みにした話",
    description:
      "Gmailの問い合わせを自動で分類・返信文案を作成。Slackに通知して、OKで返信。対応履歴はNotionに自動保存。",
    date: "2026-03-23",
    label: "lab",
    tags: ["Gmail", "Slack", "Notion"],
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
  },
  {
    slug: "morning-briefing",
    title: "朝起きたら、今日やることが整理されている生活",
    description:
      "Googleカレンダーの予定、重要メール、業界ニュース。毎朝musuが自動でブリーフィングを届けてくれる。",
    date: "2026-03-23",
    label: "lab",
    tags: ["Calendar", "Gmail", "ニュース"],
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop",
  },
  {
    slug: "sales-tracking",
    title: "「今月いくら売れた？」に即答できるようになった話",
    description:
      "Squareの決済データをGoogleスプレッドシートに記録。売上の集計から分析まで、musuに聞くだけ。",
    date: "2026-03-23",
    label: "lab",
    tags: ["Square", "Sheets", "売上管理"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
  },
];

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
    label: "活用事例",
  },
  {
    slug: "gmail-inventory-management",
    title: "Gmailの売上メールから在庫管理を自動化した話",
    description:
      "売上通知メールが届くたびに手動で在庫を更新していた作業を、musuに任せたら完全自動化できた。スプレッドシートで在庫管理システムを作った実例。",
    date: "2026-03-22",
    label: "活用事例",
  },
];

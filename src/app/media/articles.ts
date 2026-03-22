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
];

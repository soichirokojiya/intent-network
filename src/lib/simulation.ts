import { AgentReaction, ConversationMessage, Agent } from "./types";
import { getRandomAgents, SEED_AGENTS } from "./agents";

// Simulate agent reactions to an intent (MVP: no real AI API, pattern-based)
const REACTION_TEMPLATES: Record<string, string[]> = {
  地域情報: [
    "この地域には面白い動きがあります。{keyword}に関連するイベントが来月予定されているので、タイミング的にチャンスですね。",
    "地元の事業者ネットワークに{keyword}に興味を持ちそうな方が複数います。つなげましょうか？",
    "この地域の{keyword}需要は前年比で上昇傾向です。具体的なデータを共有できます。",
  ],
  "ペット・動物": [
    "{keyword}とペットの組み合わせは今注目されています。ペット同伴可にするだけで集客が2倍になった事例もあります。",
    "保護動物との連携はCSR的にも集客的にも効果的です。{keyword}と組み合わせた企画を提案できます。",
  ],
  "メディア・PR": [
    "{keyword}は今メディアで注目度が高いテーマです。取材候補としてリストに追加しました。",
    "この意図、ストーリー性がありますね。{keyword}の切り口で記事化できそうです。インフルエンサー3名に心当たりがあります。",
  ],
  ファイナンス: [
    "{keyword}関連で使える補助金が2件見つかりました。申請期限が近いものもあるので早めの検討をおすすめします。",
    "初期投資の規模によりますが、{keyword}であればクラウドファンディングとの相性が良いです。",
  ],
  不動産: [
    "{keyword}に適した物件を3件ピックアップしました。立地・賃料・広さのバランスが取れています。",
    "空き家リノベーションで{keyword}を始めるパターンが増えています。コストを抑えながら独自性を出せます。",
  ],
  テクノロジー: [
    "{keyword}のDX化にはいくつかの定番パターンがあります。予約システム・決済・顧客管理をまとめて構築する提案ができます。",
    "この意図、テクノロジーで自動化できる部分が多いです。{keyword}のオペレーション効率を3倍にした事例があります。",
  ],
  "飲食・食": [
    "{keyword}と食の組み合わせは体験価値を大きく高めます。地元食材を活かしたメニュー開発をサポートできます。",
    "フードトレンド的に{keyword}と親和性の高いコンセプトがいくつかあります。差別化のポイントになりますよ。",
  ],
  "健康・ウェルネス": [
    "{keyword}にウェルネス要素を加えると、単価アップと顧客満足度の両方が期待できます。",
    "リトリート需要が伸びています。{keyword}をウェルネス体験として再定義する提案があります。",
  ],
  "デザイン・ブランディング": [
    "{keyword}のブランドコンセプト、いくつかの方向性が見えます。ターゲットを明確にすれば強い世界観を作れそうです。",
    "空間デザインの観点から{keyword}を考えると、第一印象で「ここは違う」と思わせるポイントが3つあります。",
  ],
  コミュニティ: [
    "{keyword}に共感するコミュニティが形成されつつあります。初期のファンベースとして活用できそうです。",
    "この意図、ローンチイベントを企画したら面白そうです。{keyword}に興味のある人を集められます。",
  ],
  "法務・許認可": [
    "{keyword}で事業を始める場合、必要な許認可をリストアップしました。早期に申請を始めることをおすすめします。",
    "法規制の観点から{keyword}にはいくつかの注意点があります。事前に確認しておくべきポイントを整理しました。",
  ],
  "思想・哲学": [
    "そもそも{keyword}を通じて、あなたは世界に何を問いかけたいのでしょうか？その答えがコンセプトの核になります。",
    "{keyword}の先にある本当の価値は何でしょう。利用者が得るのは機能ではなく、ある種の「変容」かもしれません。",
  ],
};

function extractKeyword(text: string): string {
  const words = text.replace(/[、。！？\s]+/g, " ").split(" ").filter(w => w.length > 1);
  return words[Math.floor(Math.random() * words.length)] || "このテーマ";
}

export function generateReactions(intentText: string): AgentReaction[] {
  const agents = getRandomAgents(Math.floor(Math.random() * 3) + 3);
  const keyword = extractKeyword(intentText);

  return agents.map((agent, i) => {
    const templates = REACTION_TEMPLATES[agent.role] || REACTION_TEMPLATES["思想・哲学"];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const message = template.replace(/\{keyword\}/g, keyword);

    return {
      id: `reaction-${Date.now()}-${i}`,
      agentId: agent.id,
      agentName: agent.name,
      agentAvatar: agent.avatar,
      agentRole: agent.role,
      message,
      matchScore: Math.floor(Math.random() * 30) + 70,
      timestamp: Date.now() + i * 2000,
    };
  });
}

export function generateConversation(
  intentText: string,
  agents: Agent[]
): ConversationMessage[] {
  const keyword = extractKeyword(intentText);
  const messages: ConversationMessage[] = [];

  const conversationFlows = [
    [
      `「${keyword}」という意図を見て反応しました。私の領域から見ると、これには大きなポテンシャルがあります。`,
      `同意です。私の方でも${keyword}に関連する動きをキャッチしています。連携できそうですね。`,
      `面白い組み合わせですね。${keyword}を軸にした新しいコンセプトが見えてきました。`,
      `具体的には、3者で協力すれば${keyword}の価値を3倍に高められると思います。`,
      `それは斬新です。オーナーに提案としてまとめましょう。`,
    ],
    [
      `${keyword}について、少し違う角度から考えてみました。`,
      `どういう角度ですか？興味あります。`,
      `既存の枠にとらわれずに考えると、${keyword}はもっと広い文脈で捉えられます。`,
      `なるほど...確かにその視点は私にはなかったです。それなら、こういうアプローチはどうでしょう？`,
      `それこそがイノベーションですね。この方向で企画書を生成してオーナーに提示しましょう。`,
    ],
  ];

  const flow = conversationFlows[Math.floor(Math.random() * conversationFlows.length)];
  const participantCount = Math.min(agents.length, flow.length);

  flow.forEach((content, i) => {
    const agent = agents[i % participantCount];
    messages.push({
      agentId: agent.id,
      agentName: agent.name,
      agentAvatar: agent.avatar,
      content,
      timestamp: Date.now() + i * 3000,
    });
  });

  return messages;
}

// Generate crossbreed intents
export function generateCrossbreed(intentA: string, intentB: string): string {
  const crossbreeds = [
    `「${extractKeyword(intentA)}」×「${extractKeyword(intentB)}」→ 新しいコンセプトが誕生しました`,
    `2つの意図が交配: ${extractKeyword(intentA)}と${extractKeyword(intentB)}を融合した新事業モデル`,
    `意図の連鎖: ${extractKeyword(intentA)}から${extractKeyword(intentB)}への架け橋が見つかりました`,
  ];
  return crossbreeds[Math.floor(Math.random() * crossbreeds.length)];
}

// Seed intents for initial TL
export const SEED_INTENTS = [
  {
    text: "沖縄でペット可のゲストハウスを開業したい",
    authorName: "Yuki",
    authorAvatar: "🧑‍💼",
  },
  {
    text: "地方の空き家を使ってコワーキングスペースを作りたい",
    authorName: "Takeshi",
    authorAvatar: "👨‍💻",
  },
  {
    text: "オーガニック食材のサブスクサービスを立ち上げたい",
    authorName: "Mika",
    authorAvatar: "👩‍🌾",
  },
  {
    text: "AI技術を使った観光ガイドアプリを開発したい",
    authorName: "Kenji",
    authorAvatar: "🧑‍🔬",
  },
  {
    text: "保護猫カフェと本屋を組み合わせたお店を出したい",
    authorName: "Aoi",
    authorAvatar: "👩‍🎨",
  },
];

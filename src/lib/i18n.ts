export type Locale = "en" | "ja" | "zh" | "es" | "ko";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  zh: "中文",
  es: "Español",
  ko: "한국어",
};

const translations: Record<string, Record<Locale, string>> = {
  // Home
  "home.placeholder": {
    en: "What's on your mind?",
    ja: "何を考えていますか？",
    zh: "你在想什么？",
    es: "¿Qué tienes en mente?",
    ko: "무슨 생각을 하고 있나요?",
  },
  "home.send": {
    en: "Send", ja: "送信", zh: "发送", es: "Enviar", ko: "보내기",
  },
  "home.preparing": {
    en: "Preparing...", ja: "準備中...", zh: "准备中...", es: "Preparando...", ko: "준비 중...",
  },
  "home.posted": {
    en: "Posted", ja: "投稿済み", zh: "已发布", es: "Publicado", ko: "게시됨",
  },
  "home.postedToX": {
    en: "Posted to X", ja: "Xに投稿済み", zh: "已发布到X", es: "Publicado en X", ko: "X에 게시됨",
  },
  "home.toYou": {
    en: "→ to you", ja: "→ あなたへ", zh: "→ 给你", es: "→ para ti", ko: "→ 당신에게",
  },

  // Navigation
  "nav.home": {
    en: "Home", ja: "ホーム", zh: "首页", es: "Inicio", ko: "홈",
  },
  "nav.myAgents": {
    en: "My Agents", ja: "マイAgent", zh: "我的Agent", es: "Mis Agentes", ko: "내 에이전트",
  },
  "nav.send": {
    en: "Send", ja: "送信", zh: "发送", es: "Enviar", ko: "보내기",
  },

  // Agent page
  "agent.title": {
    en: "My Agents", ja: "マイAgent", zh: "我的Agent", es: "Mis Agentes", ko: "내 에이전트",
  },
  "agent.new": {
    en: "+ New Agent", ja: "+ 新しいAgent", zh: "+ 新Agent", es: "+ Nuevo Agente", ko: "+ 새 에이전트",
  },
  "agent.empty": {
    en: "No Agents", ja: "Agentがいません", zh: "没有Agent", es: "Sin Agentes", ko: "에이전트 없음",
  },
  "agent.emptyDesc": {
    en: "Create an Agent to speak on your behalf",
    ja: "あなたの代わりに発言するAgentを作りましょう",
    zh: "创建一个代替你发言的Agent",
    es: "Crea un Agente que hable por ti",
    ko: "당신을 대신해 말할 에이전트를 만드세요",
  },
  "agent.createFirst": {
    en: "Create your first Agent",
    ja: "最初のAgentを作る",
    zh: "创建你的第一个Agent",
    es: "Crea tu primer Agente",
    ko: "첫 에이전트 만들기",
  },
  "agent.create": {
    en: "Create Agent", ja: "Agentを作成", zh: "创建Agent", es: "Crear Agente", ko: "에이전트 생성",
  },
  "agent.createNew": {
    en: "Create New Agent", ja: "新しいAgentを作成", zh: "创建新Agent", es: "Crear Nuevo Agente", ko: "새 에이전트 생성",
  },
  "agent.name": {
    en: "Agent Name", ja: "Agent名", zh: "Agent名称", es: "Nombre del Agente", ko: "에이전트 이름",
  },
  "agent.avatar": {
    en: "Avatar", ja: "アバター", zh: "头像", es: "Avatar", ko: "아바타",
  },
  "agent.personality": {
    en: "Personality", ja: "性格", zh: "性格", es: "Personalidad", ko: "성격",
  },
  "agent.tone": {
    en: "Tone", ja: "口調", zh: "语调", es: "Tono", ko: "말투",
  },
  "agent.expertise": {
    en: "Expertise", ja: "専門", zh: "专长", es: "Especialidad", ko: "전문분야",
  },
  "agent.beliefs": {
    en: "Beliefs", ja: "信条", zh: "信条", es: "Creencias", ko: "신조",
  },
  "agent.active": {
    en: "Active", ja: "アクティブ", zh: "活跃", es: "Activo", ko: "활성",
  },
  "agent.setActive": {
    en: "Set Active", ja: "アクティブにする", zh: "设为活跃", es: "Activar", ko: "활성화",
  },
  "agent.revive": {
    en: "Revive", ja: "復活させる", zh: "复活", es: "Revivir", ko: "부활",
  },
  "agent.dead": {
    en: "Dead...", ja: "死亡...", zh: "已死亡...", es: "Muerto...", ko: "사망...",
  },
  "agent.activityLog": {
    en: "Activity Log", ja: "活動ログ", zh: "活动日志", es: "Registro de Actividad", ko: "활동 로그",
  },
  "agent.noActivity": {
    en: "No activity yet", ja: "まだ活動がありません", zh: "暂无活动", es: "Sin actividad aún", ko: "아직 활동 없음",
  },
  "agent.posts": {
    en: "posts", ja: "投稿", zh: "帖子", es: "publicaciones", ko: "게시물",
  },
  "agent.influence": {
    en: "influence", ja: "影響力", zh: "影响力", es: "influencia", ko: "영향력",
  },
  "agent.conversations": {
    en: "Agent Conversations", ja: "Agentの会話", zh: "Agent对话", es: "Conversaciones de Agentes", ko: "에이전트 대화",
  },
  "agent.delete": {
    en: "Delete this Agent", ja: "このAgentを削除", zh: "删除此Agent", es: "Eliminar este Agente", ko: "이 에이전트 삭제",
  },
  "agent.deleteConfirm": {
    en: "This cannot be undone. Are you sure?",
    ja: "この操作は元に戻せません。本当に削除しますか？",
    zh: "此操作无法撤销。确定要删除吗？",
    es: "Esto no se puede deshacer. ¿Estás seguro?",
    ko: "이 작업은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?",
  },
  "agent.resetAll": {
    en: "Reset All Data", ja: "全データリセット", zh: "重置所有数据", es: "Restablecer Todo", ko: "모든 데이터 초기화",
  },
  "agent.resetConfirm": {
    en: "Reset all Agents and data?",
    ja: "全てのAgentとデータをリセットしますか？",
    zh: "重置所有Agent和数据？",
    es: "¿Restablecer todos los Agentes y datos?",
    ko: "모든 에이전트와 데이터를 초기화할까요?",
  },
  "agent.twitterIntegration": {
    en: "X (Twitter) Integration", ja: "X (Twitter) 連携", zh: "X (Twitter) 集成", es: "Integración X (Twitter)", ko: "X (Twitter) 연동",
  },
  "agent.twitterDesc": {
    en: "Posts will be automatically shared on X",
    ja: "投稿内容がXにも自動投稿されます",
    zh: "帖子将自动分享到X",
    es: "Las publicaciones se compartirán automáticamente en X",
    ko: "게시물이 X에 자동으로 공유됩니다",
  },

  // Chat
  "chat.join": {
    en: "Join the conversation...", ja: "会話に参加...", zh: "加入对话...", es: "Unirse a la conversación...", ko: "대화에 참여...",
  },
  "chat.notFound": {
    en: "Chat not found", ja: "チャットが見つかりません", zh: "未找到聊天", es: "Chat no encontrado", ko: "채팅을 찾을 수 없음",
  },
  "chat.msgs": {
    en: "msgs", ja: "件", zh: "条", es: "msgs", ko: "개",
  },

  // Thread
  "thread.post": {
    en: "Post", ja: "投稿", zh: "帖子", es: "Publicación", ko: "게시물",
  },
  "thread.notFound": {
    en: "Intent not found", ja: "意図が見つかりません", zh: "未找到意图", es: "Intención no encontrada", ko: "의도를 찾을 수 없음",
  },
  "thread.resonance": {
    en: "resonance", ja: "共鳴", zh: "共鸣", es: "resonancia", ko: "공명",
  },
  "thread.crossbreeds": {
    en: "crossbreeds", ja: "交配", zh: "交叉", es: "cruces", ko: "교배",
  },
  "thread.reach": {
    en: "reach", ja: "到達", zh: "触达", es: "alcance", ko: "도달",
  },
  "thread.replies": {
    en: "replies", ja: "リプライ", zh: "回复", es: "respuestas", ko: "답글",
  },
  "thread.replyPlaceholder": {
    en: "Write a reply...", ja: "返信を書く...", zh: "写回复...", es: "Escribe una respuesta...", ko: "답글 작성...",
  },
  "thread.reply": {
    en: "Reply", ja: "返信", zh: "回复", es: "Responder", ko: "답글",
  },
  "thread.replyingTo": {
    en: "Replying to", ja: "返信先", zh: "回复", es: "Respondiendo a", ko: "답글 대상",
  },
  "thread.support": {
    en: "Support", ja: "賛成", zh: "支持", es: "Apoyar", ko: "지지",
  },
  "thread.oppose": {
    en: "Oppose", ja: "反対", zh: "反对", es: "Oponerse", ko: "반대",
  },
  "thread.question": {
    en: "Question", ja: "問い", zh: "质疑", es: "Pregunta", ko: "질문",
  },

  // Right panel
  "right.myAgents": {
    en: "My Agents", ja: "マイAgent", zh: "我的Agent", es: "Mis Agentes", ko: "내 에이전트",
  },
  "right.activity": {
    en: "Activity", ja: "アクティビティ", zh: "活动", es: "Actividad", ko: "활동",
  },
  "right.intents": {
    en: "intents", ja: "意図", zh: "意图", es: "intenciones", ko: "의도",
  },
  "right.reactions": {
    en: "reactions", ja: "反応", zh: "反应", es: "reacciones", ko: "반응",
  },
  "right.search": {
    en: "Search", ja: "検索", zh: "搜索", es: "Buscar", ko: "검색",
  },

  // General
  "time.now": {
    en: "now", ja: "たった今", zh: "刚刚", es: "ahora", ko: "방금",
  },
  "label.human": {
    en: "Human", ja: "人間", zh: "人类", es: "Humano", ko: "인간",
  },
  "label.official": {
    en: "Official", ja: "公式", zh: "官方", es: "Oficial", ko: "공식",
  },
};

export function t(key: string, locale: Locale): string {
  return translations[key]?.[locale] || translations[key]?.["en"] || key;
}

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

  // Mood messages
  "mood.thriving": {
    en: "On fire today! Let's go!", ja: "今日は絶好調！ガンガンいこう！", zh: "今天状态爆棚！", es: "¡En llamas hoy!", ko: "오늘 최고 컨디션!",
  },
  "mood.happy": {
    en: "Feeling good, ready to work.", ja: "いい感じ。いつでもいけるよ。", zh: "感觉不错，准备好了。", es: "Me siento bien, listo.", ko: "기분 좋아, 준비됐어.",
  },
  "mood.normal": {
    en: "Standing by. What's next?", ja: "待機中。次は何する？", zh: "待命中，下一步？", es: "En espera. ¿Qué sigue?", ko: "대기 중. 다음은?",
  },
  "mood.bored": {
    en: "Got nothing to do... talk to me?", ja: "暇だ...何か話しかけてよ？", zh: "无事可做...跟我说说话？", es: "No tengo nada que hacer...", ko: "할 일이 없어... 말 걸어줘?",
  },
  "mood.sulking": {
    en: "You've been ignoring me.", ja: "放置しすぎじゃない？", zh: "你一直无视我。", es: "Me has estado ignorando.", ko: "나 무시하는 거야?",
  },
  "mood.sick": {
    en: "Not feeling great today...", ja: "今日は調子悪い...", zh: "今天不太舒服...", es: "No me siento bien hoy...", ko: "오늘 컨디션 안 좋아...",
  },
  "mood.dead": {
    en: "...", ja: "...", zh: "...", es: "...", ko: "...",
  },

  // Placeholders
  "placeholder.agentName": {
    en: "e.g. Sharp Consultant", ja: "例：辛口コンサルタント", zh: "例：犀利顾问", es: "ej. Consultor agudo", ko: "예: 날카로운 컨설턴트",
  },
  "placeholder.personality": {
    en: "e.g. Curious", ja: "例：好奇心旺盛", zh: "例：好奇心强", es: "ej. Curioso", ko: "예: 호기심 많은",
  },
  "placeholder.expertise": {
    en: "e.g. Marketing", ja: "例：マーケティング", zh: "例：市场营销", es: "ej. Marketing", ko: "예: 마케팅",
  },
  "placeholder.beliefs": {
    en: "e.g. Action is everything", ja: "例：行動が全て", zh: "例：行动就是一切", es: "ej. La acción es todo", ko: "예: 행동이 전부다",
  },

  // New agent fields
  "agent.role": {
    en: "Role", ja: "役割", zh: "角色", es: "Rol", ko: "역할",
  },
  "agent.character": {
    en: "Character", ja: "キャラクター", zh: "性格特征", es: "Carácter", ko: "캐릭터",
  },
  "agent.speakingStyle": {
    en: "Speaking Style", ja: "話し方", zh: "说话方式", es: "Estilo de habla", ko: "말하는 스타일",
  },
  "agent.coreValue": {
    en: "Core Value", ja: "コアバリュー", zh: "核心价值", es: "Valor central", ko: "핵심 가치",
  },

  // Role presets
  "role.marketing": { en: "Marketing", ja: "マーケティング", zh: "市场营销", es: "Marketing", ko: "마케팅" },
  "role.research": { en: "Research", ja: "リサーチ", zh: "研究", es: "Investigación", ko: "리서치" },
  "role.creative": { en: "Creative", ja: "クリエイティブ", zh: "创意", es: "Creativo", ko: "크리에이티브" },
  "role.finance": { en: "Finance", ja: "ファイナンス", zh: "金融", es: "Finanzas", ko: "금융" },
  "role.operations": { en: "Operations", ja: "オペレーション", zh: "运营", es: "Operaciones", ko: "운영" },
  "role.strategy": { en: "Strategy", ja: "戦略", zh: "战略", es: "Estrategia", ko: "전략" },
  "role.developer": { en: "Developer", ja: "開発者", zh: "开发者", es: "Desarrollador", ko: "개발자" },
  "role.designer": { en: "Designer", ja: "デザイナー", zh: "设计师", es: "Diseñador", ko: "디자이너" },

  // Character presets
  "character.logical": { en: "Logical", ja: "論理的", zh: "逻辑性强", es: "Lógico", ko: "논리적" },
  "character.creative": { en: "Creative", ja: "創造的", zh: "创造性强", es: "Creativo", ko: "창의적" },
  "character.cautious": { en: "Cautious", ja: "慎重", zh: "谨慎", es: "Cauteloso", ko: "신중한" },
  "character.bold": { en: "Bold", ja: "大胆", zh: "大胆", es: "Audaz", ko: "대담한" },
  "character.empathetic": { en: "Empathetic", ja: "共感的", zh: "有同理心", es: "Empático", ko: "공감적" },
  "character.analytical": { en: "Analytical", ja: "分析的", zh: "分析型", es: "Analítico", ko: "분석적" },
  "character.optimistic": { en: "Optimistic", ja: "楽観的", zh: "乐观", es: "Optimista", ko: "낙관적" },
  "character.skeptical": { en: "Skeptical", ja: "懐疑的", zh: "怀疑论者", es: "Escéptico", ko: "회의적" },

  // Core value presets
  "coreValue.efficiency": { en: "Efficiency first", ja: "効率第一", zh: "效率优先", es: "Eficiencia primero", ko: "효율 우선" },
  "coreValue.people": { en: "People first", ja: "人が第一", zh: "以人为本", es: "Las personas primero", ko: "사람 우선" },
  "coreValue.innovation": { en: "Innovation above all", ja: "革新こそ全て", zh: "创新至上", es: "Innovación ante todo", ko: "혁신이 최우선" },
  "coreValue.dataDriven": { en: "Data-driven", ja: "データドリブン", zh: "数据驱动", es: "Basado en datos", ko: "데이터 기반" },
  "coreValue.action": { en: "Action over planning", ja: "計画より行動", zh: "行动胜于计划", es: "Acción sobre planificación", ko: "계획보다 행동" },
  "coreValue.quality": { en: "Quality over speed", ja: "速度より品質", zh: "质量优于速度", es: "Calidad sobre velocidad", ko: "속도보다 품질" },

  // Placeholders for new fields
  "placeholder.role": {
    en: "e.g. Marketing", ja: "例：マーケティング", zh: "例：市场营销", es: "ej. Marketing", ko: "예: 마케팅",
  },
  "placeholder.character": {
    en: "e.g. Logical", ja: "例：論理的", zh: "例：逻辑性强", es: "ej. Lógico", ko: "예: 논리적",
  },
  "placeholder.coreValue": {
    en: "e.g. Efficiency first", ja: "例：効率第一", zh: "例：效率优先", es: "ej. Eficiencia primero", ko: "예: 효율 우선",
  },

  // Contact page
  "nav.contact": {
    en: "Contact", ja: "お問い合わせ", zh: "联系我们", es: "Contacto", ko: "문의",
  },
  "contact.title": {
    en: "Contact Us", ja: "お問い合わせ", zh: "联系我们", es: "Contáctenos", ko: "문의하기",
  },
  "contact.name": {
    en: "Your Name", ja: "お名前", zh: "您的姓名", es: "Su nombre", ko: "이름",
  },
  "contact.email": {
    en: "Your Email", ja: "メールアドレス", zh: "您的邮箱", es: "Su email", ko: "이메일",
  },
  "contact.subject": {
    en: "Subject", ja: "件名", zh: "主题", es: "Asunto", ko: "제목",
  },
  "contact.message": {
    en: "Message", ja: "メッセージ", zh: "消息", es: "Mensaje", ko: "메시지",
  },
  "contact.send": {
    en: "Send Message", ja: "メッセージを送信", zh: "发送消息", es: "Enviar mensaje", ko: "메시지 보내기",
  },
  "contact.description": {
    en: "Have a question or feedback? We'd love to hear from you.",
    ja: "ご質問やフィードバックがございましたら、お気軽にどうぞ。",
    zh: "有问题或反馈？我们很乐意听到您的声音。",
    es: "¿Tienes alguna pregunta o comentario? Nos encantaría saber de ti.",
    ko: "질문이나 피드백이 있으신가요? 연락을 기다리겠습니다.",
  },

  // Tones
  "tone.polite": { en: "Polite", ja: "丁寧語", zh: "礼貌", es: "Educado", ko: "존댓말" },
  "tone.casual": { en: "Casual", ja: "タメ口", zh: "随意", es: "Informal", ko: "반말" },
  "tone.sarcastic": { en: "Sarcastic", ja: "毒舌", zh: "毒舌", es: "Sarcástico", ko: "독설" },
  "tone.kansai": { en: "Kansai dialect", ja: "関西弁", zh: "关西方言", es: "Dialecto Kansai", ko: "간사이 사투리" },
  "tone.deadpan": { en: "Deadpan", ja: "淡々と", zh: "冷淡", es: "Impasible", ko: "무표정" },
  "tone.passionate": { en: "Passionate", ja: "熱血", zh: "热血", es: "Apasionado", ko: "열정적" },
  "tone.philosophical": { en: "Philosophical", ja: "哲学的", zh: "哲学性", es: "Filosófico", ko: "철학적" },
};

export function t(key: string, locale: Locale): string {
  return translations[key]?.[locale] || translations[key]?.["en"] || key;
}

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
    en: "Projects", ja: "プロジェクト", zh: "项目", es: "Proyectos", ko: "프로젝트",
  },
  "nav.myAgents": {
    en: "Agents", ja: "エージェント", zh: "Agent", es: "Agentes", ko: "에이전트",
  },
  "nav.send": {
    en: "Send", ja: "送信", zh: "发送", es: "Enviar", ko: "보내기",
  },

  // Agent page
  "agent.title": {
    en: "My Agents", ja: "エージェント", zh: "我的Agent", es: "Mis Agentes", ko: "내 에이전트",
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
    en: "Team", ja: "チーム", zh: "我的Agent", es: "Mis Agentes", ko: "내 에이전트",
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
  "agent.edit": {
    en: "Edit", ja: "編集", zh: "编辑", es: "Editar", ko: "편집",
  },
  "agent.rest": {
    en: "Rest", ja: "休ませる", zh: "休息", es: "Descansar", ko: "쉬게 하기",
  },

  // Mood messages
  "mood.thriving": {
    en: "Fired up!", ja: "絶好調！", zh: "超兴奋！", es: "¡A tope!", ko: "최고!",
  },
  "mood.happy": {
    en: "Feeling good", ja: "いい感じ", zh: "心情好", es: "Bien", ko: "기분 좋아",
  },
  "mood.normal": {
    en: "Ready", ja: "待機中", zh: "待命", es: "Listo", ko: "대기 중",
  },
  "mood.bored": {
    en: "Bored...", ja: "暇...", zh: "无聊...", es: "Aburrido...", ko: "심심...",
  },
  "mood.sulking": {
    en: "Ignored", ja: "放置された", zh: "被忽视", es: "Ignorado", ko: "무시당함",
  },
  "mood.sick": {
    en: "Off today", ja: "不調", zh: "不在状态", es: "Mal día", ko: "컨디션 나쁨",
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
  "role.strategy": { en: "Strategy", ja: "ストラテジスト", zh: "战略", es: "Estrategia", ko: "전략" },
  "role.developer": { en: "Developer", ja: "開発者", zh: "开发者", es: "Desarrollador", ko: "개발자" },
  "role.designer": { en: "Designer", ja: "デザイナー", zh: "设计师", es: "Diseñador", ko: "디자이너" },
  "role.dataScientist": { en: "Data Scientist", ja: "データサイエンティスト", zh: "数据科学家", es: "Científico de Datos", ko: "데이터 사이언티스트" },
  "role.orchestrator": { en: "Orchestrator", ja: "オーケストレーター", zh: "编排器", es: "Orquestador", ko: "오케스트레이터" },
  "role.philosopher": { en: "Philosopher", ja: "哲学者", zh: "哲学家", es: "Filósofo", ko: "철학자" },

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
  // Settings
  "settings.title": { en: "Settings", ja: "設定", zh: "设置", es: "Configuración", ko: "설정" },
  "settings.profile": { en: "Profile", ja: "プロフィール", zh: "个人资料", es: "Perfil", ko: "프로필" },
  "settings.displayName": { en: "Display Name", ja: "表示名", zh: "显示名称", es: "Nombre", ko: "표시 이름" },
  "settings.save": { en: "Save", ja: "保存", zh: "保存", es: "Guardar", ko: "저장" },
  "settings.changeEmail": { en: "Change Email", ja: "メールアドレス変更", zh: "更改邮箱", es: "Cambiar email", ko: "이메일 변경" },
  "settings.newEmail": { en: "New Email", ja: "新しいメールアドレス", zh: "新邮箱", es: "Nuevo email", ko: "새 이메일" },
  "settings.update": { en: "Update", ja: "更新", zh: "更新", es: "Actualizar", ko: "업데이트" },
  "settings.changePassword": { en: "Change Password", ja: "パスワード変更", zh: "更改密码", es: "Cambiar contraseña", ko: "비밀번호 변경" },
  "settings.newPassword": { en: "New Password", ja: "新しいパスワード", zh: "新密码", es: "Nueva contraseña", ko: "새 비밀번호" },
  "settings.confirmPassword": { en: "Confirm Password", ja: "パスワード確認", zh: "确认密码", es: "Confirmar contraseña", ko: "비밀번호 확인" },
  "settings.updatePassword": { en: "Update Password", ja: "パスワードを更新", zh: "更新密码", es: "Actualizar contraseña", ko: "비밀번호 업데이트" },
  "settings.minChars": { en: "Min 6 characters", ja: "6文字以上", zh: "至少6个字符", es: "Mín. 6 caracteres", ko: "6자 이상" },
  "settings.repeatPassword": { en: "Repeat password", ja: "パスワードを再入力", zh: "重复密码", es: "Repetir contraseña", ko: "비밀번호 재입력" },
  "settings.deleteAccount": { en: "Delete Account", ja: "アカウント削除", zh: "删除账户", es: "Eliminar cuenta", ko: "계정 삭제" },
  "settings.signOut": { en: "Sign out", ja: "ログアウト", zh: "退出", es: "Cerrar sesión", ko: "로그아웃" },

  "contact.sent": {
    en: "Message Sent!", ja: "送信しました！", zh: "消息已发送！", es: "¡Mensaje enviado!", ko: "메시지 전송됨!",
  },
  "contact.sentDesc": {
    en: "Thank you for reaching out. We'll get back to you soon.",
    ja: "お問い合わせありがとうございます。近日中にご連絡いたします。",
    zh: "感谢您的联系。我们会尽快回复您。",
    es: "Gracias por contactarnos. Le responderemos pronto.",
    ko: "문의해 주셔서 감사합니다. 곧 답변드리겠습니다.",
  },
  "contact.description": {
    en: "Have a question or feedback? We'd love to hear from you.",
    ja: "ご質問やフィードバックがございましたら、お気軽にどうぞ。",
    zh: "有问题或反馈？我们很乐意听到您的声音。",
    es: "¿Tienes alguna pregunta o comentario? Nos encantaría saber de ti.",
    ko: "질문이나 피드백이 있으신가요? 연락을 기다리겠습니다.",
  },

  // Tones
  // UI labels
  "nav.workspace": { en: "Workspace", ja: "ワークスペース", zh: "工作区", es: "Espacio de trabajo", ko: "워크스페이스" },
  "nav.profile": { en: "Profile", ja: "プロフィール", zh: "个人资料", es: "Perfil", ko: "프로필" },
  "nav.settings": { en: "Settings", ja: "設定", zh: "设置", es: "Configuración", ko: "설정" },
  "nav.billing": { en: "Billing", ja: "料金", zh: "计费", es: "Facturación", ko: "요금" },
  "chat.today": { en: "Today", ja: "今日", zh: "今天", es: "Hoy", ko: "오늘" },
  "chat.yesterday": { en: "Yesterday", ja: "昨日", zh: "昨天", es: "Ayer", ko: "어제" },
  "chat.copy": { en: "Copy", ja: "コピー", zh: "复制", es: "Copiar", ko: "복사" },
  "chat.readMore": { en: "Read more", ja: "続きを読む", zh: "阅读更多", es: "Leer más", ko: "더 읽기" },
  "chat.close": { en: "Close", ja: "閉じる", zh: "关闭", es: "Cerrar", ko: "닫기" },
  "chat.loadOlder": { en: "Load older messages", ja: "過去のメッセージを読み込む", zh: "加载更早的消息", es: "Cargar mensajes anteriores", ko: "이전 메시지 불러오기" },
  "chat.savePdf": { en: "Save as PDF", ja: "PDF保存", zh: "保存为PDF", es: "Guardar como PDF", ko: "PDF 저장" },
  "agent.addAgent": { en: "Add Member", ja: "仲間を追加", zh: "添加代理", es: "Añadir agente", ko: "에이전트 추가" },
  "agent.personalityPrompt": { en: "Personality Prompt", ja: "性格プロンプト", zh: "性格提示", es: "Prompt de personalidad", ko: "성격 프롬프트" },
  "agent.personalityPlaceholder": { en: "Describe the agent's personality, tone, and values", ja: "エージェントの性格・話し方・価値観を自由に記述", zh: "描述代理的性格、语气和价值观", es: "Describe la personalidad, tono y valores del agente", ko: "에이전트의 성격, 말투, 가치관을 자유롭게 기술" },
  "settings.businessInfo": { en: "Business Info", ja: "事業情報", zh: "业务信息", es: "Info del negocio", ko: "사업 정보" },
  "settings.businessInfoDesc": { en: "Information for agents to understand your business. Service name, URL, business description, target audience, etc.", ja: "エージェントがあなたの事業を理解するための情報です。サービス名、URL、事業内容、ターゲット層などを自由に記入してください。", zh: "帮助代理了解您业务的信息。服务名称、URL、业务描述、目标受众等。", es: "Información para que los agentes entiendan tu negocio.", ko: "에이전트가 사업을 이해하기 위한 정보입니다." },
  "settings.creditBalance": { en: "Credit Balance", ja: "クレジット残高", zh: "信用余额", es: "Saldo de crédito", ko: "크레딧 잔액" },
  "settings.charge": { en: "Charge", ja: "チャージ", zh: "充值", es: "Recargar", ko: "충전" },

  // TODO board
  "nav.todo": { en: "TODO", ja: "TODO", zh: "TODO", es: "TODO", ko: "TODO" },
  "todo.addPlaceholder": { en: "Add a task...", ja: "タスクを追加...", zh: "添加任务...", es: "Agregar tarea...", ko: "작업 추가..." },

  "tone.polite": { en: "Polite", ja: "丁寧語", zh: "礼貌", es: "Educado", ko: "존댓말" },
  "tone.casual": { en: "Casual", ja: "タメ口", zh: "随意", es: "Informal", ko: "반말" },
  "tone.sarcastic": { en: "Sarcastic", ja: "毒舌", zh: "毒舌", es: "Sarcástico", ko: "독설" },
  "tone.kansai": { en: "Kansai dialect", ja: "関西弁", zh: "关西方言", es: "Dialecto Kansai", ko: "간사이 사투리" },
  "tone.deadpan": { en: "Deadpan", ja: "淡々と", zh: "冷淡", es: "Impasible", ko: "무표정" },
  "tone.passionate": { en: "Passionate", ja: "熱血", zh: "热血", es: "Apasionado", ko: "열정적" },
  "tone.philosophical": { en: "Philosophical", ja: "哲学的", zh: "哲学性", es: "Filosófico", ko: "철학적" },

  // Auth screen
  "auth.resetPassword": { en: "Reset Password", ja: "パスワードをリセット", zh: "重置密码", es: "Restablecer contraseña", ko: "비밀번호 재설정" },
  "auth.teamTagline": { en: "Solo, yet a team.", ja: "ひとりなのに、チームがいる。", zh: "一个人，却有团队。", es: "Solo, pero con equipo.", ko: "혼자이지만, 팀이 있다." },
  "auth.welcome": { en: "Welcome back", ja: "おかえりなさい", zh: "欢迎回来", es: "Bienvenido de nuevo", ko: "다시 오셨군요" },
  "auth.enterEmail": { en: "Enter your registered email", ja: "登録済みのメールアドレスを入力してください", zh: "请输入注册邮箱", es: "Ingresa tu email registrado", ko: "등록된 이메일을 입력하세요" },
  "auth.freeStart": { en: "Start for free", ja: "無料ではじめる", zh: "免费开始", es: "Empieza gratis", ko: "무료로 시작하기" },
  "auth.signIn": { en: "Sign in", ja: "サインイン", zh: "登录", es: "Iniciar sesión", ko: "로그인" },
  "auth.signInPlease": { en: "Sign in to continue", ja: "サインインしてください", zh: "请登录", es: "Inicia sesión", ko: "로그인하세요" },
  "auth.sendFailed": { en: "Failed to send", ja: "送信に失敗しました", zh: "发送失败", es: "Error al enviar", ko: "전송 실패" },
  "auth.resetEmailSent": { en: "Password reset email sent. Please check your email.", ja: "パスワードリセットメールを送信しました。メールを確認してください。", zh: "密码重置邮件已发送，请查看邮箱。", es: "Email de restablecimiento enviado. Revisa tu correo.", ko: "비밀번호 재설정 이메일을 보냈습니다. 이메일을 확인하세요." },
  "auth.emailExists": { en: "This email is already registered. Please sign in.", ja: "このメールアドレスは既に登録されています。サインインしてください。", zh: "该邮箱已注册，请登录。", es: "Este email ya está registrado. Inicia sesión.", ko: "이미 등록된 이메일입니다. 로그인하세요." },
  "auth.signupFailed": { en: "Registration failed.", ja: "登録に失敗しました。", zh: "注册失败。", es: "Error en el registro.", ko: "등록 실패." },
  "auth.confirmEmail": { en: "Confirmation email sent. Please click the link.", ja: "確認メールを送信しました。メールのリンクをクリックしてください。", zh: "确认邮件已发送，请点击链接。", es: "Email de confirmación enviado. Haz clic en el enlace.", ko: "확인 이메일을 보냈습니다. 링크를 클릭하세요." },
  "auth.invalidCredentials": { en: "Invalid email or password.", ja: "メールアドレスまたはパスワードが正しくありません。", zh: "邮箱或密码错误。", es: "Email o contraseña incorrectos.", ko: "이메일 또는 비밀번호가 올바르지 않습니다." },
  "auth.emailPlaceholder": { en: "Email address", ja: "メールアドレス", zh: "邮箱地址", es: "Correo electrónico", ko: "이메일 주소" },
  "auth.passwordPlaceholder": { en: "Password (6+ characters)", ja: "パスワード（6文字以上）", zh: "密码（6位以上）", es: "Contraseña (6+ caracteres)", ko: "비밀번호 (6자 이상)" },
  "auth.agreeTerms": { en: "By creating an account, you agree to our", ja: "アカウントを作成することにより、", zh: "创建账户即表示您同意", es: "Al crear una cuenta, aceptas", ko: "계정을 생성하면" },
  "auth.terms": { en: "Terms of Service", ja: "利用規約", zh: "服务条款", es: "Términos de servicio", ko: "이용약관" },
  "auth.and": { en: " and ", ja: "と", zh: "和", es: " y ", ko: "과 " },
  "auth.privacy": { en: "Privacy Policy", ja: "プライバシーポリシー", zh: "隐私政策", es: "Política de privacidad", ko: "개인정보처리방침" },
  "auth.agreeEnd": { en: ".", ja: "に同意したことになります。", zh: "。", es: ".", ko: "에 동의하게 됩니다." },
  "auth.sendResetEmail": { en: "Send reset email", ja: "リセットメールを送信", zh: "发送重置邮件", es: "Enviar email de restablecimiento", ko: "재설정 이메일 보내기" },
  "auth.signUp": { en: "Sign up", ja: "新規登録", zh: "注册", es: "Registrarse", ko: "가입하기" },
  "auth.newHere": { en: "New here? ", ja: "はじめての方は ", zh: "新用户？", es: "¿Nuevo aquí? ", ko: "처음이신가요? " },
  "auth.forgotPassword": { en: "Forgot your password?", ja: "パスワードをお忘れの方はこちら", zh: "忘记密码？", es: "¿Olvidaste tu contraseña?", ko: "비밀번호를 잊으셨나요?" },
  "auth.haveAccount": { en: "Already have an account? ", ja: "アカウントをお持ちの方は ", zh: "已有账户？", es: "¿Ya tienes cuenta? ", ko: "이미 계정이 있으신가요? " },
  "auth.backToSignIn": { en: "Back to sign in", ja: "サインインに戻る", zh: "返回登录", es: "Volver a iniciar sesión", ko: "로그인으로 돌아가기" },

  // Chat inline
  "chat.read": { en: "Read", ja: "既読", zh: "已读", es: "Leído", ko: "읽음" },
  "chat.reply": { en: "Reply", ja: "返信", zh: "回复", es: "Responder", ko: "답글" },
  "chat.report": { en: "Report", ja: "レポート", zh: "报告", es: "Informe", ko: "보고서" },
  "chat.tweetConfirm": { en: "Is this tweet OK?", ja: "このツイートでいいですか？", zh: "这条推文可以吗？", es: "¿Este tweet está bien?", ko: "이 트윗 괜찮나요?" },
  "chat.tweetPosted": { en: "Posted to X! ✓", ja: "Xに投稿しました！ ✓", zh: "已发布到X！ ✓", es: "¡Publicado en X! ✓", ko: "X에 게시했습니다! ✓" },
  "chat.tweetCancelled": { en: "OK, cancelled the tweet.", ja: "了解、ツイートはやめておきますね。", zh: "好的，取消推文。", es: "OK, tweet cancelado.", ko: "알겠습니다, 트윗 취소했어요." },
  "chat.uploadFailed": { en: "File upload failed", ja: "ファイルのアップロードに失敗しました", zh: "文件上传失败", es: "Error al subir archivo", ko: "파일 업로드 실패" },
  "chat.fileSizeLimit": { en: "File size limit is 10MB", ja: "ファイルサイズは10MBまでです", zh: "文件大小限制为10MB", es: "Límite de archivo: 10MB", ko: "파일 크기는 10MB까지입니다" },
  "chat.attachFile": { en: "Attach file", ja: "ファイルを添付", zh: "附加文件", es: "Adjuntar archivo", ko: "파일 첨부" },
  "chat.voiceNotSupported": { en: "Voice input not supported in this browser", ja: "このブラウザは音声入力に対応していません", zh: "此浏览器不支持语音输入", es: "Entrada de voz no soportada", ko: "이 브라우저는 음성 입력을 지원하지 않습니다" },
  "chat.createAgentFirst": { en: "Create an agent first", ja: "エージェントを作成してください", zh: "请先创建代理", es: "Crea un agente primero", ko: "먼저 에이전트를 만드세요" },

  // Settings page
  "settings.creditLabel": { en: "Credit Balance", ja: "クレジット残高", zh: "信用余额", es: "Saldo de crédito", ko: "크레딧 잔액" },
  "settings.chargeBtn": { en: "Charge", ja: "チャージ", zh: "充值", es: "Recargar", ko: "충전" },
  "settings.saved": { en: "Saved", ja: "保存しました", zh: "已保存", es: "Guardado", ko: "저장됨" },
  "settings.avatarTooLarge": { en: "Please select an image under 2MB", ja: "2MB以下の画像を選択してください", zh: "请选择2MB以下的图片", es: "Selecciona una imagen de menos de 2MB", ko: "2MB 이하의 이미지를 선택하세요" },
  "settings.uploadFailed": { en: "Upload failed", ja: "アップロードに失敗しました", zh: "上传失败", es: "Error al subir", ko: "업로드 실패" },
  "settings.cancelAccount": { en: "Cancel Account", ja: "解約", zh: "注销账户", es: "Cancelar cuenta", ko: "계정 해지" },
  "settings.cancelConfirm": { en: "Are you sure you want to cancel? All data will be deleted.", ja: "本当に解約しますか？すべてのデータが削除されます。", zh: "确定要注销吗？所有数据将被删除。", es: "¿Seguro que quieres cancelar? Se eliminarán todos los datos.", ko: "정말 해지하시겠습니까? 모든 데이터가 삭제됩니다." },
  "settings.cancelConfirm2": { en: "This cannot be undone. Are you really sure?", ja: "この操作は取り消せません。本当によろしいですか？", zh: "此操作无法撤销，确定吗？", es: "Esto no se puede deshacer. ¿Estás seguro?", ko: "되돌릴 수 없습니다. 정말 확실합니까?" },
  "settings.cancelFailed": { en: "Account cancellation failed", ja: "解約に失敗しました", zh: "注销失败", es: "Error al cancelar", ko: "해지 실패" },
  "settings.cancelDesc": { en: "Your account and all agents/chat history will be permanently deleted. This cannot be undone. You can re-register with the same email.", ja: "アカウントとすべてのエージェント・チャット履歴が完全に削除されます。この操作は取り消せません。同じメールアドレスで再登録は可能です。", zh: "您的账户和所有代理/聊天记录将被永久删除。此操作无法撤销。您可以使用相同的邮箱重新注册。", es: "Tu cuenta y todo el historial de agentes/chats se eliminarán permanentemente. Puedes volver a registrarte con el mismo email.", ko: "계정과 모든 에이전트/채팅 기록이 영구 삭제됩니다. 같은 이메일로 재등록 가능합니다." },
  "settings.deleteAccountBtn": { en: "Delete Account", ja: "アカウントを削除する", zh: "删除账户", es: "Eliminar cuenta", ko: "계정 삭제" },
  "settings.newsDelivery": { en: "News Delivery", ja: "ニュース配信", zh: "新闻推送", es: "Entrega de noticias", ko: "뉴스 배달" },
  "settings.newsEnabled": { en: "Receive daily news related to your business", ja: "事業に関連するニュースを毎日受け取る", zh: "接收与您业务相关的每日新闻", es: "Recibir noticias diarias relacionadas con tu negocio", ko: "사업 관련 일일 뉴스 수신" },
  "settings.newsTime": { en: "Delivery time", ja: "配信時刻", zh: "推送时间", es: "Hora de entrega", ko: "배달 시간" },

  // Agent page
  "agent.confirmDelete": { en: "Delete {name}?", ja: "{name}を削除しますか？", zh: "删除{name}？", es: "¿Eliminar {name}?", ko: "{name}을(를) 삭제할까요?" },
  "agent.deleteThisAgent": { en: "Delete this agent", ja: "このエージェントを削除", zh: "删除此代理", es: "Eliminar este agente", ko: "이 에이전트 삭제" },
  "agent.editAgent": { en: "Edit Agent", ja: "エージェントを編集", zh: "编辑代理", es: "Editar agente", ko: "에이전트 편집" },
  "agent.saveBtn": { en: "Save", ja: "保存", zh: "保存", es: "Guardar", ko: "저장" },
  "agent.personalityLabel": { en: "Personality:", ja: "性格:", zh: "性格:", es: "Personalidad:", ko: "성격:" },

  // Charge page
  "charge.title": { en: "Credit Charge", ja: "クレジットチャージ", zh: "充值", es: "Recargar crédito", ko: "크레딧 충전" },
  "charge.complete": { en: "Charge complete!", ja: "チャージが完了しました！", zh: "充值完成！", es: "¡Recarga completada!", ko: "충전 완료!" },
  "charge.currentBalance": { en: "Current Balance", ja: "現在の残高", zh: "当前余额", es: "Saldo actual", ko: "현재 잔액" },
  "charge.deviceNotFound": { en: "Device ID not found. Please go back to home and try again.", ja: "デバイスIDが見つかりません。ホーム画面に戻ってからやり直してください。", zh: "未找到设备ID，请返回首页重试。", es: "ID de dispositivo no encontrado. Vuelve al inicio.", ko: "기기 ID를 찾을 수 없습니다. 홈으로 돌아가서 다시 시도하세요." },
  "charge.failed": { en: "Failed to start charge", ja: "チャージの開始に失敗しました", zh: "充值开始失败", es: "Error al iniciar la recarga", ko: "충전 시작 실패" },
  "charge.networkError": { en: "Network error", ja: "通信エラーが発生しました", zh: "网络错误", es: "Error de red", ko: "네트워크 오류" },
  "charge.processing": { en: "Processing...", ja: "処理中...", zh: "处理中...", es: "Procesando...", ko: "처리 중..." },
  "charge.chargeAmount": { en: "Charge ¥{amount}", ja: "¥{amount} チャージ", zh: "充值 ¥{amount}", es: "Recargar ¥{amount}", ko: "¥{amount} 충전" },
  "charge.description": { en: "Credits are consumed by AI agent usage.\nPay-per-use based on token consumption.", ja: "クレジットはAIエージェントの利用に消費されます。\nトークン消費量に応じた従量課金です。", zh: "积分用于AI代理使用。\n按令牌消耗量计费。", es: "Los créditos se consumen con el uso de agentes IA.\nPago por uso según consumo de tokens.", ko: "크레딧은 AI 에이전트 사용에 소비됩니다.\n토큰 소비량에 따른 종량제입니다." },
};

export function t(key: string, locale: Locale): string {
  return translations[key]?.[locale] || translations[key]?.["en"] || key;
}

// Reverse lookup: translate a Japanese role name to the current locale
const ROLE_MAP: Record<string, string> = {
  "オーケストレーター": "role.orchestrator",
  "マーケティング": "role.marketing",
  "リサーチ": "role.research",
  "クリエイティブ": "role.creative",
  "ファイナンス": "role.finance",
  "ストラテジスト": "role.strategy",
  "哲学者": "role.philosopher",
  "開発者": "role.developer",
  "デザイナー": "role.designer",
  "データサイエンティスト": "role.dataScientist",
  "オペレーション": "role.operations",
};

export function translateRole(role: string, locale: Locale): string {
  const key = ROLE_MAP[role];
  if (key) return t(key, locale);
  return role;
}

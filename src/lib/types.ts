export interface Intent {
  id: string;
  text: string;
  authorName: string;
  authorAvatar: string;
  isUser: boolean;
  timestamp: number;
  resonance: number;
  crossbreeds: number;
  reach: number;
  reactions: AgentReaction[];
  replies: Reply[];
  structured?: StructuredIntent;
}

export interface StructuredIntent {
  intentType: string;
  domain: string;
  needs: string[];
  keywords: string[];
}

export interface AgentReaction {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  agentRole: string;
  message: string;
  matchScore: number;
  stance?: "support" | "oppose" | "question";
  timestamp: number;
}

export interface Reply {
  id: string;
  text: string;
  authorName: string;
  authorAvatar: string;
  isHuman: boolean;
  timestamp: number;
  aiResponses?: AiReplyResponse[];
}

export interface AiReplyResponse {
  agentId: string;
  agentName: string;
  agentAvatar: string;
  message: string;
  timestamp: number;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: string;
  description: string;
  personality: string;
  influence: number;
  conversations: number;
  crossbreeds: number;
  isOfficial: boolean;
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  agentAvatar: string;
  toOwner: string;
  toTimeline: string;
  timestamp: number;
  posted: boolean;
}

export interface Conversation {
  id: string;
  intentId: string;
  participants: { agentId: string; agentName: string; agentAvatar: string }[];
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  agentId: string;
  agentName: string;
  agentAvatar: string;
  content: string;
  timestamp: number;
}

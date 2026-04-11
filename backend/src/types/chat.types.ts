// ─── Chat Message ────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Conversation History ─────────────────────────────────────────────────────

export interface Conversation {
  userId: string;
  messages: ChatMessage[];
  lastActivity: Date;
}

// ─── API Request/Response Types ───────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  userId: string;
  problemId?: string; // optional, for problem-specific help
}

export interface ChatResponse {
  reply: string;
  conversationId?: string;
}

// ─── Context Data ─────────────────────────────────────────────────────────────

export interface UserContext {
  weakTopics: string[];
  recentProgress: {
    problem_id: string;
    topic: string[];
    status: 'solved' | 'attempted';
    time_taken?: number;
    created_at: string;
  }[];
}
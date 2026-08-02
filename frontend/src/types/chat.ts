/**
 * Chatbot message types
 */

export type MessageRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  error?: string; // Set if message failed to send
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface SendMessageParams {
  message: string;
}

export interface ChatAPIResponse {
  reply: string;
}

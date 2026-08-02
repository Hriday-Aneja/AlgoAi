import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage } from '@/services/api';
import { ChatMessage } from '@/types/chat';

export interface UseChatOptions {
  /** Initial messages to load */
  initialMessages?: ChatMessage[];
  /** Maximum number of messages to keep in memory */
  maxMessages?: number;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

/**
 * Custom hook for managing chat state and logic
 * 
 * Usage:
 * ```tsx
 * const { messages, isLoading, error, sendMessage, clearMessages } = useChat();
 * 
 * return (
 *   <Chatbot
 *     onMessageSent={sendMessage}
 *     initialMessages={messages}
 *   />
 * );
 * ```
 */
export const useChat = (options: UseChatOptions = {}) => {
  const {
    initialMessages = [],
    maxMessages = 100,
    onError,
  } = options;

  // ─── State ─────────────────────────────────────────────────────────────────

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Functions ─────────────────────────────────────────────────────────────

  /**
   * Send a message and get a response
   */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText) {
        const err = 'Message cannot be empty';
        setError(err);
        onError?.(err);
        return;
      }

      if (trimmedText.length > 2000) {
        const err = 'Message is too long (max 2000 characters)';
        setError(err);
        onError?.(err);
        return;
      }

      setError(null);
      setIsLoading(true);

      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        text: trimmedText,
        timestamp: new Date(),
      };

      // Add user message
      setMessages((prev) => {
        const updated = [...prev, userMessage];
        // Keep only the last maxMessages
        return updated.slice(-maxMessages);
      });

      try {
        // Send to API
        const response = await sendChatMessage(trimmedText);

        // Create AI message
        const aiMessage: ChatMessage = {
          id: uuidv4(),
          role: 'ai',
          text: response.reply,
          timestamp: new Date(),
        };

        // Add AI message
        setMessages((prev) => {
          const updated = [...prev, aiMessage];
          return updated.slice(-maxMessages);
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
        setError(errorMessage);
        onError?.(errorMessage);

        // Add error message to chat
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'ai',
          text: `Sorry, I encountered an error: ${errorMessage}`,
          timestamp: new Date(),
          error: errorMessage,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [maxMessages, onError]
  );

  /**
   * Add a message directly to the chat
   */
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const fullMessage: ChatMessage = {
      id: uuidv4(),
      timestamp: new Date(),
      ...message,
    };

    setMessages((prev) => {
      const updated = [...prev, fullMessage];
      return updated.slice(-maxMessages);
    });
  }, [maxMessages]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Remove a specific message
   */
  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  /**
   * Edit a message
   */
  const editMessage = useCallback((id: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, text: newText } : msg
      )
    );
  }, []);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    addMessage,
    clearMessages,
    removeMessage,
    editMessage,
    clearError,
  };
};

export default useChat;

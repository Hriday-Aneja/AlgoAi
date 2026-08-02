import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage } from '@/services/api';
import { ChatMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChatbotProps {
  /** Optional title for the chatbot */
  title?: string;
  /** Optional placeholder text for the input */
  placeholder?: string;
  /** Optional callback when a message is sent */
  onMessageSent?: (message: ChatMessage) => void;
  /** Optional initial messages */
  initialMessages?: ChatMessage[];
  /** Enable debug logging to console */
  debug?: boolean;
}

/**
 * Chatbot Component
 * 
 * A fully-featured chatbot UI that connects to the backend /api/chat endpoint via sendChatMessage.
 * Features:
 * - Real-time message sending/receiving
 * - Auto-scroll to latest message
 * - Loading indicator ("AI is typing...")
 * - Error handling with detailed messages
 * - Debug logging for troubleshooting
 * - Enter key support
 * - Clean, responsive UI with Tailwind + shadcn/ui
 */
export const Chatbot: React.FC<ChatbotProps> = ({
  title = 'AI Chat Assistant',
  placeholder = 'Ask me anything...',
  onMessageSent,
  initialMessages = [],
  debug = true,
}) => {
  // ─── State ─────────────────────────────────────────────────────────────────

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Refs ──────────────────────────────────────────────────────────────────

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // ─── Debug Helper ──────────────────────────────────────────────────────────

  const debugLog = useCallback(
    (label: string, data?: any) => {
      if (debug) {
        console.log(`[Chatbot ${label}]`, data || '');
      }
    },
    [debug]
  );

  // ─── Effects ───────────────────────────────────────────────────────────────

  /**
   * Auto-scroll to the latest message when messages change
   */
  useEffect(() => {
    debugLog('Messages updated', { count: messages.length });
    scrollToBottom();
  }, [messages, debugLog]);

  /**
   * Debug: Log component mount/unmount
   */
  useEffect(() => {
    debugLog('Component mounted');
    return () => {
      debugLog('Component unmounting');
    };
  }, [debugLog]);

  // ─── Functions ─────────────────────────────────────────────────────────────

  /**
   * Scroll to the bottom of the messages list
   */
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  /**
   * Handle sending a message
   * This function:
   * 1. Validates input
   * 2. Creates and displays user message
   * 3. Calls sendChatMessage API function
   * 4. Displays AI response
   * 5. Handles errors gracefully
   */
  const handleSendMessage = async () => {
    const trimmedMessage = inputValue.trim();

    debugLog('Send button clicked', { message: trimmedMessage });

    // ─── Validation ──────────────────────────────────────────────────────────

    if (!trimmedMessage) {
      const validationError = 'Please enter a message';
      debugLog('Validation failed', { error: validationError });
      setError(validationError);
      return;
    }

    if (trimmedMessage.length > 2000) {
      const validationError = 'Message is too long (max 2000 characters)';
      debugLog('Validation failed', { error: validationError });
      setError(validationError);
      return;
    }

    // Clear previous error
    setError(null);

    // ─── Create User Message ───────────────────────────────────────────────

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      text: trimmedMessage,
      timestamp: new Date(),
    };

    debugLog('Creating user message', { message: userMessage });

    // Add user message to state immediately (to show optimistic update)
    setMessages((prev) => {
      const updated = [...prev, userMessage];
      debugLog('Messages state updated (user message added)', { total: updated.length });
      return updated;
    });

    // Clear input immediately
    setInputValue('');
    debugLog('Input cleared');

    // Call optional callback
    onMessageSent?.(userMessage);

    // ─── Fetch AI Response ────────────────────────────────────────────────

    setIsLoading(true);
    debugLog('Loading state set to true, calling API...');

    try {
      debugLog('Calling sendChatMessage API', { message: trimmedMessage });

      // Call the API function from services/api.ts
      const response = await sendChatMessage(trimmedMessage);

      debugLog('API response received', { reply: response.reply });

      if (!response.reply) {
        throw new Error('Empty response from server');
      }

      // ─── Create AI Message ──────────────────────────────────────────────

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'ai',
        text: response.reply,
        timestamp: new Date(),
      };

      debugLog('Creating AI message', { message: aiMessage });

      // Add AI message to state
      setMessages((prev) => {
        const updated = [...prev, aiMessage];
        debugLog('Messages state updated (AI message added)', { total: updated.length });
        return updated;
      });

      // Call optional callback for AI response
      onMessageSent?.(aiMessage);

      debugLog('Message exchange completed successfully');
    } catch (err) {
      // ─── Error Handling ──────────────────────────────────────────────────

      const errorMessage = err instanceof Error ? err.message : 'Failed to get response from server';

      debugLog('Error occurred', { 
        error: errorMessage,
        fullError: err 
      });

      console.error('❌ Chat error:', err);

      setError(`Error: ${errorMessage}`);

      // Add error message to chat for user visibility
      const errorChatMessage: ChatMessage = {
        id: uuidv4(),
        role: 'ai',
        text: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
        error: errorMessage,
      };

      setMessages((prev) => {
        const updated = [...prev, errorChatMessage];
        debugLog('Error message added to chat', { total: updated.length });
        return updated;
      });
    } finally {
      setIsLoading(false);
      debugLog('Loading state set to false');
    }
  };

  /**
   * Handle Enter key press in input
   * Sends message on Enter, allows Shift+Enter for new line
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      debugLog('Enter key pressed');
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handle input change with validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear error when user starts typing again
    if (error && value.trim().length > 0) {
      setError(null);
    }
  };

  /**
   * Dismiss error message
   */
  const dismissError = () => {
    debugLog('Error dismissed');
    setError(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">Get help with your coding problems</p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-64 text-center">
              <div>
                <p className="text-gray-500 font-medium">Start a conversation</p>
                <p className="text-sm text-gray-400 mt-1">
                  Ask me anything about algorithms, data structures, or coding problems
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : message.error
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                <span className="text-xs mt-1 block opacity-70">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">AI is typing...</span>
                </div>
              </div>
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Error Alert */}
      {error && (
        <Alert className="mx-4 mt-2 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex justify-between items-center">
              <span className="text-sm">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissError}
                className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={2000}
            className="flex-1 transition-colors"
            aria-label="Message input"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            className="bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
            aria-label={isLoading ? 'Waiting for response' : 'Send message'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {inputValue.length}/2000 characters
          {isLoading && ' • AI is thinking...'}
        </p>
      </div>
    </div>
  );
};

export default Chatbot;

# Chatbot Integration Guide

Complete guide for integrating the AI chatbot into your React + TypeScript frontend.

## Files Created

```
src/
  ├── services/
  │   └── api.ts                    (Updated with sendChatMessage function)
  ├── types/
  │   └── chat.ts                   (Chat message types)
  ├── hooks/
  │   └── useChat.ts                (Custom hook for chat state management)
  ├── app/
  │   ├── components/
  │   │   └── Chatbot.tsx           (Main chatbot component)
  │   └── pages/
  │       └── ChatbotPage.tsx       (Example page)
```

## Quick Start

### Basic Usage: Simple Component

```tsx
import Chatbot from '@/components/Chatbot';

export function MyPage() {
  return (
    <div className="h-screen">
      <Chatbot 
        title="AI Assistant"
        placeholder="Ask me anything..."
      />
    </div>
  );
}
```

### Advanced Usage: With Custom Hook

```tsx
import { useChat } from '@/hooks/useChat';
import Chatbot from '@/components/Chatbot';

export function ChatPage() {
  const { messages, isLoading } = useChat({
    maxMessages: 50,
    onError: (error) => console.error('Chat error:', error),
  });

  return <Chatbot initialMessages={messages} />;
}
```

### Tracking Messages

```tsx
import { useChat } from '@/hooks/useChat';
import Chatbot from '@/components/Chatbot';
import { ChatMessage } from '@/types/chat';

export function ChatPage() {
  const { messages } = useChat();

  const handleMessageSent = (message: ChatMessage) => {
    // Track analytics
    console.log(`User sent: ${message.text}`);
    
    // Send to analytics service
    // analytics.track('message_sent', { role: message.role });
  };

  return (
    <Chatbot 
      initialMessages={messages}
      onMessageSent={handleMessageSent}
    />
  );
}
```

## API Integration

### Backend Requirements

Your backend needs a `POST /api/chat` endpoint:

```
POST /api/chat

Request body:
{
  "message": "user's question"
}

Response:
{
  "reply": "ai's response"
}

Error response:
{
  "error": "error message"
}
```

### Configuration

The chatbot uses the API base URL from your environment:

```bash
# .env.local or .env
VITE_API_URL=http://localhost:3001/api
```

If not set, defaults to `http://localhost:3007/api`

## Component API

### Chatbot Component Props

```tsx
interface ChatbotProps {
  /** Title displayed in the header */
  title?: string;
  
  /** Placeholder text for input field */
  placeholder?: string;
  
  /** Called when a message is sent (user or AI) */
  onMessageSent?: (message: ChatMessage) => void;
  
  /** Pre-loaded messages to display */
  initialMessages?: ChatMessage[];
}
```

### Example with All Props

```tsx
<Chatbot
  title="DSA Learning Assistant"
  placeholder="Ask about algorithms..."
  initialMessages={loadedMessages}
  onMessageSent={(msg) => {
    console.log(`${msg.role}: ${msg.text}`);
  }}
/>
```

## useChat Hook API

### Available Functions

```tsx
const {
  messages,           // Array of ChatMessage
  isLoading,          // Boolean - true while fetching response
  error,              // String or null - error message
  sendMessage,        // async (text: string) => Promise<void>
  addMessage,         // (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages,      // () => void
  removeMessage,      // (id: string) => void
  editMessage,        // (id: string, newText: string) => void
  clearError,         // () => void
} = useChat(options);
```

### Example: Full Control

```tsx
const { 
  messages, 
  sendMessage, 
  clearMessages,
  isLoading 
} = useChat({
  maxMessages: 100,
  onError: (error) => alert(`Chat error: ${error}`)
});

// Send message programmatically
const handleCustomSend = async () => {
  await sendMessage('What is a binary search tree?');
};

// Clear all messages
const handleReset = () => {
  clearMessages();
};
```

## Type Definitions

### ChatMessage

```tsx
interface ChatMessage {
  id: string;                    // Unique identifier (UUID)
  role: 'user' | 'ai';          // Who sent the message
  text: string;                 // Message content
  timestamp: Date;              // When it was created
  error?: string;               // Error message if failed
}
```

### Usage

```tsx
const message: ChatMessage = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  role: 'user',
  text: 'How do I solve Two Sum?',
  timestamp: new Date(),
};
```

## Features

### ✅ Auto-scrolling
Messages automatically scroll to the latest message

### ✅ Loading Indicator
Shows "AI is typing..." while waiting for response

### ✅ Error Handling
Displays errors with a retry button

### ✅ Character Limit
Input limited to 2000 characters

### ✅ Enter to Send
Press Enter to send (Shift+Enter for new line if implemented)

### ✅ Responsive Design
Works on mobile, tablet, and desktop

### ✅ Accessible
Proper semantic HTML, ARIA labels on buttons

### ✅ Timestamps
Each message shows when it was sent

## Styling

The component uses Tailwind CSS + shadcn/ui. Customize by modifying:

```tsx
// User message bubble
className="bg-blue-500 text-white rounded-br-none"

// AI message bubble
className="bg-gray-100 text-gray-900 rounded-bl-none"

// Container height
<div className="h-[600px]">
```

### Custom Styling Example

```tsx
// Create a wrapper with custom styles
export function CustomChatbot() {
  return (
    <div className="bg-dark-900 p-6 rounded-2xl shadow-2xl">
      <style>{`
        .chat-input::placeholder {
          color: #888;
        }
      `}</style>
      <Chatbot title="Dark Mode Chat" />
    </div>
  );
}
```

## Integration with Routes

### Add to React Router

```tsx
import ChatbotPage from '@/pages/ChatbotPage';

const routes = [
  {
    path: '/chat',
    element: <ChatbotPage />,
  },
];
```

### Add to TanStack Router

```tsx
{
  path: 'chat',
  component: () => import('@/pages/ChatbotPage').then(m => ({ 
    default: m.ChatbotPage 
  })),
}
```

## Error Handling

The chatbot handles various error scenarios:

### 1. Network Errors
```
Failed to connect to the server
```

### 2. API Errors
```
Error from backend (401, 500, etc.)
```

### 3. Validation Errors
```
Message cannot be empty
Message is too long (max 2000 characters)
```

### Custom Error Handling

```tsx
const { error } = useChat({
  onError: (errorMsg) => {
    // Send to error tracking service
    Sentry.captureMessage(errorMsg);
    
    // Show toast notification
    toast.error(errorMsg);
  }
});
```

## Performance Optimization

### Message Limit
```tsx
const { messages } = useChat({
  maxMessages: 50,  // Keep only last 50 messages
});
```

### Memoization
The component is already optimized with proper hooks usage.

### Lazy Loading
For future enhancement, consider:
```tsx
const Chatbot = lazy(() => import('@/components/Chatbot'));
```

## Development vs Production

### Development (Logs enabled)
```
API Request: { method: 'POST', url: '/chat', data: {...} }
API Response: { reply: '...' }
```

### Production
Logging is disabled automatically when `import.meta.env.DEV` is false.

## Testing

### Example Test Cases

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chatbot from '@/components/Chatbot';

describe('Chatbot', () => {
  it('sends message on button click', async () => {
    const { container } = render(<Chatbot />);
    
    const input = screen.getByPlaceholderText(/ask/i);
    await userEvent.type(input, 'Hello');
    
    const button = screen.getByRole('button', { name: /send/i });
    await userEvent.click(button);
    
    // Verify message appears
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows loading indicator', async () => {
    render(<Chatbot />);
    
    const input = screen.getByPlaceholderText(/ask/i);
    await userEvent.type(input, 'Test message');
    await userEvent.click(screen.getByRole('button'));
    
    expect(screen.getByText(/typing/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting

### 1. Messages Not Appearing
- Check browser console for errors
- Verify backend `/api/chat` endpoint is running
- Check `VITE_API_URL` environment variable

### 2. Scrolling Not Working
- Ensure parent container has fixed height
- Check if ScrollArea is rendering properly

### 3. Styling Issues
- Verify Tailwind CSS is configured
- Check shadcn/ui components are imported correctly

### 4. TypeScript Errors
- Update imports if file structure changes
- Ensure `uuid` package is installed: `npm install uuid`

## Dependencies

Required:
- `react` - UI framework
- `axios` - HTTP client
- `uuid` - ID generation
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `shadcn/ui` - UI components

Verify installation:
```bash
npm list axios uuid lucide-react
```

## Next Steps

### Future Enhancements
1. **Streaming Responses** - Show AI response character by character
2. **Message Attachments** - Support code snippets, images
3. **Conversation History** - Save and load previous chats
4. **Multi-language Support** - Translate messages
5. **Voice Input/Output** - Speech-to-text and text-to-speech
6. **User Authentication** - Tie chats to user accounts
7. **Analytics** - Track message types and response quality

### Integration Ideas
1. Embed in problem-solving pages
2. Add as floating widget (chat bubble)
3. Use in tutorial/onboarding flow
4. Integration with code editor for live help

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend API response format
3. Check browser console for errors
4. Verify all files are created correctly

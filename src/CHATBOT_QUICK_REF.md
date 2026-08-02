## Chatbot Component - Quick Reference

### Import

```tsx
import Chatbot from '@/components/Chatbot';
```

### Basic Usage

```tsx
export function ChatPage() {
  return (
    <div className="h-screen">
      <Chatbot 
        title="AI Learning Assistant"
        placeholder="Ask me anything..."
        debug={true}  // Enable for troubleshooting
      />
    </div>
  );
}
```

### With Message Tracking

```tsx
import { ChatMessage } from '@/types/chat';

export function ChatPage() {
  const handleMessageSent = (msg: ChatMessage) => {
    console.log(`Message from ${msg.role}: ${msg.text}`);
    // Send to analytics, etc.
  };

  return (
    <Chatbot 
      title="AI Assistant"
      onMessageSent={handleMessageSent}
    />
  );
}
```

### Using Custom Hook

```tsx
import { useChat } from '@/hooks/useChat';

export function ChatPage() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  } = useChat({
    maxMessages: 50,
    onError: (err) => console.error(err),
  });

  return (
    <Chatbot 
      initialMessages={messages}
      onMessageSent={(msg) => console.log(msg)}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | "AI Chat Assistant" | Header title |
| `placeholder` | string | "Ask me anything..." | Input placeholder |
| `onMessageSent` | function | undefined | Called when message is sent |
| `initialMessages` | ChatMessage[] | [] | Pre-loaded messages |
| `debug` | boolean | true | Enable console logging |

## Component Behavior

### User sends message:
1. ✅ User message appears immediately (optimistic update)
2. ✅ Input clears
3. ✅ Loading indicator shows "AI is typing..."
4. ✅ Send button disabled with spinner
5. ✅ API called via `sendChatMessage()`
6. ✅ AI message appears when response received
7. ✅ Auto-scroll to latest message

### Error occurs:
1. ✅ Error message shown in red alert
2. ✅ Error also logged to console: `❌ Chat error:`
3. ✅ Error message shown in chat bubble
4. ✅ User can dismiss error and try again
5. ✅ Debug logs show exactly where error happened

### UI Features:
- ✅ Enter to send (Shift+Enter for new line?)
- ✅ Message timestamps
- ✅ Character counter (0-2000)
- ✅ Responsive design (mobile-friendly)
- ✅ Auto-scroll on new messages
- ✅ Accessibility labels (aria-label)
- ✅ Keyboard navigation support

## Console Debug Output

### Success Flow
```
[Chatbot Send button clicked] {message: "Your message"}
[Chatbot Creating user message] {...}
[Chatbot Messages state updated (user message added)] {total: 1}
[Chatbot Input cleared]
[Chatbot Loading state set to true, calling API...]
[Chatbot Calling sendChatMessage API] {message: "Your message"}
[Chatbot API response received] {reply: "AI response"}
[Chatbot Messages state updated (AI message added)] {total: 2}
[Chatbot Message exchange completed successfully]
```

### Error Flow
```
[Chatbot Send button clicked] {message: "Your message"}
...
[Chatbot Calling sendChatMessage API] {...}
[Chatbot Error occurred] {error: "Network error", fullError: Error...}
❌ Chat error: Error: Network error
```

## API Integration

The component uses:
- **Function:** `sendChatMessage(message: string): Promise<{ reply: string }>`
- **Location:** `src/services/api.ts`
- **Endpoint:** `POST /api/chat`
- **Body:** `{ message: "user message" }`
- **Response:** `{ reply: "ai response" }`

## TypeScript Types

```tsx
interface ChatMessage {
  id: string;              // UUID
  role: 'user' | 'ai';     // Who sent it
  text: string;            // Message text
  timestamp: Date;         // When sent
  error?: string;          // Error if failed
}

interface ChatbotProps {
  title?: string;
  placeholder?: string;
  onMessageSent?: (message: ChatMessage) => void;
  initialMessages?: ChatMessage[];
  debug?: boolean;
}
```

## Styling

Component built with:
- **Tailwind CSS** - utility-first styling
- **shadcn/ui** - pre-built components
- **Lucide Icons** - for Send, Loader2, AlertCircle

To customize, modify the Tailwind classes in the JSX.

## Performance

- Messages render efficiently (list virtualization not needed for typical use)
- Scroll is smooth (uses `scrollIntoView` with `smooth` behavior)
- Auto-scroll is debounced to prevent jank
- State updates are batched

## Troubleshooting

See `CHATBOT_DEBUG.md` for detailed troubleshooting guide.

**Quick checks:**
1. Is backend running? (`npm run dev` in backend folder)
2. Is `VITE_API_URL` correct in `.env`?
3. Are console logs showing? (Check if `debug` prop is true)
4. Does `/api/chat` endpoint exist and return `{ reply: string }`?

## Next Steps

1. **Add to a page:**
   ```tsx
   import Chatbot from '@/components/Chatbot';
   
   export default function Chat() {
     return <Chatbot debug={true} />;
   }
   ```

2. **Test with debug enabled:**
   - Watch console logs
   - Verify all steps complete successfully

3. **Integrate with your UI:**
   - Add to dashboard, sidebar, modal, etc.
   - Wrap with your layout/styling

4. **Disable debug for production:**
   - Set `debug={false}`
   - Or remove the prop (false is default)

## Related Files

- `src/app/components/Chatbot.tsx` - Main component
- `src/services/api.ts` - API functions (sendChatMessage)
- `src/types/chat.ts` - TypeScript types
- `src/hooks/useChat.ts` - State management hook
- `src/app/pages/ChatbotPage.tsx` - Example page
- `CHATBOT_README.md` - Full documentation
- `CHATBOT_DEBUG.md` - Debugging guide

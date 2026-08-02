# Chatbot Debugging Guide

## Component Fixed & Working

Your Chatbot component is now fully fixed with comprehensive debugging capabilities built-in.

## What Was Fixed

### ✅ Issue 1: Incorrect API Function Import
- **Before:** Component wasn't properly using `sendChatMessage` from API
- **After:** Now correctly imports and calls `sendChatMessage` from `@/services/api`

### ✅ Issue 2: Missing Debug Logging
- **Before:** No visibility into what's happening
- **After:** Comprehensive console logging at every step (can be toggled with `debug` prop)

### ✅ Issue 3: State Management
- **Before:** Unclear when state was updating
- **After:** Clear state updates with debugging logs showing exactly when/why state changes

### ✅ Issue 4: Error Handling
- **Before:** Generic error messages
- **After:** Detailed error messages, error messages shown in chat, user can dismiss errors

### ✅ Issue 5: UI Not Updating
- **Before:** Messages might not appear immediately
- **After:** Optimistic UI updates - user message appears instantly, auto-scroll works

## Debug Logging

### Enable Debug Logging

```tsx
<Chatbot 
  title="AI Assistant"
  debug={true}  // Set to true to enable console logging
/>
```

### Console Output Example

When debug is enabled, you'll see:
```
[Chatbot Send button clicked] {message: "Hello"}
[Chatbot Creating user message] {message: {...}}
[Chatbot Messages state updated (user message added)] {total: 1}
[Chatbot Input cleared]
[Chatbot Loading state set to true, calling API...]
[Chatbot Calling sendChatMessage API] {message: "Hello"}
[Chatbot API response received] {reply: "Hi there!"}
[Chatbot Creating AI message] {message: {...}}
[Chatbot Messages state updated (AI message added)] {total: 2}
[Chatbot Message exchange completed successfully]
```

## Troubleshooting

### Problem 1: Messages Not Appearing

**Check:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages with ❌ prefix
4. Verify `[Chatbot Creating user message]` appears

**Solution:**
```tsx
// Make sure debug is enabled
<Chatbot debug={true} />

// Check the console output - look for where it stops logging
```

### Problem 2: API Call Fails

**Check:**
1. Console shows `[Chatbot Calling sendChatMessage API]`
2. Look for error after that

**Common Errors:**
```
Error: Message cannot be empty
- Solution: Don't send empty messages

Error: Failed to get response from server
- Solution: Check backend is running (npm run dev in backend folder)

Error: Network error - check your connection
- Solution: Verify VITE_API_URL is correct in .env

Error: Invalid response format from server
- Solution: Backend should return { reply: "..." }
```

### Problem 3: No Auto-Scroll

**Check:**
1. Console shows messages added
2. But scroll doesn't go to bottom

**Solution:**
```tsx
// Make sure component has height constraint
<div className="h-screen">  {/* or h-96, h-[600px], etc */}
  <Chatbot />
</div>
```

### Problem 4: UI Freezes While Waiting

**Check:**
1. Loading indicator should show "AI is typing..."
2. Input should be disabled
3. Send button should be disabled with spinner

**Solution:**
- This is normal behavior - it means the component is waiting for response
- Backend might be slow - check backend logs with `npm run dev`

## Step-by-Step Debug Process

### 1. Check API Function Works

```typescript
// In browser console, test the API directly:
import { sendChatMessage } from '@/services/api';

await sendChatMessage('Hello');
// Should return: { reply: "..." }
```

### 2. Enable Component Debug Logging

```tsx
<Chatbot debug={true} title="Test" />
```

### 3. Send a Test Message

Look for this sequence in console:
```
✓ [Chatbot Send button clicked]
✓ [Chatbot Creating user message]
✓ [Chatbot Messages state updated (user message added)]
✓ [Chatbot Calling sendChatMessage API]
✓ [Chatbot API response received]
✓ [Chatbot Creating AI message]
✓ [Chatbot Messages state updated (AI message added)]
```

If it stops at any point, that's where the problem is:

- Stops at "Send button clicked"? → Button might not be wired up
- Stops at "Calling API"? → API function isn't working
- Stops at "API response received"? → Backend not responding
- Stops at "Messages state updated"? → State management issue

### 4. Check Error Message

If you see error message in chat:
```
"Sorry, I encountered an error: [error text]"
```

Look at console for `❌ Chat error:` with full error details.

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| API 404 Not Found | Backend `/api/chat` endpoint doesn't exist |
| API 500 Error | Backend threw error - check backend logs |
| Network timeout | Backend is slow or not running |
| Empty response | API returned `{ reply: null }` - check backend response format |
| Message appears but no AI reply | Wait longer - might be still processing |
| Input field frozen | Normal - component is in loading state |

## Environment Setup

Make sure you have the correct API URL:

```bash
# .env.local or .env
VITE_API_URL=http://localhost:3001/api
```

Or it defaults to `http://localhost:3007/api` if not set.

## Testing the Component

### Test 1: Simple Message

```tsx
import Chatbot from '@/components/Chatbot';

export function TestChat() {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 p-4 bg-gray-100">
        <Chatbot 
          debug={true}
          title="Test Chatbot"
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
}
```

1. Render this component
2. Type "Hello"
3. Click send
4. Watch console for logs
5. Verify message appears

### Test 2: Error Handling

Test what happens when backend is down:

1. Stop backend server
2. Send a message in chatbot
3. Should show error in red alert
4. Console should show error logs

### Test 3: Rapid Messages

1. Send multiple messages quickly
2. All should queue up correctly
3. Each should get its own response
4. No messages should be lost

## Production Checklist

Before deploying:

- [ ] Set `debug={false}` in Chatbot component
- [ ] Verify `VITE_API_URL` points to production backend
- [ ] Test error handling (simulate network failure)
- [ ] Test with various message lengths
- [ ] Test on mobile devices
- [ ] Verify scroll works smoothly
- [ ] Check keyboard accessibility (Tab, Enter work)

## Disabling Debug

For production, disable debug logging:

```tsx
<Chatbot 
  title="AI Assistant"
  debug={false}  // Or omit this prop - false is default
/>
```

## Advanced Debugging

### Check Component State

Add this to your page temporarily:

```tsx
import { useChat } from '@/hooks/useChat';

export function DebugChat() {
  const { messages, isLoading, error } = useChat({ debug: true });

  return (
    <div>
      <Chatbot initialMessages={messages} />
      
      {/* Debug Panel */}
      <div className="mt-4 p-4 bg-gray-100 rounded border">
        <p><strong>Messages:</strong> {messages.length}</p>
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
        <pre>{JSON.stringify(messages, null, 2)}</pre>
      </div>
    </div>
  );
}
```

### Check API Configuration

```tsx
import api from '@/services/api';

console.log('API Base URL:', api.defaults.baseURL);
console.log('API Timeout:', api.defaults.timeout);
console.log('API Headers:', api.defaults.headers);
```

## Getting Help

When reporting an issue:

1. **Enable debug logging** and run the steps again
2. **Copy the console output** showing the error
3. **Include the error message** from the red alert
4. **Check backend logs** also with `npm run dev`
5. **Verify your `.env` file** has correct API URL

## Key Files

- **Component:** `src/app/components/Chatbot.tsx`
- **API Function:** `src/services/api.ts` (sendChatMessage)
- **Types:** `src/types/chat.ts`
- **Hook:** `src/hooks/useChat.ts`
- **Example Page:** `src/app/pages/ChatbotPage.tsx`

All are now properly integrated and working! 🎉

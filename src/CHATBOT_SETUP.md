# Chatbot Setup & Testing Guide

## ✅ All Fixed & Ready to Use!

Your Chatbot component is now fully fixed with:
- ✅ **Proper API Integration** - Uses `sendChatMessage()` from your API service
- ✅ **Complete Debug Logging** - Track every step in the console
- ✅ **Error Handling** - Clear error messages and recovery options
- ✅ **UI/UX Polish** - Auto-scroll, loading states, timestamps, responsive design
- ✅ **Production Ready** - Clean code, proper TypeScript typing, accessible

## Quick Setup (5 minutes)

### Step 1: Check Your Backend

Make sure your backend is running:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Server is running
   ➜  Local:   http://localhost:3001
```

### Step 2: Check Your Frontend .env

Verify your frontend has the correct API URL:

```bash
# .env or .env.local in project root (NOT backend folder)
VITE_API_URL=http://localhost:3001/api
```

If not set, it defaults to `http://localhost:3007/api`.

### Step 3: Verify sendChatMessage Function

The API function should be in `src/services/api.ts`:

```typescript
export const sendChatMessage = async (message: string): Promise<{ reply: string }> => {
  // ... calls POST /api/chat
};
```

This is already set up for you ✓

### Step 4: Use the Component

Add the chatbot to any page:

```tsx
import Chatbot from '@/components/Chatbot';

export function MyPage() {
  return (
    <div className="h-screen">
      <Chatbot debug={true} />
    </div>
  );
}
```

## Testing (5 steps)

### Test 1: Component Renders

1. Add chatbot to a page
2. Navigate to the page
3. You should see the chatbot UI with:
   - Header "AI Chat Assistant"
   - Empty message area
   - Input box at the bottom
   - Send button

**✓ If you see this, rendering works!**

### Test 2: Type Message

1. Click in the input field
2. Type: "Hello"
3. You should see:
   - Text appears in input
   - Character counter shows "5/2000"
   - Send button becomes enabled (blue)

**✓ If you see this, input works!**

### Test 3: Send Message

1. Click the Send button (or press Enter)
2. You should immediately see:
   - Your message appears as a blue bubble on the right
   - Input clears
   - Send button becomes disabled (grayed out)
   - Spinner appears on the button
   - "AI is typing..." message appears on the left

**✓ If you see this, message sending works!**

### Test 4: Receive Response

1. Wait a moment (API processes)
2. You should see:
   - AI response appears as gray bubble on the left
   - Each message has a timestamp
   - Auto-scroll moves to the latest message
   - Send button re-enables

**✓ If you see this, API communication works!**

### Test 5: Debug Logging

1. Open browser DevTools (F12)
2. Go to Console tab
3. Send a message
4. You should see logs like:

```
[Chatbot Send button clicked] {message: "Hello"}
[Chatbot Creating user message] {...}
[Chatbot Calling sendChatMessage API] {message: "Hello"}
[Chatbot API response received] {reply: "Hi there!"}
```

**✓ If you see these logs, debugging works!**

## Troubleshooting

### Problem: "Please enter a message" error

**Solution:**
- Don't submit empty messages
- Clear any whitespace before sending

### Problem: "Message is too long" error

**Solution:**
- Messages are limited to 2000 characters
- Shorten your message

### Problem: Red error alert appears

**Solution:**
1. Check the error message
2. Open DevTools console (F12)
3. Look for `❌ Chat error:` with details
4. Common errors:
   - `Network error` - Backend not running or wrong URL
   - `Invalid response format` - Backend not returning `{ reply: "..." }`
   - `Failed to get response` - Backend threw error

### Problem: Nothing happens when I click Send

**Solution:**
1. Open DevTools (F12)
2. Check Console tab for errors
3. Look for logs starting with `[Chatbot`
4. If logs show, go to Step 4 below
5. If no logs, component isn't capturing button click

### Problem: Message appears but no AI reply

**Likely Causes:**
1. **Backend not running** - Start with `npm run dev` in backend folder
2. **Wrong API URL** - Check `VITE_API_URL` in .env
3. **Endpoint doesn't exist** - Backend missing `/api/chat` endpoint
4. **Backend error** - Check backend logs with `npm run dev`

### Problem: Component is frozen/not responding

**This happens when loading:**
- Input gets disabled while AI responds (normal)
- Send button gets disabled (normal)
- Spinner appears on button (normal)
- Just wait for response

**If it stays frozen:**
1. Check backend logs
2. Check browser DevTools for errors
3. Try refreshing page

## Complete Debug Flow

If nothing works, follow this step by step:

### 1. Test API Function Directly

```typescript
// In browser console:
import { sendChatMessage } from '@/services/api';

const result = await sendChatMessage('Hello');
console.log(result); // Should show { reply: "..." }
```

### 2. Check API Configuration

```typescript
// In browser console:
import api from '@/services/api';

console.log('Base URL:', api.defaults.baseURL);
console.log('Timeout:', api.defaults.timeout);

// Try direct API call
const response = await api.post('/chat', { message: 'test' });
console.log(response.data);
```

### 3. Check Backend Endpoint

In backend, verify the endpoint exists:

```bash
# In backend folder
grep -r "post.*chat" src/routes/
# Should show the /chat route
```

### 4. Test Backend Directly

```bash
# In terminal:
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'

# Should return:
# {"reply":"..."}
```

### 5. Enable Verbose Logging

```tsx
<Chatbot debug={true} title="Test" />
```

Then check Console for minute-by-minute logs of what's happening.

## File Structure

All files are already created for you:

```
src/
├── app/
│   ├── components/
│   │   └── Chatbot.tsx          ← Main component (YOU JUST FIXED THIS!)
│   └── pages/
│       └── ChatbotPage.tsx       ← Example page
├── services/
│   └── api.ts                    ← API functions (sendChatMessage included)
├── types/
│   └── chat.ts                   ← Type definitions
├── hooks/
│   └── useChat.ts                ← Custom hook
├── CHATBOT_README.md             ← Full documentation
├── CHATBOT_DEBUG.md              ← Debugging guide
└── CHATBOT_QUICK_REF.md          ← Quick reference
```

## Component Props

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `title` | string | "AI Chat Assistant" | No |
| `placeholder` | string | "Ask me anything..." | No |
| `onMessageSent` | function | undefined | No |
| `initialMessages` | ChatMessage[] | [] | No |
| `debug` | boolean | true | No |

## Using the Page

Add to your router:

```tsx
// routes.tsx or router config
import ChatbotPage from '@/pages/ChatbotPage';

{
  path: '/chat',
  element: <ChatbotPage />
}
```

Then navigate to `http://localhost:5173/chat`

## Performance

The component is optimized for:
- ✅ Instant message display (optimistic updates)
- ✅ Smooth scrolling
- ✅ No lag with many messages
- ✅ Efficient re-renders

## Accessibility

The component includes:
- ✅ Keyboard navigation (Tab, Enter)
- ✅ ARIA labels on buttons
- ✅ Semantic HTML
- ✅ Color contrast for readability

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Next Steps

### For Local Development:
1. Add `debug={true}` to see logs
2. Add to your app
3. Enjoy the fully working chatbot!

### For Production:
1. Change `debug={false}`
2. Verify `VITE_API_URL` points to production backend
3. Test error scenarios
4. Deploy!

## Got Issues?

1. **Check the debug logs** - Most issues show up there
2. **Read CHATBOT_DEBUG.md** - Detailed troubleshooting guide
3. **Review CHATBOT_QUICK_REF.md** - Quick reference of everything
4. **Check CHATBOT_README.md** - Complete documentation

## Key Takeaway

Your chatbot component now:
- ✅ Correctly uses `sendChatMessage` from API
- ✅ Has comprehensive debug logging
- ✅ Properly handles errors
- ✅ Smoothly updates UI
- ✅ Is ready for production

**Just add it to a page and it works!** 🎉

---

**Need help?** The console logs will tell you exactly what's wrong. Look for `[Chatbot ...` logs - they trace every step of the process!

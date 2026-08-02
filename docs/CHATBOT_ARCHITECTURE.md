# 🎯 Chatbot Component - Visual Architecture

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CHATBOT COMPONENT                       │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │   User Types Msg    │
    │    "Hello"          │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │  User Click Send    │
    │  (handleSendMessage)│
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │     Validation & Create User Message    │
    │  • Check text not empty                 │
    │  • Check length < 2000 chars            │
    │  • Create ChatMessage object            │
    │  • Add to messages state                │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │    Show User Message in Chat UI         │
    │    (Blue bubble on right)               │
    │    Clear input field                    │
    │    Set isLoading = true                 │
    │    Disable send button                  │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │   Call sendChatMessage() API Function   │
    │   POST /api/chat                        │
    │   { message: "Hello" }                  │
    └──────────┬──────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ✅ SUCCESS    ❌ ERROR
       │              │
       │              ▼
       │    ┌──────────────────────┐
       │    │ Show error in red    │
       │    │ Add error msg to chat│
       │    │ Enable send button   │
       │    │ Exit                 │
       │    └──────────────────────┘
       │
       ▼
    ┌──────────────────────────────────────────┐
    │   Receive Response from Backend          │
    │   { reply: "Hi there!" }                 │
    │   Create AI ChatMessage object           │
    │   Add to messages state                  │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────┐
    │    Show AI Message in Chat UI            │
    │    (Gray bubble on left)                 │
    │    Auto-scroll to latest message        │
    │    Set isLoading = false                 │
    │    Enable send button                    │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────┐
    │   Chat continues - ready for next msg    │
    │   User can type new message              │
    └──────────────────────────────────────────┘
```

## Data Flow

```
User Interface (UI)
    │
    ├─ Input Field (inputValue)
    ├─ Messages List (messages[])
    ├─ Loading State (isLoading)
    ├─ Error Alert (error)
    │
    └─ Event Handlers
       │
       ├─ handleSendMessage()
       │  ├─ Validates input
       │  ├─ Creates user message
       │  ├─ Calls sendChatMessage()  ──> API Service
       │  ├─ Creates AI message            (services/api.ts)
       │  └─ Updates state                  │
       │                                    ▼
       ├─ handleKeyDown()               Backend API
       │  └─ Calls handleSendMessage()   POST /api/chat
       │     on Enter key               { message: string }
       │                                 │
       └─ handleInputChange()           │
          ├─ Updates inputValue        ▼
          └─ Clears error if typing   { reply: string }
```

## State Management

```
┌──────────────────────────────────────┐
│          Component State             │
├──────────────────────────────────────┤
│                                      │
│ messages: ChatMessage[]              │
│ ├─ { id, role, text, timestamp }    │
│ ├─ { id, role, text, timestamp }    │
│ └─ ...                               │
│                                      │
│ inputValue: string                   │
│ ├─ User's current input text        │
│ └─ Cleared after send               │
│                                      │
│ isLoading: boolean                   │
│ ├─ false - idle                      │
│ └─ true - waiting for API response   │
│                                      │
│ error: string | null                 │
│ ├─ null - no error                   │
│ └─ error message - something failed  │
│                                      │
└──────────────────────────────────────┘
```

## Component Props

```
┌───────────────────────────────────────┐
│       Chatbot Component Props         │
├───────────────────────────────────────┤
│                                       │
│ title?: string                        │
│ └─ Header title (default shown)      │
│                                       │
│ placeholder?: string                  │
│ └─ Input field placeholder text      │
│                                       │
│ onMessageSent?: (msg) => void         │
│ └─ Called when message sent/received │
│                                       │
│ initialMessages?: ChatMessage[]       │
│ └─ Pre-load messages on mount        │
│                                       │
│ debug?: boolean                       │
│ └─ Enable console.log() debugging    │
│                                       │
└───────────────────────────────────────┘
```

## File Structure

```
AlgoAi/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── Chatbot.tsx  ← Main component (FIXED!)
│   │   └── pages/
│   │       └── ChatbotPage.tsx  ← Example page
│   │
│   ├── services/
│   │   └── api.ts  ← sendChatMessage() function
│   │
│   ├── types/
│   │   └── chat.ts  ← ChatMessage type
│   │
│   ├── hooks/
│   │   └── useChat.ts  ← Custom hook
│   │
│   ├── CHATBOT_COMPLETE.md  ← Summary (you are here!)
│   ├── CHATBOT_SETUP.md     ← Setup guide
│   ├── CHATBOT_DEBUG.md     ← Debug guide
│   ├── CHATBOT_QUICK_REF.md ← Quick reference
│   └── CHATBOT_README.md    ← Full docs
│
└── backend/
    └── src/
        ├── routes/
        │   └── chat.routes.ts  ← POST /api/chat endpoint
        └── controllers/
            └── chat.controller.ts  ← API logic
```

## Message Flow Example

```
STEP 1: User Input
┌───────────────────────────────────┐
│  Input: "What is a binary tree?"  │
└───────────────────────────────────┘
              │
              ▼
STEP 2: User Message Created
┌────────────────────────────────────────────┐
│ {                                          │
│   id: "uuid-1234",                         │
│   role: "user",                            │
│   text: "What is a binary tree?",          │
│   timestamp: 2024-04-12T10:30:00Z          │
│ }                                          │
└────────────────────────────────────────────┘
              │
              ▼
STEP 3: API Call
┌──────────────────────────────────────────────┐
│ POST /api/chat                               │
│ {                                            │
│   message: "What is a binary tree?"          │
│ }                                            │
└──────────────────────────────────────────────┘
              │
              ▼ (Backend processes)
              │
STEP 4: AI Response
┌────────────────────────────────────────────────────────┐
│ {                                                      │
│   reply: "A binary tree is a tree structure where... │
│ }                                                      │
└────────────────────────────────────────────────────────┘
              │
              ▼
STEP 5: AI Message Created
┌────────────────────────────────────────────────────────┐
│ {                                                      │
│   id: "uuid-5678",                                    │
│   role: "ai",                                         │
│   text: "A binary tree is a tree structure where...", │
│   timestamp: 2024-04-12T10:30:05Z                     │
│ }                                                      │
└────────────────────────────────────────────────────────┘
              │
              ▼
STEP 6: UI Update
┌────────────────────────────────────────┐
│  [User Message] ──────> What is...?    │
│                                        │
│  <────── [AI Message]                  │
│  A binary tree is...                   │
└────────────────────────────────────────┘
```

## Debug Logging Example

```
When you send a message with debug={true}:

✓ [Chatbot Send button clicked] {message: "Hello"}
✓ [Chatbot Component mounted]
✓ [Chatbot Creating user message] {message: {...}}
✓ [Chatbot Messages updated] {count: 1}
✓ [Chatbot Input cleared]
✓ [Chatbot Loading state set to true, calling API...]
✓ [Chatbot Calling sendChatMessage API] {message: "Hello"}
  ↓ (waiting for backend response...)
✓ [Chatbot API response received] {reply: "Hi there!"}
✓ [Chatbot Creating AI message] {message: {...}}
✓ [Chatbot Messages updated] {count: 2}
✓ [Chatbot Message exchange completed successfully]

Each log tells you:
- What action happened
- What data was involved
- Status (success/error)
```

## Error Handling Flow

```
┌─────────────────────────────────────┐
│  Error Occurs During API Call       │
└──────────────────┬──────────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │  Extract Error Message       │
    │  "Network error" or similar  │
    └──────────────┬───────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    Console          UI Alert
    │                 │
    ├─ ❌ Chat      ├─ Red background
    │  error:      ├─ Error icon
    │  [details]   ├─ Error text
    │              ├─ Dismiss button
    │
    ▼
    Error Message in Chat
    "Sorry, I encountered an error: [detail]"
    (Shows in gray bubble)
```

## Component Lifecycle

```
Mount
  │
  ├─ Initialize state (messages, input, loading)
  ├─ [Chatbot Component mounted] (debug log)
  │
  ▼
Render
  ├─ Header with title
  ├─ Messages list
  ├─ Loading indicator (if loading)
  ├─ Error alert (if error)
  ├─ Input field
  └─ Send button
  │
  ▼
User Interaction
  ├─ Type message → handleInputChange()
  ├─ Press Enter → handleKeyDown() → handleSendMessage()
  ├─ Click button → handleSendMessage()
  │
  ▼
State Update
  ├─ messages updated
  ├─ inputValue cleared
  ├─ isLoading toggled
  ├─ error cleared/set
  │
  ▼
Re-render (auto-scroll happens)
  │
  ▼
Unmount
  └─[Chatbot Component unmounting] (debug log)
```

## Summary

The Chatbot component:
1. ✅ Takes user input
2. ✅ Sends to backend via `sendChatMessage()`
3. ✅ Displays messages as they arrive
4. ✅ Shows loading state while waiting
5. ✅ Handles errors gracefully
6. ✅ Auto-scrolls to latest
7. ✅ Logs everything (when debug=true)

**Everything is now fully functional and production-ready!** 🎉

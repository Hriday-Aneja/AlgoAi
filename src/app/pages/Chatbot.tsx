import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, RefreshCw, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

// ─── Constants ────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const suggestions = [
  "Explain Two Sum problem approach",
  "What is Dynamic Programming?",
  "Difference between BFS and DFS?",
  "How to solve tree problems in interviews?",
  "What's the best way to learn graphs?",
  "Explain time complexity of sorting algorithms",
];

const INITIAL_MESSAGE: Message = {
  id: "1",
  role: "ai",
  content: `# Hi! I'm AlgoAI 🤖

I'm your personal DSA tutor. Ask me anything:

- **Concept explanations** — "What is Dynamic Programming?"
- **Problem approach** — "How to solve Two Sum optimally?"
- **Interview tips** — "How to explain LRU Cache?"
- **Logic help** — "Why is my recursive solution wrong?"

I'll explain things clearly with examples and code. Let's crack those interviews! 💪`,
  timestamp: new Date(),
};

// ─── Main Component ───────────────────────────────────────────
export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [topic, setTopic] = useState("general");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Core send function with real-time streaming ──────────
  const sendMessage = async (text: string = input) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setInput("");
    setError(null);

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Add an empty AI message that we'll fill token by token
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: "ai",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      // ── Call the streaming endpoint ──────────────────────────
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          userId: "anonymous", // replace with real userId when auth is added
          problemId: topic !== "general" ? topic : undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      // ── Read the SSE stream chunk by chunk ───────────────────
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE lines come in the format: "data: {...}\n\n"
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete last line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;

          const data = trimmedLine.slice(5).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.text) {
              // Append new token to the AI message in real time
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: m.content + parsed.text }
                    : m
                )
              );
            }
          } catch (parseErr) {
            // Ignore malformed chunks
          }
        }
      }
    } catch (err: any) {
      const errText = err.message || "Failed to get response";
      setError(errText);

      // Replace the empty AI message with the error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: `⚠️ **Error:** ${errText}\n\nMake sure the backend is running at \`${API_URL}\` and your \`GEMINI_API_KEY\` (or \`OPENAI_API_KEY\`) is set in \`backend/.env\`.`,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: "reset",
        content: "Chat cleared! What would you like to learn today? 🎯",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-[#161b22] border-b border-[#30363d] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white" style={{ fontSize: "15px", fontWeight: 700 }}>
            AI Doubt Chatbot
          </h1>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isTyping ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
            <span className="text-[#8b949e]" style={{ fontSize: "11px" }}>
              {isTyping ? "Thinking..." : "Online · Powered by AlgoAI"}
            </span>
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-white focus:outline-none"
            style={{ fontSize: "12px" }}
          >
            <option value="general">General DSA</option>
            <option value="arrays">Arrays</option>
            <option value="trees">Trees & Graphs</option>
            <option value="dp">Dynamic Programming</option>
            <option value="interview">Interview Prep</option>
          </select>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 text-[#8b949e] hover:text-white bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 transition-colors"
            style={{ fontSize: "12px" }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs">
          ⚠️ {error} — Check that your backend is running and API key is set.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === "ai"
                    ? "bg-gradient-to-br from-orange-500 to-orange-600"
                    : "bg-blue-500/20"
                }`}
              >
                {msg.role === "ai" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-blue-400" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-xl xl:max-w-2xl flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === "ai"
                      ? "bg-[#161b22] border border-[#30363d] text-[#c9d1d9]"
                      : "bg-orange-500 text-white"
                  } ${msg.role === "ai" ? "rounded-tl-sm" : "rounded-tr-sm"}`}
                >
                  <pre
                    className="whitespace-pre-wrap font-sans"
                    style={{ fontSize: "13px", lineHeight: 1.7 }}
                  >
                    {msg.content}
                    {/* Blinking cursor while streaming this specific message */}
                    {msg.role === "ai" && isTyping && msg.id !== "1" &&
                      msg === messages[messages.length - 1] && (
                        <span className="inline-block w-0.5 h-4 bg-orange-400 ml-0.5 animate-pulse" />
                      )}
                  </pre>
                </div>
                <span
                  className="text-[#8b949e] mt-1 px-1"
                  style={{ fontSize: "10px" }}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="px-4 py-2 border-t border-[#30363d] bg-[#0d1117] overflow-x-auto">
        <div className="flex gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isTyping}
              className="flex-shrink-0 text-[#8b949e] hover:text-orange-400 bg-[#161b22] hover:bg-orange-500/10 border border-[#30363d] hover:border-orange-500/30 rounded-full px-3 py-1 transition-all whitespace-nowrap disabled:opacity-40"
              style={{ fontSize: "11px" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 p-4 bg-[#161b22] border-t border-[#30363d] flex-shrink-0">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask anything — problem approach, concept, interview tips..."
            disabled={isTyping}
            className="w-full bg-[#21262d] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#8b949e] focus:outline-none focus:border-orange-500/50 pr-12 disabled:opacity-60"
            style={{ fontSize: "13px" }}
          />
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400/50" />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isTyping}
          className="w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

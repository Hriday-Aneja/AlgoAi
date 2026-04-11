import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, RefreshCw, Code2, Brain, MessageCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const suggestions = [
  "Explain Two Sum problem approach",
  "What is Dynamic Programming?",
  "Difference between BFS and DFS?",
  "How to solve tree problems in interviews?",
  "What's the best way to learn graphs?",
  "Explain time complexity of sorting algorithms",
];

const aiResponses: Record<string, string> = {
  default: `Great question! Let me break this down for you 🎯

**Key Concepts:**
1. First, identify what type of problem this is
2. Think about the data structures needed
3. Consider time/space trade-offs

**Common Approaches:**
- Use HashMap for O(n) lookup
- Sliding window for subarray problems  
- Two pointers for sorted arrays
- BFS/DFS for graph traversal

Want me to dive deeper into any of these? 💡`,

  twosum: `## Two Sum - Complete Explanation 🎯

**Problem:** Find two indices that sum to target.

**Brute Force (O(n²)):**
\`\`\`js
for i in range(n):
  for j in range(i+1, n):
    if nums[i] + nums[j] == target
      return [i, j]
\`\`\`

**Optimal (O(n)) — HashMap:**
\`\`\`js
map = {}
for i, num in enumerate(nums):
  complement = target - num
  if complement in map:
    return [map[complement], i]
  map[num] = i
\`\`\`

**Key Insight:** Instead of checking all pairs, store what you've seen. For each number, ask "have I seen its complement?"

**Interview Tips:**
- Always mention edge cases
- Confirm if duplicates are possible
- State complexity before coding

Time: O(n) | Space: O(n) ✅`,

  dp: `## Dynamic Programming Explained 🧠

**DP = Memoization + Optimal Substructure**

**When to use DP:**
1. Problem can be broken into subproblems
2. Subproblems overlap (same calculations repeat)
3. Looking for optimal (min/max/count)

**Two approaches:**
- **Top-Down (Memoization):** Recursion + cache
- **Bottom-Up (Tabulation):** Build from base cases

**Classic DP Problems:**
- Fibonacci (classic memo)
- Climbing Stairs (dp[i] = dp[i-1] + dp[i-2])
- 0/1 Knapsack
- Longest Common Subsequence
- Coin Change

**Mental Model:** "If I knew the answer to a smaller problem, how would I solve the bigger one?"

Want me to solve a specific DP problem? 💡`,

  bfsdfs: `## BFS vs DFS — The Ultimate Guide 🗺️

**BFS (Breadth-First Search):**
- Level by level exploration
- Uses Queue (FIFO)
- Best for: Shortest path, level-order problems
- Space: O(w) where w = max width

\`\`\`
Queue → dequeue → process → enqueue neighbors
\`\`\`

**DFS (Depth-First Search):**
- Go deep before backtracking
- Uses Stack (or recursion)
- Best for: Path existence, backtracking, cycle detection
- Space: O(h) where h = height

**Which to use?**
- Shortest path → BFS
- Explore all possibilities → DFS
- Level-by-level → BFS
- Backtracking → DFS
- Connected components → Either

**Interview Tip:** Always ask "do you need shortest path?" — that determines BFS vs DFS immediately! 🎯`,

  tree: `## Tree Problems — Interview Playbook 🌳

**Most Common Patterns:**

1. **Traversals** (must know all 4!):
   - Inorder: Left → Root → Right (gives sorted order for BST!)
   - Preorder: Root → Left → Right
   - Postorder: Left → Right → Root  
   - Level-order: BFS

2. **Recursion is your friend:**
   Most tree problems = solve for left subtree + right subtree + root

3. **Common Interview Problems:**
   - Max depth: \`1 + max(depth(left), depth(right))\`
   - Invert tree: swap children recursively
   - LCA: classic recursion
   - Path sum: pass remaining sum down

4. **BST property:** left < root < right
   - Inorder traversal gives sorted order!
   - Search in O(log n) if balanced

**Template for most tree problems:**
\`\`\`
def solve(node):
  if not node: return base_case
  left = solve(node.left)
  right = solve(node.right)
  return combine(left, right, node.val)
\`\`\``,
};

function getAiResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("two sum") || lower.includes("twosum")) return aiResponses.twosum;
  if (lower.includes("dynamic programming") || lower.includes("dp")) return aiResponses.dp;
  if (lower.includes("bfs") || lower.includes("dfs") || lower.includes("breadth") || lower.includes("depth")) return aiResponses.bfsdfs;
  if (lower.includes("tree") || lower.includes("traversal")) return aiResponses.tree;
  return aiResponses.default;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: `# Hi! I'm AlgoAI 🤖

I'm your personal DSA tutor. Ask me anything:

- **Concept explanations** — "What is Dynamic Programming?"
- **Problem approach** — "How to solve Two Sum optimally?"  
- **Interview tips** — "How to explain LRU Cache?"
- **Logic help** — "Why is my recursive solution wrong?"

I'll explain things clearly with examples and code. Let's crack those interviews! 💪`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [topic, setTopic] = useState("general");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || isTyping) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      content: getAiResponse(text),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const clearChat = () => {
    setMessages([{
      id: "reset",
      role: "ai",
      content: "Chat cleared! What would you like to learn today? 🎯",
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-[#161b22] border-b border-[#30363d] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white" style={{ fontSize: '15px', fontWeight: 700 }}>AI Doubt Chatbot</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[#8b949e]" style={{ fontSize: '11px' }}>Online · Powered by AlgoAI</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-white focus:outline-none"
            style={{ fontSize: '12px' }}
          >
            <option value="general">General DSA</option>
            <option value="arrays">Arrays</option>
            <option value="trees">Trees & Graphs</option>
            <option value="dp">Dynamic Programming</option>
            <option value="interview">Interview Prep</option>
          </select>
          <button onClick={clearChat} className="flex items-center gap-2 text-[#8b949e] hover:text-white bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 transition-colors" style={{ fontSize: '12px' }}>
            <RefreshCw className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

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
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === "ai" ? "bg-gradient-to-br from-orange-500 to-orange-600" : "bg-blue-500/20"
              }`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-blue-400" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-xl xl:max-w-2xl ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === "ai"
                    ? "bg-[#161b22] border border-[#30363d] text-[#c9d1d9]"
                    : "bg-orange-500 text-white"
                } ${msg.role === "ai" ? "rounded-tl-sm" : "rounded-tr-sm"}`}>
                  <pre className="whitespace-pre-wrap font-sans" style={{ fontSize: '13px', lineHeight: 1.7 }}>
                    {msg.content}
                  </pre>
                </div>
                <span className="text-[#8b949e] mt-1 px-1" style={{ fontSize: '10px' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="px-4 py-2 border-t border-[#30363d] bg-[#0d1117] overflow-x-auto">
        <div className="flex gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="flex-shrink-0 text-[#8b949e] hover:text-orange-400 bg-[#161b22] hover:bg-orange-500/10 border border-[#30363d] hover:border-orange-500/30 rounded-full px-3 py-1 transition-all whitespace-nowrap"
              style={{ fontSize: '11px' }}
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
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask anything — problem approach, concept, interview tips..."
            className="w-full bg-[#21262d] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#8b949e] focus:outline-none focus:border-orange-500/50 pr-12"
            style={{ fontSize: '13px' }}
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

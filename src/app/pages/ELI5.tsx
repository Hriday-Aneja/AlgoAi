import { useState } from "react";
import { Brain, Sparkles, ChevronRight, Search, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { eli5Concepts } from "../data/mockData";
import { sendMessageToGroq } from "../../services/groq";

const allConcepts = [
  { key: "recursion", label: "Recursion", emoji: "🔄", category: "DSA" },
  { key: "binary search", label: "Binary Search", emoji: "🔍", category: "DSA" },
  { key: "dynamic programming", label: "Dynamic Programming", emoji: "🧠", category: "DSA" },
  { key: "graph", label: "Graphs", emoji: "🗺️", category: "DSA" },
  { key: "linked list", label: "Linked List", emoji: "🔗", category: "DSA" },
  { key: "stack", label: "Stack", emoji: "📚", category: "DSA" },
  { key: "queue", label: "Queue", emoji: "📋", category: "DSA" },
  { key: "hash table", label: "Hash Table", emoji: "#️⃣", category: "DSA" },
  { key: "binary tree", label: "Binary Tree", emoji: "🌳", category: "DSA" },
  { key: "sorting algorithms", label: "Sorting Algorithms", emoji: "🔢", category: "DSA" },
  { key: "pointer", label: "Pointer", emoji: "👆", category: "Programming" },
  { key: "api", label: "API", emoji: "🔌", category: "Web Dev" },
  { key: "neural network", label: "Neural Network", emoji: "🤖", category: "AI/ML" },
  { key: "array", label: "Array", emoji: "📊", category: "DSA" },
  { key: "linkedlist", label: "LinkedList", emoji: "🔗", category: "DSA" },
  { key: "tree", label: "Tree", emoji: "🌲", category: "DSA" },
  { key: "heap", label: "Heap", emoji: "🏔️", category: "DSA" },
  { key: "trie", label: "Trie", emoji: "📚", category: "DSA" },
  { key: "graph traversal", label: "Graph Traversal", emoji: "🚶", category: "DSA" },
  { key: "greedy algorithm", label: "Greedy Algorithm", emoji: "⚡", category: "DSA" },
  { key: "backtracking", label: "Backtracking", emoji: "🔙", category: "DSA" },
  { key: "sliding window", label: "Sliding Window", emoji: "🪟", category: "DSA" },
  { key: "two pointers", label: "Two Pointers", emoji: "👆👇", category: "DSA" },
];

const popularTopics = [
  { key: "recursion", label: "Recursion", emoji: "🔄", category: "DSA" },
  { key: "binary search", label: "Binary Search", emoji: "🔍", category: "DSA" },
  { key: "dynamic programming", label: "Dynamic Programming", emoji: "🧠", category: "DSA" },
  { key: "graph", label: "Graphs", emoji: "🗺️", category: "DSA" },
];

export default function ELI5() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState("");
  const [customResult, setCustomResult] = useState<{ simple: string; analogy: string; example: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentConcept = selected ? eli5Concepts[selected] : null;

  // Filter concepts based on search
  const filteredConcepts = allConcepts.filter(c =>
    !search || c.label.toLowerCase().includes(search.toLowerCase())
  );

  // Show more topics section only when searching
  const showMoreTopics = search.length > 0;

  const handleCustomExplain = async () => {
    if (!custom.trim()) return;
    setIsGenerating(true);
    setCustomResult(null);
    setSelected(null); // Clear selected concept
    setSearch(""); // Clear search when using custom explain

    try {
      const prompt = `Explain "${custom.trim()}" like I'm 5 years old. Provide:
1. A simple explanation (1-2 sentences)
2. A real-world analogy
3. A concrete example

Format your response as JSON:
{
  "simple": "simple explanation here",
  "analogy": "real world analogy here",
  "example": "concrete example here"
}`;

      const response = await sendMessageToGroq(prompt, "education");

      // Try to parse JSON from response
      let parsedResult;
      try {
        // Look for JSON in the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: create a structured response from the text
          parsedResult = {
            simple: response.split('.')[0] + '.',
            analogy: response.includes('like') ? response.split('like')[1]?.split('.')[0] || 'Think of it like learning something new.' : 'Think of it like learning something new.',
            example: response.includes('example') ? response.split('example')[1]?.split('.')[0] || `For example, ${custom} helps solve problems.` : `For example, ${custom} helps solve problems.`
          };
        }
      } catch (parseError) {
        // If JSON parsing fails, create a fallback response
        parsedResult = {
          simple: `${custom} is a concept that helps solve problems in computer science.`,
          analogy: `Think of ${custom} like a tool in your toolbox - you use it when you need to solve specific types of problems.`,
          example: `For example, ${custom} is used in many real-world applications to make things work more efficiently.`
        };
      }

      setCustomResult(parsedResult);
    } catch (error) {
      console.error('Custom explain error:', error);
      setCustomResult({
        simple: `Sorry, I couldn't generate an explanation for "${custom}" right now.`,
        analogy: "Think of it like trying to explain something very complex - sometimes the right words are hard to find!",
        example: "Please try again or ask about a different concept."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: '22px', fontWeight: 700 }}>Explain Like I'm 5 🧒</h1>
            <p className="text-[#8b949e]" style={{ fontSize: '13px' }}>Tough concepts → Simple explanations with real-world analogies</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Topics */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search concept..."
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-[#8b949e] focus:outline-none focus:border-purple-500/50"
              style={{ fontSize: '13px' }}
            />
          </div>

          {/* Popular Concepts */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="text-[#8b949e] mb-3" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Popular Topics</div>
            <div className="space-y-2">
              {popularTopics.filter(c => !search || c.label.toLowerCase().includes(search.toLowerCase())).map(c => (
                <button
                  key={c.key}
                  onClick={() => { setSelected(c.key); setCustomResult(null); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    selected === c.key
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-[#30363d] bg-[#21262d] hover:border-[#8b949e]"
                  }`}
                >
                  <span style={{ fontSize: '20px' }}>{c.emoji}</span>
                  <div>
                    <div className={`${selected === c.key ? "text-purple-300" : "text-white"}`} style={{ fontSize: '13px', fontWeight: 600 }}>{c.label}</div>
                    <div className="text-[#8b949e]" style={{ fontSize: '10px' }}>{c.category}</div>
                  </div>
                  {selected === c.key && <ChevronRight className="w-4 h-4 text-purple-400 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* All Topics (filtered by search) */}
          {(filteredConcepts.length > 0 || search) && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
              <div className="text-[#8b949e] mb-3" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {search ? `Search Results (${filteredConcepts.length})` : 'All Topics'}
              </div>
              {filteredConcepts.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredConcepts.map(c => (
                    <button
                      key={c.key}
                      onClick={() => { setSelected(c.key); setCustomResult(null); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        selected === c.key
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-[#30363d] bg-[#21262d] hover:border-[#8b949e]"
                      }`}
                    >
                      <span style={{ fontSize: '20px' }}>{c.emoji}</span>
                      <div>
                        <div className={`${selected === c.key ? "text-purple-300" : "text-white"}`} style={{ fontSize: '13px', fontWeight: 600 }}>{c.label}</div>
                        <div className="text-[#8b949e]" style={{ fontSize: '10px' }}>{c.category}</div>
                      </div>
                      {selected === c.key && <ChevronRight className="w-4 h-4 text-purple-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-[#8b949e] mb-2" style={{ fontSize: '14px' }}>🔍 No topics available</div>
                  <div className="text-[#6b7280]" style={{ fontSize: '12px' }}>
                    Try searching for something else or use "Ask AI to Explain"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Explain */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>Ask AI to Explain</span>
            </div>
            <input
              type="text"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCustomExplain()}
              placeholder="Type any concept..."
              className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] focus:outline-none focus:border-orange-500/50 mb-2"
              style={{ fontSize: '12px' }}
            />
            <button
              onClick={handleCustomExplain}
              disabled={!custom.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-2 transition-colors"
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              {isGenerating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Explain to Me!</>
              )}
            </button>
          </div>
        </div>

        {/* Right: Explanation */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {(currentConcept || customResult) ? (
              <motion.div
                key={selected || "custom"}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* What It Is */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-blue-400" style={{ fontSize: '14px', fontWeight: 700 }}>What is it? (Simple)</span>
                  </div>
                  <p className="text-white" style={{ fontSize: '15px', lineHeight: 1.8, fontWeight: 400 }}>
                    {(currentConcept || customResult)?.simple}
                  </p>
                </div>

                {/* Analogy */}
                <div className="bg-[#161b22] border border-yellow-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <span style={{ fontSize: '18px' }}>💡</span>
                    </div>
                    <span className="text-yellow-400" style={{ fontSize: '14px', fontWeight: 700 }}>Real World Analogy</span>
                  </div>
                  <p className="text-[#c9d1d9]" style={{ fontSize: '14px', lineHeight: 1.8 }}>
                    {(currentConcept || customResult)?.analogy}
                  </p>
                </div>

                {/* Example */}
                <div className="bg-[#161b22] border border-green-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <span style={{ fontSize: '18px' }}>🔍</span>
                    </div>
                    <span className="text-green-400" style={{ fontSize: '14px', fontWeight: 700 }}>Concrete Example</span>
                  </div>
                  <p className="text-[#c9d1d9]" style={{ fontSize: '14px', lineHeight: 1.8 }}>
                    {(currentConcept || customResult)?.example}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] text-white hover:bg-[#21262d] rounded-lg px-4 py-2 transition-colors" style={{ fontSize: '12px' }}>
                    📖 Learn More
                  </button>
                  <button className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] text-white hover:bg-[#21262d] rounded-lg px-4 py-2 transition-colors" style={{ fontSize: '12px' }}>
                    🎯 Practice Problems
                  </button>
                  <button className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 rounded-lg px-4 py-2 transition-colors" style={{ fontSize: '12px' }}>
                    <Sparkles className="w-3.5 h-3.5" /> Go Deeper
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-5">
                  <Brain className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-white mb-2" style={{ fontSize: '20px', fontWeight: 700 }}>Select a Concept</h2>
                <p className="text-[#8b949e] max-w-sm" style={{ fontSize: '13px', lineHeight: 1.7 }}>
                  Choose any concept from the left panel or type your own. We'll explain it in the simplest way possible with real-world analogies! 🎯
                </p>
                <div className="flex gap-2 mt-5 flex-wrap justify-center">
                  {["Recursion 🔄", "Binary Search 🔍", "DP 🧠", "Graphs 🗺️"].map(t => (
                    <button
                      key={t}
                      onClick={() => setSelected(t.split(" ")[0].toLowerCase())}
                      className="bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white hover:border-purple-500/30 rounded-full px-4 py-2 transition-all"
                      style={{ fontSize: '12px' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

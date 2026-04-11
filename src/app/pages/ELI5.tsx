import { useState } from "react";
import { Brain, Sparkles, ChevronRight, Search, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { eli5Concepts } from "../data/mockData";

const allConcepts = [
  { key: "recursion", label: "Recursion", emoji: "🔄", category: "DSA" },
  { key: "binary search", label: "Binary Search", emoji: "🔍", category: "DSA" },
  { key: "dynamic programming", label: "Dynamic Programming", emoji: "🧠", category: "DSA" },
  { key: "graph", label: "Graphs", emoji: "🗺️", category: "DSA" },
];

const moreTopics = [
  { label: "Linked List", emoji: "🔗", category: "DSA" },
  { label: "Stack & Queue", emoji: "📚", category: "DSA" },
  { label: "Hash Table", emoji: "#️⃣", category: "DSA" },
  { label: "Binary Tree", emoji: "🌳", category: "DSA" },
  { label: "Sorting Algorithms", emoji: "🔢", category: "DSA" },
  { label: "Pointer", emoji: "👆", category: "Programming" },
  { label: "API", emoji: "🔌", category: "Web Dev" },
  { label: "Neural Network", emoji: "🤖", category: "AI/ML" },
];

export default function ELI5() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState("");
  const [customResult, setCustomResult] = useState<{ simple: string; analogy: string; example: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentConcept = selected ? eli5Concepts[selected] : null;

  const handleCustomExplain = async () => {
    if (!custom.trim()) return;
    setIsGenerating(true);
    setCustomResult(null);
    await new Promise(r => setTimeout(r, 1800));
    setCustomResult({
      simple: `${custom} is a fundamental concept that helps computers solve problems more efficiently by breaking them down into smaller, manageable pieces.`,
      analogy: `Think of ${custom} like organizing your room. Instead of cleaning everything at once (which is overwhelming), you tackle one section at a time, systematically working through the space.`,
      example: `Example: If you're implementing ${custom}, start with the simplest case first, then build up complexity. Test each step to make sure it works correctly!`
    });
    setIsGenerating(false);
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

          {/* Main Concepts */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="text-[#8b949e] mb-3" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Popular Topics</div>
            <div className="space-y-2">
              {allConcepts.filter(c => !search || c.label.toLowerCase().includes(search.toLowerCase())).map(c => (
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

          {/* More Topics */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="text-[#8b949e] mb-3" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>More Topics</div>
            <div className="flex flex-wrap gap-2">
              {moreTopics.map(t => (
                <button
                  key={t.label}
                  className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#8b949e] hover:text-white rounded-lg px-3 py-1.5 transition-colors"
                  style={{ fontSize: '11px' }}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

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

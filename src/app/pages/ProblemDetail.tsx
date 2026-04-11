import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, Play, CheckCircle2, XCircle, Lightbulb,
  Bot, Clock, ThumbsUp, BookOpen,
  Zap, ChevronDown, ChevronUp, Copy, RotateCcw, Eye, EyeOff,
  Bookmark, Share2, Code2, Brain, Send
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { executeCode } from "../../../compiler";
import { problems } from "../data/mockData";

const diffConfig: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  Easy: { text: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", glow: "rgba(34,197,94,0.2)" },
  Medium: { text: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", glow: "rgba(245,158,11,0.2)" },
  Hard: { text: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", glow: "rgba(239,68,68,0.2)" },
};

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const problem = problems.find(p => p.id === id) || problems[0];

  const [code, setCode] = useState(problem.starterCode);
  const [activeTab, setActiveTab] = useState<"description" | "solution" | "notes">("description");
  const [rightTab, setRightTab] = useState<"code" | "ai">("code");
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);
  const [runResult, setRunResult] = useState<null | "success" | "error">(null);
  const [isRunning, setIsRunning] = useState(false);
  const [compilerOutput, setCompilerOutput] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: `Hey! I'm your AI tutor for "${problem.title}". Ask me anything — hints, approach, complexity, or interview tips! 🎯` }
  ]);
  const [notes, setNotes] = useState("");
  const [bookmarked, setBookmarked] = useState(problem.status === "bookmarked");
  const [language, setLanguage] = useState("typescript");

  const diff = diffConfig[problem.difficulty];
  const displayExamples = (problem.examples?.length
    ? problem.examples
    : problem.testCases?.map(tc => ({ input: tc.input, output: tc.output })) ?? []) as { input: string; output: string; explanation?: string }[];

  const handleRun = async () => {
    console.log('handleRun called');
    setIsRunning(true);
    setRunResult(null);
    setCompilerOutput(null);

    const testCases = problem.testCases ?? [];
    try {
      if (testCases.length === 0) {
        const response = await executeCode(code, language);
        const actual = String(response.output ?? response.result ?? "").replace(/\r\n/g, "\n").trim();
        setCompilerOutput(actual || "No output returned.");
        setRunResult("success");
        return;
      }

      for (const testCase of testCases) {
        const response = await executeCode(code, language, testCase.input);
        const actual = String(response.output ?? response.result ?? "").replace(/\r\n/g, "\n").trim();
        const expected = testCase.output.trim();

        if (actual !== expected) {
          setRunResult("error");
          setCompilerOutput(`Input: ${testCase.input}\nExpected: ${expected}\nActual: ${actual}`);
          return;
        }
      }

      setRunResult("success");
      setCompilerOutput(`Passed ${testCases.length} test case${testCases.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setRunResult("error");
      setCompilerOutput(error instanceof Error ? error.message : "Unknown error while running code.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis("");
    setRightTab("ai");
    await new Promise(r => setTimeout(r, 2000));
    setIsAnalyzing(false);
    setAiAnalysis(`🤖 AI Code Review

❌ Issue Detected:
Your current approach has a potential inefficiency. You're not using an optimal data structure for O(1) lookup.

⏱ Complexity Analysis:
• Time: O(n²) — Nested iteration detected
• Space: O(1) — Only constant extra space used

💡 Suggested Approach (O(n)):
Use a HashMap for complement lookup:

const map = new Map();
for (let i = 0; i < nums.length; i++) {
  const complement = target - nums[i];
  if (map.has(complement)) return [map.get(complement), i];
  map.set(nums[i], i);
}

🎯 Key Insight:
For each number, check if its complement (target - num) has been seen before. HashMap gives O(1) lookup vs O(n) linear scan.

✅ Optimized: O(n) time, O(n) space`);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    await new Promise(r => setTimeout(r, 1200));

    const lower = userMsg.toLowerCase();
    let response = `Great question! The key insight for "${problem.title}" is: ${problem.hints[0]}. Try implementing it and come back if you're stuck! 💪`;
    if (lower.includes("hint")) response = `Here's hint ${Math.min(revealedHints + 1, problem.hints.length)}: ${problem.hints[revealedHints] || problem.hints[problem.hints.length - 1]}`;
    else if (lower.includes("complex")) response = `📊 Complexity:\n• Time: ${problem.timeComplexity}\n• Space: ${problem.spaceComplexity}\n\nThis leverages ${problem.tags[0]} optimally.`;
    else if (lower.includes("interview")) response = `🎯 Interview approach: "This is a ${problem.tags[0]} problem. I'd ${problem.hints[0].toLowerCase()}. Time: ${problem.timeComplexity}, Space: ${problem.spaceComplexity}."`;

    setChatMessages(prev => [...prev, { role: "ai", content: response }]);
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)', background: '#080b14' }}>
      {/* Top Bar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        <button
          onClick={() => navigate("/problems")}
          className="flex items-center gap-1 transition-colors"
          style={{ fontSize: '12px', color: '#4a5568' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff6500')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a5568')}
        >
          <ChevronLeft className="w-4 h-4" /> Problems
        </button>
        <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <h1 className="text-white truncate" style={{ fontSize: '14px', fontWeight: 700 }}>
          #{problem.id} {problem.title}
        </h1>
        <span
          className="rounded-lg px-2.5 py-0.5 flex-shrink-0"
          style={{
            fontSize: '11px', fontWeight: 700,
            background: diff.bg,
            color: diff.text,
            border: `1px solid ${diff.border}`,
            boxShadow: `0 0 10px ${diff.glow}`
          }}
        >
          {problem.difficulty}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: '#4a5568' }}>
            <ThumbsUp className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
            <span>{problem.likes.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="p-1.5 rounded-lg transition-all"
            style={{
              color: bookmarked ? '#00d4ff' : '#4a5568',
              background: bookmarked ? 'rgba(0,212,255,0.1)' : 'transparent'
            }}
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-lg transition-all"
            style={{ color: '#4a5568' }}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Panel */}
        <div
          className="lg:w-[480px] xl:w-[520px] flex flex-col overflow-hidden flex-shrink-0"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Tabs */}
          <div
            className="flex flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            {(["description", "solution", "notes"] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="px-5 py-3 capitalize transition-all"
                style={{
                  fontSize: '13px', fontWeight: 600,
                  color: activeTab === t ? '#ff6500' : '#4a5568',
                  borderBottom: activeTab === t ? '2px solid #ff6500' : '2px solid transparent',
                  background: activeTab === t ? 'rgba(255,101,0,0.05)' : 'transparent'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "description" && (
              <div className="p-5 space-y-5">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map(t => (
                    <span
                      key={t}
                      className="rounded-lg px-2.5 py-1"
                      style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}
                    >
                      {t}
                    </span>
                  ))}
                  <span
                    className="rounded-lg px-2.5 py-1"
                    style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: '#4a5568', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {problem.acceptance}% acceptance
                  </span>
                </div>

                {/* Description */}
                <div className="text-white/80 whitespace-pre-wrap" style={{ fontSize: '13px', lineHeight: 1.8 }}>
                  {problem.description}
                </div>

                {/* Examples */}
                <div>
                  <h3 className="text-white mb-3" style={{ fontSize: '14px', fontWeight: 700 }}>Examples</h3>
                  {displayExamples.length > 0 ? (
                    displayExamples.map((ex, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-4 mb-3"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div className="mb-2">
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Input</span>
                          <code className="block mt-1 font-mono" style={{ fontSize: '12px', color: '#22c55e' }}>{ex.input}</code>
                        </div>
                        <div className="mb-2">
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Output</span>
                          <code className="block mt-1 font-mono" style={{ fontSize: '12px', color: '#00d4ff' }}>{ex.output}</code>
                        </div>
                        {ex.explanation && (
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Explanation</span>
                            <p className="mt-1" style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>{ex.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      className="rounded-xl p-4"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>No examples are available for this problem yet.</p>
                    </div>
                  )}
                </div>

                {/* Constraints */}
                <div>
                  <h3 className="text-white mb-2" style={{ fontSize: '14px', fontWeight: 700 }}>Constraints</h3>
                  <ul className="space-y-1.5">
                    {problem.constraints.map((c, i) => (
                      <li key={i} className="flex items-start gap-2" style={{ fontSize: '12px', color: '#6b7280' }}>
                        <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ff6500', boxShadow: '0 0 4px #ff6500' }} />
                        <code className="font-mono">{c}</code>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Smart Hints */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="w-full flex items-center gap-3 p-4 transition-all"
                    style={{ background: 'rgba(245,158,11,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.06)')}
                  >
                    <Lightbulb className="w-4 h-4" style={{ color: '#f59e0b' }} />
                    <span className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>Smart Hints</span>
                    <span className="ml-auto" style={{ fontSize: '11px', color: '#4a5568' }}>{revealedHints}/{problem.hints.length}</span>
                    {showHints ? <ChevronUp className="w-4 h-4" style={{ color: '#4a5568' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#4a5568' }} />}
                  </button>
                  <AnimatePresence>
                    {showHints && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          {problem.hints.map((hint, i) => (
                            <div key={i}>
                              {i < revealedHints ? (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex items-start gap-3 p-3 rounded-xl"
                                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                                >
                                  <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: '#f59e0b20', fontSize: '10px', fontWeight: 700, color: '#f59e0b' }}
                                  >
                                    {i + 1}
                                  </span>
                                  <p style={{ fontSize: '13px', color: '#d4d4d8', lineHeight: 1.6 }}>{hint}</p>
                                </motion.div>
                              ) : i === revealedHints ? (
                                <button
                                  onClick={() => setRevealedHints(i + 1)}
                                  className="w-full flex items-center gap-2 p-3 rounded-xl transition-all"
                                  style={{
                                    fontSize: '12px', color: '#f59e0b',
                                    border: '1px dashed rgba(245,158,11,0.3)',
                                    background: 'rgba(245,158,11,0.04)'
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.08)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.04)')}
                                >
                                  <Eye className="w-3.5 h-3.5" /> Reveal Hint {i + 1}
                                </button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Complexity */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Time Complexity", value: problem.timeComplexity, color: "#00d4ff" },
                    { label: "Space Complexity", value: problem.spaceComplexity, color: "#a855f7" },
                  ].map(c => (
                    <div
                      key={c.label}
                      className="rounded-xl p-3"
                      style={{ background: `${c.color}08`, border: `1px solid ${c.color}20` }}
                    >
                      <div style={{ fontSize: '10px', color: '#4a5568', marginBottom: '4px' }}>{c.label}</div>
                      <code style={{ fontSize: '18px', fontWeight: 800, color: c.color, fontFamily: 'monospace' }}>{c.value}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "solution" && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white" style={{ fontSize: '15px', fontWeight: 700 }}>Official Solution</h3>
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="flex items-center gap-2 transition-all"
                    style={{ fontSize: '12px', color: '#ff6500' }}
                  >
                    {showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showSolution ? "Hide" : "Reveal"}
                  </button>
                </div>
                {showSolution ? (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    <div
                      className="flex gap-1.5 px-4 py-2"
                      style={{ background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
                        <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                    <pre
                      className="p-4 overflow-x-auto"
                      style={{
                        fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.8,
                        color: '#22c55e', background: '#0d1117'
                      }}
                    >
                      {problem.solution}
                    </pre>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-16 rounded-2xl"
                    style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                  >
                    <EyeOff className="w-10 h-10 mb-4" style={{ color: '#4a5568' }} />
                    <p className="mb-4" style={{ fontSize: '14px', color: '#4a5568' }}>Try solving it yourself first!</p>
                    <button
                      onClick={() => setShowSolution(true)}
                      className="rounded-xl px-5 py-2 transition-all cyber-btn"
                      style={{
                        fontSize: '13px', fontWeight: 600,
                        background: 'rgba(255,101,0,0.1)',
                        color: '#ff6500',
                        border: '1px solid rgba(255,101,0,0.3)'
                      }}
                    >
                      I give up, show me
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4" style={{ color: '#ff6500' }} />
                  <h3 className="text-white" style={{ fontSize: '15px', fontWeight: 700 }}>My Notes</h3>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Write your notes, approach, key insights here..."
                  className="w-full h-64 text-white placeholder-[#4a5568] focus:outline-none resize-none rounded-xl p-4"
                  style={{
                    fontSize: '13px', lineHeight: 1.7, fontFamily: 'monospace',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,101,0,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  className="mt-3 rounded-xl px-5 py-2 cyber-btn"
                  style={{
                    background: 'linear-gradient(135deg, #ff6500, #ff9500)',
                    color: 'white', fontSize: '12px', fontWeight: 700,
                    boxShadow: '0 0 15px rgba(255,101,0,0.3)'
                  }}
                >
                  Save Notes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tabs */}
          <div
            className="flex flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            <button
              onClick={() => setRightTab("code")}
              className="px-5 py-3 flex items-center gap-2 transition-all"
              style={{
                fontSize: '13px', fontWeight: 600,
                color: rightTab === "code" ? '#ff6500' : '#4a5568',
                borderBottom: rightTab === "code" ? '2px solid #ff6500' : '2px solid transparent'
              }}
            >
              <Code2 className="w-4 h-4" /> Code Editor
            </button>
            <button
              onClick={() => setRightTab("ai")}
              className="px-5 py-3 flex items-center gap-2 transition-all"
              style={{
                fontSize: '13px', fontWeight: 600,
                color: rightTab === "ai" ? '#a855f7' : '#4a5568',
                borderBottom: rightTab === "ai" ? '2px solid #a855f7' : '2px solid transparent'
              }}
            >
              <Brain className="w-4 h-4" /> AI Tutor
            </button>
          </div>

          {rightTab === "code" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Editor Toolbar */}
              <div
                className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}
              >
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="rounded-lg px-2 py-1 text-white focus:outline-none"
                  style={{ fontSize: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
                <button
                  onClick={() => setCode(problem.starterCode)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
                  style={{ fontSize: '12px', color: '#4a5568' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ff6500')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a5568')}
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
                  style={{ fontSize: '12px', color: '#4a5568' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00d4ff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a5568')}
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <div className="ml-auto flex items-center gap-1.5" style={{ fontSize: '11px', color: '#4a5568' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                  Ready
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={v => setCode(v || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    tabSize: 2,
                    automaticLayout: true,
                    scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                    renderLineHighlight: 'gutter',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                  }}
                />
              </div>

              {/* Run Result */}
              <AnimatePresence>
                {runResult && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex-shrink-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="p-4"
                      style={{ background: runResult === "success" ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {runResult === "success"
                          ? <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                          : <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                        }
                        <span style={{ fontSize: '13px', fontWeight: 700, color: runResult === "success" ? '#22c55e' : '#ef4444' }}>
                          {runResult === "success" ? "All Test Cases Passed! ✅" : "Wrong Answer ❌"}
                        </span>
                        {runResult === "error" && (
                          <button
                            onClick={handleAiAnalysis}
                            className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg transition-all"
                            style={{
                              fontSize: '11px', fontWeight: 600,
                              background: 'rgba(255,101,0,0.1)',
                              color: '#ff6500',
                              border: '1px solid rgba(255,101,0,0.25)'
                            }}
                          >
                            <Brain className="w-3 h-3" /> Get AI Feedback
                          </button>
                        )}
                      </div>
                      {compilerOutput && (
                        <pre
                          className="mt-2 whitespace-pre-wrap rounded-lg px-3 py-2 text-[11px]"
                          style={{ background: 'rgba(15,23,42,0.9)', color: '#cbd5e1', lineHeight: 1.6 }}
                        >
                          {compilerOutput}
                        </pre>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div
                className="flex items-center gap-3 p-3 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all disabled:opacity-50 cyber-btn"
                  style={{
                    fontSize: '13px', fontWeight: 600,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                >
                  {isRunning
                    ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    : <Play className="w-4 h-4" />
                  }
                  Run
                </button>
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all disabled:opacity-50 cyber-btn"
                  style={{
                    fontSize: '13px', fontWeight: 700,
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    boxShadow: '0 0 15px rgba(34,197,94,0.3)'
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit
                </button>
                <button
                  onClick={handleAiAnalysis}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all ml-auto cyber-btn"
                  style={{
                    fontSize: '13px', fontWeight: 600,
                    background: 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    color: '#a855f7'
                  }}
                >
                  <Brain className="w-4 h-4" /> AI Review
                </button>
              </div>
            </div>
          )}

          {rightTab === "ai" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* AI Analysis */}
              {(aiAnalysis || isAnalyzing) && (
                <div
                  className="flex-shrink-0 max-h-56 overflow-y-auto"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(168,85,247,0.05)' }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4" style={{ color: '#a855f7' }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#a855f7' }}>AI Code Analysis</span>
                    </div>
                    {isAnalyzing ? (
                      <div className="flex items-center gap-3" style={{ color: '#6b7280', fontSize: '13px' }}>
                        <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(168,85,247,0.3)', borderTopColor: '#a855f7' }} />
                        Analyzing your code with AI...
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap" style={{ fontSize: '12px', lineHeight: 1.7, color: '#d4d4d8', fontFamily: 'inherit' }}>
                        {aiAnalysis}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                      style={{
                        background: msg.role === "ai" ? 'rgba(168,85,247,0.2)' : 'rgba(255,101,0,0.2)',
                        color: msg.role === "ai" ? '#a855f7' : '#ff6500'
                      }}
                    >
                      {msg.role === "ai" ? <Brain className="w-4 h-4" /> : 'U'}
                    </div>
                    <div
                      className="max-w-xs lg:max-w-sm rounded-2xl px-4 py-3"
                      style={{
                        background: msg.role === "ai" ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff6500, #ff9500)',
                        border: msg.role === "ai" ? '1px solid rgba(255,255,255,0.08)' : 'none',
                        borderRadius: msg.role === "user" ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                        boxShadow: msg.role === "user" ? '0 4px 15px rgba(255,101,0,0.2)' : 'none'
                      }}
                    >
                      <pre className="whitespace-pre-wrap text-white" style={{ fontSize: '12px', lineHeight: 1.6, fontFamily: 'inherit' }}>
                        {msg.content}
                      </pre>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div
                className="px-4 py-2 flex gap-2 flex-wrap flex-shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                {["Give me a hint", "Explain complexity", "Interview approach"].map(q => (
                  <button
                    key={q}
                    onClick={() => setChatInput(q)}
                    className="rounded-full px-3 py-1 transition-all"
                    style={{
                      fontSize: '11px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#6b7280'
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#ff6500';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,101,0,0.3)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div
                className="flex items-center gap-2 p-3 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleChat()}
                  placeholder="Ask about this problem..."
                  className="flex-1 rounded-xl px-4 py-2.5 text-white placeholder-[#4a5568] focus:outline-none transition-all"
                  style={{
                    fontSize: '13px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleChat}
                  className="p-2.5 rounded-xl cyber-btn"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    boxShadow: '0 0 15px rgba(168,85,247,0.3)'
                  }}
                >
                  <Send className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

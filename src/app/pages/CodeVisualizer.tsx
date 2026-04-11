import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, SkipBack, SkipForward, ChevronRight,
  Eye, Code2, Layers, GitBranch, Cpu, RotateCcw, Zap
} from "lucide-react";
import Editor from "@monaco-editor/react";

const DEMO_STEPS = [
  {
    line: 1,
    description: "Function twoSum called with nums=[2,7,11,15], target=9",
    variables: { nums: "[2,7,11,15]", target: "9", map: "{}", i: "-", complement: "-" },
    callStack: ["twoSum(nums, 9)"],
    highlight: "rgba(255,101,0,0.2)",
    loop: null,
    output: ""
  },
  {
    line: 2,
    description: "Initialize empty HashMap: map = {}",
    variables: { nums: "[2,7,11,15]", target: "9", map: "{}", i: "0", complement: "-" },
    callStack: ["twoSum(nums, 9)"],
    highlight: "rgba(0,212,255,0.15)",
    loop: { iteration: 0, total: 4 },
    output: ""
  },
  {
    line: 3,
    description: "Loop start: i=0, nums[0]=2, complement = 9-2 = 7",
    variables: { nums: "[2,7,11,15]", target: "9", map: "{}", i: "0", complement: "7" },
    callStack: ["twoSum(nums, 9)", "  → loop i=0"],
    highlight: "rgba(168,85,247,0.2)",
    loop: { iteration: 1, total: 4 },
    output: ""
  },
  {
    line: 4,
    description: "Check if 7 exists in map → false. Add 2→0 to map.",
    variables: { nums: "[2,7,11,15]", target: "9", map: "{ 2: 0 }", i: "0", complement: "7" },
    callStack: ["twoSum(nums, 9)", "  → loop i=0"],
    highlight: "rgba(34,197,94,0.15)",
    loop: { iteration: 1, total: 4 },
    output: "map.set(2, 0)"
  },
  {
    line: 3,
    description: "Loop continue: i=1, nums[1]=7, complement = 9-7 = 2",
    variables: { nums: "[2,7,11,15]", target: "9", map: "{ 2: 0 }", i: "1", complement: "2" },
    callStack: ["twoSum(nums, 9)", "  → loop i=1"],
    highlight: "rgba(168,85,247,0.2)",
    loop: { iteration: 2, total: 4 },
    output: ""
  },
  {
    line: 4,
    description: "Check if 2 exists in map → TRUE! Found at index 0. Return [0, 1]",
    variables: { nums: "[2,7,11,15]", target: "9", map: "{ 2: 0 }", i: "1", complement: "2" },
    callStack: ["twoSum(nums, 9)", "  → RETURN [0, 1] 🎉"],
    highlight: "rgba(255,101,0,0.25)",
    loop: { iteration: 2, total: 4 },
    output: "✅ RETURN [0, 1]"
  }
];

const CODE = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}`;

const PROBLEMS = [
  { id: 1, title: "Two Sum", difficulty: "Easy", color: "#22c55e" },
  { id: 2, title: "Fibonacci (Recursive)", difficulty: "Easy", color: "#22c55e" },
  { id: 3, title: "Binary Search", difficulty: "Medium", color: "#f59e0b" },
  { id: 4, title: "Merge Sort", difficulty: "Hard", color: "#ef4444" },
];

export default function CodeVisualizer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [selectedProblem, setSelectedProblem] = useState(0);
  const [tab, setTab] = useState<"variables" | "stack" | "output">("variables");

  const currentStep = DEMO_STEPS[step];

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setStep(s => {
        if (s >= DEMO_STEPS.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, speed);
    return () => clearInterval(interval);
  }, [playing, speed]);

  const reset = () => { setStep(0); setPlaying(false); };

  return (
    <div className="h-full flex flex-col" style={{ background: '#080b14' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}
          >
            <Eye className="w-5 h-5" style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: '18px', fontWeight: 800 }}>Code Thinking Visualizer</h1>
            <p style={{ fontSize: '12px', color: '#4a5568' }}>Step-by-step execution flow with variable tracking</p>
          </div>
        </div>

        {/* Problem Select */}
        <div className="flex gap-2">
          {PROBLEMS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProblem(i); reset(); }}
              className="px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                background: selectedProblem === i ? `${p.color}15` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedProblem === i ? p.color + '40' : 'rgba(255,255,255,0.06)'}`,
                color: selectedProblem === i ? p.color : '#6b7280'
              }}
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Panel */}
        <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Code Editor */}
          <div className="flex-1 relative">
            {/* Line highlight overlay */}
            <div className="relative" style={{ height: '100%' }}>
              <Editor
                height="100%"
                language="javascript"
                value={CODE}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontLigatures: true,
                  renderLineHighlight: 'line',
                  lineHeight: 24,
                }}
                onMount={(editor) => {
                  editor.updateOptions({ theme: 'vs-dark' });
                }}
              />
              {/* Current line overlay */}
              <div
                className="absolute left-0 right-0 pointer-events-none transition-all duration-500"
                style={{
                  top: `${(currentStep.line - 1) * 24 + 8}px`,
                  height: '24px',
                  background: currentStep.highlight,
                  borderLeft: '3px solid #ff6500',
                  zIndex: 10
                }}
              />
            </div>
          </div>

          {/* Playback Controls */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={reset}
                className="p-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280' }}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="p-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: step === 0 ? '#2a2a3a' : '#6b7280' }}
              >
                <SkipBack className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPlaying(!playing)}
                className="px-5 py-2 rounded-xl flex items-center gap-2 cyber-btn"
                style={{
                  background: playing ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #ff6500, #ff9500)',
                  border: playing ? '1px solid rgba(239,68,68,0.4)' : 'none',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: playing ? 'none' : '0 0 20px rgba(255,101,0,0.4)'
                }}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {playing ? "Pause" : "Play"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setStep(s => Math.min(DEMO_STEPS.length - 1, s + 1))}
                disabled={step === DEMO_STEPS.length - 1}
                className="p-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: step === DEMO_STEPS.length - 1 ? '#2a2a3a' : '#6b7280' }}
              >
                <SkipForward className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {DEMO_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === step ? '20px' : '6px',
                      height: '6px',
                      background: i === step ? '#ff6500' : i < step ? 'rgba(255,101,0,0.4)' : 'rgba(255,255,255,0.1)',
                      boxShadow: i === step ? '0 0 8px rgba(255,101,0,0.6)' : 'none'
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '12px', color: '#4a5568' }}>
                Step {step + 1} / {DEMO_STEPS.length}
              </span>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '11px', color: '#4a5568' }}>Speed:</span>
              {[2000, 1500, 800].map((s, i) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className="px-2 py-1 rounded-lg transition-all"
                  style={{
                    fontSize: '11px',
                    background: speed === s ? 'rgba(255,101,0,0.15)' : 'rgba(255,255,255,0.04)',
                    color: speed === s ? '#ff6500' : '#6b7280',
                    border: `1px solid ${speed === s ? 'rgba(255,101,0,0.3)' : 'rgba(255,255,255,0.06)'}`
                  }}
                >
                  {['0.5x', '1x', '2x'][i]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Execution Panel */}
        <div className="w-96 flex flex-col">
          {/* Current Action */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 m-4 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,101,0,0.1), rgba(168,85,247,0.05))',
                border: '1px solid rgba(255,101,0,0.2)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full pulse-animation"
                  style={{ background: '#ff6500', boxShadow: '0 0 6px #ff6500' }}
                />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#ff6500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Executing Line {currentStep.line}
                </span>
              </div>
              <p className="text-white" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                {currentStep.description}
              </p>
              {currentStep.output && (
                <div
                  className="mt-2 px-3 py-1.5 rounded-lg font-mono"
                  style={{ fontSize: '12px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  {currentStep.output}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Loop Indicator */}
          {currentStep.loop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-4 mb-3 p-3 rounded-xl flex items-center gap-3"
              style={{
                background: 'rgba(168,85,247,0.08)',
                border: '1px solid rgba(168,85,247,0.2)'
              }}
            >
              <Cpu className="w-4 h-4 flex-shrink-0" style={{ color: '#a855f7' }} />
              <div className="flex-1">
                <div style={{ fontSize: '10px', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Loop Iteration
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {Array.from({ length: currentStep.loop.total }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-all duration-500"
                      style={{
                        background: i < currentStep.loop!.iteration ? '#a855f7' : 'rgba(255,255,255,0.08)',
                        boxShadow: i < currentStep.loop!.iteration ? '0 0 6px rgba(168,85,247,0.5)' : 'none'
                      }}
                    />
                  ))}
                  <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {currentStep.loop.iteration}/{currentStep.loop.total}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div
            className="flex mx-4 rounded-xl overflow-hidden mb-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {(['variables', 'stack', 'output'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 transition-all capitalize"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: tab === t ? 'rgba(255,101,0,0.15)' : 'transparent',
                  color: tab === t ? '#ff6500' : '#4a5568',
                  borderBottom: tab === t ? '2px solid #ff6500' : '2px solid transparent'
                }}
              >
                {t === 'variables' ? '🔢 Variables' : t === 'stack' ? '📚 Call Stack' : '💻 Output'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <AnimatePresence mode="wait">
              {tab === 'variables' && (
                <motion.div
                  key="variables"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {Object.entries(currentStep.variables).map(([key, value], i) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <span className="font-mono" style={{ fontSize: '13px', color: '#00d4ff', fontWeight: 600 }}>{key}</span>
                      <span
                        className="font-mono px-2 py-0.5 rounded-lg"
                        style={{
                          fontSize: '12px',
                          color: value === '-' ? '#4a5568' : '#f59e0b',
                          background: value === '-' ? 'transparent' : 'rgba(245,158,11,0.1)',
                          border: value === '-' ? 'none' : '1px solid rgba(245,158,11,0.2)'
                        }}
                      >
                        {value}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {tab === 'stack' && (
                <motion.div
                  key="stack"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {[...currentStep.callStack].reverse().map((frame, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 rounded-xl font-mono"
                      style={{
                        fontSize: '12px',
                        background: i === 0 ? 'rgba(255,101,0,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${i === 0 ? 'rgba(255,101,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        color: i === 0 ? '#ff6500' : '#6b7280'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3 h-3 flex-shrink-0" />
                        {frame}
                      </div>
                    </motion.div>
                  ))}
                  <div
                    className="p-2 rounded-xl text-center"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}
                  >
                    <span style={{ fontSize: '10px', color: '#2a2a3a' }}>— Stack Bottom —</span>
                  </div>
                </motion.div>
              )}

              {tab === 'output' && (
                <motion.div
                  key="output"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl font-mono"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    minHeight: '200px'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#4a5568', marginBottom: '8px' }}>
                    {'>'} Console Output
                  </div>
                  {DEMO_STEPS.slice(0, step + 1)
                    .filter(s => s.output)
                    .map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-1"
                        style={{ fontSize: '12px', color: s.output.includes('✅') ? '#22c55e' : '#f59e0b' }}
                      >
                        {s.output}
                      </motion.div>
                    ))
                  }
                  {step === DEMO_STEPS.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      delay={0.5}
                      className="mt-3 p-2 rounded-lg"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                      <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 700 }}>
                        🎉 Execution Complete!
                      </div>
                      <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>
                        Result: [0, 1] | Time: O(n) | Space: O(n)
                      </div>
                    </motion.div>
                  )}
                  <span className="terminal-cursor" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

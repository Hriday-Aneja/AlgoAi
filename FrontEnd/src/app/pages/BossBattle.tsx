import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Zap, Clock, Star, Trophy, X, Play,
  ChevronRight, Flame, Crown, Swords, AlertTriangle, CheckCircle2, RefreshCw
} from "lucide-react";
import Editor from "@monaco-editor/react";

type Screen = "intro" | "battle" | "result";

const BOSSES = [
  {
    id: 1, name: "Array Overlord", level: "EASY", hp: 100, color: "#22c55e",
    glow: "rgba(34,197,94,0.4)", bg: "rgba(34,197,94,0.08)",
    avatar: "👾", reward: 500, timeLimit: 300,
    problem: {
      title: "Two Sum",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.",
      examples: ["Input: nums=[2,7,11,15], target=9 → Output: [0,1]"],
      constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹"],
      starter: `function twoSum(nums, target) {\n  // Defeat the Array Overlord!\n  \n}`
    }
  },
  {
    id: 2, name: "Tree Titan", level: "MEDIUM", hp: 200, color: "#f59e0b",
    glow: "rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.08)",
    avatar: "🌲", reward: 1200, timeLimit: 240,
    problem: {
      title: "Maximum Depth of Binary Tree",
      description: "Given the root of a binary tree, return its maximum depth.",
      examples: ["Input: root=[3,9,20,null,null,15,7] → Output: 3"],
      constraints: ["0 ≤ number of nodes ≤ 10⁴", "-100 ≤ Node.val ≤ 100"],
      starter: `function maxDepth(root) {\n  // Climb the Tree Titan!\n  \n}`
    }
  },
  {
    id: 3, name: "Graph God", level: "HARD", hp: 300, color: "#ef4444",
    glow: "rgba(239,68,68,0.4)", bg: "rgba(239,68,68,0.08)",
    avatar: "🕸️", reward: 2500, timeLimit: 180,
    problem: {
      title: "Course Schedule",
      description: "Given numCourses and prerequisites, determine if you can finish all courses (detect cycle in directed graph).",
      examples: ["Input: n=2, [[1,0]] → Output: true", "Input: n=2, [[1,0],[0,1]] → Output: false"],
      constraints: ["1 ≤ n ≤ 2000"],
      starter: `function canFinish(numCourses, prerequisites) {\n  // Defeat the Graph God!\n  \n}`
    }
  }
];

const HINTS_PER_BOSS = [
  ["Try using a HashMap to store complements", "For each num, check if target-num is in the map"],
  ["Recursion works great here", "Think about what max depth means at each node"],
  ["Model as a directed graph", "Use DFS/BFS to detect a cycle", "Topological sort approach works too"]
];

function CountdownTimer({ seconds, color }: { seconds: number; color: string }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = seconds / 300;
  const isLow = seconds < 60;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle
            cx="20" cy="20" r="16" fill="none"
            stroke={isLow ? '#ef4444' : color}
            strokeWidth="3"
            strokeDasharray={`${pct * 100.5} 100.5`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${isLow ? '#ef4444' : color})` }}
          />
        </svg>
      </div>
      <div>
        <div
          className={`font-mono ${isLow ? 'pulse-animation' : ''}`}
          style={{ fontSize: '22px', fontWeight: 800, color: isLow ? '#ef4444' : 'white', lineHeight: 1 }}
        >
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <div style={{ fontSize: '9px', color: '#4a5568' }}>remaining</div>
      </div>
    </div>
  );
}

export default function BossBattle() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [selectedBoss, setSelectedBoss] = useState(0);
  const [timer, setTimer] = useState(300);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [code, setCode] = useState(BOSSES[0].problem.starter);
  const [bossHp, setBossHp] = useState(100);
  const [won, setWon] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const intervalRef = useRef<any>(null);

  const boss = BOSSES[selectedBoss];
  const hints = HINTS_PER_BOSS[selectedBoss];

  useEffect(() => {
    if (screen === "battle" && timer > 0 && !submitted) {
      intervalRef.current = setInterval(() => setTimer(t => {
        if (t <= 1) { clearInterval(intervalRef.current); setScreen("result"); setWon(false); return 0; }
        return t - 1;
      }), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [screen, submitted]);

  const startBattle = (bossIdx: number) => {
    setSelectedBoss(bossIdx);
    setCode(BOSSES[bossIdx].problem.starter);
    setTimer(BOSSES[bossIdx].timeLimit);
    setBossHp(BOSSES[bossIdx].hp);
    setScore(0);
    setHintsUsed(0);
    setShowHint(false);
    setSubmitted(false);
    setWon(false);
    setScreen("battle");
  };

  const submitCode = () => {
    clearInterval(intervalRef.current);
    setSubmitted(true);
    const timeBonus = Math.floor(timer * 2);
    const hintPenalty = hintsUsed * 100;
    const baseScore = boss.reward;
    const finalScore = Math.max(0, baseScore + timeBonus - hintPenalty);
    setScore(finalScore);
    setWon(true);
    setBossHp(0);
    setTimeout(() => setScreen("result"), 1500);
  };

  const useHint = () => {
    if (hintsUsed < hints.length) {
      setHintsUsed(h => h + 1);
      setShowHint(true);
      setBossHp(hp => Math.max(0, hp - 20));
    }
  };

  return (
    <div className="h-full" style={{ background: '#080b14' }}>
      <AnimatePresence mode="wait">
        {/* Intro Screen */}
        {screen === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden"
          >
            {/* BG effects */}
            <div className="absolute inset-0 cyber-grid-animated opacity-40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5" style={{ background: '#ff6500', filter: 'blur(80px)' }} />

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="text-center mb-12 relative"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="w-12 h-12 float-animation" style={{ color: '#ff6500', filter: 'drop-shadow(0 0 20px #ff6500)' }} />
              </div>
              <h1 className="shimmer-text mb-2" style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-1px' }}>
                BOSS BATTLE
              </h1>
              <p style={{ fontSize: '16px', color: '#6b7280' }}>
                Conquer boss-level problems. Earn epic rewards. Prove your mastery.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
              {BOSSES.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 + 0.3 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className="relative overflow-hidden rounded-2xl p-6 cursor-pointer"
                  style={{ background: b.bg, border: `1px solid ${b.color}30`, boxShadow: `0 0 30px ${b.glow}15` }}
                  onClick={() => startBattle(i)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: b.color, filter: 'blur(20px)' }} />
                  <div className="text-center mb-4">
                    <div style={{ fontSize: '48px', filter: `drop-shadow(0 0 10px ${b.glow})` }}>{b.avatar}</div>
                    <div className="text-white mt-2" style={{ fontSize: '17px', fontWeight: 800 }}>{b.name}</div>
                    <div
                      className="inline-block px-3 py-0.5 rounded-full mt-1"
                      style={{ fontSize: '10px', fontWeight: 800, background: `${b.color}20`, color: b.color, border: `1px solid ${b.color}40` }}
                    >
                      {b.level}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ fontSize: '11px', color: '#4a5568' }}>HP</span>
                      <span style={{ fontSize: '11px', color: b.color, fontWeight: 700 }}>{b.hp}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: '100%', background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                    </div>
                    <div className="flex justify-between mt-3">
                      <span style={{ fontSize: '11px', color: '#4a5568' }}>⏱ {Math.floor(b.timeLimit / 60)}:{String(b.timeLimit % 60).padStart(2,'0')}</span>
                      <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>⭐ {b.reward.toLocaleString()} XP</span>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="w-full mt-4 py-2 rounded-xl flex items-center justify-center gap-2 cyber-btn"
                    style={{
                      background: `linear-gradient(135deg, ${b.color}, ${b.color}99)`,
                      color: 'white', fontSize: '13px', fontWeight: 700,
                      boxShadow: `0 0 20px ${b.glow}30`
                    }}
                  >
                    <Swords className="w-4 h-4" />
                    Fight!
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Battle Screen */}
        {screen === "battle" && (
          <motion.div
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* Battle Header */}
            <div
              className="flex items-center justify-between px-6 py-3 flex-shrink-0"
              style={{
                background: `linear-gradient(90deg, ${boss.bg}, transparent)`,
                borderBottom: `1px solid ${boss.color}25`
              }}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl" style={{ filter: `drop-shadow(0 0 10px ${boss.glow})` }}>{boss.avatar}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white" style={{ fontSize: '16px', fontWeight: 800 }}>{boss.name}</span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ fontSize: '10px', fontWeight: 700, background: `${boss.color}20`, color: boss.color }}
                    >
                      {boss.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ fontSize: '11px', color: '#4a5568' }}>Boss HP:</span>
                    <div className="w-40 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        animate={{ width: `${bossHp}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${boss.color}, ${boss.color}aa)`, boxShadow: `0 0 8px ${boss.glow}` }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: boss.color, fontWeight: 700 }}>{bossHp}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" style={{ color: '#f59e0b' }} />
                  <span className="text-white" style={{ fontSize: '13px', fontWeight: 700 }}>{score.toLocaleString()} XP</span>
                </div>
                <CountdownTimer seconds={timer} color={boss.color} />
                <button
                  onClick={() => setScreen("intro")}
                  className="p-2 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Battle Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Problem Panel */}
              <div
                className="w-96 flex-shrink-0 p-5 overflow-y-auto"
                style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
              >
                <h2 className="text-white mb-3" style={{ fontSize: '16px', fontWeight: 800 }}>{boss.problem.title}</h2>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7, marginBottom: '12px' }}>
                  {boss.problem.description}
                </p>

                <div className="mb-4">
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ff6500', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Examples
                  </div>
                  {boss.problem.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl font-mono mb-2"
                      style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#6b7280' }}
                    >
                      {ex}
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Constraints
                  </div>
                  {boss.problem.constraints.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-1 rounded-full" style={{ background: '#4a5568' }} />
                      <span style={{ fontSize: '12px', color: '#4a5568' }}>{c}</span>
                    </div>
                  ))}
                </div>

                {/* Hint Button */}
                <button
                  onClick={useHint}
                  disabled={hintsUsed >= hints.length}
                  className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 mb-3 transition-all cyber-btn"
                  style={{
                    background: hintsUsed >= hints.length ? 'rgba(255,255,255,0.04)' : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${hintsUsed >= hints.length ? 'rgba(255,255,255,0.06)' : 'rgba(245,158,11,0.3)'}`,
                    color: hintsUsed >= hints.length ? '#4a5568' : '#f59e0b',
                    fontSize: '13px', fontWeight: 600
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Use Hint ({hints.length - hintsUsed} left, -100 XP)
                </button>

                {showHint && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-xl p-3"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginBottom: '4px' }}>
                        💡 Hint {hintsUsed}
                      </div>
                      <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
                        {hints[hintsUsed - 1]}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Editor */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language="javascript"
                    value={code}
                    onChange={v => setCode(v || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', monospace",
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      fontLigatures: true,
                    }}
                  />
                </div>
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full pulse-animation"
                      style={{ background: boss.color, boxShadow: `0 0 6px ${boss.color}` }}
                    />
                    <span style={{ fontSize: '12px', color: '#4a5568' }}>Battle in progress...</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 rounded-xl transition-all cyber-btn"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280', fontSize: '13px', fontWeight: 600 }}
                    >
                      Run Tests
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={submitCode}
                      className="px-6 py-2 rounded-xl flex items-center gap-2 cyber-btn"
                      style={{
                        background: `linear-gradient(135deg, ${boss.color}, ${boss.color}aa)`,
                        color: 'white', fontSize: '13px', fontWeight: 700,
                        boxShadow: `0 0 20px ${boss.glow}30`
                      }}
                    >
                      <Swords className="w-4 h-4" />
                      Submit & Attack!
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Result Screen */}
        {screen === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex items-center justify-center p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0" style={{ background: won ? 'radial-gradient(circle at center, rgba(34,197,94,0.08), transparent)' : 'radial-gradient(circle at center, rgba(239,68,68,0.08), transparent)' }} />

            <div className="text-center max-w-lg relative">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: 'spring', stiffness: 200 }}
                style={{ fontSize: '80px', marginBottom: '16px', display: 'block', filter: `drop-shadow(0 0 30px ${won ? '#22c55e' : '#ef4444'})` }}
              >
                {won ? '🏆' : '💀'}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: '40px', fontWeight: 900,
                  color: won ? '#22c55e' : '#ef4444',
                  textShadow: `0 0 30px ${won ? '#22c55e' : '#ef4444'}`,
                  marginBottom: '8px'
                }}
              >
                {won ? 'VICTORY!' : 'DEFEATED!'}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}
              >
                {won ? `You defeated ${boss.name}!` : `${boss.name} was too powerful this time!`}
              </motion.p>

              {won && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-3 gap-4 mb-8"
                >
                  {[
                    { label: "XP Earned", value: `+${score.toLocaleString()}`, color: '#f59e0b', icon: '⭐' },
                    { label: "Time Left", value: `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`, color: '#00d4ff', icon: '⏱' },
                    { label: "Hints Used", value: hintsUsed, color: '#a855f7', icon: '💡' },
                  ].map(({ label, value, color, icon }) => (
                    <div
                      key={label}
                      className="rounded-2xl p-4"
                      style={{ background: `${color}10`, border: `1px solid ${color}25` }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: '11px', color: '#4a5568' }}>{label}</div>
                    </div>
                  ))}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex gap-4 justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startBattle(selectedBoss)}
                  className="px-6 py-3 rounded-xl flex items-center gap-2 cyber-btn"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', fontSize: '14px', fontWeight: 700
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setScreen("intro")}
                  className="px-6 py-3 rounded-xl flex items-center gap-2 cyber-btn"
                  style={{
                    background: 'linear-gradient(135deg, #ff6500, #ff9500)',
                    color: 'white', fontSize: '14px', fontWeight: 700,
                    boxShadow: '0 0 20px rgba(255,101,0,0.4)'
                  }}
                >
                  <Swords className="w-4 h-4" />
                  Choose Boss
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

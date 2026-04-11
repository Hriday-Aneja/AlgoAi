import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shuffle, CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, Zap, Brain } from "lucide-react";

const CHALLENGES = [
  {
    id: 1,
    code: `function solve(arr) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
  return arr;
}`,
    question: "What does this code do?",
    options: [
      "Sorts an array in ascending order",
      "Reverses an array in-place",
      "Finds the maximum element",
      "Rotates array by one position"
    ],
    answer: 1,
    explanation: "This is the classic two-pointer technique to reverse an array in-place. Left and right pointers swap elements and move toward each other until they meet.",
    topic: "Two Pointers",
    difficulty: "Easy",
    color: "#22c55e"
  },
  {
    id: 2,
    code: `function solve(root) {
  if (!root) return 0;
  const left = solve(root.left);
  const right = solve(root.right);
  return Math.max(left, right) + 1;
}`,
    question: "What problem does this solve?",
    options: [
      "Count nodes in binary tree",
      "Find minimum depth of tree",
      "Find maximum depth of binary tree",
      "Check if tree is balanced"
    ],
    answer: 2,
    explanation: "This recursively finds the maximum depth. At each node, it takes the max depth of left and right subtrees and adds 1 for the current node. Base case: null node returns 0.",
    topic: "Binary Trees",
    difficulty: "Easy",
    color: "#22c55e"
  },
  {
    id: 3,
    code: `function solve(s) {
  const map = new Map();
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right])) left = Math.max(left, map.get(s[right]) + 1);
    map.set(s[right], right);
    max = Math.max(max, right - left + 1);
  }
  return max;
}`,
    question: "What problem is this solving?",
    options: [
      "Find all duplicate characters in string",
      "Count character frequencies",
      "Longest substring without repeating characters",
      "Check if string is a palindrome"
    ],
    answer: 2,
    explanation: "This uses the sliding window technique with a HashMap. The window [left, right] maintains no duplicate characters. When a duplicate is found, left pointer jumps past the previous occurrence.",
    topic: "Sliding Window",
    difficulty: "Medium",
    color: "#f59e0b"
  },
  {
    id: 4,
    code: `function solve(nums) {
  const dp = new Array(nums.length).fill(1);
  let max = 1;
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    max = Math.max(max, dp[i]);
  }
  return max;
}`,
    question: "What classic DP problem is this?",
    options: [
      "Maximum Subarray (Kadane's)",
      "Longest Increasing Subsequence",
      "Coin Change problem",
      "0/1 Knapsack"
    ],
    answer: 1,
    explanation: "This is the O(n²) Longest Increasing Subsequence (LIS) solution. dp[i] stores the length of LIS ending at index i. For each i, it looks at all previous elements smaller than nums[i] and extends their LIS.",
    topic: "Dynamic Programming",
    difficulty: "Medium",
    color: "#f59e0b"
  },
  {
    id: 5,
    code: `function solve(graph, start) {
  const visited = new Set();
  const queue = [start];
  visited.add(start);
  while (queue.length) {
    const node = queue.shift();
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited.size;
}`,
    question: "What algorithm is implemented here?",
    options: [
      "Depth-First Search (DFS)",
      "Dijkstra's Shortest Path",
      "Breadth-First Search (BFS)",
      "Bellman-Ford Algorithm"
    ],
    answer: 2,
    explanation: "This is BFS (Breadth-First Search) using a queue. It explores nodes level by level, marking visited nodes to avoid cycles. Returns the count of reachable nodes from start.",
    topic: "Graph BFS",
    difficulty: "Hard",
    color: "#ef4444"
  }
];

export default function ReverseMode() {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const challenge = CHALLENGES[currentQ];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    const correct = idx === challenge.answer;
    if (correct) setScore(s => s + 1);
    setAnswers(a => [...a, correct]);
  };

  const next = () => {
    if (currentQ >= CHALLENGES.length - 1) {
      setFinished(true);
    } else {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  const reset = () => {
    setCurrentQ(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / CHALLENGES.length) * 100);
    return (
      <div className="h-full flex items-center justify-center p-8" style={{ background: '#080b14' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            style={{ fontSize: '80px', marginBottom: '16px' }}
          >
            {pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📚'}
          </motion.div>
          <h1 className="text-white mb-2" style={{ fontSize: '32px', fontWeight: 900 }}>
            Quiz Complete!
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
            You scored <span style={{ color: '#ff6500', fontWeight: 800 }}>{score}/{CHALLENGES.length}</span> ({pct}%)
          </p>

          <div className="grid grid-cols-5 gap-2 mb-8">
            {answers.map((correct, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{
                  background: correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${correct ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                }}
              >
                {correct
                  ? <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
                  : <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
                }
              </motion.div>
            ))}
          </div>

          <div
            className="p-4 rounded-2xl mb-6"
            style={{
              background: pct >= 80 ? 'rgba(34,197,94,0.08)' : pct >= 60 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${pct >= 80 ? 'rgba(34,197,94,0.2)' : pct >= 60 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`
            }}
          >
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
              {pct >= 80
                ? '🌟 Excellent! You have strong pattern recognition skills!'
                : pct >= 60
                ? '💪 Good job! Keep practicing to improve pattern recognition.'
                : '📖 Keep studying! Focus on understanding algorithm patterns.'
              }
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="px-8 py-3 rounded-xl flex items-center gap-2 mx-auto cyber-btn"
            style={{
              background: 'linear-gradient(135deg, #ff6500, #ff9500)',
              color: 'white', fontSize: '14px', fontWeight: 700,
              boxShadow: '0 0 20px rgba(255,101,0,0.4)'
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 0 20px rgba(168,85,247,0.1)' }}
          >
            <Shuffle className="w-5 h-5" style={{ color: '#a855f7' }} />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: '20px', fontWeight: 800 }}>Reverse Problem Mode</h1>
            <p style={{ fontSize: '12px', color: '#4a5568' }}>See code → Identify the problem & pattern</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <Trophy className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{score}/{CHALLENGES.length}</span>
          </div>
          <div className="flex gap-1">
            {CHALLENGES.map((_, i) => (
              <div
                key={i}
                className="w-8 h-1.5 rounded-full transition-all"
                style={{
                  background: i < answers.length
                    ? answers[i] ? '#22c55e' : '#ef4444'
                    : i === currentQ
                    ? '#ff6500'
                    : 'rgba(255,255,255,0.08)',
                  boxShadow: i === currentQ ? '0 0 8px rgba(255,101,0,0.6)' : 'none'
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          {/* Topic & Difficulty */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-full"
              style={{
                fontSize: '11px', fontWeight: 700,
                background: `${challenge.color}15`,
                color: challenge.color,
                border: `1px solid ${challenge.color}30`
              }}
            >
              {challenge.difficulty}
            </span>
            <span
              className="px-3 py-1 rounded-full"
              style={{
                fontSize: '11px', fontWeight: 600,
                background: 'rgba(168,85,247,0.1)',
                color: '#a855f7',
                border: '1px solid rgba(168,85,247,0.2)'
              }}
            >
              <Brain className="w-3 h-3 inline mr-1" />
              {challenge.topic}
            </span>
            <span style={{ fontSize: '12px', color: '#4a5568', marginLeft: 'auto' }}>
              Question {currentQ + 1} of {CHALLENGES.length}
            </span>
          </div>

          {/* Code Block */}
          <div
            className="rounded-2xl overflow-hidden mb-6"
            style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
                <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
              <span style={{ fontSize: '12px', color: '#4a5568', marginLeft: '8px', fontFamily: 'monospace' }}>
                mystery-code.js
              </span>
            </div>
            <pre
              className="p-5 overflow-x-auto"
              style={{
                background: '#0d1117',
                fontSize: '13px',
                lineHeight: 1.8,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#e6edf3'
              }}
            >
              {challenge.code.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span style={{ color: '#4a5568', width: '24px', flexShrink: 0, userSelect: 'none' }}>{i + 1}</span>
                  <span>{line.replace(/function|const|let|var|return|if|for|while|new|true|false/g, (w) =>
                    `\x1b[keyword]${w}\x1b[/]`
                  )}</span>
                </div>
              ))}
            </pre>
          </div>

          {/* Question */}
          <div className="mb-5">
            <h2 className="text-white mb-4" style={{ fontSize: '18px', fontWeight: 700 }}>
              🤔 {challenge.question}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {challenge.options.map((opt, idx) => {
                let bg = 'rgba(255,255,255,0.04)';
                let border = 'rgba(255,255,255,0.08)';
                let color = '#6b7280';
                let shadow = 'none';

                if (showResult) {
                  if (idx === challenge.answer) {
                    bg = 'rgba(34,197,94,0.12)';
                    border = 'rgba(34,197,94,0.4)';
                    color = '#22c55e';
                    shadow = '0 0 20px rgba(34,197,94,0.15)';
                  } else if (idx === selected && idx !== challenge.answer) {
                    bg = 'rgba(239,68,68,0.12)';
                    border = 'rgba(239,68,68,0.4)';
                    color = '#ef4444';
                    shadow = '0 0 20px rgba(239,68,68,0.15)';
                  }
                } else if (selected === null) {
                  // Hover styles handled inline
                }

                return (
                  <motion.button
                    key={idx}
                    whileHover={selected === null ? { scale: 1.02, x: 4 } : {}}
                    whileTap={selected === null ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(idx)}
                    disabled={selected !== null}
                    className="p-4 rounded-xl text-left transition-all flex items-center gap-3"
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                      color,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: selected !== null ? 'default' : 'pointer',
                      boxShadow: shadow,
                      textAlign: 'left'
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: showResult && idx === challenge.answer ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                        fontSize: '12px', fontWeight: 800, color
                      }}
                    >
                      {showResult && idx === challenge.answer
                        ? <CheckCircle2 className="w-4 h-4" />
                        : showResult && idx === selected && idx !== challenge.answer
                        ? <XCircle className="w-4 h-4" />
                        : String.fromCharCode(65 + idx)
                      }
                    </div>
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl p-5 mb-4"
                style={{
                  background: selected === challenge.answer ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${selected === challenge.answer ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {selected === challenge.answer
                    ? <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
                    : <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
                  }
                  <span style={{ fontSize: '14px', fontWeight: 700, color: selected === challenge.answer ? '#22c55e' : '#ef4444' }}>
                    {selected === challenge.answer ? 'Correct! 🎉' : 'Not quite...'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7 }}>
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>💡 Explanation: </span>
                  {challenge.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Button */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={next}
                className="px-6 py-3 rounded-xl flex items-center gap-2 cyber-btn"
                style={{
                  background: 'linear-gradient(135deg, #ff6500, #ff9500)',
                  color: 'white', fontSize: '14px', fontWeight: 700,
                  boxShadow: '0 0 20px rgba(255,101,0,0.4)'
                }}
              >
                {currentQ >= CHALLENGES.length - 1 ? 'See Results' : 'Next Challenge'}
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle, TrendingUp, TrendingDown, Target, Brain,
  Zap, CheckCircle2, XCircle, Clock, BarChart2, Lightbulb, RefreshCw
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Cell
} from "recharts";

const mistakeCategories = [
  {
    id: 1,
    title: "Edge Case Failures",
    icon: "🎯",
    count: 23,
    severity: "high",
    color: "#ef4444",
    desc: "Missing null, empty array, negative numbers",
    examples: ["Not handling empty array in sliding window", "Forgetting n=0 base case in recursion", "Integer overflow in large inputs"],
    improvement: "+12% this week",
    trend: "down"
  },
  {
    id: 2,
    title: "Off-by-One Errors",
    icon: "🔢",
    count: 18,
    severity: "high",
    color: "#f59e0b",
    desc: "Boundary conditions in loops and arrays",
    examples: ["Using < instead of <=", "Wrong loop termination condition", "Incorrect pointer initialization"],
    improvement: "-5% this week",
    trend: "up"
  },
  {
    id: 3,
    title: "Recursion Base Cases",
    icon: "🔄",
    count: 14,
    severity: "medium",
    color: "#a855f7",
    desc: "Missing or wrong base cases",
    examples: ["Stack overflow due to missing base", "Wrong return value at base case", "Not handling n=1 case"],
    improvement: "+3% this week",
    trend: "down"
  },
  {
    id: 4,
    title: "Time Complexity",
    icon: "⚡",
    count: 11,
    severity: "medium",
    color: "#00d4ff",
    desc: "Inefficient approaches used",
    examples: ["Using O(n²) when O(n log n) works", "Recomputing values without memoization", "Unnecessary nested loops"],
    improvement: "+7% this week",
    trend: "down"
  },
  {
    id: 5,
    title: "DP State Definition",
    icon: "🧩",
    count: 9,
    severity: "low",
    color: "#22c55e",
    desc: "Incorrect state transitions",
    examples: ["Wrong dp array dimensions", "Missing state dimension", "Incorrect transition formula"],
    improvement: "+15% this week",
    trend: "down"
  },
  {
    id: 6,
    title: "Graph Traversal",
    icon: "🌐",
    count: 7,
    severity: "low",
    color: "#ec4899",
    desc: "Incorrect visited tracking",
    examples: ["Not resetting visited in DFS", "BFS queue initialization error", "Cycle detection mistakes"],
    improvement: "+20% this week",
    trend: "down"
  }
];

const weeklyMistakes = [
  { week: "W1", edge: 8, offBy1: 6, recursion: 4, other: 5 },
  { week: "W2", edge: 7, offBy1: 7, recursion: 5, other: 4 },
  { week: "W3", edge: 6, offBy1: 5, recursion: 3, other: 6 },
  { week: "W4", edge: 5, offBy1: 4, recursion: 2, other: 3 },
  { week: "W5", edge: 3, offBy1: 4, recursion: 2, other: 2 },
  { week: "W6", edge: 2, offBy1: 3, recursion: 2, other: 1 },
];

const radarData = [
  { subject: "Arrays", A: 72 },
  { subject: "Trees", A: 45 },
  { subject: "Graphs", A: 38 },
  { subject: "DP", A: 55 },
  { subject: "Strings", A: 80 },
  { subject: "Recursion", A: 42 },
];

const improvements = [
  { title: "Practice edge cases first", desc: "Always test with empty input, single element, and maximum constraints", priority: "High", icon: "🛡️" },
  { title: "Write base cases first", desc: "In recursion, write ALL base cases before implementing recursive logic", priority: "High", icon: "🔄" },
  { title: "Dry run with examples", desc: "Manually trace through your code with the given examples before submitting", priority: "Medium", icon: "✏️" },
  { title: "Use integer bounds", desc: "Check for integer overflow when dealing with large numbers", priority: "Medium", icon: "⚠️" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3 shadow-xl" style={{ background: '#0f1628', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}>
        <p className="text-white mb-2" style={{ fontWeight: 700 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MistakePatterns() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(1);
  const [view, setView] = useState<"overview" | "details" | "trends">("overview");

  const selectedMistake = mistakeCategories.find(m => m.id === selectedCategory);
  const totalMistakes = mistakeCategories.reduce((sum, m) => sum + m.count, 0);
  const highSeverity = mistakeCategories.filter(m => m.severity === "high").reduce((s, m) => s + m.count, 0);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 20px rgba(245,158,11,0.1)' }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: '20px', fontWeight: 800 }}>Mistake Pattern Detector</h1>
            <p style={{ fontSize: '12px', color: '#4a5568' }}>AI-powered analysis of your recurring mistakes</p>
          </div>
        </div>
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {(['overview', 'details', 'trends'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-2 capitalize transition-all"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                background: view === v ? 'rgba(245,158,11,0.15)' : 'transparent',
                color: view === v ? '#f59e0b' : '#4a5568',
                borderBottom: view === v ? '2px solid #f59e0b' : '2px solid transparent'
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Mistakes Tracked", value: totalMistakes, icon: XCircle, color: "#ef4444", sub: "Last 30 days" },
          { label: "High Severity", value: highSeverity, icon: AlertTriangle, color: "#f59e0b", sub: "Need immediate attention" },
          { label: "Patterns Identified", value: 6, icon: Brain, color: "#a855f7", sub: "Unique mistake types" },
          { label: "Improvement Rate", value: "↑28%", icon: TrendingUp, color: "#22c55e", sub: "vs last month", isString: true },
        ].map(({ label, value, icon: Icon, color, sub, isString }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-4"
            style={{
              background: `linear-gradient(135deg, ${color}10, transparent)`,
              border: `1px solid ${color}20`
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span style={{ fontSize: '10px', color: '#4a5568', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color }}>{isString ? value : value}</div>
            <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '2px' }}>{sub}</div>
          </motion.div>
        ))}
      </div>

      {view === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Mistake Categories */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>Weak Areas Breakdown</h3>
            <div className="space-y-3">
              {mistakeCategories.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedCategory(m.id === selectedCategory ? null : m.id)}
                  className="p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: selectedCategory === m.id ? `${m.color}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedCategory === m.id ? m.color + '30' : 'rgba(255,255,255,0.05)'}`,
                  }}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '16px' }}>{m.icon}</span>
                      <div>
                        <div className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>{m.title}</div>
                        <div style={{ fontSize: '10px', color: '#4a5568' }}>{m.desc}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div style={{ fontSize: '18px', fontWeight: 800, color: m.color }}>{m.count}</div>
                      <div style={{ fontSize: '9px', color: m.trend === 'down' ? '#22c55e' : '#ef4444' }}>
                        {m.trend === 'down' ? '↓' : '↑'} {m.improvement}
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.count / totalMistakes) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: m.color, boxShadow: `0 0 8px ${m.color}60` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detail Panel + Radar */}
          <div className="space-y-4">
            {/* Radar Chart */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 className="text-white mb-2" style={{ fontSize: '14px', fontWeight: 700 }}>Topic Accuracy Radar</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Radar name="Accuracy" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Selected Category Detail */}
            {selectedMistake && (
              <motion.div
                key={selectedMistake.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5"
                style={{
                  background: `linear-gradient(135deg, ${selectedMistake.color}08, transparent)`,
                  border: `1px solid ${selectedMistake.color}25`
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '20px' }}>{selectedMistake.icon}</span>
                  <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>{selectedMistake.title}</h3>
                  <span
                    className="ml-auto px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: '10px', fontWeight: 700,
                      background: `${selectedMistake.color}20`,
                      color: selectedMistake.color,
                      border: `1px solid ${selectedMistake.color}30`
                    }}
                  >
                    {selectedMistake.severity.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {selectedMistake.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{ex}</span>
                    </div>
                  ))}
                </div>
                <div
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}
                >
                  <TrendingUp className="w-4 h-4" style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>{selectedMistake.improvement}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {view === "trends" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>Mistake Trend (6 Weeks)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyMistakes} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="edge" name="Edge Cases" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="offBy1" name="Off-by-one" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recursion" name="Recursion" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="other" name="Other" fill="#4a5568" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>AI Suggestions</h3>
            <div className="space-y-3">
              {improvements.map((imp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: '16px' }}>{imp.icon}</span>
                    <span className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>{imp.title}</span>
                    <span
                      className="ml-auto px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        fontSize: '9px', fontWeight: 700,
                        background: imp.priority === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: imp.priority === 'High' ? '#ef4444' : '#f59e0b',
                        border: `1px solid ${imp.priority === 'High' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
                      }}
                    >
                      {imp.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#4a5568', lineHeight: 1.5 }}>{imp.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "details" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mistakeCategories.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${m.color}10, transparent)`,
                border: `1px solid ${m.color}25`
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10" style={{ background: m.color, filter: 'blur(20px)' }} />
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: '24px' }}>{m.icon}</span>
                <div>
                  <div className="text-white" style={{ fontSize: '13px', fontWeight: 700 }}>{m.title}</div>
                  <div style={{ fontSize: '10px', color: '#4a5568' }}>{m.severity} severity</div>
                </div>
              </div>
              <div className="mb-3" style={{ fontSize: '36px', fontWeight: 900, color: m.color }}>
                {m.count}
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#4a5568', marginLeft: '4px' }}>mistakes</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.count / totalMistakes) * 100}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: m.color, boxShadow: `0 0 8px ${m.color}60` }}
                />
              </div>
              <div className="space-y-1">
                {m.examples.slice(0, 2).map((ex, j) => (
                  <div key={j} className="flex items-start gap-1.5">
                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: m.color }} />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{ex}</span>
                  </div>
                ))}
              </div>
              <div
                className="mt-3 px-2 py-1 rounded-lg inline-flex items-center gap-1"
                style={{
                  background: m.trend === 'down' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${m.trend === 'down' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}
              >
                {m.trend === 'down' ? <TrendingDown className="w-3 h-3" style={{ color: '#22c55e' }} /> : <TrendingUp className="w-3 h-3" style={{ color: '#ef4444' }} />}
                <span style={{ fontSize: '10px', fontWeight: 600, color: m.trend === 'down' ? '#22c55e' : '#ef4444' }}>
                  {m.improvement}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

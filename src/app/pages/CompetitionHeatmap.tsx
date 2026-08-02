import { useState } from "react";
import { motion } from "motion/react";
import {
  Activity, Zap, Target, Users, Trophy, TrendingUp,
  Clock, CheckCircle2, XCircle, BarChart2, AlertTriangle
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";

// Generate heatmap data
const generateHeatmap = () => {
  const weeks = 16;
  const data = [];
  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const base = Math.random();
      const submissions = Math.floor(base * 150);
      const accuracy = Math.floor(40 + base * 55);
      const speed = Math.floor(20 + base * 80);
      week.push({ submissions, accuracy, speed });
    }
    data.push(week);
  }
  return data;
};

const heatmapData = generateHeatmap();

const speedAccuracyData = Array.from({ length: 30 }, (_, i) => ({
  speed: Math.floor(20 + Math.random() * 80),
  accuracy: Math.floor(40 + Math.random() * 55),
  size: Math.floor(3 + Math.random() * 8),
  name: `Attempt ${i + 1}`
}));

// Your position
const myPosition = { speed: 72, accuracy: 85, size: 10 };

const commonMistakes = [
  { mistake: "Off-by-one errors", count: 34, color: "#ef4444" },
  { mistake: "Edge case: null input", count: 28, color: "#f59e0b" },
  { mistake: "Infinite loop risk", count: 22, color: "#a855f7" },
  { mistake: "Integer overflow", count: 18, color: "#00d4ff" },
  { mistake: "Wrong base case", count: 15, color: "#22c55e" },
  { mistake: "Missing return", count: 12, color: "#ec4899" },
];

const submissionTimeline = [
  { time: "9AM", mine: 2, avg: 1.2 },
  { time: "10AM", mine: 5, avg: 3.1 },
  { time: "11AM", mine: 3, avg: 4.2 },
  { time: "12PM", mine: 1, avg: 2.8 },
  { time: "2PM", mine: 4, avg: 3.5 },
  { time: "4PM", mine: 7, avg: 4.1 },
  { time: "6PM", mine: 3, avg: 2.9 },
  { time: "8PM", mine: 5, avg: 3.8 },
  { time: "10PM", mine: 2, avg: 1.5 },
];

const leaderboard = [
  { rank: 1, name: "AlgoMaster99", solved: 12, speed: "avg 8min", accuracy: "97%", badge: "🥇" },
  { rank: 2, name: "CodeNinja_X", solved: 11, speed: "avg 9min", accuracy: "95%", badge: "🥈" },
  { rank: 3, name: "You", solved: 10, speed: "avg 12min", accuracy: "90%", badge: "🥉", isYou: true },
  { rank: 4, name: "DSA_God", solved: 9, speed: "avg 11min", accuracy: "88%", badge: "4️⃣" },
  { rank: 5, name: "ByteWiz", solved: 8, speed: "avg 14min", accuracy: "85%", badge: "5️⃣" },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-xl p-3 shadow-xl" style={{ background: '#0f1628', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}>
        <p className="text-white" style={{ fontWeight: 700 }}>{d.name || 'You'}</p>
        <p style={{ color: '#00d4ff' }}>Speed: {d.speed} pts</p>
        <p style={{ color: '#22c55e' }}>Accuracy: {d.accuracy}%</p>
      </div>
    );
  }
  return null;
};

export default function CompetitionHeatmap() {
  const [heatView, setHeatView] = useState<"submissions" | "accuracy" | "speed">("submissions");
  const [activeTab, setActiveTab] = useState<"heatmap" | "competition" | "mistakes">("heatmap");

  const getCellColor = (cell: { submissions: number; accuracy: number; speed: number }) => {
    if (heatView === "submissions") {
      const v = cell.submissions;
      if (v === 0) return 'rgba(255,255,255,0.04)';
      if (v < 30) return 'rgba(255,101,0,0.2)';
      if (v < 80) return 'rgba(255,101,0,0.5)';
      return '#ff6500';
    } else if (heatView === "accuracy") {
      const v = cell.accuracy;
      if (v < 50) return '#ef4444';
      if (v < 70) return '#f59e0b';
      return '#22c55e';
    } else {
      const v = cell.speed;
      if (v < 40) return 'rgba(0,212,255,0.2)';
      if (v < 70) return 'rgba(0,212,255,0.5)';
      return '#00d4ff';
    }
  };

  const getCellGlow = (cell: { submissions: number; accuracy: number; speed: number }) => {
    const color = getCellColor(cell);
    if (color.includes('rgba') && color.includes('0.04')) return 'none';
    return `0 0 6px ${color}80`;
  };

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
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}
          >
            <Activity className="w-5 h-5" style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: '20px', fontWeight: 800 }}>Live Competition Heatmap</h1>
            <p style={{ fontSize: '12px', color: '#4a5568' }}>Real-time performance benchmarking against the community</p>
          </div>
        </div>

        {/* Live indicator */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <div className="w-2 h-2 rounded-full pulse-animation" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 700 }}>LIVE</span>
          <span style={{ fontSize: '12px', color: '#4a5568' }}>2,847 active</span>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Your Rank Today", value: "#3", icon: Trophy, color: "#f59e0b" },
          { label: "Submissions Today", value: "10", icon: CheckCircle2, color: "#22c55e" },
          { label: "Avg Speed", value: "12 min", icon: Clock, color: "#00d4ff" },
          { label: "Accuracy", value: "90%", icon: Target, color: "#a855f7" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-4"
            style={{ background: `${color}10`, border: `1px solid ${color}20` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span style={{ fontSize: '10px', color: '#4a5568' }}>{label}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color }}>{value}</div>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div
        className="flex rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'inline-flex' }}
      >
        {([['heatmap', 'Activity Heatmap'], ['competition', 'Speed vs Accuracy'], ['mistakes', 'Common Mistakes']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2.5 transition-all"
            style={{
              fontSize: '12px', fontWeight: 600,
              background: activeTab === tab ? 'rgba(0,212,255,0.15)' : 'transparent',
              color: activeTab === tab ? '#00d4ff' : '#4a5568',
              borderBottom: activeTab === tab ? '2px solid #00d4ff' : '2px solid transparent'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "heatmap" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Heatmap */}
          <div
            className="lg:col-span-2 rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>
                Submission Heatmap — Community
              </h3>
              <div className="flex gap-2">
                {(['submissions', 'accuracy', 'speed'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setHeatView(v)}
                    className="px-2 py-1 rounded-lg capitalize transition-all"
                    style={{
                      fontSize: '10px', fontWeight: 600,
                      background: heatView === v ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                      color: heatView === v ? '#00d4ff' : '#4a5568',
                      border: `1px solid ${heatView === v ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Days header */}
            <div className="flex gap-1 mb-1 ml-6">
              {days.map(d => (
                <div key={d} className="flex-1 text-center" style={{ fontSize: '9px', color: '#4a5568' }}>{d}</div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto">
              <div className="flex gap-1" style={{ minWidth: '500px' }}>
                <div className="flex flex-col justify-between mr-2" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                  {Array.from({ length: 16 }, (_, i) => (
                    <div key={i} style={{ fontSize: '9px', color: '#4a5568', height: '12px', display: 'flex', alignItems: 'center' }}>
                      {i % 4 === 0 ? `W${i + 1}` : ''}
                    </div>
                  ))}
                </div>
                {days.map((day, di) => (
                  <div key={di} className="flex-1 flex flex-col gap-1">
                    {heatmapData.map((week, wi) => {
                      const cell = week[di];
                      return (
                        <motion.div
                          key={wi}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (wi * 7 + di) * 0.003 }}
                          className="rounded-sm cursor-pointer transition-all"
                          style={{
                            height: '12px',
                            background: getCellColor(cell),
                            boxShadow: getCellGlow(cell)
                          }}
                          whileHover={{ scale: 1.5 }}
                          title={heatView === 'submissions' ? `${cell.submissions} submissions` : heatView === 'accuracy' ? `${cell.accuracy}% accuracy` : `Speed: ${cell.speed}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4">
              <span style={{ fontSize: '10px', color: '#4a5568' }}>Less</span>
              {[0.1, 0.3, 0.6, 1].map(o => (
                <div
                  key={o}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    background: heatView === 'submissions' ? `rgba(255,101,0,${o})` :
                      heatView === 'accuracy' ? (o < 0.3 ? '#ef4444' : o < 0.6 ? '#f59e0b' : '#22c55e') :
                      `rgba(0,212,255,${o})`
                  }}
                />
              ))}
              <span style={{ fontSize: '10px', color: '#4a5568' }}>More</span>
            </div>
          </div>

          {/* Leaderboard */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>
              🏆 Today's Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboard.map((user, i) => (
                <motion.div
                  key={user.rank}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: user.isYou ? 'rgba(255,101,0,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${user.isYou ? 'rgba(255,101,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: user.isYou ? '0 0 15px rgba(255,101,0,0.1)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '16px', width: '24px', textAlign: 'center' }}>{user.badge}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="truncate"
                      style={{
                        fontSize: '13px', fontWeight: user.isYou ? 800 : 600,
                        color: user.isYou ? '#ff6500' : 'white'
                      }}
                    >
                      {user.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#4a5568' }}>
                      {user.speed} · {user.accuracy} acc
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#22c55e' }}>{user.solved}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "competition" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Speed vs Accuracy Scatter */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>
              Speed vs Accuracy Distribution
            </h3>
            <p style={{ fontSize: '12px', color: '#4a5568', marginBottom: '12px' }}>
              Each dot = one community member. <span style={{ color: '#ff6500' }}>Orange = You</span>
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="speed" name="Speed" type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false}
                  label={{ value: 'Speed Score →', position: 'insideBottom', fill: '#4a5568', fontSize: 11, dy: 12 }}
                />
                <YAxis
                  dataKey="accuracy" name="Accuracy" type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false}
                  label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#4a5568', fontSize: 11 }}
                />
                <Tooltip content={<CustomScatterTooltip />} />
                <Scatter
                  name="Community"
                  data={speedAccuracyData}
                  fill="rgba(0,212,255,0.4)"
                />
                <Scatter
                  name="You"
                  data={[myPosition]}
                  fill="#ff6500"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    return (
                      <circle
                        cx={cx} cy={cy} r={8}
                        fill="#ff6500"
                        stroke="rgba(255,101,0,0.5)"
                        strokeWidth={3}
                        style={{ filter: 'drop-shadow(0 0 6px rgba(255,101,0,0.8))' }}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Submission Timeline */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>
              Submission Timeline (You vs Community)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={submissionTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                <Line type="monotone" dataKey="mine" stroke="#ff6500" strokeWidth={2} dot={{ fill: '#ff6500', r: 3 }} name="You" />
                <Line type="monotone" dataKey="avg" stroke="rgba(0,212,255,0.6)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Community Avg" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "mistakes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>
              Most Common Mistakes on This Problem
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={commonMistakes} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
                <YAxis type="category" dataKey="mistake" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} width={140} />
                <Tooltip
                  contentStyle={{ background: '#0f1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Count">
                  {commonMistakes.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>
              You vs Community — Mistake Breakdown
            </h3>
            <div className="space-y-3">
              {commonMistakes.map((m, i) => (
                <motion.div
                  key={m.mistake}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl"
                  style={{ background: `${m.color}08`, border: `1px solid ${m.color}20` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{m.mistake}</span>
                    <span style={{ fontSize: '12px', color: m.color, fontWeight: 700 }}>{m.count} users</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.count / 34) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: m.color, boxShadow: `0 0 6px ${m.color}60` }}
                    />
                  </div>
                  {i < 2 && (
                    <div
                      className="mt-2 flex items-center gap-1"
                      style={{ fontSize: '10px', color: '#ef4444' }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      You've made this mistake before
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

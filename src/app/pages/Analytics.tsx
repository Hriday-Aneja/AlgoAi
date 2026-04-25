import { useNavigate } from "react-router-dom";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line
} from "recharts";
import { TrendingUp, TrendingDown, Target, ArrowRight, AlertCircle } from "lucide-react";
import { topicStrengths, userStats } from "../data/mockData";
import { useUserProgress } from "../contexts/UserProgressContext";

const weeklyData = [
  { week: "W1", solved: 8 },
  { week: "W2", solved: 12 },
  { week: "W3", solved: 5 },
  { week: "W4", solved: 15 },
  { week: "W5", solved: 10 },
  { week: "W6", solved: 18 },
  { week: "W7", solved: 7 },
  { week: "W8", solved: 22 },
];

const submissionData = [
  { name: "Accepted", value: 87, fill: "#22c55e" },
  { name: "Wrong Answer", value: 45, fill: "#ef4444" },
  { name: "TLE", value: 18, fill: "#eab308" },
  { name: "MLE", value: 8, fill: "#8b5cf6" },
];

export default function Analytics() {
  const navigate = useNavigate();
  const { progress } = useUserProgress();
  const radarData = topicStrengths.map(t => ({ subject: t.topic, strength: t.strength }));

  const strongTopics = topicStrengths.filter(t => t.strength >= 70).sort((a, b) => b.strength - a.strength);
  const weakTopics = topicStrengths.filter(t => t.strength < 50).sort((a, b) => a.strength - b.strength);

  // Use real user data when available
  const displayTotalSolved = progress?.questionsSolved || userStats.totalSolved;
  const displayEasySolved = progress?.topicStrengths?.['Arrays'] ? Math.round((progress.topicStrengths['Arrays'] / 100) * 50) : userStats.easy;
  const displayMediumSolved = progress?.topicStrengths?.['Dynamic Programming'] ? Math.round((progress.topicStrengths['Dynamic Programming'] / 100) * 30) : userStats.medium;
  const displayHardSolved = progress?.topicStrengths?.['Graphs'] ? Math.round((progress.topicStrengths['Graphs'] / 100) * 10) : userStats.hard;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white mb-1" style={{ fontSize: '22px', fontWeight: 700 }}>Topic Strength Analyzer</h1>
        <p className="text-[#8b949e]" style={{ fontSize: '14px' }}>Know your strengths, conquer your weaknesses.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Solved", value: displayTotalSolved, sub: "problems", color: "text-orange-400" },
          { label: "Easy Solved", value: displayEasySolved, sub: `/ ${Math.round(displayEasySolved * 1.8)} available`, color: "text-green-400" },
          { label: "Medium Solved", value: displayMediumSolved, sub: `/ ${Math.round(displayMediumSolved * 2.3)} available`, color: "text-yellow-400" },
          { label: "Hard Solved", value: displayHardSolved, sub: `/ ${Math.round(displayHardSolved * 5)} available`, color: "text-red-400" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className={`${color} mb-1`} style={{ fontSize: '28px', fontWeight: 800 }}>{value}</div>
            <div className="text-white" style={{ fontSize: '12px', fontWeight: 600 }}>{label}</div>
            <div className="text-[#8b949e]" style={{ fontSize: '10px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Radar Chart */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <h3 className="text-white mb-4" style={{ fontSize: '15px', fontWeight: 600 }}>Topic Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData.slice(0, 8)}>
              <PolarGrid stroke="#30363d" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#8b949e", fontSize: 11 }} />
              <Radar name="Strength" dataKey="strength" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Activity */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <h3 className="text-white mb-4" style={{ fontSize: '15px', fontWeight: 600 }}>Weekly Solved</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="week" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#21262d", border: "1px solid #30363d", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
              <Line type="monotone" dataKey="solved" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic Bar Chart */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-5">
        <h3 className="text-white mb-4" style={{ fontSize: '15px', fontWeight: 600 }}>Topic Strength Breakdown</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topicStrengths} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="topic" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
            <Tooltip contentStyle={{ backgroundColor: "#21262d", border: "1px solid #30363d", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
            <Bar dataKey="strength" radius={[0, 4, 4, 0]}>
              {topicStrengths.map((entry, i) => (
                <Cell key={i} fill={entry.strength >= 70 ? "#22c55e" : entry.strength >= 50 ? "#eab308" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Strong vs Weak */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Strong */}
        <div className="bg-[#161b22] border border-green-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-white" style={{ fontSize: '15px', fontWeight: 600 }}>Strong Topics</h3>
            <span className="bg-green-500/10 text-green-400 rounded-md px-2 py-0.5 ml-auto" style={{ fontSize: '11px' }}>{strongTopics.length} topics</span>
          </div>
          <div className="space-y-3">
            {strongTopics.map(t => (
              <div key={t.topic} className="flex items-center gap-3">
                <div className="w-32 text-[#c9d1d9]" style={{ fontSize: '12px' }}>{t.topic}</div>
                <div className="flex-1 h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${t.strength}%` }} />
                </div>
                <span className="text-green-400 w-10 text-right" style={{ fontSize: '12px', fontWeight: 700 }}>{t.strength}%</span>
                <span className="text-[#8b949e]" style={{ fontSize: '10px' }}>{t.correct}/{t.problems}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak */}
        <div className="bg-[#161b22] border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-white" style={{ fontSize: '15px', fontWeight: 600 }}>Needs Practice</h3>
            <span className="bg-red-500/10 text-red-400 rounded-md px-2 py-0.5 ml-auto" style={{ fontSize: '11px' }}>{weakTopics.length} topics</span>
          </div>
          <div className="space-y-3">
            {weakTopics.map(t => (
              <div key={t.topic} className="flex items-center gap-3">
                <div className="w-32 text-[#c9d1d9]" style={{ fontSize: '12px' }}>{t.topic}</div>
                <div className="flex-1 h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${t.strength}%` }} />
                </div>
                <span className="text-red-400 w-10 text-right" style={{ fontSize: '12px', fontWeight: 700 }}>{t.strength}%</span>
                <span className="text-[#8b949e]" style={{ fontSize: '10px' }}>{t.correct}/{t.problems}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/problems")}
            className="w-full mt-4 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg py-2 flex items-center justify-center gap-2 transition-colors"
            style={{ fontSize: '13px' }}
          >
            Practice Weak Topics <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

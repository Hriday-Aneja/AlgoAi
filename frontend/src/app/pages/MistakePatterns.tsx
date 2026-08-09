import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  AlertTriangle, TrendingUp, Brain, CheckCircle2, XCircle, RefreshCw
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import {
  getMistakeAnalysis, getTopicPerformance,
  type MistakeAnalysis, type TopicStatistic, type WeakPattern
} from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

// ─── Helpers ───────────────────────────────────────────────────────────────

const capitalizeWords = (text: string): string =>
  text
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatProblemId = (id: string): string => capitalizeWords(id);

const formatSeconds = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const severityFor = (solveRate: number): "high" | "medium" | "low" => {
  if (solveRate < 40) return "high";
  if (solveRate < 70) return "medium";
  return "low";
};

const SEVERITY_COLOR: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const CATEGORY_ICONS = ["🎯", "🔢", "🔄", "⚡", "🧩", "🌐", "🧠", "📐"];

const suggestionIcon = (category: string): string => {
  if (category === "weak-topic") return "🎯";
  if (category === "time-efficiency") return "⚡";
  if (category === "repeated-failure") return "🔁";
  return "💡";
};

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

type FetchState<T> = { status: 'loading' | 'success' | 'error'; data: T | null };

export default function MistakePatterns() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [view, setView] = useState<"overview" | "details" | "trends">("overview");

  const [analysis, setAnalysis] = useState<FetchState<MistakeAnalysis>>({ status: 'loading', data: null });
  const [topicStats, setTopicStats] = useState<FetchState<TopicStatistic[]>>({ status: 'loading', data: null });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    if (!user?.id) return;
    setAnalysis({ status: 'loading', data: null });
    setTopicStats({ status: 'loading', data: null });

    const [analysisResult, topicsResult] = await Promise.all([
      getMistakeAnalysis(user.id),
      getTopicPerformance(user.id),
    ]);

    setAnalysis(
      analysisResult
        ? { status: 'success', data: analysisResult }
        : { status: 'error', data: null }
    );
    setTopicStats({ status: 'success', data: topicsResult });
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const weakPatterns: WeakPattern[] = analysis.data?.weakPatterns ?? [];
  const suggestions = analysis.data?.suggestions ?? [];
  const frequentMistakes = analysis.data?.frequentMistakes ?? [];
  const summary = analysis.data?.summary;
  const stats = topicStats.data ?? [];

  const selectedPattern = weakPatterns.find((w) => w.topic === selectedTopic) ?? weakPatterns[0] ?? null;

  const radarData = stats
    .slice(0, 8)
    .map((s) => ({ subject: capitalizeWords(s.topic), A: s.solveRate }));

  const topicBarData = [...stats]
    .sort((a, b) => a.solveRate - b.solveRate)
    .slice(0, 8)
    .map((s) => ({ topic: capitalizeWords(s.topic), solveRate: s.solveRate }));

  const isLoading = analysis.status === 'loading' || topicStats.status === 'loading';
  const hasError = analysis.status === 'error';
  const hasNoData = analysis.status === 'success' && (summary?.totalProblems ?? 0) === 0;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
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
            <p style={{ fontSize: '12px', color: '#4a5568' }}>Analysis of your recurring weak topics, based on your real attempts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" style={{ color: '#6b7280' }} />
          </button>
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
        </div>
      </motion.div>

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-2xl p-10 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <RefreshCw className="w-6 h-6 animate-spin" style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Analyzing your mistake patterns…</span>
        </div>
      )}

      {/* Error state */}
      {!isLoading && hasError && (
        <div className="rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <XCircle className="w-6 h-6" style={{ color: '#ef4444' }} />
          <span style={{ fontSize: '13px', color: '#ef4444' }}>Couldn't load your mistake analysis right now.</span>
          <button
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg"
            style={{ fontSize: '12px', fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasError && hasNoData && (
        <div className="rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Brain className="w-6 h-6" style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '13px', color: '#6b7280' }}>No attempts yet — solve or attempt a few problems and your mistake patterns will show up here.</span>
        </div>
      )}

      {!isLoading && !hasError && !hasNoData && summary && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Problems Attempted", value: summary.totalProblems, icon: XCircle, color: "#ef4444", sub: "All time" },
              { label: "Unsolved / Mistakes", value: summary.attemptedCount, icon: AlertTriangle, color: "#f59e0b", sub: "Still need work" },
              { label: "Weak Topics", value: weakPatterns.length, icon: Brain, color: "#a855f7", sub: "Below 70% solve rate" },
              { label: "Overall Solve Rate", value: `${summary.overallSolveRate}%`, icon: TrendingUp, color: "#22c55e", sub: `${summary.solvedCount} solved` },
            ].map(({ label, value, icon: Icon, color, sub }, i) => (
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
                <div style={{ fontSize: '26px', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '2px' }}>{sub}</div>
              </motion.div>
            ))}
          </div>

          {view === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Weak Topics */}
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>Weak Areas Breakdown</h3>
                {weakPatterns.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                    <span style={{ fontSize: '12px', color: '#22c55e' }}>No weak topics detected — solid solve rates across the board.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weakPatterns.map((w, i) => {
                      const severity = severityFor(w.solveRate);
                      const color = SEVERITY_COLOR[severity];
                      return (
                        <motion.div
                          key={w.topic}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => setSelectedTopic(w.topic === selectedTopic ? null : w.topic)}
                          className="p-3 rounded-xl cursor-pointer transition-all"
                          style={{
                            background: selectedPattern?.topic === w.topic ? `${color}10` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${selectedPattern?.topic === w.topic ? color + '30' : 'rgba(255,255,255,0.05)'}`,
                          }}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: '16px' }}>{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</span>
                              <div>
                                <div className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>{capitalizeWords(w.topic)}</div>
                                <div style={{ fontSize: '10px', color: '#4a5568' }}>{w.totalAttempts} attempts</div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div style={{ fontSize: '18px', fontWeight: 800, color }}>{w.solveRate}%</div>
                              <div style={{ fontSize: '9px', color }}>{severity} priority</div>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${w.solveRate}%` }}
                              transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                              className="h-full rounded-full"
                              style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detail Panel + Radar */}
              <div className="space-y-4">
                {/* Radar Chart */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <h3 className="text-white mb-2" style={{ fontSize: '14px', fontWeight: 700 }}>Topic Solve Rate Radar</h3>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <Radar name="Solve Rate" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#4a5568', padding: '20px 0', textAlign: 'center' }}>Not enough data yet.</div>
                  )}
                </div>

                {/* Selected Topic Detail */}
                {selectedPattern && (
                  <motion.div
                    key={selectedPattern.topic}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-5"
                    style={{
                      background: `linear-gradient(135deg, ${SEVERITY_COLOR[severityFor(selectedPattern.solveRate)]}08, transparent)`,
                      border: `1px solid ${SEVERITY_COLOR[severityFor(selectedPattern.solveRate)]}25`
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span style={{ fontSize: '20px' }}>🎯</span>
                      <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>{capitalizeWords(selectedPattern.topic)}</h3>
                      <span
                        className="ml-auto px-2 py-0.5 rounded-full"
                        style={{
                          fontSize: '10px', fontWeight: 700,
                          background: `${SEVERITY_COLOR[severityFor(selectedPattern.solveRate)]}20`,
                          color: SEVERITY_COLOR[severityFor(selectedPattern.solveRate)],
                          border: `1px solid ${SEVERITY_COLOR[severityFor(selectedPattern.solveRate)]}30`
                        }}
                      >
                        {severityFor(selectedPattern.solveRate).toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{selectedPattern.message}</span>
                      </div>
                      {frequentMistakes
                        .filter((f) => f.topic === selectedPattern.topic)
                        .slice(0, 3)
                        .map((f, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{formatProblemId(f.problemId)} — still unsolved</span>
                          </div>
                        ))}
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
                <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>Solve Rate by Topic</h3>
                {topicBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topicBarData} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="topic" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="solveRate" name="Solve Rate %" radius={[4, 4, 0, 0]}>
                        {topicBarData.map((entry, i) => (
                          <Cell key={i} fill={SEVERITY_COLOR[severityFor(entry.solveRate)]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ fontSize: '12px', color: '#4a5568', padding: '20px 0', textAlign: 'center' }}>Not enough data yet.</div>
                )}
              </div>
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>AI Suggestions</h3>
                {suggestions.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#4a5568' }}>No suggestions yet — keep solving to unlock personalized tips.</div>
                ) : (
                  <div className="space-y-3">
                    {suggestions.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: '16px' }}>{suggestionIcon(s.category)}</span>
                          <span
                            className="ml-auto px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              fontSize: '9px', fontWeight: 700,
                              background: s.priority === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                              color: s.priority === 'high' ? '#ef4444' : '#f59e0b',
                              border: `1px solid ${s.priority === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
                            }}
                          >
                            {s.priority}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#4a5568', lineHeight: 1.5 }}>{s.text}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "details" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#4a5568' }}>No topic data yet.</div>
              ) : (
                [...stats]
                  .sort((a, b) => a.solveRate - b.solveRate)
                  .map((s, i) => {
                    const severity = severityFor(s.solveRate);
                    const color = SEVERITY_COLOR[severity];
                    return (
                      <motion.div
                        key={s.topic}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-2xl p-5 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${color}10, transparent)`,
                          border: `1px solid ${color}25`
                        }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10" style={{ background: color, filter: 'blur(20px)' }} />
                        <div className="flex items-center gap-2 mb-3">
                          <span style={{ fontSize: '24px' }}>{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</span>
                          <div>
                            <div className="text-white" style={{ fontSize: '13px', fontWeight: 700 }}>{capitalizeWords(s.topic)}</div>
                            <div style={{ fontSize: '10px', color: '#4a5568' }}>{severity} severity</div>
                          </div>
                        </div>
                        <div className="mb-3" style={{ fontSize: '36px', fontWeight: 900, color }}>
                          {s.solveRate}%
                          <span style={{ fontSize: '12px', fontWeight: 500, color: '#4a5568', marginLeft: '4px' }}>solve rate</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.solveRate}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-start gap-1.5">
                            <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>{s.solvedCount} solved / {s.attemptedCount} unsolved ({s.totalAttempts} total)</span>
                          </div>
                          {s.averageTimeTaken !== null && (
                            <div className="flex items-start gap-1.5">
                              <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                              <span style={{ fontSize: '11px', color: '#6b7280' }}>Avg time: {formatSeconds(s.averageTimeTaken)}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
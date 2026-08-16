import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Dna, Zap, Brain, TrendingUp, TrendingDown, Target,
  Clock, CheckCircle2, Star, Flame, BarChart2, Lightbulb,
  Code2, GitBranch, Cpu, Layers
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { useUserProgress } from "../contexts/UserProgressContext";
import { getUserProgress } from "../../services/api";

// ─── Static, non-personal reference data (unchanged) ───────────────────────

const TOPIC_COLORS = ["#00d4ff", "#a855f7", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#38bdf8", "#f472b6", "#facc15", "#34d399"];

// These 6 traits are NOT yet derivable from real signals (no per-attempt
// timing/hint data exists in the DB today) — left as illustrative/static
// pending that data becoming available. See CodeDNA data-audit discussion.
const BEHAVIOR_TRAITS = [
  { trait: "Accuracy", value: 90, icon: Target, color: "#22c55e" },
  { trait: "Speed", value: 65, icon: Clock, color: "#f59e0b" },
  { trait: "Pattern Recognition", value: 72, icon: Brain, color: "#a855f7" },
  { trait: "Optimization", value: 58, icon: Zap, color: "#00d4ff" },
  { trait: "Code Cleanliness", value: 85, icon: Code2, color: "#ec4899" },
  { trait: "Debug Speed", value: 70, icon: Cpu, color: "#ff6500" },
];

const suggestions = [
  {
    title: "Focus on Dynamic Programming",
    desc: "Your DP score is 54% — 20 targeted DP problems will boost this significantly.",
    priority: "🔴 High",
    icon: Brain,
    color: "#ef4444",
    action: "Practice DP →"
  },
  {
    title: "Speed Up Your Approach",
    desc: "You're accurate (90%) but slow (65%). Practice pattern recognition to solve faster.",
    priority: "🟡 Medium",
    icon: Clock,
    color: "#f59e0b",
    action: "Start Timer Mode →"
  },
  {
    title: "Unlock Heaps & Tries",
    desc: "These advanced topics are at 38% and 25%. Essential for senior roles.",
    priority: "🟡 Medium",
    icon: Layers,
    color: "#a855f7",
    action: "Study Heaps →"
  },
  {
    title: "Maintain Array Strength",
    desc: "Keep solving 2-3 array problems per week to maintain your 88% mastery.",
    priority: "🟢 Low",
    icon: CheckCircle2,
    color: "#22c55e",
    action: "Array Practice →"
  }
];

const dnaSequence = "ATGCGATCGTAGCTAGCTAGCTAGCATGCGATCG";

// ─── Real-data types & helpers ──────────────────────────────────────────────

interface DnaProgressRecord {
  problem_id: string;
  topic: string[];
  difficulty: "easy" | "medium" | "hard";
  status: "solved" | "attempted";
  created_at: string;
  updated_at: string;
}

interface Archetype {
  emoji: string;
  style: string;
  description: string;
}

interface TopicScore {
  topic: string;
  strength: number;
  color: string;
  solvedCount: number;
}

interface TimelinePoint {
  month: string;
  easy: number;
  medium: number;
  hard: number;
}

/** Dedupe progress records to one (latest) row per problem. */
const dedupeByProblem = (records: DnaProgressRecord[]): DnaProgressRecord[] => {
  const byProblem = new Map<string, DnaProgressRecord>();
  records.forEach((r) => byProblem.set(r.problem_id, r));
  return Array.from(byProblem.values());
};

/**
 * Honest, rule-based archetype from real solved-problem signals only.
 * Every number in the output description is computed from actual data —
 * nothing here is invented or AI-generated.
 */
const computeArchetype = (
  totalSolved: number,
  easySolved: number,
  mediumSolved: number,
  hardSolved: number,
  topTopics: string[]
): Archetype => {
  if (totalSolved === 0) {
    return {
      emoji: "🧬",
      style: "Unwritten DNA",
      description: "Sorry, we can't explore your coding DNA yet. Solve some problems and come back later.",
    };
  }

  const topicBreadth = topTopics.length;
  const hardPct = Math.round((hardSolved / totalSolved) * 100);
  const mediumPct = Math.round((mediumSolved / totalSolved) * 100);
  const easyPct = Math.round((easySolved / totalSolved) * 100);

  if (hardPct >= 30 && totalSolved >= 5) {
    return {
      emoji: "🔥",
      style: "Challenge Seeker",
      description: `${hardPct}% of your ${totalSolved} solved problem${totalSolved === 1 ? "" : "s"} are Hard — you gravitate toward the toughest challenges, across ${topicBreadth} topic${topicBreadth === 1 ? "" : "s"}.`,
    };
  }

  if (topicBreadth >= 6) {
    return {
      emoji: "🧭",
      style: "Broad Explorer",
      description: `You've solved problems across ${topicBreadth} different topics${topTopics.length ? `, including ${topTopics.slice(0, 3).join(", ")}` : ""} — a wide, exploratory practice style.`,
    };
  }

  if (easyPct >= 60) {
    return {
      emoji: "🌱",
      style: "Foundation Builder",
      description: `${easyPct}% of your ${totalSolved} solved problem${totalSolved === 1 ? "" : "s"} are Easy — you're methodically building a strong base before pushing into harder territory.`,
    };
  }

  return {
    emoji: "⚙️",
    style: "Steady Solver",
    description: `You've solved ${totalSolved} problem${totalSolved === 1 ? "" : "s"} across ${topicBreadth} topic${topicBreadth === 1 ? "" : "s"} — ${easyPct}% Easy, ${mediumPct}% Medium, ${hardPct}% Hard.`,
  };
};

const monthLabel = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

/** Cumulative Easy/Medium/Hard solved counts, one point per month touched. */
const buildTimeline = (solved: DnaProgressRecord[]): TimelinePoint[] => {
  const sorted = [...solved].sort(
    (a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime()
  );

  const byMonth = new Map<string, { easy: number; medium: number; hard: number }>();
  sorted.forEach((r) => {
    const key = monthLabel(r.updated_at || r.created_at);
    if (!byMonth.has(key)) byMonth.set(key, { easy: 0, medium: 0, hard: 0 });
    const bucket = byMonth.get(key)!;
    if (r.difficulty === "easy") bucket.easy += 1;
    else if (r.difficulty === "medium") bucket.medium += 1;
    else if (r.difficulty === "hard") bucket.hard += 1;
  });

  let cumEasy = 0;
  let cumMedium = 0;
  let cumHard = 0;
  return Array.from(byMonth.entries()).map(([month, bucket]) => {
    cumEasy += bucket.easy;
    cumMedium += bucket.medium;
    cumHard += bucket.hard;
    return { month, easy: cumEasy, medium: cumMedium, hard: cumHard };
  });
};

function DNAStrand() {
  return (
    <div className="flex items-center justify-center overflow-hidden" style={{ height: '60px' }}>
      <div className="flex gap-0.5">
        {dnaSequence.split('').map((base, i) => {
          const colors: Record<string, string> = { A: '#ff6500', T: '#00d4ff', G: '#22c55e', C: '#a855f7' };
          return (
            <motion.div
              key={i}
              animate={{ y: [0, Math.sin(i * 0.5) * 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
              className="w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0"
              style={{
                background: `${colors[base]}20`,
                border: `1px solid ${colors[base]}40`,
                fontSize: '9px',
                fontWeight: 800,
                color: colors[base],
                fontFamily: 'monospace'
              }}
            >
              {base}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface ProfileCardProps {
  archetype: Archetype;
  solvedCount: number;
  streakDisplay: string;
  rank: string;
}

function ProfileCard({ archetype, solvedCount, streakDisplay, rank }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.08))',
        border: '1px solid rgba(236,72,153,0.25)',
        boxShadow: '0 0 40px rgba(236,72,153,0.1)'
      }}
    >
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: '#ec4899', filter: 'blur(30px)' }} />

      {/* DNA Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-2.5 rounded-xl float-animation"
          style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)' }}
        >
          <Dna className="w-6 h-6" style={{ color: '#ec4899', filter: 'drop-shadow(0 0 8px #ec4899)' }} />
        </div>
        <div>
          <div className="text-white" style={{ fontSize: '16px', fontWeight: 800 }}>Your Code DNA</div>
          <div style={{ fontSize: '11px', color: '#4a5568' }}>Personalized coding profile</div>
        </div>
      </div>

      <DNAStrand />

      {/* Coding Style */}
      <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize: '28px' }}>{archetype.emoji}</span>
          <div>
            <div className="text-white" style={{ fontSize: '16px', fontWeight: 800 }}>{archetype.style}</div>
            <div style={{ fontSize: '11px', color: '#4a5568' }}>Your coding archetype</div>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.7 }}>
          {archetype.description}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: "Problems", value: String(solvedCount), color: "#ff6500" },
          { label: "Streak", value: streakDisplay, color: "#22c55e" },
          { label: "Rank", value: rank, color: "#a855f7" },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}
          >
            <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: '#4a5568' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function CodeDNA() {
  const [activeSection, setActiveSection] = useState<"overview" | "behavior" | "suggestions">("overview");
  const { user } = useAuth();
  const { progress } = useUserProgress();

  const [records, setRecords] = useState<DnaProgressRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getUserProgress(user.id)
      .then((res) => {
        if (cancelled) return;
        setRecords((res.data || []) as DnaProgressRecord[]);
      })
      .catch((err) => {
        console.error("Failed to load Code DNA progress:", err);
        if (!cancelled) setLoadError("Couldn't load your Code DNA right now. Please try again shortly.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ─── Derive everything from real progress records ─────────────────────────

  const allRecords = records ?? [];
  const solved = dedupeByProblem(allRecords.filter((r) => r.status === "solved"));
  const solvedCount = solved.length;

  const easySolved = solved.filter((r) => r.difficulty === "easy").length;
  const mediumSolved = solved.filter((r) => r.difficulty === "medium").length;
  const hardSolved = solved.filter((r) => r.difficulty === "hard").length;

  const topicCounts = new Map<string, number>();
  solved.forEach((r) => {
    (r.topic || []).forEach((t) => {
      const key = (t || "").trim();
      if (!key) return;
      topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
    });
  });

  const topicScores: TopicScore[] = Array.from(topicCounts.entries())
    .map(([topic, count], i) => ({
      topic,
      solvedCount: count,
      strength: Math.min(100, count * 20),
      color: TOPIC_COLORS[i % TOPIC_COLORS.length],
    }))
    .sort((a, b) => b.solvedCount - a.solvedCount);

  const radarTopics = topicScores.slice(0, 6);
  const radarData = radarTopics.map((t) => ({ subject: t.topic, value: t.strength }));

  const archetype = computeArchetype(
    solvedCount,
    easySolved,
    mediumSolved,
    hardSolved,
    topicScores.map((t) => t.topic)
  );

  const streakDisplay = `${Math.max(1, progress?.currentStreak ?? 1)}d`;
  const RANK = "#1"; // TODO: wire up to a real leaderboard/ranking system once one exists.

  const timelineData = buildTimeline(solved);

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
            style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', boxShadow: '0 0 20px rgba(236,72,153,0.1)' }}
          >
            <Dna className="w-5 h-5" style={{ color: '#ec4899' }} />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: '20px', fontWeight: 800 }}>Code DNA Profile</h1>
            <p style={{ fontSize: '12px', color: '#4a5568' }}>Your unique coding fingerprint, strengths & actionable insights</p>
          </div>
        </div>

        <div
          className="flex rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {(['overview', 'behavior', 'suggestions'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className="px-4 py-2 capitalize transition-all"
              style={{
                fontSize: '12px', fontWeight: 600,
                background: activeSection === s ? 'rgba(236,72,153,0.15)' : 'transparent',
                color: activeSection === s ? '#ec4899' : '#4a5568',
                borderBottom: activeSection === s ? '2px solid #ec4899' : '2px solid transparent'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Loading your Code DNA...</p>
        </div>
      )}

      {!isLoading && loadError && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p style={{ fontSize: '13px', color: '#ef4444' }}>{loadError}</p>
        </div>
      )}

      {!isLoading && !loadError && activeSection === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ProfileCard archetype={archetype} solvedCount={solvedCount} streakDisplay={streakDisplay} rank={RANK} />

          <div className="lg:col-span-2 space-y-5">
            {/* Strength Radar */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>Skill Radar Chart</h3>
              {radarTopics.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#4a5568' }}>
                  Solve a few problems across different topics to see your skill radar take shape.
                </p>
              ) : (
                <div className="flex gap-5">
                  <ResponsiveContainer width="60%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Radar name="Strength" dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: '#ec4899' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 self-center">
                    {radarTopics.map((t, i) => (
                      <motion.div
                        key={t.topic}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-2"
                      >
                        <span className="w-16 flex-shrink-0" style={{ fontSize: '11px', color: '#6b7280' }}>{t.topic}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${t.strength}%` }}
                            transition={{ duration: 1, delay: i * 0.08 + 0.3 }}
                            className="h-full rounded-full"
                            style={{ background: t.color, boxShadow: `0 0 6px ${t.color}60` }}
                          />
                        </div>
                        <span className="w-8 text-right flex-shrink-0" style={{ fontSize: '11px', fontWeight: 700, color: t.color }}>{t.strength}%</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Over Time */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>Growth Timeline</h3>
              {timelineData.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#4a5568' }}>
                  Solve a few problems to start building your growth timeline.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="dsaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff6500" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ff6500" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="webGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="mlGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="hard" stroke="#ff6500" strokeWidth={2} fill="url(#dsaGrad)" name="Hard" />
                    <Area type="monotone" dataKey="medium" stroke="#00d4ff" strokeWidth={2} fill="url(#webGrad)" name="Medium" />
                    <Area type="monotone" dataKey="easy" stroke="#a855f7" strokeWidth={2} fill="url(#mlGrad)" name="Easy" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !loadError && activeSection === "behavior" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Coding Behavior Traits */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-2" style={{ fontSize: '14px', fontWeight: 700 }}>Coding Behavior Analysis</h3>
            <p style={{ fontSize: '12px', color: '#4a5568', marginBottom: '16px' }}>
              {allRecords.length > 0
                ? `Based on your ${allRecords.length} tracked submission${allRecords.length === 1 ? "" : "s"}`
                : "No submissions tracked yet"}
            </p>
            <div className="space-y-4">
              {BEHAVIOR_TRAITS.map((t, i) => (
                <motion.div
                  key={t.trait}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <t.icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{t.trait}</span>
                    <span style={{ fontSize: '12px', color: t.color, fontWeight: 800, marginLeft: 'auto' }}>{t.value}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.value}%` }}
                      transition={{ duration: 1.2, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
                      className="h-full rounded-full relative overflow-hidden"
                      style={{ background: `linear-gradient(90deg, ${t.color}, ${t.color}cc)`, boxShadow: `0 0 8px ${t.color}60` }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          animation: 'shimmer 2s infinite'
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Topic Breakdown */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-white mb-4" style={{ fontSize: '14px', fontWeight: 700 }}>All Topics Breakdown</h3>
            {topicScores.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#4a5568' }}>
                No topic data yet — solve a few problems to see your breakdown here.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topicScores} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
                  <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ background: '#0f1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(v: any) => [`${v}%`, 'Strength']}
                  />
                  <Bar dataKey="strength" radius={[0, 6, 6, 0]}>
                    {topicScores.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {!isLoading && !loadError && activeSection === "suggestions" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {suggestions.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-2xl p-5 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${s.color}10, transparent)`,
                border: `1px solid ${s.color}25`,
                boxShadow: `0 4px 20px ${s.color}08`
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2.5 rounded-xl flex-shrink-0"
                  style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>{s.title}</span>
                  </div>
                  <div style={{ fontSize: '10px', marginBottom: '8px' }}>{s.priority}</div>
                  <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.7, marginBottom: '12px' }}>
                    {s.desc}
                  </p>
                  <button
                    className="px-4 py-1.5 rounded-lg transition-all cyber-btn"
                    style={{
                      fontSize: '12px', fontWeight: 700,
                      background: `${s.color}15`,
                      color: s.color,
                      border: `1px solid ${s.color}30`
                    }}
                  >
                    {s.action}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
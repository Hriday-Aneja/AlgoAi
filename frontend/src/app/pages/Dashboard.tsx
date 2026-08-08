import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Flame, Star, Trophy, TrendingUp, Code2, CheckCircle2,
  Clock, Target, ArrowRight, Zap, BarChart2, BookOpen,
  ChevronRight, Play, Shield, Eye, Dna, Activity, Shuffle,
  AlertTriangle, Users, Sparkles, Lock, Wifi, WifiOff
} from "lucide-react";
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { getHealth, getUserProgress, getWeakTopics, getAdvancedRecommendations, getAllProblems, getUserRoadmap, getUserAnalytics, getWeeklyActivity, getSubmissionActivity, type ProgressRecord, type RoadmapDay, type RoadmapMeta, type ProblemRecord, type WeeklyActivityDay } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useUserProgress } from "../contexts/UserProgressContext";
import { Tooltip as UiTooltip, TooltipTrigger as UiTooltipTrigger, TooltipContent as UiTooltipContent } from "../components/ui/tooltip";

interface DashboardRoadmapDay extends RoadmapDay {
  completed: boolean;
}

const defaultWeeklyActivity: WeeklyActivityDay[] = [
  { day: 'Mon', solved: 0 },
  { day: 'Tue', solved: 0 },
  { day: 'Wed', solved: 0 },
  { day: 'Thu', solved: 0 },
  { day: 'Fri', solved: 0 },
  { day: 'Sat', solved: 0 },
  { day: 'Sun', solved: 0 },
];

const buildActivityHeatmap = (progressRecords: ProgressRecord[]) => {
  const today = new Date();
  const dates = Array.from({ length: 84 }).map((_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (83 - index));
    return day.toISOString().slice(0, 10);
  });

  const counts = dates.reduce<Record<string, number>>((acc, date) => {
    acc[date] = 0;
    return acc;
  }, {});

  progressRecords.forEach((record) => {
    const day = record.created_at.slice(0, 10);
    if (counts[day] !== undefined) {
      counts[day] += 1;
    }
  });

  return Array.from({ length: 12 }).map((_, weekIndex) => {
    return dates.slice(weekIndex * 7, weekIndex * 7 + 7).map((date) => counts[date] ?? 0);
  });
};

const newFeatureCards = [
  { icon: Eye, label: "Code Visualizer", desc: "Step-by-step execution flow", path: "/visualizer", color: "#00d4ff", gradient: "from-cyan-500/20 to-blue-500/10" },
  { icon: Shield, label: "Boss Battle", desc: "Epic timed challenges", path: "/boss-battle", color: "#ef4444", gradient: "from-red-500/20 to-orange-500/10" },
  { icon: Dna, label: "Code DNA", desc: "Your coding profile", path: "/dna", color: "#ec4899", gradient: "from-pink-500/20 to-purple-500/10" },
  { icon: Activity, label: "Live Heatmap", desc: "Compete in real-time", path: "/heatmap", color: "#00d4ff", gradient: "from-cyan-500/20 to-teal-500/10" },
  { icon: Shuffle, label: "Reverse Mode", desc: "Guess the problem", path: "/reverse", color: "#a855f7", gradient: "from-purple-500/20 to-pink-500/10" },
  { icon: Users, label: "Interview Persona", desc: "AI mock interviews", path: "/personality", color: "#22c55e", gradient: "from-green-500/20 to-emerald-500/10" },
  { icon: AlertTriangle, label: "Mistake Patterns", desc: "Spot your weak areas", path: "/mistakes", color: "#f59e0b", gradient: "from-yellow-500/20 to-orange-500/10" },
];

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }: {
  icon: any; label: string; value: string; sub: string; color: string; delay?: number;
}) {
  const [count, setCount] = useState(0);
  const numValue = parseFloat(value.replace(/[^0-9.]/g, ''));

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = numValue / 40;
      const interval = setInterval(() => {
        start += step;
        if (start >= numValue) { setCount(numValue); clearInterval(interval); }
        else setCount(Math.floor(start));
      }, 30);
      return () => clearInterval(interval);
    }, delay * 100);
    return () => clearTimeout(timer);
  }, [numValue, delay]);

  const displayValue = value.includes('#')
    ? `#${count.toLocaleString()}`
    : value.includes('d')
    ? `${count}d`
    : count.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className="relative rounded-xl p-4 overflow-hidden group cursor-default"
      style={{
        background: `linear-gradient(135deg, ${color}12 0%, transparent 60%)`,
        border: `1px solid ${color}25`,
        boxShadow: `0 4px 20px ${color}10`,
      }}
      whileHover={{ scale: 1.02, boxShadow: `0 8px 30px ${color}25` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span style={{ fontSize: '11px', color: '#4a5568', fontWeight: 500 }}>{label}</span>
      </div>
      <div className="mb-1" style={{ fontSize: '26px', fontWeight: 800, color }}>
        {displayValue}
      </div>
      <div style={{ fontSize: '11px', color: '#4a5568' }}>{sub}</div>
      <div
        className="absolute bottom-0 right-0 w-16 h-16 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: color, filter: 'blur(20px)', transform: 'translate(20%, 20%)' }}
      />
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { progress, checkAndUpdateStreak } = useUserProgress();
  const [activeTab, setActiveTab] = useState<"roadmap" | "recent">("roadmap");
  const [backendProblems, setBackendProblems] = useState<ProblemRecord[]>([]);
  const [backendProgress, setBackendProgress] = useState<ProgressRecord[]>([]);
  const [backendRoadmap, setBackendRoadmap] = useState<DashboardRoadmapDay[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityDay[]>(defaultWeeklyActivity);
  const [weeklyActivityLoading, setWeeklyActivityLoading] = useState(true);
  const [weeklyActivityError, setWeeklyActivityError] = useState<string | null>(null);
  const [roadmapMeta, setRoadmapMeta] = useState<RoadmapMeta | null>(null);
  const [dashboardAnalytics, setDashboardAnalytics] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      // Check and update streak when user logs in
      checkAndUpdateStreak();
    }
  }, [isAuthenticated, navigate, checkAndUpdateStreak]);

  // Health check state
  const [healthStatus, setHealthStatus] = useState<{
    status: 'loading' | 'success' | 'error';
    data?: any;
    error?: string;
  }>({ status: 'loading' });

  // Weak topics state
  const [weakTopics, setWeakTopics] = useState<{
    status: 'loading' | 'success' | 'error';
    data?: Array<{
      topic: string;
      total_attempted: number;
      total_solved: number;
      accuracy: number;
      avg_time: number;
      weakness_level: 'high' | 'medium';
    }>;
    error?: string;
  }>({ status: 'loading' });

  // Recommendations state
  const [recommendations, setRecommendations] = useState<{
    status: 'loading' | 'success' | 'error';
    data?: Array<{
      problemId: string;
      title: string;
      difficulty: string;
      topic: string;
      reasoning: string;
      confidence: number;
    }>;
    error?: string;
  }>({ status: 'loading' });

  // Safe defaults for all computed values
  const safeBackendProgress = backendProgress || [];
  const safeBackendProblems = backendProblems || [];
  const safeBackendRoadmap = backendRoadmap || [];

  const progressStatusMap = new Map((safeBackendProgress).map((record) => [record.problem_id, record.status]));
  const problemsWithStatus = (safeBackendProblems).map((p) => ({
    ...p,
    status: progressStatusMap.get(p.id) ?? p.status,
  }));

  const totalProblems = dashboardAnalytics?.totalProblems ?? backendProblems?.length ?? 0;
  const solvedProblems = (problemsWithStatus || []).filter((p) => p.status === 'solved');
  const touchedProblems = (problemsWithStatus || []).filter((p) => p.status === 'solved' || p.status === 'attempted');

  const solvedPct = totalProblems > 0 ? Math.round(((solvedProblems?.length ?? 0) / totalProblems) * 100) : 0;
  const diffData = [
    { name: "Easy", value: (solvedProblems || []).filter((p) => String(p.difficulty).toLowerCase() === "easy").length, fill: "#22c55e" },
    { name: "Medium", value: (solvedProblems || []).filter((p) => String(p.difficulty).toLowerCase() === "medium").length, fill: "#f59e0b" },
    { name: "Hard", value: (solvedProblems || []).filter((p) => String(p.difficulty).toLowerCase() === "hard").length, fill: "#ef4444" },
  ];

  const displayTotalSolved = dashboardAnalytics?.solvedQuestions ?? solvedProblems?.length ?? 0;
  const displayTotalAttempted = dashboardAnalytics?.totalQuestions ?? touchedProblems?.length ?? 0;
  const displayCurrentStreak = Math.max(1, progress?.currentStreak ?? dashboardAnalytics?.currentStreak ?? 1);
  const displayLongestStreak = Math.max(1, progress?.longestStreak ?? dashboardAnalytics?.longestStreak ?? 1);
  const displayTotalXp = dashboardAnalytics?.totalXp ?? progress?.totalXp ?? 0;
  const displayLevel = dashboardAnalytics?.level ?? progress?.level ?? 1;

  const activityHeatmap = safeBackendProgress.length > 0 ? buildActivityHeatmap(safeBackendProgress) : [];
  const [submissionRecords, setSubmissionRecords] = useState<{ status: string; createdAt: string }[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState(true);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timerId: any = null;
    const fetchSubs = async () => {
      if (!mounted) return;
      setSubmissionLoading(true);
      try {
        const subs = await getSubmissionActivity();
        if (!mounted) return;
        setSubmissionRecords(subs || []);
        setSubmissionError(null);
      } catch (err: any) {
        console.error('Failed to load submission activity', err);
        setSubmissionError(err?.message || 'Could not load submissions');
        setSubmissionRecords([]);
      } finally {
        if (mounted) setSubmissionLoading(false);
      }
    };
    // initial fetch and poll for live updates
    fetchSubs();
    timerId = setInterval(fetchSubs, 5000);
    return () => { mounted = false; if (timerId) clearInterval(timerId); };
  }, []);

  const toLocalDateKey = (isoOrDate: string | Date) => {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const buildLast30Activity = () => {
    const today = new Date();
    const days = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      return toLocalDateKey(d);
    });

    const map: Record<string, { total: number; correct: number; incorrect: number }> = {};
    days.forEach(dt => { map[dt] = { total: 0, correct: 0, incorrect: 0 }; });

    submissionRecords.forEach((s) => {
      const key = toLocalDateKey(s.createdAt);
      if (!map[key]) return;
      map[key].total += 1;
      const status = (s.status || '').toLowerCase();
      if (status === 'passed' || status === 'success' || status === 'ok') map[key].correct += 1;
      else map[key].incorrect += 1;
    });

    return days.map(d => ({ date: d, total: map[d].total, correct: map[d].correct, incorrect: map[d].incorrect }));
  };

  function buildWeeklyFromSubmissions(subs: { status: string; createdAt: string }[]) {
    // Determine current week's Monday date (local)
    const now = new Date();
    const monday = new Date(now);
    const diff = (now.getDay() + 6) % 7; // 0 = Monday
    monday.setDate(now.getDate() - diff);

    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    const keys = days.map(d => toLocalDateKey(d));

    const map: Record<string, { total: number; correct: number; incorrect: number }> = {};
    keys.forEach(k => { map[k] = { total: 0, correct: 0, incorrect: 0 }; });

    subs.forEach((s) => {
      const key = toLocalDateKey(s.createdAt);
      if (map[key]) {
        map[key].total += 1;
        const status = (s.status || '').toLowerCase();
        if (status === 'passed' || status === 'success' || status === 'ok') map[key].correct += 1;
        else map[key].incorrect += 1;
      }
    });

    const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return labels.map((lab, i) => ({ day: lab, total: map[keys[i]].total, correct: map[keys[i]].correct, incorrect: map[keys[i]].incorrect }));
  }

  function WeeklyTooltip(props: any) {
    const { active, payload } = props;
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
      <div style={{ background: '#0f1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 10, color: 'white' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{data.day}</div>
        <div style={{ fontSize: 12 }}>Total Submissions: {data.total}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>Correct: {data.correct}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>Incorrect: {data.incorrect}</div>
      </div>
    );
  }

  const weeklyChartData = buildWeeklyFromSubmissions(submissionRecords);

  const getColor = (n: number) => {
    if (n === 0) return 'rgba(255,255,255,0.04)';
    if (n <= 2) return 'rgba(255,101,0,0.18)';
    if (n <= 5) return 'rgba(255,101,0,0.32)';
    if (n <= 9) return 'rgba(255,101,0,0.56)';
    return '#ff6500';
  };

  const recentProblems = (problemsWithStatus || []).filter((p) => p.status === "solved").slice(0, 6);
  const nextRoadmapDay = roadmapMeta?.currentRoadmapDay
    ? Math.min(roadmapMeta.currentRoadmapDay, safeBackendRoadmap.length || roadmapMeta.currentRoadmapDay, 15)
    : (safeBackendRoadmap?.length ?? 0) > 0
      ? safeBackendRoadmap.find((day) => !day.completed)?.day ?? (safeBackendRoadmap?.length ?? 1)
      : 1;
  const topicStrengthsList = progress?.topicStrengths
    ? Object.entries(progress.topicStrengths).map(([topic, strength]) => ({ topic, strength }))
    : [];

  const topStrong = [...topicStrengthsList]
    .sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))
    .slice(0, 3);

  const topWeak = [...topicStrengthsList]
    .sort((a, b) => (a.strength ?? 0) - (b.strength ?? 0))
    .slice(0, 3);

  const todayChallenge = problemsWithStatus.find((p) => p.status !== 'solved') || backendProblems[0] || null;
  const challengeDifficulty = todayChallenge?.difficulty
    ? String(todayChallenge.difficulty).charAt(0).toUpperCase() + String(todayChallenge.difficulty).slice(1)
    : 'Medium';
  const challengeTags = todayChallenge?.tags?.length ? todayChallenge.tags : todayChallenge ? [todayChallenge.topic] : ['Practice'];

  // Health check API call
  useEffect(() => {
    const checkHealth = async () => {
      try {
        console.log('Dashboard: Starting health check...');
        const data = await getHealth();
        console.log('Dashboard: Health check successful:', data);
        setHealthStatus({
          status: 'success',
          data: data,
        });
      } catch (error: any) {
        console.error('Dashboard: Health check failed:', error);
        setHealthStatus({
          status: 'error',
          error: error.response?.data?.message || error.message || 'Failed to connect to server',
        });
      }
    };

    checkHealth();
  }, []);

  // Load dashboard progress and problems from backend
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      setDashboardLoading(true);
      try {
        const [problemResponse, progressResponse, roadmapResponse, analyticsResponse, weeklyActivityResponse] = await Promise.all([
          getAllProblems(),
          getUserProgress(user.id),
          getUserRoadmap(),
          getUserAnalytics(),
          getWeeklyActivity(),
        ]);

        setBackendProblems(problemResponse.data || []);
        setBackendProgress(progressResponse.data || []);
        setBackendRoadmap(
          (roadmapResponse?.roadmap ?? []).map((item) => ({
            ...item,
            completed: Boolean(item.completed),
          })),
        );
        setRoadmapMeta(roadmapResponse?.roadmapMeta ?? null);
        setDashboardAnalytics(analyticsResponse || null);
        setWeeklyActivity(weeklyActivityResponse.length ? weeklyActivityResponse : defaultWeeklyActivity);
        setWeeklyActivityError(null);
      } catch (error) {
        console.error('Dashboard: failed to load backend data', error);
        setWeeklyActivityError('Failed to load weekly activity');
      } finally {
        setDashboardLoading(false);
        setWeeklyActivityLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  useEffect(() => {
    const refreshWeeklyActivity = async () => {
      if (!user?.id) return;
      setWeeklyActivityLoading(true);
      try {
        const activity = await getWeeklyActivity();
        setWeeklyActivity(activity.length ? activity : defaultWeeklyActivity);
        setWeeklyActivityError(null);
      } catch (error: any) {
        console.error('Dashboard: failed to refresh weekly activity', error);
        setWeeklyActivityError(error?.message || 'Could not load weekly activity');
      } finally {
        setWeeklyActivityLoading(false);
      }
    };

    refreshWeeklyActivity();
  }, [user?.id, progress?.questionsSolved, progress?.questionsAttempted]);

  // Weak topics API call
  useEffect(() => {
    const fetchWeakTopics = async () => {
      try {
        if (!user?.id) {
          console.log('Dashboard: No user ID available for weak topics');
          return;
        }
        
        console.log('Dashboard: Starting weak topics fetch for userId:', user.id);
        const response = await getWeakTopics(user.id);
        console.log('Dashboard: Weak topics response:', response);

        setWeakTopics({
          status: 'success',
          data: response.data,
        });
      } catch (error: any) {
        console.error('Dashboard: Weak topics fetch failed:', error);
        setWeakTopics({
          status: 'error',
          error: error.response?.data?.message || error.message || 'Failed to fetch weak topics',
        });
      }
    };

    fetchWeakTopics();
  }, [user?.id]);

  // Recommendations API call
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (!user?.id) {
          console.log('Dashboard: No user ID available for recommendations');
          return;
        }

        console.log('Dashboard: Starting recommendations fetch for userId:', user.id);
        const response = await getAdvancedRecommendations(user.id);
        console.log('Dashboard: Recommendations response:', response);

        setRecommendations({
          status: 'success',
          data: response.recommendations,
        });
      } catch (error: any) {
        console.error('Dashboard: Recommendations fetch failed:', error);
        setRecommendations({
          status: 'error',
          error: error.response?.data?.message || error.message || 'Failed to fetch recommendations',
        });
      }
    };

    fetchRecommendations();
  }, [user?.id]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl p-5 scanlines"
        style={{
          background: 'linear-gradient(135deg, rgba(255,101,0,0.15) 0%, rgba(168,85,247,0.08) 50%, transparent 100%)',
          border: '1px solid rgba(255,101,0,0.2)',
          boxShadow: '0 0 40px rgba(255,101,0,0.08)'
        }}
      >
        {/* Glow orb */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: '#ff6500', filter: 'blur(40px)' }} />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10" style={{ background: '#a855f7', filter: 'blur(40px)' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5" style={{ color: '#ff6500' }} />
              <span style={{ fontSize: '11px', color: '#ff6500', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Welcome back
              </span>
            </div>
            <h1 className="text-white mb-2" style={{ fontSize: '22px', fontWeight: 800 }}>
              {user?.name?.split(" ")[0] ?? "Champion"}, let's conquer today! 🚀
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              You're on a{" "}
              <span style={{ color: '#ff6500', fontWeight: 700 }}>{displayCurrentStreak}-day streak</span>
              {" "}— Level{" "}
              <span style={{ color: '#a855f7', fontWeight: 700 }}>{displayLevel}</span>
              {" "}with {displayTotalXp} XP. Keep it up!
            </p>

            {/* Health Status Indicator */}
            <div className="flex items-center gap-2 mt-2">
              {healthStatus.status === 'loading' && (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span style={{ fontSize: '11px', color: '#fbbf24' }}>Checking server...</span>
                </>
              )}
              {healthStatus.status === 'success' && (
                <>
                  <Wifi className="w-3 h-3" style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '11px', color: '#22c55e' }}>
                    {healthStatus.data?.message || 'Server online'}
                  </span>
                </>
              )}
              {healthStatus.status === 'error' && (
                <>
                  <WifiOff className="w-3 h-3" style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '11px', color: '#ef4444' }}>
                    Server: {healthStatus.error || 'offline'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/daily")}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 cyber-btn"
              style={{
                background: 'linear-gradient(135deg, #ff6500, #ff9500)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: '0 0 20px rgba(255,101,0,0.4)'
              }}
            >
              <Flame className="w-4 h-4" />
              Daily Challenge
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/boss-battle")}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 cyber-btn"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              <Shield className="w-4 h-4" style={{ color: '#ef4444' }} />
              Boss Battle
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Code2} label="Problems Solved" value={String(displayTotalSolved)} sub={`of ${totalProblems} problems`} color="#00d4ff" delay={0} />
        <StatCard icon={Target} label="Problems Attempted" value={String(displayTotalAttempted)} sub={`out of ${totalProblems}`} color="#22c55e" delay={1} />
        <StatCard icon={Flame} label="Current Streak" value={`${displayCurrentStreak}d`} sub={`Best: ${displayLongestStreak}d`} color="#ff6500" delay={2} />
        <StatCard icon={Star} label="Total XP" value={String(displayTotalXp)} sub={`Level ${displayLevel}`} color="#f59e0b" delay={3} />
      </div>

      {/* User Progress Status Indicator */}
      <div className="flex items-center gap-2 justify-center">
        {progress ? (
          <>
            <CheckCircle2 className="w-3 h-3" style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '11px', color: '#22c55e' }}>
              User data loaded
            </span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span style={{ fontSize: '11px', color: '#60a5fa' }}>Loading user data...</span>
          </>
        )}
      </div>

      {/* New Features Showcase */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: '#ff6500' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ff6500' }}>New AI Features</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(255,101,0,0.3), transparent)' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {newFeatureCards.map((feat, i) => (
            <motion.button
              key={feat.path}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(feat.path)}
              className="rounded-xl p-3 text-left transition-all group"
              style={{
                background: `linear-gradient(135deg, ${feat.color}15, transparent)`,
                border: `1px solid ${feat.color}25`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${feat.color}50`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${feat.color}20`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${feat.color}25`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <feat.icon className="w-5 h-5 mb-2" style={{ color: feat.color }} />
              <div className="text-white" style={{ fontSize: '11px', fontWeight: 700 }}>{feat.label}</div>
              <div style={{ fontSize: '9px', color: '#4a5568', marginTop: '2px' }}>{feat.desc}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Progress Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>Progress Overview</h3>
            <span style={{ fontSize: '11px', color: '#4a5568' }}>All time</span>
          </div>

          <div className="flex items-center justify-center mb-4">
            <div className="relative w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="55%" outerRadius="90%"
                  data={[{ value: solvedPct, fill: "#ff6500" }]}
                  startAngle={90} endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "rgba(255,255,255,0.04)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white" style={{ fontSize: '24px', fontWeight: 800 }}>{displayTotalSolved}</span>
                <span style={{ fontSize: '10px', color: '#4a5568' }}>Solved</span>
              </div>
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 30px rgba(255,101,0,0.15)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div className="space-y-2.5">
            {diffData.map(({ name, value, fill }) => (
              <div key={name} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fill, boxShadow: `0 0 6px ${fill}` }} />
                <span className="flex-1" style={{ fontSize: '12px', color: '#6b7280' }}>{name}</span>
                <span className="text-white" style={{ fontSize: '12px', fontWeight: 700 }}>{value}</span>
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalProblems > 0 ? (value / totalProblems) * 100 : 0}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: fill, boxShadow: `0 0 6px ${fill}` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Daily Challenge Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl p-5 flex flex-col relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,101,0,0.12) 0%, rgba(255,101,0,0.04) 100%)',
            border: '1px solid rgba(255,101,0,0.2)',
            boxShadow: '0 0 30px rgba(255,101,0,0.1)'
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#ff6500', filter: 'blur(30px)' }} />
          <div className="flex items-center justify-between mb-3 relative">
            <h3 className="text-white flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 700 }}>
              <Flame className="w-4 h-4" style={{ color: '#ff6500' }} />
              Today's Challenge
            </h3>
            <span
              className="rounded-lg px-2 py-0.5"
              style={{
                fontSize: '10px', fontWeight: 700,
                background: challengeDifficulty === 'Easy' ? 'rgba(34,197,94,0.1)' : challengeDifficulty === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                color: challengeDifficulty === 'Easy' ? '#22c55e' : challengeDifficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                border: challengeDifficulty === 'Easy' ? '1px solid rgba(34,197,94,0.25)' : challengeDifficulty === 'Medium' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(239,68,68,0.25)'
              }}
            >
              {challengeDifficulty}
            </span>
          </div>

          <div className="flex-1 relative">
            <h4 className="text-white mb-2" style={{ fontSize: '17px', fontWeight: 800 }}>{todayChallenge?.title ?? 'Choose your next challenge'}</h4>
            <div className="flex gap-2 flex-wrap mb-3">
              {challengeTags.map((t) => (
                <span
                  key={t}
                  className="rounded-md px-2 py-0.5"
                  style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {t}
                </span>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>
              {todayChallenge
                ? `Focus on ${todayChallenge.topic} with a real challenge from your problem set.`
                : 'Solve a new problem today and keep your streak alive.'}
            </p>
          </div>

          <div className="mt-4 space-y-3 relative">
            <div className="flex items-center justify-between" style={{ fontSize: '11px', color: '#4a5568' }}>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 25 min</span>
              <span style={{ color: '#22c55e' }}>🔥 {displayTotalSolved} problems solved</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/daily")}
              className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 cyber-btn"
              style={{
                background: 'linear-gradient(135deg, #ff6500, #ff9500)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: '0 0 20px rgba(255,101,0,0.35)'
              }}
            >
              <Play className="w-4 h-4" />
              Solve Now
            </motion.button>
          </div>
        </motion.div>

        {/* Topic Strength */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>Topic Strength</h3>
            <button
              onClick={() => navigate("/analytics")}
              style={{ fontSize: '11px', color: '#ff6500', fontWeight: 600 }}
              className="hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Strong</span>
            </div>
            {topStrong.map((t, i) => (
              <motion.div
                key={t.topic}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.5 }}
                className="flex items-center gap-2 mb-2"
              >
                <span className="w-20 truncate" style={{ fontSize: '11px', color: '#6b7280' }}>{t.topic}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.strength}%` }}
                    transition={{ duration: 1, delay: i * 0.1 + 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e80' }}
                  />
                </div>
                <span className="w-8 text-right" style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e' }}>{t.strength}%</span>
              </motion.div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <BarChart2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Needs Practice</span>
            </div>

            {weakTopics.status === 'loading' && (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '8px' }}>Loading weak topics...</span>
              </div>
            )}

            {weakTopics.status === 'error' && (
              <div className="text-center py-4">
                <span style={{ fontSize: '11px', color: '#ef4444' }}>Failed to load weak topics</span>
              </div>
            )}

            {weakTopics.status === 'success' && weakTopics.data && weakTopics.data.length === 0 && (
              <div className="text-center py-4">
                <span style={{ fontSize: '11px', color: '#6b7280' }}>No weak topics found!</span>
              </div>
            )}

            {weakTopics.status === 'success' && weakTopics.data && weakTopics.data.length > 0 && (
              weakTopics.data.slice(0, 3).map((topic, i) => (
                <motion.div
                  key={topic.topic}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.8 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <span className="w-20 truncate" style={{ fontSize: '11px', color: '#6b7280' }}>{topic.topic}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.accuracy}%` }}
                      transition={{ duration: 1, delay: i * 0.1 + 0.9 }}
                      className="h-full rounded-full"
                      style={{
                        background: topic.weakness_level === 'high' ? '#ef4444' : '#f59e0b',
                        boxShadow: `0 0 6px ${topic.weakness_level === 'high' ? '#ef444480' : '#f59e0b80'}`
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-right" style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: topic.weakness_level === 'high' ? '#ef4444' : '#f59e0b'
                    }}>
                      {topic.accuracy}%
                    </span>
                    <span style={{
                      fontSize: '9px',
                      color: topic.weakness_level === 'high' ? '#ef4444' : '#f59e0b',
                      textTransform: 'uppercase',
                      fontWeight: 600
                    }}>
                      {topic.weakness_level}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate("/problems")}
            className="w-full mt-3 rounded-xl py-2 flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#6b7280',
              fontSize: '12px'
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
            Practice Weak Topics <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>

      {/* Weekly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>Weekly Activity</h3>
          <span style={{ fontSize: '11px', color: '#4a5568' }}>This week</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={weeklyChartData}>
            <defs>
              <linearGradient id="solvedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6500" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ff6500" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#4a5568' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<WeeklyTooltip />} />
            <Area type="monotone" dataKey="total" stroke="#ff6500" strokeWidth={2} fill="url(#solvedGrad)" dot={{ fill: '#ff6500', r: 3 }} name="Submissions" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bottom Grid: Activity Heatmap + Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>Activity Heatmap</h3>
              <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, marginTop: 4 }}>{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
            </div>
            <span style={{ fontSize: '11px', color: '#4a5568' }}>This Month</span>
          </div>

          {/* Calendar grid for current month */}
          <div className="overflow-x-auto pb-2">
            {submissionLoading ? (
              <div className="flex items-center justify-center w-full py-8 text-[#8b949e] text-sm">Loading activity…</div>
            ) : (
              (() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth(); // 0-based
                const firstOfMonth = new Date(year, month, 1);
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
                const totalSlots = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

                // build day map for the month
                const map: Record<string, { total: number; correct: number; incorrect: number }> = {};
                for (let d = 1; d <= daysInMonth; d++) {
                  const dt = new Date(year, month, d);
                  const key = toLocalDateKey(dt);
                  map[key] = { total: 0, correct: 0, incorrect: 0 };
                }

                // aggregate submissions
                submissionRecords.forEach((s) => {
                  const key = toLocalDateKey(s.createdAt);
                  if (map[key]) {
                    map[key].total += 1;
                    const status = (s.status || '').toLowerCase();
                    if (status === 'passed' || status === 'success' || status === 'ok') map[key].correct += 1;
                    else map[key].incorrect += 1;
                  }
                });

                const cells: Array<null | { day: number; dateKey: string; total: number; correct: number; incorrect: number }> = [];
                for (let i = 0; i < totalSlots; i++) {
                  const dayIndex = i - firstWeekday + 1;
                  if (dayIndex >= 1 && dayIndex <= daysInMonth) {
                    const dt = new Date(year, month, dayIndex);
                    const key = toLocalDateKey(dt);
                    cells.push({ day: dayIndex, dateKey: key, total: map[key].total, correct: map[key].correct, incorrect: map[key].incorrect });
                  } else {
                    cells.push(null);
                  }
                }

                

                // render weekday header
                const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

                const nRows = totalSlots / 7;
                const gridTemplateRows = `auto repeat(${nRows}, 1fr)`;

                return (
                  <div
                    className="w-full"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gridTemplateRows,
                      gap: 12,
                      alignItems: 'center'
                    }}
                  >
                    {/* Weekday header - shares same 7-column grid */}
                    {weekdays.map(w => (
                      <div key={`h-${w}`} style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', justifySelf: 'center' }}>{w}</div>
                    ))}

                    {/* Calendar cells - flow into grid after header */}
                    {cells.map((c, i) => {
                      if (!c) return <div key={`c-empty-${i}`} />;
                      const count = c.total;
                      return (
                        <UiTooltip key={c.dateKey}>
                          <UiTooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.28, delay: i * 0.01 }}
                              className={`cursor-pointer`}
                              style={{
                                justifySelf: 'center',
                                alignSelf: 'center',
                                width: 'clamp(22px, 4.5vw, 32px)',
                                height: 'clamp(12px, 1.8vw, 16px)',
                                borderRadius: 4,
                                backgroundColor: getColor(count),
                                boxShadow: count > 2 ? '0 0 6px rgba(255,101,0,0.35)' : 'none'
                              }}
                            />
                          </UiTooltipTrigger>
                          <UiTooltipContent sideOffset={4}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>{new Date(c.dateKey + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            <div style={{ fontSize: 12 }}>{c.total} submission{c.total !== 1 ? 's' : ''}</div>
                            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{c.correct} correct</div>
                            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{c.incorrect} incorrect</div>
                          </UiTooltipContent>
                        </UiTooltip>
                      );
                    })}
                  </div>
                );
                })()
              )}
            </div>

            {/* Legend below the heatmap, left-aligned and compact (inside heatmap container) */}
            <div style={{ marginTop: 12 }}>
              {(() => {
                const maxTest = 20;
                const ranges: Array<{ color: string; min: number; max: number | null }> = [];
                let curColor: string | null = null;
                let rangeStart = 0;
                for (let n = 0; n <= maxTest; n++) {
                  const c = getColor(n);
                  if (curColor === null) { curColor = c; rangeStart = n; continue; }
                  if (c !== curColor) { ranges.push({ color: curColor, min: rangeStart, max: n - 1 }); curColor = c; rangeStart = n; }
                }
                if (curColor !== null) ranges.push({ color: curColor, min: rangeStart, max: null });

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#4a5568', fontWeight: 700, minWidth: 48, textAlign: 'left' }}>Less</span>

                    <div className="flex items-center" style={{ gap: 8 }}>
                      {ranges.map((r, idx) => (
                        <UiTooltip key={`legend-${idx}`}>
                          <UiTooltipTrigger asChild>
                            <div
                              className="rounded-sm"
                              style={{
                                width: 'clamp(18px, 3.5vw, 24px)',
                                height: 'clamp(8px, 1vw, 12px)',
                                borderRadius: 4,
                                backgroundColor: r.color,
                                boxShadow: r.min >= 3 ? '0 0 6px rgba(255,101,0,0.35)' : 'none',
                                cursor: 'default'
                              }}
                            />
                          </UiTooltipTrigger>
                          <UiTooltipContent sideOffset={4}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{r.max === null ? `${r.min}+ submissions` : r.min === r.max ? `${r.min} submissions` : `${r.min}–${r.max} submissions`}</div>
                          </UiTooltipContent>
                        </UiTooltip>
                      ))}
                    </div>

                    <span style={{ fontSize: 11, color: '#4a5568', fontWeight: 700, minWidth: 48, textAlign: 'left' }}>More</span>
                  </div>
                );
              })()}
            </div>
        </motion.div>

        {/* Roadmap Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 700 }}>
              <Target className="w-4 h-4" style={{ color: '#ff6500' }} />
              AI Roadmap
            </h3>
            <button
              onClick={() => navigate("/roadmap")}
              style={{ fontSize: '11px', color: '#ff6500', fontWeight: 600 }}
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {(safeBackendRoadmap && safeBackendRoadmap.length > 0 ? safeBackendRoadmap : []).slice(0, 5).map((day, i) => {
              const isLocked = day?.isLocked ?? false;
              return (
                <motion.div
                  key={day?.day}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.7 }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all group ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  style={{
                    background: day?.completed ? 'rgba(34,197,94,0.06)' : isLocked ? 'rgba(75,85,99,0.12)' : 'rgba(255,255,255,0.03)',
                    border: day?.completed ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.06)'
                  }}
                  whileHover={isLocked ? undefined : { x: 4 }}
                  onClick={() => !isLocked && navigate("/roadmap")}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: day?.completed ? '#22c55e' : isLocked ? '#4b5563' : 'rgba(255,255,255,0.06)',
                      boxShadow: day?.completed ? '0 0 12px rgba(34,197,94,0.4)' : 'none'
                    }}
                  >
                    {day?.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4 text-[#d1d5db]" />
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>{day?.day || i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate" style={{ fontSize: '12px', fontWeight: 600 }}>Day {day?.day || i + 1}: {day?.topic || "Loading..."}</div>
                    <div className="truncate" style={{ fontSize: '10px', color: '#4a5568' }}>{((day?.tasks) || []).slice(0, 2).join(", ") || "No tasks"}</div>
                  </div>
                  <span
                    className="rounded-lg px-2 py-0.5 flex-shrink-0"
                    style={{
                      fontSize: '10px', fontWeight: 600,
                      background: day?.difficulty === "Easy" ? 'rgba(34,197,94,0.1)' : day?.difficulty === "Medium" ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: day?.difficulty === "Easy" ? '#22c55e' : day?.difficulty === "Medium" ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {isLocked ? 'Locked' : day?.difficulty || "N/A"}
                  </span>
                </motion.div>
              );
            })}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/roadmap")}
            className="w-full mt-3 rounded-xl py-2 flex items-center justify-center gap-2 cyber-btn"
            style={{
              background: 'linear-gradient(135deg, #ff6500, #ff9500)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(255,101,0,0.25)'
            }}
          >
            Continue Day {nextRoadmapDay} <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      </div>

      {/* Recent Submissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>Recent Submissions</h3>
          <button onClick={() => navigate("/problems")} style={{ fontSize: '11px', color: '#ff6500', fontWeight: 600 }}>
            View All →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(recentProblems && recentProblems.length > 0) ? (
            recentProblems.map((p, i) => (
              <motion.div
                key={p?.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 + 0.8 }}
                onClick={() => navigate(`/problems/${p?.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
                whileHover={{ scale: 1.02, borderColor: 'rgba(255,101,0,0.3)' }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-white truncate transition-colors group-hover:text-[#ff6500]"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  >
                    {p?.title || "Untitled"}
                  </div>
                  <div className="flex gap-2 mt-0.5">
                    {(p?.tags || []).slice(0, 2).map(t => (
                      <span key={t} style={{ fontSize: '10px', color: '#4a5568' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px', fontWeight: 700, flexShrink: 0,
                    color: p?.difficulty === "Easy" ? '#22c55e' : p?.difficulty === "Medium" ? '#f59e0b' : '#ef4444'
                  }}
                >
                  {p?.difficulty || "N/A"}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: '#4a5568' }} />
              <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>No solved problems yet</p>
              <p style={{ fontSize: '12px', color: '#4a5568', marginTop: '4px' }}>Start solving to see your progress here!</p>
              <button
                onClick={() => navigate("/problems")}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-600"
                style={{
                  background: 'rgba(255,101,0,0.2)',
                  color: '#ff6500',
                  border: '1px solid rgba(255,101,0,0.3)'
                }}
              >
                Browse Problems
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 700 }}>
            <Zap className="w-4 h-4" style={{ color: '#00d4ff' }} />
            AI Recommendations
          </h3>
          <div className="flex items-center gap-2">
            {recommendations.status === 'loading' && (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
            {recommendations.status === 'success' && (
              <CheckCircle2 className="w-3 h-3" style={{ color: '#22c55e' }} />
            )}
            {recommendations.status === 'error' && (
              <AlertTriangle className="w-3 h-3" style={{ color: '#ef4444' }} />
            )}
          </div>
        </div>

        {recommendations.status === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Analyzing your progress...</p>
            </div>
          </div>
        )}

        {recommendations.status === 'error' && (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: '#ef4444' }} />
            <p style={{ fontSize: '12px', color: '#ef4444' }}>Failed to load recommendations</p>
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{recommendations.error}</p>
          </div>
        )}

        {recommendations.status === 'success' && (!recommendations.data || recommendations.data.length === 0) && (
          <div className="text-center py-8">
            <Target className="w-8 h-8 mx-auto mb-3" style={{ color: '#6b7280' }} />
            <p style={{ fontSize: '12px', color: '#6b7280' }}>No recommendations available</p>
            <p style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>Solve more problems to get personalized suggestions!</p>
          </div>
        )}

        {recommendations.status === 'success' && recommendations.data && recommendations.data.length > 0 && (
          <div className="space-y-3">
            {recommendations.data.slice(0, 3).map((rec, i) => (
              <motion.div
                key={rec.problemId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 1.0 }}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all group"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
                whileHover={{ scale: 1.01, borderColor: 'rgba(0,212,255,0.3)' }}
                onClick={() => navigate(`/problems/${rec.problemId}`)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(0,212,255,0.15)',
                    border: '1px solid rgba(0,212,255,0.3)'
                  }}
                >
                  <Zap className="w-4 h-4" style={{ color: '#00d4ff' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white group-hover:text-[#00d4ff] transition-colors truncate" style={{ fontSize: '13px', fontWeight: 600 }}>
                    {rec.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: rec.difficulty === "Easy" ? 'rgba(34,197,94,0.1)' :
                                   rec.difficulty === "Medium" ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        color: rec.difficulty === "Easy" ? '#22c55e' :
                               rec.difficulty === "Medium" ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {rec.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{rec.topic}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px', lineHeight: 1.4 }}>
                    {rec.reasoning}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-[#00d4ff]" style={{ color: '#4a5568', transition: 'color 0.2s' }} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

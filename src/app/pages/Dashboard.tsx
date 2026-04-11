import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
import { userStats, roadmap, dailyChallenge, topicStrengths, problems } from "../data/mockData";
import api, { getHealth, getUserProgress, getWeakTopics } from "../../services/api";

const activityData = [
  [0,1,0,2,1,0,0],[1,0,2,1,0,1,2],[0,2,1,0,1,2,1],[2,1,0,1,2,0,1],
  [0,1,2,1,0,2,1],[1,2,1,0,1,0,2],[0,1,0,2,1,2,0],[2,0,1,1,0,1,2],
  [1,2,0,1,2,1,0],[0,1,2,0,1,2,1],[2,1,0,2,1,0,1],[1,0,2,1,0,2,0]
];

const weeklyData = [
  { day: "Mon", solved: 3, xp: 150 },
  { day: "Tue", solved: 5, xp: 280 },
  { day: "Wed", solved: 2, xp: 120 },
  { day: "Thu", solved: 8, xp: 450 },
  { day: "Fri", solved: 4, xp: 200 },
  { day: "Sat", solved: 6, xp: 340 },
  { day: "Sun", solved: 7, xp: 390 },
];

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
  const [activeTab, setActiveTab] = useState<"roadmap" | "recent">("roadmap");

  // Health check state
  const [healthStatus, setHealthStatus] = useState<{
    status: 'loading' | 'success' | 'error';
    data?: any;
    error?: string;
  }>({ status: 'loading' });

  // User progress state
  const [userProgress, setUserProgress] = useState<{
    status: 'loading' | 'success' | 'error';
    data?: {
      totalSolved: number;
      totalAttempted: number;
    };
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

  const solvedPct = Math.round((userStats.totalSolved / 200) * 100);
  const diffData = [
    { name: "Easy", value: userStats.easy, fill: "#22c55e" },
    { name: "Medium", value: userStats.medium, fill: "#f59e0b" },
    { name: "Hard", value: userStats.hard, fill: "#ef4444" },
  ];

  // Use real API data when available, fallback to mock data
  const displayTotalSolved = userProgress.status === 'success' ? userProgress.data?.totalSolved || 0 : userStats.totalSolved;
  const displayTotalAttempted = userProgress.status === 'success' ? userProgress.data?.totalAttempted || 0 : userStats.totalAttempted || userStats.totalSolved;

  const recentProblems = problems.filter(p => p.status === "solved").slice(0, 6);
  const sortedTopics = [...topicStrengths].sort((a, b) => b.strength - a.strength);
  const topStrong = sortedTopics.slice(0, 3);
  const topWeak = [...topicStrengths].sort((a, b) => a.strength - b.strength).slice(0, 3);

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

  // User progress API call
  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        console.log('Dashboard: Starting user progress fetch...');
        const userId = 'user123'; // TODO: Get from auth context
        const response = await getUserProgress(userId);
        console.log('Dashboard: User progress response:', response);

        // Safely calculate totals from the progress data
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid progress data format');
        }

        // Calculate totals from the progress data
        const totalSolved = response.data.filter((item: any) => item.status === 'solved').length;
        const totalAttempted = response.data.length;

        console.log('Dashboard: ✅ Calculated totals - Solved:', totalSolved, 'Attempted:', totalAttempted);

        setUserProgress({
          status: 'success',
          data: {
            totalSolved,
            totalAttempted,
          },
        });
      } catch (error: any) {
        console.error('Dashboard: ❌ User progress fetch failed:', error.message || error);
        setUserProgress({
          status: 'error',
          error: error.response?.data?.message || error.message || 'Failed to fetch user progress',
        });
      }
    };

    fetchUserProgress();
  }, []);

  // Weak topics API call
  useEffect(() => {
    const fetchWeakTopics = async () => {
      try {
        console.log('Dashboard: Starting weak topics fetch...');
        const userId = 'user123'; // TODO: Get from auth context
        const response = await getWeakTopics(userId);
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
  }, []);

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
              {userStats.name.split(" ")[0]}, let's conquer today! 🚀
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              You're on a{" "}
              <span style={{ color: '#ff6500', fontWeight: 700 }}>{userStats.streak}-day streak</span>
              {" "}— Rank{" "}
              <span style={{ color: '#a855f7', fontWeight: 700 }}>#{userStats.rank.toLocaleString()}</span>
              {" "}globally. Keep it up!
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
        <StatCard icon={Code2} label="Problems Solved" value={String(displayTotalSolved)} sub={`/ 200 target`} color="#00d4ff" delay={0} />
        <StatCard icon={Target} label="Problems Attempted" value={String(displayTotalAttempted)} sub="Total attempts" color="#22c55e" delay={1} />
        <StatCard icon={Flame} label="Current Streak" value={`${userStats.streak}d`} sub="Personal best: 12d" color="#ff6500" delay={2} />
        <StatCard icon={Trophy} label="Global Rank" value={`#${userStats.rank.toLocaleString()}`} sub="Top 15%" color="#f59e0b" delay={3} />
      </div>

      {/* User Progress Status Indicator */}
      <div className="flex items-center gap-2 justify-center">
        {userProgress.status === 'loading' && (
          <>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span style={{ fontSize: '11px', color: '#60a5fa' }}>Loading user progress...</span>
          </>
        )}
        {userProgress.status === 'success' && (
          <>
            <CheckCircle2 className="w-3 h-3" style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '11px', color: '#22c55e' }}>
              Progress data loaded
            </span>
          </>
        )}
        {userProgress.status === 'error' && (
          <>
            <AlertTriangle className="w-3 h-3" style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '11px', color: '#ef4444' }}>
              Progress: {userProgress.error || 'Failed to load'}
            </span>
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
                <span className="text-white" style={{ fontSize: '24px', fontWeight: 800 }}>{userStats.totalSolved}</span>
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
                    animate={{ width: `${(value / userStats.totalSolved) * 100}%` }}
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
                background: 'rgba(245,158,11,0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)'
              }}
            >
              {dailyChallenge.difficulty}
            </span>
          </div>

          <div className="flex-1 relative">
            <h4 className="text-white mb-2" style={{ fontSize: '17px', fontWeight: 800 }}>{dailyChallenge.title}</h4>
            <div className="flex gap-2 flex-wrap mb-3">
              {dailyChallenge.tags.map(t => (
                <span
                  key={t}
                  className="rounded-md px-2 py-0.5"
                  style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {t}
                </span>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>{dailyChallenge.description}</p>
          </div>

          <div className="mt-4 space-y-3 relative">
            <div className="flex items-center justify-between" style={{ fontSize: '11px', color: '#4a5568' }}>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 25 min</span>
              <span style={{ color: '#22c55e' }}>🔥 {dailyChallenge.totalSolved} solved today</span>
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
          <AreaChart data={weeklyData}>
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
            <Tooltip
              contentStyle={{ background: '#0f1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
              labelStyle={{ color: '#fff', fontWeight: 700 }}
            />
            <Area type="monotone" dataKey="solved" stroke="#ff6500" strokeWidth={2} fill="url(#solvedGrad)" dot={{ fill: '#ff6500', r: 3 }} name="Solved" />
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
            <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>Activity Heatmap</h3>
            <span style={{ fontSize: '11px', color: '#4a5568' }}>Last 12 weeks</span>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {activityData.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((count, di) => (
                  <motion.div
                    key={di}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: (wi * 7 + di) * 0.008 }}
                    className="w-3 h-3 rounded-sm flex-shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: count === 0 ? 'rgba(255,255,255,0.04)' : count === 1 ? 'rgba(255,101,0,0.3)' : '#ff6500',
                      boxShadow: count === 2 ? '0 0 6px rgba(255,101,0,0.5)' : 'none'
                    }}
                    whileHover={{ scale: 1.5 }}
                    title={`${count} problems`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span style={{ fontSize: '10px', color: '#4a5568' }}>Less</span>
            {[0, 1, 2].map(v => (
              <div
                key={v}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: v === 0 ? 'rgba(255,255,255,0.04)' : v === 1 ? 'rgba(255,101,0,0.3)' : '#ff6500',
                  boxShadow: v === 2 ? '0 0 6px rgba(255,101,0,0.5)' : 'none'
                }}
              />
            ))}
            <span style={{ fontSize: '10px', color: '#4a5568' }}>More</span>
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
            {roadmap.slice(0, 5).map((day, i) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.7 }}
                className="flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer group"
                style={{
                  background: day.completed ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                  border: day.completed ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.06)'
                }}
                whileHover={{ x: 4 }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: day.completed ? '#22c55e' : 'rgba(255,255,255,0.06)',
                    boxShadow: day.completed ? '0 0 12px rgba(34,197,94,0.4)' : 'none'
                  }}
                >
                  {day.completed
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>{day.day}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate" style={{ fontSize: '12px', fontWeight: 600 }}>Day {day.day}: {day.topic}</div>
                  <div className="truncate" style={{ fontSize: '10px', color: '#4a5568' }}>{day.problems.join(", ")}</div>
                </div>
                <span
                  className="rounded-lg px-2 py-0.5 flex-shrink-0"
                  style={{
                    fontSize: '10px', fontWeight: 600,
                    background: day.difficulty === "Easy" ? 'rgba(34,197,94,0.1)' : day.difficulty === "Medium" ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    color: day.difficulty === "Easy" ? '#22c55e' : day.difficulty === "Medium" ? '#f59e0b' : '#ef4444'
                  }}
                >
                  {day.difficulty}
                </span>
              </motion.div>
            ))}
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
            Continue Day 5 <ChevronRight className="w-3.5 h-3.5" />
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
          {recentProblems.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 + 0.8 }}
              onClick={() => navigate(`/problems/${p.id}`)}
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
                  {p.title}
                </div>
                <div className="flex gap-2 mt-0.5">
                  {p.tags.slice(0, 2).map(t => (
                    <span key={t} style={{ fontSize: '10px', color: '#4a5568' }}>{t}</span>
                  ))}
                </div>
              </div>
              <span
                style={{
                  fontSize: '10px', fontWeight: 700, flexShrink: 0,
                  color: p.difficulty === "Easy" ? '#22c55e' : p.difficulty === "Medium" ? '#f59e0b' : '#ef4444'
                }}
              >
                {p.difficulty}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

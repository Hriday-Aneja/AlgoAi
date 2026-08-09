import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, CheckCircle2, Clock, Bookmark,
  ChevronRight, Code2, Globe, Brain, Database, Cpu, Layout,
  Filter, Zap, TrendingUp
} from "lucide-react";
import { problems, type Domain, type Difficulty, type Status, type Problem } from "../data/mockData";
import { useUserProgress } from "../contexts/UserProgressContext";
import { useAuth } from "../contexts/AuthContext";
import { getAllProblems, getUserProgress, type ProgressRecord } from "../../services/api";

const domainTabs: { id: Domain | "All"; label: string; icon: any; color: string }[] = [
  { id: "All", label: "All", icon: Zap, color: "#ff6500" },
  { id: "DSA", label: "DSA", icon: Code2, color: "#ff6500" },
];

const diffColors: Record<Difficulty, { text: string; bg: string; border: string }> = {
  Easy: { text: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
  Medium: { text: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  Hard: { text: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
};

const statusConfig: Record<Status, { icon: any; color: string; bg: string }> = {
  solved: { icon: CheckCircle2, color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  attempted: { icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  bookmarked: { icon: Bookmark, color: "#00d4ff", bg: "rgba(0,212,255,0.15)" },
  unsolved: { icon: Code2, color: "#4a5568", bg: "rgba(255,255,255,0.04)" },
};

export default function Problems() {
  const navigate = useNavigate();
  const { progress } = useUserProgress();
  const { user } = useAuth();
  const [backendProblems, setBackendProblems] = useState<Problem[]>(problems);
  const [backendProgress, setBackendProgress] = useState<ProgressRecord[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [problemError, setProblemError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [domain, setDomain] = useState<Domain | "All">("All");
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [status, setStatus] = useState<Status | "All">("All");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => {
    const loadBackendData = async () => {
      if (!user?.id) return;

      setLoadingProblems(true);
      setLoadingProgress(true);
      setProblemError(null);
      setProgressError(null);

      try {
        const [problemResponse, progressResponse] = await Promise.all([
          getAllProblems(),
          getUserProgress(user.id),
        ]);

        setBackendProblems(
  (problemResponse.data ?? problems).map((p: any) => ({
    ...p,
    domain: p.domain ?? p.topic ?? "DSA",
  }))
);
        setLoadingProblems(false);

        setBackendProgress(progressResponse.data ?? []);
        setLoadingProgress(false);
      } catch (error: any) {
        if (error?.response?.config?.url?.includes('/problems')) {
          setProblemError(error.message || 'Failed to load problems');
          setLoadingProblems(false);
        } else {
          setProgressError(error.message || 'Failed to load progress');
          setLoadingProgress(false);
        }
        console.error('Problems: backend load failed', error);
      }
    };

    loadBackendData();
  }, [user?.id]);

  const defaultStatus: Status = "unsolved";
  const problemStatusMap = new Map<string, string>((backendProgress || []).map((record) => [record.problem_id, record.status]));
  const problemsWithStatus = (backendProblems || []).map((p) => ({
    ...p,
    status: ((problemStatusMap.get(p.id) as Status) ?? progress?.problemStatus?.[p.id] ?? p.status) as Status || defaultStatus,
  }));

  const allTags = Array.from(new Set((problemsWithStatus || []).flatMap(p => p?.tags || [])));

  const filtered = (problemsWithStatus || []).filter(p => {
    if (domain !== "All" && p?.domain !== domain) return false;
    if (difficulty !== "All" && p?.difficulty !== difficulty) return false;
    if (status !== "All" && (p?.status || defaultStatus) !== status) return false;
    if (tagFilter && !(p?.tags || []).includes(tagFilter)) return false;
    if (search && !p?.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: (problemsWithStatus || []).length,
    solved: (problemsWithStatus || []).filter(p => p?.status === "solved").length,
    attempted: (problemsWithStatus || []).filter(p => p?.status === "attempted").length,
    easy: (problemsWithStatus || []).filter(p => p?.difficulty === "Easy" && p?.status === "solved").length,
    medium: (problemsWithStatus || []).filter(p => p?.difficulty === "Medium" && p?.status === "solved").length,
    hard: (problemsWithStatus || []).filter(p => p?.difficulty === "Hard" && p?.status === "solved").length,
  };

  const selectStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#6b7280',
    borderRadius: '12px',
    padding: '8px 12px',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-white mb-1" style={{ fontSize: '22px', fontWeight: 800 }}>Problems</h1>
        <p style={{ fontSize: '13px', color: '#4a5568' }}>
          Master DSA questions from a single curated dataset
        </p>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5"
      >
        {[
          { label: "Total", value: stats.total, color: "#ff6500" },
          { label: "Solved", value: stats.solved, color: "#22c55e" },
          { label: "Attempted", value: stats.attempted, color: "#f59e0b" },
          { label: "Easy ✓", value: stats.easy, color: "#22c55e" },
          { label: "Medium ✓", value: stats.medium, color: "#f59e0b" },
          { label: "Hard ✓", value: stats.hard, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{ background: `${color}08`, border: `1px solid ${color}20` }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Domain Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {domainTabs.map(({ id, label, icon: Icon, color }) => (
          <motion.button
            key={id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setDomain(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all flex-shrink-0"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              background: domain === id ? `${color}15` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${domain === id ? color + '40' : 'rgba(255,255,255,0.06)'}`,
              color: domain === id ? color : '#6b7280',
              boxShadow: domain === id ? `0 0 15px ${color}20` : 'none'
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </motion.button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a5568' }} />
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl pl-9 pr-4 py-2 text-white placeholder-[#4a5568] focus:outline-none transition-all"
            style={{
              fontSize: '13px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(255,101,0,0.4)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,101,0,0.08)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} style={selectStyle}>
          <option value="All">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value as any)} style={selectStyle}>
          <option value="All">All Status</option>
          <option value="solved">Solved</option>
          <option value="attempted">Attempted</option>
          <option value="unsolved">Unsolved</option>
          <option value="bookmarked">Bookmarked</option>
        </select>
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={selectStyle}>
          <option value="">All Tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Problem Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        {/* Table Header */}
        <div
          className="grid gap-4 px-5 py-3"
          style={{
            gridTemplateColumns: '36px 1fr 100px 90px 80px 50px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)'
          }}
        >
          {['', 'Title', 'Domain', 'Difficulty', 'Accept.', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="py-20 text-center" style={{ color: '#4a5568', fontSize: '14px' }}>
              <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
              No problems found. Try adjusting your filters.
            </div>
          ) : (
            filtered.map((problem, idx) => {
              const safeStatus = (problem.status && statusConfig[problem.status]) ? problem.status : defaultStatus;
              const sc = statusConfig[safeStatus];
              const dc = diffColors[problem.difficulty] || diffColors.Easy;
              const StatusIcon = sc?.icon ?? Code2;
              return (
                <motion.div
                  key={problem.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => navigate(`/problems/${problem.id}`)}
                  className="grid gap-4 px-5 py-3.5 items-center cursor-pointer group transition-all"
                  style={{
                    gridTemplateColumns: '36px 1fr 100px 90px 80px 50px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: idx % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent'
                  }}
                  whileHover={{ backgroundColor: 'rgba(255,101,0,0.04)' }}
                >
                  {/* Status */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: sc?.bg || 'rgba(255,255,255,0.04)' }}
                  >
                    <StatusIcon className="w-4 h-4" style={{ color: sc?.color || '#4a5568' }} />
                  </div>

                  {/* Title + Tags */}
                  <div className="min-w-0">
                    <div
                      className="truncate transition-colors"
                      style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}
                    >
                      <span className="group-hover:text-[#ff6500] transition-colors">
                        #{problem.id} {problem.title}
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {(problem.tags || []).slice(0, 2).map(t => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded"
                          style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: '#4a5568', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Domain */}
                  <div className="hidden sm:block">
                    <span
                      className="px-2 py-1 rounded-lg"
                      style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {problem.domain}
                    </span>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <span
                      className="px-2 py-1 rounded-lg"
                      style={{ fontSize: '11px', fontWeight: 700, background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}
                    >
                      {problem.difficulty}
                    </span>
                  </div>

                  {/* Acceptance */}
                  <div className="hidden md:block" style={{ fontSize: '12px', color: '#4a5568' }}>
                    {problem.acceptance}%
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-end">
                    <ChevronRight
                      className="w-4 h-4 transition-all group-hover:translate-x-1"
                      style={{ color: '#4a5568' }}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      <div className="mt-3 text-center" style={{ fontSize: '12px', color: '#4a5568' }}>
        Showing <span style={{ color: '#ff6500', fontWeight: 700 }}>{filtered.length}</span> of {backendProblems.length} problems
      </div>
    </div>
  );
}

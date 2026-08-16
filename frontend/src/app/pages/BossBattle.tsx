import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Zap, Clock, Star, Trophy, X, Play,
  ChevronRight, Flame, Crown, Swords, AlertTriangle, CheckCircle2, RefreshCw, Code
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { getTodayBosses, submitBossBattle, BossAssignment } from "../../services/api";

type Screen = "intro" | "battle" | "result";

const BOSS_THEMES = [
  {
    level: "EASY",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.4)",
    bg: "rgba(34,197,94,0.08)",
    avatar: "👾",
    hp: 100,
    timeLimit: 300,
  },
  {
    level: "MEDIUM",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.4)",
    bg: "rgba(245,158,11,0.08)",
    avatar: "🌲",
    hp: 100,
    timeLimit: 300,
  },
  {
    level: "HARD",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    bg: "rgba(239,68,68,0.08)",
    avatar: "🕸️",
    hp: 100,
    timeLimit: 300,
  },
];

const renderJsonList = (value: unknown): string[] => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return item;
      try {
        return JSON.stringify(item);
      } catch {
        return String(item);
      }
    });
  }
  if (typeof value === 'string') {
    return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }
  try {
    return [JSON.stringify(value)];
  } catch {
    return [String(value)];
  }
};

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
  const [code, setCode] = useState('');
  const [bossHp, setBossHp] = useState(100);
  const [bossMaxHp, setBossMaxHp] = useState(100);
  const [won, setWon] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [viewingDefeated, setViewingDefeated] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [bosses, setBosses] = useState<BossAssignment[]>([]);
  const [loadingBosses, setLoadingBosses] = useState(true);
  const [bossError, setBossError] = useState<string | null>(null);
  const [battleError, setBattleError] = useState<string | null>(null);
  const [attackEffect, setAttackEffect] = useState<'none' | 'hit' | 'miss'>('none');
  const intervalRef = useRef<any>(null);

  const battle = bosses[selectedBoss] ?? null;
  const theme = BOSS_THEMES[selectedBoss];
  const bossName = battle?.name ?? '';
  const hints = HINTS_PER_BOSS[selectedBoss];
  const maxHints = Math.min(hints.length, 2);
  const xp = Math.max(0, score - hintsUsed * 20);
  const bossRewards: Record<string, number> = {
    easy: 100,
    medium: 150,
    hard: 200,
  };

  useEffect(() => {
    const fetchBosses = async () => {
      try {
        setLoadingBosses(true);
        const response = await getTodayBosses();
        setBosses(response.data.bosses);
        if (response.data.bosses.length > 0) {
          const first = response.data.bosses[0];
          setCode(first.problem.starterCode ?? '');
          setSelectedBoss(0);
          setTimer(300);
          setBossHp(first.hp);
          setBossMaxHp(first.hp);
        }
      } catch (error) {
        setBossError('Unable to load today\'s boss assignments. Please try again later.');
      } finally {
        setLoadingBosses(false);
      }
    };

    fetchBosses();
  }, []);

  useEffect(() => {
    if (screen === "battle" && timer > 0 && !submitted) {
      intervalRef.current = setInterval(() => setTimer(t => {
        if (t <= 1) { clearInterval(intervalRef.current); setScreen("result"); setWon(false); return 0; }
        return t - 1;
      }), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [screen, submitted, timer]);

  const viewDefeatedBoss = (bossIdx: number) => {
    const assignment = bosses[bossIdx];
    if (!assignment) return;

    const totalTests = assignment.problem.testCases?.length ?? 0;

    setSelectedBoss(bossIdx);
    setViewingDefeated(true);
    setWon(true);
    setBattleResult({
      passed: true,
      testsPassed: totalTests,
      totalTests,
      feedback: 'You already defeated this boss. It cannot be challenged again.',
      hp: 0,
      defeated: true,
    });
    setBossHp(0);
    setBossMaxHp(assignment.hp || 100);
    setScreen("result");
  };

  const startBattle = (bossIdx: number) => {
    const assignment = bosses[bossIdx];
    if (!assignment) {
      setBattleError('Boss assignment is not loaded yet.');
      return;
    }

    if (assignment.defeated) {
      viewDefeatedBoss(bossIdx);
      return;
    }

    setSelectedBoss(bossIdx);
    setCode(assignment.problem.starterCode ?? '');
    setTimer(BOSS_THEMES[bossIdx]?.timeLimit ?? 300);
    setBossHp(assignment.hp);
    setBossMaxHp(assignment.hp);
    setScore(0);
    setHintsUsed(0);
    setShowHint(false);
    setSubmitted(false);
    setWon(false);
    setViewingDefeated(false);
    setBattleResult(null);
    setBattleError(null);
    setScreen("battle");
  };

  const submitCode = async () => {
    clearInterval(intervalRef.current);
    setSubmitted(true);
    setBattleError(null);

    const assignment = bosses[selectedBoss];
    if (!assignment) {
      setBattleError('No boss assignment selected.');
      setSubmitted(false);
      return;
    }

    try {
      const response = await submitBossBattle(
        assignment.id,
        code,
        'javascript',
      );

      const outer = response ?? {};
      const inner = (outer.data ?? outer) as any;
      const result = inner.data ?? inner;
      setBattleResult(result);
      setScore(result.testsPassed * 100);
      setWon(result.passed);
      setAttackEffect(result.passed ? 'hit' : 'miss');
      setTimeout(() => setAttackEffect('none'), 700);
      if (result.defeated) {
        setBossHp(0);
        setBosses(prev => prev.map((b, i) => (i === selectedBoss ? { ...b, defeated: true, hp: 0 } : b)));
      }
      setTimeout(() => setScreen("result"), 1500);
    } catch (error) {
      setBattleError('Submission failed. Please try again.');
      setSubmitted(false);
      setScreen("result");
    }
  };

  const runTests = async () => {
    setBattleError(null);
    const assignment = bosses[selectedBoss];
    if (!assignment) {
      setBattleError('No boss assignment selected.');
      return;
    }

    try {
      const response = await submitBossBattle(
        assignment.id,
        code,
        'javascript',
        true, // testOnly
      );

      const outer = response ?? {};
      const inner = (outer.data ?? outer) as any;
      const result = inner.data ?? inner;
      setBattleResult(result);
      setScore(result.testsPassed * 100);
    } catch (error) {
      setBattleError('Run tests failed. Please try again.');
    }
  };

  const useHint = () => {
    if (hintsUsed < maxHints) {
      setHintsUsed(h => h + 1);
      setShowHint(true);
      setBossMaxHp(m => m + 20);
      setBossHp(hp => hp + 20);
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl items-stretch">
              {loadingBosses ? (
                <div className="col-span-3 text-center text-white/80">Loading today&apos;s bosses...</div>
              ) : bossError ? (
                <div className="col-span-3 text-center text-red-400">{bossError}</div>
              ) : bosses.length === 0 ? (
                <div className="col-span-3 text-center text-white/80">No boss assignments are available today.</div>
              ) : (
                bosses.map((b, i) => {
                  const t = BOSS_THEMES[i] ?? BOSS_THEMES[0];
                  const isDefeated = b.defeated;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15 + 0.3 }}
                      whileHover={{ scale: 1.03, y: -6 }}
                      className="relative overflow-hidden rounded-2xl p-6 cursor-pointer flex flex-col h-full"
                      style={{
                        background: t.bg,
                        border: `1px solid ${isDefeated ? 'rgba(255,255,255,0.1)' : `${t.color}30`}`,
                        boxShadow: `0 0 30px ${t.glow}15`,
                        opacity: isDefeated ? 0.7 : 1,
                      }}
                      onClick={() => startBattle(i)}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: t.color, filter: 'blur(20px)' }} />

                      <div className="flex-1">
                        <div className="text-center mb-4">
                          <div style={{ fontSize: '48px', filter: isDefeated ? 'grayscale(1)' : `drop-shadow(0 0 10px ${t.glow})` }}>{t.avatar}</div>
                          <div className="text-white mt-2" style={{ fontSize: '17px', fontWeight: 800 }}>{b.name}</div>
                          <div
                            className="inline-block px-3 py-0.5 rounded-full mt-1"
                            style={{ fontSize: '10px', fontWeight: 800, background: `${t.color}20`, color: t.color, border: `1px solid ${t.color}40` }}
                          >
                            {t.level} - {b.difficulty}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span style={{ fontSize: '11px', color: '#4a5568' }}>HP</span>
                            <span style={{ fontSize: '11px', color: isDefeated ? '#4a5568' : t.color, fontWeight: 700 }}>{b.hp}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full" style={{ width: `${b.hp}%`, background: isDefeated ? '#4a5568' : t.color, boxShadow: isDefeated ? 'none' : `0 0 8px ${t.color}` }} />
                          </div>
                          <div className="flex justify-between mt-3">
                            {isDefeated ? (
                              <span className="flex items-center gap-1" style={{ fontSize: '11px', color: '#22c55e', fontWeight: 700 }}>
                                <CheckCircle2 className="w-3 h-3" /> Defeated
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#4a5568' }}>⏱ {Math.floor(t.timeLimit / 60)}:{String(t.timeLimit % 60).padStart(2,'0')}</span>
                            )}
                            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>⭐ {bossRewards[b.difficulty] ?? 0} XP</span>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="w-full mt-4 py-2 rounded-xl flex items-center justify-center gap-2 cyber-btn"
                        style={{
                          background: isDefeated ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${t.color}, ${t.color}99)`,
                          color: isDefeated ? '#9ca3af' : 'white',
                          fontSize: '13px', fontWeight: 700,
                          boxShadow: isDefeated ? 'none' : `0 0 20px ${t.glow}30`,
                          border: isDefeated ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        }}
                      >
                        {isDefeated ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Defeated
                          </>
                        ) : (
                          <>
                            <Swords className="w-4 h-4" />
                            Fight!
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  );
                })
              )}
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
            className="h-full flex flex-col relative overflow-hidden"
          >
            {/* Ambient combat backdrop */}
            <div className="absolute inset-0 cyber-grid-animated opacity-10 pointer-events-none" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, transparent 35%, #080b14 92%)` }}
            />
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${theme.color}, transparent)`,
                boxShadow: `0 0 12px ${theme.color}`,
                opacity: 0.25,
                animation: 'scan-line 5s linear infinite',
              }}
            />

            {/* Attack/hit flash */}
            <AnimatePresence>
              {attackEffect !== 'none' && (
                <motion.div
                  key="attack-flash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, attackEffect === 'hit' ? 0.35 : 0.5, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    background: attackEffect === 'hit'
                      ? 'radial-gradient(circle at 15% 20%, rgba(34,197,94,0.55), transparent 60%)'
                      : 'radial-gradient(circle at center, rgba(239,68,68,0.55), transparent 70%)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Battle Header */}
            <div
              className="flex items-center justify-between px-6 py-3 flex-shrink-0 relative"
              style={{
                background: `linear-gradient(90deg, ${theme.bg}, transparent)`,
                borderBottom: `1px solid ${theme.color}25`
              }}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="relative w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `radial-gradient(circle, ${theme.bg}, transparent)`,
                    border: `2px solid ${theme.color}`,
                    boxShadow: `0 0 20px ${theme.glow}`,
                  }}
                  animate={
                    attackEffect === 'miss'
                      ? { x: [0, -10, 10, -8, 8, -4, 4, 0] }
                      : attackEffect === 'hit'
                        ? { scale: [1, 1.25, 0.95, 1.05, 1] }
                        : { y: [0, -3, 0] }
                  }
                  transition={attackEffect === 'none' ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5 }}
                >
                  <span className="text-2xl">{theme.avatar}</span>
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white" style={{ fontSize: '16px', fontWeight: 800 }}>{bossName}</span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ fontSize: '10px', fontWeight: 700, background: `${theme.color}20`, color: theme.color }}
                    >
                      {theme.level}
                    </span>
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full pulse-animation" style={{ background: '#ef4444' }} />
                      LIVE BATTLE
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ fontSize: '11px', color: '#4a5568' }}>Boss HP:</span>
                    <div className="w-40 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        animate={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${theme.color}, ${theme.color}aa)`, boxShadow: `0 0 8px ${theme.glow}` }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: theme.color, fontWeight: 700 }}>{bossHp}/{bossMaxHp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" style={{ color: '#f59e0b' }} />
                  <span className="text-white" style={{ fontSize: '13px', fontWeight: 700 }}>{xp.toLocaleString()} XP</span>
                </div>
                <CountdownTimer seconds={timer} color={theme.color} />
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
                className="w-96 flex-shrink-0 p-5 overflow-y-auto relative z-10"
                style={{
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(8,11,20,0.92)',
                }}
              >
                <h2 className="text-white mb-3" style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.3 }}>{battle?.problem.title ?? 'Loading problem…'}</h2>
                <p style={{ fontSize: '14px', color: '#c4c9d4', lineHeight: 1.75, marginBottom: '16px' }}>
                  {battle?.problem.description ?? 'Solve the assigned boss problem using your code editor.'}
                </p>

                {renderJsonList(battle?.problem.examples).length > 0 && (
                  <div className="mb-4">
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      Examples
                    </div>
                    {renderJsonList(battle?.problem.examples).map((line, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl font-mono mb-2"
                        style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#c4c9d4', lineHeight: 1.6, wordBreak: 'break-word' }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                )}

                {renderJsonList(battle?.problem.constraints).length > 0 && (
                  <div className="mb-4">
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      Constraints
                    </div>
                    <ul className="list-disc pl-4" style={{ fontSize: '12px', color: '#c4c9d4', lineHeight: 1.7 }}>
                      {renderJsonList(battle?.problem.constraints).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mb-4">
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ff6500', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Test Cases ({battle?.problem.testCases?.length ?? 0})
                  </div>
                  {battle?.problem.testCases?.slice(0, 3).map((tc, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl font-mono mb-2"
                      style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#c4c9d4', lineHeight: 1.6 }}
                    >
                      <div style={{ color: '#6b7280', marginBottom: '4px' }}>Test {i + 1}</div>
                      <div>Input: {String(tc.input)}</div>
                      <div>Expected: {String(tc.output)}</div>
                    </div>
                  ))}
                  {(battle?.problem.testCases?.length ?? 0) > 3 && (
                    <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
                      +{(battle?.problem.testCases?.length ?? 0) - 3} more test cases hidden
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Problem Details
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-1 rounded-full" style={{ background: '#6b7280' }} />
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Difficulty: {battle?.difficulty ?? 'medium'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-1 rounded-full" style={{ background: '#6b7280' }} />
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Max Score: {bossRewards[battle?.difficulty ?? 'medium']} XP</span>
                  </div>
                </div>

                {/* Hint Button */}
                <button
                  onClick={useHint}
                  disabled={hintsUsed >= maxHints}
                  className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 mb-3 transition-all cyber-btn"
                  style={{
                    background: hintsUsed >= maxHints ? 'rgba(255,255,255,0.04)' : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${hintsUsed >= maxHints ? 'rgba(255,255,255,0.06)' : 'rgba(245,158,11,0.3)'}`,
                    color: hintsUsed >= maxHints ? '#4a5568' : '#f59e0b',
                    fontSize: '13px', fontWeight: 600
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Use Hint ({maxHints - hintsUsed} left, -20 XP)
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
                <div className="flex-1 min-h-0">
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
                      automaticLayout: true,
                    }}
                  />
                </div>
                <div
                  className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', position: 'relative', zIndex: 10 }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full pulse-animation"
                      style={{ background: theme.color, boxShadow: `0 0 6px ${theme.color}` }}
                    />
                    <span style={{ fontSize: '12px', color: '#4a5568' }}>Battle in progress...</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={runTests}
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
                        background: `linear-gradient(135deg, ${theme.color}, ${theme.color}aa)`,
                        color: 'white', fontSize: '13px', fontWeight: 700,
                        boxShadow: `0 0 20px ${theme.glow}30`
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
                {won ? (viewingDefeated ? 'ALREADY DEFEATED' : 'VICTORY!') : 'DEFEATED!'}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}
              >
                {won
                  ? (viewingDefeated ? `You have already defeated ${bossName}.` : `You defeated ${bossName}!`)
                  : `${bossName} was too powerful this time!`}
              </motion.p>

              {battleResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-8 text-left"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}
                >
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '4px' }}>Tests Passed</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e' }}>
                        {battleResult.testsPassed}/{battleResult.totalTests}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '4px' }}>{viewingDefeated ? 'Boss HP' : 'XP Earned'}</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>
                        {viewingDefeated ? '0 HP' : `+${battleResult.defeated ? battleResult.xpGained : 0} XP`}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6, padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    {battleResult.feedback}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex gap-4 justify-center"
              >
                {!viewingDefeated && (
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
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setViewingDefeated(false); setScreen("intro"); }}
                  className="px-6 py-3 rounded-xl flex items-center gap-2 cyber-btn"
                  style={{
                    background: `linear-gradient(135deg, ${theme.color}, ${theme.color}88)`,
                    color: 'white', fontSize: '14px', fontWeight: 700,
                    boxShadow: `0 0 20px ${theme.glow}40`
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
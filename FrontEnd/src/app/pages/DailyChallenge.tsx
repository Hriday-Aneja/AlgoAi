import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Flame, Clock, CheckCircle2, Trophy, Target, Play, ChevronRight, Star, Zap } from "lucide-react";
import { dailyChallenge, userStats } from "../data/mockData";

const weekStreak = [
  { day: "Mon", done: true },
  { day: "Tue", done: true },
  { day: "Wed", done: true },
  { day: "Thu", done: true },
  { day: "Fri", done: false },
  { day: "Sat", done: false },
  { day: "Sun", done: false },
];

export default function DailyChallenge() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(dailyChallenge.timeLimit);
  const [timerActive, setTimerActive] = useState(false);
  const [solved, setSolved] = useState(false);
  const [code, setCode] = useState(`function longestPalindrome(s: string): string {
    // Your code here
    // Hint: Try expanding around center
};`);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timePct = (timeLeft / dailyChallenge.timeLimit) * 100;

  const handleSubmit = () => {
    setSolved(true);
    setTimerActive(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: '22px', fontWeight: 700 }}>Daily Challenge</h1>
            <p className="text-[#8b949e]" style={{ fontSize: '13px' }}>April 9, 2026 · Stay consistent! 🔥</p>
          </div>
        </div>
      </div>

      {/* Streak Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-white" style={{ fontSize: '16px', fontWeight: 700 }}>{userStats.streak} Day Streak</span>
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full px-3 py-0.5" style={{ fontSize: '11px' }}>🔥 On Fire!</span>
          </div>
          <div className="text-[#8b949e]" style={{ fontSize: '12px' }}>Total: {userStats.totalSolved} solved</div>
        </div>
        <div className="flex gap-2">
          {weekStreak.map(({ day, done }) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-full h-10 rounded-lg flex items-center justify-center ${done ? "bg-orange-500" : "bg-[#21262d] border border-[#30363d]"}`}>
                {done && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
              <span className={`${done ? "text-orange-400" : "text-[#8b949e]"}`} style={{ fontSize: '11px' }}>{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {!solved ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Problem */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
              <div>
                <h2 className="text-white" style={{ fontSize: '16px', fontWeight: 700 }}>{dailyChallenge.title}</h2>
                <div className="flex gap-2 mt-1">
                  <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md px-2 py-0.5" style={{ fontSize: '11px' }}>{dailyChallenge.difficulty}</span>
                  {dailyChallenge.tags.map(t => (
                    <span key={t} className="bg-[#21262d] text-[#8b949e] rounded-md px-2 py-0.5" style={{ fontSize: '10px' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[#c9d1d9] mb-4" style={{ fontSize: '13px', lineHeight: 1.7 }}>{dailyChallenge.description}</p>
              {dailyChallenge.examples.map((ex, i) => (
                <div key={i} className="bg-[#21262d] border border-[#30363d] rounded-lg p-3 mb-3">
                  <div className="mb-1.5">
                    <span className="text-[#8b949e]" style={{ fontSize: '11px' }}>Input: </span>
                    <code className="text-green-300" style={{ fontSize: '12px', fontFamily: 'monospace' }}>{ex.input}</code>
                  </div>
                  <div className="mb-1.5">
                    <span className="text-[#8b949e]" style={{ fontSize: '11px' }}>Output: </span>
                    <code className="text-blue-300" style={{ fontSize: '12px', fontFamily: 'monospace' }}>{ex.output}</code>
                  </div>
                  {ex.explanation && (
                    <p className="text-[#8b949e]" style={{ fontSize: '11px' }}>{ex.explanation}</p>
                  )}
                </div>
              ))}

              {/* Timer */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8b949e]" />
                    <span className={`font-mono ${timePct < 25 ? "text-red-400" : timePct < 50 ? "text-yellow-400" : "text-white"}`} style={{ fontSize: '18px', fontWeight: 800 }}>
                      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                    </span>
                  </div>
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${timerActive ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"}`}
                    style={{ fontSize: '12px' }}
                  >
                    {timerActive ? "⏸ Pause" : "▶ Start Timer"}
                  </button>
                </div>
                <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${timePct < 25 ? "bg-red-500" : timePct < 50 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${timePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#30363d] flex items-center gap-3">
              <span className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>Code Editor</span>
              <select className="ml-auto bg-[#21262d] border border-[#30363d] rounded-md px-2 py-1 text-white focus:outline-none" style={{ fontSize: '11px' }}>
                <option>TypeScript</option>
                <option>Python</option>
                <option>JavaScript</option>
              </select>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className="flex-1 bg-[#0d1117] text-green-300 p-4 focus:outline-none resize-none"
              style={{ fontSize: '13px', fontFamily: 'monospace', lineHeight: 1.8, minHeight: '300px' }}
              spellCheck={false}
            />
            <div className="flex gap-3 p-3 border-t border-[#30363d]">
              <button
                className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white rounded-lg px-4 py-2 transition-colors"
                style={{ fontSize: '13px' }}
              >
                <Play className="w-4 h-4" /> Run Tests
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 flex items-center justify-center gap-2 transition-colors"
                style={{ fontSize: '13px', fontWeight: 700 }}
              >
                <Zap className="w-4 h-4" /> Submit Solution
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Success Screen */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-white mb-2" style={{ fontSize: '24px', fontWeight: 800 }}>Challenge Complete! 🎉</h2>
          <p className="text-[#8b949e] mb-6" style={{ fontSize: '14px' }}>You solved today's challenge. Streak extended to {userStats.streak + 1} days!</p>

          <div className="flex gap-4 mb-8">
            {[
              { label: "XP Earned", value: "+50 XP", color: "text-purple-400", bg: "bg-purple-500/10" },
              { label: "Streak", value: `🔥 ${userStats.streak + 1}d`, color: "text-orange-400", bg: "bg-orange-500/10" },
              { label: "Time Used", value: `${25 - mins}m ${60 - secs}s`, color: "text-blue-400", bg: "bg-blue-500/10" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} border border-[#30363d] rounded-xl p-4 text-center w-28`}>
                <div className={`${color} mb-1`} style={{ fontSize: '16px', fontWeight: 800 }}>{value}</div>
                <div className="text-[#8b949e]" style={{ fontSize: '11px' }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/problems")}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-3 transition-colors"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              Practice More <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white rounded-xl px-6 py-3 transition-colors"
              style={{ fontSize: '14px' }}
            >
              Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Preview */}
      <div className="mt-5 bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white" style={{ fontSize: '15px', fontWeight: 600 }}>Today's Leaderboard</h3>
        </div>
        <div className="space-y-2">
          {[
            { rank: 1, name: "Priya Mehta", time: "4m 32s", emoji: "🥇" },
            { rank: 2, name: "Rohan Kumar", time: "6m 15s", emoji: "🥈" },
            { rank: 3, name: "Aditya Singh", time: "8m 44s", emoji: "🥉" },
            { rank: 47, name: "You (Arjun)", time: "—", emoji: "👤", isYou: true },
          ].map(({ rank, name, time, emoji, isYou }) => (
            <div key={rank} className={`flex items-center gap-3 p-3 rounded-lg ${isYou ? "bg-orange-500/5 border border-orange-500/20" : "bg-[#21262d]"}`}>
              <span className="w-6 text-center" style={{ fontSize: '16px' }}>{emoji}</span>
              <span className="text-[#8b949e] w-6" style={{ fontSize: '12px' }}>#{rank}</span>
              <span className={`flex-1 ${isYou ? "text-orange-400" : "text-white"}`} style={{ fontSize: '13px', fontWeight: isYou ? 700 : 500 }}>{name}</span>
              <span className="text-[#8b949e]" style={{ fontSize: '12px' }}>{time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

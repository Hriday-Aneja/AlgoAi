import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, CheckCircle2, Clock, ChevronRight, Brain, ArrowRight, Zap } from "lucide-react";
import { revisionProblems } from "../data/mockData";

const diffColors: Record<string, string> = {
  Easy: "text-green-400 bg-green-500/10",
  Medium: "text-yellow-400 bg-yellow-500/10",
  Hard: "text-red-400 bg-red-500/10"
};

export default function Revision() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "due">("due");

  const dueProblems = revisionProblems.filter(p => p.dueForRevision);
  const displayProblems = filter === "due" ? dueProblems : revisionProblems;

  const markDone = (id: string) => setCompleted(prev => new Set([...prev, id]));

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white mb-1 flex items-center gap-3" style={{ fontSize: '22px', fontWeight: 700 }}>
          <RefreshCw className="w-6 h-6 text-orange-400" />
          Revision Mode
        </h1>
        <p className="text-[#8b949e]" style={{ fontSize: '14px' }}>Spaced repetition system — review problems at optimal intervals.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#161b22] border border-orange-500/20 rounded-xl p-4 text-center">
          <div className="text-orange-400 mb-1" style={{ fontSize: '24px', fontWeight: 800 }}>{dueProblems.length}</div>
          <div className="text-[#8b949e]" style={{ fontSize: '12px' }}>Due Today</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-center">
          <div className="text-white mb-1" style={{ fontSize: '24px', fontWeight: 800 }}>{revisionProblems.length}</div>
          <div className="text-[#8b949e]" style={{ fontSize: '12px' }}>Total Queued</div>
        </div>
        <div className="bg-[#161b22] border border-green-500/20 rounded-xl p-4 text-center">
          <div className="text-green-400 mb-1" style={{ fontSize: '24px', fontWeight: 800 }}>{completed.size}</div>
          <div className="text-[#8b949e]" style={{ fontSize: '12px' }}>Reviewed Today</div>
        </div>
      </div>

      {/* Spaced Rep Info */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400" style={{ fontSize: '13px', fontWeight: 600 }}>How Spaced Repetition Works</span>
        </div>
        <p className="text-[#8b949e]" style={{ fontSize: '12px', lineHeight: 1.7 }}>
          Problems you've solved appear for review at increasing intervals: 1 day → 7 days → 21 days → 60 days. This scientifically proven method ensures you don't forget what you've learned!
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("due")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${filter === "due" ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white"}`}
          style={{ fontSize: '13px' }}
        >
          <Zap className="w-3.5 h-3.5" /> Due Today ({dueProblems.length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${filter === "all" ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white"}`}
          style={{ fontSize: '13px' }}
        >
          All Queued ({revisionProblems.length})
        </button>
      </div>

      {/* Problem Cards */}
      <div className="space-y-3">
        {displayProblems.map((p) => {
          const isDone = completed.has(p.id);
          return (
            <div key={p.id} className={`bg-[#161b22] border rounded-xl p-4 transition-all ${isDone ? "border-green-500/20 opacity-60" : p.dueForRevision ? "border-orange-500/20" : "border-[#30363d]"}`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => !isDone && markDone(p.id)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? "border-green-500 bg-green-500/20" : "border-[#30363d] hover:border-orange-400"}`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <span className="text-[#8b949e]" style={{ fontSize: '11px' }}>{p.timesReviewed}</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white" style={{ fontSize: '14px', fontWeight: 600 }}>{p.title}</span>
                    <span className={`rounded-md px-2 py-0.5 ${diffColors[p.difficulty]}`} style={{ fontSize: '11px' }}>
                      {p.difficulty}
                    </span>
                    {p.dueForRevision && !isDone && (
                      <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md px-2 py-0.5" style={{ fontSize: '10px' }}>Due</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[#8b949e]" style={{ fontSize: '11px' }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last solved: {p.lastSolved}</span>
                    <span>•</span>
                    <span>Reviewed {p.timesReviewed} times</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {!isDone && (
                    <>
                      <button
                        onClick={() => markDone(p.id)}
                        className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 rounded-lg px-3 py-1.5 transition-colors"
                        style={{ fontSize: '11px' }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Got it!
                      </button>
                      <button
                        onClick={() => navigate(`/problems/${p.id}`)}
                        className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] text-white hover:bg-[#30363d] rounded-lg px-3 py-1.5 transition-colors"
                        style={{ fontSize: '11px' }}
                      >
                        Solve <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {completed.size > 0 && (
        <div className="mt-6 text-center p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
          <p className="text-green-400" style={{ fontSize: '14px', fontWeight: 600 }}>
            🎉 {completed.size} problems reviewed today!
          </p>
          <p className="text-[#8b949e] mt-1" style={{ fontSize: '12px' }}>These will appear again based on your spaced repetition schedule.</p>
        </div>
      )}
    </div>
  );
}

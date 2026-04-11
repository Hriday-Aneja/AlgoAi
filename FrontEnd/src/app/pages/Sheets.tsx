import { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, CheckCircle2, Clock, Target, ChevronRight, TrendingUp } from "lucide-react";
import { sheets } from "../data/mockData";

export default function Sheets() {
  const navigate = useNavigate();

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white mb-1" style={{ fontSize: '22px', fontWeight: 700 }}>Structured Sheets</h1>
        <p className="text-[#8b949e]" style={{ fontSize: '14px' }}>
          Follow curated problem sheets by top educators. Track your progress.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-center">
          <div className="text-orange-400 mb-1" style={{ fontSize: '24px', fontWeight: 800 }}>3</div>
          <div className="text-[#8b949e]" style={{ fontSize: '12px' }}>Active Sheets</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-center">
          <div className="text-green-400 mb-1" style={{ fontSize: '24px', fontWeight: 800 }}>
            {sheets.reduce((sum, s) => sum + s.solved, 0)}
          </div>
          <div className="text-[#8b949e]" style={{ fontSize: '12px' }}>Total Solved</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-center">
          <div className="text-blue-400 mb-1" style={{ fontSize: '24px', fontWeight: 800 }}>
            {sheets.reduce((sum, s) => sum + s.totalProblems, 0)}
          </div>
          <div className="text-[#8b949e]" style={{ fontSize: '12px' }}>Total Problems</div>
        </div>
      </div>

      {/* Sheet Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {sheets.map((sheet) => {
          const pct = Math.round((sheet.solved / sheet.totalProblems) * 100);
          return (
            <div
              key={sheet.id}
              className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-opacity-70 transition-all group cursor-pointer"
              onClick={() => navigate(`/sheets/${sheet.id}`)}
              style={{ borderColor: sheet.color + "30" }}
            >
              {/* Header */}
              <div className="h-2 w-full" style={{ backgroundColor: sheet.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-white group-hover:text-opacity-90 transition-colors mb-1" style={{ fontSize: '16px', fontWeight: 700 }}>{sheet.name}</h2>
                    <p className="text-[#8b949e]" style={{ fontSize: '12px' }}>by {sheet.author}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8b949e] group-hover:text-white group-hover:translate-x-1 transition-all mt-1" />
                </div>

                <p className="text-[#8b949e] mb-4" style={{ fontSize: '12px', lineHeight: 1.6 }}>{sheet.description}</p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[#8b949e]" style={{ fontSize: '11px' }}>Progress</span>
                    <span style={{ color: sheet.color, fontSize: '13px', fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: sheet.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[#8b949e]" style={{ fontSize: '10px' }}>{sheet.solved} solved</span>
                    <span className="text-[#8b949e]" style={{ fontSize: '10px' }}>{sheet.totalProblems} total</span>
                  </div>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {sheet.topics.slice(0, 4).map(t => (
                    <span key={t} className="bg-[#21262d] text-[#8b949e] rounded-md px-2 py-0.5 border border-[#30363d]" style={{ fontSize: '10px' }}>{t}</span>
                  ))}
                  {sheet.topics.length > 4 && (
                    <span className="bg-[#21262d] text-[#8b949e] rounded-md px-2 py-0.5 border border-[#30363d]" style={{ fontSize: '10px' }}>+{sheet.topics.length - 4} more</span>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 pt-3 border-t border-[#30363d]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400" style={{ fontSize: '11px', fontWeight: 600 }}>{sheet.solved}</span>
                    <span className="text-[#8b949e]" style={{ fontSize: '11px' }}>solved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#8b949e]" />
                    <span className="text-[#8b949e]" style={{ fontSize: '11px' }}>{sheet.totalProblems - sheet.solved} remaining</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

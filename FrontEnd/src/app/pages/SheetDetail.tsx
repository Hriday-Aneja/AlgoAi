import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, CheckCircle2, Clock, Circle, Bookmark, ExternalLink, Filter } from "lucide-react";
import { sheets, type Status } from "../data/mockData";

const diffColors: Record<string, string> = {
  Easy: "text-green-400 bg-green-500/10",
  Medium: "text-yellow-400 bg-yellow-500/10",
  Hard: "text-red-400 bg-red-500/10"
};

const statusIcon = (s: Status) => {
  if (s === "solved") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (s === "attempted") return <Clock className="w-4 h-4 text-yellow-400" />;
  if (s === "bookmarked") return <Bookmark className="w-4 h-4 text-blue-400" />;
  return <Circle className="w-4 h-4 text-[#30363d]" />;
};

export default function SheetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sheet = sheets.find(s => s.id === id) || sheets[0];
  const [topicFilter, setTopicFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    Object.fromEntries(sheet.problems.map(p => [p.id, p.status]))
  );

  const topics = ["All", ...Array.from(new Set(sheet.problems.map(p => p.topic)))];
  const filtered = sheet.problems.filter(p => {
    if (topicFilter !== "All" && p.topic !== topicFilter) return false;
    if (statusFilter !== "All" && statuses[p.id] !== statusFilter) return false;
    return true;
  });

  const toggleStatus = (pid: string) => {
    setStatuses(prev => {
      const cur = prev[pid];
      const next: Status = cur === "unsolved" ? "solved" : cur === "solved" ? "attempted" : "unsolved";
      return { ...prev, [pid]: next };
    });
  };

  const pct = Math.round((sheet.problems.filter(p => statuses[p.id] === "solved").length / sheet.totalProblems) * 100);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate("/sheets")} className="flex items-center gap-2 text-[#8b949e] hover:text-white mb-5 transition-colors" style={{ fontSize: '13px' }}>
        <ChevronLeft className="w-4 h-4" /> Back to Sheets
      </button>

      {/* Header */}
      <div className="bg-[#161b22] border rounded-xl p-5 mb-5 overflow-hidden relative" style={{ borderColor: sheet.color + "30" }}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: sheet.color }} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>{sheet.name}</h1>
            <p className="text-[#8b949e]" style={{ fontSize: '13px' }}>by {sheet.author}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-green-400" style={{ fontSize: '20px', fontWeight: 800 }}>{sheet.problems.filter(p => statuses[p.id] === "solved").length}</div>
              <div className="text-[#8b949e]" style={{ fontSize: '11px' }}>Solved</div>
            </div>
            <div className="text-center">
              <div className="text-white" style={{ fontSize: '20px', fontWeight: 800 }}>{sheet.totalProblems}</div>
              <div className="text-[#8b949e]" style={{ fontSize: '11px' }}>Total</div>
            </div>
            <div className="text-center">
              <div style={{ color: sheet.color, fontSize: '20px', fontWeight: 800 }}>{pct}%</div>
              <div className="text-[#8b949e]" style={{ fontSize: '11px' }}>Done</div>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-[#21262d] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: sheet.color }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setTopicFilter(t)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap border transition-all ${topicFilter === t ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white"}`}
              style={{ fontSize: '12px' }}
            >
              {t}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-[#8b949e] focus:outline-none ml-auto"
          style={{ fontSize: '12px' }}
        >
          <option value="All">All Status</option>
          <option value="solved">Solved</option>
          <option value="attempted">Attempted</option>
          <option value="unsolved">Unsolved</option>
        </select>
      </div>

      {/* Problem List */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_100px_100px_80px] gap-4 px-4 py-3 border-b border-[#30363d] text-[#8b949e]" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div>Status</div>
          <div>Problem</div>
          <div>Topic</div>
          <div>Difficulty</div>
          <div>Link</div>
        </div>
        {filtered.map((problem, idx) => (
          <div key={problem.id} className={`grid grid-cols-[40px_1fr_100px_100px_80px] gap-4 px-4 py-3.5 items-center border-b border-[#30363d]/50 last:border-0 hover:bg-[#21262d] transition-colors ${idx % 2 === 0 ? "" : "bg-[#0d1117]/20"}`}>
            <button onClick={() => toggleStatus(problem.id)} className="flex items-center justify-center hover:scale-110 transition-transform">
              {statusIcon(statuses[problem.id])}
            </button>
            <div>
              <span
                onClick={() => navigate(`/problems/1`)}
                className="text-white hover:text-orange-400 cursor-pointer transition-colors"
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                {problem.title}
              </span>
            </div>
            <div>
              <span className="text-[#8b949e] bg-[#21262d] rounded-md px-2 py-0.5" style={{ fontSize: '11px' }}>{problem.topic}</span>
            </div>
            <div>
              <span className={`rounded-md px-2 py-0.5 ${diffColors[problem.difficulty]}`} style={{ fontSize: '11px', fontWeight: 600 }}>
                {problem.difficulty}
              </span>
            </div>
            <div>
              <button
                onClick={() => navigate(`/problems/1`)}
                className="text-[#8b949e] hover:text-orange-400 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 text-[#8b949e] text-center" style={{ fontSize: '12px' }}>
        {filtered.length} problems • Click status icon to toggle
      </div>
    </div>
  );
}

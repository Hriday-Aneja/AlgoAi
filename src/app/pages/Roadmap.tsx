import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Map, CheckCircle2, Lock, Play, ChevronRight, Target,
  Clock, Star, Sparkles, TrendingUp
} from "lucide-react";
import { getUserRoadmap, RoadmapDay, RoadmapMeta } from "../../services/api";
import { useUserProgress } from "../contexts/UserProgressContext";
import { useAuth } from "../contexts/AuthContext";

export default function Roadmap() {
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();
  const [view, setView] = useState<"timeline" | "grid">("timeline");
  const [backendRoadmap, setBackendRoadmap] = useState<RoadmapDay[]>([]);
  const [roadmapMeta, setRoadmapMeta] = useState<RoadmapMeta | null>(null);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestUserId, setGuestUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guestUserId');
    }
    return null;
  });
  // Only call useUserProgress if authenticated to avoid 401 errors
  const progressContext = token ? useUserProgress() : null;
  const { progress } = progressContext || { progress: null };
  const roadmapItems = backendRoadmap.map((item) => ({
    ...item,
    completed: item.completed ?? progress?.roadmapProgress?.[item.topic]?.completed ?? false,
  }));

  useEffect(() => {
    setGuestUserId(localStorage.getItem('guestUserId'));
  }, []);

  useEffect(() => {
    const loadRoadmap = async () => {
      // Wait for auth to finish loading, then check for token
      if (authLoading) {
        return;
      }

      if (!token && !guestUserId) {
        setIsLoading(false);
        setRoadmapError('Please complete your signup to view your roadmap');
        return;
      }

      try {
        const response = await getUserRoadmap(guestUserId ?? undefined);
        if (response.success && Array.isArray(response.roadmap)) {
          setBackendRoadmap(response.roadmap);
          setRoadmapMeta(response.roadmapMeta ?? null);
          setRoadmapError(null);
        } else {
          setRoadmapError('Could not load your roadmap');
        }
      } catch (error: any) {
        console.error('Roadmap: failed to fetch backend roadmap', error);
        setRoadmapError(error?.message || 'Could not load your roadmap');
      } finally {
        setIsLoading(false);
      }
    };

    loadRoadmap();
  }, [token, authLoading, guestUserId]);

  const completedCount = roadmapItems.filter(d => d.completed).length;
  const pct = roadmapItems.length > 0 ? Math.round((completedCount / roadmapItems.length) * 100) : 0;

  const currentRoadmapDay = roadmapMeta?.currentRoadmapDay ?? 1;
  const effectiveRoadmapDay = Math.min(currentRoadmapDay, roadmapItems.length || currentRoadmapDay);
  const displayRoadmapDay = effectiveRoadmapDay;
  const startedLabel = roadmapMeta
    ? roadmapMeta.daysSinceStart === 0
      ? "Started • today"
      : `Started • ${roadmapMeta.daysSinceStart} day${roadmapMeta.daysSinceStart === 1 ? "" : "s"} ago`
    : "Started • a few days ago";

  if (backendRoadmap.length === 0) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-orange-500/20 bg-[#0b1118] p-6 text-center">
          <p className="text-white mb-3" style={{ fontSize: '15px', fontWeight: 600 }}>
            {isLoading ? 'Loading your personalized roadmap...' : roadmapError ? roadmapError : 'No roadmap available yet.'}
          </p>
          {!isLoading && (
            <>
              {roadmapError?.includes('signup') ? (
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate("/signup")}
                    className="rounded-full px-5 py-2 bg-orange-500 text-white font-semibold hover:bg-orange-400 transition-colors"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="rounded-full px-5 py-2 bg-[#30363d] text-white font-semibold hover:bg-[#3d444d] transition-colors"
                  >
                    Log In
                  </button>
                </div>
              ) : !roadmapError ? (
                <button
                  onClick={() => navigate("/onboarding")}
                  className="rounded-full px-5 py-2 bg-orange-500 text-white font-semibold hover:bg-orange-400 transition-colors"
                >
                  Complete onboarding to generate your plan
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Map className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: '22px', fontWeight: 700 }}>My AI Roadmap</h1>
            <p className="text-[#8b949e]" style={{ fontSize: '13px' }}>Personalized day-wise plan based on your level & goals</p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 rounded-xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-white mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>
              Day {displayRoadmapDay} of {roadmapItems.length}
            </div>
            <p className="text-[#8b949e]" style={{ fontSize: '13px' }}>
              {Math.max(roadmapItems.length - completedCount, 0)} days remaining in your {roadmapItems.length}-day plan
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-green-400" style={{ fontSize: '20px', fontWeight: 800 }}>{completedCount}</div>
              <div className="text-[#8b949e]" style={{ fontSize: '11px' }}>Completed</div>
            </div>
            <div className="text-center">
              <div className="text-orange-400" style={{ fontSize: '20px', fontWeight: 800 }}>{roadmapItems.length - completedCount}</div>
              <div className="text-[#8b949e]" style={{ fontSize: '11px' }}>Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400" style={{ fontSize: '20px', fontWeight: 800 }}>{pct}%</div>
              <div className="text-[#8b949e]" style={{ fontSize: '11px' }}>Complete</div>
            </div>
          </div>
        </div>
        <div className="h-3 bg-[#21262d] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#8b949e]" style={{ fontSize: '11px' }}>{startedLabel}</span>
          <button
            onClick={() => navigate("/onboarding")}
            className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 transition-colors"
            style={{ fontSize: '11px' }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Regenerate Plan
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView("timeline")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${view === "timeline" ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white"}`}
          style={{ fontSize: '13px' }}
        >
          Timeline View
        </button>
        <button
          onClick={() => setView("grid")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${view === "grid" ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white"}`}
          style={{ fontSize: '13px' }}
        >
          Grid View
        </button>
      </div>

      {/* Timeline */}
      {backendRoadmap.length === 0 ? (
        <div className="rounded-2xl border border-orange-500/20 bg-[#0b1118] p-6 text-center">
          <p className="text-white mb-3" style={{ fontSize: '15px', fontWeight: 600 }}>
            {isLoading ? 'Loading your personalized roadmap...' : roadmapError ? roadmapError : 'No roadmap available yet.'}
          </p>
          {!isLoading && !roadmapError && (
            <button
              onClick={() => navigate("/onboarding")}
              className="rounded-full px-5 py-2 bg-orange-500 text-white font-semibold hover:bg-orange-400 transition-colors"
            >
              Complete onboarding to generate your plan
            </button>
          )}
        </div>
      ) : view === "timeline" ? (
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#30363d]" />

          <div className="space-y-4">
            {roadmapItems.map((day, idx) => {
              const isLocked = day.isLocked ?? day.day > effectiveRoadmapDay;
              const isCurrent = !day.completed && day.day === effectiveRoadmapDay;
              const isNext = !day.completed && day.day === effectiveRoadmapDay;
              const isAvailable = !day.completed && day.day <= effectiveRoadmapDay;

              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative pl-14"
                >
                  {/* Circle */}
                  <div className={`absolute left-3 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${
                    day.completed ? "bg-green-500 border-green-500" :
                    isLocked ? "bg-[#0d1117] border-[#30363d]" :
                    "bg-orange-500 border-orange-500 animate-pulse"
                  }`}>
                    {day.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    ) : isLocked ? (
                      <Lock className="w-3 h-3 text-[#8b949e]" />
                    ) : (
                      <Play className="w-3 h-3 text-white" />
                    )}
                  </div>

                  {/* Card */}
                  <div className={`rounded-xl border p-4 transition-all ${
                    day.completed ? "bg-green-500/5 border-green-500/20" :
                    isLocked ? "bg-[#161b22] border-[#30363d] opacity-60" :
                    "bg-orange-500/10 border-orange-500/30"
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${day.completed ? "text-green-400" : isLocked ? "text-[#8b949e]" : "text-orange-400"}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                            DAY {day.day}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 ${
                            day.difficulty === "Easy" ? "bg-green-500/10 text-green-400" :
                            day.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-400" :
                            "bg-red-500/10 text-red-400"
                          }`} style={{ fontSize: '10px' }}>
                            {day.difficulty}
                          </span>
                          {isCurrent && (
                            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-2 py-0.5" style={{ fontSize: '10px' }}>
                              📍 Current
                            </span>
                          )}
                        </div>
                        <h3 className="text-white" style={{ fontSize: '15px', fontWeight: 700 }}>{day.topic}</h3>
                      </div>
                      {!isLocked && (
                        <button
                          onClick={() => navigate("/problems")}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                            day.completed ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" :
                            "bg-orange-500 text-white hover:bg-orange-600"
                          }`}
                          style={{ fontSize: '12px', fontWeight: 600 }}
                        >
                          {day.completed ? "Review" : day.day === effectiveRoadmapDay ? "Start" : "Resume"} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(day.tasks ?? []).slice(0, 3).map((task) => (
                        <span
                          key={task}
                          className={`rounded-lg px-2.5 py-1 border ${
                            day.completed ? "bg-green-500/10 border-green-500/20 text-green-300" :
                            isNext ? "bg-orange-500/10 border-orange-500/20 text-orange-300" :
                            "bg-[#21262d] border-[#30363d] text-[#8b949e]"
                          }`}
                          style={{ fontSize: '11px' }}
                        >
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {roadmapItems.map((day, idx) => {
            const isLocked = day.isLocked ?? day.day > effectiveRoadmapDay;
            const isCurrent = !day.completed && day.day === effectiveRoadmapDay;
            return (
              <button
                key={day.day}
                onClick={() => !isLocked && navigate("/problems")}
                disabled={isLocked}
                className={`p-4 rounded-xl border text-left transition-all ${
                  day.completed ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10" :
                  isLocked ? "bg-[#161b22] border-[#30363d] opacity-50 cursor-not-allowed" :
                  "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/15"
                }`}
              >
                <div className={`text-xs font-bold mb-1 ${day.completed ? "text-green-400" : isLocked ? "text-[#8b949e]" : "text-orange-400"}`}>
                  Day {day.day}
                </div>
                <div className="text-white mb-2" style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.3 }}>{day.topic}</div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '10px' }} className={day.difficulty === "Easy" ? "text-green-400" : day.difficulty === "Medium" ? "text-yellow-400" : "text-red-400"}>
                    {day.difficulty}
                  </span>
                  {day.completed ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : isLocked ? <Lock className="w-4 h-4 text-[#30363d]" /> : <Play className="w-4 h-4 text-orange-400" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

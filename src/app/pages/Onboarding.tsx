import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap,
  Brain,
  CheckCircle2,
  Target,
  Code2,
  Star,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { submitOnboarding } from "../../services/api";

const steps = ["Profile", "Goals", "Topics", "Mini Test", "Roadmap"];

const levels = [
  { id: "beginner", label: "Complete Beginner", desc: "Never coded algorithms before", emoji: "🌱" },
  { id: "intermediate", label: "Basic DSA", desc: "Know arrays, basic sorting", emoji: "📚" },
  { id: "advanced", label: "Advanced", desc: "Solved 200+ LeetCode problems", emoji: "🔥" },
];

const goals = [
  { id: "faang", label: "FAANG/MAANG Interview", emoji: "🎯" },
  { id: "startup", label: "Startup Job", emoji: "🚀" },
  { id: "competitive", label: "Competitive Programming", emoji: "🏆" },
  { id: "campus", label: "Campus Placements", emoji: "🎓" },
  { id: "upskill", label: "General Upskilling", emoji: "📈" },
];

const topics = [
  { id: "arrays", label: "Arrays" },
  { id: "strings", label: "Strings" },
  { id: "linked-list", label: "Linked List" },
  { id: "stack", label: "Stack" },
  { id: "queue", label: "Queue" },
  { id: "hashing", label: "Hashing" },
  { id: "two-pointers", label: "Two Pointers" },
  { id: "sliding-window", label: "Sliding Window" },
  { id: "binary-search", label: "Binary Search" },
  { id: "recursion", label: "Recursion" },
  { id: "backtracking", label: "Backtracking" },
  { id: "trees", label: "Trees" },
  { id: "bst", label: "BST" },
  { id: "heaps", label: "Heaps" },
  { id: "greedy", label: "Greedy" },
  { id: "graphs", label: "Graphs" },
  { id: "dp", label: "Dynamic Programming" },
  { id: "trie", label: "Trie" },
  { id: "bit-manipulation", label: "Bit Manipulation" },
];

const timeOptions = [
  { id: "1h", label: "1 hour/day", emoji: "😊" },
  { id: "2h", label: "2 hours/day", emoji: "💪" },
  { id: "3h", label: "3+ hours/day", emoji: "🔥" },
];

const testQuestions = [
  {
    q: "Time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correct: 1
  },
  {
    q: "Which data structure uses LIFO?",
    options: ["Queue", "Array", "Stack", "Linked List"],
    correct: 2
  },
  {
    q: "What does DFS stand for?",
    options: ["Data First Search", "Depth First Search", "Dynamic First Sort", "Direct Find Set"],
    correct: 1
  }
];

const generatedRoadmap = [
  { week: 1, topics: ["Arrays Basics", "Sorting Algorithms", "Two Pointers"], count: 15 },
  { week: 2, topics: ["Linked Lists", "Stack & Queue", "Sliding Window"], count: 18 },
  { week: 3, topics: ["Binary Search", "Recursion", "Divide & Conquer"], count: 20 },
  { week: 4, topics: ["Trees: BFS/DFS", "Binary Search Tree"], count: 22 },
  { week: 5, topics: ["Graphs: BFS/DFS", "Topological Sort"], count: 20 },
  { week: 6, topics: ["Dynamic Programming 1D", "Memoization"], count: 25 },
  { week: 7, topics: ["DP 2D", "Backtracking", "Greedy"], count: 22 },
  { week: 8, topics: ["Heaps", "Tries", "Advanced Graphs"], count: 18 },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [generating, setGenerating] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleTopic = (t: string) => {
    setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleTestAnswer = (qIdx: number, aIdx: number) => {
    setAnswers(prev => ({ ...prev, [qIdx]: aIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    testQuestions.forEach((q, i) => {
      if (answers[i] === q.correct) score++;
    });
    return score;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setSubmitError(null);

    try {
      const score = calculateScore();
      setTestScore(score);

      // Submit onboarding data to backend
      const response = await submitOnboarding({
        experienceLevel: level,
        goals: goal,
        preferredTopics: selectedTopics,
        timeCommitment: time,
        testScore: score,
      });

      const authToken = localStorage.getItem('authToken');
      const guestUserId = response?.userId;

      if (!authToken && guestUserId) {
        localStorage.setItem('guestUserId', guestUserId);
      }

      // Redirect to roadmap after successful onboarding
      navigate('/roadmap', { replace: true });
    } catch (error: any) {
      console.error('Failed to submit onboarding data:', error);
      setSubmitError(error?.message || 'Unable to submit onboarding. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const canNext = () => {
    if (step === 0) return level !== "";
    if (step === 1) return goal !== "" && time !== "";
    if (step === 2) return selectedTopics.length >= 3;
    if (step === 3) return Object.keys(answers).length === testQuestions.length;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-white" style={{ fontSize: '20px', fontWeight: 800 }}>AlgoAI</div>
          <div className="text-[#8b949e]" style={{ fontSize: '12px' }}>AI-Powered DSA Platform</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                i < step ? "bg-green-500 text-white" :
                i === step ? "bg-orange-500 text-white" :
                "bg-[#21262d] text-[#8b949e]"
              }`}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-16 transition-all ${i < step ? "bg-green-500" : "bg-[#30363d]"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center text-[#8b949e]" style={{ fontSize: '12px' }}>{steps[step]}</div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6 sm:p-8"
          >
            {/* Step 0: Level */}
            {step === 0 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-6 h-6 text-orange-400" />
                  <h2 className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>What's your current level?</h2>
                </div>
                <p className="text-[#8b949e] mb-6" style={{ fontSize: '14px' }}>We'll personalize your roadmap based on this.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {levels.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        level === l.id
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-[#30363d] bg-[#21262d] hover:border-[#8b949e]"
                      }`}
                    >
                      <span style={{ fontSize: '28px' }}>{l.emoji}</span>
                      <div>
                        <div className="text-white" style={{ fontSize: '14px', fontWeight: 600 }}>{l.label}</div>
                        <div className="text-[#8b949e]" style={{ fontSize: '12px' }}>{l.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Goals */}
            {step === 1 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-6 h-6 text-orange-400" />
                  <h2 className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>What's your goal?</h2>
                </div>
                <p className="text-[#8b949e] mb-5" style={{ fontSize: '14px' }}>Select your primary motivation.</p>
                <div className="grid grid-cols-1 gap-2 mb-5">
                  {goals.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        goal === g.id ? "border-orange-500 bg-orange-500/10" : "border-[#30363d] bg-[#21262d] hover:border-[#8b949e]"
                      }`}
                    >
                      <span style={{ fontSize: '20px' }}>{g.emoji}</span>
                      <span className="text-white" style={{ fontSize: '14px', fontWeight: 500 }}>{g.label}</span>
                      {goal === g.id && <CheckCircle2 className="w-4 h-4 text-orange-400 ml-auto" />}
                    </button>
                  ))}
                </div>
                <p className="text-[#8b949e] mb-3" style={{ fontSize: '13px', fontWeight: 600 }}>How much time can you dedicate?</p>
                <div className="flex gap-3">
                  {timeOptions.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTime(t.id)}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                        time === t.id ? "border-orange-500 bg-orange-500/10" : "border-[#30363d] bg-[#21262d] hover:border-[#8b949e]"
                      }`}
                    >
                      <span style={{ fontSize: '20px' }}>{t.emoji}</span>
                      <span className="text-white" style={{ fontSize: '12px', fontWeight: 500 }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Topics */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Code2 className="w-6 h-6 text-orange-400" />
                  <h2 className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>Select topics to focus on</h2>
                </div>
                <p className="text-[#8b949e] mb-5" style={{ fontSize: '14px' }}>Choose at least 3 topics. (Selected: {selectedTopics.length})</p>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedTopics.includes(topic.id)
                          ? "border-orange-500 bg-orange-500/10 text-orange-300"
                          : "border-[#30363d] bg-[#21262d] text-[#8b949e] hover:border-[#8b949e] hover:text-white"
                      }`}
                      style={{ fontSize: '13px' }}
                    >
                      {selectedTopics.includes(topic.id) ? "✓ " : ""}{topic.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Mini Test */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-6 h-6 text-orange-400" />
                  <h2 className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>Quick Assessment</h2>
                </div>
                <p className="text-[#8b949e] mb-5" style={{ fontSize: '14px' }}>3 quick questions to calibrate your roadmap perfectly.</p>
                <div className="space-y-5">
                  {testQuestions.map((q, qi) => (
                    <div key={qi} className="bg-[#21262d] rounded-xl p-4">
                      <p className="text-white mb-3" style={{ fontSize: '14px', fontWeight: 600 }}>Q{qi + 1}: {q.q}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => handleTestAnswer(qi, oi)}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              answers[qi] === oi
                                ? "border-orange-500 bg-orange-500/10 text-orange-300"
                                : "border-[#30363d] text-[#8b949e] hover:border-[#8b949e] hover:text-white"
                            }`}
                            style={{ fontSize: '12px' }}
                          >
                            {String.fromCharCode(65 + oi)}. {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Generated Roadmap */}
            {step === 4 && (
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                  <h2 className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>Your AI Roadmap is Ready!</h2>
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex gap-2">
                    <span className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-md px-2 py-0.5" style={{ fontSize: '11px' }}>
                      Score: {testScore}/{testQuestions.length}
                    </span>
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md px-2 py-0.5" style={{ fontSize: '11px' }}>
                      {level} level
                    </span>
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md px-2 py-0.5" style={{ fontSize: '11px' }}>
                      8 weeks plan
                    </span>
                  </div>
                </div>
                <div className="space-y-2 mb-5 max-h-64 overflow-y-auto pr-1">
                  {generatedRoadmap.map((week) => (
                    <div key={week.week} className="flex items-start gap-3 p-3 bg-[#21262d] rounded-lg border border-[#30363d]">
                      <div className="w-12 h-8 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center flex-shrink-0" style={{ fontSize: '11px', fontWeight: 700 }}>
                        W{week.week}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1">
                          {week.topics.map(t => (
                            <span key={t} className="bg-[#30363d] text-white rounded-md px-2 py-0.5" style={{ fontSize: '11px' }}>{t}</span>
                          ))}
                        </div>
                        <div className="text-[#8b949e] mt-1" style={{ fontSize: '10px' }}>{week.count} problems</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/roadmap")}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                  style={{ fontSize: '15px', fontWeight: 700 }}
                >
                  View My Roadmap <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Buttons */}
        {step < 4 && (
          <div className="px-6 sm:px-8 py-4 border-t border-[#30363d] bg-[#0d1117]">
            {submitError && (
              <div className="mb-3 rounded-xl bg-[#3b1715] border border-[#832525] p-3 text-sm text-[#fca5a5]">
                {submitError}
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => step > 0 && setStep(s => s - 1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  step === 0 ? "text-[#30363d] cursor-not-allowed" : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                }`}
                disabled={step === 0}
                style={{ fontSize: '13px' }}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {step < 3 ? (
                <button
                  onClick={() => canNext() && setStep(s => s + 1)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
                    canNext()
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-[#21262d] text-[#8b949e] cursor-not-allowed"
                  }`}
                  style={{ fontSize: '13px', fontWeight: 600 }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => canNext() && !generating && handleGenerate()}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
                    canNext() && !generating
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
                      : "bg-[#21262d] text-[#8b949e] cursor-not-allowed"
                  }`}
                  style={{ fontSize: '13px', fontWeight: 600 }}
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate My Roadmap
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Skip */}
      {step < 4 && (
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 text-[#8b949e] hover:text-white transition-colors"
          style={{ fontSize: '12px' }}
        >
          Skip for now → Go to Dashboard
        </button>
      )}
    </div>
  );
}

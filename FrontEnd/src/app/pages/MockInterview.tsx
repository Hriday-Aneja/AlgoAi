import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Swords, Play, Clock, CheckCircle2, XCircle, Bot, ChevronRight,
  RotateCcw, Star, Mic, MicOff, Video, VideoOff, Code2, MessageSquare
} from "lucide-react";
import { mockInterviewQuestions } from "../data/mockData";

type Phase = "setup" | "interview" | "result";

const difficulties = ["Easy", "Medium", "Hard", "Mixed"] as const;
const durations = [10, 15, 20, 30] as const;

const aiReviews = [
  { aspect: "Problem Understanding", score: 9, comment: "Excellent — asked clarifying questions immediately." },
  { aspect: "Approach Discussion", score: 7, comment: "Good approach, but could have mentioned brute force first." },
  { aspect: "Code Quality", score: 8, comment: "Clean and readable. Good variable names." },
  { aspect: "Edge Cases", score: 6, comment: "Missed the case where nums array is empty." },
  { aspect: "Communication", score: 9, comment: "Talked through your thought process well." },
  { aspect: "Complexity Analysis", score: 8, comment: "Correctly identified O(n) time, O(n) space." },
];

export default function MockInterview() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedDiff, setSelectedDiff] = useState<string>("Mixed");
  const [selectedDuration, setSelectedDuration] = useState<number>(20);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [code, setCode] = useState("");
  const [tab, setTab] = useState<"problem" | "code" | "ai">("problem");
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<{role: "user"|"ai"; text: string}[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const currentQ = mockInterviewQuestions[questionIdx];

  useEffect(() => {
    if (phase !== "interview" || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(prev => {
      if (prev <= 1) { clearInterval(t); setPhase("result"); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  const startInterview = () => {
    setTimeLeft(selectedDuration * 60);
    setCode(currentQ.starterCode);
    setChatMsgs([{ role: "ai", text: `Welcome to your mock interview! I'm your AI interviewer today. 👨‍💼\n\nLet's begin. Please read the problem carefully, then talk me through your approach before coding.\n\n"${currentQ.title}" — Go ahead!` }]);
    setPhase("interview");
  };

  const handleNext = () => {
    if (questionIdx < mockInterviewQuestions.length - 1) {
      setQuestionIdx(i => i + 1);
      setCode(mockInterviewQuestions[questionIdx + 1].starterCode);
      setChatMsgs(prev => [...prev, { role: "ai", text: "Good! Let's move to the next question. Ready?" }]);
      setTab("problem");
    } else {
      setPhase("result");
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setChatMsgs(prev => [...prev, { role: "user", text: msg }]);
    setIsAiTyping(true);
    await new Promise(r => setTimeout(r, 1200));
    const responses = [
      "Good thought! Can you explain why you'd use that approach here?",
      "Interesting. What's the time complexity of your current solution?",
      "Walk me through the edge cases you're thinking about.",
      "Nice! Now what if the input was sorted — would your approach change?",
      "Can you optimize this further? Think about space complexity.",
      "That's correct! Follow-up: " + (currentQ.followUp[Math.floor(Math.random() * currentQ.followUp.length)]),
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    setChatMsgs(prev => [...prev, { role: "ai", text: reply }]);
    setIsAiTyping(false);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timePct = timeLeft / (selectedDuration * 60) * 100;
  const avgScore = Math.round(aiReviews.reduce((sum, r) => sum + r.score, 0) / aiReviews.length);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {/* Setup Phase */}
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-6">
              <h1 className="text-white mb-1 flex items-center gap-3" style={{ fontSize: '22px', fontWeight: 700 }}>
                <Swords className="w-6 h-6 text-orange-400" />
                Mock Interview Mode
              </h1>
              <p className="text-[#8b949e]" style={{ fontSize: '14px' }}>Simulate real interview with AI interviewer, timer, and detailed feedback.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              {/* Config */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
                <h2 className="text-white mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>Interview Settings</h2>

                <div className="mb-5">
                  <label className="text-[#8b949e] mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>Difficulty</label>
                  <div className="grid grid-cols-2 gap-2">
                    {difficulties.map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDiff(d)}
                        className={`p-3 rounded-lg border text-center transition-all ${selectedDiff === d ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#30363d] bg-[#21262d] text-[#8b949e] hover:text-white"}`}
                        style={{ fontSize: '13px', fontWeight: 500 }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-[#8b949e] mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>Duration (minutes)</label>
                  <div className="flex gap-2">
                    {durations.map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDuration(d)}
                        className={`flex-1 p-3 rounded-lg border text-center transition-all ${selectedDuration === d ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#30363d] bg-[#21262d] text-[#8b949e] hover:text-white"}`}
                        style={{ fontSize: '13px', fontWeight: 500 }}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-[#8b949e] mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>AI Interviewer Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Friendly", "Strict", "Google-style"].map(s => (
                      <button
                        key={s}
                        className={`p-2.5 rounded-lg border text-center transition-all border-[#30363d] bg-[#21262d] text-[#8b949e] hover:text-white`}
                        style={{ fontSize: '11px' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startInterview}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl py-3.5 flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-500/20"
                  style={{ fontSize: '15px', fontWeight: 700 }}
                >
                  <Play className="w-5 h-5" /> Start Interview
                </button>
              </div>

              {/* Preview */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
                <h2 className="text-white mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>Interview Preview</h2>
                <div className="space-y-3">
                  {mockInterviewQuestions.map((q, i) => (
                    <div key={q.id} className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-[#30363d] text-[#8b949e] flex items-center justify-center flex-shrink-0" style={{ fontSize: '11px' }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white truncate" style={{ fontSize: '13px', fontWeight: 600 }}>{q.title}</div>
                        <div className="text-[#8b949e]" style={{ fontSize: '11px' }}>{q.timeLimit / 60} min limit</div>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 ${q.difficulty === "Easy" ? "text-green-400 bg-green-500/10" : q.difficulty === "Medium" ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10"}`} style={{ fontSize: '11px' }}>
                        {q.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400" style={{ fontSize: '12px' }}>💡 <strong>Tips:</strong> Talk through your approach, mention edge cases, and ask clarifying questions!</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Interview Phase */}
        {phase === "interview" && (
          <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
            {/* Timer Bar */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-5 py-3 mb-4 flex items-center gap-4">
              <Clock className={`w-5 h-5 ${timePct < 25 ? "text-red-400 animate-pulse" : "text-[#8b949e]"}`} />
              <span className={`font-mono ${timePct < 25 ? "text-red-400" : timePct < 50 ? "text-yellow-400" : "text-white"}`} style={{ fontSize: '20px', fontWeight: 800 }}>
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
              <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${timePct < 25 ? "bg-red-500" : timePct < 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${timePct}%` }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMicOn(!micOn)} className={`p-2 rounded-lg transition-colors ${micOn ? "bg-red-500/10 text-red-400" : "bg-[#21262d] text-[#8b949e]"}`}>
                  {micOn ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button onClick={() => setCamOn(!camOn)} className={`p-2 rounded-lg transition-colors ${camOn ? "bg-blue-500/10 text-blue-400" : "bg-[#21262d] text-[#8b949e]"}`}>
                  {camOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-[#21262d] border border-[#30363d] text-white hover:bg-[#30363d] rounded-lg px-3 py-1.5 transition-colors"
                  style={{ fontSize: '12px' }}
                >
                  Next Q <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPhase("result")}
                  className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 rounded-lg px-3 py-1.5 transition-colors"
                  style={{ fontSize: '12px' }}
                >
                  <CheckCircle2 className="w-4 h-4" /> End
                </button>
              </div>
            </div>

            {/* Tabs + Content */}
            <div className="flex gap-2 mb-3">
              {(["problem", "code", "ai"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all capitalize ${tab === t ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white"}`}
                  style={{ fontSize: '12px', fontWeight: 500 }}
                >
                  {t === "problem" ? <Code2 className="w-3.5 h-3.5" /> : t === "code" ? <Code2 className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  {t === "ai" ? "AI Interviewer" : t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 280px)' }}>
              {/* Left: Problem */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col">
                {tab !== "code" ? (
                  <div className="flex-1 overflow-y-auto p-5">
                    {tab === "problem" && (
                      <>
                        <h2 className="text-white mb-3" style={{ fontSize: '18px', fontWeight: 700 }}>{currentQ.title}</h2>
                        <p className="text-[#c9d1d9] mb-4" style={{ fontSize: '13px', lineHeight: 1.7 }}>{currentQ.description}</p>
                        {currentQ.examples.map((ex, i) => (
                          <div key={i} className="bg-[#21262d] border border-[#30363d] rounded-lg p-3 mb-3">
                            <div><span className="text-[#8b949e]" style={{ fontSize: '11px' }}>Input: </span><code className="text-green-300" style={{ fontSize: '12px' }}>{ex.input}</code></div>
                            <div><span className="text-[#8b949e]" style={{ fontSize: '11px' }}>Output: </span><code className="text-blue-300" style={{ fontSize: '12px' }}>{ex.output}</code></div>
                          </div>
                        ))}
                        <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                          <p className="text-yellow-400" style={{ fontSize: '12px', fontWeight: 600 }}>Follow-up Questions:</p>
                          {currentQ.followUp.map((f, i) => (
                            <p key={i} className="text-[#c9d1d9] mt-1" style={{ fontSize: '12px' }}>• {f}</p>
                          ))}
                        </div>
                      </>
                    )}
                    {tab === "ai" && (
                      <>
                        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                          {chatMsgs.map((m, i) => (
                            <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${m.role === "ai" ? "bg-orange-500/20" : "bg-blue-500/20"}`}>
                                {m.role === "ai" ? <Bot className="w-4 h-4 text-orange-400" /> : <span className="text-blue-400" style={{ fontSize: '10px' }}>U</span>}
                              </div>
                              <div className={`max-w-xs rounded-xl px-3 py-2 ${m.role === "ai" ? "bg-[#21262d] border border-[#30363d] text-[#c9d1d9]" : "bg-orange-500 text-white"}`}>
                                <p style={{ fontSize: '12px', lineHeight: 1.6 }}>{m.text}</p>
                              </div>
                            </div>
                          ))}
                          {isAiTyping && (
                            <div className="flex gap-2">
                              <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-orange-400" />
                              </div>
                              <div className="bg-[#21262d] border border-[#30363d] rounded-xl px-3 py-2 flex gap-1">
                                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && sendChat()}
                            placeholder="Talk to interviewer..."
                            className="flex-1 bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-[#8b949e] focus:outline-none"
                            style={{ fontSize: '12px' }}
                          />
                          <button onClick={sendChat} className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 py-2 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Right: Code */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b border-[#30363d] flex items-center justify-between flex-shrink-0">
                  <span className="text-white" style={{ fontSize: '12px', fontWeight: 600 }}>Editor</span>
                  <select className="bg-[#21262d] border border-[#30363d] rounded px-2 py-1 text-white focus:outline-none" style={{ fontSize: '11px' }}>
                    <option>TypeScript</option>
                    <option>Python</option>
                    <option>Java</option>
                  </select>
                </div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="flex-1 bg-[#0d1117] text-green-300 p-4 focus:outline-none resize-none"
                  style={{ fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.8 }}
                  spellCheck={false}
                />
                <div className="flex gap-2 p-3 border-t border-[#30363d] flex-shrink-0">
                  <button className="flex items-center gap-2 bg-[#21262d] border border-[#30363d] text-white hover:bg-[#30363d] rounded-lg px-3 py-2 transition-colors" style={{ fontSize: '12px' }}>
                    <Play className="w-4 h-4" /> Run
                  </button>
                  <button onClick={handleNext} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 flex items-center justify-center gap-2 transition-colors" style={{ fontSize: '12px', fontWeight: 600 }}>
                    <CheckCircle2 className="w-4 h-4" /> Submit & Next
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Result Phase */}
        {phase === "result" && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-orange-400" />
              </div>
              <h1 className="text-white mb-2" style={{ fontSize: '24px', fontWeight: 800 }}>Interview Complete! 🎉</h1>
              <p className="text-[#8b949e]" style={{ fontSize: '14px' }}>Here's your AI-powered performance analysis</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5">
                <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="text-orange-400" style={{ fontSize: '16px', fontWeight: 800 }}>{avgScore}/10</span>
                <span className="text-orange-300" style={{ fontSize: '12px' }}>Overall Score</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {aiReviews.map(({ aspect, score, comment }) => (
                <div key={aspect} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white" style={{ fontSize: '14px', fontWeight: 600 }}>{aspect}</h3>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${score >= 8 ? "bg-green-500/20 text-green-400" : score >= 6 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`} style={{ fontSize: '14px', fontWeight: 800 }}>
                        {score}
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${score >= 8 ? "bg-green-500" : score >= 6 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${score * 10}%` }} />
                  </div>
                  <p className="text-[#8b949e]" style={{ fontSize: '12px' }}>{comment}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={() => { setPhase("setup"); setQuestionIdx(0); setCode(""); }}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-3 transition-colors"
                style={{ fontSize: '14px', fontWeight: 600 }}
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

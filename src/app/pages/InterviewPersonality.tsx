import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Send, Mic, Video, Clock, CheckCircle2,
  AlertTriangle, Smile, Zap, RotateCcw, Brain, Star
} from "lucide-react";

type Mode = "strict" | "friendly" | "pressure";
type Phase = "select" | "intro" | "interview" | "feedback";

interface Message {
  id: number;
  role: "interviewer" | "user";
  text: string;
  timestamp: string;
}

const INTERVIEWER_PERSONAS: Record<Mode, {
  name: string;
  title: string;
  avatar: string;
  color: string;
  glow: string;
  style: string;
  company: string;
}> = {
  strict: {
    name: "Alex Chen",
    title: "Senior SDE @ FAANG",
    avatar: "👨‍💼",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    style: "Strict & Direct",
    company: "Ex-Google"
  },
  friendly: {
    name: "Sarah Kim",
    title: "Tech Lead @ Startup",
    avatar: "👩‍💻",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.4)",
    style: "Friendly & Guiding",
    company: "Ex-Meta"
  },
  pressure: {
    name: "Marcus Roy",
    title: "Director of Engineering",
    avatar: "👨‍💻",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.4)",
    style: "High Pressure",
    company: "Ex-Amazon"
  }
};

const INTERVIEW_SCRIPTS: Record<Mode, Message[]> = {
  strict: [
    { id: 1, role: "interviewer", text: "Let's begin. Implement Two Sum. I expect optimal O(n) solution only. No brute force.", timestamp: "10:00" },
    { id: 3, role: "interviewer", text: "Walk me through your approach before coding. I need to hear your thought process.", timestamp: "10:01" },
    { id: 5, role: "interviewer", text: "Why HashMap? What's the trade-off with space complexity?", timestamp: "10:03" },
    { id: 7, role: "interviewer", text: "What if the input has duplicates? Edge case: nums=[3,3], target=6?", timestamp: "10:05" },
    { id: 9, role: "interviewer", text: "Complexity analysis. Time and space. Be precise.", timestamp: "10:06" },
    { id: 11, role: "interviewer", text: "Can you do better than O(n) space? Think carefully.", timestamp: "10:08" },
    { id: 13, role: "interviewer", text: "Interview complete. I'll follow up.", timestamp: "10:10" }
  ],
  friendly: [
    { id: 1, role: "interviewer", text: "Hi! Welcome! No stress here. Let's work through Two Sum together. Have you seen this before?", timestamp: "10:00" },
    { id: 3, role: "interviewer", text: "Great thinking! Let me give you a hint — what if we use some extra memory to speed things up?", timestamp: "10:02" },
    { id: 5, role: "interviewer", text: "Exactly! A HashMap works perfectly here. Can you implement that?", timestamp: "10:04" },
    { id: 7, role: "interviewer", text: "Looking good! Don't forget to handle the edge cases — what if the array is empty?", timestamp: "10:06" },
    { id: 9, role: "interviewer", text: "Perfect! What's the time complexity of your solution?", timestamp: "10:07" },
    { id: 11, role: "interviewer", text: "That's right! O(n) time, O(n) space. Really well done!", timestamp: "10:09" },
    { id: 13, role: "interviewer", text: "Excellent performance! I'd be happy to recommend you. Any questions for me?", timestamp: "10:11" }
  ],
  pressure: [
    { id: 1, role: "interviewer", text: "Two Sum. Clock's ticking. Go.", timestamp: "10:00" },
    { id: 3, role: "interviewer", text: "That's too slow. O(n²) is unacceptable for production code. Rethink.", timestamp: "10:01" },
    { id: 5, role: "interviewer", text: "While you code — what other problems can be solved with this same pattern?", timestamp: "10:02" },
    { id: 7, role: "interviewer", text: "Stop. Your loop condition is wrong. You have 2 minutes left.", timestamp: "10:04" },
    { id: 9, role: "interviewer", text: "What if this runs on 10 million elements? Will it still perform?", timestamp: "10:05" },
    { id: 11, role: "interviewer", text: "Last chance — add proper error handling or the solution is invalid.", timestamp: "10:07" },
    { id: 13, role: "interviewer", text: "Time's up. Let's discuss what you got right and what needs work.", timestamp: "10:09" }
  ]
};

const USER_RESPONSES: Record<Mode, string[]> = {
  strict: [
    "I'll use a HashMap to achieve O(n) time complexity. For each element, I compute target - nums[i] and check if it exists in the map.",
    "My approach: iterate once through the array. Store each number's index in a HashMap. For each new number, check complement.",
    "I use a HashMap to trade O(n) space for O(n) time. The trade-off is acceptable given the constraints.",
    "Edge case nums=[3,3]: when we see the second 3, its complement 3 is already in the map at index 0, so we return [0,1]. ✓",
    "Time: O(n) — one pass through array. Space: O(n) — storing up to n elements in HashMap.",
    "For O(1) space we'd need to sort first (O(n log n)) and use two pointers, but that changes the problem since we need original indices.",
    "Thank you for the interview."
  ],
  friendly: [
    "Yes, I've seen it! I initially thought of brute force but let me think of something better...",
    "Oh! A HashMap! So I store each number as we go and check if the complement already exists?",
    "Here's my implementation — iterate, compute complement, check map, add to map if not found.",
    "Good point! Let me add: if (!nums || nums.length < 2) return []; for the empty case.",
    "O(n) time since we traverse once, O(n) space for the HashMap.",
    "Wow, thank you! This was really helpful. I learned a lot!",
    "No questions — but this was really educational, thank you!"
  ],
  pressure: [
    "Using HashMap. O(n). Here's the code.",
    "Got it. Implementing HashMap approach now.",
    "Same pattern as: Three Sum, Four Sum, Subarray Sum Equals K, all use complementary lookup.",
    "Fixed the loop. It should be i < nums.length, not i <= nums.length.",
    "Yes, O(n) time and space scales linearly. At 10M elements: ~10M ops, ~80MB memory. Acceptable.",
    "Added bounds checking and null validation. Solution is complete.",
    "I implemented the optimal O(n) solution with edge cases handled."
  ]
};

function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 p-3 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.05)', width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
        />
      ))}
    </div>
  );
}

export default function InterviewPersonality() {
  const [phase, setPhase] = useState<Phase>("select");
  const [mode, setMode] = useState<Mode>("friendly");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [scriptIndex, setScriptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState<{ clarity: number; speed: number; correctness: number; communication: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  const persona = INTERVIEWER_PERSONAS[mode];
  const script = INTERVIEW_SCRIPTS[mode];
  const userResponses = USER_RESPONSES[mode];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (phase === 'interview') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startInterview = () => {
    setPhase("intro");
    setTimeout(() => {
      setPhase("interview");
      setMessages([]);
      setScriptIndex(0);
      setTimer(0);
      // First message from interviewer
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages([script[0]]);
        }, 1500);
      }, 500);
    }, 2000);
  };

  const sendMessage = () => {
    if (!userInput.trim() && userResponses[Math.floor(scriptIndex / 2)]) {
      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        text: userInput || userResponses[Math.floor(scriptIndex / 2)],
        timestamp: `${10 + Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`
      };
      setMessages(m => [...m, userMsg]);
      setUserInput("");

      const nextScriptIdx = scriptIndex + 2;
      if (nextScriptIdx < script.length) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(m => [...m, script[nextScriptIdx]]);
          setScriptIndex(nextScriptIdx);
          if (nextScriptIdx >= script.length - 2) {
            setTimeout(() => endInterview(), 2000);
          }
        }, mode === 'pressure' ? 800 : mode === 'strict' ? 1200 : 2000);
      }
    } else if (userInput.trim()) {
      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        text: userInput,
        timestamp: `${10}:${String(timer % 60).padStart(2, '0')}`
      };
      setMessages(m => [...m, userMsg]);
      setUserInput("");

      const nextScriptIdx = scriptIndex + 2;
      if (nextScriptIdx < script.length) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(m => [...m, script[nextScriptIdx]]);
          setScriptIndex(nextScriptIdx);
        }, 1500);
      } else {
        setTimeout(() => endInterview(), 1500);
      }
    }
  };

  const useQuickResponse = () => {
    const responseIdx = Math.floor(scriptIndex / 2);
    if (responseIdx < userResponses.length) {
      setUserInput(userResponses[responseIdx]);
    }
  };

  const endInterview = () => {
    clearInterval(timerRef.current);
    setScore({
      clarity: mode === 'friendly' ? 92 : mode === 'strict' ? 78 : 85,
      speed: mode === 'pressure' ? 88 : mode === 'strict' ? 82 : 75,
      correctness: 90,
      communication: mode === 'friendly' ? 95 : mode === 'strict' ? 70 : 80,
    });
    setPhase("feedback");
  };

  const timeFmt = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  return (
    <div className="h-full flex flex-col" style={{ background: '#080b14' }}>
      <AnimatePresence mode="wait">
        {/* Mode Select */}
        {phase === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8"
          >
            <div className="text-center mb-10">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 0 30px rgba(34,197,94,0.15)' }}
              >
                <Users className="w-8 h-8" style={{ color: '#22c55e' }} />
              </div>
              <h1 className="text-white mb-2" style={{ fontSize: '28px', fontWeight: 900 }}>Interview Personality Mode</h1>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Choose your interviewer style. Each mode adapts dynamically to your responses.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-8">
              {(Object.entries(INTERVIEWER_PERSONAS) as [Mode, typeof INTERVIEWER_PERSONAS[Mode]][]).map(([modeKey, p]) => (
                <motion.div
                  key={modeKey}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(modeKey)}
                  className="rounded-2xl p-5 cursor-pointer transition-all"
                  style={{
                    background: mode === modeKey ? `${p.color}12` : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${mode === modeKey ? p.color + '40' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: mode === modeKey ? `0 0 30px ${p.glow}20` : 'none'
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '12px', filter: mode === modeKey ? `drop-shadow(0 0 12px ${p.glow})` : 'none' }}>
                    {p.avatar}
                  </div>
                  <div className="text-white mb-1" style={{ fontSize: '16px', fontWeight: 800 }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '8px' }}>{p.title}</div>
                  <div
                    className="inline-block px-2 py-0.5 rounded-full mb-3"
                    style={{ fontSize: '10px', fontWeight: 700, background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}30` }}
                  >
                    {p.company}
                  </div>
                  <div className="mt-2 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Style: <span style={{ color: p.color }}>{p.style}</span></div>
                  </div>
                  {mode === modeKey && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-3 flex items-center gap-1"
                      style={{ color: p.color, fontSize: '12px', fontWeight: 700 }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Selected
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startInterview}
              className="px-10 py-3.5 rounded-xl flex items-center gap-3 cyber-btn"
              style={{
                background: `linear-gradient(135deg, ${persona.color}, ${persona.color}99)`,
                color: 'white', fontSize: '15px', fontWeight: 800,
                boxShadow: `0 0 30px ${persona.glow}40`
              }}
            >
              <Video className="w-5 h-5" />
              Start Interview with {persona.name}
            </motion.button>
          </motion.div>
        )}

        {/* Intro Animation */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ fontSize: '64px', marginBottom: '16px' }}
              >
                {persona.avatar}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-white mb-2" style={{ fontSize: '20px', fontWeight: 800 }}>
                  Connecting to {persona.name}...
                </div>
                <div style={{ fontSize: '14px', color: '#4a5568' }}>{persona.title}</div>
                <div className="flex justify-center gap-2 mt-6">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                      className="w-3 h-3 rounded-full"
                      style={{ background: persona.color }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Interview Screen */}
        {phase === "interview" && (
          <motion.div
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${persona.color}20` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl relative"
                  style={{ background: `${persona.color}20`, boxShadow: `0 0 15px ${persona.glow}` }}
                >
                  {persona.avatar}
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: '#22c55e', borderColor: '#080b14' }} />
                </div>
                <div>
                  <div className="text-white" style={{ fontSize: '14px', fontWeight: 800 }}>{persona.name}</div>
                  <div style={{ fontSize: '11px', color: persona.color }}>● Live · {persona.style}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Clock className="w-3.5 h-3.5" style={{ color: '#4a5568' }} />
                  <span className="font-mono" style={{ fontSize: '13px', color: '#6b7280' }}>{timeFmt}</span>
                </div>
                <button
                  onClick={endInterview}
                  className="px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    fontSize: '12px', fontWeight: 600,
                    background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)'
                  }}
                >
                  End Interview
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                  >
                    {msg.role === 'interviewer' && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                        style={{ background: `${persona.color}20` }}
                      >
                        {persona.avatar}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div
                        className="px-4 py-3 rounded-2xl"
                        style={{
                          background: msg.role === 'user'
                            ? `linear-gradient(135deg, #ff6500, #ff9500)`
                            : 'rgba(255,255,255,0.06)',
                          borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                          fontSize: '13px',
                          color: 'white',
                          lineHeight: 1.6,
                          boxShadow: msg.role === 'user' ? '0 4px 15px rgba(255,101,0,0.25)' : 'none'
                        }}
                      >
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '10px', color: '#4a5568' }}>{msg.timestamp}</span>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: `${persona.color}20` }}>
                      {persona.avatar}
                    </div>
                    <TypingIndicator color={persona.color} />
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-4 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
            >
              <div className="flex gap-2 mb-2">
                <button
                  onClick={useQuickResponse}
                  className="px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    fontSize: '11px', fontWeight: 600,
                    background: 'rgba(168,85,247,0.1)',
                    color: '#a855f7',
                    border: '1px solid rgba(168,85,247,0.2)'
                  }}
                >
                  <Brain className="w-3 h-3 inline mr-1" />
                  AI Suggestion
                </button>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your response... (Enter to send)"
                  className="flex-1 rounded-xl px-4 py-3 text-white placeholder-[#4a5568] focus:outline-none"
                  style={{
                    fontSize: '13px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  className="p-3 rounded-xl cyber-btn"
                  style={{
                    background: 'linear-gradient(135deg, #ff6500, #ff9500)',
                    boxShadow: '0 0 15px rgba(255,101,0,0.4)'
                  }}
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Feedback Screen */}
        {phase === "feedback" && score && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto p-6"
          >
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-8"
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>{persona.avatar}</div>
                <h1 className="text-white" style={{ fontSize: '24px', fontWeight: 900 }}>Interview Complete!</h1>
                <p style={{ fontSize: '14px', color: '#4a5568' }}>
                  Feedback from {persona.name} · {timeFmt} duration
                </p>
              </motion.div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {Object.entries(score).map(([key, val], i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${val >= 85 ? 'rgba(34,197,94,0.25)' : val >= 70 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#4a5568', textTransform: 'capitalize', marginBottom: '8px' }}>
                      {key}
                    </div>
                    <div
                      style={{
                        fontSize: '28px', fontWeight: 900,
                        color: val >= 85 ? '#22c55e' : val >= 70 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {val}%
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                        className="h-full rounded-full"
                        style={{
                          background: val >= 85 ? '#22c55e' : val >= 70 ? '#f59e0b' : '#ef4444',
                          boxShadow: `0 0 8px ${val >= 85 ? '#22c55e' : val >= 70 ? '#f59e0b' : '#ef4444'}60`
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div
                className="rounded-2xl p-5 mb-6"
                style={{ background: `${persona.color}08`, border: `1px solid ${persona.color}20` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div style={{ fontSize: '20px' }}>{persona.avatar}</div>
                  <span className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>
                    {persona.name}'s Feedback
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7 }}>
                  {mode === 'strict'
                    ? "Your solution showed solid understanding of data structures. However, you need to be more proactive in discussing trade-offs. In real interviews, I expect you to mention space complexity limitations upfront."
                    : mode === 'friendly'
                    ? "Great job! You showed excellent communication skills and a solid grasp of HashMap usage. Your approach to edge cases was thoughtful. Keep practicing more medium-hard problems!"
                    : "You handled pressure reasonably well. Your solution was correct but you hesitated too much. In high-stakes interviews, confidence matters as much as correctness. Work on your delivery speed."
                  }
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setPhase('select'); setMessages([]); setScriptIndex(0); }}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 cyber-btn"
                style={{
                  background: 'linear-gradient(135deg, #ff6500, #ff9500)',
                  color: 'white', fontSize: '14px', fontWeight: 700,
                  boxShadow: '0 0 20px rgba(255,101,0,0.4)'
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Try Another Mode
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

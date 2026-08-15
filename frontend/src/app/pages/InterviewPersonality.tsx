import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Send, Video, Clock, CheckCircle2,
  AlertTriangle, RotateCcw, Star
} from "lucide-react";
import {
  startInterview as startInterviewApi,
  sendInterviewMessage as sendInterviewMessageApi,
  getInterviewFeedback as getInterviewFeedbackApi,
  InterviewerInfo,
  InterviewProblemContext,
  InterviewConversationMessage,
  InterviewEvaluation,
  InterviewPersonalityKey,
} from "../../services/api";

type Mode = InterviewPersonalityKey;
type Phase = "select" | "intro" | "interview" | "feedback";

interface Message {
  id: number;
  role: "interviewer" | "user";
  text: string;
  timestamp: string;
}

interface ScoreBreakdown {
  correctness: number;
  clarity: number;
  speed: number;
  communication: number;
  technicalUnderstanding: number;
  overall: number;
}

interface FinalFeedback {
  strengths: string[];
  weaknesses: string[];
  feedback: string;
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
    name: "Akash Das",
    title: "Senior SDE @ FAANG",
    avatar: "👨‍💼",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    style: "Strict & Direct",
    company: "Ex-Google"
  },
  friendly: {
    name: "Anshu Kumar",
    title: "Tech Lead @ Startup",
    avatar: "👩‍💻",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.4)",
    style: "Friendly & Guiding",
    company: "Ex-Meta"
  },
  pressure: {
    name: "Hriday Aneja",
    title: "Director of Engineering",
    avatar: "👨‍💻",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.4)",
    style: "High Pressure",
    company: "Ex-Amazon"
  }
};

const nowStamp = (): string =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;

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
  const [isTyping, setIsTyping] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [feedback, setFeedback] = useState<FinalFeedback | null>(null);

  const [interviewer, setInterviewer] = useState<InterviewerInfo | null>(null);
  const [problem, setProblem] = useState<InterviewProblemContext | null>(null);
  const [conversation, setConversation] = useState<InterviewConversationMessage[]>([]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [maxQuestions, setMaxQuestions] = useState(7);
  const [evaluations, setEvaluations] = useState<InterviewEvaluation[]>([]);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);
  const lastQuestionAtRef = useRef<number>(Date.now());

  const persona = INTERVIEWER_PERSONAS[mode];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (phase === 'interview') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startInterview = async () => {
    setLoadError(null);
    setPhase("intro");

    try {
      const result = await startInterviewApi(mode, "javascript");
      const { interviewer: startedInterviewer, problem: startedProblem, message, questionNumber: startedQuestionNumber, maxQuestions: startedMaxQuestions } = result.data;

      setInterviewer(startedInterviewer);
      setProblem(startedProblem);
      setConversation([{ role: "interviewer", content: message }]);
      setQuestionNumber(startedQuestionNumber);
      setMaxQuestions(startedMaxQuestions);
      setEvaluations([]);
      setResponseTimes([]);
      setScore(null);
      setFeedback(null);

      setTimeout(() => {
        setPhase("interview");
        setMessages([]);
        setTimer(0);
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            setMessages([{ id: Date.now(), role: "interviewer", text: message, timestamp: nowStamp() }]);
            lastQuestionAtRef.current = Date.now();
          }, 1200);
        }, 500);
      }, 1800);
    } catch (error) {
      console.error("Failed to start interview:", error);
      setLoadError("Could not start the interview. Please try again.");
      setPhase("select");
    }
  };

  const sendMessage = async () => {
    const trimmed = userInput.trim();
    if (!trimmed || isTyping || !interviewer || !problem) return;

    setSendError(null);

    const responseTimeSeconds = (Date.now() - lastQuestionAtRef.current) / 1000;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      text: trimmed,
      timestamp: nowStamp(),
    };
    setMessages(m => [...m, userMsg]);
    setUserInput("");

    const updatedConversation: InterviewConversationMessage[] = [
      ...conversation,
      { role: "candidate", content: trimmed },
    ];
    setConversation(updatedConversation);
    setResponseTimes(rt => [...rt, responseTimeSeconds]);
    setIsTyping(true);

    try {
      const result = await sendInterviewMessageApi({
        interviewer,
        problem,
        conversation: updatedConversation,
        userMessage: trimmed,
        userCode: null,
        questionNumber,
        maxQuestions,
      });

      const { evaluation, response, nextQuestion, shouldContinue, questionNumber: nextQuestionNumber } = result.data;

      setEvaluations(ev => [...ev, evaluation]);

      const interviewerText = shouldContinue && nextQuestion ? `${response}\n\n${nextQuestion}` : response;

      setIsTyping(false);
      setMessages(m => [...m, { id: Date.now() + 1, role: "interviewer", text: interviewerText, timestamp: nowStamp() }]);
      setConversation(prev => [...prev, { role: "interviewer", content: interviewerText }]);
      setQuestionNumber(nextQuestionNumber);
      lastQuestionAtRef.current = Date.now();

      if (!shouldContinue) {
        setTimeout(() => endInterview([...evaluations, evaluation], [...responseTimes, responseTimeSeconds]), 1800);
      }
    } catch (error) {
      console.error("Failed to send interview message:", error);
      setIsTyping(false);
      setSendError("Could not reach the interviewer. Please try sending your answer again.");
    }
  };

  const endInterview = async (finalEvaluations: InterviewEvaluation[], finalResponseTimes: number[]) => {
    clearInterval(timerRef.current);

    const correctnessScore = Math.round(average(finalEvaluations.map(e => e.correctnessScore)));
    const clarityScore = Math.round(average(finalEvaluations.map(e => e.clarityScore)));
    const technicalScore = Math.round(average(finalEvaluations.map(e => e.technicalScore)));
    const communicationScore = clarityScore;

    const avgResponseTime = average(finalResponseTimes);
    const speedScore = Math.round(clamp(100 - Math.max(0, avgResponseTime - 20) * 0.5, 30, 100));

    const overallScore = Math.round(
      (correctnessScore + clarityScore + speedScore + communicationScore + technicalScore) / 5
    );

    const breakdown: ScoreBreakdown = {
      correctness: correctnessScore || 50,
      clarity: clarityScore || 50,
      speed: speedScore,
      communication: communicationScore || 50,
      technicalUnderstanding: technicalScore || 50,
      overall: overallScore || 50,
    };

    setScore(breakdown);
    setPhase("feedback");

    if (!interviewer || !problem) return;

    try {
      const result = await getInterviewFeedbackApi({
        interviewer,
        problem,
        conversation,
        correctnessScore: breakdown.correctness,
        clarityScore: breakdown.clarity,
        speedScore: breakdown.speed,
        communicationScore: breakdown.communication,
        technicalScore: breakdown.technicalUnderstanding,
        overallScore: breakdown.overall,
      });
      setFeedback(result.data);
    } catch (error) {
      console.error("Failed to get interview feedback:", error);
      setFeedback({
        strengths: ["Completed the interview and engaged with follow-up questions."],
        weaknesses: ["Detailed feedback is temporarily unavailable."],
        feedback: `You scored ${breakdown.overall}/100 overall. Review your answers above to see where you can improve.`,
      });
    }
  };

  const handleEndInterviewClick = () => {
    endInterview(evaluations, responseTimes);
  };

  const timeFmt = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  const scoreEntries: [string, number][] = score
    ? [
        ["correctness", score.correctness],
        ["clarity", score.clarity],
        ["speed", score.speed],
        ["communication", score.communication],
        ["technical understanding", score.technicalUnderstanding],
      ]
    : [];

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

            {loadError && (
              <div
                className="mb-4 px-4 py-2.5 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '13px' }}
              >
                <AlertTriangle className="w-4 h-4" />
                {loadError}
              </div>
            )}

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
                  <div style={{ fontSize: '11px', color: persona.color }}>● Live · {persona.style} · Q{questionNumber}/{maxQuestions}</div>
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
                  onClick={handleEndInterviewClick}
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

            {problem && (
              <div
                className="px-5 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{problem.title}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                  {problem.topic ?? 'Topic'} · {problem.difficulty ?? 'medium'}
                </div>
              </div>
            )}

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
                          whiteSpace: 'pre-wrap',
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
              {sendError && (
                <div
                  className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '11px' }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {sendError}
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your answer or code... (Enter to send, Shift+Enter for a new line)"
                  rows={2}
                  disabled={isTyping}
                  className="flex-1 rounded-xl px-4 py-3 text-white placeholder-[#4a5568] focus:outline-none resize-none font-mono"
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
                  disabled={isTyping || !userInput.trim()}
                  className="p-3 rounded-xl cyber-btn self-end"
                  style={{
                    background: 'linear-gradient(135deg, #ff6500, #ff9500)',
                    boxShadow: '0 0 15px rgba(255,101,0,0.4)',
                    opacity: isTyping || !userInput.trim() ? 0.5 : 1,
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
                className="text-center mb-6"
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>{persona.avatar}</div>
                <h1 className="text-white" style={{ fontSize: '24px', fontWeight: 900 }}>Interview Complete!</h1>
                <p style={{ fontSize: '14px', color: '#4a5568' }}>
                  Feedback from {persona.name} · {timeFmt} duration
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6 p-4 rounded-2xl"
                style={{ background: `${persona.color}10`, border: `1px solid ${persona.color}30` }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="w-5 h-5" style={{ color: persona.color }} />
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>Overall Score</span>
                </div>
                <div style={{ fontSize: '40px', fontWeight: 900, color: persona.color }}>{score.overall}/100</div>
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {scoreEntries.map(([key, val], i) => (
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
                        fontSize: '24px', fontWeight: 900,
                        color: val >= 85 ? '#22c55e' : val >= 70 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {val}
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

              {feedback ? (
                <>
                  {(feedback.strengths.length > 0 || feedback.weaknesses.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {feedback.strengths.length > 0 && (
                        <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                            Strengths
                          </div>
                          <ul className="list-disc pl-4" style={{ fontSize: '12px', color: '#c4c9d4', lineHeight: 1.7 }}>
                            {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {feedback.weaknesses.length > 0 && (
                        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                            Areas to improve
                          </div>
                          <ul className="list-disc pl-4" style={{ fontSize: '12px', color: '#c4c9d4', lineHeight: 1.7 }}>
                            {feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

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
                    <p style={{ fontSize: '13px', color: '#c4c9d4', lineHeight: 1.7 }}>
                      {feedback.feedback}
                    </p>
                  </div>
                </>
              ) : (
                <div
                  className="rounded-2xl p-5 mb-6 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <TypingIndicator color={persona.color} />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Generating {persona.name}'s feedback...</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setPhase('select');
                  setMessages([]);
                  setConversation([]);
                  setInterviewer(null);
                  setProblem(null);
                  setScore(null);
                  setFeedback(null);
                  setLoadError(null);
                  setSendError(null);
                }}
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
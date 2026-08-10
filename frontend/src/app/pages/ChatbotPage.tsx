import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Send,
  Search,
  X,
  Bot,
  User as UserIcon,
  RotateCcw,
  ArrowLeftRight,
  Copy,
  Check,
  Loader2,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import {
  getAllProblems,
  getProblemById,
  sendTutorMessage,
  ProblemRecord,
  TutorHistoryMessage,
  TutorProblemContext,
} from "../../services/api";

// ─── Types ───────────────────────────────────────────────────────────────

type TutorMode = "entry" | "select" | "general" | "problem";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  error?: boolean;
}

interface IncomingProblemState {
  problemId?: string;
  problemTitle?: string;
  language?: string;
  code?: string;
  review?: string | null;
}

// ─── Tiny markdown-ish renderer (code fences + inline code + bold) ────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div
      className="rounded-lg overflow-hidden my-2"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: "rgba(255,255,255,0.04)", fontSize: "11px", color: "#6b7280" }}
      >
        <span>{lang || "code"}</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 transition-colors"
          style={{ color: copied ? "#22c55e" : "#6b7280" }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className="p-3 overflow-x-auto"
        style={{ background: "#0b0e17", fontSize: "12px", lineHeight: 1.6, color: "#d4d4d8" }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text: string, key: string) {
  // bold **text** and inline `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <span key={key}>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        }
        if (p.startsWith("`") && p.endsWith("`")) {
          return (
            <code
              key={i}
              style={{
                background: "rgba(255,255,255,0.08)",
                padding: "1px 5px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {p.slice(1, -1)}
            </code>
          );
        }
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </span>
  );
}

function MessageContent({ text }: { text: string }) {
  const segments = useMemo(() => {
    const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g);
    // pattern: [plain, lang, code, plain, lang, code, ...]
    const out: { type: "text" | "code"; content: string; lang?: string }[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        if (parts[i]) out.push({ type: "text", content: parts[i] });
      } else if (i % 3 === 1) {
        const lang = parts[i];
        const code = parts[i + 1] ?? "";
        out.push({ type: "code", content: code, lang });
        i += 1;
      }
    }
    return out;
  }, [text]);

  return (
    <div>
      {segments.map((seg, idx) =>
        seg.type === "code" ? (
          <CodeBlock key={idx} code={seg.content.trim()} lang={seg.lang || ""} />
        ) : (
          <div key={idx} style={{ whiteSpace: "pre-wrap" }}>
            {seg.content
              .split("\n")
              .map((line, i) => (
                <React.Fragment key={i}>
                  {renderInline(line, `${idx}-${i}`)}
                  {i < seg.content.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tutorMode, setTutorMode] = useState<TutorMode>("entry");
  const [problem, setProblem] = useState<TutorProblemContext | null>(null);
  const [problemLoading, setProblemLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Problem picker
  const [allProblems, setAllProblems] = useState<ProblemRecord[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── On mount: check if we arrived from ProblemDetail with context ──────
  useEffect(() => {
    const state = (location.state || {}) as IncomingProblemState;
    if (state?.problemId) {
      loadProblemIntoTutor(String(state.problemId), {
        language: state.language,
        code: state.code,
        review: state.review ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const loadProblemIntoTutor = async (
    problemId: string,
    extra?: { language?: string; code?: string; review?: string | null }
  ) => {
    setProblemLoading(true);
    try {
      const res = await getProblemById(problemId);
      const p = res.data;
      const ctx: TutorProblemContext = {
        id: p.id,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        constraints: p.constraints,
        examples: p.examples,
        language: extra?.language,
        code: extra?.code,
        review: extra?.review ?? null,
      };
      setProblem(ctx);
      setMessages([]);
      setTutorMode("problem");
    } catch (err) {
      console.error("Failed to load problem for tutor:", err);
      setTutorMode("select");
    } finally {
      setProblemLoading(false);
    }
  };

  const openSelectProblem = async () => {
    setTutorMode("select");
    if (allProblems.length === 0) {
      setProblemsLoading(true);
      try {
        const res = await getAllProblems();
        setAllProblems(res.data);
      } finally {
        setProblemsLoading(false);
      }
    }
  };

  const openAskAnything = () => {
    setProblem(null);
    setMessages([]);
    setTutorMode("general");
  };

  const changeProblem = () => {
    setProblem(null);
    setMessages([]);
    openSelectProblem();
  };

  const clearChat = () => setMessages([]);

  const filteredProblems = useMemo(() => {
    if (!search.trim()) return allProblems;
    const q = search.toLowerCase();
    return allProblems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.topic?.toLowerCase().includes(q) ||
        p.difficulty?.toLowerCase().includes(q)
    );
  }, [allProblems, search]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMsg = { id: `${Date.now()}-u`, role: "user", text: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    const history: TutorHistoryMessage[] = nextMessages
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const res = await sendTutorMessage({
        mode: tutorMode === "problem" ? "problem" : "general",
        message: trimmed,
        history,
        problem: tutorMode === "problem" ? problem : null,
      });
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-a`, role: "assistant", text: res.reply },
      ]);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.message || "Couldn't reach the AI tutor. Try again.";
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-e`, role: "assistant", text: msg, error: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Entry screen ───────────────────────────────────────────────────────
  if (tutorMode === "entry") {
    return (
      <div
        className="flex items-center justify-center min-h-screen px-4"
        style={{ background: "#080b14" }}
      >
        <div className="text-center max-w-md w-full">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}
          >
            <Bot className="w-8 h-8" style={{ color: "#00d4ff" }} />
          </div>
          <h1 className="text-white mb-2" style={{ fontSize: "22px", fontWeight: 800 }}>
            How can I help you?
          </h1>
          <p className="mb-8" style={{ fontSize: "13px", color: "#6b7280" }}>
            Get help with a specific problem, or ask me anything about DSA and programming.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={openSelectProblem}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all"
              style={{
                background: "rgba(255,101,0,0.08)",
                border: "1px solid rgba(255,101,0,0.25)",
                color: "white",
              }}
            >
              <BookOpen className="w-5 h-5" style={{ color: "#ff6500" }} />
              <div className="text-left">
                <div style={{ fontSize: "13px", fontWeight: 700 }}>Select a Problem</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>
                  Get problem-specific hints and guidance
                </div>
              </div>
            </button>

            <button
              onClick={openAskAnything}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all"
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.25)",
                color: "white",
              }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: "#00d4ff" }} />
              <div className="text-left">
                <div style={{ fontSize: "13px", fontWeight: 700 }}>Ask Anything</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>
                  General DSA, CS concepts, or debugging help
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Select problem screen ──────────────────────────────────────────────
  if (tutorMode === "select") {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#080b14" }}>
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => setTutorMode("entry")}
            style={{ fontSize: "12px", color: "#4a5568" }}
          >
            ← Back
          </button>
          <h2 className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>
            Select a Problem
          </h2>
        </div>

        <div className="p-4 max-w-2xl w-full mx-auto flex-1">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Search className="w-4 h-4" style={{ color: "#4a5568" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems by title, topic, or difficulty..."
              className="bg-transparent outline-none flex-1 text-white"
              style={{ fontSize: "13px" }}
              autoFocus
            />
          </div>

          {problemsLoading ? (
            <div className="flex items-center justify-center py-10" style={{ color: "#4a5568" }}>
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto">
              {filteredProblems.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadProblemIntoTutor(p.id)}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all text-left"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div>
                    <div className="text-white" style={{ fontSize: "13px", fontWeight: 600 }}>
                      {p.id}. {p.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>{p.topic}</div>
                  </div>
                  <span
                    className="rounded-lg px-2 py-0.5"
                    style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b" }}
                  >
                    {p.difficulty}
                  </span>
                </button>
              ))}
              {filteredProblems.length === 0 && (
                <p className="text-center py-8" style={{ fontSize: "12px", color: "#4a5568" }}>
                  No problems match your search.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Chat screen (general or problem mode) ──────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: "100vh", background: "#080b14" }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0 flex-wrap"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <Bot className="w-4 h-4" style={{ color: "#00d4ff" }} />
        <span className="text-white" style={{ fontSize: "13px", fontWeight: 700 }}>
          AI Tutor
        </span>

        {tutorMode === "problem" && problem ? (
          <span
            className="rounded-lg px-2.5 py-1 flex items-center gap-1.5"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              background: "rgba(255,101,0,0.08)",
              border: "1px solid rgba(255,101,0,0.2)",
              color: "#ff6500",
            }}
          >
            <BookOpen className="w-3 h-3" />
            {problemLoading ? "Loading problem..." : problem.title}
          </span>
        ) : (
          <span
            className="rounded-lg px-2.5 py-1"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#00d4ff",
            }}
          >
            General Mode
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={changeProblem}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
            style={{ fontSize: "11px", color: "#4a5568", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {tutorMode === "problem" ? "Change Problem" : "Select a Problem"}
          </button>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
            style={{ fontSize: "11px", color: "#4a5568", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Chat
          </button>
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg"
            style={{ color: "#4a5568" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10" style={{ color: "#4a5568", fontSize: "13px" }}>
              {tutorMode === "problem"
                ? `Ask me anything about "${problem?.title}" — hints, approach, complexity, or your code.`
                : "Ask me anything about DSA, algorithms, or programming."}
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className="flex gap-3"
              style={{ flexDirection: m.role === "user" ? "row-reverse" : "row" }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: m.role === "user" ? "rgba(0,212,255,0.1)" : "rgba(168,85,247,0.1)",
                  border: `1px solid ${m.role === "user" ? "rgba(0,212,255,0.3)" : "rgba(168,85,247,0.3)"}`,
                }}
              >
                {m.role === "user" ? (
                  <UserIcon className="w-3.5 h-3.5" style={{ color: "#00d4ff" }} />
                ) : (
                  <Bot className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
                )}
              </div>
              <div
                className="rounded-xl px-4 py-3 max-w-[80%]"
                style={{
                  background: m.error
                    ? "rgba(239,68,68,0.08)"
                    : m.role === "user"
                    ? "rgba(0,212,255,0.06)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    m.error
                      ? "rgba(239,68,68,0.2)"
                      : m.role === "user"
                      ? "rgba(0,212,255,0.15)"
                      : "rgba(255,255,255,0.06)"
                  }`,
                  fontSize: "13px",
                  color: m.error ? "#ef4444" : "#d4d4d8",
                  lineHeight: 1.6,
                }}
              >
                <MessageContent text={m.text} />
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}
              >
                <Bot className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
              </div>
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#a855f7" }} />
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              tutorMode === "problem"
                ? "Ask about this problem, your code, or request a hint..."
                : "Ask a DSA or programming question..."
            }
            rows={1}
            className="flex-1 rounded-xl px-4 py-2.5 text-white resize-none focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "13px",
              maxHeight: "120px",
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="flex items-center justify-center rounded-xl p-2.5 transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #ff6500, #ff9500)", color: "white" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Play,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ThumbsUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  RotateCcw,
  Eye,
  EyeOff,
  Bookmark,
  Share2,
  Code2,
  Brain,
  Send,
  X,
  Clock,
  Cpu,
  ArrowRight,
  GripVertical,
  MessageCircle,
  Bug,
  Puzzle,
  Sparkles,
} from "lucide-react";

// @ts-ignore
import Editor from "@monaco-editor/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
// @ts-ignore
import { runCode} from "../../services/api";
// @ts-ignore
import { problems } from "../data/mockData";
// @ts-ignore
import { useAuth } from "../contexts/AuthContext";
// @ts-ignore
import { useUserProgress } from "../contexts/UserProgressContext";
import { postProgressRecord, getHint, recordSubmission } from "../../services/api";
import { reviewCode } from "../../services/api";
import { getProblemById } from "../../services/api";

const diffConfig: Record<
  string,
  { text: string; bg: string; border: string; glow: string }
> = {
  Easy: {
    text: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.3)",
    glow: "rgba(34,197,94,0.2)",
  },
  Medium: {
    text: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.3)",
    glow: "rgba(245,158,11,0.2)",
  },
  Hard: {
    text: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
    glow: "rgba(239,68,68,0.2)",
  },
};

// ─── Resizable-panel tuning ─────────────────────────────────────────────────
const MIN_LEFT_WIDTH = 360;
const MIN_RIGHT_WIDTH = 380;
const MIN_EDITOR_PCT = 25;
const MAX_EDITOR_PCT = 85;

// ─── Draft auto-save (localStorage) ────────────────────────────────────────
// Keeps the user's in-progress code safe whenever they leave the editor
// (e.g. to open the AI Tutor) and restores it automatically on return.
const DRAFT_PREFIX = "algoai:draft:";
const draftKey = (problemId: string | number) => `${DRAFT_PREFIX}${problemId}`;

type CodeDraft = { code: string; language: string; updatedAt: number };

const readDraft = (problemId: string | number): CodeDraft | null => {
  try {
    const raw = localStorage.getItem(draftKey(problemId));
    return raw ? (JSON.parse(raw) as CodeDraft) : null;
  } catch {
    return null;
  }
};

const writeDraft = (problemId: string | number, draft: CodeDraft) => {
  try {
    localStorage.setItem(draftKey(problemId), JSON.stringify(draft));
  } catch {
    // localStorage can throw in private-browsing / quota-exceeded cases —
    // draft saving is a convenience, never worth crashing the editor over.
  }
};

// ─── Big-O helpers for the complexity comparison / growth chart ───────────
// These are purely illustrative classifications derived from text (either
// the problem's known-optimal complexity, or whatever Big-O notation the AI
// review mentions for the user's code). They are NOT measured performance.
const BIG_O_CLASSES = [
  { key: "O(1)", label: "O(1)", re: /O\(\s*1\s*\)/i },
  { key: "O(log n)", label: "O(log n)", re: /O\(\s*log/i },
  { key: "O(n)", label: "O(n)", re: /O\(\s*n\s*\)/i },
  { key: "O(n log n)", label: "O(n log n)", re: /O\(\s*n\s*log/i },
  { key: "O(n^2)", label: "O(n²)", re: /O\(\s*n\s*(\^|\*\*)?\s*2|O\(\s*n\s*\*\s*n/i },
  { key: "O(2^n)", label: "O(2ⁿ)", re: /O\(\s*2\s*(\^|\*\*)/i },
] as const;

const classifyBigO = (text: string | null | undefined): string | null => {
  if (!text) return null;
  for (const c of BIG_O_CLASSES) {
    if (c.re.test(text)) return c.key;
  }
  return null;
};

const extractBigO = (text: string | null | undefined): string | null => {
  if (!text) return null;
  const match = text.match(/O\([^)]{1,25}\)/i);
  return match ? match[0].replace(/\s+/g, " ").trim() : null;
};

// Fallback for when the AI review never used a recognizable "Time/Space
// Complexity" header at all — just mentioned it inline within a paragraph,
// e.g. "...the time complexity here is O(n) because of the single loop...".
// Looks for the keyword followed within a short distance by an O(...) term.
const extractComplexityMention = (
  text: string | null | undefined,
  keyword: "time" | "space",
): string | null => {
  if (!text) return null;
  const re = new RegExp(`\\b${keyword}\\b[^\\n]{0,60}?(O\\([^)]{1,25}\\))`, "i");
  const match = text.match(re);
  return match ? match[1].replace(/\s+/g, " ").trim() : null;
};

// ─── AI review text parser ──────────────────────────────────────────────
// The AI review endpoint (services/api.ts -> reviewCode) currently returns
// a single free-text string. We try to split it into the sections the UI
// wants (Approach / Bugs / Edge cases / Time / Space / Optimizations) using
// header-style matching. If the text doesn't contain recognizable headers,
// `matched` is false and callers should fall back to rendering `raw` as-is —
// this guarantees we never hide content the backend actually sent.
type ReviewSectionKey =
  | "approach"
  | "bugs"
  | "edgeCases"
  | "timeComplexity"
  | "spaceComplexity"
  | "optimizations";

interface ParsedReview {
  matched: boolean;
  approach: string;
  bugs: string[];
  edgeCases: string[];
  timeComplexity: string;
  spaceComplexity: string;
  optimizations: string[];
  raw: string;
}

const SECTION_PATTERNS: { key: ReviewSectionKey; re: RegExp }[] = [
  { key: "approach", re: /\bapproach\b/i },
  { key: "bugs", re: /\b(bugs?|issues?)\b/i },
  { key: "edgeCases", re: /\bedge[\s-]*cases?\b/i },
  { key: "timeComplexity", re: /\btime\b(\s*complexity)?/i },
  { key: "spaceComplexity", re: /\bspace\b(\s*complexity)?/i },
  { key: "optimizations", re: /\b(optimi[sz]ations?|suggestions?|improvements?)\b/i },
];

const stripHeaderMarkup = (line: string) =>
  line
    .replace(/^[#>\-\*\s\d\.\)]+/, "")
    .replace(/[\*:]+$/, "")
    .trim();

const matchHeader = (line: string): { key: ReviewSectionKey; inline: string } | null => {
  const stripped = stripHeaderMarkup(line);
  if (!stripped) return null;
  // Header lines are short ("Approach", "Time Complexity:") — long sentences
  // that merely mention a keyword shouldn't be treated as a new section.
  const wordCount = stripped.split(/\s+/).length;

  // Split on whichever separator is present: colon ("Time: O(n)") or a
  // standalone dash ("Time Complexity - O(n)"). Colon takes priority.
  let headerCandidate = stripped;
  let inline = "";
  const colonIdx = stripped.indexOf(":");
  if (colonIdx !== -1) {
    headerCandidate = stripped.slice(0, colonIdx).trim();
    inline = stripped.slice(colonIdx + 1).trim();
  } else {
    const dashMatch = stripped.match(/^(.{1,40}?)\s+[-–—]\s+(.+)$/);
    if (dashMatch) {
      headerCandidate = dashMatch[1].trim();
      inline = dashMatch[2].trim();
    }
  }

  if (headerCandidate.split(/\s+/).length > 5) return null;
  for (const p of SECTION_PATTERNS) {
    if (p.re.test(headerCandidate)) {
      return { key: p.key, inline };
    }
  }
  if (wordCount <= 5) return null;
  return null;
};

const toBullets = (text: string): string[] =>
  text
    .split("\n")
    .map((l) => l.replace(/^[\-\*•\d\.\)\s]+/, "").trim())
    .filter(Boolean);

const parseReview = (text: string): ParsedReview => {
  const empty: ParsedReview = {
    matched: false,
    approach: "",
    bugs: [],
    edgeCases: [],
    timeComplexity: "",
    spaceComplexity: "",
    optimizations: [],
    raw: text || "",
  };
  if (!text) return empty;

  const lines = text.split("\n");
  const buffers: Record<ReviewSectionKey, string[]> = {
    approach: [],
    bugs: [],
    edgeCases: [],
    timeComplexity: [],
    spaceComplexity: [],
    optimizations: [],
  };

  let current: ReviewSectionKey | null = null;
  let foundAny = false;

  for (const line of lines) {
    const header = matchHeader(line);
    if (header) {
      current = header.key;
      foundAny = true;
      if (header.inline) buffers[header.key].push(header.inline);
      continue;
    }
    if (current && line.trim()) {
      buffers[current].push(line.trim());
    }
  }

  if (!foundAny) return empty;

  return {
    matched: true,
    approach: buffers.approach.join("\n").trim(),
    bugs: toBullets(buffers.bugs.join("\n")),
    edgeCases: toBullets(buffers.edgeCases.join("\n")),
    timeComplexity: buffers.timeComplexity.join(" ").trim(),
    spaceComplexity: buffers.spaceComplexity.join(" ").trim(),
    optimizations: toBullets(buffers.optimizations.join("\n")),
    raw: text,
  };
};

// ─── Complexity level mapping (illustrative, not measured) ────────────────
// Same classification keys as classifyBigO() above, mapped to a numeric
// level (for the bar height) plus a display label (for axis ticks/tooltips).
const COMPLEXITY_LEVELS: { key: string; level: number; label: string }[] = [
  { key: "O(1)", level: 1, label: "O(1)" },
  { key: "O(log n)", level: 2, label: "O(log n)" },
  { key: "O(n)", level: 3, label: "O(n)" },
  { key: "O(n log n)", level: 4, label: "O(n log n)" },
  { key: "O(n^2)", level: 5, label: "O(n²)" },
  { key: "O(2^n)", level: 6, label: "O(2ⁿ)" },
];

const COMPLEXITY_LEVEL_BY_KEY: Record<string, { level: number; label: string }> =
  Object.fromEntries(COMPLEXITY_LEVELS.map((c) => [c.key, c]));

function ComplexityBarChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div
      style={{
        background: "#0f1420",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "6px 10px",
        fontSize: "12px",
      }}
    >
      <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: "2px" }}>
        {item.name}
      </div>
      <div style={{ color: item.key === "yourCode" ? "#ff6500" : "#22c55e", fontWeight: 600 }}>
        {item.display}
      </div>
    </div>
  );
}

// ─── Complexity comparison chart (illustrative, not measured) ─────────────
// Bar chart comparing "Your Code" vs "Optimal" for a single metric (time or
// space). Bar height = complexity level (O(1)=1 ... O(2^n)=6); the actual
// Big-O label is shown via the Y-axis ticks and the tooltip, not just the
// numeric level.
function ComplexityBarChart({
  title,
  yourClass,
  yourLabel,
  optimalClass,
  optimalLabel,
}: {
  title: string;
  yourClass: string | null;
  yourLabel: string | null;
  optimalClass: string | null;
  optimalLabel: string | null;
}) {
  const data = [
    {
      name: "Your Code",
      key: "yourCode",
      level: yourClass ? COMPLEXITY_LEVEL_BY_KEY[yourClass]?.level ?? 0 : 0,
      display: yourLabel || "Not detected",
    },
    {
      name: "Optimal",
      key: "optimal",
      level: optimalClass ? COMPLEXITY_LEVEL_BY_KEY[optimalClass]?.level ?? 0 : 0,
      display: optimalLabel || "Unknown",
    },
  ];

  return (
    <div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 6]}
            ticks={[1, 2, 3, 4, 5, 6]}
            tickFormatter={(v: number) => COMPLEXITY_LEVELS[v - 1]?.label ?? ""}
            tick={{ fill: "#4a5568", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip content={<ComplexityBarChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="level" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={entry.key === "yourCode" ? "#ff6500" : "#22c55e"}
                fillOpacity={entry.level === 0 ? 0.15 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: "10px", color: "#4a5568", marginTop: "2px" }}>
        Illustrative complexity comparison, not measured runtime.
      </p>
    </div>
  );
}

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    progress,
    incrementQuestionsAttempted,
    incrementQuestionsSolved,
    updateTopicStrength,
    setProblemStatus,
  } = useUserProgress();

  // ─── Problem ─────────────────────────────────────────────
  const [problem, setProblem] = useState<any>(null);

  useEffect(() => {
    const loadProblem = async () => {
      try {
        const response = await getProblemById(id!);
        setProblem(response.data);
      } catch (error) {
        console.error("Failed to load problem:", error);
      }
    };

    if (id) {
      loadProblem();
    }
  }, [id]);

  // ─── Code ────────────────────────────────────────────────
  const [code, setCode] = useState("");
  const saveProblemProgress = async (status: "attempted" | "solved") => {
    if (!user) return;
    try {
      await postProgressRecord({
        user_id: user.id,
        problem_id: problem.id,
        topic: problem.tags || [],
        difficulty: problem.difficulty.toLowerCase() as "easy" | "medium" | "hard",
        status,
      });
    } catch (error) {
      console.error("Failed to persist problem progress:", error);
    }
  };

  // ─── Problem Status ─────────────────────────────────────
  const currentStatus = problem
    ? progress?.problemStatus?.[problem.id] ?? "unsolved"
    : "unsolved";

  // ─── Tabs ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    "description" | "solution" | "notes"
  >("description");

  const [rightTab, setRightTab] = useState<
    "code" | "review"
  >("code");

  // ─── Hints ───────────────────────────────────────────────
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);
  const [aiHints, setAiHints] = useState<string[]>([]);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintNotice, setHintNotice] = useState<string | null>(null);

  const MAX_HINTS = 3;

  // ─── Run / Compiler ──────────────────────────────────────
  const [runResult, setRunResult] =
    useState<null | "success" | "error">(null);

  const [runMeta, setRunMeta] = useState<{
    cpuTime?: string | number | null;
    memory?: string | number | null;
  } | null>(null);

  const [passedCount, setPassedCount] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [compilerOutput, setCompilerOutput] = useState<string | null>(null);

  // ─── AI Review ───────────────────────────────────────────
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const parsedReview = useMemo(() => parseReview(aiAnalysis), [aiAnalysis]);

  // Resolved complexity text: prefer the parsed section (from a recognized
  // header), otherwise fall back to scanning the raw review text for an
  // inline "time/space ... O(...)" mention. This single resolved value
  // drives BOTH the classification (chart) AND the displayed Big-O label,
  // so they can never disagree with each other.
  const resolvedTimeText = useMemo(
    () => parsedReview.timeComplexity || extractComplexityMention(aiAnalysis, "time") || "",
    [parsedReview.timeComplexity, aiAnalysis]
  );
  const resolvedSpaceText = useMemo(
    () => parsedReview.spaceComplexity || extractComplexityMention(aiAnalysis, "space") || "",
    [parsedReview.spaceComplexity, aiAnalysis]
  );

  const yourComplexityClass = useMemo(
    () => classifyBigO(resolvedTimeText),
    [resolvedTimeText]
  );
  const optimalComplexityClass = useMemo(
    () => classifyBigO(problem?.timeComplexity),
    [problem?.timeComplexity]
  );
  const yourSpaceClass = useMemo(
    () => classifyBigO(resolvedSpaceText),
    [resolvedSpaceText]
  );
  const optimalSpaceClass = useMemo(
    () => classifyBigO(problem?.spaceComplexity),
    [problem?.spaceComplexity]
  );

  const yourTimeLabel = useMemo(() => extractBigO(resolvedTimeText), [resolvedTimeText]);
  const yourSpaceLabel = useMemo(() => extractBigO(resolvedSpaceText), [resolvedSpaceText]);
  const optimalTimeLabel = useMemo(
    () => extractBigO(problem?.timeComplexity) || problem?.timeComplexity || null,
    [problem?.timeComplexity]
  );
  const optimalSpaceLabel = useMemo(
    () => extractBigO(problem?.spaceComplexity) || problem?.spaceComplexity || null,
    [problem?.spaceComplexity]
  );

  // ─── Notes / Language ────────────────────────────────────
  const [notes, setNotes] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [language, setLanguage] = useState("javascript");

  // ─── Load problem-dependent state ────────────────────────
  // Restores an auto-saved draft for this problem if one exists, otherwise
  // falls back to the problem's starter code — so opening the AI Tutor (or
  // just navigating away) never loses in-progress work.
  useEffect(() => {
    if (!problem) return;

    const draft = readDraft(problem.id);
    if (draft?.code) {
      setCode(draft.code);
      if (draft.language) setLanguage(draft.language);
    } else {
      setCode(problem.starterCode || "");
    }

    setBookmarked(problem.status === "bookmarked");
  }, [problem]);

  // ─── Draft auto-save ────────────────────────────────────
  // Debounced save on every code/language change while a problem is loaded.
  useEffect(() => {
    if (!problem) return;
    const timeout = setTimeout(() => {
      writeDraft(problem.id, { code, language, updatedAt: Date.now() });
    }, 500);
    return () => clearTimeout(timeout);
  }, [code, language, problem]);

  // Forces an immediate (non-debounced) save — used right before navigating
  // away to the AI Tutor so the draft is guaranteed to be current.
  const saveDraftNow = () => {
    if (!problem) return;
    writeDraft(problem.id, { code, language, updatedAt: Date.now() });
  };

  const openAiTutor = () => {
    saveDraftNow();
    navigate("/chatbot", {
      state: {
        problemId: problem?.id,
        problemTitle: problem?.title,
        language,
        code,
        review: aiAnalysis || null,
      },
    });
  };

  // ─── Success screen ─────────────────────────────────────
  const [successDismissed, setSuccessDismissed] = useState(false);

  const showSuccessScreen =
    runResult === "success" && !successDismissed;

  // ─── Resizable panels ────────────────────────────────────
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined"
      ? window.innerWidth >= 1024
      : true
  );

  const [leftWidth, setLeftWidth] = useState(500);
  const [editorHeightPct, setEditorHeightPct] = useState(65);

  const containerRef = useRef<HTMLDivElement>(null);
  const editorAndResultRef = useRef<HTMLDivElement>(null);

  const isResizingHorizontal = useRef(false);
  const isResizingVertical = useRef(false);

  // ─── Loading guard ───────────────────────────────────────
  // IMPORTANT: all hooks are above this point.
  

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingHorizontal.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        const clamped = Math.min(
          Math.max(newWidth, MIN_LEFT_WIDTH),
          rect.width - MIN_RIGHT_WIDTH,
        );
        setLeftWidth(clamped);
      }

      if (isResizingVertical.current && editorAndResultRef.current) {
        const rect = editorAndResultRef.current.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const pct = (relativeY / rect.height) * 100;
        setEditorHeightPct(
          Math.min(Math.max(pct, MIN_EDITOR_PCT), MAX_EDITOR_PCT),
        );
      }
    };
    

    const handleMouseUp = () => {
      isResizingHorizontal.current = false;
      isResizingVertical.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startHorizontalResize = () => {
    isResizingHorizontal.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const startVerticalResize = () => {
    isResizingVertical.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };
  
  // ─── Loading guard ───────────────────────────────────────
if (!problem) {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        background: "#080b14",
        color: "white",
      }}
    >
      Loading problem...
    </div>
  );
}
  const dismissRunResult = () => {
    setRunResult(null);
    setCompilerOutput(null);
    setRunMeta(null);
    setPassedCount(null);
  };

  const diff = diffConfig[problem.difficulty] || diffConfig["Easy"];
  const displayExamples = (
    problem.examples?.length
      ? problem.examples
      : (problem.testCases?.map((tc: any) => ({
          input: tc.input,
          output: tc.output,
        })) ?? [])
  ) as { input: string; output: string; explanation?: string }[];

  const handleRun = async () => {
  setIsRunning(true);
  setRunResult(null);
  setCompilerOutput(null);
  setRunMeta(null);
  setPassedCount(null);
  setSuccessDismissed(false);

  const testCases = problem.testCases ?? [];
  const isFirstProblemAttempt =
    currentStatus === "unsolved" || currentStatus === "bookmarked";

  try {
    // ─────────────────────────────────────────────
    // No test cases
    // ─────────────────────────────────────────────
    if (testCases.length === 0) {
      const result: any = await runCode(code, language, "");

      if (!result.success || result.run?.code !== 0) {
        // RECORD FAILED ATTEMPT
        await recordSubmission({
          problemId: problem.id,
          status: "failed",
        });

        if (isFirstProblemAttempt) {
          incrementQuestionsAttempted();
          setProblemStatus(problem.id, "attempted");
          await saveProblemProgress("attempted");
        }

        setRunResult("error");
        setCompilerOutput(
          `❌ Error: ${
            result.run?.stderr ||
            result.message ||
            "Execution Failed"
          }`
        );

        return;
      }

      // RECORD SUCCESSFUL ATTEMPT
      await recordSubmission({
        problemId: problem.id,
        status: "passed",
      });

      setRunResult("success");
      setRunMeta(result.meta || null);
      setCompilerOutput(result.run?.stdout || "(no output)");

await saveProblemProgress("solved");

if (currentStatus !== "solved") {
  if (isFirstProblemAttempt) {
    incrementQuestionsAttempted();
  }

  incrementQuestionsSolved(10);
  setProblemStatus(problem.id, "solved");
}

      const strengthIncrease =
        problem.difficulty === "Easy"
          ? 2
          : problem.difficulty === "Medium"
          ? 3
          : 5;

      if (problem.tags?.[0]) {
        updateTopicStrength(problem.tags[0], strengthIncrease);
      }

      return;
    }

    // ─────────────────────────────────────────────
    // Run test cases
    // ─────────────────────────────────────────────
    let lastMeta: any = null;

    for (const testCase of testCases) {
      const result: any = await runCode(
        code,
        language,
        testCase.input
      );

      lastMeta = result.meta || lastMeta;

      // Compilation / runtime failure
      if (!result.success || result.run?.code !== 0) {
        await recordSubmission({
          problemId: problem.id,
          status: "failed",
        });

        if (isFirstProblemAttempt) {
          incrementQuestionsAttempted();
          setProblemStatus(problem.id, "attempted");
          await saveProblemProgress("attempted");
        }

        setRunResult("error");

        setCompilerOutput(
          `❌ Error: ${
            result.run?.stderr ||
            result.message ||
            "Execution Failed"
          }`
        );

        return;
      }

      const actual = (result.run?.stdout || "").trim();
const expected = testCase.output.trim();

const normalizeOutput = (output: string) => {
  try {
    return JSON.stringify(JSON.parse(output));
  } catch {
    return output
      .trim()
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  }
};

const normalizedActual = normalizeOutput(actual);
const normalizedExpected = normalizeOutput(expected);

// Wrong answer
if (normalizedActual !== normalizedExpected) {

        if (isFirstProblemAttempt) {
          incrementQuestionsAttempted();
          setProblemStatus(problem.id, "attempted");
          await saveProblemProgress("attempted");
        }

        setRunResult("error");

        setCompilerOutput(
          `Input: ${testCase.input}
Expected: ${expected}
Actual: ${actual}`
        );

        return;
      }
    }

    // ─────────────────────────────────────────────
    // ALL TEST CASES PASSED
    // ─────────────────────────────────────────────

    await recordSubmission({
      problemId: problem.id,
      status: "passed",
    });

    setRunResult("success");
    setRunMeta(lastMeta);
    setPassedCount(testCases.length);

    setCompilerOutput(
      `Passed ${testCases.length} test case${
        testCases.length === 1 ? "" : "s"
      }.`
    );

await saveProblemProgress("solved");

if (currentStatus !== "solved") {
  if (isFirstProblemAttempt) {
    incrementQuestionsAttempted();
  }

  incrementQuestionsSolved(10);
  setProblemStatus(problem.id, "solved");
}

    const strengthIncrease =
      problem.difficulty === "Easy"
        ? 2
        : problem.difficulty === "Medium"
        ? 3
        : 5;

    if (problem.tags?.[0]) {
      updateTopicStrength(
        problem.tags[0],
        strengthIncrease
      );
    }
  } catch (error: any) {
    setRunResult("error");

    setCompilerOutput(
      error.message ||
        "Unknown error while connecting to server."
    );
  } finally {
    setIsRunning(false);
  }
};

  const handleRevealHint = async () => {
    if (isHintLoading || revealedHints >= MAX_HINTS) return;

    setIsHintLoading(true);
    setHintNotice(null);

    try {
      const result = await getHint({
        problemId: problem.id,
        problemTitle: problem.title,
        problemDescription: problem.description ?? "",
        language,
        code,
      });

      if (result.success && result.hint) {
        setAiHints((prev) => [...prev, result.hint as string]);
        setRevealedHints((prev) => prev + 1);
      } else {
        setHintNotice(
          result.message || "Hint not available right now. Keep trying!",
        );
      }
    } catch (error) {
      setHintNotice("Couldn't fetch a hint right now. Please try again.");
    } finally {
      setIsHintLoading(false);
    }
  };
  const handleAiAnalysis = async () => {
  setIsAnalyzing(true);
  setAiAnalysis("");
  setReviewError(null);
  setRightTab("review");

  try {
    const result = await reviewCode({
      problem_title: problem.title,
      problem_description: problem.description ?? "",
      language,
      code,
    });

    console.log("AI Code Review:", result);

    setAiAnalysis(
      result.review ||
      result.message ||
      "No review was returned by AI."
    );
  } catch (error: any) {
    console.error("AI Code Review Error:", error);

    const message =
      error?.response?.data?.detail ||
      error?.message ||
      "Unable to connect to AI service.";

    setReviewError(message);
  } finally {
    setIsAnalyzing(false);
  }
};

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 64px)", background: "#080b14" }}
    >
      {/* Top Bar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <button
          onClick={() => navigate("/problems")}
          className="flex items-center gap-1 transition-colors"
          style={{ fontSize: "12px", color: "#4a5568" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6500")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4a5568")}
        >
          <ChevronLeft className="w-4 h-4" /> Problems
        </button>
        <div
          className="w-px h-4"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        <h1
          className="text-white truncate"
          style={{ fontSize: "14px", fontWeight: 700 }}
        >
          #{problem.id} {problem.title}
        </h1>
        <span
          className="rounded-lg px-2.5 py-0.5 flex-shrink-0"
          style={{
            fontSize: "11px",
            fontWeight: 700,
            background: diff.bg,
            color: diff.text,
            border: `1px solid ${diff.border}`,
            boxShadow: `0 0 10px ${diff.glow}`,
          }}
        >
          {problem.difficulty}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div
            className="flex items-center gap-1.5"
            style={{ fontSize: "12px", color: "#4a5568" }}
          >
            <ThumbsUp className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
            <span>{problem.likes?.toLocaleString() || "0"}</span>
          </div>
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="p-1.5 rounded-lg transition-all"
            style={{
              color: bookmarked ? "#00d4ff" : "#4a5568",
              background: bookmarked ? "rgba(0,212,255,0.1)" : "transparent",
            }}
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "#4a5568" }}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden" ref={containerRef}>
        {/* Left Panel */}
        <div
          className="w-full flex flex-col overflow-hidden flex-shrink-0"
          style={{
            borderRight: "1px solid rgba(255,255,255,0.06)",
            width: isDesktop ? leftWidth : undefined,
          }}
        >
          {/* Tabs */}
          <div
            className="flex flex-shrink-0"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {(["description", "solution", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setActiveTab(t);
                  setSuccessDismissed(true);
                }}
                className="px-5 py-3 capitalize transition-all"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: activeTab === t ? "#ff6500" : "#4a5568",
                  borderBottom:
                    activeTab === t
                      ? "2px solid #ff6500"
                      : "2px solid transparent",
                  background:
                    activeTab === t ? "rgba(255,101,0,0.05)" : "transparent",
                }}
              >
                {t}
              </button>
            ))}

            {showSuccessScreen && (
              <div
                className="ml-auto flex items-center gap-1.5 pr-4"
                style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e" }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {showSuccessScreen ? (
              // ─────────────────────────────────────────────
              // LeetCode-style success "landing" screen
              // ─────────────────────────────────────────────
              <div className="h-full flex flex-col items-center justify-center text-center px-8 py-10 relative">
                <button
                  onClick={() => setSuccessDismissed(true)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg transition-all"
                  style={{ color: "#4a5568" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#4a5568")}
                  aria-label="Back to problem"
                >
                  <X className="w-4 h-4" />
                </button>

                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative mb-5"
                >
                  <div
                    className="absolute inset-0 rounded-full blur-xl"
                    style={{ background: "rgba(34,197,94,0.35)" }}
                  />
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(34,197,94,0.12)",
                      border: "2px solid rgba(34,197,94,0.4)",
                    }}
                  >
                    <CheckCircle2 className="w-10 h-10" style={{ color: "#22c55e" }} />
                  </div>
                </motion.div>

                <h2 className="text-white mb-1" style={{ fontSize: "22px", fontWeight: 800 }}>
                  Accepted
                </h2>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "24px", maxWidth: "280px" }}>
                  {passedCount
                    ? `Your solution passed all ${passedCount} test case${passedCount === 1 ? "" : "s"} for "${problem.title}".`
                    : `Your solution for "${problem.title}" ran successfully.`}
                </p>

                <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center gap-1.5 justify-center mb-1" style={{ color: "#4a5568" }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Runtime
                      </span>
                    </div>
                    <div className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>
                      {runMeta?.cpuTime ? `${runMeta.cpuTime}s` : "—"}
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center gap-1.5 justify-center mb-1" style={{ color: "#4a5568" }}>
                      <Cpu className="w-3.5 h-3.5" />
                      <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Memory
                      </span>
                    </div>
                    <div className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>
                      {runMeta?.memory ? `${runMeta.memory} KB` : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSuccessDismissed(true)}
                    className="rounded-xl px-4 py-2 transition-all"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                  >
                    Back to Problem
                  </button>
                  <button
                    onClick={() => navigate("/problems")}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all"
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #ff6500, #ff9500)",
                      color: "white",
                      boxShadow: "0 0 15px rgba(255,101,0,0.25)",
                    }}
                  >
                    Next Problem <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
            {activeTab === "description" && (
              <div className="p-5 space-y-5">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {problem.tags?.map((t: string) => (
                    <span
                      key={t}
                      className="rounded-lg px-2.5 py-1"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "rgba(168,85,247,0.1)",
                        color: "#a855f7",
                        border: "1px solid rgba(168,85,247,0.2)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  <span
                    className="rounded-lg px-2.5 py-1"
                    style={{
                      fontSize: "11px",
                      background: "rgba(255,255,255,0.05)",
                      color: "#4a5568",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {problem.acceptance}% acceptance
                  </span>
                </div>

                {/* Description */}
                <div
                  className="text-white/80 whitespace-pre-wrap"
                  style={{ fontSize: "13px", lineHeight: 1.8 }}
                >
                  {problem.description}
                </div>

                {/* Examples */}
                <div>
                  <h3
                    className="text-white mb-3"
                    style={{ fontSize: "14px", fontWeight: 700 }}
                  >
                    Examples
                  </h3>
                  {displayExamples.length > 0 ? (
                    displayExamples.map((ex, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-4 mb-3"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="mb-2">
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "#4a5568",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            Input
                          </span>
                          <code
                            className="block mt-1 font-mono"
                            style={{ fontSize: "12px", color: "#22c55e" }}
                          >
                            {ex.input}
                          </code>
                        </div>
                        <div className="mb-2">
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "#4a5568",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            Output
                          </span>
                          <code
                            className="block mt-1 font-mono"
                            style={{ fontSize: "12px", color: "#00d4ff" }}
                          >
                            {ex.output}
                          </code>
                        </div>
                        {ex.explanation && (
                          <div>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#4a5568",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                              }}
                            >
                              Explanation
                            </span>
                            <p
                              className="mt-1"
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                lineHeight: 1.6,
                              }}
                            >
                              {ex.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p style={{ fontSize: "12px", color: "#6b7280" }}>
                        No examples are available for this problem yet.
                      </p>
                    </div>
                  )}
                </div>

                {/* Constraints */}
                <div>
                  <h3
                    className="text-white mb-2"
                    style={{ fontSize: "14px", fontWeight: 700 }}
                  >
                    Constraints
                  </h3>
                  <ul className="space-y-1.5">
                    {problem.constraints?.map((c: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2"
                        style={{ fontSize: "12px", color: "#6b7280" }}
                      >
                        <span
                          className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            background: "#ff6500",
                            boxShadow: "0 0 4px #ff6500",
                          }}
                        />
                        <code className="font-mono">{c}</code>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Smart Hints */}
                    {/* Smart Hints */}
<div
  className="rounded-xl overflow-hidden"
  style={{ border: "1px solid rgba(245,158,11,0.2)" }}
>
  <button
    onClick={() => setShowHints(!showHints)}
    className="w-full flex items-center gap-3 p-4 transition-all"
    style={{ background: "rgba(245,158,11,0.06)" }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.background = "rgba(245,158,11,0.1)")
    }
    onMouseLeave={(e) =>
      (e.currentTarget.style.background = "rgba(245,158,11,0.06)")
    }
  >
    <Lightbulb
      className="w-4 h-4"
      style={{ color: "#f59e0b" }}
    />

    <span
      className="text-white"
      style={{ fontSize: "13px", fontWeight: 600 }}
    >
      Smart AI Hints
    </span>

    <span
      className="ml-auto"
      style={{ fontSize: "11px", color: "#4a5568" }}
    >
      {revealedHints}/{MAX_HINTS}
    </span>

    {showHints ? (
      <ChevronUp
        className="w-4 h-4"
        style={{ color: "#4a5568" }}
      />
    ) : (
      <ChevronDown
        className="w-4 h-4"
        style={{ color: "#4a5568" }}
      />
    )}
  </button>

  <AnimatePresence>
    {showHints && (
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        exit={{ height: 0 }}
        className="overflow-hidden"
      >
        <div className="p-4 space-y-3">

          {/* Generated AI hints */}
          {aiHints.map((hint, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "#f59e0b20",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#f59e0b",
                }}
              >
                {i + 1}
              </span>

              <p
                style={{
                  fontSize: "13px",
                  color: "#d4d4d8",
                  lineHeight: 1.6,
                }}
              >
                {hint}
              </p>
            </motion.div>
          ))}

          {/* Reveal next hint */}
          {revealedHints < MAX_HINTS && (
            <button
              onClick={handleRevealHint}
              disabled={isHintLoading}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all disabled:opacity-50"
              style={{
                fontSize: "12px",
                color: "#f59e0b",
                border: "1px dashed rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.04)",
              }}
            >
              {isHintLoading ? (
                <>
                  <div
                    className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: "rgba(245,158,11,0.3)",
                      borderTopColor: "#f59e0b",
                    }}
                  />

                  Generating Hint...
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" />
                  Get AI Hint {revealedHints + 1}
                </>
              )}
            </button>
          )}

          {/* Backend/API notice */}
          {hintNotice && (
            <div
              className="rounded-lg p-3"
              style={{
                fontSize: "12px",
                color: "#f59e0b",
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.15)",
              }}
            >
              {hintNotice}
            </div>
          )}

          {/* All hints used */}
          {revealedHints >= MAX_HINTS && (
            <div
              className="text-center py-2"
              style={{
                fontSize: "11px",
                color: "#6b7280",
              }}
            >
              You've used all 3 hints for this problem.
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
    

{/* Close description tab */}
</div>
)}

{/* Solution Tab */}
{activeTab === "solution" && (
  <div className="p-5">
    <p style={{ color: "#6b7280", fontSize: "13px" }}>
      Solution will be available here.
    </p>
  </div>
)}

{/* Notes Tab */}
{activeTab === "notes" && (
  <div className="p-5">
    <textarea
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      placeholder="Write your notes here..."
      className="w-full min-h-[300px] rounded-xl p-4 text-white focus:outline-none"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        fontSize: "13px",
      }}
    />
  </div>
)}
              </>
            )}

{/* Close Content */}
</div>

{/* Close Left Panel */}
</div>

        {/* Horizontal resize handle (desktop only) */}
        <div
          className="hidden lg:flex items-center justify-center flex-shrink-0 group"
          style={{ width: "6px", cursor: "col-resize", background: "rgba(255,255,255,0.015)" }}
          onMouseDown={startHorizontalResize}
        >
          <GripVertical
            className="w-3 h-3 transition-colors"
            style={{ color: "#2d3748" }}
          />
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tabs */}
          <div
            className="flex flex-shrink-0"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <button
              onClick={() => setRightTab("code")}
              className="px-5 py-3 flex items-center gap-2 transition-all"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: rightTab === "code" ? "#ff6500" : "#4a5568",
                borderBottom:
                  rightTab === "code"
                    ? "2px solid #ff6500"
                    : "2px solid transparent",
              }}
            >
              <Code2 className="w-4 h-4" /> Code Editor
            </button>
            <button
  onClick={() => setRightTab("review")}
  className="px-5 py-3 flex items-center gap-2 transition-all"
  style={{
    fontSize: "13px",
    fontWeight: 600,
    color: rightTab === "review" ? "#a855f7" : "#4a5568",
    borderBottom:
      rightTab === "review"
        ? "2px solid #a855f7"
        : "2px solid transparent",
  }}
>
  <Brain className="w-4 h-4" />
  AI Code Review
</button>

<button
  onClick={openAiTutor}
  className="px-5 py-3 flex items-center gap-2 transition-all"
  style={{
    fontSize: "13px",
    fontWeight: 600,
    color: "#00d4ff",
  }}
>
  <MessageCircle className="w-4 h-4" />
  AI Tutor
</button>
<button
  onClick={() => navigate("/visualizer")}
  className="px-5 py-3 flex items-center gap-2 transition-all"
  style={{
    fontSize: "13px",
    fontWeight: 600,
    color: "#22c55e",
  }}
>
  <Eye className="w-4 h-4" />
  AI Code Visualizer
</button>
          </div>

          {rightTab === "code" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Editor Toolbar */}
              <div
                className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg px-2 py-1 text-white focus:outline-none"
                  style={{
                    fontSize: "12px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                  }}
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
                <button
                  onClick={() => setCode(problem.starterCode || "")}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
                  style={{ fontSize: "12px", color: "#4a5568" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ff6500")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#4a5568")
                  }
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
                  style={{ fontSize: "12px", color: "#4a5568" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#00d4ff")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#4a5568")
                  }
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <div
                  className="ml-auto flex items-center gap-1.5"
                  style={{ fontSize: "11px", color: "#4a5568" }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "#22c55e",
                      boxShadow: "0 0 6px #22c55e",
                    }}
                  />
                  Ready
                </div>
              </div>

              {/* Editor + Run Result (resizable) */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0" ref={editorAndResultRef}>
                {/* Monaco Editor */}
                <div
                  className="overflow-hidden"
                  style={{
                    height: runResult ? `${editorHeightPct}%` : "100%",
                    flexShrink: 0,
                  }}
                >
                  <Editor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={(v: string | undefined) => setCode(v || "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontLigatures: true,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      tabSize: 2,
                      automaticLayout: true,
                      scrollbar: {
                        verticalScrollbarSize: 4,
                        horizontalScrollbarSize: 4,
                      },
                      renderLineHighlight: "gutter",
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                    }}
                  />
                </div>

                {/* Vertical resize handle — only when there's a result to size against */}
                {runResult && (
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      height: "6px",
                      cursor: "row-resize",
                      background: "rgba(255,255,255,0.015)",
                    }}
                    onMouseDown={startVerticalResize}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "3px",
                        borderRadius: "2px",
                        background: "rgba(255,255,255,0.15)",
                      }}
                    />
                  </div>
                )}

                {/* Run Result */}
                <AnimatePresence>
                  {runResult && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex-1 overflow-y-auto min-h-0"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="p-4"
                        style={{
                          background:
                            runResult === "success"
                              ? "rgba(34,197,94,0.06)"
                              : "rgba(239,68,68,0.06)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {runResult === "success" ? (
                            <CheckCircle2
                              className="w-4 h-4"
                              style={{ color: "#22c55e" }}
                            />
                          ) : (
                            <XCircle
                              className="w-4 h-4"
                              style={{ color: "#ef4444" }}
                            />
                          )}
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color:
                                runResult === "success" ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {runResult === "success"
                              ? "All Test Cases Passed! ✅"
                              : "Wrong Answer ❌"}
                          </span>
                          {runResult === "error" && (
                            <button
                              onClick={handleAiAnalysis}
                              className="ml-2 flex items-center gap-1 px-3 py-1 rounded-lg transition-all"
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "rgba(255,101,0,0.1)",
                                color: "#ff6500",
                                border: "1px solid rgba(255,101,0,0.25)",
                              }}
                            >
                              <Brain className="w-3 h-3" /> Get AI Feedback
                            </button>
                          )}
                          <button
                            onClick={dismissRunResult}
                            className="ml-auto p-1 rounded-lg transition-all"
                            style={{ color: "#4a5568" }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color =
                                runResult === "success" ? "#22c55e" : "#ef4444")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "#4a5568")
                            }
                            aria-label="Dismiss result"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {compilerOutput && (
                          <pre
                            className="mt-2 whitespace-pre-wrap rounded-lg px-3 py-2 text-[11px]"
                            style={{
                              background: "rgba(15,23,42,0.9)",
                              color: "#cbd5e1",
                              lineHeight: 1.6,
                            }}
                          >
                            {compilerOutput}
                          </pre>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center gap-3 p-3 flex-shrink-0"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all disabled:opacity-50 cyber-btn"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                >
                  {isRunning ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run
                </button>
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all disabled:opacity-50 cyber-btn"
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "white",
                    boxShadow: "0 0 15px rgba(34,197,94,0.3)",
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit
                </button>
                <button
                  onClick={handleAiAnalysis}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all ml-auto cyber-btn"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "rgba(168,85,247,0.1)",
                    border: "1px solid rgba(168,85,247,0.3)",
                    color: "#a855f7",
                  }}
                >
                  <Brain className="w-4 h-4" /> AI Review
                </button>
              </div>
            </div>
          )}

          {rightTab === "review" && (
            <div className="flex-1 overflow-y-auto">
              {/* Header row: actions */}
              <div
                className="flex items-center gap-2 px-4 py-3 flex-wrap"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Brain className="w-4 h-4" style={{ color: "#a855f7" }} />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#a855f7" }}>
                  AI Code Review
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "rgba(168,85,247,0.1)",
                      border: "1px solid rgba(168,85,247,0.3)",
                      color: "#a855f7",
                    }}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    {aiAnalysis ? "Re-run Review" : "Run AI Review"}
                  </button>
                  <button
                    onClick={openAiTutor}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "rgba(0,212,255,0.1)",
                      border: "1px solid rgba(0,212,255,0.3)",
                      color: "#00d4ff",
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Ask AI Tutor
                  </button>
                  <button
                    onClick={() => navigate("/visualizer")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      color: "#22c55e",
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    AI Code Visualizer
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Loading state */}
                {isAnalyzing && (
                  <div
                    className="flex items-center gap-3 rounded-xl p-4"
                    style={{
                      background: "rgba(168,85,247,0.05)",
                      border: "1px solid rgba(168,85,247,0.15)",
                      color: "#6b7280",
                      fontSize: "13px",
                    }}
                  >
                    <div
                      className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                      style={{
                        borderColor: "rgba(168,85,247,0.3)",
                        borderTopColor: "#a855f7",
                      }}
                    />
                    Analyzing your code with AI...
                  </div>
                )}

                {/* Error state */}
                {!isAnalyzing && reviewError && (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                      fontSize: "13px",
                    }}
                  >
                    ❌ AI Code Review Failed — {reviewError}
                  </div>
                )}

                {/* Empty state */}
                {!isAnalyzing && !reviewError && !aiAnalysis && (
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px dashed rgba(255,255,255,0.1)",
                      color: "#6b7280",
                      fontSize: "13px",
                    }}
                  >
                    Run the AI review to get feedback on your approach, bugs,
                    edge cases, and complexity for this solution.
                  </div>
                )}

                {/* Results */}
                {!isAnalyzing && !reviewError && aiAnalysis && (
                  <>
                    {parsedReview.matched ? (
                      <>
                        {/* Approach */}
                        {parsedReview.approach && (
                          <section
                            className="rounded-xl p-4"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4" style={{ color: "#00d4ff" }} />
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#00d4ff" }}>
                                Approach
                              </span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#d4d4d8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                              {parsedReview.approach}
                            </p>
                          </section>
                        )}

                        {/* Bugs / Issues */}
                        {parsedReview.bugs.length > 0 && (
                          <section
                            className="rounded-xl p-4"
                            style={{
                              background: "rgba(239,68,68,0.05)",
                              border: "1px solid rgba(239,68,68,0.15)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Bug className="w-4 h-4" style={{ color: "#ef4444" }} />
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444" }}>
                                Bugs / Issues
                              </span>
                            </div>
                            <ul className="space-y-1.5">
                              {parsedReview.bugs.map((b, i) => (
                                <li key={i} className="flex items-start gap-2" style={{ fontSize: "13px", color: "#d4d4d8", lineHeight: 1.6 }}>
                                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#ef4444" }} />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {/* Edge cases */}
                        {parsedReview.edgeCases.length > 0 && (
                          <section
                            className="rounded-xl p-4"
                            style={{
                              background: "rgba(245,158,11,0.05)",
                              border: "1px solid rgba(245,158,11,0.15)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Puzzle className="w-4 h-4" style={{ color: "#f59e0b" }} />
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b" }}>
                                Edge Cases
                              </span>
                            </div>
                            <ul className="space-y-1.5">
                              {parsedReview.edgeCases.map((e, i) => (
                                <li key={i} className="flex items-start gap-2" style={{ fontSize: "13px", color: "#d4d4d8", lineHeight: 1.6 }}>
                                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
                                  {e}
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {/* Complexity comparison */}
                        {(resolvedTimeText || resolvedSpaceText || problem.timeComplexity || problem.spaceComplexity) && (
                          <section
                            className="rounded-xl p-4"
                            style={{
                              background: "rgba(0,212,255,0.05)",
                              border: "1px solid rgba(0,212,255,0.15)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Clock className="w-4 h-4" style={{ color: "#00d4ff" }} />
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#00d4ff" }}>
                                Complexity — Your Code vs Optimal
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                  Time — Your Code
                                </div>
                                <div style={{ fontSize: "15px", fontWeight: 700, color: "#ff6500", marginTop: "4px" }}>
                                  {yourTimeLabel || "Not detected"}
                                </div>
                              </div>
                              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                  Time — Optimal
                                </div>
                                <div style={{ fontSize: "15px", fontWeight: 700, color: "#22c55e", marginTop: "4px" }}>
                                  {problem.timeComplexity || "Unknown"}
                                </div>
                              </div>
                              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                  Space — Your Code
                                </div>
                                <div style={{ fontSize: "15px", fontWeight: 700, color: "#ff6500", marginTop: "4px" }}>
                                  {yourSpaceLabel || "Not detected"}
                                </div>
                              </div>
                              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                  Space — Optimal
                                </div>
                                <div style={{ fontSize: "15px", fontWeight: 700, color: "#22c55e", marginTop: "4px" }}>
                                  {problem.spaceComplexity || "Unknown"}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <ComplexityBarChart
                                title="Time Complexity"
                                yourClass={yourComplexityClass}
                                yourLabel={yourTimeLabel}
                                optimalClass={optimalComplexityClass}
                                optimalLabel={optimalTimeLabel}
                              />
                              <ComplexityBarChart
                                title="Space Complexity"
                                yourClass={yourSpaceClass}
                                yourLabel={yourSpaceLabel}
                                optimalClass={optimalSpaceClass}
                                optimalLabel={optimalSpaceLabel}
                              />
                            </div>

                            {runMeta?.cpuTime && (
                              <div
                                className="mt-3 pt-3 flex items-center gap-4"
                                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                              >
                                <span style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                  Measured (last run)
                                </span>
                                <span style={{ fontSize: "11px", color: "#6b7280" }}>
                                  Runtime {runMeta.cpuTime}s
                                  {runMeta.memory ? ` · Memory ${runMeta.memory} KB` : ""}
                                </span>
                              </div>
                            )}
                          </section>
                        )}

                        {/* Optimization suggestions */}
                        {parsedReview.optimizations.length > 0 && (
                          <section
                            className="rounded-xl p-4"
                            style={{
                              background: "rgba(34,197,94,0.05)",
                              border: "1px solid rgba(34,197,94,0.15)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4" style={{ color: "#22c55e" }} />
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>
                                Optimization Suggestions
                              </span>
                            </div>
                            <ul className="space-y-1.5">
                              {parsedReview.optimizations.map((o, i) => (
                                <li key={i} className="flex items-start gap-2" style={{ fontSize: "13px", color: "#d4d4d8", lineHeight: 1.6 }}>
                                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#22c55e" }} />
                                  {o}
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}
                      </>
                    ) : (
                      // Fallback: backend didn't return recognizable section headers —
                      // show the raw text so nothing is ever hidden from the user.
                      <section
                        className="rounded-xl p-4"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <pre
                          className="whitespace-pre-wrap"
                          style={{ fontSize: "12px", lineHeight: 1.7, color: "#d4d4d8", fontFamily: "inherit" }}
                        >
                          {parsedReview.raw}
                        </pre>
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  </div>
  )
};
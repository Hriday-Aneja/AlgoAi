import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  Code2,
  Copy,
  Trash2,
  Play,
  Pause,
  Loader,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Terminal,
  Braces,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
} from "lucide-react";
import Editor, { OnMount } from "@monaco-editor/react";
import { visualizeCode, ExecutionStep } from "../../services/api";


const SPEED_OPTIONS = [
  { label: "0.5x", value: 2500 },
  { label: "1x", value: 1500 },
  { label: "2x", value: 700 },
];

// ---------- Step normalization ----------
// Raw events from the backend come in a few flavors:
//  - regular statement/loop tracking: a FULL snapshot of every declared variable
//  - `__vizCondition`:  { __condition: boolean }  (if/while/for test result)
//  - `__vizEnter`:      { __call: functionName }
//  - `__vizExit`:       { __return: functionName }
// This turns that raw stream into a view-friendly model: a carried-forward
// variable snapshot, which variables actually changed *this* step, and
// their previous values.

type ViewKind = "statement" | "condition" | "call" | "return";

interface ViewStep {
  raw: ExecutionStep;
  kind: ViewKind;
  conditionValue?: boolean;
  callName?: string;
  returnName?: string;
  displayVars: Record<string, unknown>;
  changed: string[];
  prevValues: Record<string, unknown>;
}

const hasKey = (obj: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

const buildViewSteps = (execution: ExecutionStep[]): ViewStep[] => {
  const out: ViewStep[] = [];
  let lastFull: Record<string, unknown> = {};

  for (const raw of execution) {
    const vars = raw.variables || {};
    let kind: ViewKind = "statement";
    let conditionValue: boolean | undefined;
    let callName: string | undefined;
    let returnName: string | undefined;

    if (hasKey(vars, "__condition")) {
      kind = "condition";
      conditionValue = Boolean(vars.__condition);
    } else if (hasKey(vars, "__call")) {
      kind = "call";
      callName = String(vars.__call);
    } else if (hasKey(vars, "__return")) {
      kind = "return";
      returnName = String(vars.__return);
    }

    let displayVars = lastFull;
    const changed: string[] = [];
    const prevValues: Record<string, unknown> = {};

    if (kind === "statement") {
      const cleanVars: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(vars)) {
        if (!k.startsWith("__")) cleanVars[k] = v;
      }

      for (const key of Object.keys(cleanVars)) {
        if (JSON.stringify(lastFull[key]) !== JSON.stringify(cleanVars[key])) {
          changed.push(key);
          if (hasKey(lastFull, key)) {
            prevValues[key] = lastFull[key];
          }
        }
      }

      displayVars = cleanVars;
      lastFull = cleanVars;
    }

    out.push({ raw, kind, conditionValue, callName, returnName, displayVars, changed, prevValues });
  }

  return out;
};

const formatVal = (v: unknown): string => {
  if (v === undefined) return "undefined";
  if (typeof v === "string") return `"${v}"`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const computeArrayPointers = (
  arrName: string,
  arr: unknown[],
  displayVars: Record<string, unknown>
): Record<number, string[]> => {
  const pointers: Record<number, string[]> = {};

  for (const [name, value] of Object.entries(displayVars)) {
    if (name === arrName) continue;
    if (typeof value !== "number" || !Number.isInteger(value)) continue;
    if (value < 0 || value >= arr.length) continue;

    if (!pointers[value]) pointers[value] = [];
    pointers[value].push(name);
  }

  return pointers;
};

// ---------- Value renderers ----------

function ArrayValue({
  name,
  arr,
  changed,
  displayVars,
}: {
  name: string;
  arr: unknown[];
  changed: boolean;
  displayVars: Record<string, unknown>;
}) {
  const pointers = computeArrayPointers(name, arr, displayVars);

  return (
    <div
      className="p-3 rounded-lg"
      style={{
        background: changed ? "rgba(255,101,0,0.1)" : "rgba(255,255,255,0.03)",
        border: changed ? "1px solid rgba(255,101,0,0.25)" : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          color: changed ? "#ff9500" : "#00d4ff",
          fontSize: "11px",
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: "8px",
        }}
      >
        {name}{" "}
        <span style={{ color: "#4a5568", fontWeight: 500 }}>[{arr.length}]</span>
      </div>

      {arr.length === 0 ? (
        <div style={{ color: "#4a5568", fontSize: "11px" }}>empty array</div>
      ) : (
        <div className="flex flex-wrap gap-x-1 gap-y-3">
          {arr.map((el, idx) => {
            const isPointed = Boolean(pointers[idx]);
            return (
              <div key={idx} className="flex flex-col items-center" style={{ minWidth: "34px" }}>
                <div
                  className="flex items-center justify-center rounded-md"
                  style={{
                    width: "34px",
                    height: "30px",
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    color: isPointed ? "#ff9500" : "#e5e7eb",
                    background: isPointed ? "rgba(255,101,0,0.15)" : "rgba(255,255,255,0.05)",
                    border: isPointed ? "1.5px solid #ff6500" : "1px solid rgba(255,255,255,0.1)",
                  }}
                  title={formatVal(el)}
                >
                  {String(el)}
                </div>
                <div style={{ fontSize: "9px", color: "#4a5568", marginTop: "2px" }}>{idx}</div>
                {isPointed && (
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#ff6500",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      marginTop: "1px",
                    }}
                  >
                    ↑ {pointers[idx].join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ObjectValue({
  name,
  obj,
  changed,
}: {
  name: string;
  obj: Record<string, unknown>;
  changed: boolean;
}) {
  const entries = Object.entries(obj);

  return (
    <div
      className="p-3 rounded-lg"
      style={{
        background: changed ? "rgba(255,101,0,0.1)" : "rgba(255,255,255,0.03)",
        border: changed ? "1px solid rgba(255,101,0,0.25)" : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          color: changed ? "#ff9500" : "#00d4ff",
          fontSize: "11px",
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: entries.length ? "6px" : 0,
        }}
      >
        {name} <span style={{ color: "#4a5568", fontWeight: 500 }}>{`{${entries.length}}`}</span>
      </div>

      {entries.length === 0 ? (
        <div style={{ color: "#4a5568", fontSize: "11px" }}>empty</div>
      ) : (
        <div className="space-y-1">
          {entries.map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between gap-2 px-2 py-1 rounded-md"
              style={{
                background: "rgba(255,255,255,0.03)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11.5px",
              }}
            >
              <span style={{ color: "#00d4ff" }} className="truncate">
                {k}
              </span>
              <span style={{ color: "#4a5568" }}>→</span>
              <span style={{ color: "#f59e0b" }} className="truncate">
                {formatVal(v)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrimitiveValue({
  name,
  value,
  changed,
  prevValue,
  hasPrev,
}: {
  name: string;
  value: unknown;
  changed: boolean;
  prevValue: unknown;
  hasPrev: boolean;
}) {
  return (
    <div
      className="p-3 rounded-lg"
      style={{
        background: changed ? "rgba(255,101,0,0.1)" : "rgba(255,255,255,0.03)",
        border: changed ? "1px solid rgba(255,101,0,0.25)" : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          color: changed ? "#ff9500" : "#00d4ff",
          fontSize: "11px",
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {name}
      </div>
      <div
        style={{
          color: "#e5e7eb",
          fontSize: "12px",
          marginTop: "4px",
          fontFamily: "'JetBrains Mono', monospace",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexWrap: "wrap",
        }}
      >
        {changed && hasPrev ? (
          <>
            <span style={{ color: "#6b7280", textDecoration: "line-through" }}>
              {formatVal(prevValue)}
            </span>
            <span style={{ color: "#ff6500" }}>→</span>
            <span style={{ color: "#ff9500", fontWeight: 700 }}>{formatVal(value)}</span>
          </>
        ) : (
          <span>{formatVal(value)}</span>
        )}
        {changed && !hasPrev && (
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "#22c55e",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              padding: "1px 5px",
              borderRadius: "999px",
            }}
          >
            new
          </span>
        )}
      </div>
    </div>
  );
}

export default function CodeVisualizer() {
  const [code, setCode] = useState(
    `let nums = [2, 7, 11, 15];
let target = 9;
let map = {};

for (let i = 0; i < nums.length; i++) {
  let complement = target - nums[i];

  if (map[complement] !== undefined) {
    console.log(map[complement], i);
    break;
  }

  map[nums[i]] = i;
}`
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [execution, setExecution] = useState<ExecutionStep[]>([]);
  const [executedCode, setExecutedCode] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"variables" | "output">("variables");
  const [copied, setCopied] = useState(false);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const activeStep = execution[currentStep];

  const viewSteps = useMemo(() => buildViewSteps(execution), [execution]);
  const activeView = viewSteps[currentStep];

  const sourceLines = useMemo(() => executedCode.split("\n"), [executedCode]);
  const currentLineText = activeStep ? (sourceLines[activeStep.line - 1] || "").trim() : "";

  // Autoplay
  useEffect(() => {
    if (!playing || execution.length === 0) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= execution.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [playing, speed, execution.length]);

  // Highlight the active line inside Monaco whenever the step changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    if (!activeStep) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const monaco = monacoRef.current;
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(activeStep.line, 1, activeStep.line, 1),
        options: {
          isWholeLine: true,
          className: "cv-active-line",
          linesDecorationsClassName: "cv-active-line-gutter",
        },
      },
    ]);

    editorRef.current.revealLineInCenter(activeStep.line);
  }, [activeStep]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleVisualizeCode = async () => {
    setPlaying(false);
    if (!code.trim()) {
      setError("Please enter some code to visualize.");
      return;
    }

    setLoading(true);
    setError(null);
    setExecution([]);
    setCurrentStep(0);
    setTab("variables");

    try {
      const result = await visualizeCode(code, "javascript", input);

      if (result.success && Array.isArray(result.execution) && result.execution.length > 0) {
        setExecution(result.execution);
        setExecutedCode(code);
        setCurrentStep(0);
      } else {
        setError("No execution trace was generated.");
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to visualize code execution.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setInput("");
    setExecution([]);
    setExecutedCode("");
    setCurrentStep(0);
    setError(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const resetExecution = () => {
    setCurrentStep(0);
    setPlaying(false);
  };

  const goPrevious = () => setCurrentStep((prev) => Math.max(0, prev - 1));
  const goNext = () => setCurrentStep((prev) => Math.min(execution.length - 1, prev + 1));

  const outputSoFar = execution
    .slice(0, currentStep + 1)
    .map((s) => s.output)
    .filter(Boolean);

  return (
    <div className="h-full flex flex-col" style={{ background: "#080b14" }}>
      {/* Global styles for the active-line decoration inside Monaco */}
      <style>{`
        .cv-active-line {
          background: rgba(255,101,0,0.14) !important;
          border-left: 3px solid #ff6500;
        }
        .cv-active-line-gutter {
          background: #ff6500;
          width: 3px !important;
          margin-left: 3px;
        }
      `}</style>

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl"
            style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.2)",
              boxShadow: "0 0 20px rgba(0,212,255,0.1)",
            }}
          >
            <Eye className="w-5 h-5" style={{ color: "#00d4ff" }} />
          </div>

          <div>
            <h1 className="text-white" style={{ fontSize: "18px", fontWeight: 800 }}>
              Code Visualizer
            </h1>
            <p style={{ fontSize: "12px", color: "#4a5568" }}>
              Step-by-step JavaScript execution
            </p>
          </div>
        </div>

        <div
          className="px-3 py-2 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          JavaScript
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left — editor column, ~58% */}
        <div
          className="flex flex-col min-h-0 p-4 gap-3"
          style={{
            flex: "1 1 58%",
            minWidth: 0,
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Editor card — intentionally capped in height so it doesn't dominate the screen */}
          <div
            className="rounded-xl overflow-hidden flex flex-col flex-shrink-0"
            style={{
              height: "min(52vh, 420px)",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0b0f1a",
            }}
          >
            {/* Mini file tab bar */}
            <div
              className="flex items-center justify-between px-3 py-2 flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f56" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27c93f" }} />
                </div>
                <Code2 className="w-3.5 h-3.5" style={{ color: "#4a5568" }} />
                <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 600 }}>
                  solution.js
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: copied ? "#22c55e" : "#6b7280" }}
                  title="Copy code"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: "#6b7280" }}
                  title="Clear"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language="javascript"
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-dark"
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontLigatures: true,
                  renderLineHighlight: "none",
                  lineHeight: 22,
                  padding: { top: 10 },
                }}
              />
            </div>
          </div>

          {/* Input */}
          <div className="flex-shrink-0">
            <div
              style={{
                color: "#6b7280",
                fontSize: "11px",
                fontWeight: 700,
                marginBottom: "6px",
                letterSpacing: "0.04em",
              }}
            >
              INPUT / STDIN
            </div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Optional input..."
              className="w-full px-3 py-2 rounded-lg outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4 flex-shrink-0">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="px-3 py-2 rounded-lg flex-1"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                    fontSize: "12px",
                  }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleVisualizeCode}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg flex items-center gap-2 flex-shrink-0"
              style={{
                marginLeft: "auto",
                background: "linear-gradient(135deg,#ff6500,#ff9500)",
                color: "white",
                fontWeight: 700,
                fontSize: "13px",
                boxShadow: "0 0 20px rgba(255,101,0,0.25)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Visualizing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Visualize
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Right panel — visualization, ~42% */}
        <div
          className="flex flex-col min-h-0"
          style={{
            flex: "1 1 42%",
            minWidth: "360px",
            maxWidth: "560px",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          {execution.length === 0 && !loading && (
            <div
              className="flex-1 flex flex-col items-center justify-center p-6"
              style={{ color: "#4a5568" }}
            >
              <Code2 className="w-12 h-12 mb-3 opacity-30" />
              <p style={{ fontSize: "13px", textAlign: "center", lineHeight: 1.6 }}>
                Enter JavaScript code and click{" "}
                <span style={{ color: "#ff6500", fontWeight: 600 }}>Visualize</span> to
                inspect its execution step by step.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader className="w-8 h-8 animate-spin" style={{ color: "#ff6500" }} />
              <span style={{ fontSize: "12px", color: "#4a5568" }}>Running on Judge0...</span>
            </div>
          )}

          {activeStep && activeView && !loading && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Step header + transport controls */}
              <div
                className="p-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div style={{ color: "#ff6500", fontWeight: 700, fontSize: "13px" }}>
                      Step {currentStep + 1} / {execution.length}
                    </div>
                    <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "2px" }}>
                      Line {activeStep.line}
                    </div>
                  </div>

                  <button
                    onClick={resetExecution}
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}
                    title="Restart"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  {execution.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === currentStep ? "18px" : "6px",
                        height: "6px",
                        background:
                          i === currentStep
                            ? "#ff6500"
                            : i < currentStep
                            ? "rgba(255,101,0,0.4)"
                            : "rgba(255,255,255,0.12)",
                        boxShadow: i === currentStep ? "0 0 6px rgba(255,101,0,0.6)" : "none",
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrevious}
                    disabled={currentStep === 0}
                    className="p-2 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: currentStep === 0 ? "#374151" : "white",
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      if (currentStep === execution.length - 1) setCurrentStep(0);
                      setPlaying((prev) => !prev);
                    }}
                    className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2"
                    style={{
                      background: playing
                        ? "rgba(239,68,68,0.15)"
                        : "linear-gradient(135deg,#ff6500,#ff9500)",
                      border: playing ? "1px solid rgba(239,68,68,0.3)" : "none",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {playing ? "Pause" : "Play"}
                  </motion.button>

                  <button
                    onClick={goNext}
                    disabled={currentStep === execution.length - 1}
                    className="p-2 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: currentStep === execution.length - 1 ? "#374151" : "white",
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <span style={{ color: "#4a5568", fontSize: "11px" }}>Speed</span>
                  {SPEED_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSpeed(option.value)}
                      className="px-2 py-1 rounded-lg transition-colors"
                      style={{
                        fontSize: "11px",
                        background:
                          speed === option.value ? "rgba(255,101,0,0.15)" : "rgba(255,255,255,0.04)",
                        color: speed === option.value ? "#ff6500" : "#6b7280",
                        border:
                          speed === option.value
                            ? "1px solid rgba(255,101,0,0.3)"
                            : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current action strip: source line + condition/call badge + var deltas */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="mx-4 mt-3 p-3 rounded-xl flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,101,0,0.08), rgba(0,212,255,0.04))",
                  border: "1px solid rgba(255,101,0,0.18)",
                }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#ff6500",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Executing line {activeStep.line}
                  </span>

                  {activeView.kind === "condition" && (
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        background: activeView.conditionValue
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: activeView.conditionValue ? "#22c55e" : "#ef4444",
                        border: `1px solid ${
                          activeView.conditionValue
                            ? "rgba(34,197,94,0.3)"
                            : "rgba(239,68,68,0.3)"
                        }`,
                      }}
                    >
                      {activeView.conditionValue ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      Condition: {activeView.conditionValue ? "true" : "false"}
                    </span>
                  )}

                  {activeView.kind === "call" && (
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#a855f7",
                        background: "rgba(168,85,247,0.12)",
                        border: "1px solid rgba(168,85,247,0.25)",
                      }}
                    >
                      <LogIn className="w-3 h-3" />
                      calling {activeView.callName}()
                    </span>
                  )}

                  {activeView.kind === "return" && (
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#a855f7",
                        background: "rgba(168,85,247,0.12)",
                        border: "1px solid rgba(168,85,247,0.25)",
                      }}
                    >
                      <LogOut className="w-3 h-3" />
                      returning from {activeView.returnName}()
                    </span>
                  )}
                </div>

                {currentLineText && (
                  <pre
                    className="mt-1.5"
                    style={{
                      fontSize: "12px",
                      color: "#e5e7eb",
                      fontFamily: "'JetBrains Mono', monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {currentLineText}
                  </pre>
                )}

                {activeView.changed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {activeView.changed.map((name) => {
                      const curr = activeView.displayVars[name];
                      const hasPrev = hasKey(activeView.prevValues, name);
                      return (
                        <span
                          key={name}
                          className="px-2 py-1 rounded-md"
                          style={{
                            fontSize: "11px",
                            background: "rgba(255,101,0,0.12)",
                            border: "1px solid rgba(255,101,0,0.25)",
                            color: "#ff9500",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {name}:{" "}
                          {hasPrev
                            ? `${formatVal(activeView.prevValues[name])} → ${formatVal(curr)}`
                            : formatVal(curr)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Tabs */}
              <div
                className="flex mx-4 mt-3 rounded-xl overflow-hidden flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <button
                  onClick={() => setTab("variables")}
                  className="flex-1 py-2 flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: tab === "variables" ? "rgba(0,212,255,0.12)" : "transparent",
                    color: tab === "variables" ? "#00d4ff" : "#4a5568",
                    borderBottom: tab === "variables" ? "2px solid #00d4ff" : "2px solid transparent",
                  }}
                >
                  <Braces className="w-3.5 h-3.5" />
                  Variables
                </button>
                <button
                  onClick={() => setTab("output")}
                  className="flex-1 py-2 flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: tab === "output" ? "rgba(34,197,94,0.12)" : "transparent",
                    color: tab === "output" ? "#22c55e" : "#4a5568",
                    borderBottom: tab === "output" ? "2px solid #22c55e" : "2px solid transparent",
                  }}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Output
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <AnimatePresence mode="wait">
                  {tab === "variables" && (
                    <motion.div
                      key="variables"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      {Object.keys(activeView.displayVars).length === 0 ? (
                        <div style={{ color: "#4a5568", fontSize: "12px" }}>
                          No variables at this step.
                        </div>
                      ) : (
                        Object.entries(activeView.displayVars).map(([name, value], i) => {
                          const changed = activeView.changed.includes(name);
                          const hasPrev = hasKey(activeView.prevValues, name);

                          return (
                            <motion.div
                              key={name}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                            >
                              {Array.isArray(value) ? (
                                <ArrayValue
                                  name={name}
                                  arr={value}
                                  changed={changed}
                                  displayVars={activeView.displayVars}
                                />
                              ) : value !== null && typeof value === "object" ? (
                                <ObjectValue
                                  name={name}
                                  obj={value as Record<string, unknown>}
                                  changed={changed}
                                />
                              ) : (
                                <PrimitiveValue
                                  name={name}
                                  value={value}
                                  changed={changed}
                                  prevValue={activeView.prevValues[name]}
                                  hasPrev={hasPrev}
                                />
                              )}
                            </motion.div>
                          );
                        })
                      )}
                    </motion.div>
                  )}

                  {tab === "output" && (
                    <motion.div
                      key="output"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-3 rounded-xl"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        minHeight: "160px",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <div style={{ fontSize: "10px", color: "#4a5568", marginBottom: "8px" }}>
                        {">"} console
                      </div>

                      {outputSoFar.length === 0 ? (
                        <div style={{ color: "#374151", fontSize: "12px" }}>No output yet.</div>
                      ) : (
                        outputSoFar.map((line, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-1"
                            style={{ fontSize: "12px", color: "#d1fae5" }}
                          >
                            {line}
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
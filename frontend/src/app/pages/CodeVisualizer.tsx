import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, Code2, Sparkles, Copy, Trash2, Send, Loader } from "lucide-react";
import Editor from "@monaco-editor/react";
import { explainCodeLineByLine } from "../../services/groq";

interface CodeLineExplanation {
  lineNumber: number;
  code: string;
  explanation: string;
}

interface CodeExplanationData {
  language: string;
  code: string;
  explanation: string;
  lineByLineExplanations: CodeLineExplanation[];
  complexity?: {
    time: string;
    space: string;
  };
  error?: string;
}

export default function CodeVisualizer() {
  const [code, setCode] = useState(
    `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}`
  );

  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<CodeExplanationData | null>(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExplainCode = async () => {
    if (!code.trim()) {
      setError("Please enter some code to explain");
      return;
    }

    setLoading(true);
    setError(null);
    setExplanation(null);
    setSelectedLineIndex(null);

    const result = await explainCodeLineByLine(code, language);

    if (result.error) {
      setError(result.error);
      setExplanation(null);
    } else {
      setExplanation(result as CodeExplanationData);
    }

    setLoading(false);
  };

  const handleClear = () => {
    setCode("");
    setExplanation(null);
    setSelectedLineIndex(null);
    setError(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const currentLineExplanation = selectedLineIndex !== null && explanation
    ? explanation.lineByLineExplanations[selectedLineIndex]
    : null;

  const languages = ["javascript", "python", "java", "cpp", "csharp"];

  return (
    <div className="h-full flex flex-col" style={{ background: '#080b14' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}
          >
            <Eye className="w-5 h-5" style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: '18px', fontWeight: 800 }}>Code Explainer</h1>
            <p style={{ fontSize: '12px', color: '#4a5568' }}>Line-by-line explanation powered by Groq AI</p>
          </div>
        </div>

        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {languages.map((lang) => (
            <option key={lang} value={lang} style={{ background: '#080b14', color: 'white' }}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Panel */}
        <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Code Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                renderLineHighlight: 'line',
                lineHeight: 24,
                scrollbar: { vertical: 'visible', horizontal: 'visible' }
              }}
            />
          </div>

          {/* Controls */}
          <div
            className="flex items-center justify-between px-6 py-4 gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}
          >
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyCode}
                className="px-3 py-2 rounded-lg flex items-center gap-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#6b7280',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                title="Copy code to clipboard"
              >
                <Copy className="w-4 h-4" />
                Copy
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClear}
                className="px-3 py-2 rounded-lg flex items-center gap-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#6b7280',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                title="Clear code editor"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </motion.button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  fontSize: '12px'
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExplainCode}
              disabled={loading}
              className="px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
              style={{
                background: loading
                  ? 'rgba(99,102,241,0.3)'
                  : 'linear-gradient(135deg, #ff6500, #ff9500)',
                border: loading ? '1px solid rgba(99,102,241,0.4)' : 'none',
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: loading ? 'none' : '0 0 20px rgba(255,101,0,0.4)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Explain Code
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Explanation Panel */}
        <div className="w-96 flex flex-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          {!explanation && !loading && (
            <div
              className="flex-1 flex flex-col items-center justify-center p-6"
              style={{ color: '#4a5568' }}
            >
              <Code2 className="w-12 h-12 mb-3" style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '13px', textAlign: 'center' }}>
                Enter code and click "Explain Code" to see detailed line-by-line explanations powered by AI.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(255,101,0,0.2)',
                  borderTop: '3px solid #ff6500',
                  borderRadius: '50%',
                  marginBottom: '16px'
                }}
              />
              <p style={{ color: '#4a5568', fontSize: '13px' }}>
                Analyzing your code with Groq AI...
              </p>
            </div>
          )}

          {explanation && !loading && (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Overall Explanation */}
                <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,101,0,0.1), rgba(168,85,247,0.05))',
                      border: '1px solid rgba(255,101,0,0.2)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4" style={{ color: '#ff6500' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff6500', textTransform: 'uppercase' }}>
                        Overview
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#d1d5db', lineHeight: 1.5 }}>
                      {explanation.explanation}
                    </p>
                    {explanation.complexity && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            background: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            fontSize: '11px',
                            color: '#22c55e'
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>Time</div>
                          <div>{explanation.complexity.time}</div>
                        </div>
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            background: 'rgba(59,130,246,0.1)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            fontSize: '11px',
                            color: '#3b82f6'
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>Space</div>
                          <div>{explanation.complexity.space}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Line by Line Explanations */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                  {explanation.lineByLineExplanations.length === 0 ? (
                    <div style={{ color: '#4a5568', fontSize: '12px', textAlign: 'center', marginTop: '16px' }}>
                      No line-by-line explanations available
                    </div>
                  ) : (
                    explanation.lineByLineExplanations.map((line, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedLineIndex(selectedLineIndex === index ? null : index)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="w-full text-left p-3 rounded-lg transition-all"
                        style={{
                          background: selectedLineIndex === index
                            ? 'rgba(255,101,0,0.15)'
                            : 'rgba(255,255,255,0.03)',
                          border: selectedLineIndex === index
                            ? '1px solid rgba(255,101,0,0.3)'
                            : '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer'
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#ff6500',
                              background: 'rgba(255,101,0,0.2)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              minWidth: '30px',
                              textAlign: 'center'
                            }}
                          >
                            L{line.lineNumber}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-mono mb-1 text-xs overflow-x-auto"
                              style={{ color: '#00d4ff', opacity: 0.8 }}
                            >
                              {line.code}
                            </div>
                            {selectedLineIndex === index && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ fontSize: '12px', color: '#d1d5db', lineHeight: 1.4, marginTop: '6px' }}
                              >
                                {line.explanation}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
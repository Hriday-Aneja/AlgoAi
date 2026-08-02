/**
 * QuestionCard Component
 * Displays a single quiz question with options
 */

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { QuizQuestion } from "../../data/quizData";

interface QuestionCardProps {
  question: QuizQuestion;
  selectedAnswer: string | null;
  showExplanation: boolean;
  onSelectAnswer: (optionId: string) => void;
  index: number;
  total: number;
  color: string;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  showExplanation,
  onSelectAnswer,
  index,
  total,
  color,
}: QuestionCardProps) {
  const isCorrect = selectedAnswer === question.correctAnswer;
  const correctOption = question.options.find(
    (opt) => opt.id === question.correctAnswer
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-6 mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        border: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background: `${color}15`,
              color: color,
            }}
          >
            Question {index + 1} of {total}
          </span>
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background:
                question.difficulty === "Easy"
                  ? "rgba(34,197,94,0.15)"
                  : question.difficulty === "Medium"
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(239,68,68,0.15)",
              color:
                question.difficulty === "Easy"
                  ? "#22c55e"
                  : question.difficulty === "Medium"
                    ? "#f59e0b"
                    : "#ef4444",
            }}
          >
            {question.difficulty}
          </span>
        </div>
        <h2 className="text-white text-lg font-bold leading-relaxed">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrectOption = option.id === question.correctAnswer;
          const showCorrect = showExplanation && isCorrectOption;
          const showIncorrect = showExplanation && isSelected && !isCorrect;

          let bgColor = "rgba(255,255,255,0.04)";
          let borderColor = "rgba(255,255,255,0.06)";
          let textColor = "#e5e7eb";

          if (showCorrect) {
            bgColor = "rgba(34,197,94,0.1)";
            borderColor = "rgba(34,197,94,0.3)";
            textColor = "#e5e7eb";
          } else if (showIncorrect) {
            bgColor = "rgba(239,68,68,0.1)";
            borderColor = "rgba(239,68,68,0.3)";
            textColor = "#e5e7eb";
          } else if (isSelected && !showExplanation) {
            bgColor = `${color}15`;
            borderColor = `${color}40`;
          }

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => !selectedAnswer && onSelectAnswer(option.id)}
              disabled={selectedAnswer !== null}
              className="w-full text-left p-4 rounded-lg transition-all duration-200 cursor-pointer disabled:cursor-default flex items-center gap-3"
              style={{
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                color: textColor,
              }}
              whileHover={
                !selectedAnswer
                  ? {
                      scale: 1.02,
                      backgroundColor:
                        selectedAnswer === null
                          ? `${color}10`
                          : bgColor,
                    }
                  : {}
              }
            >
              {/* Option Label */}
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: `${color}25`,
                  color: color,
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>

              {/* Option Text */}
              <span className="flex-1 text-sm font-medium">{option.text}</span>

              {/* Result Icon */}
              {showCorrect && (
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#22c55e" }} />
              )}
              {showIncorrect && (
                <X className="w-5 h-5 flex-shrink-0" style={{ color: "#ef4444" }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg p-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1"
              style={{
                background: `${color}15`,
                color: color,
              }}
            >
              <span className="text-sm font-bold">?</span>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2">
                {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
              </h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                {question.explanation}
              </p>
              {!isCorrect && correctOption && (
                <p className="text-green-400 text-sm mt-3">
                  <span className="font-semibold">Correct Answer:</span> {correctOption.text}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

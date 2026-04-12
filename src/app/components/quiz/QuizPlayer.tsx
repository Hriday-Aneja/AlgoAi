/**
 * QuizPlayer Component
 * Main quiz interface with navigation, scoring, and question display
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCcw, Home } from "lucide-react";
import {
  getQuestionsByCategory,
  QuizCategory,
  QuizCategoryData,
  QuizQuestion,
} from "../../data/quizData";
import QuestionCard from "./QuestionCard";

interface QuizPlayerProps {
  categoryId: QuizCategory;
  categoryData: QuizCategoryData;
  onBack: () => void;
}

interface AnswerRecord {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export default function QuizPlayer({
  categoryId,
  categoryData,
  onBack,
}: QuizPlayerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);

  // Load questions on mount
  useEffect(() => {
    const loadedQuestions = getQuestionsByCategory(categoryId);
    setQuestions(loadedQuestions);
  }, [categoryId]);

  const currentQuestion = questions[currentQuestionIndex];
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const score = Math.round((correctCount / answers.length) * 100);

  const handleSelectAnswer = (optionId: string) => {
    if (selectedAnswer) return; // Prevent changing answer

    const isCorrect = optionId === currentQuestion.correctAnswer;
    setSelectedAnswer(optionId);
    setShowExplanation(true);
    setAnswers([
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedAnswer: optionId,
        isCorrect,
      },
    ]);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevAnswer = answers[currentQuestionIndex - 1];
      setSelectedAnswer(prevAnswer?.selectedAnswer || null);
      setShowExplanation(!!prevAnswer);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers([]);
    setQuizComplete(false);
  };

  // Loading state
  if (questions.length === 0) {
    return <div>Loading questions...</div>;
  }

  // Quiz complete screen
  if (quizComplete) {
    const performanceLevel =
      score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Improvement";
    const performanceColor =
      score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl p-8 text-center max-w-md mx-auto"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: `${performanceColor}20`,
            color: performanceColor,
          }}
        >
          <span className="text-4xl font-bold">{score}</span>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-gray-400 mb-6">
          You scored <span style={{ color: performanceColor, fontWeight: 600 }}>{score}%</span>
        </p>

        <div
          className="rounded-lg p-4 mb-6"
          style={{
            background: `${performanceColor}10`,
            border: `1px solid ${performanceColor}30`,
          }}
        >
          <p
            className="font-semibold mb-2"
            style={{ color: performanceColor }}
          >
            {performanceLevel}
          </p>
          <p className="text-gray-400 text-sm">
            {correctCount} out of {questions.length} questions answered correctly
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRestart}
            className="w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: `${categoryData.color}20`,
              color: categoryData.color,
              border: `1.5px solid ${categoryData.color}40`,
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>
          <button
            onClick={onBack}
            className="w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#e5e7eb",
            }}
          >
            <Home className="w-4 h-4" />
            Back to Categories
          </button>
        </div>
      </motion.div>
    );
  }

  // Quiz in progress
  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-semibold" style={{ color: categoryData.color }}>
            {correctCount} Correct
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
            className="h-full"
            style={{ background: categoryData.color }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          showExplanation={showExplanation}
          onSelectAnswer={handleSelectAnswer}
          index={currentQuestionIndex}
          total={questions.length}
          color={categoryData.color}
        />
      </AnimatePresence>

      {/* Navigation Buttons */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-between"
        >
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#e5e7eb",
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: categoryData.color,
              color: "#0a0e1a",
            }}
          >
            {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

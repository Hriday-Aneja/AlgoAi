/**
 * QuizPlayer Component
 * Main quiz interface with navigation, scoring, and question display
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCcw, Home, Trophy } from "lucide-react";
import {
  getQuestionsByCategory,
  QuizCategory,
  QuizCategoryData,
  QuizQuestion
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

const getBestScoreKey = (categoryId: QuizCategory) =>
  `algoai_quiz_best_score_${categoryId}`;

const getUsedQuestionsKey = (categoryId: QuizCategory) =>
  `algoai_quiz_used_questions_${categoryId}`;

const QUESTIONS_PER_QUIZ = 5;

/**
 * Fisher–Yates shuffle. Returns a NEW array — never mutates the input,
 * since quizData's arrays are shared module-level constants.
 */
function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Builds a fresh question set for a category: picks QUESTIONS_PER_QUIZ
 * questions that haven't appeared in this category's recent attempts
 * (tracked in localStorage), shuffles their order, and shuffles each
 * question's own option order too. Once the whole bank has been used,
 * the used-questions list resets and a fresh cycle starts.
 */
function buildShuffledQuestions(categoryId: QuizCategory): QuizQuestion[] {
  const base = getQuestionsByCategory(categoryId);

  const usedKey = getUsedQuestionsKey(categoryId);

  let usedIds: string[] = [];

  try {
    usedIds = JSON.parse(localStorage.getItem(usedKey) || "[]");
  } catch {
    usedIds = [];
  }

  // Questions which have not appeared in previous attempts
  let unusedQuestions = base.filter(
    question => !usedIds.includes(question.id)
  );

  // If not enough unused questions remain, start a fresh cycle
  if (unusedQuestions.length < QUESTIONS_PER_QUIZ) {
    usedIds = [];
    localStorage.setItem(usedKey, "[]");
    unusedQuestions = [...base];
  }

  const selectedQuestions = shuffleArray(unusedQuestions).slice(
    0,
    Math.min(QUESTIONS_PER_QUIZ, unusedQuestions.length)
  );

  return selectedQuestions.map(q => ({
    ...q,
    options: shuffleArray(q.options),
  }));
}

export default function QuizPlayer({
  categoryId,
  categoryData,
  onBack
}: QuizPlayerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    const loadedQuestions = buildShuffledQuestions(categoryId);
    setQuestions(loadedQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers([]);
    setQuizComplete(false);

    const savedBestScore = localStorage.getItem(getBestScoreKey(categoryId));
    setBestScore(savedBestScore ? Number(savedBestScore) || 0 : 0);
  }, [categoryId]);

  const currentQuestion = questions[currentQuestionIndex];

  const currentAnswer = useMemo(
    () =>
      currentQuestion
        ? answers.find(answer => answer.questionId === currentQuestion.id)
        : undefined,
    [answers, currentQuestion]
  );

  const correctCount = answers.filter(answer => answer.isCorrect).length;
  const score =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  useEffect(() => {
    if (!quizComplete) return;

    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem(getBestScoreKey(categoryId), String(score));
    }
  }, [bestScore, categoryId, quizComplete, score]);

  const syncQuestionState = (questionIndex: number) => {
    const answer = answers.find(
      record => record.questionId === questions[questionIndex]?.id
    );

    setSelectedAnswer(answer?.selectedAnswer || null);
    setShowExplanation(Boolean(answer));
  };

  const handleSelectAnswer = (optionId: string) => {
    if (!currentQuestion || currentAnswer) return;

    const isCorrect = optionId === currentQuestion.correctAnswer;
    const answerRecord: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedAnswer: optionId,
      isCorrect
    };

    setSelectedAnswer(optionId);
    setShowExplanation(true);
    setAnswers(prev => [...prev, answerRecord]);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;

      setCurrentQuestionIndex(nextIndex);

      const nextAnswer = answers.find(
        record => record.questionId === questions[nextIndex]?.id
      );

      setSelectedAnswer(nextAnswer?.selectedAnswer || null);
      setShowExplanation(Boolean(nextAnswer));
    } else {
      // Save this attempt's question IDs as "used" so the next attempt
      // for this category avoids repeating them (until the bank cycles).
      const usedKey = getUsedQuestionsKey(categoryId);

      let previousUsedIds: string[] = [];

      try {
        previousUsedIds = JSON.parse(
          localStorage.getItem(usedKey) || "[]"
        );
      } catch {
        previousUsedIds = [];
      }

      const currentQuestionIds = questions.map(question => question.id);

      const updatedUsedIds = Array.from(
        new Set([...previousUsedIds, ...currentQuestionIds])
      );

      localStorage.setItem(
        usedKey,
        JSON.stringify(updatedUsedIds)
      );

      setQuizComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const previousIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(previousIndex);
      syncQuestionState(previousIndex);
    }
  };

  const handleRestart = () => {
    setQuestions(buildShuffledQuestions(categoryId));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers([]);
    setQuizComplete(false);
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading questions...</p>
      </div>
    );
  }

  if (quizComplete) {
    const performanceLevel =
      score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Improvement";
    const performanceColor =
      score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
    const displayedBestScore = Math.max(bestScore, score);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl p-8 text-center max-w-md mx-auto"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.06)"
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: `${performanceColor}20`,
            color: performanceColor
          }}
        >
          <span className="text-4xl font-bold">{score}</span>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-gray-400 mb-6">
          You scored{" "}
          <span style={{ color: performanceColor, fontWeight: 600 }}>
            {score}%
          </span>
        </p>

        <div
          className="rounded-lg p-4 mb-4"
          style={{
            background: `${performanceColor}10`,
            border: `1px solid ${performanceColor}30`
          }}
        >
          <p className="font-semibold mb-2" style={{ color: performanceColor }}>
            {performanceLevel}
          </p>
          <p className="text-gray-400 text-sm">
            {correctCount} out of {questions.length} questions answered correctly
          </p>
        </div>

        <div
          className="rounded-lg p-3 mb-6 flex items-center justify-center gap-2"
          style={{
            background: `${categoryData.color}10`,
            border: `1px solid ${categoryData.color}25`,
            color: categoryData.color
          }}
        >
          <Trophy className="w-4 h-4" />
          <span className="text-sm font-semibold">
            Best score: {displayedBestScore}%
          </span>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRestart}
            className="w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: `${categoryData.color}20`,
              color: categoryData.color,
              border: `1.5px solid ${categoryData.color}40`
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
              color: "#e5e7eb"
            }}
          >
            <Home className="w-4 h-4" />
            Back to Categories
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
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
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
            }}
            transition={{ duration: 0.3 }}
            className="h-full"
            style={{ background: categoryData.color }}
          />
        </div>
      </div>

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
              color: "#e5e7eb"
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
              color: "#0a0e1a"
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

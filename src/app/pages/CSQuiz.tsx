/**
 * CS Fundamentals Quiz - Main Page
 * Displays quiz categories or quiz in progress
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import {
  quizCategories,
  getCategoryById,
  getQuestionsByCategory,
  QuizCategory,
  QuizCategoryData,
} from "../data/quizData";
import CategoryGrid from "../components/quiz/CategoryGrid";
import QuizPlayer from "../components/quiz/QuizPlayer";

type PageState = "categories" | "quiz" | "loading" | "error";

export default function CSQuiz() {
  const [pageState, setPageState] = useState<PageState>("categories");
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(
    null
  );
  const [categoryData, setCategoryData] = useState<QuizCategoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectCategory = async (categoryId: QuizCategory) => {
    try {
      setPageState("loading");
      setError(null);

      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const category = getCategoryById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }

      setSelectedCategory(categoryId);
      setCategoryData(category);
      setPageState("quiz");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load category"
      );
      setPageState("error");
    }
  };

  const handleBackToCategories = () => {
    setPageState("categories");
    setSelectedCategory(null);
    setCategoryData(null);
    setError(null);
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2
            className="w-8 h-8 animate-spin mx-auto mb-3"
            style={{ color: "#ff6500" }}
          />
          <p className="text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertCircle
            className="w-8 h-8 mx-auto mb-3"
            style={{ color: "#ef4444" }}
          />
          <p className="text-gray-300 font-medium">Unable to load quiz</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
          <button
            onClick={handleBackToCategories}
            className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
          >
            Back to Categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          {selectedCategory && (
            <button
              onClick={handleBackToCategories}
              className="p-2 rounded-lg hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          )}
          <div>
            <h1
              className="text-white mb-1"
              style={{ fontSize: "28px", fontWeight: 800 }}
            >
              CS Fundamentals Quiz
            </h1>
            {pageState === "categories" && (
              <p style={{ fontSize: "13px", color: "#4a5568" }}>
                Test your knowledge of core computer science concepts
              </p>
            )}
            {pageState === "quiz" && categoryData && (
              <p style={{ fontSize: "13px", color: "#4a5568" }}>
                {categoryData.description}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Page Content */}
      {pageState === "categories" && (
        <CategoryGrid
          categories={quizCategories}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {pageState === "quiz" && selectedCategory && categoryData && (
        <QuizPlayer
          categoryId={selectedCategory}
          categoryData={categoryData}
          onBack={handleBackToCategories}
        />
      )}
    </div>
  );
}

/**
 * CategoryGrid Component
 * Displays quiz categories as clickable cards
 */

import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { QuizCategoryData, QuizCategory } from "../../data/quizData";
import {
  Box,
  Cpu,
  Globe,
  Brain,
} from "lucide-react";

interface CategoryGridProps {
  categories: QuizCategoryData[];
  onSelectCategory: (categoryId: QuizCategory) => void;
}

// Mapping of icon strings to actual components
const iconComponents: Record<string, React.ReactNode> = {
  Box: <Box className="w-6 h-6" />,
  Cpu: <Cpu className="w-6 h-6" />,
  Globe: <Globe className="w-6 h-6" />,
  Brain: <Brain className="w-6 h-6" />,
};

export default function CategoryGrid({
  categories,
  onSelectCategory,
}: CategoryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categories.map((category, idx) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => onSelectCategory(category.id)}
          className="group cursor-pointer rounded-xl p-6 transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
            border: `1px solid ${category.color}20`,
            boxShadow: `0 4px 15px ${category.color}08`,
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: `0 8px 30px ${category.color}15`,
          }}
        >
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110"
            style={{
              background: `${category.color}15`,
              color: category.color,
            }}
          >
            {iconComponents[category.icon]}
          </div>

          {/* Title & Description */}
          <h3 className="text-white font-bold text-lg mb-2 group-hover:text-white transition">
            {category.name}
          </h3>
          <p
            className="text-sm mb-4 line-clamp-2 transition-colors"
            style={{ color: "#4a5568" }}
          >
            {category.description}
          </p>

          {/* Question Count & Arrow */}
          <div className="flex items-center justify-between">
            <div
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: `${category.color}15`,
                color: category.color,
              }}
            >
              {category.totalQuestions} Questions
            </div>
            <ChevronRight
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              style={{ color: category.color }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

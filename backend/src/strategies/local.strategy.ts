import {
  RecommendationInput,
  RecommendationStrategy,
  RecommendedProblem,
  Problem,
} from '../types/recommendation.types';
import { WeakTopic }          from '../types/weakTopic.types';
import { Difficulty }          from '../types/progress.types';
import { getProblemsByTopics } from '../repositories/problem.repository';

// ─── Difficulty Order ─────────────────────────────────────────────────────────

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  easy:   0,
  medium: 1,
  hard:   2,
};

// ─── Local Recommendation Strategy ───────────────────────────────────────────
//
// Current implementation: deterministic, rule-based, data from local JSON.
//
// Sorting priority (weakest & most approachable first):
//   1. Topic weakness level  — high before medium
//   2. Difficulty            — easy → medium → hard
//   3. Topic accuracy        — lower accuracy first (within same difficulty tier)

export class LocalRecommendationStrategy implements RecommendationStrategy {
  readonly name = 'local-json-v1';

  async recommend(input: RecommendationInput): Promise<RecommendedProblem[]> {
    const { weakTopics, solvedProblemIds, limit } = input;

    // ── 1. Build a quick-lookup map: topic → WeakTopic metadata ───────────────
    const weakTopicMap = new Map<string, WeakTopic>(
      weakTopics.map((wt) => [wt.topic, wt])
    );

    // ── 2. Pull candidate problems for weak topics ─────────────────────────────
    const topicNames  = weakTopics.map((wt) => wt.topic);
    const candidates  = getProblemsByTopics(topicNames);

    // ── 3. Exclude already-solved problems ────────────────────────────────────
    const unsolved    = candidates.filter((p) => !solvedProblemIds.has(p.id));

    // ── 4. Sort: topic weakness → difficulty → accuracy ───────────────────────
    const sorted = unsolved.slice().sort((a: Problem, b: Problem) => {
      const wtA = weakTopicMap.get(a.topic)!;
      const wtB = weakTopicMap.get(b.topic)!;

      // 4a. Weakness level (high < medium for ascending order)
      if (wtA.weakness_level !== wtB.weakness_level) {
        return wtA.weakness_level === 'high' ? -1 : 1;
      }

      // 4b. Difficulty (easy → medium → hard)
      const diffDelta = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
      if (diffDelta !== 0) return diffDelta;

      // 4c. Accuracy ascending (lower accuracy = needs more practice first)
      return wtA.accuracy - wtB.accuracy;
    });

    // ── 5. Slice to limit and enrich with reason + metadata ───────────────────
    return sorted.slice(0, limit).map((p) => {
      const wt = weakTopicMap.get(p.topic)!;
      return {
        ...p,
        topic_weakness: wt.weakness_level,
        reason: `Your accuracy in ${p.topic} is ${wt.accuracy}% — practice this ${p.difficulty} problem to improve.`,
      };
    });
  }
}

// ─── Future: AI Strategy (drop-in replacement) ────────────────────────────────
//
// export class AIRecommendationStrategy implements RecommendationStrategy {
//   readonly name = 'openai-gpt4-v1';
//
//   async recommend(input: RecommendationInput): Promise<RecommendedProblem[]> {
//     const prompt = buildPrompt(input);
//     const response = await openai.chat.completions.create({ ... });
//     return parseAIResponse(response, input);
//   }
// }

import { Problem } from '../types/recommendation.types';
import rawProblems from '../data/problems.json';

// ─── Repository ───────────────────────────────────────────────────────────────
//
// Loads the JSON dataset once at startup (cached in module scope).
// Because this is a plain module-level variable, Node will not reload it
// on each request — it acts as an in-memory store.
//
// FUTURE UPGRADE: Replace the JSON import with a Supabase/DB query here.
// The rest of the codebase is completely unaffected.

const ALL_PROBLEMS: Problem[] = rawProblems as Problem[];

/**
 * Returns all problems whose topic matches any of the given topics.
 * Uses a Set for O(1) lookups instead of nested array scans.
 */
export const getProblemsByTopics = (topics: string[]): Problem[] => {
  const topicSet = new Set(topics);
  return ALL_PROBLEMS.filter((p) => topicSet.has(p.topic));
};

/**
 * Returns the full problem catalogue.
 * Useful for admin or analytics endpoints.
 */
export const getAllProblems = (): Problem[] => ALL_PROBLEMS;

/**
 * Looks up a single problem by its ID.
 */
export const getProblemById = (id: string): Problem | undefined =>
  ALL_PROBLEMS.find((p) => p.id === id);

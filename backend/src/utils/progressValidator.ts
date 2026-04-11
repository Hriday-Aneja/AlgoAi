import { CreateProgressDto, Difficulty, Status } from '../types/progress.types';

// ─── Allowed Values ───────────────────────────────────────────────────────────

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const VALID_STATUSES: Status[] = ['solved', 'attempted'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isNonEmptyString = (val: unknown): val is string =>
  typeof val === 'string' && val.trim().length > 0;

const isPositiveNumber = (val: unknown): val is number =>
  typeof val === 'number' && Number.isFinite(val) && val > 0;

// ─── Validation Result ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * Validates the POST /api/progress request body.
 * Returns a list of human-readable errors (empty = valid).
 */
export const validateCreateProgress = (body: unknown): ValidationResult => {
  const errors: string[] = [];
  const data = body as Partial<CreateProgressDto>;

  // Required: user_id
  if (!isNonEmptyString(data.user_id)) {
    errors.push('user_id is required and must be a non-empty string.');
  }

  // Required: problem_id
  if (!isNonEmptyString(data.problem_id)) {
    errors.push('problem_id is required and must be a non-empty string.');
  }

  // Required: topic — string or non-empty array of strings
  if (data.topic === undefined || data.topic === null) {
    errors.push('topic is required.');
  } else if (typeof data.topic === 'string') {
    if (data.topic.trim().length === 0) {
      errors.push('topic must not be an empty string.');
    }
  } else if (Array.isArray(data.topic)) {
    if (data.topic.length === 0) {
      errors.push('topic array must contain at least one item.');
    } else if (data.topic.some((t) => !isNonEmptyString(t))) {
      errors.push('All items in topic array must be non-empty strings.');
    }
  } else {
    errors.push('topic must be a string or an array of strings.');
  }

  // Required: difficulty
  if (!VALID_DIFFICULTIES.includes(data.difficulty as Difficulty)) {
    errors.push(`difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}.`);
  }

  // Required: status
  if (!VALID_STATUSES.includes(data.status as Status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  // Optional: time_taken
  if (data.time_taken !== undefined && !isPositiveNumber(data.time_taken)) {
    errors.push('time_taken must be a positive number (seconds).');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Normalises the `topic` field to always be string[].
 */
export const normaliseTopic = (topic: string | string[]): string[] =>
  Array.isArray(topic) ? topic : [topic];

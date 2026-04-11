import supabase from '../config/supabase';
import { CreateProgressDto, UserProgress } from '../types/progress.types';
import { normaliseTopic } from '../utils/progressValidator';

const TABLE = 'user_progress';

// ─── Service Layer ────────────────────────────────────────────────────────────
// All direct Supabase / DB interactions live here.
// Controllers never touch the DB client directly.

/**
 * Upsert a progress record.
 *
 * Strategy:
 *   - Uses `onConflict` on (user_id, problem_id) to update if the row exists.
 *   - This means a user can only have ONE progress record per problem, updated in-place.
 *   - If you need a history log instead, swap this for a plain `.insert()`.
 */
export const upsertProgress = async (
  dto: CreateProgressDto
): Promise<UserProgress> => {
  const payload = {
    user_id: dto.user_id,
    problem_id: dto.problem_id,
    topic: normaliseTopic(dto.topic),
    difficulty: dto.difficulty,
    status: dto.status,
    time_taken: dto.time_taken ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, {
      onConflict: 'user_id,problem_id',   // unique constraint in migration
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Database error [upsertProgress]: ${error.message}`);
  }

  return data as UserProgress;
};

/**
 * Fetch all progress records for a given user.
 * Ordered newest-first so the frontend can paginate without extra work.
 */
export const getProgressByUser = async (
  userId: string
): Promise<UserProgress[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Database error [getProgressByUser]: ${error.message}`);
  }

  return (data ?? []) as UserProgress[];
};

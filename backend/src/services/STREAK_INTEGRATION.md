/**
 * ========================================================================
 * STREAK INTEGRATION GUIDE
 * ========================================================================
 *
 * This document explains how to integrate the streak tracking system
 * with the existing progress tracking system.
 *
 * The goal: Update the user's streak automatically when they solve a problem.
 * ========================================================================
 */

// ─── STEP 1: Add Import to progress.controller.ts ─────────────────────────────
//
// At the top of progress.controller.ts, add:
//
//   import { updateStreakOnProblemSolved } from '../services/streak.service';
//
// ─── STEP 2: Update createOrUpdateProgress to trigger streak update ───────────
//
// Modify the createOrUpdateProgress function in progress.controller.ts:
//
// BEFORE:
// --------
// export const createOrUpdateProgress = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { valid, errors } = validateCreateProgress(req.body);
//     if (!valid) {
//       res.status(400).json({
//         status: 'error',
//         message: 'Validation failed.',
//         errors,
//       });
//       return;
//     }
//
//     const dto = req.body as CreateProgressDto;
//     const result = await upsertProgress(dto);
//
//     res.status(201).json({
//       status: 'success',
//       message: 'Progress saved.',
//       data: result,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
//
// AFTER:
// -------
// export const createOrUpdateProgress = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { valid, errors } = validateCreateProgress(req.body);
//     if (!valid) {
//       res.status(400).json({
//         status: 'error',
//         message: 'Validation failed.',
//         errors,
//       });
//       return;
//     }
//
//     const dto = req.body as CreateProgressDto;
//     const result = await upsertProgress(dto);
//
//     // ─── NEW: Update streak on problem solve ────────────────────────────
//     try {
//       const timezone = req.query.timezone as string | undefined;
//       await updateStreakOnProblemSolved({
//         user_id: dto.user_id,
//         timezone: timezone || 'UTC',
//       });
//     } catch (streakError) {
//       // Log but don't fail the progress update if streak update fails
//       console.error('Streak update failed:', streakError);
//     }
//     // ────────────────────────────────────────────────────────────────────
//
//     res.status(201).json({
//       status: 'success',
//       message: 'Progress saved.',
//       data: result,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
//
// ─── ALTERNATIVE: Move to progress.service.ts ──────────────────────────────────
//
// For even cleaner architecture, you could move this logic into progress.service.ts:
//
// export const upsertProgressWithStreak = async (
//   dto: CreateProgressDto,
//   timezone?: string
// ): Promise<UserProgress> => {
//   const progress = await upsertProgress(dto);
//   
//   try {
//     await updateStreakOnProblemSolved({
//       user_id: dto.user_id,
//       timezone: timezone || 'UTC',
//     });
//   } catch (err) {
//     console.error('Streak update failed:', err);
//   }
//   
//   return progress;
// };
//
// Then in the controller:
//
// const result = await upsertProgressWithStreak(dto, req.query.timezone as string);
//
// ─── STEP 3: Run database migration ─────────────────────────────────────────────
//
// Execute the SQL from backend/supabase/migrations/003_create_streaks.sql
// in your Supabase dashboard SQL editor.
//
// This will create the 'streaks' table with proper indexes.
//
// ─── STEP 4: Test the integration ──────────────────────────────────────────────
//
// Use a REST client (curl, Postman, etc.) to test:
//
// 1. Create a progress record:
//    POST /api/progress
//    Body: {
//      "user_id": "user123",
//      "problem_id": "two-sum",
//      "topic": "arrays",
//      "difficulty": "easy",
//      "status": "solved",
//      "time_taken": 240
//    }
//
// 2. Get the streak:
//    GET /api/streak/user123
//
// 3. Test with timezone:
//    POST /api/progress?timezone=America/New_York
//
// ─── EDGE CASES HANDLED ───────────────────────────────────────────────────────
//
// ✓ Same-day submission: Streak not double-incremented
// ✓ Skipped day: Streak automatically reset to 1
// ✓ Timezone-aware: Handles user's local timezone (not UTC only)
// ✓ New user: Streak auto-created on first problem solve
// ✓ Longest streak: Automatically tracked as running best
//
// ─── API ENDPOINTS ─────────────────────────────────────────────────────────────
//
// GET /api/streak/:userId
//   Response: { currentStreak, longestStreak, lastActiveDate }
//
// POST /api/streak/:userId/update?timezone=UTC
//   Response: { currentStreak, longestStreak, lastActiveDate, streakIncremented, message }
//
// POST /api/streak/:userId/reset (admin only)
//   Response: { currentStreak, longestStreak, lastActiveDate }
//
// ─── DATABASE SCHEMA ───────────────────────────────────────────────────────────
//
// Table: public.streaks
// Columns:
//   - id (UUID, primary key)
//   - user_id (TEXT, unique)
//   - current_streak (INTEGER)
//   - longest_streak (INTEGER)
//   - last_active_date (TIMESTAMPTZ)
//   - created_at (TIMESTAMPTZ)
//   - updated_at (TIMESTAMPTZ)
//
// Indexes:
//   - idx_streaks_user_id (for fetch by user)
//   - idx_streaks_current_streak_desc (for leaderboards)
//   - idx_streaks_longest_streak_desc (for leaderboards)
//
// ========================================================================

# Streak Tracking System

A scalable, timezone-aware streak tracking system for DSA problem-solving platforms. Automatically tracks user consistency and motivates daily practice.

## Features

✅ **Automatic streak tracking** - Increments when users solve problems  
✅ **Timezone-aware** - Handles different user timezones correctly  
✅ **Same-day protection** - No double-increment for multiple submissions  
✅ **Skipped day handling** - Auto-reset if user misses a day  
✅ **Personal records** - Tracks longest streak achieved  
✅ **Non-critical failures** - Progress saves even if streak update fails  
✅ **Leaderboard-ready** - Indexes optimized for competitive features  

## Database Schema

### Table: `streaks`

```sql
Column              | Type       | Purpose
─────────────────── | ────────── | ──────────────────────────────────
id                  | UUID       | Primary key
user_id             | TEXT       | Unique identifier for user (FK)
current_streak      | INTEGER    | Current consecutive day streak
longest_streak      | INTEGER    | Historical maximum streak
last_active_date    | TIMESTAMPTZ| Timestamp of most recent solve
created_at          | TIMESTAMPTZ| Record creation time
updated_at          | TIMESTAMPTZ| Last update time
```

### Indexes

- `idx_streaks_user_id` - Primary lookup by user
- `idx_streaks_current_streak_desc` - Leaderboard queries
- `idx_streaks_longest_streak_desc` - Historical leaderboard

## API Endpoints

### GET `/api/streak/:userId`

Retrieve current and longest streak for a user.

**Parameters:**
- `userId` (path) - User identifier

**Response:**
```json
{
  "status": "success",
  "data": {
    "currentStreak": 7,
    "longestStreak": 12,
    "lastActiveDate": "2024-04-11T00:00:00Z"
  }
}
```

---

### POST `/api/streak/:userId/update`

Update streak when user solves a problem. **Called automatically from progress controller.**

**Parameters:**
- `userId` (path) - User identifier
- `timezone` (query, optional) - User's timezone (default: "UTC")
  - Examples: "America/New_York", "Europe/London", "Asia/Tokyo"

**Response:**
```json
{
  "status": "success",
  "message": "Streak continued! Day 7",
  "data": {
    "currentStreak": 7,
    "longestStreak": 7,
    "lastActiveDate": "2024-04-11T12:30:00Z",
    "streakIncremented": true
  }
}
```

**Possible messages:**
- `"Streak continued! Day X"` - Streak incremented
- `"Streak reset after skipping days. New streak: Day 1"` - User skipped a day
- `"Problem solved today already. Streak unchanged."` - Already solved today
- `"Invalid date. Streak unchanged."` - Edge case (shouldn't happen)

---

### POST `/api/streak/:userId/reset`

Manually reset a user's streak. ⚠️ **Admin only** (add auth middleware).

**Parameters:**
- `userId` (path) - User identifier

**Response:**
```json
{
  "status": "success",
  "message": "Streak reset successfully.",
  "data": {
    "currentStreak": 0,
    "longestStreak": 12,
    "lastActiveDate": "2024-04-11T12:30:00Z"
  }
}
```

*Note: `longestStreak` is preserved; only `currentStreak` resets.*

---

## Integration with Progress System

The streak system **automatically updates** when a user solves a problem via the progress controller.

### Setup

1. **Update `progress.controller.ts`:**

```typescript
import { updateStreakOnProblemSolved } from '../services/streak.service';

export const createOrUpdateProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { valid, errors } = validateCreateProgress(req.body);
    if (!valid) {
      res.status(400).json({ status: 'error', message: 'Validation failed.', errors });
      return;
    }

    const dto = req.body as CreateProgressDto;
    const result = await upsertProgress(dto);

    // Update streak if problem was solved
    if (dto.status === 'solved') {
      try {
        const timezone = (req.query.timezone as string) || 'UTC';
        await updateStreakOnProblemSolved({ user_id: dto.user_id, timezone });
      } catch (streakError) {
        console.error('Streak update failed:', streakError);
        // Don't fail the progress request
      }
    }

    res.status(201).json({ status: 'success', message: 'Progress saved.', data: result });
  } catch (err) {
    next(err);
  }
};
```

2. **Run the database migration:**

Execute [`backend/supabase/migrations/003_create_streaks.sql`](../migrations/003_create_streaks.sql) in Supabase Dashboard.

3. **Test:**

```bash
# Create a progress record
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "problem_id": "two-sum",
    "topic": "arrays",
    "difficulty": "easy",
    "status": "solved"
  }'

# Check the streak
curl http://localhost:3000/api/streak/user123
```

---

## Edge Cases & Solutions

### 1. **Same-Day Multiple Submissions**

If a user solves 3 problems on the same day, the streak increments **only once**.

**Logic:**
- Day 1: Solve Problem A → Streak = 1
- Day 1: Solve Problem B → Streak stays 1 (already counted today)
- Day 1: Solve Problem C → Streak stays 1

**Implementation:** Compare date component of `lastActiveDate` with today's date. If same date, skip increment.

### 2. **Skipped Day (Broken Streak)**

If a user skips a day and doesn't solve any problems:

**Logic:**
- Day 1: Streak = 5
- Day 2: No activity
- Day 3: Solve problem → Streak resets to 1

**Implementation:** If `daysDifference(today, lastActiveDate) > 1`, reset to 1.

### 3. **Timezone Handling**

User in NY solves a problem at 11 PM EST. In UTC, it's 4 AM the next day. The system should still count it as today.

**Solution:** All date comparisons use the user's timezone, not UTC. The `timezone` query parameter controls this.

```typescript
// Request: POST /api/progress?timezone=America/New_York
// User solves at 11 PM EST (4 AM UTC next day)
// System treats it as same day in EST timezone → no double-increment
```

### 4. **New User**

First time a new user solves a problem:

**Logic:**
- System creates a `streaks` record with `currentStreak = 1`
- Returns the new streak

**Implementation:** `getOrCreateStreak()` handles this.

### 5. **Attempted vs. Solved**

Only **solved** problems increment streaks (not **attempted**).

**Implementation:** Streak update is conditionally called only if `dto.status === 'solved'`.

---

## Utility Helpers

Use [`utils/streak.utils.ts`](../utils/streak.utils.ts) for frontend or reporting logic:

```typescript
import {
  isStreakActive,
  getStreakStatusMessage,
  daysUntilStreakBreaks,
  formatStreak,
  getStreakSummary,
} from '../utils/streak.utils';

const summary = getStreakSummary(streak);
console.log(summary.statusMessage); // "You're on a 7-day streak! 🔥"

console.log(formatStreak(7)); // "7 days 🔥"
console.log(daysUntilStreakBreaks(streak)); // 1 (breaking tomorrow)
```

---

## Performance Considerations

### Database

- Single lookup by `user_id` (unique index)
- Streak update is atomic (single UPDATE query)
- Leaderboard queries use DESC indexes for fast sorting

### Error Handling

- Streak update failures don't prevent progress from saving
- Errors logged but non-blocking
- Graceful degradation: if streak service is down, progress still works

### Scalability

- Minimal overhead: ~1 additional query per problem solve
- No N+1 queries; uses direct database updates
- Suitable for millions of users

---

## Testing

### Manual Test Cases

**Test 1: First-time solve**
```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "user1", "problem_id": "step-in-place", "topic": "arrays", "difficulty": "medium", "status": "solved" }'

curl http://localhost:3000/api/streak/user1
# Expected: { "currentStreak": 1, "longestStreak": 1 }
```

**Test 2: Same-day solve (no increment)**
```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "user1", "problem_id": "two-sum", "topic": "arrays", "difficulty": "easy", "status": "solved" }'

curl http://localhost:3000/api/streak/user1
# Expected: { "currentStreak": 1, "longestStreak": 1 } (unchanged)
```

**Test 3: Different timezone**
```bash
curl -X POST http://localhost:3000/api/progress?timezone=Asia/Tokyo \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "user2", "problem_id": "problem-x", "topic": "graphs", "difficulty": "hard", "status": "solved" }'
```

---

## Future Enhancements

- [ ] Streak freeze system (use in-game currency to prevent resets)
- [ ] Leaderboard endpoints (top streaks today/week/month)
- [ ] Streak notifications (reminder before breaking)
- [ ] Historical streak tracking (store broken streaks)
- [ ] Team/group streaks
- [ ] Badges for milestones (7-day, 30-day, 100-day)

---

## Files Created

```
backend/
├── src/
│   ├── controllers/
│   │   └── streak.controller.ts          # HTTP handlers
│   ├── services/
│   │   ├── streak.service.ts             # Core business logic
│   │   ├── STREAK_INTEGRATION.md         # Integration guide
│   │   └── INTEGRATION_EXAMPLE.ts        # Code example
│   ├── types/
│   │   └── streak.types.ts               # TypeScript interfaces
│   ├── routes/
│   │   └── streak.routes.ts              # API routes
│   └── utils/
│       └── streak.utils.ts               # Helper functions
├── prisma/
│   └── schema.prisma                     # Updated with Streak model
└── supabase/
    └── migrations/
        └── 003_create_streaks.sql        # Database migration
```

---

## Support

For issues, feature requests, or improvements:
1. Check edge cases in this document
2. Review `STREAK_INTEGRATION.md` for setup problems
3. Consult `streak.service.ts` for core logic

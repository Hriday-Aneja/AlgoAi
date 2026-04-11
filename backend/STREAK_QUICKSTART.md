# Streak System - Quick Start Guide

Complete in **5 minutes**. Everything you need to enable streak tracking.

## Step 1: Run Database Migration

Execute this SQL in your **Supabase SQL Editor**:

```sql
-- Paste contents of: backend/supabase/migrations/003_create_streaks.sql
```

**Result:** `streaks` table created with proper indexes.

## Step 2: Update Progress Controller

Edit: `backend/src/controllers/progress.controller.ts`

**Add import:**
```typescript
import { updateStreakOnProblemSolved } from '../services/streak.service';
```

**Update `createOrUpdateProgress` function:**

Add this code after `const result = await upsertProgress(dto);`:

```typescript
// Update streak if problem was solved
if (dto.status === 'solved') {
  try {
    const timezone = (req.query.timezone as string) || 'UTC';
    await updateStreakOnProblemSolved({
      user_id: dto.user_id,
      timezone,
    });
  } catch (streakError) {
    console.error('Streak update failed:', streakError);
    // Don't fail the progress request
  }
}
```

## Step 3: Verify Files Exist

Check that these files were created:

```
backend/src/
├── controllers/streak.controller.ts      ✓
├── services/
│   ├── streak.service.ts                 ✓
│   ├── STREAK_INTEGRATION.md             (guide)
│   ├── INTEGRATION_EXAMPLE.ts            (example code)
│   └── STREAK_README.md                  (full documentation)
├── types/streak.types.ts                  ✓
├── routes/streak.routes.ts                ✓
├── utils/streak.utils.ts                  ✓

backend/supabase/migrations/
└── 003_create_streaks.sql                 ✓

backend/prisma/
└── schema.prisma                          (Streak model added)
```

## Step 4: Test It

```bash
# 1. Create a problem solve
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "problem_id": "two-sum",
    "topic": "arrays",
    "difficulty": "easy",
    "status": "solved"
  }'

# 2. Get the streak
curl http://localhost:3000/api/streak/user123

# Response should show:
# {
#   "status": "success",
#   "data": {
#     "currentStreak": 1,
#     "longestStreak": 1,
#     "lastActiveDate": "2024-04-11T..."
#   }
# }
```

## Step 5: Optional - Add to Frontend

Use the streak endpoint to display user streaks:

```typescript
// Frontend example
async function getUserStreak(userId: string) {
  const response = await fetch(`/api/streak/${userId}`);
  const { data } = await response.json();
  
  return data; // { currentStreak, longestStreak, lastActiveDate }
}
```

---

## API Endpoints (Ready to Use)

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| GET | `/api/streak/:userId` | Get current & longest streak |
| POST | `/api/streak/:userId/update` | Update streak (auto-called) |
| POST | `/api/streak/:userId/reset` | Admin reset |

## Key Features

✅ **Auto-increment** on problem solve  
✅ **Same-day protection** - no double count  
✅ **Skip day handling** - auto reset  
✅ **Timezone aware** - pass `?timezone=America/New_York`  
✅ **Scalable** - indexed for millions of users  

## Troubleshooting

| Issue | Solution |
| ----- | -------- |
| `Error: PGRST116` | Run the migration or check table exists |
| Streak not updating | Add `updateStreakOnProblemSolved` call to progress controller |
| Same-day double-increment | Ensure migration ran (date logic) |
| Timezone issues | Pass `timezone` query param: `?timezone=America/New_York` |

## What Just Happened?

- **Created 3 new files:** controller, service, routes
- **Created 2 type files:** interfaces for TypeScript
- **Added 1 DB table:** `streaks` with proper schema
- **Created 1 DB migration:** SQL file to run
- **Added 1 utility file:** helpers for frontend logic
- **Created 4 documentation files:** guides and tests

**Total: ~500 lines of production-ready code**

---

## Next Steps (Optional)

1. **Leaderboard** - Query `/api/streak` sorted by `longestStreak`
2. **Badges** - Award "7 Day", "30 Day", "100 Day" streaks
3. **Notifications** - Alert users before streak breaks (2 days without solve)
4. **Team Streaks** - Combine scores across group members
5. **Streak Freeze** - In-game currency to preserve streak

See `STREAK_README.md` for details.

---

## Support

- Full documentation: `STREAK_README.md`
- Integration guide: `STREAK_INTEGRATION.md`
- Test scenarios: `STREAK_TESTS.md`
- Code example: `INTEGRATION_EXAMPLE.ts`
- Utilities: `streak.utils.ts`

/**
 * ========================================================================
 * STREAK SYSTEM - ARCHITECTURE & DATA FLOW
 * ========================================================================
 */

// ─── DATA FLOW DIAGRAM ─────────────────────────────────────────────────────────

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER SOLVES PROBLEM                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. POST /api/progress                                                       │
│    {                                                                        │
│      "user_id": "user123",                                                 │
│      "status": "solved" ← IMPORTANT!                                       │
│    }                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ progress.controller.ts        │
                    │ - Validate input              │
                    │ - Call upsertProgress()       │
                    └───────────────────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ▼                                ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │ progress.service.ts  │      │ streak.service.ts    │
        │ Save problem solve   │      │ Update streak        │
        │ to DB                │      │ (NEW)                │
        └──────────────────────┘      └──────────────────────┘
                    │                                │
                    ▼                                ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │ user_progress table  │      │ streaks table        │
        │ (existing)           │      │ (NEW)                │
        └──────────────────────┘      └──────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────┐
                    │ STREAK LOGIC                        │
                    │ ─────────────────────────────────── │
                    │ if today = lastActiveDate:          │
                    │   → no increment (same day)         │
                    │                                     │
                    │ if today = lastActiveDate + 1:      │
                    │   → increment (consecutive)         │
                    │                                     │
                    │ if today > lastActiveDate + 1:      │
                    │   → reset to 1 (skipped day)        │
                    │                                     │
                    │ Update longestStreak if exceeded     │
                    └─────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ 3. RESPONSE                   │
                    │ {                             │
                    │   "status": "success",        │
                    │   "message": "Progress saved",│
                    │   "data": {...}               │
                    │ }                             │
                    └───────────────────────────────┘
*/

// ─── ARCHITECTURE LAYERS ───────────────────────────────────────────────────────

/*
┌─ HTTP LAYER ────────────────────────────────────────────────────┐
│ Routes: streak.routes.ts                                         │
│ POST /api/streak/:userId/update                                  │
│ GET  /api/streak/:userId                                        │
│ POST /api/streak/:userId/reset (admin)                          │
└─────────────────────────────────────────────────────────────────┘
                         ▲           │
                         │           ▼
┌─ PRESENTATION LAYER ────────────────────────────────────────────┐
│ Controllers: streak.controller.ts                                │
│ - Input validation                                              │
│ - Error handling                                                │
│ - Response formatting                                           │
└─────────────────────────────────────────────────────────────────┘
                         ▲           │
                         │           ▼
┌─ BUSINESS LOGIC LAYER ──────────────────────────────────────────┐
│ Services: streak.service.ts                                      │
│ - updateStreakOnProblemSolved()                                  │
│ - getOrCreateStreak()                                           │
│ - getStreak()                                                   │
│ - resetStreak()                                                 │
│ - Date/timezone logic                                           │
└─────────────────────────────────────────────────────────────────┘
                         ▲           │
                         │           ▼
┌─ DATA ACCESS LAYER ─────────────────────────────────────────────┐
│ Database: Supabase/PostgreSQL                                    │
│ Table: streaks                                                  │
│  - id (UUID)                                                    │
│  - user_id (TEXT, UNIQUE)                                       │
│  - current_streak (INTEGER)                                     │
│  - longest_streak (INTEGER)                                     │
│  - last_active_date (TIMESTAMPTZ)                               │
│  - created_at, updated_at (TIMESTAMPTZ)                         │
└─────────────────────────────────────────────────────────────────┘
*/

// ─── STREAK UPDATE LOGIC (DETAILED) ────────────────────────────────────────────

/*
INPUT: updateStreakOnProblemSolved(userId, timezone)

EXECUTION STEPS:

1. Get current streak record
   ├─ If exists → use it
   └─ If not exists → create new (currentStreak=0, longestStreak=0)

2. Compare dates
   ├─ Extract date component from lastActiveDate
   ├─ Get today's date in user's timezone
   └─ Calculate days difference

3. Determine action based on daysDiff
   │
   ├─ daysDiff === 0 (SAME DAY)
   │  ├─ No increment
   │  ├─ Message: "Already solved today"
   │  └─ streakIncremented: false
   │
   ├─ daysDiff === 1 (NEXT DAY - CONSISTENT)
   │  ├─ currentStreak++
   │  ├─ Message: "Streak continued! Day X"
   │  └─ streakIncremented: true
   │
   └─ daysDiff > 1 (SKIPPED DAY - RESET)
      ├─ currentStreak = 1
      ├─ Message: "Streak reset. New: Day 1"
      └─ streakIncremented: true

4. Update longestStreak
   └─ longestStreak = max(currentStreak, longestStreak)

5. Update lastActiveDate
   └─ lastActiveDate = now()

6. Save to database
   └─ Single UPDATE query on streaks table

OUTPUT: StreakUpdateResponse {
  currentStreak: number,
  longestStreak: number,
  lastActiveDate: string,
  streakIncremented: boolean,
  message: string
}
*/

// ─── ERROR HANDLING ────────────────────────────────────────────────────────────

/*
Scenario 1: Database error
├─ Caught in service layer
├─ Thrown to controller
├─ NOT caught in progress controller (non-critical)
└─ Progress still saves (graceful degradation)

Scenario 2: Invalid timezone
├─ Defaults to 'UTC'
├─ Intl.DateTimeFormat validates it
└─ Worst case: uses UTC behavior

Scenario 3: User not found
├─ Creates new streak record
├─ Sets currentStreak = 1
└─ No error

Scenario 4: Database unavailable
├─ Service throws error
├─ Controller catches in try-catch
├─ Logs but doesn't fail progress
└─ User sees: "Progress saved" (streak omitted)
*/

// ─── PERFORMANCE CHARACTERISTICS ──────────────────────────────────────────────

/*
Operations per problem solve:

1. Validate input              ~1ms
2. Insert/update progress      ~5-10ms (existing table)
3. Get/create streak           ~5-10ms (includes get-or-create logic)
4. Calculate dates             ~1ms
5. Update streak               ~5-10ms (atomic update)

Total overhead:                ~15-30ms per solve
                               (well within acceptable range)

Database queries:
├─ SELECT streak WHERE user_id = ? (1 query)
├─ UPDATE streak ... (1 query)
└─ Total: 2 queries per solve (or 1 INSERT if new user)

Indexes optimized for:
├─ By user_id                  (O(log n) lookup)
├─ Leaderboard queries         (DESC order on streak fields)
└─ Scales to millions of users

Memory footprint:
└─ ~1KB per user (streaks table row)
```
*/

// ─── TIMEZONE HANDLING (KEY INSIGHT) ──────────────────────────────────────────

/*
Problem: Determining "same day" across timezones

Example:
  User in NY solves a problem at 11 PM EST (2024-04-11 23:00:00-04:00)
  In UTC, this is 2024-04-12 03:00:00Z (next calendar day!)
  
  Without timezone handling:
    UTC would think it's a new day → incorrectly increment streak

Solution: Use user's local timezone
  
  getTodayInTimezone('America/New_York')
  → Returns 2024-04-11 (as seen in NY)
  
  lastActiveDate = 2024-04-11 (stored in DB in UTC)
  → Extracted date: 2024-04-11
  
  daysDifference(2024-04-11, 2024-04-11) = 0 → Same day ✓

Implementation:
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',  // ← User's timezone
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const todayInTZ = formatter.format(new Date());
  // Result: "2024-04-11" (your local time, not UTC)
*/

// ─── INTEGRATION POINT: Progress → Streak ──────────────────────────────────────

/*
Current (without streak):
  POST /api/progress
    ↓
    progress.controller → progress.service → user_progress table
    ↓
    Response: 201 Created

New (with streak):
  POST /api/progress
    ↓
    progress.controller
    ├─ Call progress.service (save to user_progress)
    └─ Call streak.service (update streak) ← NEW
    ↓
    streak.service
    ├─ Get or create streak record
    ├─ Calculate date difference
    ├─ Update current/longest streak
    └─ Save to streaks table
    ↓
    Response: 201 Created (same as before, but streak also updated)

Key: Streak update is NON-BLOCKING
  If streak fails → progress still saved
  If streak succeeds → both saved
*/

// ─── TESTING STRATEGY ──────────────────────────────────────────────────────────

/*
Unit Tests (streak.service.ts):
├─ updateStreakOnProblemSolved (same day → no increment)
├─ updateStreakOnProblemSolved (next day → increment)
├─ updateStreakOnProblemSolved (skipped day → reset)
├─ getOrCreateStreak (create if missing)
├─ resetStreak (manual reset)
└─ Date helpers (timezone aware)

Integration Tests (API level):
├─ POST /api/progress → streak updated
├─ GET /api/streak/:userId → returns correct values
├─ POST /api/streak/:userId/reset → admin reset works
└─ Edge cases (timezone, same day)

E2E Tests:
├─ User solves, streak increments, visible in API
├─ Skip day → streak resets
├─ Multiple users → independent streaks

Load Tests:
├─ 1000 concurrent problem solves
├─ Verify all streaks update correctly
└─ Performance under load
*/

// ─── FUTURE EXTENSIBILITY ─────────────────────────────────────────────────────

/*
Current:
  ├─ Individual user streaks
  └─ Reset only (no loss recovery)

Future enhancements:
  ├─ Team/group streaks (sum across members)
  ├─ Streak freeze (currency item to prevent reset)
  ├─ Historical tracking (store reset events)
  ├─ Notifications (before streak breaks)
  ├─ Badges (7-day, 30-day, 100-day achievements)
  ├─ Leaderboard (top streaks globally/country/friend group)
  └─ Analytics (streak distribution, retention metrics)

Database schema planned for:
  ├─ Unique index on user_id (✓ supports scaling)
  ├─ Index on current_streak DESC (✓ for leaderboard)
  ├─ Index on longest_streak DESC (✓ for hall of fame)
  └─ created_at partition key (✓ for time-series data)
*/

export {};

-- ============================================================
-- Migration: 003_create_streaks
-- Description: User streak tracking table for problem-solving consistency
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable the pgcrypto extension if not already enabled (for gen_random_uuid)
create extension if not exists "pgcrypto";

-- ─── Table ────────────────────────────────────────────────────────────────────

create table if not exists public.streaks (
  id                uuid          primary key default gen_random_uuid(),
  user_id           text          not null unique,
  current_streak    integer       not null default 0,
  longest_streak    integer       not null default 0,
  last_active_date  timestamptz   not null default now(),
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Primary access pattern: fetch streak for a specific user
create index if not exists idx_streaks_user_id
  on public.streaks (user_id);

-- Optional: leaderboard queries (top streaks)
create index if not exists idx_streaks_current_streak_desc
  on public.streaks (current_streak desc);

create index if not exists idx_streaks_longest_streak_desc
  on public.streaks (longest_streak desc);

-- ─── Comment ──────────────────────────────────────────────────────────────────
-- Streak Logic:
--   - current_streak:    Number of consecutive days the user solved ≥1 problem
--   - longest_streak:    Historical maximum current_streak reached
--   - last_active_date:  Timestamp of most recent problem solve
--
-- Updates occur via the backend service (streak.service.ts) which:
--   1. Checks if today's date != last_active_date to avoid double-increment
--   2. If skipped a day (2+ days gap), resets current_streak to 1
--   3. If solved today, increments current_streak
--   4. Updates longest_streak if current_streak exceeds it

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- Uncomment these when you add Supabase Auth.
-- Replace 'service_role' logic with auth.uid() once JWT auth is wired up.

-- alter table public.streaks enable row level security;

-- create policy "Users can view own streak"
--   on public.streaks
--   to authenticated
--   using (auth.uid()::text = user_id);

-- create policy "Users can update own streak"
--   on public.streaks
--   to authenticated
--   using (auth.uid()::text = user_id);

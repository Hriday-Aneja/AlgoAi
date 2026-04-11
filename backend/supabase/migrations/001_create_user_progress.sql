-- ============================================================
-- Migration: 001_create_user_progress
-- Description: User progress tracking table for DSA problems
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable the pgcrypto extension if not already enabled (for gen_random_uuid)
create extension if not exists "pgcrypto";

-- ─── Table ────────────────────────────────────────────────────────────────────

create table if not exists public.user_progress (
  id          uuid          primary key default gen_random_uuid(),
  user_id     text          not null,
  problem_id  text          not null,
  topic       text[]        not null default '{}',
  difficulty  text          not null check (difficulty in ('easy', 'medium', 'hard')),
  status      text          not null check (status in ('solved', 'attempted')),
  time_taken  integer       null,         -- seconds; null = not recorded
  created_at  timestamptz   not null default now()
);

-- ─── Unique Constraint ────────────────────────────────────────────────────────
-- One progress record per (user, problem).
-- The backend upserts on this constraint so re-submissions update in place.

alter table public.user_progress
  add constraint user_progress_user_problem_unique
  unique (user_id, problem_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Primary access pattern: fetch all records for a user
create index if not exists idx_user_progress_user_id
  on public.user_progress (user_id);

-- Filter by status (solved / attempted) on the frontend
create index if not exists idx_user_progress_status
  on public.user_progress (status);

-- Filter by difficulty
create index if not exists idx_user_progress_difficulty
  on public.user_progress (difficulty);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- Uncomment these when you add Supabase Auth.
-- Replace 'service_role' logic with auth.uid() once JWT auth is wired up.

-- alter table public.user_progress enable row level security;

-- -- Users can only read their own records
-- create policy "Users can view own progress"
--   on public.user_progress for select
--   using (auth.uid()::text = user_id);

-- -- Users can insert their own records
-- create policy "Users can insert own progress"
--   on public.user_progress for insert
--   with check (auth.uid()::text = user_id);

-- -- Users can update their own records
-- create policy "Users can update own progress"
--   on public.user_progress for update
--   using (auth.uid()::text = user_id);

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- Verify with: select * from public.user_progress;

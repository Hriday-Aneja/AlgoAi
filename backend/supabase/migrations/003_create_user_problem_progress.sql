-- ============================================================
-- Migration: 003_create_user_problem_progress
-- Description: Create the row-level problem progress table used by user problem progress features
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable the pgcrypto extension if not already enabled (for gen_random_uuid)
create extension if not exists "pgcrypto";

create table if not exists public.user_problem_progress (
  id          uuid          primary key default gen_random_uuid(),
  "userId"    text          not null,
  "problemId" text          not null,
  topic        text[]        not null default '{}',
  difficulty   text          not null check (difficulty in ('easy', 'medium', 'hard')),
  status       text          not null check (status in ('solved', 'attempted')),
  "timeTaken" integer       null,
  "createdAt" timestamptz   not null default now(),
  "updatedAt" timestamptz   not null default now()
);

alter table public.user_problem_progress
  add constraint user_problem_progress_user_problem_unique
  unique ("userId", "problemId");

create index if not exists idx_user_problem_progress_user_id
  on public.user_problem_progress ("userId");

create index if not exists idx_user_problem_progress_status
  on public.user_problem_progress (status);

create index if not exists idx_user_problem_progress_difficulty
  on public.user_problem_progress (difficulty);

-- ─────────────────────────────────────────────────────────────────────────
-- Verify with: select * from public.user_problem_progress;

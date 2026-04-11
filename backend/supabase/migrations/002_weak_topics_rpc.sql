-- ============================================================
-- Migration: 002_weak_topics_rpc
-- Description: PostgreSQL function for aggregating topic stats
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Drops the function first so this script is safely re-runnable
drop function if exists get_topic_stats(text);

-- ─── RPC Function ─────────────────────────────────────────────────────────────
--
-- Unnests the text[] topic column so each topic in a problem's array
-- counts individually, then aggregates counts and average time per topic.
--
-- Returns one row per topic containing:
--   topic             - topic name
--   total_attempted   - total problems touched (solved OR attempted)
--   total_solved      - subset where status = 'solved'
--   accuracy          - (total_solved / total_attempted) * 100, rounded to 2dp
--   avg_time_seconds  - average time_taken in seconds (NULL rows excluded)
--
-- Called from the backend as: supabase.rpc('get_topic_stats', { p_user_id })
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function get_topic_stats(p_user_id text)
returns table (
  topic            text,
  total_attempted  bigint,
  total_solved     bigint,
  accuracy         numeric,
  avg_time_seconds numeric
)
language sql
stable    -- tells Postgres this function only reads data (allows query planning optimisations)
as $$
  select
    t.topic,

    count(*)                                                    as total_attempted,

    count(*) filter (where up.status = 'solved')               as total_solved,

    round(
      count(*) filter (where up.status = 'solved')::numeric
      / count(*)::numeric * 100,
      2
    )                                                           as accuracy,

    round(
      avg(up.time_taken) filter (where up.time_taken is not null),
      2
    )                                                           as avg_time_seconds

  from  public.user_progress up,
        lateral unnest(up.topic) as t(topic)   -- explode array into rows

  where up.user_id = p_user_id

  group by t.topic;
$$;

-- Grant execute to the anon role used by the Supabase JS client
grant execute on function get_topic_stats(text) to anon;
grant execute on function get_topic_stats(text) to authenticated;

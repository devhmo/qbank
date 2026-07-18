-- =============================================================================
-- QBank — quiz timer/pause state and question ordering
-- =============================================================================
-- Adds what the quiz-taking engine (Stage 6) needs beyond the original
-- schema:
--   - quizzes.time_limit_minutes / paused_at / total_paused_seconds, so a
--     Timed/Exam countdown survives page reloads and can be paused/resumed
--     without losing accuracy.
--   - quiz_questions.order_index, so the question navigator and Next/
--     Previous have a stable, deterministic order (insertion order isn't
--     guaranteed to reflect the order a quiz was assembled in).
-- =============================================================================

begin;

alter table public.quizzes
  add column time_limit_minutes integer,
  add column paused_at timestamptz,
  add column total_paused_seconds integer not null default 0;

comment on column public.quizzes.time_limit_minutes is
  'Total time allotted for Timed/Exam mode. Null for Tutor mode (untimed).';
comment on column public.quizzes.paused_at is
  'When the timer was last paused. Null while running or if never paused.';
comment on column public.quizzes.total_paused_seconds is
  'Cumulative seconds spent paused, so remaining time can be computed as
   time_limit_minutes*60 - (now() - created_at - total_paused_seconds),
   adjusted for any currently-active pause.';

alter table public.quiz_questions
  add column order_index integer not null default 0;

create index idx_quiz_questions_quiz_order
  on public.quiz_questions (quiz_id, order_index);

commit;

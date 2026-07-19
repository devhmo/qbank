-- =============================================================================
-- QBank — full-text search across question stems and choice explanations
-- =============================================================================
-- Explanations live on `choices`, a child table of `questions`, so a plain
-- generated column on `questions` (which can't reference another table)
-- isn't enough. Instead, `questions.search_vector` is a denormalized
-- tsvector kept in sync by triggers: one on `questions` itself (stem
-- changes), and one on `choices` (explanation changes), so editing an
-- explanation elsewhere in the app still updates the parent question's
-- searchability.
-- =============================================================================

begin;

alter table public.questions
  add column search_vector tsvector;

create index idx_questions_search_vector
  on public.questions using gin (search_vector);

create or replace function public.update_question_search_vector(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.questions q
  set search_vector = to_tsvector(
    'english',
    coalesce(q.stem, '') || ' ' || coalesce((
      select string_agg(c.explanation, ' ')
      from public.choices c
      where c.question_id = q.id
    ), '')
  )
  where q.id = p_question_id;
end;
$$;

create or replace function public.trigger_sync_question_search_vector()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_question_search_vector(new.id);
  return new;
end;
$$;

create trigger trg_questions_search_vector
  after insert or update of stem on public.questions
  for each row execute function public.trigger_sync_question_search_vector();

create or replace function public.trigger_sync_question_search_vector_from_choice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_question_search_vector(coalesce(new.question_id, old.question_id));
  return coalesce(new, old);
end;
$$;

create trigger trg_choices_search_vector
  after insert or update of explanation or delete on public.choices
  for each row execute function public.trigger_sync_question_search_vector_from_choice();

-- Backfill existing rows so search works immediately, not just for
-- questions/choices created after this migration.
update public.questions
set search_vector = to_tsvector(
  'english',
  coalesce(stem, '') || ' ' || coalesce((
    select string_agg(c.explanation, ' ')
    from public.choices c
    where c.question_id = questions.id
  ), '')
);

commit;

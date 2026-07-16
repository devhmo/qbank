-- =============================================================================
-- QBank — Initial schema
-- =============================================================================
-- This migration creates the full QBank schema (catalog, questions, quizzes,
-- personal study data) and enables Row Level Security with policies for two
-- roles: 'student' and 'admin'.
--
-- Run this once, in order, in a fresh Supabase project's SQL Editor.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- provides gen_random_uuid()

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'student');
create type public.difficulty_level as enum ('easy', 'medium', 'hard');
create type public.question_status as enum ('draft', 'published');
create type public.quiz_mode as enum ('tutor', 'timed', 'exam');
create type public.report_status as enum ('open', 'resolved');

-- =============================================================================
-- Tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public.users — profile row that extends auth.users
-- -----------------------------------------------------------------------------
create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        public.user_role not null default 'student',
  created_at  timestamptz not null default now()
);

comment on table public.users is 'Profile data for each authenticated user, keyed to auth.users.';

-- -----------------------------------------------------------------------------
-- Catalog: subjects -> systems -> topics
-- -----------------------------------------------------------------------------
create table public.subjects (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);

create table public.systems (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  subject_id  uuid not null references public.subjects (id) on delete cascade,
  unique (subject_id, name)
);

create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  system_id   uuid not null references public.systems (id) on delete cascade,
  unique (system_id, name)
);

-- -----------------------------------------------------------------------------
-- Questions and choices
-- -----------------------------------------------------------------------------
create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  stem        text not null,
  image_url   text,
  difficulty  public.difficulty_level not null default 'medium',
  high_yield  boolean not null default false,
  topic_id    uuid not null references public.topics (id) on delete restrict,
  source      text,
  status      public.question_status not null default 'draft',
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.choices (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.questions (id) on delete cascade,
  text          text not null,
  is_correct    boolean not null default false,
  explanation   text,
  order_index   integer not null default 0
);

-- -----------------------------------------------------------------------------
-- Tags (many-to-many with questions)
-- -----------------------------------------------------------------------------
create table public.tags (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);

create table public.question_tags (
  question_id  uuid not null references public.questions (id) on delete cascade,
  tag_id       uuid not null references public.tags (id) on delete cascade,
  primary key (question_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- Quizzes and quiz_questions (per-session state)
-- -----------------------------------------------------------------------------
create table public.quizzes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  mode          public.quiz_mode not null,
  created_at    timestamptz not null default now(),
  submitted_at  timestamptz
);

create table public.quiz_questions (
  id                     uuid primary key default gen_random_uuid(),
  quiz_id                uuid not null references public.quizzes (id) on delete cascade,
  question_id            uuid not null references public.questions (id) on delete cascade,
  selected_choice_id     uuid references public.choices (id) on delete set null,
  is_correct             boolean,
  time_spent             integer, -- seconds
  eliminated_choice_ids  uuid[] not null default '{}',
  highlighted_ranges     jsonb not null default '[]',
  is_marked              boolean not null default false,
  unique (quiz_id, question_id)
);

-- -----------------------------------------------------------------------------
-- Personal study data: bookmarks, notes, reports
-- -----------------------------------------------------------------------------
create table public.user_bookmarks (
  user_id        uuid not null references public.users (id) on delete cascade,
  question_id    uuid not null references public.questions (id) on delete cascade,
  bookmarked_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.user_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  question_id  uuid not null references public.questions (id) on delete cascade,
  note_text    text not null,
  updated_at   timestamptz not null default now(),
  unique (user_id, question_id)
);

create table public.question_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  question_id  uuid not null references public.questions (id) on delete cascade,
  message      text not null,
  status       public.report_status not null default 'open',
  created_at   timestamptz not null default now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
create index idx_systems_subject_id        on public.systems (subject_id);
create index idx_topics_system_id          on public.topics (system_id);
create index idx_questions_topic_id        on public.questions (topic_id);
create index idx_questions_status          on public.questions (status);
create index idx_choices_question_id       on public.choices (question_id);
create index idx_question_tags_tag_id      on public.question_tags (tag_id);
create index idx_quizzes_user_id           on public.quizzes (user_id);
create index idx_quiz_questions_quiz_id    on public.quiz_questions (quiz_id);
create index idx_quiz_questions_question_id on public.quiz_questions (question_id);
create index idx_user_bookmarks_question_id on public.user_bookmarks (question_id);
create index idx_user_notes_user_id        on public.user_notes (user_id);
create index idx_question_reports_status   on public.question_reports (status);
create index idx_question_reports_user_id  on public.question_reports (user_id);

-- =============================================================================
-- Functions & triggers
-- =============================================================================

-- Creates a public.users profile row whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Returns true if the currently authenticated user has the 'admin' role.
-- SECURITY DEFINER lets this bypass RLS on public.users so policies that call
-- it don't recurse into themselves.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Prevents a non-admin from promoting themselves (or anyone else) to admin.
-- auth.uid() is null when a statement runs outside an end-user session (the
-- Supabase SQL Editor, the service_role key, a backend job) — that path is
-- intentionally left open so you can bootstrap your first admin. Once a
-- request is authenticated as a regular user, only an existing admin can
-- change roles.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change a user''s role';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update on public.users
  for each row execute function public.prevent_role_escalation();

-- Generic "touch updated_at" trigger, used by user_notes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_notes_updated_at
  before update on public.user_notes
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.users             enable row level security;
alter table public.subjects          enable row level security;
alter table public.systems           enable row level security;
alter table public.topics            enable row level security;
alter table public.questions         enable row level security;
alter table public.choices           enable row level security;
alter table public.tags              enable row level security;
alter table public.question_tags     enable row level security;
alter table public.quizzes           enable row level security;
alter table public.quiz_questions    enable row level security;
alter table public.user_bookmarks    enable row level security;
alter table public.user_notes        enable row level security;
alter table public.question_reports  enable row level security;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
create policy "users_select_own_or_admin"
  on public.users for select
  using (id = auth.uid() or public.is_admin());

create policy "users_update_own_or_admin"
  on public.users for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "users_admin_insert"
  on public.users for insert
  with check (public.is_admin());

create policy "users_admin_delete"
  on public.users for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- subjects / systems / topics — catalog data, readable by any signed-in user,
-- writable only by admins.
-- -----------------------------------------------------------------------------
create policy "subjects_select_authenticated"
  on public.subjects for select
  using (auth.role() = 'authenticated');

create policy "subjects_admin_write"
  on public.subjects for insert
  with check (public.is_admin());

create policy "subjects_admin_update"
  on public.subjects for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "subjects_admin_delete"
  on public.subjects for delete
  using (public.is_admin());

create policy "systems_select_authenticated"
  on public.systems for select
  using (auth.role() = 'authenticated');

create policy "systems_admin_write"
  on public.systems for insert
  with check (public.is_admin());

create policy "systems_admin_update"
  on public.systems for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "systems_admin_delete"
  on public.systems for delete
  using (public.is_admin());

create policy "topics_select_authenticated"
  on public.topics for select
  using (auth.role() = 'authenticated');

create policy "topics_admin_write"
  on public.topics for insert
  with check (public.is_admin());

create policy "topics_admin_update"
  on public.topics for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "topics_admin_delete"
  on public.topics for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- questions — students may only SELECT published questions; admins manage all.
-- -----------------------------------------------------------------------------
create policy "questions_select_published_or_admin"
  on public.questions for select
  using (status = 'published' or public.is_admin());

create policy "questions_admin_insert"
  on public.questions for insert
  with check (public.is_admin());

create policy "questions_admin_update"
  on public.questions for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "questions_admin_delete"
  on public.questions for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- choices — visible only when the parent question is visible to the caller.
-- -----------------------------------------------------------------------------
create policy "choices_select_via_question"
  on public.choices for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.questions q
      where q.id = choices.question_id
        and q.status = 'published'
    )
  );

create policy "choices_admin_insert"
  on public.choices for insert
  with check (public.is_admin());

create policy "choices_admin_update"
  on public.choices for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "choices_admin_delete"
  on public.choices for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- tags / question_tags — catalog data, same pattern as subjects/systems/topics.
-- -----------------------------------------------------------------------------
create policy "tags_select_authenticated"
  on public.tags for select
  using (auth.role() = 'authenticated');

create policy "tags_admin_insert"
  on public.tags for insert
  with check (public.is_admin());

create policy "tags_admin_update"
  on public.tags for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "tags_admin_delete"
  on public.tags for delete
  using (public.is_admin());

create policy "question_tags_select_authenticated"
  on public.question_tags for select
  using (auth.role() = 'authenticated');

create policy "question_tags_admin_insert"
  on public.question_tags for insert
  with check (public.is_admin());

create policy "question_tags_admin_delete"
  on public.question_tags for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- quizzes — each student owns their own quiz sessions; admins can see/manage all.
-- -----------------------------------------------------------------------------
create policy "quizzes_select_own_or_admin"
  on public.quizzes for select
  using (user_id = auth.uid() or public.is_admin());

create policy "quizzes_insert_own_or_admin"
  on public.quizzes for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "quizzes_update_own_or_admin"
  on public.quizzes for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "quizzes_delete_own_or_admin"
  on public.quizzes for delete
  using (user_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- quiz_questions — per-session state, scoped through the owning quiz.
-- -----------------------------------------------------------------------------
create policy "quiz_questions_select_own_or_admin"
  on public.quiz_questions for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.quizzes qz
      where qz.id = quiz_questions.quiz_id and qz.user_id = auth.uid()
    )
  );

create policy "quiz_questions_insert_own_or_admin"
  on public.quiz_questions for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.quizzes qz
      where qz.id = quiz_questions.quiz_id and qz.user_id = auth.uid()
    )
  );

create policy "quiz_questions_update_own_or_admin"
  on public.quiz_questions for update
  using (
    public.is_admin()
    or exists (
      select 1 from public.quizzes qz
      where qz.id = quiz_questions.quiz_id and qz.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.quizzes qz
      where qz.id = quiz_questions.quiz_id and qz.user_id = auth.uid()
    )
  );

create policy "quiz_questions_delete_own_or_admin"
  on public.quiz_questions for delete
  using (
    public.is_admin()
    or exists (
      select 1 from public.quizzes qz
      where qz.id = quiz_questions.quiz_id and qz.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- user_bookmarks — persistent, independent of any quiz session.
-- -----------------------------------------------------------------------------
create policy "bookmarks_select_own_or_admin"
  on public.user_bookmarks for select
  using (user_id = auth.uid() or public.is_admin());

create policy "bookmarks_insert_own_or_admin"
  on public.user_bookmarks for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "bookmarks_delete_own_or_admin"
  on public.user_bookmarks for delete
  using (user_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- user_notes
-- -----------------------------------------------------------------------------
create policy "notes_select_own_or_admin"
  on public.user_notes for select
  using (user_id = auth.uid() or public.is_admin());

create policy "notes_insert_own_or_admin"
  on public.user_notes for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "notes_update_own_or_admin"
  on public.user_notes for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "notes_delete_own_or_admin"
  on public.user_notes for delete
  using (user_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- question_reports — students can file and view their own reports; they may
-- edit/withdraw a report only while it's still 'open'. Admins manage all.
-- -----------------------------------------------------------------------------
create policy "reports_select_own_or_admin"
  on public.question_reports for select
  using (user_id = auth.uid() or public.is_admin());

create policy "reports_insert_own_or_admin"
  on public.question_reports for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "reports_update_own_open_or_admin"
  on public.question_reports for update
  using ((user_id = auth.uid() and status = 'open') or public.is_admin())
  with check ((user_id = auth.uid() and status = 'open') or public.is_admin());

create policy "reports_delete_own_open_or_admin"
  on public.question_reports for delete
  using ((user_id = auth.uid() and status = 'open') or public.is_admin());

commit;

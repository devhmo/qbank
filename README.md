# QBank

A calm, focused question bank / quiz platform for personal use with a small
group of medical student colleagues — think UWorld/AMBOSS, built with
Next.js, TypeScript, Tailwind CSS, and Supabase.

**Live site:** [qbank-wheat.vercel.app](https://qbank-wheat.vercel.app/)

## Features

- **Auth** — Supabase-backed sign-up/login, full name captured on signup
- **Admin panel** — manage the question bank, including bulk import
- **Question CRUD** — create, edit, and organize questions individually or via bulk import
- **Quiz engine** — configurable quizzes (Tutor/Timed modes, subject/system filters) with:
  - click-to-color-red/green answer reveal, cascading reveal, collapsed-by-default explanations for untried choices
  - bookmarking, mark-for-review, and per-question notes
  - strike-out (eliminate) choices
  - text highlighting on the question stem, choice text, and explanations
  - adjustable text size
  - a collapsible question navigator drawer with per-question status/difficulty and Show Answer / Show All Explanations / Reset Question controls
  - report-a-question-error flow
- **Dashboard** — progress and performance overview
- **Search** — full-text question search
- **Reporting** — review flagged/reported questions

Design language: calm professional blue palette, full Dark Mode support,
mobile-first (tablet is the primary device), [lucide-react](https://lucide.dev/)
icons throughout (no emoji).

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Supabase** for database, authentication, and file storage
- Deployed on **Vercel**

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and fill in your Supabase project values:

   ```bash
   cp .env.local.example .env.local
   ```

   Get `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your
   [Supabase dashboard](https://supabase.com/dashboard): open your project,
   go to **Project Settings > API**, and copy the **Project URL** and the
   **anon public** key.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/          Routes, layouts, and pages (App Router)
components/   Reusable UI components
lib/          Shared utilities, including the Supabase client
types/        Shared TypeScript types, including generated Supabase types
```

## Database schema

The full Postgres schema (tables, foreign keys, and Row Level Security
policies) lives in `supabase/migrations/`. See `supabase/README.md` for how
roles work and how to regenerate types after applying a migration.

## Deployment

This project is ready to deploy on [Vercel](https://vercel.com). See the
deployment walkthrough shared alongside this project for step-by-step
instructions.


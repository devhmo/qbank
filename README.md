# QBank

A calm, focused question bank application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Supabase** for database, authentication, and file storage

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

## Deployment

This project is ready to deploy on [Vercel](https://vercel.com). See the
deployment walkthrough shared alongside this project for step-by-step
instructions.

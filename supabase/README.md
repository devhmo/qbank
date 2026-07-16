# Database migrations

SQL migrations for the QBank Supabase project live in `migrations/`, named
`<timestamp>_<description>.sql`, applied in order.

## Current migrations

- **`20260716000000_init_schema.sql`** — creates the full schema (catalog,
  questions, quizzes, personal study data) and enables Row Level Security
  with policies for the `student` and `admin` roles. See the step-by-step
  instructions for running this from the Supabase dashboard.

## How roles work

- Every row in `auth.users` automatically gets a matching row in
  `public.users` (via the `on_auth_user_created` trigger), defaulting to the
  `student` role.
- To make someone an admin, run this in the SQL Editor (safe to do there —
  see the migration file's comments for why):

  ```sql
  update public.users set role = 'admin' where email = 'you@example.com';
  ```

- Once at least one admin exists, only an existing admin can change another
  user's role through the app itself (a trigger blocks self-promotion).

## Regenerating TypeScript types

After running a migration, you can regenerate `types/supabase.ts` to match
the live schema. From your Supabase project dashboard: **Project Settings >
API > Generate types**, or with the Supabase CLI:

```bash
npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```

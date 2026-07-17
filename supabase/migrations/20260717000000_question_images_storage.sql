-- =============================================================================
-- QBank — question image storage
-- =============================================================================
-- Creates a public storage bucket for question images. "Public" here only
-- controls anonymous read access to the bucket's public URL; write access
-- (upload/update/delete) is still governed by RLS policies on
-- storage.objects below and is restricted to admins.
-- =============================================================================

begin;

insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do nothing;

create policy "question_images_public_read"
  on storage.objects for select
  using (bucket_id = 'question-images');

create policy "question_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'question-images' and public.is_admin());

create policy "question_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'question-images' and public.is_admin())
  with check (bucket_id = 'question-images' and public.is_admin());

create policy "question_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'question-images' and public.is_admin());

commit;

-- =============================================================================
-- QBank — capture full_name at signup
-- =============================================================================
-- Updates handle_new_user() so that when someone signs up with
-- `options.data.full_name` set (see app/signup), that name is copied into
-- public.users.full_name. New accounts still default to role = 'student'.
-- =============================================================================

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

commit;

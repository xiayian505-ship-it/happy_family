alter table public.posts enable row level security;

-- Remove legacy policies before installing the complete public-read-only
-- policy set. Administrative writes go through the isolated Edge Function's
-- service-role client after shared-Auth verification.
do $$
declare policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'posts'
  loop
    execute format('drop policy if exists %I on public.posts', policy_name);
  end loop;
end $$;

revoke insert, update, delete on table public.posts from anon, authenticated;
grant select on table public.posts to anon, authenticated;

create policy "published posts are publicly readable"
on public.posts
for select
to anon, authenticated
using (published is true);

-- Career saves belong to exactly one authenticated user.
create table if not exists public.career_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  save_data jsonb not null check (jsonb_typeof(save_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists career_saves_user_updated_idx
  on public.career_saves (user_id, updated_at desc);

alter table public.career_saves enable row level security;
revoke all on table public.career_saves from anon, authenticated;
grant select, insert, update, delete on table public.career_saves to authenticated;

drop policy if exists "Users manage their own career saves" on public.career_saves;
create policy "Users manage their own career saves"
  on public.career_saves
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

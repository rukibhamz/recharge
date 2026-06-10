-- Auth: auto-create profiles + RLS for user-owned data
-- API uses service role (bypasses RLS); policies support future direct client access.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- profiles
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- user_sessions
drop policy if exists "Users read own session links" on public.user_sessions;
create policy "Users read own session links"
  on public.user_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own session links" on public.user_sessions;
create policy "Users insert own session links"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

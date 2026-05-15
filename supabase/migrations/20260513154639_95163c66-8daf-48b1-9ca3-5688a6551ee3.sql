
-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = user_id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update using (auth.uid() = user_id);

-- Study plans
create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  exam_date date not null,
  section_order text[] not null default array['A','B','C','D','E','F'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.study_plans enable row level security;
create policy "own plan select" on public.study_plans for select using (auth.uid() = user_id);
create policy "own plan insert" on public.study_plans for insert with check (auth.uid() = user_id);
create policy "own plan update" on public.study_plans for update using (auth.uid() = user_id);
create policy "own plan delete" on public.study_plans for delete using (auth.uid() = user_id);

-- Unit progress
create table public.unit_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  unit_key text not null,
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  unique (user_id, unit_key)
);
alter table public.unit_progress enable row level security;
create policy "own progress select" on public.unit_progress for select using (auth.uid() = user_id);
create policy "own progress insert" on public.unit_progress for insert with check (auth.uid() = user_id);
create policy "own progress update" on public.unit_progress for update using (auth.uid() = user_id);
create policy "own progress delete" on public.unit_progress for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();
create trigger plans_updated before update on public.study_plans
for each row execute function public.set_updated_at();

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

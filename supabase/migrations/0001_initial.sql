-- LaunchPad schema. See docs/ARCHITECTURE.md.
-- The app reads and writes through server routes using the service-role key, always scoped
-- to the signed-in user's id. RLS is enabled on every table as defence in depth: users can
-- only ever see their own rows; public portfolios are readable when published.

create extension if not exists pgcrypto;

-- ---------- Helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  data jsonb not null default '{}'::jsonb,          -- lib/profile/types.ts Profile
  field_sources jsonb not null default '{}'::jsonb,  -- per field: resume | llm | user
  timezone text not null default 'Asia/Kolkata',
  reminder_time text default '08:00',                -- HH:MM in the user's timezone
  reminder_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Drafts ----------
create table public.draft_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Resumes (file lives in the private "resumes" bucket) ----------
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text,
  file_name text not null,
  mime text not null,
  size_bytes integer not null default 0,
  format text not null,
  layout text not null default 'unknown',
  has_tables boolean not null default false,
  text_hash text not null,
  extracted_text text not null,   -- never logged
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index resumes_user_idx on public.resumes (user_id, created_at desc);

-- ---------- Portfolios ----------
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  content jsonb not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger portfolios_updated before update on public.portfolios
  for each row execute function public.set_updated_at();

-- ---------- Diagnostics (cached per resume + rubric version for stable scores) ----------
create table public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  input_hash text not null,
  rubric_version text not null,
  result jsonb not null,
  overall_score integer not null,
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, input_hash, rubric_version)
);

create table public.resume_rewrites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  bullets jsonb not null default '[]'::jsonb,
  source text not null default 'rules',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Payments ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,  -- kept (anonymised) after account deletion
  product_key text not null,
  amount_paise integer not null check (amount_paise >= 0),
  currency text not null default 'INR',
  provider text not null,
  provider_order_id text not null unique,
  provider_payment_id text,
  status text not null default 'created',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  entitlement text not null check (entitlement in ('report', 'program')),
  order_id uuid references public.orders (id) on delete set null,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement)
);

create table public.razorpay_webhook_events (
  event_id text primary key,
  type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- GitHub + 14-day program ----------
create table public.github_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  github_user_id bigint not null,
  login text not null,
  access_token_enc text not null,   -- AES-256-GCM, key in GITHUB_TOKEN_ENC_KEY
  scopes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_key text not null,
  repo_owner text,
  repo_name text,
  repo_url text,
  scaffold_sha text,
  started_at timestamptz not null default now(),
  timezone text not null default 'Asia/Kolkata',
  status text not null default 'active',
  completed_at timestamptz,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index programs_user_idx on public.programs (user_id, created_at desc);

create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day_number integer not null check (day_number between 1 and 14),
  completed_at timestamptz,
  verified_shas jsonb not null default '[]'::jsonb,
  review jsonb,
  hints_revealed integer not null default 0,
  checklist jsonb not null default '[]'::jsonb,
  demo_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, day_number)
);

create table public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day_number integer not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mentor_messages_idx on public.mentor_messages (program_id, day_number, created_at);

create table public.defense_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  questions jsonb not null,
  answers jsonb not null default '{}'::jsonb,
  source text not null default 'rules',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pitch_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id uuid references public.programs (id) on delete cascade,
  kind text not null,
  tone text not null default 'default',
  content text not null,
  source text not null default 'rules',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, tone)
);

-- ---------- Analytics + reminders ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  anon_id text,
  name text not null check (name in ('upload', 'portfolio_created', 'teaser_viewed', 'checkout_started', 'paid', 'day_completed')),
  props jsonb not null default '{}'::jsonb,   -- never personal data or resume content
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminder_sends (
  user_id uuid not null references auth.users (id) on delete cascade,
  day_key text not null,  -- YYYY-MM-DD in the user's timezone
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day_key)
);

-- ---------- Row Level Security ----------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','draft_states','resumes','portfolios','diagnostics','resume_rewrites','orders',
    'entitlements','razorpay_webhook_events','github_connections','programs','program_days',
    'mentor_messages','defense_sessions','pitch_drafts','events','reminder_sends'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Owners can read their own rows. All writes go through the server (service role).
create policy "own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own drafts" on public.draft_states for select to authenticated using ((select auth.uid()) = user_id);
create policy "own resumes" on public.resumes for select to authenticated using ((select auth.uid()) = user_id);
create policy "own portfolio" on public.portfolios for select to authenticated using ((select auth.uid()) = user_id);
create policy "published portfolios are public" on public.portfolios for select to anon, authenticated using (is_published);
create policy "own diagnostics" on public.diagnostics for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rewrites" on public.resume_rewrites for select to authenticated using ((select auth.uid()) = user_id);
create policy "own orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "own entitlements" on public.entitlements for select to authenticated using ((select auth.uid()) = user_id);
create policy "own programs" on public.programs for select to authenticated using ((select auth.uid()) = user_id);
create policy "own program days" on public.program_days for select to authenticated using ((select auth.uid()) = user_id);
create policy "own mentor messages" on public.mentor_messages for select to authenticated using ((select auth.uid()) = user_id);
create policy "own defense" on public.defense_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "own pitch" on public.pitch_drafts for select to authenticated using ((select auth.uid()) = user_id);
-- github_connections, events, webhook events and reminder_sends have no client policies at all.

-- ---------- Private storage for resumes ----------
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false)
on conflict (id) do nothing;
create policy "users read their own resume files" on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

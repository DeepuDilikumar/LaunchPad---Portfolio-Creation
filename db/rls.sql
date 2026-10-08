-- Row Level Security for Supabase. Apply after migrations:
--   psql "$DATABASE_URL" -f db/rls.sql
--
-- The app server connects with the service role (DATABASE_URL), which bypasses RLS. These policies
-- protect the tables from the public anon key: if anyone queries Supabase directly from a browser,
-- they can only see their own rows, plus content learners have explicitly made public.

alter table profiles            enable row level security;
alter table purchases           enable row level security;
alter table entitlements        enable row level security;
alter table progress            enable row level security;
alter table decisions           enable row level security;
alter table proof_packs         enable row level security;
alter table tutor_messages      enable row level security;
alter table coupons             enable row level security;
alter table coupon_redemptions  enable row level security;
alter table webhook_events      enable row level security;
alter table notify_requests     enable row level security;
alter table leads               enable row level security;
alter table analytics_events    enable row level security;
alter table email_log           enable row level security;
alter table products            enable row level security;
alter table users               enable row level security;

-- Own rows only (read).
create policy "own profile" on profiles for select using (auth.uid() = user_id or is_public);
create policy "own purchases" on purchases for select using (auth.uid() = user_id);
create policy "own entitlements" on entitlements for select using (auth.uid() = user_id);
create policy "own progress" on progress for select using (auth.uid() = user_id);
create policy "own or public decisions" on decisions for select using (auth.uid() = user_id or is_public);
create policy "own or published proof" on proof_packs for select using (auth.uid() = user_id or published_at is not null);
create policy "own tutor messages" on tutor_messages for select using (auth.uid() = user_id);
create policy "own redemptions" on coupon_redemptions for select using (auth.uid() = user_id);

-- Public catalog data.
create policy "products are public" on products for select using (true);

-- No policies (deny all to anon/authenticated) on: coupons, webhook_events, notify_requests, leads,
-- analytics_events, email_log, users. Only the server (service role) touches them.
-- No insert/update/delete policies anywhere: every write goes through the server, which validates
-- input with zod and checks entitlements.

-- secondquestion schema. Every table is private: only the service role (server) touches it.

create table orders (
  id text primary key,
  razorpay_order_id text not null unique,
  product_slug text not null,
  amount integer not null check (amount > 0),         -- paise
  currency text not null default 'INR',
  email text,
  phone text,
  status text not null default 'created' check (status in ('created','paid','fulfilled','failed','refunded')),
  razorpay_payment_id text unique,
  referral_code text,
  discount integer not null default 0,                 -- rupees
  utm jsonb not null default '{}',
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  fulfilled_at timestamptz,
  delivery_email_sent_at timestamptz,
  lock_until timestamptz,
  attempts integer not null default 0,
  last_error text,
  capi_sent_at timestamptz,
  review_ask_sent_at timestamptz
);
create index orders_email_idx on orders (email);
create index orders_created_idx on orders (created_at);

-- Razorpay can deliver the same event more than once. A repeated id is ignored.
create table webhook_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

create table download_links (
  token_hash text primary key,
  order_id text not null references orders(id),
  expires_at timestamptz not null,
  max_downloads integer not null default 5,
  downloads integer not null default 0,
  created_at timestamptz not null default now()
);
create index download_links_order_idx on download_links (order_id);

create table leads (
  id text primary key,
  email text not null unique,
  source text not null,
  consent_marketing boolean not null default false,
  segment jsonb not null default '{}',
  utm jsonb not null default '{}',
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create table quiz_results (
  id text primary key,
  lead_id text references leads(id),
  quiz text not null,
  answers jsonb not null,
  warmup jsonb not null,
  scores jsonb not null,
  weakest text,
  created_at timestamptz not null default now()
);

create table scheduled_emails (
  id text primary key,
  lead_id text not null references leads(id),
  sequence text not null,
  step integer not null,
  send_at timestamptz not null,
  sent_at timestamptz,
  cancelled_at timestamptz,
  unique (lead_id, sequence, step)
);
create index scheduled_emails_due_idx on scheduled_emails (send_at) where sent_at is null and cancelled_at is null;

create table reviews (
  id text primary key,
  order_id text not null unique references orders(id),
  product_slug text not null,
  name text not null,
  role text not null,
  years text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  consent_publish boolean not null,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now()
);

create table referral_codes (
  code text primary key,
  order_id text not null unique references orders(id),
  email text not null,
  created_at timestamptz not null default now()
);

create table ad_spend (
  id text primary key,
  date date not null,
  amount integer not null,                              -- rupees
  campaign text not null,
  note text
);

create table drill_sessions (
  id text primary key,
  email text not null,
  question_id text not null,
  transcript jsonb not null default '[]',
  status text not null default 'active',
  score integer,
  rating integer,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10,5) not null default 0,
  created_at timestamptz not null default now()
);
create index drill_sessions_email_idx on drill_sessions (email, created_at);

-- Atomic fulfilment lock: only one worker fulfils an order at a time.
create or replace function claim_fulfilment(p_id text, p_lock_ms integer)
returns setof orders language sql as $$
  update orders
     set lock_until = now() + make_interval(secs => p_lock_ms / 1000.0),
         attempts = attempts + 1
   where id = p_id
     and status in ('paid','failed')
     and (lock_until is null or lock_until < now())
  returning *;
$$;

-- Atomic download counter: never more than max_downloads, never after expiry.
create or replace function consume_download(p_token_hash text, p_now timestamptz)
returns setof download_links language sql as $$
  update download_links
     set downloads = downloads + 1
   where token_hash = p_token_hash
     and expires_at > p_now
     and downloads < max_downloads
  returning *;
$$;

alter table orders enable row level security;
alter table webhook_events enable row level security;
alter table download_links enable row level security;
alter table leads enable row level security;
alter table quiz_results enable row level security;
alter table scheduled_emails enable row level security;
alter table reviews enable row level security;
alter table referral_codes enable row level security;
alter table ad_spend enable row level security;
alter table drill_sessions enable row level security;

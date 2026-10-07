create table users (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  created_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'group')),
  title text,
  last_seq bigint not null default 0,
  created_at timestamptz not null default now()
);

create table conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  last_read_seq bigint not null default 0,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  seq bigint not null,
  sender_id uuid not null references users(id),
  client_id text not null,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  unique (conversation_id, seq),
  unique (sender_id, client_id)
);

create index messages_conversation_seq_idx on messages (conversation_id, seq desc);

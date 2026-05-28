create table if not exists kindergarten_communications (
  id uuid primary key default gen_random_uuid(),
  child_id uuid,
  channel text not null,
  message text not null,
  sent_at timestamptz not null default now()
);

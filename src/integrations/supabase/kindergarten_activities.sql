create table if not exists kindergarten_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);

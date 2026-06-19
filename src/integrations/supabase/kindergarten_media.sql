create table if not exists kindergarten_media (
  id uuid primary key default gen_random_uuid(),
  child_id uuid,
  file_url text not null,
  activity_name text,
  captured_at timestamptz,
  created_at timestamptz not null default now()
);

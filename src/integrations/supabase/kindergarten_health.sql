create table if not exists kindergarten_health (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null,
  allergies text[] default '{}',
  health_note text,
  meal_note text,
  created_at timestamptz not null default now()
);

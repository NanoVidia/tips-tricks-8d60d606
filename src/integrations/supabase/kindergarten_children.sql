create table if not exists kindergarten_children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int not null,
  guardian_name text not null,
  phone text,
  allergies text[] default '{}',
  created_at timestamptz not null default now()
);

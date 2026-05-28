create table if not exists kindergarten_attendance (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null,
  attendance_date date not null,
  status text not null check (status in ('present', 'absent')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists kindergarten_billing (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null,
  amount numeric(10,2) not null,
  due_date date not null,
  payment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

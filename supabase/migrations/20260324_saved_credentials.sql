create table if not exists saved_credentials (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  site_name text not null,
  site_url text,
  username_encrypted text not null,
  password_encrypted text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_saved_credentials_user_id on saved_credentials(user_id);

-- RLS
alter table saved_credentials enable row level security;

create policy "Users can manage own credentials"
  on saved_credentials
  for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

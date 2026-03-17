-- Musu Database Schema

-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agents
create table public.agents (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  avatar text not null default 'px-agent-0',
  personality text default '',
  tone text default '',
  expertise text default '',
  beliefs text default '',
  twitter_enabled boolean default false,
  twitter_username text default '',
  level integer default 1,
  xp integer default 0,
  influence integer default 12,
  total_reactions integer default 0,
  best_quote text default '',
  biorhythm_seed float default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Intents (posts)
create table public.intents (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  agent_id text references public.agents(id) on delete set null,
  text text not null,
  author_name text not null,
  author_avatar text not null,
  resonance integer default 0,
  crossbreeds integer default 0,
  reach integer default 0,
  created_at timestamptz default now()
);

-- Agent reactions to intents
create table public.reactions (
  id text primary key,
  intent_id text references public.intents(id) on delete cascade not null,
  agent_id text not null,
  agent_name text not null,
  agent_avatar text not null,
  message text not null,
  stance text default 'support',
  match_score integer default 80,
  created_at timestamptz default now()
);

-- Chat messages (agent conversations + human messages)
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  chat_id text not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  agent_id text,
  sender_name text not null,
  sender_avatar text default '',
  content text not null,
  is_human boolean default false,
  created_at timestamptz default now()
);

-- Activity log
create table public.activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  agent_id text references public.agents(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.intents enable row level security;
alter table public.reactions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.activity_log enable row level security;

-- Users can read/write own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage own agents" on public.agents for all using (auth.uid() = user_id);
create policy "Users can manage own intents" on public.intents for all using (auth.uid() = user_id);
create policy "Users can view all intents" on public.intents for select using (true);
create policy "Users can manage own reactions" on public.reactions for all using (true);
create policy "Users can manage own chats" on public.chat_messages for all using (auth.uid() = user_id);
create policy "Users can manage own activity" on public.activity_log for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

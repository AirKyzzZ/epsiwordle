-- Create infinite_games table for unlimited parallel wordles
create table public.infinite_games (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  word text not null,
  definition text not null,
  game_state jsonb not null default '{"guesses": [], "status": "playing"}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

-- Enable RLS
alter table public.infinite_games enable row level security;

-- Infinite games policies
create policy "Users can view their own infinite games."
  on public.infinite_games for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own infinite games."
  on public.infinite_games for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own infinite games."
  on public.infinite_games for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own infinite games."
  on public.infinite_games for delete
  using ( auth.uid() = user_id );

-- Index for faster queries
create index idx_infinite_games_user_id on public.infinite_games(user_id);
create index idx_infinite_games_created_at on public.infinite_games(created_at desc);

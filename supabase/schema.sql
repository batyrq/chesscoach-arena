create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  city text not null,
  rating integer not null default 1200,
  games integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  reviews integer not null default 0,
  coach_score integer not null default 50,
  badges text[] not null default '{}',
  last_played_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  white_player_id uuid references players(id),
  black_player_id uuid references players(id),
  result text not null default '*',
  pgn text not null default '',
  final_fen text not null,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id),
  player_id uuid references players(id),
  accuracy integer not null,
  blunders integer not null default 0,
  mistakes integer not null default 0,
  summary text not null,
  reviewed_at timestamptz not null default now(),
  unique (game_id, player_id)
);

create table if not exists leaderboard_entries (
  player_id uuid primary key references players(id),
  city text not null,
  rating integer not null default 1200,
  coach_score integer not null default 50,
  games integer not null default 0,
  reviews integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_entries_city_rating_idx
  on leaderboard_entries (city, rating desc, coach_score desc);

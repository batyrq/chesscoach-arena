create extension if not exists "pgcrypto";

comment on schema public is
  'ChessCoach Arena backend. MVP/demo RLS, harden with Supabase Auth before production. service role is server-only. guest_id should be replaced with auth.uid() later.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  guest_id text unique,
  auth_user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  city text not null,
  rating integer default 1200,
  wins integer default 0,
  losses integer default 0,
  draws integer default 0,
  games integer default 0,
  reviews integer default 0,
  coach_score integer default 50,
  pro_status text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.rooms (
  id text primary key,
  status text default 'waiting',
  fen text,
  pgn text,
  current_turn text default 'w',
  move_count integer default 0,
  version integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id text references public.rooms(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  role text check (role in ('white','black','spectator')),
  online boolean default true,
  joined_at timestamptz default now(),
  unique(room_id, player_id)
);

create table if not exists public.moves (
  id uuid primary key default gen_random_uuid(),
  room_id text references public.rooms(id) on delete cascade,
  player_id uuid references public.players(id),
  move_number integer not null,
  san text,
  from_square text,
  to_square text,
  fen_before text,
  fen_after text,
  created_at timestamptz default now()
);

create table if not exists public.games (
  id text primary key,
  room_id text,
  white_player_id uuid references public.players(id),
  black_player_id uuid references public.players(id),
  result text,
  pgn text,
  final_fen text,
  move_count integer default 0,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  game_id text references public.games(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  provider text default 'engine-lite',
  accuracy integer,
  blunders integer default 0,
  mistakes integer default 0,
  inaccuracies integer default 0,
  material_swing jsonb default '[]'::jsonb,
  critical_moment jsonb default '{}'::jsonb,
  ai_review jsonb default '{}'::jsonb,
  puzzle jsonb default '{}'::jsonb,
  counted_for_progression boolean default false,
  created_at timestamptz default now(),
  unique(game_id, player_id)
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade unique,
  city text not null,
  rating integer default 1200,
  coach_score integer default 50,
  games integer default 0,
  wins integer default 0,
  reviews integer default 0,
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  provider text default 'demo',
  status text default 'free',
  plan text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  badge text not null,
  city text,
  created_at timestamptz default now(),
  unique(player_id, badge)
);

create index if not exists players_guest_id_idx on public.players(guest_id);
create unique index if not exists players_auth_user_id_key
  on public.players(auth_user_id)
  where auth_user_id is not null;
create index if not exists players_auth_user_id_idx on public.players(auth_user_id);
create index if not exists players_city_idx on public.players(city);
create index if not exists rooms_updated_at_idx on public.rooms(updated_at);
create index if not exists room_players_room_id_idx on public.room_players(room_id);
create index if not exists moves_room_id_move_number_idx on public.moves(room_id, move_number);
create index if not exists games_room_id_idx on public.games(room_id);
create index if not exists reviews_game_id_player_id_idx on public.reviews(game_id, player_id);
create index if not exists leaderboard_entries_city_rating_idx on public.leaderboard_entries(city, rating desc);
create index if not exists leaderboard_entries_city_coach_score_idx on public.leaderboard_entries(city, coach_score desc);
create index if not exists badges_player_id_idx on public.badges(player_id);

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
  before update on public.players
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
  before update on public.rooms
  for each row
  execute function public.set_updated_at();

create or replace function public.sync_player_leaderboard_entry(target_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_entries (
    player_id,
    city,
    rating,
    coach_score,
    games,
    wins,
    reviews,
    updated_at
  )
  select
    id,
    city,
    rating,
    coach_score,
    games,
    wins,
    reviews,
    now()
  from public.players
  where id = target_player_id
  on conflict (player_id) do update
    set city = excluded.city,
        rating = excluded.rating,
        coach_score = excluded.coach_score,
        games = excluded.games,
        wins = excluded.wins,
        reviews = excluded.reviews,
        updated_at = now();
end;
$$;

create or replace view public.city_weekly_rankings as
select
  city,
  player_id,
  rating,
  coach_score,
  games,
  wins,
  reviews,
  updated_at,
  dense_rank() over (
    partition by city
    order by rating desc, coach_score desc, wins desc, updated_at asc
  ) as city_rank
from public.leaderboard_entries
where updated_at >= now() - interval '7 days';

create or replace view public.top_city_climbers as
select
  p.city,
  p.id as player_id,
  p.display_name,
  p.rating,
  p.coach_score,
  p.wins,
  p.reviews,
  greatest(p.rating - 1200, 0) + greatest(p.coach_score - 50, 0) as climb_score,
  p.updated_at
from public.players p
where p.updated_at >= now() - interval '7 days'
order by climb_score desc, p.rating desc, p.coach_score desc;

alter table public.players enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.moves enable row level security;
alter table public.games enable row level security;
alter table public.reviews enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.subscriptions enable row level security;
alter table public.badges enable row level security;

comment on table public.players is 'MVP/demo RLS, harden with Supabase Auth before production. guest_id should be replaced with auth.uid() later.';
comment on table public.subscriptions is 'Demo subscription state only. service role is server-only; do not expose private payment data to client policies.';

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.players to anon, authenticated;
grant select, insert, update on public.rooms to anon, authenticated;
grant select, insert, update on public.room_players to anon, authenticated;
grant select, insert on public.moves to anon, authenticated;
grant select, insert on public.games to anon, authenticated;
grant select, insert on public.reviews to anon, authenticated;
grant select on public.leaderboard_entries to anon, authenticated;
grant insert, update on public.leaderboard_entries to anon, authenticated;
grant select on public.badges to anon, authenticated;
grant insert on public.badges to anon, authenticated;
grant insert, update on public.subscriptions to anon, authenticated;
grant select on public.city_weekly_rankings to anon, authenticated;
grant select on public.top_city_climbers to anon, authenticated;

drop policy if exists "demo read players" on public.players;
create policy "demo read players"
  on public.players for select
  to anon, authenticated
  using (true);

drop policy if exists "demo insert guest players" on public.players;
create policy "demo insert guest players"
  on public.players for insert
  to anon, authenticated
  with check (guest_id is not null and display_name <> '' and city <> '');

drop policy if exists "demo update guest player progression" on public.players;
create policy "demo update guest player progression"
  on public.players for update
  to anon, authenticated
  using (guest_id is not null)
  with check (guest_id is not null);

drop policy if exists "demo read rooms" on public.rooms;
create policy "demo read rooms"
  on public.rooms for select
  to anon, authenticated
  using (true);

drop policy if exists "demo insert rooms" on public.rooms;
create policy "demo insert rooms"
  on public.rooms for insert
  to anon, authenticated
  with check (id <> '');

drop policy if exists "demo update rooms" on public.rooms;
create policy "demo update rooms"
  on public.rooms for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "demo read room players" on public.room_players;
create policy "demo read room players"
  on public.room_players for select
  to anon, authenticated
  using (true);

drop policy if exists "demo insert room players" on public.room_players;
create policy "demo insert room players"
  on public.room_players for insert
  to anon, authenticated
  with check (role in ('white','black','spectator'));

drop policy if exists "demo update room players presence" on public.room_players;
create policy "demo update room players presence"
  on public.room_players for update
  to anon, authenticated
  using (true)
  with check (role in ('white','black','spectator'));

drop policy if exists "demo read moves" on public.moves;
create policy "demo read moves"
  on public.moves for select
  to anon, authenticated
  using (true);

drop policy if exists "demo insert moves" on public.moves;
create policy "demo insert moves"
  on public.moves for insert
  to anon, authenticated
  with check (room_id is not null and move_number > 0);

drop policy if exists "demo read games" on public.games;
create policy "demo read games"
  on public.games for select
  to anon, authenticated
  using (true);

drop policy if exists "demo insert games" on public.games;
create policy "demo insert games"
  on public.games for insert
  to anon, authenticated
  with check (id <> '');

drop policy if exists "demo read reviews" on public.reviews;
create policy "demo read reviews"
  on public.reviews for select
  to anon, authenticated
  using (true);

drop policy if exists "demo insert reviews" on public.reviews;
create policy "demo insert reviews"
  on public.reviews for insert
  to anon, authenticated
  with check (game_id is not null and player_id is not null);

drop policy if exists "demo read leaderboard" on public.leaderboard_entries;
create policy "demo read leaderboard"
  on public.leaderboard_entries for select
  to anon, authenticated
  using (true);

drop policy if exists "demo upsert leaderboard" on public.leaderboard_entries;
create policy "demo upsert leaderboard"
  on public.leaderboard_entries for insert
  to anon, authenticated
  with check (player_id is not null and city <> '');

drop policy if exists "demo update leaderboard" on public.leaderboard_entries;
create policy "demo update leaderboard"
  on public.leaderboard_entries for update
  to anon, authenticated
  using (player_id is not null)
  with check (player_id is not null and city <> '');

drop policy if exists "demo insert subscriptions" on public.subscriptions;
create policy "demo insert subscriptions"
  on public.subscriptions for insert
  to anon, authenticated
  with check (provider = 'demo' and status in ('free','trialing','active','canceled'));

drop policy if exists "demo update subscriptions" on public.subscriptions;
create policy "demo update subscriptions"
  on public.subscriptions for update
  to anon, authenticated
  using (provider = 'demo')
  with check (provider = 'demo' and status in ('free','trialing','active','canceled'));

drop policy if exists "demo read badges" on public.badges;
create policy "demo read badges"
  on public.badges for select
  to anon, authenticated
  using (true);

drop policy if exists "demo insert badges" on public.badges;
create policy "demo insert badges"
  on public.badges for insert
  to anon, authenticated
  with check (player_id is not null and badge <> '');

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.rooms;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.room_players;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.moves;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.games;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.reviews;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.leaderboard_entries;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

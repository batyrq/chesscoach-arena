alter table public.players
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists players_auth_user_id_key
  on public.players(auth_user_id)
  where auth_user_id is not null;

create index if not exists players_auth_user_id_idx on public.players(auth_user_id);

comment on column public.players.auth_user_id is
  'Links demo guest player rows to Supabase Auth users. guest_id remains the local fallback bridge until full Auth hardening.';

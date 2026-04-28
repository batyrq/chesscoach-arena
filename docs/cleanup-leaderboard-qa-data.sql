-- ChessCoach Arena: QA/demo leaderboard cleanup
--
-- Purpose:
-- Remove obvious QA/test guest rows from public app tables after verifying the preview.
--
-- Safety rules:
-- 1. Run the SELECT preview queries first and inspect every row.
-- 2. Do not run the DELETE block until the preview contains only QA/test guests.
-- 3. Do not delete your real signed-in player. Set keep_auth_user_id and keep_player_id first.
-- 4. This file does not touch auth.users. Remove auth accounts only manually in
--    Supabase Dashboard -> Authentication -> Users, or with a server-only admin script.
-- 5. Never put a service role key in client-side code.

begin;

-- Fill these in before using the DELETE block.
-- keep_auth_user_id should be the auth.users.id for the real account to preserve.
-- keep_player_id should be the public.players.id for the real profile to preserve.
create temporary table suspicious_leaderboard_cleanup_players on commit drop as
with settings as (
  select
    null::uuid as keep_auth_user_id,
    null::uuid as keep_player_id
)
select
  p.id,
  p.auth_user_id,
  p.guest_id,
  p.display_name,
  p.city,
  p.games,
  p.reviews,
  p.updated_at
from public.players p, settings s
where
  p.id is distinct from s.keep_player_id
  and (p.auth_user_id is null or p.auth_user_id is distinct from s.keep_auth_user_id)
  and (
    lower(trim(p.display_name)) in (
      'guest gambiteer',
      'guest gambitee',
      'p1',
      'p1 white',
      'test user'
    )
    or lower(p.display_name) ~ '(^|[^a-z])(codex|qa|phase|local|test|demo)([^a-z]|$)'
    or p.guest_id ~* '^(local-|player-|guest-|demo-)'
  );

select
  'PREVIEW suspicious players' as preview,
  *
from suspicious_leaderboard_cleanup_players
order by updated_at desc nulls last;

select 'PREVIEW leaderboard entries' as preview, le.*
from public.leaderboard_entries le
join suspicious_leaderboard_cleanup_players sp on sp.id = le.player_id
order by le.updated_at desc nulls last;

select 'PREVIEW related reviews' as preview, r.*
from public.reviews r
join suspicious_leaderboard_cleanup_players sp on sp.id = r.player_id
order by r.created_at desc nulls last;

select 'PREVIEW related subscriptions' as preview, s.*
from public.subscriptions s
join suspicious_leaderboard_cleanup_players sp on sp.id = s.player_id;

select 'PREVIEW related badges' as preview, b.*
from public.badges b
join suspicious_leaderboard_cleanup_players sp on sp.id = b.player_id;

-- DELETE BLOCK
-- Uncomment only after reviewing the SELECT previews above.
-- The deletes use the same temporary candidate table as the previews.
--
-- delete from public.badges b
-- using suspicious_leaderboard_cleanup_players sp
-- where b.player_id = sp.id;
--
-- delete from public.leaderboard_entries le
-- using suspicious_leaderboard_cleanup_players sp
-- where le.player_id = sp.id;
--
-- delete from public.reviews r
-- using suspicious_leaderboard_cleanup_players sp
-- where r.player_id = sp.id;
--
-- delete from public.subscriptions s
-- using suspicious_leaderboard_cleanup_players sp
-- where s.player_id = sp.id;
--
-- delete from public.players p
-- using suspicious_leaderboard_cleanup_players sp
-- where p.id = sp.id;

rollback;

-- Change rollback to commit only after reviewing the results and uncommenting the DELETE block.

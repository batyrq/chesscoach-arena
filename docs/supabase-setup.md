# Supabase Setup

Project ref: `lxkvcfqhaexojjcpglle`

ChessCoach Arena keeps the polished local demo flow intact. Supabase is optional for local fallback mode, and required only when testing the live backend tables, RLS policies, and Realtime rooms.

## Required Environment Variables

Set these in Vercel for Production, Preview, and Development:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
NEXT_PUBLIC_DEMO_PAYMENTS
```

Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be used in browser code. `SUPABASE_SERVICE_ROLE_KEY` is server-only.

## Vercel Environment Variables

The project is linked with Vercel CLI:

```bash
npx vercel link
```

List env var names without printing values:

```bash
npx vercel env ls production
npx vercel env ls preview
npx vercel env ls development
```

Pull local development variables:

```bash
npx vercel env pull .env.local
```

`.env.local`, `.env`, `.env.*`, `.vercel`, and Supabase CLI temp metadata are ignored and must not be committed.

## Apply The Migration

Link the Supabase project:

```bash
npx supabase link --project-ref lxkvcfqhaexojjcpglle
```

Apply the migration:

```bash
npx supabase db push
```

If CLI authentication or database password input is required, complete it in the terminal. Do not paste tokens, passwords, or keys into chat or source code.

## Tables

The migration creates:

- `players`
- `rooms`
- `room_players`
- `moves`
- `games`
- `reviews`
- `leaderboard_entries`
- `subscriptions`
- `badges`

It also creates `city_weekly_rankings` and `top_city_climbers` views, useful indexes, `updated_at` triggers for `players` and `rooms`, and a `sync_player_leaderboard_entry` helper.

## RLS Summary

RLS is enabled on every public table. The current policies are MVP/demo policies, harden with Supabase Auth before production.

The demo policies allow public reads for gameplay state and leaderboard surfaces, guest player inserts using `guest_id`, limited gameplay/progression updates, and demo-only subscription writes. The service role key is server-only and can perform trusted admin writes from server routes.

`guest_id` should be replaced with `auth.uid()` once Supabase Auth is introduced.

## Realtime Tables

The migration adds these tables to `supabase_realtime` when the publication exists:

- `rooms`
- `room_players`
- `moves`
- `games`
- `reviews`
- `leaderboard_entries`

## Fallback Behavior

If Supabase env vars are missing or clients return `null`, the app should continue to use the existing local-first demo flow with `BroadcastChannel`, `localStorage`, local progression, and local leaderboard behavior.

## Security

Rotate any key that has been exposed in a public place. Never commit `.env`, `.env.local`, Vercel env files, access tokens, database passwords, or service-role keys. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components or `NEXT_PUBLIC` variables.

# ChessCoach Arena

Play chess with a friend, get AI coaching after the game, solve your blunders as puzzles, and climb your city leaderboard.

Live demo: https://nfactorial.vercel.app

ChessCoach Arena is a startup-style chess training prototype built for the nFactorial / incubator challenge. It keeps the first demo path fast: choose a city, play legal chess, analyze the game, generate a deeper coach review, reveal a blunder puzzle, and watch your city profile progress.

## Core Features

- Legal chess gameplay powered by `chess.js`.
- Local games and friend-room multiplayer.
- Supabase Realtime friend rooms when configured.
- Local fallback through `BroadcastChannel`, `localStorage`, and browser-first adapters.
- Engine-lite AI Coach baseline review from the actual move history.
- Gemini deeper review with engine-lite fallback.
- Blunder-to-puzzle training card with hidden answer reveal.
- City leaderboard with current-player highlighting.
- Badges, rating, coach score, recent reviews, and double-count prevention.
- Demo Pro upgrade flow with Founder Pro status.
- Email/password auth with guest fallback.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local primitives
- Framer Motion
- chess.js
- Supabase
- Gemini API
- Vercel

## Environment Variables

The app works without backend credentials by using local fallback modes. For the live Supabase/Gemini path, configure these variables without committing values:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
GEMINI_MODEL
NEXT_PUBLIC_DEMO_PAYMENTS
```

`SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are server-side only. Do not expose them in client code.

## Local Setup

```bash
npm install
npm run dev
```

Useful verification commands:

```bash
npm run lint
npm run typecheck
npm run build
```

## Judge Demo Flow

1. Open the landing page.
2. Go to the lobby.
3. Enter a display name and choose a city.
4. Start a local game.
5. Make at least six legal moves, or use the coach starter move.
6. Click `Analyze Game`.
7. Generate the deeper AI review.
8. Reveal the blunder-puzzle answer.
9. Open the leaderboard and confirm the current player, badges, and city rank.
10. Open `/pro` and complete the demo Pro upgrade.

The Pro checkout is demo-only. It never asks for a card, never collects payment, and does not integrate Stripe.

## Fallback Behavior

Supabase and Gemini are optional for the demo path. If Supabase is unavailable, profiles, friend rooms, reviews, leaderboard progress, and Pro status continue locally. If Gemini is unavailable, the coach review falls back to deterministic engine-lite output without crashing.

## Auth

ChessCoach Arena supports Supabase email/password auth for saving coach history, city rank, and demo Pro status across sessions. For demo mode, disable email confirmation in Supabase:

```text
Authentication -> Providers -> Email -> Confirm Email OFF
```

If confirmation is still enabled, signup may create an account without an immediate session. Guest mode remains available either way.

## Supabase

Setup notes live in:

```text
docs/supabase-setup.md
```

Schema and migration files live in:

```text
supabase/schema.sql
supabase/migrations/
```

Main tables:

- `players`
- `rooms`
- `room_players`
- `moves`
- `games`
- `reviews`
- `leaderboard_entries`
- `subscriptions`
- `badges`

## Submission Notes

- Production URL: https://nfactorial.vercel.app
- Branch: `supabase-ai-stripe-upgrade`
- Payment flow: demo-only Founder Pro upgrade.
- Local fallback: intentionally preserved for reliable judging.

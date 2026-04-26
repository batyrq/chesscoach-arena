# ChessCoach Arena

A friend-link chess arena with AI post-game coaching, city leaderboards, and Pro monetization.

## Why It Is Different

ChessCoach Arena is not just a chessboard. It turns a casual match into a full training and progression loop:

- Friend-link multiplayer rooms for quick head-to-head games.
- AI Coach review that explains the biggest mistake, better move, and training plan.
- Local city leaderboard for Almaty, Astana, Shymkent, Karaganda, and Other.
- Player progression with rating, coach score, badges, and recent review activity.
- Pro monetization path for deeper engine lines, custom skins, and city badges.

## Features

- Polished startup-style routes: landing, lobby, game, analysis, and leaderboard.
- Legal chess moves and game state validation with `chess.js`.
- Friend-room multiplayer infrastructure with local realtime fallback via `BroadcastChannel` and `localStorage`.
- Engine-lite AI Coach analysis using actual saved move history, FEN, and PGN.
- City leaderboard and local-first player progression persisted in the browser.
- Pro upgrade modal with a Stripe-ready checkout placeholder.
- Supabase-ready adapter shape for realtime rooms and leaderboard persistence.
- Vercel-ready Next.js App Router structure.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local primitives
- Framer Motion
- chess.js
- localStorage and BroadcastChannel
- Supabase-ready adapters

## Local Setup

```bash
npm install
npm run dev -- --port 3025
```

Open:

```text
http://localhost:3025
```

If dependencies are already installed, `npm install` can be skipped.

## Demo Flow

1. Open the landing page.
2. Click `Start Game`.
3. Enter a display name and choose a city in the lobby.
4. Click `Play Local Demo`.
5. Make a few legal moves or use the coach starter move.
6. Click `Analyze Game`.
7. Review the AI Coach feedback and city ranking update.
8. Open the leaderboard and confirm the local player appears in the city ranking.
9. Open the Pro modal from the navbar, analysis page, or leaderboard.
10. Return to the lobby and create a friend room to demo the invite-link flow.

## Environment Variables

The app runs in local demo mode without Supabase or Stripe credentials.

Optional production-oriented variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

When Supabase variables are missing, the app silently uses local adapters and shows local demo rankings.

## Supabase Schema

Schema notes live in:

```text
supabase/schema.sql
```

The planned tables are:

- `players`
- `games`
- `reviews`
- `leaderboard_entries`

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Current Limitations

- AI Coach is engine-lite and deterministic, not Stockfish WASM yet.
- Stripe checkout is represented by a polished modal handoff.
- Supabase adapters are shaped for production but local preview uses browser storage by default.

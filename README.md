# ChessCoach Arena

## One-line pitch

ChessCoach Arena is a mobile-first chess learning platform where players can learn through interactive lessons, earn XP and streaks, play timed games with friends or training bots, review mistakes, turn blunders into practice, climb city rankings, and unlock a demo Founder Pro experience.

## Live demo

- https://nfactorial.vercel.app

## Repository / branch

- GitHub repo: https://github.com/batyrq/chesscoach-arena
- Branch: `supabase-ai-stripe-upgrade`
- Latest deployed commit: `1c7d398 Clean leaderboard QA data handling`

## Product vision

Many chess products focus on one part of the journey: playing games, solving puzzles, or reading lessons. Beginners often play a fast game, lose material, see a confusing position, and then do not know what to study next.

ChessCoach Arena connects the loop into one product:

1. Learn a short lesson.
2. Answer an interactive question.
3. Play a timed game.
4. Review mistakes.
5. Turn a key blunder into a training prompt.
6. Earn XP, streak progress, and badges.
7. Climb a city leaderboard.
8. Return tomorrow with a clear next step.

The goal is not only to host chess games. The goal is to help casual players understand what just happened and come back stronger.

## Why this product

Chess is popular on mobile, but many casual players bounce between apps: one for games, one for videos, one for puzzles, and one for analysis. ChessCoach Arena brings the beginner loop into a single mobile-friendly flow.

- **Mobile-first access:** many players use phones, so the board, navigation, lesson answers, and ranking views are designed for small screens first.
- **Interactive lessons:** short checks reduce passive reading and help beginners retain ideas.
- **Game review:** players learn from the positions they actually played, not random examples.
- **Friend rooms:** shareable games make the product social and easier to spread.
- **Training bot:** users can practice anytime, even without a friend online.
- **City leaderboard:** local competition gives the product a clear motivational hook.
- **XP, streaks, and daily goals:** retention mechanics encourage consistent practice.
- **Founder Pro demo:** the product shows a realistic monetization direction without collecting payment details.

## Core user loop

1. Open the app and continue the next lesson.
2. Answer a lesson question and claim XP.
3. Start a friend game, training bot game, or same-device game.
4. Review the completed game.
5. Study the biggest coaching moment.
6. Reveal the blunder-to-puzzle answer.
7. Follow the recommended learning path.
8. Return the next day to keep the streak alive.

## Main features

### 1. Authentication

ChessCoach Arena supports email/password sign up and sign in. The demo environment is configured for a fast signup flow without requiring email confirmation, while guest mode remains available for quick testing.

Authentication helps users preserve profile identity, progress, leaderboard state, and demo Pro status across sessions. Guest mode is intentionally preserved so judges and first-time users can try the product immediately.

### 2. Mobile-first UX

The app is designed around the way many people actually play chess: on a phone, in short sessions.

- Bottom navigation keeps the main routes one tap away.
- Chessboards remain square and responsive.
- Lesson cards and quiz answers are large enough for touch.
- Ranking rows and cards are dense but readable.
- The mobile layout avoids horizontal overflow.

This matters because mobile accessibility directly affects activation, retention, and shareability.

### 3. Interactive lessons

The `/learn` route is a beginner-friendly lesson path, not a passive article list. Each lesson includes a short explanation and an interactive task.

Supported lesson task patterns include:

- Multiple-choice questions.
- True/false checks.
- Board-square selection tasks.

Wrong answers show feedback and allow retry. Correct answers explain why the answer works and unlock lesson completion. XP is awarded only after the required question is completed. Lesson copy supports English and Russian.

### 4. Gamification

ChessCoach Arena uses lightweight gamification to create a reason to return:

- XP.
- Levels.
- Streaks.
- Daily goals.
- Achievements.
- Lesson unlocks.
- Badges from reviewed games.

The mechanics are intentionally simple. They give beginners visible progress without turning the product into a noisy game layer.

### 5. Chess gameplay

Gameplay is powered by `chess.js` for legal move validation and game state.

Modes include:

- Same-device local game.
- Friend-room multiplayer.
- Training bot game.

The app supports Bullet, Blitz, Rapid, and Classical time controls, including increments. Game screens include clocks, move lists, role/status copy, resign/new game/review flows, and a board-first layout.

### 6. Friend-room multiplayer

Friend rooms let one player create a shareable invite link and another player join from a separate browser or device.

The flow:

1. Player 1 creates a room.
2. Player 2 opens the invite link.
3. White/Black roles are assigned.
4. Moves are validated with `chess.js`.
5. Room state, move history, FEN, clocks, and version are updated.
6. Subscribed clients receive the update through Supabase Realtime/WebSocket-style updates when configured.
7. Boards rehydrate from stored FEN and move history after refresh or reconnect.

If the shared backend services are not available, the app preserves a local/demo behavior path where possible so gameplay remains testable.

### 7. Training bot

The training bot is a legal-move practice opponent. It offers beginner/club/coach-style setup options and lets users practice when friends are unavailable.

Bot games are designed to feed into the same review loop as other games, so a solo practice session can still become a lesson, a puzzle, and leaderboard progress.

### 8. Game Review / AI Coach

After a game, the player can open a review that summarizes the result, key mistakes, and a recommended next step.

The review system has two layers:

- A deterministic lightweight review that works from the move history and does not require external AI.
- Gemini-enhanced coaching through a server-side route when `GEMINI_API_KEY` is available.

Gemini responses are normalized into structured coaching output. If Gemini is missing, unavailable, or returns unusable data, the app falls back to deterministic review output instead of crashing.

There is no Stockfish claim in this project. The current baseline is a lightweight deterministic review, with optional Gemini coaching.

### 9. Blunder-to-puzzle

The review flow turns a major mistake into a training prompt. The answer is hidden by default, and the user can reveal the better idea after thinking.

This is the bridge from analysis to practice: the app does not just say a move was bad, it creates a concrete moment to study.

### 10. City leaderboard

The leaderboard adds social motivation through city-based ranking.

It includes:

- City filters.
- Current player highlighting.
- Ratings and coach score.
- Badges.
- Founder Pro badge display.
- Recent review activity.
- Curated demo fallback rows when real data is sparse.

QA/test-looking rows are filtered from public display so the leaderboard feels production-ready instead of polluted by internal testing.

### 11. Founder Pro demo

Founder Pro demonstrates the monetization direction without running real payments.

Important details:

- The checkout is demo-only.
- No card details are collected.
- No real payment processing is performed.
- Pro badge/status persistence is included for demo purposes.

The intended future paid value could include deeper reviews, more generous review limits, advanced training plans, premium coaching features, and stronger progress insights.

### 12. RU/EN localization

The app supports Russian and English UI with a language switch and local preference persistence.

Localization matters for the Kazakhstan/regional audience while still keeping the product accessible to a wider English-speaking market. New lesson questions, answer options, hints, and feedback are localized.

## Technical architecture

### Frontend

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Component-driven UI.
- Mobile-first responsive layout.
- Local UI primitives inspired by shadcn/ui patterns.
- Lucide icons and compact app-style navigation.

### Chess logic

- `chess.js` for legal moves and turn validation.
- FEN for board state.
- Move history for game review and reconnect restore.
- Board components with stable test hooks.
- Clock and increment handling for timed games.

### Realtime multiplayer

Friend rooms use Supabase Realtime when configured.

Conceptually:

1. A player attempts a move.
2. The move is validated locally with `chess.js`.
3. The room state/version and move record are updated.
4. Other clients subscribed to the room receive the update.
5. Each board rehydrates from FEN and move history.

The implementation also keeps a local/demo path so judging and local testing remain reliable even when remote services are unavailable.

### Backend / persistence

Supabase is used for persistent app data when configured, including:

- Players.
- Rooms.
- Room players.
- Moves.
- Games.
- Reviews.
- Leaderboard entries.
- Subscriptions for demo Pro state.
- Badges.

Guest users also use local browser storage for onboarding, learning progress, and demo continuity. Server-only secrets stay on the server; no service role key is exposed to browser code.

### AI Coach

- Server-side API route for coach review generation.
- `GEMINI_API_KEY` is never exposed to the browser.
- Optional `GEMINI_MODEL` controls the Gemini model.
- JSON normalization keeps the UI resilient.
- Deterministic fallback review is used if Gemini is unavailable or fails.

### Gamification / learning state

Learning progress tracks:

- Completed lessons.
- XP.
- Daily XP.
- Streak.
- Daily goal.
- Achievements.

Guest users can experience the full loop locally. Authenticated users are positioned for persistent profile and ranking continuity.

## Environment variables

List names only. Do not commit values.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
GEMINI_MODEL
NEXT_PUBLIC_DEMO_PAYMENTS
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-safe public configuration values.
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only.
- `GEMINI_API_KEY` is server-side only.
- `GEMINI_MODEL` is optional.
- The app can still run in guest/local mode without some services.
- Gemini features gracefully fall back if the key is missing or the request fails.

## Local setup

```bash
npm install
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

Verification commands:

```bash
npm run lint
npm run typecheck
npm run build
```

## Demo / judge testing flow

Recommended live-demo path:

1. Open https://nfactorial.vercel.app.
2. Switch RU/EN and confirm the UI language changes.
3. Complete or skip onboarding.
4. Open `/learn`.
5. Answer the first lesson question incorrectly and observe retry feedback.
6. Answer correctly and claim XP.
7. Confirm XP/streak progress updates.
8. Open `/lobby`.
9. Start a Training Bot game.
10. Play `e2-e4` and confirm the bot replies.
11. Start a Friend Room.
12. Open the invite link in a second browser context or incognito window.
13. Confirm Player 1 is White and Player 2 is Black.
14. Play `e4/e5` and refresh both tabs to confirm restore.
15. Open a Game Review.
16. Generate Gemini-enhanced coaching if the server key is available.
17. Reveal the blunder-to-puzzle answer.
18. Open `/leaderboard` and check the current player, curated rows, and badges.
19. Open `/pro` and complete the Founder Pro demo flow.

## Quality assurance

The latest verified production build passed:

- `npm run lint`.
- `npm run typecheck`.
- `npm run build`.
- Mobile overflow checks.
- Local game board rendering and `e2-e4`.
- Training bot reply after `e4`.
- Friend-room two-browser `e4/e5` sync.
- Friend-room refresh/reconnect restore.
- Interactive lesson wrong-answer feedback.
- Interactive lesson correct-answer XP/streak update.
- RU/EN language switch.
- Leaderboard cleanup for QA/test-looking rows.
- Current player visibility.
- Founder Pro demo route.
- Technical/test copy scan on main routes.

## Product strategy / business reasoning

ChessCoach Arena is built around retention and learning, not just play.

- Mobile-first design increases reachable user base.
- Interactive lessons reduce beginner drop-off.
- XP, streaks, daily goals, and achievements support daily return behavior.
- Friend rooms create a natural sharing loop.
- City rankings make progress social and locally relevant.
- Game review increases perceived value because feedback is tied to the user's own game.
- Gemini-enhanced coaching demonstrates an upgrade path for deeper insight.
- Founder Pro shows a monetization direction without pretending to process real payments.
- RU/EN localization makes the product more relevant to Kazakhstan and broader regional audiences.

## What is demo-only

Be clear about the prototype boundaries:

- Founder Pro checkout is demo-only.
- No real card details are collected.
- No real payment processing is performed.
- Curated leaderboard demo rows may appear when real leaderboard data is sparse.
- Gemini review quality depends on `GEMINI_API_KEY` availability and model behavior.
- The deterministic review is a lightweight baseline, not a full chess engine.
- The project is not yet a hardened production chess platform.

## Future roadmap

Realistic next steps:

- Stronger chess engine integration, such as Stockfish.
- Deeper opening explorer.
- Real subscriptions and payment processing where legally and operationally available.
- Stronger RLS and auth hardening.
- Custom SMTP and rate-limit configuration.
- Friend challenge history.
- Puzzle rating.
- Lesson authoring system.
- Tournament and club mode.
- Native mobile app wrapper.
- Analytics for lesson drop-off, retention, and game-review conversion.

## Screens / routes

Important routes:

```text
/
/auth
/learn
/lobby
/game/local
/game/[roomId]
/analysis/[gameId]
/leaderboard
/pro
```

## Final note

ChessCoach Arena is designed around one simple loop: learn, play, review, and return stronger the next day.

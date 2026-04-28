import { Chess } from "chess.js";

export type TimeControlId = "1+0" | "2+1" | "3+0" | "3+2" | "5+0" | "10+0" | "15+10" | "30+0";
export type GameModeName = "Bullet" | "Blitz" | "Rapid" | "Classical";
export type BotLevel = "beginner" | "club" | "coach";
export type PlayKind = "friend" | "bot" | "local";

export type TimeControl = {
  id: TimeControlId;
  label: TimeControlId;
  mode: GameModeName;
  initialSeconds: number;
  incrementSeconds: number;
};

export const timeControls: TimeControl[] = [
  { id: "1+0", label: "1+0", mode: "Bullet", initialSeconds: 60, incrementSeconds: 0 },
  { id: "2+1", label: "2+1", mode: "Bullet", initialSeconds: 120, incrementSeconds: 1 },
  { id: "3+0", label: "3+0", mode: "Blitz", initialSeconds: 180, incrementSeconds: 0 },
  { id: "3+2", label: "3+2", mode: "Blitz", initialSeconds: 180, incrementSeconds: 2 },
  { id: "5+0", label: "5+0", mode: "Blitz", initialSeconds: 300, incrementSeconds: 0 },
  { id: "10+0", label: "10+0", mode: "Rapid", initialSeconds: 600, incrementSeconds: 0 },
  { id: "15+10", label: "15+10", mode: "Rapid", initialSeconds: 900, incrementSeconds: 10 },
  { id: "30+0", label: "30+0", mode: "Classical", initialSeconds: 1800, incrementSeconds: 0 }
];

export const botProfiles: Record<BotLevel, { name: string; label: string; rating: number; tagline: string }> = {
  beginner: { name: "Tactic Tiger", label: "Beginner Bot", rating: 900, tagline: "Takes chances and misses simple tactics." },
  club: { name: "Coach Nova", label: "Club Bot", rating: 1350, tagline: "Develops pieces, checks tactics, and fights for the center." },
  coach: { name: "Endgame Monk", label: "Coach Bot", rating: 1650, tagline: "Chooses cleaner plans and creates instructive tension." }
};

export function getTimeControl(id?: string | null) {
  return timeControls.find((item) => item.id === id) ?? timeControls.find((item) => item.id === "10+0")!;
}

export function chooseBotMove(chess: Chess, level: BotLevel) {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  const scored = moves.map((move, index) => {
    const next = new Chess(chess.fen());
    next.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" });
    const pieceValue = materialValue(move.captured);
    let score = pieceValue * 10;

    if (move.san.includes("+")) score += 5;
    if (move.san.includes("#")) score += 100;
    if (["e4", "d4", "e5", "d5", "c4", "c5", "f4", "f5"].includes(move.to)) score += 2;
    if (move.piece === "n" || move.piece === "b") score += level === "beginner" ? 0 : 2;
    if (next.inCheck()) score += 3;
    if (move.promotion) score += 30;

    if (level === "beginner") score += ((index * 7) % 5) - 2;
    if (level === "coach") score += kingSafetyBonus(next);
    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score || a.move.san.localeCompare(b.move.san));

  if (level === "beginner" && scored.length > 2) return scored[Math.min(2, scored.length - 1)].move;
  if (level === "club" && scored.length > 1) return scored[0].score - scored[1].score > 9 ? scored[0].move : scored[1].move;
  return scored[0].move;
}

function materialValue(piece?: string) {
  return { p: 1, n: 3, b: 3, r: 5, q: 9 }[piece ?? ""] ?? 0;
}

function kingSafetyBonus(chess: Chess) {
  const board = chess.board().flat();
  const queens = board.filter((piece) => piece?.type === "q").length;
  return queens < 2 ? 2 : 0;
}

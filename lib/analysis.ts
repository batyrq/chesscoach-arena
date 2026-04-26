import { Chess } from "chess.js";
import type { AnalysisResult, Move } from "@/lib/types";

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

export function analyzeGameFromMoves(moves: Move[], finalFen: string): AnalysisResult {
  const game = new Chess(finalFen);
  const captures = moves.filter((move) => move.flags?.includes("c") || move.san.includes("x"));
  const checks = moves.filter((move) => move.san.includes("+") || move.san.includes("#"));
  const lateMove = moves[Math.max(0, Math.floor(moves.length * 0.65) - 1)];
  const biggestMistakeMove = findLikelyMistake(moves);
  const materialBalance = evaluateMaterial(finalFen);
  const accuracy = Math.max(54, Math.min(96, 88 - captures.length * 1.8 - Math.abs(materialBalance) * 1.6 + checks.length));
  const blunders = Math.max(0, Math.min(5, Math.floor(captures.length / 3) + (game.isCheckmate() ? 1 : 0)));

  return {
    accuracy: Math.round(accuracy),
    blunders,
    biggestMistake: biggestMistakeMove
      ? `${biggestMistakeMove.san} was ambitious, but it asked your position to cash a check your development had not written yet. Around move ${biggestMistakeMove.moveNumber}, your opponent started getting tempo against your king and loose pieces.`
      : "You kept the position stable. The main missed opportunity was quieter: improve your worst piece before starting the next pawn break.",
    betterMove: suggestBetterMove(biggestMistakeMove),
    whyItWorks: "The better plan makes your next threat harder to meet because your rooks, king safety, and minor pieces are all helping the same idea instead of playing separate games.",
    phaseAdvice: {
      opening: "Fight for the center first, then decide which pawn break your pieces actually support.",
      middlegame: "Before every capture, ask what defender disappears and whether your king becomes easier to target.",
      endgame: lateMove ? `After ${lateMove.san}, trade only if your king reaches the key squares first.` : "Activate the king early and do not rush pawn moves without a target square."
    },
    drill: "Replay the critical position three times: once looking only for checks, once only for captures, and once only for quiet improving moves. The third pass is where your rating jump is hiding.",
    tips: [
      "Before you grab material, ask: which piece becomes undefended after the capture?",
      "When you are ahead, trade your opponent's active pieces first, not just any piece.",
      "After every game, review the first moment you moved the same piece twice in the opening."
    ]
  };
}

function findLikelyMistake(moves: Move[]) {
  return [...moves]
    .reverse()
    .find((move) => move.san.includes("x") || move.san.includes("?") || move.flags?.includes("c"));
}

function suggestBetterMove(move?: Move) {
  if (!move) {
    return "Re1, Qe2, or h3-style improving moves depending on the structure.";
  }

  if (move.san.includes("Q")) {
    return "Bring a rook or minor piece into the attack before moving the queen again.";
  }

  if (move.san.includes("x")) {
    return "Castle or improve your last undeveloped piece before committing to the capture.";
  }

  return "Improve your least active piece and keep the tension one move longer.";
}

function evaluateMaterial(fen: string) {
  const board = fen.split(" ")[0];
  return [...board].reduce((score, char) => {
    const lower = char.toLowerCase();
    if (!pieceValues[lower]) return score;
    return score + (char === lower ? -pieceValues[lower] : pieceValues[lower]);
  }, 0);
}

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
      ? `${biggestMistakeMove.san} gave your opponent forcing chances around move ${biggestMistakeMove.moveNumber}.`
      : "You kept the position stable, but missed moments to improve your worst piece.",
    betterMove: suggestBetterMove(biggestMistakeMove),
    whyItWorks: "The recommended plan improves coordination before launching tactics, so your threats arrive with defenders already overloaded.",
    phaseAdvice: {
      opening: "Fight for the center first, then decide which pawn break your pieces actually support.",
      middlegame: "Before every capture, ask what defender disappears and whether your king becomes easier to target.",
      endgame: lateMove ? `After ${lateMove.san}, trade only if your king reaches the key squares first.` : "Activate the king early and do not rush pawn moves without a target square."
    },
    drill: "Play 10 puzzle positions where you must find a quiet improving move before calculating checks.",
    tips: [
      "Name your opponent's threat before choosing your move.",
      "When ahead, trade attackers instead of random pieces.",
      "Review every capture and check from the game before moving to the next one."
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
    return "Develop a rook or minor piece first instead of moving the queen again.";
  }

  if (move.san.includes("x")) {
    return "Add pressure with a developing move before committing to the capture.";
  }

  return "Improve your least active piece and keep tension one move longer.";
}

function evaluateMaterial(fen: string) {
  const board = fen.split(" ")[0];
  return [...board].reduce((score, char) => {
    const lower = char.toLowerCase();
    if (!pieceValues[lower]) return score;
    return score + (char === lower ? -pieceValues[lower] : pieceValues[lower]);
  }, 0);
}

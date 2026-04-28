import { Chess, type Move as ChessMove } from "chess.js";
import type { AnalysisResult, CoachTip, CriticalMoment, Move, MoveEvaluation } from "@/lib/types";

export type AnalysisInput = {
  moves: Move[];
  finalFen: string;
  pgn?: string;
};

export interface AnalysisAdapter {
  analyze(input: AnalysisInput): AnalysisResult;
}

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

const pieceNames: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king"
};

export class EngineLiteAnalysisAdapter implements AnalysisAdapter {
  analyze(input: AnalysisInput): AnalysisResult {
    const replay = replayMoves(input.moves);
    const evaluations = replay.evaluations;
    const fallbackMoment = evaluations
      .filter((item) => item.quality !== "good" && item.quality !== "best")
      .sort((a, b) => qualitySeverity(b.quality) - qualitySeverity(a.quality) || b.opportunityCost - a.opportunityCost || a.swing - b.swing)[0]
      ?? evaluations.filter((item) => item.opportunityCost >= 1.2).sort((a, b) => b.opportunityCost - a.opportunityCost)[0]
      ?? null;
    const criticalMoment = buildCriticalMoment(fallbackMoment);
    const blunders = evaluations.filter((item) => item.quality === "blunder").length;
    const mistakes = evaluations.filter((item) => item.quality === "mistake").length;
    const inaccuracies = evaluations.filter((item) => item.quality === "inaccuracy").length;
    const materialSwing = evaluations.at(-1)?.materialAfter ?? evaluateMaterial(input.finalFen);
    const accuracy = estimateAccuracy(evaluations, blunders, mistakes, inaccuracies);
    const tips = buildTips(evaluations, materialSwing, replay.repeatedOpeningPiece);

    return {
      accuracy,
      blunders,
      mistakes,
      inaccuracies,
      materialSwing,
      summary: buildSummary(accuracy, materialSwing, criticalMoment),
      criticalMoment,
      evaluations,
      materialTimeline: evaluations.map((evaluation) => ({
        ply: evaluation.ply,
        label: `${evaluation.moveNumber}${evaluation.color === "w" ? "." : "..."} ${evaluation.san}`,
        balance: evaluation.materialAfter
      })),
      biggestMistake: criticalMoment
        ? `On move ${criticalMoment.moveNumber}, ${sideName(criticalMoment.color)} played ${criticalMoment.originalMove}. The position shifted about ${Math.abs(criticalMoment.swing).toFixed(1)} points because ${criticalMoment.explanation}`
        : "No major tactical crash appeared. The review mostly found development and conversion details.",
      betterMove: criticalMoment?.betterMove ?? "Keep developing and avoid forcing trades before your pieces are coordinated.",
      whyItWorks: criticalMoment
        ? explainBetterMove(criticalMoment)
        : "The safer plan keeps material protected while improving your least active piece.",
      phaseAdvice: buildPhaseAdvice(evaluations, materialSwing, replay.repeatedOpeningPiece),
      drill: buildDrill(criticalMoment, evaluations),
      tips
    };
  }
}

export class StockfishAnalysisAdapter implements AnalysisAdapter {
  analyze(input: AnalysisInput): AnalysisResult {
    return new EngineLiteAnalysisAdapter().analyze(input);
  }
}

export function analyzeGameFromMoves(moves: Move[], finalFen: string, pgn?: string): AnalysisResult {
  return new EngineLiteAnalysisAdapter().analyze({ moves, finalFen, pgn });
}

function replayMoves(moves: Move[]) {
  const game = new Chess();
  const evaluations: MoveEvaluation[] = [];
  const openingPieceMoves = new Map<string, number>();
  let repeatedOpeningPiece = false;

  moves.forEach((inputMove, index) => {
    const fenBefore = game.fen();
    const color = game.turn();
    const materialBefore = evaluateMaterial(fenBefore);
    const bestCandidate = chooseBestMove(game, inputMove);
    const missedCapture = findBestCapture(game);
    let move: ChessMove | null = null;

    try {
      move = game.move(inputMove.san) ?? game.move({ from: inputMove.from, to: inputMove.to, promotion: "q" });
    } catch {
      move = null;
    }

    if (!move) return;

    const materialAfter = evaluateMaterial(game.fen());
    const moverSwing = (materialAfter - materialBefore) * (color === "w" ? 1 : -1);
    const exposurePenalty = getExposurePenalty(game, move);
    const swing = moverSwing - exposurePenalty;
    const actualMissedCapture = missedCapture && move.san !== missedCapture.san ? missedCapture : undefined;
    const actualMoveScore = bestCandidate?.move.san === move.san ? bestCandidate.score : Math.max(0, swing);
    const opportunityCost = Math.max(0, (bestCandidate?.score ?? 0) - actualMoveScore);
    const quality = classifyMove(swing, move, actualMissedCapture, bestCandidate, opportunityCost);

    if (index < 12 && !["p", "k"].includes(move.piece)) {
      const key = `${move.color}-${move.piece}-${move.from}`;
      const count = (openingPieceMoves.get(key) ?? 0) + 1;
      openingPieceMoves.set(key, count);
      repeatedOpeningPiece = repeatedOpeningPiece || count > 1;
    }

    evaluations.push({
      ply: index + 1,
      moveNumber: Math.ceil((index + 1) / 2),
      color,
      san: move.san,
      fenBefore,
      fenAfter: game.fen(),
      materialBefore,
      materialAfter,
      swing,
      opportunityCost,
      quality,
      reason: describeMoveQuality(quality, swing, move, actualMissedCapture, exposurePenalty),
      captured: move.captured,
      gaveCheck: move.san.includes("+") || move.san.includes("#"),
      missedCapture: actualMissedCapture && actualMissedCapture.score >= 3 ? actualMissedCapture.san : undefined
    });
  });

  return { evaluations, repeatedOpeningPiece };
}

function chooseBestMove(game: Chess, actualMove?: Partial<Pick<Move, "san" | "to">>) {
  const legalMoves = game.moves({ verbose: true });
  const color = game.turn();
  let best: { move: ChessMove; score: number; explanation: string } | null = null;

  for (const move of legalMoves) {
    if (actualMove && move.san === actualMove.san) continue;

    const candidate = new Chess(game.fen());
    candidate.move(move.san);
    const materialGain = (evaluateMaterial(candidate.fen()) - evaluateMaterial(game.fen())) * (color === "w" ? 1 : -1);
    const captureValue = move.captured ? pieceValues[move.captured] ?? 0 : 0;
    const exposurePenalty = getExposurePenalty(candidate, move);
    const mateBonus = candidate.isCheckmate() ? 100 : 0;
    const checkBonus = candidate.inCheck() ? 0.35 : 0;
    const recaptureBonus = actualMove?.to === move.to && move.captured ? 0.5 : 0;
    const score = mateBonus + materialGain + captureValue + checkBonus + recaptureBonus - exposurePenalty;
    const explanation = move.captured
      ? `it wins a ${pieceName(move.captured)} while keeping the initiative`
      : candidate.inCheck()
        ? "it gives check without dropping material"
        : "it improves the position without creating an immediate target";

    if (!best || score > best.score) {
      best = { move, score, explanation };
    }
  }

  return best;
}

function findBestCapture(game: Chess) {
  return game
    .moves({ verbose: true })
    .filter((move) => move.captured)
    .map((move) => ({ san: move.san, score: pieceValues[move.captured ?? "p"] ?? 0 }))
    .sort((a, b) => b.score - a.score)[0];
}

function buildCriticalMoment(evaluation: MoveEvaluation | null): CriticalMoment | null {
  if (!evaluation) return null;
  const game = new Chess(evaluation.fenBefore);
  const best = chooseBestMove(game, { san: evaluation.san });
  const swing = evaluation.swing < -0.5 ? evaluation.swing : -Math.max(1.2, Math.min(6, evaluation.opportunityCost || best?.score || 1.2));

  return {
    ply: evaluation.ply,
    moveNumber: evaluation.moveNumber,
    color: evaluation.color,
    originalMove: evaluation.san,
    betterMove: best?.move.san ?? "Develop a safe piece",
    swing,
    fenBefore: evaluation.fenBefore,
    explanation: buildCriticalExplanation(evaluation, best?.explanation)
  };
}

function qualitySeverity(quality: MoveEvaluation["quality"]) {
  if (quality === "blunder") return 3;
  if (quality === "mistake") return 2;
  if (quality === "inaccuracy") return 1;
  return 0;
}

function buildCriticalExplanation(evaluation: MoveEvaluation, betterReason?: string) {
  if (evaluation.captured && evaluation.swing < 0) {
    return `${evaluation.san} won material at first glance, but the resulting position gave it back with interest.`;
  }

  if (evaluation.missedCapture) {
    return `${evaluation.san} missed the forcing capture ${evaluation.missedCapture}.`;
  }

  if (evaluation.swing <= -5) {
    return `${evaluation.san} allowed a major material swing. ${betterReason ?? "A calmer move kept your heavy pieces safer."}`;
  }

  if (evaluation.swing <= -3) {
    return `${evaluation.san} let a minor piece or rook become vulnerable. ${betterReason ?? "Development first was cleaner."}`;
  }

  return `${evaluation.san} was playable, but the review found a more forcing candidate: ${betterReason ?? "there was a cleaner improving move."}`;
}

function classifyMove(swing: number, move: ChessMove, missedCapture: { san: string; score: number } | undefined, bestCandidate: { score: number } | null, opportunityCost: number): MoveEvaluation["quality"] {
  const missedBigCapture = missedCapture && !move.captured && missedCapture.score >= 5;
  const candidateGap = bestCandidate ? opportunityCost : 0;

  if (swing <= -5 || missedBigCapture || candidateGap >= 8) return "blunder";
  if (swing <= -3 || candidateGap >= 5) return "mistake";
  if (swing <= -1.2 || (missedCapture && !move.captured && missedCapture.score >= 3) || candidateGap >= 2.5) return "inaccuracy";
  if (move.san.includes("#") || swing >= 5) return "best";
  return "good";
}

function describeMoveQuality(quality: MoveEvaluation["quality"], swing: number, move: ChessMove, missedCapture: { san: string; score: number } | undefined, exposurePenalty: number) {
  if (quality === "blunder") {
    if (missedCapture && !move.captured) return `Missed ${missedCapture.san}, a high-value capture.`;
    if (exposurePenalty >= 3) return `The moved piece became tactically exposed.`;
    return `Dropped roughly ${Math.abs(swing).toFixed(1)} points of material/position.`;
  }

  if (quality === "mistake") return `The move gave the opponent a concrete material target.`;
  if (quality === "inaccuracy") return missedCapture ? `A useful capture was available: ${missedCapture.san}.` : `Playable, but it gave up some coordination.`;
  if (quality === "best") return move.san.includes("#") ? "Forced checkmate." : "Won material or forced a major concession.";
  return move.san.includes("+") ? "Active check with no obvious material loss." : "Solid move.";
}

function getExposurePenalty(gameAfterMove: Chess, move: ChessMove) {
  const movedPieceValue = pieceValues[move.piece] ?? 0;
  if (movedPieceValue <= 1 || !move.to) return 0;

  const opponentCaptures = gameAfterMove.moves({ verbose: true }).filter((reply) => reply.to === move.to && reply.captured);
  const cheapestAttacker = Math.min(...opponentCaptures.map((reply) => pieceValues[reply.piece] ?? 9));

  if (!Number.isFinite(cheapestAttacker)) return 0;
  return cheapestAttacker < movedPieceValue ? movedPieceValue - cheapestAttacker : 0;
}

function evaluateMaterial(fen: string) {
  const board = new Chess(fen).board();
  return board.flat().reduce((score, piece) => {
    if (!piece) return score;
    const value = pieceValues[piece.type] ?? 0;
    return score + (piece.color === "w" ? value : -value);
  }, 0);
}

function estimateAccuracy(evaluations: MoveEvaluation[], blunders: number, mistakes: number, inaccuracies: number) {
  if (evaluations.length === 0) return 92;
  const penalty = blunders * 13 + mistakes * 7 + inaccuracies * 3 + Math.max(0, evaluations.length - 20) * 0.15;
  const activityBonus = Math.min(4, evaluations.filter((item) => item.gaveCheck || item.captured).length * 0.4);
  return Math.max(35, Math.min(98, Math.round(92 - penalty + activityBonus)));
}

function buildSummary(accuracy: number, materialSwing: number, criticalMoment: CriticalMoment | null) {
  const materialText = materialSwing === 0
    ? "Material stayed level"
    : `${materialSwing > 0 ? "White" : "Black"} finished up ${Math.abs(materialSwing)} points of material`;
  const momentText = criticalMoment
    ? `The biggest coaching moment came on move ${criticalMoment.moveNumber} after ${criticalMoment.originalMove}.`
    : "No single move dominated the review.";

  return `${materialText}. Estimated accuracy: ${accuracy}%. ${momentText}`;
}

function buildPhaseAdvice(evaluations: MoveEvaluation[], materialSwing: number, repeatedOpeningPiece: boolean) {
  const early = evaluations.slice(0, 10);
  const captures = evaluations.filter((item) => item.captured);
  const checks = evaluations.filter((item) => item.gaveCheck);

  return {
    opening: repeatedOpeningPiece
      ? "Your opening was active, but you moved the same piece multiple times before finishing development. Get king safety and rooks connected sooner."
      : early.length ? "You developed into the center reasonably well. The next upgrade is checking whether every forcing move leaves a piece loose." : "Play a few more opening moves before judging the phase.",
    middlegame: captures.length
      ? "The middlegame turned on captures. Before taking material, ask what recapture or tempo your opponent gets immediately after."
      : "The middlegame stayed quiet. Look for pawn breaks only when your worst piece has joined the plan.",
    endgame: Math.abs(materialSwing) >= 3
      ? `With ${materialSwing > 0 ? "White" : "Black"} ahead materially, the clean plan is trading active enemy pieces and avoiding queen-side counterplay.`
      : checks.length ? "Checks created initiative, but if the attack fades, switch quickly into king activity and pawn targets." : "No clear endgame appeared yet. If pieces trade, activate the king before pushing pawns."
  };
}

function buildTips(evaluations: MoveEvaluation[], materialSwing: number, repeatedOpeningPiece: boolean): CoachTip[] {
  const hasMissedCapture = evaluations.some((item) => item.missedCapture);
  const hasBlunder = evaluations.some((item) => item.quality === "blunder");
  const hasQueenMove = evaluations.some((item) => item.san.includes("Q"));
  const tips: CoachTip[] = [];

  if (hasBlunder) {
    tips.push({ title: "Run a loose-piece scan", body: "Before every forcing move, check whether your queen, rook, or last moved piece becomes undefended." });
  }

  if (hasMissedCapture) {
    tips.push({ title: "Calculate captures first", body: "You missed at least one useful capture. Spend five seconds listing checks, captures, and threats before choosing a quiet move." });
  }

  if (repeatedOpeningPiece || hasQueenMove) {
    tips.push({ title: "Finish development before attacking", body: "Your attack becomes much safer when both rooks and minor pieces are participating, not just the queen." });
  }

  if (materialSwing !== 0) {
    tips.push({
      title: materialSwing > 0 ? "Convert the extra material" : "Stabilize after losing material",
      body: materialSwing > 0
        ? "When ahead, trade the opponent's active pieces first and avoid grabbing pawns that reopen the king."
        : "When down material, keep pieces active and create threats instead of trading into a worse endgame."
    });
  }

  tips.push({ title: "Review the first swing", body: "The fastest improvement comes from replaying the first move where the evaluation changed by more than one point." });

  return tips.slice(0, 3);
}

function buildDrill(criticalMoment: CriticalMoment | null, evaluations: MoveEvaluation[]) {
  if (criticalMoment) {
    return `Set up the position before ${criticalMoment.originalMove}. Find three candidate moves, then explain why ${criticalMoment.betterMove} is safer before moving.`;
  }

  const captureCount = evaluations.filter((item) => item.captured).length;
  return captureCount ? "Replay every capture from the game and name the defender that disappeared." : "Play five quiet-position puzzles where the best move improves the worst piece.";
}

function explainBetterMove(moment: CriticalMoment) {
  return `${moment.betterMove} is legal in the original position and scores better in the coach review because it improves the immediate tactic without leaving the same material target behind.`;
}

function pieceName(piece: string) {
  return pieceNames[piece.toLowerCase()] ?? "piece";
}

function sideName(color: "w" | "b") {
  return color === "w" ? "White" : "Black";
}

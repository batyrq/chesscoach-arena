import type { AnalysisResult, City, Move } from "@/lib/types";

export type CoachPersonality =
  | "Friendly Coach"
  | "Strict Coach"
  | "BigTech Interview Coach"
  | "Meme Coach";

export type CoachReviewProvider = "gemini" | "engine-lite";

export type CoachReviewPuzzle = {
  fen: string;
  question: string;
  answerMove: string;
  explanation: string;
};

export type EnhancedCoachReview = {
  provider: CoachReviewProvider;
  summary: string;
  biggestMistakeExplanation: string;
  betterMoveExplanation: string;
  trainingTips: string[];
  phaseAdvice: {
    opening: string;
    middlegame: string;
    endgame: string;
  };
  trainingDrill: string;
  shareHeadline: string;
  puzzle: CoachReviewPuzzle;
};

export type CoachReviewRequest = {
  gameId: string;
  pgn?: string;
  fen?: string;
  moves?: Move[];
  analysis: AnalysisResult;
  player?: {
    city?: City;
    rank?: number | null;
  };
  personality?: CoachPersonality;
  playerId?: string;
  loadExistingOnly?: boolean;
  enhancedReview?: EnhancedCoachReview;
};

const personalities: CoachPersonality[] = [
  "Friendly Coach",
  "Strict Coach",
  "BigTech Interview Coach",
  "Meme Coach",
];

export function normalizePersonality(value: unknown): CoachPersonality {
  return personalities.includes(value as CoachPersonality) ? value as CoachPersonality : "Friendly Coach";
}

export function normalizeCoachReview(value: unknown, fallback: EnhancedCoachReview, provider: CoachReviewProvider): EnhancedCoachReview {
  if (!value || typeof value !== "object") {
    return { ...fallback, provider };
  }

  const input = value as Partial<EnhancedCoachReview>;
  const puzzle = input.puzzle && typeof input.puzzle === "object" ? input.puzzle as Partial<CoachReviewPuzzle> : {};
  const phaseAdvice = input.phaseAdvice && typeof input.phaseAdvice === "object" ? input.phaseAdvice as Partial<EnhancedCoachReview["phaseAdvice"]> : {};

  return {
    provider,
    summary: cleanText(input.summary, fallback.summary),
    biggestMistakeExplanation: cleanText(input.biggestMistakeExplanation, fallback.biggestMistakeExplanation),
    betterMoveExplanation: cleanText(input.betterMoveExplanation, fallback.betterMoveExplanation),
    trainingTips: normalizeTips(input.trainingTips, fallback.trainingTips),
    phaseAdvice: {
      opening: cleanText(phaseAdvice.opening, fallback.phaseAdvice.opening),
      middlegame: cleanText(phaseAdvice.middlegame, fallback.phaseAdvice.middlegame),
      endgame: cleanText(phaseAdvice.endgame, fallback.phaseAdvice.endgame),
    },
    trainingDrill: cleanText(input.trainingDrill, fallback.trainingDrill),
    shareHeadline: cleanText(input.shareHeadline, fallback.shareHeadline),
    puzzle: {
      fen: cleanText(puzzle.fen, fallback.puzzle.fen),
      question: cleanText(puzzle.question, fallback.puzzle.question),
      answerMove: cleanText(puzzle.answerMove, fallback.puzzle.answerMove),
      explanation: cleanText(puzzle.explanation, fallback.puzzle.explanation),
    },
  };
}

export function buildEngineLiteCoachReview(input: Pick<CoachReviewRequest, "analysis" | "fen" | "moves" | "player" | "personality">): EnhancedCoachReview {
  const analysis = input.analysis;
  const personality = normalizePersonality(input.personality);
  const moment = analysis.criticalMoment;
  const cityText = input.player?.city ? ` for ${input.player.city}` : "";
  const rankText = input.player?.rank ? ` from city rank #${input.player.rank}` : "";
  const tonePrefix = personality === "Strict Coach"
    ? "No sugarcoat:"
    : personality === "BigTech Interview Coach"
      ? "Think of this like a systems interview:"
      : personality === "Meme Coach"
        ? "Tiny chess roast, useful edition:"
        : "Nice review moment:";

  const tips = analysis.tips.map((tip) => `${tip.title}: ${tip.body}`).slice(0, 3);
  while (tips.length < 3) {
    tips.push("Before moving, list checks, captures, and threats for both sides.");
  }

  return {
    provider: "engine-lite",
    summary: `${tonePrefix} ${analysis.summary} This is a practical improvement map${cityText}${rankText}.`,
    biggestMistakeExplanation: analysis.biggestMistake,
    betterMoveExplanation: `${analysis.betterMove}: ${analysis.whyItWorks}`,
    trainingTips: tips,
    phaseAdvice: analysis.phaseAdvice,
    trainingDrill: analysis.drill,
    shareHeadline: buildShareHeadline(analysis, input.player?.city),
    puzzle: {
      fen: moment?.fenBefore ?? input.fen ?? input.moves?.at(-1)?.fenAfter ?? "",
      question: moment
        ? `Find the better move for ${moment.color === "w" ? "White" : "Black"} instead of ${moment.originalMove}.`
        : "Find a calm improving move that keeps your pieces protected.",
      answerMove: moment?.betterMove ?? analysis.betterMove,
      explanation: moment?.explanation ?? analysis.whyItWorks,
    },
  };
}

export function buildGeminiPrompt(input: CoachReviewRequest) {
  const analysis = input.analysis;
  const personality = normalizePersonality(input.personality);
  const compactMoves = (input.moves ?? []).slice(0, 60).map((move) => ({
    san: move.san,
    from: move.from,
    to: move.to,
    moveNumber: move.moveNumber,
    fenAfter: move.fenAfter,
  }));

  return [
    "Return strict JSON only. Do not wrap it in markdown.",
    "You are enhancing a chess coach review. Existing engine-lite facts are the source of truth.",
    "Do not invent illegal moves. If suggesting a move, use the provided betterMove or the given move facts.",
    "Base the puzzle on the provided biggest mistake / better move when available.",
    "Keep the review concise and useful for a chess learner.",
    `Coach personality: ${personality}. The personality changes tone only, never the JSON shape.`,
    "Required JSON shape:",
    JSON.stringify({
      summary: "string",
      biggestMistakeExplanation: "string",
      betterMoveExplanation: "string",
      trainingTips: ["string", "string", "string"],
      phaseAdvice: { opening: "string", middlegame: "string", endgame: "string" },
      trainingDrill: "string",
      shareHeadline: "string",
      puzzle: { fen: "string", question: "string", answerMove: "string", explanation: "string" },
    }),
    "Facts:",
    JSON.stringify({
      gameId: input.gameId,
      pgn: input.pgn,
      finalFen: input.fen,
      player: input.player,
      accuracy: analysis.accuracy,
      blunders: analysis.blunders,
      mistakes: analysis.mistakes,
      inaccuracies: analysis.inaccuracies,
      materialSwing: analysis.materialSwing,
      biggestMistake: analysis.biggestMistake,
      betterMove: analysis.betterMove,
      whyItWorks: analysis.whyItWorks,
      criticalMoment: analysis.criticalMoment,
      phaseAdvice: analysis.phaseAdvice,
      trainingDrill: analysis.drill,
      tips: analysis.tips,
      moves: compactMoves,
    }),
  ].join("\n");
}

function normalizeTips(value: unknown, fallback: string[]) {
  const tips = Array.isArray(value)
    ? value.map((item) => cleanText(item, "")).filter(Boolean)
    : [];
  return [...tips, ...fallback].slice(0, 3);
}

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length > 900) return fallback;
  return cleaned;
}

function buildShareHeadline(analysis: AnalysisResult, city?: City) {
  const citySuffix = city ? ` in ${city}` : "";
  if (analysis.blunders === 0) return `Clean review: ${analysis.accuracy}% accuracy${citySuffix}`;
  return `Coach found ${analysis.blunders} blunder${analysis.blunders === 1 ? "" : "s"} to fix${citySuffix}`;
}

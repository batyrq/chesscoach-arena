import { NextResponse } from "next/server";
import {
  buildEngineLiteCoachReview,
  buildGeminiPrompt,
  normalizeCoachReview,
  normalizePersonality,
  type CoachReviewRequest,
  type EnhancedCoachReview,
} from "@/lib/coach-review";
import { getServerSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const defaultGeminiModel = "gemini-1.5-flash";

export async function POST(request: Request) {
  let body: CoachReviewRequest;

  try {
    body = await request.json() as CoachReviewRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.gameId || !body.analysis) {
    return NextResponse.json({ error: "Missing gameId or analysis" }, { status: 400 });
  }

  const personality = normalizePersonality(body.personality);
  const fallback = buildEngineLiteCoachReview({ ...body, personality });

  if (body.enhancedReview) {
    const provider = body.enhancedReview.provider === "gemini" ? "gemini" : "engine-lite";
    const review = normalizeCoachReview(body.enhancedReview, fallback, provider);
    await saveEnhancedReview(body.gameId, body.playerId, review).catch(() => undefined);
    return NextResponse.json({ review });
  }

  if (body.loadExistingOnly) {
    const existing = await loadSavedReview(body.gameId, body.playerId, fallback);
    return NextResponse.json(existing ?? { review: null });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const review = geminiKey
    ? await generateGeminiReview(body, fallback, geminiKey).catch(() => fallback)
    : fallback;

  await saveEnhancedReview(body.gameId, body.playerId, review).catch(() => undefined);

  return NextResponse.json({ review });
}

async function generateGeminiReview(
  body: CoachReviewRequest,
  fallback: EnhancedCoachReview,
  geminiKey: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  const model = process.env.GEMINI_MODEL || defaultGeminiModel;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildGeminiPrompt(body) }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.55,
            maxOutputTokens: 1200,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Gemini request failed");
    }

    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!rawText) throw new Error("Gemini returned empty content");

    const parsed = JSON.parse(extractJson(rawText));
    return normalizeCoachReview(parsed, fallback, "gemini");
  } finally {
    clearTimeout(timeout);
  }
}

async function loadSavedReview(gameId: string, playerId: string | undefined, fallback: EnhancedCoachReview) {
  const supabase = getServerSupabaseAdminClient();
  if (!supabase) return null;

  let query = supabase
    .from("reviews")
    .select("ai_review,puzzle")
    .eq("game_id", gameId)
    .not("ai_review", "is", null)
    .limit(1);

  if (playerId) query = query.eq("player_id", playerId);

  const { data, error } = await query.maybeSingle();
  if (error || !data?.ai_review) return null;

  const aiReview = data.ai_review as Partial<EnhancedCoachReview>;
  const puzzle = data.puzzle && typeof data.puzzle === "object" ? data.puzzle : aiReview.puzzle;
  const provider = aiReview.provider === "gemini" ? "gemini" : "engine-lite";
  return {
    review: normalizeCoachReview({ ...aiReview, puzzle }, fallback, provider),
  };
}

async function saveEnhancedReview(gameId: string, playerId: string | undefined, review: EnhancedCoachReview) {
  const supabase = getServerSupabaseAdminClient();
  if (!supabase) return;

  const update = {
    provider: review.provider,
    summary: review.summary,
    biggestMistakeExplanation: review.biggestMistakeExplanation,
    betterMoveExplanation: review.betterMoveExplanation,
    trainingTips: review.trainingTips,
    phaseAdvice: review.phaseAdvice,
    trainingDrill: review.trainingDrill,
    shareHeadline: review.shareHeadline,
    puzzle: review.puzzle,
  };

  let query = supabase
    .from("reviews")
    .update({
      ai_review: update,
      puzzle: review.puzzle,
    })
    .eq("game_id", gameId);

  if (playerId) query = query.eq("player_id", playerId);

  await query;
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("No JSON object found");
  return trimmed.slice(first, last + 1);
}

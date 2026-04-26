import { AnalysisClient } from "@/app/analysis/[gameId]/AnalysisClient";

export default async function AnalysisPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return <AnalysisClient gameId={gameId} />;
}

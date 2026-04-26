"use client";

import { startTransition, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Chessboard = dynamic(
  () => import("react-chessboard").then((module) => module.Chessboard),
  {
    ssr: false,
    loading: () => <div className="aspect-square w-full animate-pulse rounded-[1.35rem] bg-white/[0.06]" />
  }
);

type ChessBoardPanelProps = {
  fen: string;
  onDrop?: (sourceSquare: string, targetSquare: string) => boolean;
  locked?: boolean;
};

export function ChessBoardPanel({ fen, onDrop, locked }: ChessBoardPanelProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  function handleSquareClick(square: string) {
    if (locked || !onDrop) return;

    if (!selectedSquare) {
      setSelectedSquare(square);
      return;
    }

    const moved = onDrop(selectedSquare, square);
    setSelectedSquare(moved ? null : square);
  }

  return (
    <div className="relative mx-auto w-full max-w-[min(86vw,620px)] rounded-[2rem] border border-white/10 bg-slate-950/60 p-3 shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle,rgba(118,247,203,0.18),transparent_62%)] blur-2xl" />
      {mounted ? (
        <Chessboard
          options={{
            position: fen,
            onPieceDrop: ({ sourceSquare, targetSquare }) => {
              if (!targetSquare || !onDrop) return false;
              const moved = onDrop(sourceSquare, targetSquare);
              if (moved) setSelectedSquare(null);
              return moved;
            },
            onPieceClick: ({ square }) => {
              if (!square) return;
              handleSquareClick(square);
            },
            onSquareClick: ({ square }) => handleSquareClick(square),
            allowDragging: !locked,
            squareStyles: selectedSquare
              ? {
                  [selectedSquare]: {
                    boxShadow: "inset 0 0 0 4px rgba(118,247,203,0.75)"
                  }
                }
              : {},
            boardStyle: {
              borderRadius: "1.35rem",
              overflow: "hidden",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)"
            },
            darkSquareStyle: { backgroundColor: "#315065" },
            lightSquareStyle: { backgroundColor: "#d7c49e" },
            animationDurationInMs: 180,
            showAnimations: true
          }}
        />
      ) : (
        <div className="aspect-square w-full animate-pulse rounded-[1.35rem] bg-white/[0.06]" />
      )}
    </div>
  );
}

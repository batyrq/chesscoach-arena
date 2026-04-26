"use client";

import { useState } from "react";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

const pieces: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟"
};

type ChessBoardPanelProps = {
  fen: string;
  onDrop?: (sourceSquare: string, targetSquare: string) => boolean;
  locked?: boolean;
};

export function ChessBoardPanel({ fen, onDrop, locked }: ChessBoardPanelProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const board = parseFenBoard(fen);

  function handleSquareClick(square: string, piece: string | null) {
    if (locked || !onDrop) return;

    if (!selectedSquare) {
      if (piece) setSelectedSquare(square);
      return;
    }

    const moved = onDrop(selectedSquare, square);
    setSelectedSquare(moved ? null : piece ? square : null);
  }

  return (
    <div className="relative mx-auto w-full max-w-[min(86vw,620px)] rounded-[2rem] border border-white/10 bg-slate-950/60 p-3 shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle,rgba(118,247,203,0.18),transparent_62%)] blur-2xl" />
      <div className="grid aspect-square overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950">
        {board.map((row, rowIndex) => row.map((piece, colIndex) => {
          const square = `${files[colIndex]}${ranks[rowIndex]}`;
          const light = (rowIndex + colIndex) % 2 === 0;
          const selected = selectedSquare === square;

          return (
            <button
              key={square}
              type="button"
              disabled={locked}
              onClick={() => handleSquareClick(square, piece)}
              className={`relative flex items-center justify-center text-[clamp(1.9rem,7vw,4.1rem)] leading-none transition duration-150 ${light ? "bg-[#d7c49e] text-slate-950" : "bg-[#315065] text-white"} ${selected ? "ring-4 ring-inset ring-[var(--mint)]" : ""} ${locked ? "cursor-default" : "hover:brightness-110 active:scale-[0.98]"}`}
              aria-label={`${square}${piece ? ` ${pieceName(piece)}` : ""}`}
            >
              {rowIndex === 7 ? <span className="absolute bottom-1 right-1 text-[0.6rem] font-bold uppercase text-slate-900/55">{files[colIndex]}</span> : null}
              {colIndex === 0 ? <span className="absolute left-1 top-1 text-[0.6rem] font-bold text-slate-900/55">{ranks[rowIndex]}</span> : null}
              <span className={piece && piece === piece.toLowerCase() ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]" : "drop-shadow-[0_2px_8px_rgba(255,255,255,0.18)]"}>
                {piece ? pieces[piece] : ""}
              </span>
            </button>
          );
        }))}
      </div>
    </div>
  );
}

function parseFenBoard(fen: string) {
  const placement = fen.split(" ")[0] ?? "8/8/8/8/8/8/8/8";
  return placement.split("/").map((rank) => {
    const row: Array<string | null> = [];

    for (const char of rank) {
      const emptySquares = Number(char);
      if (Number.isInteger(emptySquares)) {
        row.push(...Array.from<string | null>({ length: emptySquares }).fill(null));
      } else {
        row.push(char);
      }
    }

    return row.slice(0, 8);
  });
}

function pieceName(piece: string) {
  const color = piece === piece.toUpperCase() ? "White" : "Black";
  const name = {
    p: "pawn",
    n: "knight",
    b: "bishop",
    r: "rook",
    q: "queen",
    k: "king"
  }[piece.toLowerCase()] ?? "piece";

  return `${color} ${name}`;
}

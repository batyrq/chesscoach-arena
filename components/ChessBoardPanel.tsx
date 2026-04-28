"use client";

import { useState } from "react";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

const pieces: Record<string, string> = {
  K: "\u2654",
  Q: "\u2655",
  R: "\u2656",
  B: "\u2657",
  N: "\u2658",
  P: "\u2659",
  k: "\u265A",
  q: "\u265B",
  r: "\u265C",
  b: "\u265D",
  n: "\u265E",
  p: "\u265F"
};

type ChessBoardPanelProps = {
  fen: string;
  onDrop?: (sourceSquare: string, targetSquare: string) => boolean;
  locked?: boolean;
  orientation?: "white" | "black";
};

export function ChessBoardPanel({ fen, onDrop, locked, orientation = "white" }: ChessBoardPanelProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const board = orientBoard(parseFenBoard(fen), orientation);
  const displayFiles = orientation === "white" ? files : [...files].reverse();
  const displayRanks = orientation === "white" ? ranks : [...ranks].reverse();

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
      <div
        data-testid="chess-board"
        className="grid aspect-square grid-cols-8 grid-rows-8 overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950"
        style={{
          gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
          gridTemplateRows: "repeat(8, minmax(0, 1fr))"
        }}
      >
        {board.map((row, rowIndex) => row.map((piece, colIndex) => {
          const square = `${displayFiles[colIndex]}${displayRanks[rowIndex]}`;
          const light = (rowIndex + colIndex) % 2 === 0;
          const selected = selectedSquare === square;

          return (
            <button
              key={square}
              type="button"
              data-testid="chess-square"
              data-square={square}
              disabled={locked}
              onClick={() => handleSquareClick(square, piece)}
              className={`relative flex items-center justify-center text-[clamp(1.9rem,7vw,4.1rem)] leading-none transition duration-150 ${light ? "bg-[#d7c49e]" : "bg-[#315065]"} ${selected ? "ring-4 ring-inset ring-[var(--mint)]" : ""} ${locked ? "cursor-default" : "hover:brightness-110 active:scale-[0.98]"}`}
              aria-label={`${square}${piece ? ` ${pieceName(piece)}` : ""}`}
            >
              {rowIndex === 7 ? <span className={`absolute bottom-1 right-1 text-[0.6rem] font-bold uppercase ${light ? "text-slate-900/55" : "text-slate-100/55"}`}>{displayFiles[colIndex]}</span> : null}
              {colIndex === 0 ? <span className={`absolute left-1 top-1 text-[0.6rem] font-bold ${light ? "text-slate-900/55" : "text-slate-100/55"}`}>{displayRanks[rowIndex]}</span> : null}
              <span className={piece ? getPieceClass(piece) : ""}>
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
  const rows = placement.split("/").slice(0, 8).map((rank) => {
    const row: Array<string | null> = [];

    for (const char of rank) {
      if (/^[1-8]$/.test(char)) {
        const emptySquares = Number(char);
        row.push(...Array.from<string | null>({ length: emptySquares }).fill(null));
      } else {
        row.push(char);
      }
    }

    return [...row, ...Array.from<string | null>({ length: 8 }).fill(null)].slice(0, 8);
  });

  while (rows.length < 8) {
    rows.push(Array.from<string | null>({ length: 8 }).fill(null));
  }

  return rows;
}

function orientBoard(board: Array<Array<string | null>>, orientation: "white" | "black") {
  if (orientation === "white") return board;
  return board.map((row) => [...row].reverse()).reverse();
}

function getPieceClass(piece: string) {
  const isWhite = piece === piece.toUpperCase();
  return isWhite
    ? "text-slate-50 drop-shadow-[0_2px_1px_rgba(15,23,42,0.9)] [text-shadow:_0_0_2px_rgba(15,23,42,0.9)]"
    : "text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)] [text-shadow:_0_0_2px_rgba(255,255,255,0.45)]";
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

"use client";

import { useState } from "react";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

const pieces: Record<string, string> = {
  K: "\u265A",
  Q: "\u265B",
  R: "\u265C",
  B: "\u265D",
  N: "\u265E",
  P: "\u265F",
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
    <div className="relative mx-auto w-full max-w-[min(88vw,620px)] rounded-2xl border border-white/10 bg-stone-950/70 p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
      <div
        data-testid="chess-board"
        className="grid aspect-square grid-cols-8 grid-rows-8 overflow-hidden rounded-xl border border-black/40 bg-stone-950"
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
              className={`relative flex items-center justify-center text-[clamp(2rem,7vw,4.25rem)] leading-none transition duration-150 ${light ? "bg-[var(--board-light)]" : "bg-[var(--board-dark)]"} ${selected ? "ring-4 ring-inset ring-[var(--gold)]" : ""} ${locked ? "cursor-default" : "hover:brightness-105 active:scale-[0.98]"}`}
              aria-label={`${square}${piece ? ` ${pieceName(piece)}` : ""}`}
            >
              {rowIndex === 7 ? <span className={`pointer-events-none absolute bottom-1 right-1 text-[0.58rem] font-semibold uppercase ${light ? "text-stone-800/55" : "text-stone-50/60"}`}>{displayFiles[colIndex]}</span> : null}
              {colIndex === 0 ? <span className={`pointer-events-none absolute left-1 top-1 text-[0.58rem] font-semibold ${light ? "text-stone-800/55" : "text-stone-50/60"}`}>{displayRanks[rowIndex]}</span> : null}
              <span
                data-piece-color={piece ? getPieceColor(piece) : undefined}
                className={piece ? getPieceClass(piece) : ""}
                style={piece ? getPieceStyle(piece) : undefined}
              >
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
  return piece === piece.toUpperCase()
    ? "select-none font-serif text-[#f8f4e8] drop-shadow-[0_2px_1px_rgba(33,22,14,0.9)]"
    : "select-none font-serif text-[#17120d] drop-shadow-[0_1px_1px_rgba(255,244,214,0.6)]";
}

function getPieceStyle(piece: string) {
  return piece === piece.toUpperCase()
    ? { color: "#f8f4e8", WebkitTextStroke: "0.6px rgba(32, 24, 16, 0.8)", textShadow: "0 1px 2px rgba(0,0,0,0.85)" }
    : { color: "#17120d", WebkitTextStroke: "0.35px rgba(255, 244, 214, 0.62)", textShadow: "0 1px 1px rgba(255,255,255,0.45)" };
}

function getPieceColor(piece: string) {
  return piece === piece.toUpperCase() ? "white" : "black";
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

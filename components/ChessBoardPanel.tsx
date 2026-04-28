"use client";

import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

type ChessBoardPanelProps = {
  fen: string;
  onDrop?: (sourceSquare: string, targetSquare: string) => boolean;
  onSquareClick?: (square: string, piece: string | null) => void;
  locked?: boolean;
  orientation?: "white" | "black";
  lastMove?: { from: string; to: string } | null;
  selectedSquares?: string[];
  correctSquares?: string[];
  incorrectSquares?: string[];
};

export function ChessBoardPanel({ fen, onDrop, onSquareClick, locked, orientation = "white", lastMove, selectedSquares = [], correctSquares = [], incorrectSquares = [] }: ChessBoardPanelProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const board = orientBoard(parseFenBoard(fen), orientation);
  const displayFiles = orientation === "white" ? files : [...files].reverse();
  const displayRanks = orientation === "white" ? ranks : [...ranks].reverse();
  const legalTargets = useMemo(() => {
    if (!selectedSquare || locked) return new Set<string>();
    try {
      const chess = new Chess(fen);
      return new Set(chess.moves({ square: selectedSquare as Square, verbose: true }).map((move) => move.to));
    } catch {
      return new Set<string>();
    }
  }, [fen, locked, selectedSquare]);

  function handleSquareClick(square: string, piece: string | null) {
    onSquareClick?.(square, piece);
    if (locked || !onDrop) return;

    if (!selectedSquare) {
      if (piece) setSelectedSquare(square);
      return;
    }

    const moved = onDrop(selectedSquare, square);
    setSelectedSquare(moved ? null : piece ? square : null);
  }

  return (
    <div className="relative mx-auto w-full max-w-[min(92vw,660px)] rounded-xl border border-black/45 bg-[#2a2119] p-1.5 shadow-[0_18px_38px_rgba(0,0,0,0.32)] sm:p-2">
      <div
        data-testid="chess-board"
        className="grid aspect-square grid-cols-8 grid-rows-8 overflow-hidden rounded-lg border border-black/55 bg-stone-950"
        style={{
          gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
          gridTemplateRows: "repeat(8, minmax(0, 1fr))"
        }}
      >
        {board.map((row, rowIndex) => row.map((piece, colIndex) => {
          const square = `${displayFiles[colIndex]}${displayRanks[rowIndex]}`;
          const light = (rowIndex + colIndex) % 2 === 0;
          const selected = selectedSquare === square;
          const quizSelected = selectedSquares.includes(square);
          const quizCorrect = correctSquares.includes(square);
          const quizIncorrect = incorrectSquares.includes(square);
          const last = lastMove?.from === square || lastMove?.to === square;
          const legal = legalTargets.has(square);

          return (
            <button
              key={square}
              type="button"
              data-testid="chess-square"
              data-square={square}
              data-piece-code={piece ? getPieceCode(piece) : undefined}
              data-piece-color={piece ? getPieceColor(piece) : undefined}
              disabled={locked && !onSquareClick}
              onClick={() => handleSquareClick(square, piece)}
              className={`relative flex items-center justify-center leading-none transition duration-150 ${light ? "bg-[var(--board-light)]" : "bg-[var(--board-dark)]"} ${selected || quizSelected ? "ring-4 ring-inset ring-[var(--board-select)]" : ""} ${quizCorrect ? "ring-4 ring-inset ring-[var(--mint-strong)]" : ""} ${quizIncorrect ? "ring-4 ring-inset ring-[var(--coral)]" : ""} ${locked && !onSquareClick ? "cursor-default" : "hover:brightness-105 active:scale-[0.99]"}`}
              aria-label={`${square}${piece ? ` ${pieceName(piece)}` : ""}`}
            >
              {last ? <span className="pointer-events-none absolute inset-0 bg-[var(--board-last)] mix-blend-multiply" /> : null}
              {legal ? <span className={`pointer-events-none absolute rounded-full ${piece ? "inset-[16%] border-[4px] border-black/28" : "h-[22%] w-[22%] bg-black/25 shadow-[0_0_0_2px_rgba(255,255,255,0.12)]"}`} /> : null}
              {rowIndex === 7 ? <span className={`pointer-events-none absolute bottom-0.5 right-1 z-10 text-[0.58rem] font-bold ${light ? "text-stone-800/50" : "text-stone-50/62"}`}>{displayFiles[colIndex]}</span> : null}
              {colIndex === 0 ? <span className={`pointer-events-none absolute left-1 top-0.5 z-10 text-[0.58rem] font-bold ${light ? "text-stone-800/50" : "text-stone-50/62"}`}>{displayRanks[rowIndex]}</span> : null}
              {piece ? <PieceSvg piece={piece} /> : null}
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

function getPieceColor(piece: string) {
  return piece === piece.toUpperCase() ? "white" : "black";
}

function getPieceCode(piece: string) {
  return `${getPieceColor(piece) === "white" ? "w" : "b"}${piece.toUpperCase()}`;
}

function PieceSvg({ piece }: { piece: string }) {
  const color = getPieceColor(piece);
  const type = piece.toLowerCase();
  const fill = color === "white" ? "#fff3dc" : "#171513";
  const stroke = color === "white" ? "#443626" : "#3a3027";
  const accent = color === "white" ? "#f8e5bd" : "#2f2924";
  const highlight = color === "white" ? "#fffaf0" : "#29251f";
  const strokeWidth = color === "white" ? 3.4 : 2.1;

  return (
    <svg
      aria-hidden="true"
      data-piece-code={getPieceCode(piece)}
      data-piece-color={color}
      viewBox="0 0 100 100"
      className="pointer-events-none z-10 h-[90%] w-[90%] select-none"
      style={{ filter: color === "white" ? "drop-shadow(0 3px 2px rgba(35, 24, 16, 0.58))" : "drop-shadow(0 1px 0 rgba(255, 233, 188, 0.16)) drop-shadow(0 4px 3px rgba(0,0,0,0.42))" }}
    >
      <g fill={fill} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>
        <path d="M22 86h56l-4.5-10.5h-47z" />
        <path d="M30 75.5h40l-3.2-9.5H33.2z" />
        {type === "p" ? <Pawn /> : null}
        {type === "r" ? <Rook /> : null}
        {type === "n" ? <Knight accent={accent} highlight={highlight} /> : null}
        {type === "b" ? <Bishop accent={accent} highlight={highlight} /> : null}
        {type === "q" ? <Queen accent={accent} highlight={highlight} /> : null}
        {type === "k" ? <King highlight={highlight} /> : null}
      </g>
    </svg>
  );
}

function Pawn() {
  return (
    <>
      <circle cx="50" cy="29" r="12.2" />
      <path d="M37 66c1.7-14.5 6-23.5 13-23.5S61.3 51.5 63 66z" />
    </>
  );
}

function Rook() {
  return (
    <>
      <path d="M27 21h12v9h8v-9h8v9h8v-9h10v20H27z" />
      <path d="M32 66h36l-5-25H37z" />
    </>
  );
}

function Knight({ accent, highlight }: { accent: string; highlight: string }) {
  return (
    <>
      <path d="M30 66c2.6-15.5 9.5-30.5 24-45 8.8 4.2 16.8 14 19 28.5l-9.8 8.7-12.5-8.8-6.2 16.6z" />
      <path d="M43 35c5 1.2 9.6 0 14-4.3" fill="none" stroke={highlight} strokeWidth="2.2" />
      <circle cx="56" cy="35" r="2.4" fill={accent} stroke="none" />
    </>
  );
}

function Bishop({ accent, highlight }: { accent: string; highlight: string }) {
  return (
    <>
      <path d="M37 66c1.2-15.5 6.2-25.8 13-34.5 6.8 8.7 11.8 19 13 34.5z" />
      <circle cx="50" cy="24" r="10.5" />
      <path d="M50 17.5v29" stroke={accent} strokeWidth="2.5" />
      <path d="M43.5 54h13" stroke={highlight} strokeWidth="2" />
    </>
  );
}

function Queen({ accent, highlight }: { accent: string; highlight: string }) {
  return (
    <>
      <circle cx="27" cy="30" r="5.8" />
      <circle cx="42" cy="21" r="5.8" />
      <circle cx="58" cy="21" r="5.8" />
      <circle cx="73" cy="30" r="5.8" />
      <path d="M30 66l-5.2-29.5 17.5 13.8L50 25.5l7.7 24.8 17.5-13.8L70 66z" />
      <path d="M38 57.5h24" stroke={accent} strokeWidth="2.4" />
      <path d="M41 50l9-24.5 9 24.5" fill="none" stroke={highlight} strokeWidth="1.8" />
    </>
  );
}

function King({ highlight }: { highlight: string }) {
  return (
    <>
      <path d="M50 16v19M40.5 25.5h19" />
      <circle cx="50" cy="42.5" r="12.2" />
      <path d="M35 66c1.9-12.8 7.3-21.2 15-21.2S63.1 53.2 65 66z" />
      <path d="M43 55.5h14" stroke={highlight} strokeWidth="2" />
    </>
  );
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

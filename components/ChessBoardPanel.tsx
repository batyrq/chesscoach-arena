"use client";

import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

type ChessBoardPanelProps = {
  fen: string;
  onDrop?: (sourceSquare: string, targetSquare: string) => boolean;
  locked?: boolean;
  orientation?: "white" | "black";
  lastMove?: { from: string; to: string } | null;
};

export function ChessBoardPanel({ fen, onDrop, locked, orientation = "white", lastMove }: ChessBoardPanelProps) {
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
    if (locked || !onDrop) return;

    if (!selectedSquare) {
      if (piece) setSelectedSquare(square);
      return;
    }

    const moved = onDrop(selectedSquare, square);
    setSelectedSquare(moved ? null : piece ? square : null);
  }

  return (
    <div className="relative mx-auto w-full max-w-[min(92vw,660px)] rounded-xl border border-black/45 bg-[#2a2119] p-2 shadow-[0_22px_46px_rgba(0,0,0,0.34)]">
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
          const last = lastMove?.from === square || lastMove?.to === square;
          const legal = legalTargets.has(square);

          return (
            <button
              key={square}
              type="button"
              data-testid="chess-square"
              data-square={square}
              disabled={locked}
              onClick={() => handleSquareClick(square, piece)}
              className={`relative flex items-center justify-center leading-none transition duration-150 ${light ? "bg-[var(--board-light)]" : "bg-[var(--board-dark)]"} ${selected ? "ring-4 ring-inset ring-[#f0c15f]" : ""} ${locked ? "cursor-default" : "hover:brightness-105 active:scale-[0.99]"}`}
              aria-label={`${square}${piece ? ` ${pieceName(piece)}` : ""}`}
            >
              {last ? <span className="pointer-events-none absolute inset-0 bg-[var(--board-last)] mix-blend-multiply" /> : null}
              {legal ? <span className={`pointer-events-none absolute rounded-full ${piece ? "inset-[18%] border-[5px] border-black/25" : "h-[24%] w-[24%] bg-black/24"}`} /> : null}
              {rowIndex === 7 ? <span className={`pointer-events-none absolute bottom-1 right-1 z-10 text-[0.62rem] font-bold uppercase ${light ? "text-stone-800/55" : "text-stone-50/65"}`}>{displayFiles[colIndex]}</span> : null}
              {colIndex === 0 ? <span className={`pointer-events-none absolute left-1 top-1 z-10 text-[0.62rem] font-bold ${light ? "text-stone-800/55" : "text-stone-50/65"}`}>{displayRanks[rowIndex]}</span> : null}
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
  const fill = color === "white" ? "#fff6e5" : "#151515";
  const stroke = color === "white" ? "#4f4030" : "#ead7b4";
  const accent = color === "white" ? "#fffdf5" : "#2d2d2d";

  return (
    <svg
      aria-hidden="true"
      data-piece-code={getPieceCode(piece)}
      data-piece-color={color}
      viewBox="0 0 100 100"
      className="pointer-events-none z-10 h-[82%] w-[82%] select-none"
      style={{ filter: color === "white" ? "drop-shadow(0 3px 2px rgba(36, 24, 15, 0.65))" : "drop-shadow(0 2px 1px rgba(255, 239, 206, 0.36)) drop-shadow(0 4px 3px rgba(0,0,0,0.35))" }}
    >
      <g fill={fill} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5">
        <path d="M24 86h52l-4-12H28z" />
        <path d="M31 74h38l-3-10H34z" />
        {type === "p" ? <Pawn /> : null}
        {type === "r" ? <Rook /> : null}
        {type === "n" ? <Knight accent={accent} /> : null}
        {type === "b" ? <Bishop accent={accent} /> : null}
        {type === "q" ? <Queen accent={accent} /> : null}
        {type === "k" ? <King /> : null}
      </g>
    </svg>
  );
}

function Pawn() {
  return (
    <>
      <circle cx="50" cy="30" r="12" />
      <path d="M38 64c2-14 5-22 12-22s10 8 12 22z" />
    </>
  );
}

function Rook() {
  return (
    <>
      <path d="M30 22h10v9h10v-9h10v9h10v-9h6v19H24V22z" />
      <path d="M31 64h38l-5-24H36z" />
    </>
  );
}

function Knight({ accent }: { accent: string }) {
  return (
    <>
      <path d="M31 65c4-17 10-29 24-43 9 6 16 16 18 30l-9 6-12-9-7 16z" />
      <circle cx="55" cy="34" r="2.7" fill={accent} stroke="none" />
    </>
  );
}

function Bishop({ accent }: { accent: string }) {
  return (
    <>
      <path d="M38 64c1-14 6-24 12-32 6 8 11 18 12 32z" />
      <circle cx="50" cy="24" r="10" />
      <path d="M50 18v28" stroke={accent} strokeWidth="3" />
    </>
  );
}

function Queen({ accent }: { accent: string }) {
  return (
    <>
      <circle cx="28" cy="30" r="6" />
      <circle cx="42" cy="21" r="6" />
      <circle cx="58" cy="21" r="6" />
      <circle cx="72" cy="30" r="6" />
      <path d="M31 64l-6-27 17 13 8-24 8 24 17-13-6 27z" />
      <path d="M38 57h24" stroke={accent} strokeWidth="3" />
    </>
  );
}

function King() {
  return (
    <>
      <path d="M50 17v19M40 27h20" />
      <circle cx="50" cy="43" r="12" />
      <path d="M36 64c2-12 7-20 14-20s12 8 14 20z" />
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

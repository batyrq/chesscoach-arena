"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chess, type Move as ChessMove } from "chess.js";
import { Activity, Flag, Handshake, RotateCcw, Search, Swords, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { GameStatusBanner } from "@/components/GameStatusBanner";
import { MoveHistory } from "@/components/MoveHistory";
import { PlayerCard } from "@/components/PlayerCard";
import { ShareRoomButton } from "@/components/ShareRoomButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBrowserTabToken, getOrCreateRoomPlayerId, loadProfile, saveGameReview, saveProfile, saveRoomPlayerId } from "@/lib/storage";
import { createMultiplayerAdapter } from "@/lib/multiplayer";
import { botProfiles, chooseBotMove, getTimeControl, type BotLevel } from "@/lib/chess-play";
import { localizeMode, useI18n } from "@/lib/i18n";
import type { City, Move, MultiplayerRoomState, Player, RoomRole } from "@/lib/types";

export function GameClient({ roomId }: { roomId: string }) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const timeControl = useMemo(() => getTimeControl(searchParams.get("tc")), [searchParams]);
  const botLevel = (searchParams.get("bot") as BotLevel | null) ?? "club";
  const selectedColor = searchParams.get("color") ?? "white";
  const userColor = selectedColor === "black" || (selectedColor === "random" && roomId.length % 2 === 0) ? "black" : "white";
  const isBotGame = isBotRoom(roomId);
  const [game, setGame] = useState(() => new Chess());
  const [moves, setMoves] = useState<Move[]>([]);
  const [whiteClock, setWhiteClock] = useState(timeControl.initialSeconds);
  const [blackClock, setBlackClock] = useState(timeControl.initialSeconds);
  const [ended, setEnded] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [profile, setProfile] = useState<{ name: string; city: City }>({ name: "Guest Gambiteer", city: "Almaty" });
  const [profileReady, setProfileReady] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [roomState, setRoomState] = useState<MultiplayerRoomState | null>(null);
  const [roomRole, setRoomRole] = useState<RoomRole>("spectator");
  const [, setRealtimeMode] = useState<"local" | "supabase">("local");
  const [moveError, setMoveError] = useState("");
  const isLocalGame = isLocalRoom(roomId) || isBotGame;
  const adapter = useMemo(() => createMultiplayerAdapter(), []);
  const botMoveInFlightRef = useRef(false);
  const latestGameRef = useRef(game);
  const applyIncrement = useCallback((color: "w" | "b") => {
    if (!timeControl.incrementSeconds) return;
    if (color === "w") setWhiteClock((value) => value + timeControl.incrementSeconds);
    else setBlackClock((value) => value + timeControl.incrementSeconds);
  }, [timeControl.incrementSeconds]);

  useEffect(() => {
    const storedProfile = loadProfile();
    const nextPlayerId = getOrCreateRoomPlayerId(roomId);
    if (!storedProfile) {
      saveProfile({ name: "Guest Gambiteer", city: "Almaty" });
      startTransition(() => {
        setPlayerId(nextPlayerId);
        setProfileReady(true);
      });
      return;
    }

    startTransition(() => {
      setPlayerId(nextPlayerId);
      setProfile(storedProfile);
      setProfileReady(true);
    });
  }, [roomId]);

  useEffect(() => {
    if (isLocalGame || !profileReady || !playerId) return;

    let cancelled = false;
    adapter.joinRoom(roomId, profile, playerId, getBrowserTabToken()).then((result) => {
      if (cancelled) return;
      saveRoomPlayerId(roomId, result.playerId);
      startTransition(() => {
        setPlayerId(result.playerId);
        setRoomState(result.state);
        setRoomRole(result.role);
        setRealtimeMode(result.mode);
      });
    });

    const unsubscribe = adapter.subscribe(roomId, (state) => {
      startTransition(() => setRoomState((current) => current && current.version > state.version ? current : state));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [adapter, isLocalGame, playerId, profile, profileReady, roomId]);

  useEffect(() => {
    if (!roomState || isLocalGame) return;

    startTransition(() => {
      setGame(new Chess(roomState.fen));
      setMoves(roomState.moves);
      setEnded(roomState.status === "ended" || roomState.status === "draw" || roomState.status === "checkmate");
    });
  }, [isLocalGame, roomState]);

  useEffect(() => {
    latestGameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (ended || game.isGameOver() || (!isLocalGame && (roomRole === "spectator" || roomState?.status !== "active"))) return;
    const timer = window.setInterval(() => {
      if (game.turn() === "w") {
        setWhiteClock((value) => {
          const next = Math.max(0, value - 1);
          if (next === 0) setEnded(true);
          return next;
        });
      } else {
        setBlackClock((value) => {
          const next = Math.max(0, value - 1);
          if (next === 0) setEnded(true);
          return next;
        });
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [ended, game, isLocalGame, roomRole, roomState?.status]);

  useEffect(() => {
    if (!isBotGame || ended || game.isGameOver()) return;
    const botColor = userColor === "white" ? "b" : "w";
    if (game.turn() !== botColor) return;
    if (botMoveInFlightRef.current) return;

    botMoveInFlightRef.current = true;
    setBotThinking(true);
    const timer = window.setTimeout(() => {
      try {
        const current = latestGameRef.current;
        const next = new Chess(current.fen());
        if (next.turn() !== botColor || next.isGameOver()) return;

        const move = chooseBotMove(next, botLevel);
        if (!move) return;

        const made = next.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" });
        const nextMove = toMoveRecord(made, next);
        startTransition(() => {
          setGame(next);
          setMoves((currentMoves) => [...currentMoves, nextMove]);
          applyIncrement(made.color);
          setEnded(next.isGameOver());
        });
      } catch {
        setMoveError(locale === "ru" ? "Бот сделал паузу. Сделайте еще один ход, чтобы продолжить." : "Training Bot paused. Make another move to continue.");
      } finally {
        botMoveInFlightRef.current = false;
        setBotThinking(false);
      }
    }, 550 + (moves.length % 3) * 140);

    return () => {
      window.clearTimeout(timer);
      botMoveInFlightRef.current = false;
    };
  }, [applyIncrement, botLevel, ended, game, isBotGame, locale, moves.length, userColor]);

  const players: [Player, Player] = useMemo(() => [
    toDisplayPlayer(roomState, "white", profile, isLocalGame, isBotGame, userColor, botLevel),
    toDisplayPlayer(roomState, "black", profile, isLocalGame, isBotGame, userColor, botLevel)
  ], [botLevel, isBotGame, isLocalGame, profile, roomState, userColor]);

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (ended) return false;
    setMoveError("");

    if (!isLocalGame) {
      void submitMultiplayerMove(sourceSquare, targetSquare);
      return false;
    }

    const next = new Chess();
    const pgn = game.pgn();
    if (pgn) next.loadPgn(pgn);

    let move: ChessMove | null = null;
    try {
      move = next.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    } catch {
      return false;
    }

    if (!move) return false;

    setGame(next);
    setMoves((current) => [...current, toMoveRecord(move, next)]);
    applyIncrement(move.color);
    if (next.isGameOver()) setEnded(true);
    return true;
  }

  async function submitMultiplayerMove(sourceSquare: string, targetSquare: string) {
    if (!playerId) return;
    const result = await adapter.submitMove(roomId, playerId, sourceSquare, targetSquare);
    if (!result.ok) {
      setMoveError(result.reason ?? (locale === "ru" ? "Ход отклонен." : "Move was rejected."));
      return;
    }

    if (result.state) setRoomState(result.state);
  }

  function resetGame() {
    if (!isLocalGame) return;
    setGame(new Chess());
    setMoves([]);
    setWhiteClock(timeControl.initialSeconds);
    setBlackClock(timeControl.initialSeconds);
    setEnded(false);
    setBotThinking(false);
  }

  function saveAndReview() {
    const gameId = `${roomId}-${Date.now()}`;
    saveGameReview(gameId, {
      pgn: roomState?.pgn ?? game.pgn(),
      fen: roomState?.fen ?? game.fen(),
      moves: roomState?.moves ?? moves,
      result: roomState?.result ?? getReviewResult(game),
      roomId,
      mode: isBotGame ? "Training Bot" : isLocalRoom(roomId) ? "Same Device" : "Friend Room",
      timeControl: timeControl.label
    });
    window.location.href = `/analysis/${gameId}`;
  }

  function playCoachStarter() {
    const starters = [
      ["e2", "e4"],
      ["e7", "e5"],
      ["g1", "f3"],
      ["b8", "c6"],
      ["f1", "c4"],
      ["f8", "c5"]
    ] as const;
    const starter = starters[moves.length % starters.length];
    onDrop(starter[0], starter[1]);
  }

  async function endCurrentRoom(status: "ended" | "draw") {
    if (isLocalGame) {
      setEnded(true);
      return;
    }

    if (!playerId) return;
    const result = await adapter.endRoom(roomId, playerId, status);
    if (!result.ok) setMoveError(result.reason ?? (locale === "ru" ? "Не удалось завершить партию." : "Could not update the game."));
  }

  const status = getStatus(game, ended, whiteClock, blackClock, roomId, isLocalGame, isBotGame, roomState, roomRole, botThinking, userColor, t, locale);
  const intense = game.inCheck() || game.isCheckmate() || whiteClock === 0 || blackClock === 0;
  const turnPlayer = game.turn() === "w" ? players[0] : players[1];
  const canMove = isBotGame ? !botThinking && ((userColor === "white" && game.turn() === "w") || (userColor === "black" && game.turn() === "b")) : isLocalGame || canCurrentTabMove(roomState, roomRole, game.turn());
  const roleLabel = isBotGame ? `${t("trainingBot")} / ${userColor === "white" ? t("white") : t("black")}` : isLocalRoom(roomId) ? t("sameDevice") : roomRole === "spectator" ? t("spectatorMode") : `${roomRole === "white" ? t("white") : t("black")}`;
  const boardOrientation = isBotGame ? userColor : roomRole === "black" ? "black" : "white";

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-16 md:px-8 xl:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">{isLocalGame ? roleLabel : `${t("friendRoom")} ${roomId}`}</p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em]">{t("practiceGame")}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">{roleLabel}</span>
                <span className="rounded-full border border-[var(--mint)]/20 bg-[rgba(129,169,105,0.12)] px-3 py-1">{localizeMode(timeControl.mode, t)}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">{timeControl.label}</span>
                {!isLocalGame ? <span className="rounded-full border border-[var(--mint)]/20 bg-[rgba(129,169,105,0.12)] px-3 py-1">{t("friendRoom")}</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ShareRoomButton roomId={roomId} />
              <Button onClick={saveAndReview}>
                <Search className="h-4 w-4" /> {t("analyzeGame")}
              </Button>
            </div>
          </div>
          <GameStatusBanner status={status} intense={intense} />
          {moveError ? <GameStatusBanner status={moveError} intense /> : null}
          <ArenaHud white={players[0]} black={players[1]} turnName={turnPlayer.name} moves={moves.length} roomId={roomId} onCoachStarter={playCoachStarter} canUseStarter={(isLocalRoom(roomId) || canMove) && !isBotGame} roleLabel={roleLabel} botThinking={botThinking} />
          <ChessBoardPanel fen={game.fen()} onDrop={onDrop} locked={ended || game.isGameOver() || !canMove} orientation={boardOrientation} lastMove={moves.at(-1) ?? null} />
        </section>
        <aside className="space-y-4">
          <PlayerCard player={players[1]} active={game.turn() === "b" && !ended} clockSeconds={blackClock} statusLabel={getPlayerStatus(roomState, "black", isLocalGame, isBotGame, userColor, t)} />
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[var(--font-display)] text-xl font-bold">{t("scoreSheet")}</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{moves.length}</span>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/45 px-3 py-1"><Timer className="h-3.5 w-3.5 text-[var(--mint)]" /> {timeControl.label}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/45 px-3 py-1"><Swords className="h-3.5 w-3.5 text-[var(--gold)]" /> {localizeMode(timeControl.mode, t)}</span>
            </div>
            <MoveHistory moves={moves} />
            <GameStats moves={moves} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" onClick={() => void endCurrentRoom("ended")}>
                <Flag className="h-3.5 w-3.5" /> {t("resign")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void endCurrentRoom("draw")}>
                <Handshake className="h-3.5 w-3.5" /> {t("draw")}
              </Button>
              <Button variant="secondary" size="sm" onClick={resetGame} disabled={!isLocalGame}>
                <RotateCcw className="h-3.5 w-3.5" /> {t("newGame")}
              </Button>
            </div>
            {ended || game.isGameOver() ? (
              <Button className="mt-3 w-full" onClick={saveAndReview}>
                <Search className="h-4 w-4" /> {t("gameReview")}
              </Button>
            ) : null}
          </Card>
          <PlayerCard player={players[0]} active={game.turn() === "w" && !ended} clockSeconds={whiteClock} statusLabel={getPlayerStatus(roomState, "white", isLocalGame, isBotGame, userColor, t)} />
          <Link href="/leaderboard" className="block rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300 transition hover:bg-white/[0.09]">
            {locale === "ru" ? "Откройте разбор партии, чтобы обновить рейтинг. Войдите, чтобы сохранить прогресс." : "Open Game Review to update your ranking. Sign in to keep progress across devices."}
          </Link>
        </aside>
      </main>
    </AppShell>
  );
}

function toMoveRecord(move: ChessMove, chess: Chess): Move {
  return {
    san: move.san,
    from: move.from,
    to: move.to,
    color: move.color,
    fenAfter: chess.fen(),
    moveNumber: Math.ceil(chess.history().length / 2),
    flags: move.flags,
    captured: move.captured
  };
}

function getReviewResult(game: Chess) {
  if (game.isCheckmate()) return game.turn() === "w" ? "0-1" : "1-0";
  if (game.isDraw()) return "1/2-1/2";
  return "*" as const;
}

function ArenaHud({ white, black, turnName, moves, roomId, onCoachStarter, canUseStarter, roleLabel, botThinking }: { white: Player; black: Player; turnName: string; moves: number; roomId: string; onCoachStarter: () => void; canUseStarter: boolean; roleLabel: string; botThinking: boolean }) {
  const { t, locale } = useI18n();
  const centerLabel = isBotRoom(roomId) ? t("trainingBot") : !isLocalRoom(roomId) ? t("friendRoom") : roleLabel;

  return (
    <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <MiniPlayer label={t("white")} player={white} active={turnName === white.name} />
      <div className="rounded-[1.25rem] bg-slate-950/55 px-4 py-3 text-center">
        <p className="text-[0.68rem] tracking-[0.12em] text-slate-500">{t("play")}</p>
        <p className="mt-1 text-sm font-semibold text-white">
          {botThinking ? t("botThinking") : moves === 0 ? t("whiteToMove") : locale === "ru" ? `Ходит ${turnName}` : `${turnName}'s turn`}
        </p>
        <p className="mt-1 text-xs text-[var(--gold)]">{centerLabel}</p>
        {moves < 6 && canUseStarter ? (
          <button
            type="button"
            onClick={onCoachStarter}
            className="mt-3 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
          >
            {t("startTraining")}
          </button>
        ) : null}
      </div>
      <MiniPlayer label={t("black")} player={black} active={turnName === black.name} />
    </div>
  );
}

function MiniPlayer({ label, player, active }: { label: string; player: Player; active: boolean }) {
  return (
    <div className={`rounded-[1.25rem] border p-3 ${active ? "border-[var(--mint)]/50 bg-[rgba(118,247,203,0.08)]" : "border-white/10 bg-slate-950/35"}`}>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold">{player.name}</p>
      <p className="mt-1 text-xs text-slate-400">{player.city} / {player.rating}</p>
    </div>
  );
}

function GameStats({ moves }: { moves: Move[] }) {
  const { t } = useI18n();
  const captures = moves.filter((move) => move.captured);
  const checks = moves.filter((move) => move.san.includes("+") || move.san.includes("#"));
  const whiteCaptures = captures.filter((move) => move.color === "w").length;
  const blackCaptures = captures.filter((move) => move.color === "b").length;

  return (
    <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Activity className="h-4 w-4 text-[var(--mint)]" /> {t("matchPulse")}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label={t("captures")} value={`${whiteCaptures}-${blackCaptures}`} />
        <Stat label={t("checks")} value={checks.length.toString()} />
        <Stat label={t("phase")} value={moves.length < 10 ? t("opening") : moves.length < 32 ? t("middlegame") : t("endgame")} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/45 p-3">
      <p className="font-[var(--font-display)] text-lg font-bold">{value}</p>
      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function getStatus(game: Chess, ended: boolean, whiteClock: number, blackClock: number, roomId: string, isLocalGame: boolean, isBotGame: boolean, roomState: MultiplayerRoomState | null, roomRole: RoomRole, botThinking: boolean, userColor: "white" | "black", t: ReturnType<typeof useI18n>["t"], locale: string) {
  const ru = locale === "ru";
  if (whiteClock === 0) return ru ? "Черные выиграли по времени. Откройте разбор партии." : "Black wins on time. Open Game Review.";
  if (blackClock === 0) return ru ? "Белые выиграли по времени. Откройте разбор партии." : "White wins on time. Open Game Review.";
  if (ended) return ru ? "Партия завершена. Откройте разбор партии." : "Game ended. Open Game Review.";
  if (isBotGame && botThinking) return t("botThinking");
  if (isBotGame) return game.turn() === (userColor === "white" ? "w" : "b") ? t("yourMove") : t("opponentsMove");
  if (!isLocalGame && roomRole === "spectator") return t("spectatorMode");
  if (!isLocalGame && roomState?.status === "waiting") return t("waitingOpponent");
  if (game.isCheckmate()) return game.turn() === "w" ? (ru ? "Черные выиграли матом." : "Black wins by checkmate.") : (ru ? "Белые выиграли матом." : "White wins by checkmate.");
  if (game.isDraw()) return ru ? "Ничья. Можно разобрать упущенные шансы." : "Draw. Review the missed chances.";
  if (game.inCheck()) return game.turn() === "w" ? (ru ? "Белые под шахом." : "White is in check.") : (ru ? "Черные под шахом." : "Black is in check.");
  if (!isLocalGame) return game.turn() === "w" ? t("whiteToMove") : t("blackToMove");
  return game.turn() === "w" ? t("whiteToMove") : t("blackToMove");
}

function isLocalRoom(roomId: string) {
  const normalized = roomId.toLowerCase();
  return normalized === "local" || normalized.startsWith("local-");
}

function isBotRoom(roomId: string) {
  const normalized = roomId.toLowerCase();
  return normalized === "bot" || normalized.startsWith("bot-");
}

function toDisplayPlayer(roomState: MultiplayerRoomState | null, role: "white" | "black", profile: { name: string; city: City }, isLocalGame: boolean | undefined, isBotGame: boolean, userColor: "white" | "black", botLevel: BotLevel): Player {
  const roomPlayer = roomState?.players.find((player) => player.role === role);
  if (roomPlayer) {
    return {
      id: roomPlayer.id,
      name: roomPlayer.name,
      city: roomPlayer.city,
      rating: roomPlayer.rating,
      color: role,
      isPro: role === "white"
    };
  }

  if (isBotGame && role !== userColor) {
    const bot = botProfiles[botLevel] ?? botProfiles.club;
    return { id: `bot-${botLevel}`, name: bot.name, city: profile.city, rating: bot.rating, color: role };
  }

  if (isBotGame && role === userColor) {
    return { id: "local", name: profile.name, city: profile.city, rating: 1420, color: role, isPro: true };
  }

  if (role === "white") {
    return { id: "local", name: profile.name, city: profile.city, rating: 1420, color: "white", isPro: true };
  }

  return { id: "friend", name: isLocalGame ? "Practice Rival" : "Waiting Friend", city: profile.city, rating: 1390, color: "black" };
}

function canCurrentTabMove(roomState: MultiplayerRoomState | null, role: RoomRole, turn: "w" | "b") {
  if (!roomState || roomState.status !== "active") return false;
  if (!roomState.players.some((player) => player.role === "white") || !roomState.players.some((player) => player.role === "black")) return false;
  return (role === "white" && turn === "w") || (role === "black" && turn === "b");
}

function getPlayerStatus(roomState: MultiplayerRoomState | null, role: "white" | "black", isLocalGame: boolean, isBotGame: boolean, userColor: "white" | "black", t: ReturnType<typeof useI18n>["t"]) {
  if (isBotGame) return role === userColor ? t("yourMove") : t("trainingBot");
  if (isLocalGame) return t("sameDevice");
  const player = roomState?.players.find((item) => item.role === role);
  if (!player) return t("waitingOpponent");
  return player.connected ? t("friendRoom") : t("waitingOpponent");
}

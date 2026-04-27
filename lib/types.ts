export type City = "Almaty" | "Astana" | "Shymkent" | "Karaganda" | "Other";

export type Player = {
  id: string;
  name: string;
  city: City;
  rating: number;
  color?: "white" | "black";
  isPro?: boolean;
};

export type RoomRole = "white" | "black" | "spectator";

export type RoomPlayer = {
  id: string;
  tabToken?: string;
  name: string;
  city: City;
  rating: number;
  role: RoomRole;
  connected: boolean;
  joinedAt: string;
  lastSeen: string;
};

export type Move = {
  san: string;
  from: string;
  to: string;
  color: "w" | "b";
  fenAfter: string;
  moveNumber: number;
  flags?: string;
  captured?: string;
};

export type Game = {
  id: string;
  roomId: string;
  players: Player[];
  city: City;
  pgn: string;
  finalFen: string;
  result: "1-0" | "0-1" | "1/2-1/2" | "*";
  moves: Move[];
  createdAt: string;
};

export type MultiplayerRoomState = {
  roomId: string;
  players: RoomPlayer[];
  fen: string;
  pgn: string;
  moves: Move[];
  turn: "w" | "b";
  status: "waiting" | "active" | "checkmate" | "draw" | "ended";
  result: "1-0" | "0-1" | "1/2-1/2" | "*";
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type AnalysisResult = {
  accuracy: number;
  mistakes: number;
  blunders: number;
  inaccuracies: number;
  materialSwing: number;
  biggestMistake: string;
  betterMove: string;
  whyItWorks: string;
  summary: string;
  criticalMoment: CriticalMoment | null;
  evaluations: MoveEvaluation[];
  materialTimeline: Array<{ ply: number; label: string; balance: number }>;
  phaseAdvice: {
    opening: string;
    middlegame: string;
    endgame: string;
  };
  drill: string;
  tips: CoachTip[];
};

export type MoveEvaluation = {
  ply: number;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  fenBefore: string;
  fenAfter: string;
  materialBefore: number;
  materialAfter: number;
  swing: number;
  opportunityCost: number;
  quality: "best" | "good" | "inaccuracy" | "mistake" | "blunder";
  reason: string;
  captured?: string;
  gaveCheck: boolean;
  missedCapture?: string;
};

export type CriticalMoment = {
  ply: number;
  moveNumber: number;
  color: "w" | "b";
  originalMove: string;
  betterMove: string;
  swing: number;
  fenBefore: string;
  explanation: string;
};

export type CoachTip = {
  title: string;
  body: string;
};

export type Badge = "City Climber" | "Coach Reviewed" | "No Blunders" | "Rising Star" | "City Champion";

export type PlayerProfile = {
  playerId: string;
  displayName: string;
  city: City;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  reviews: number;
  coachScore: number;
  lastPlayedAt: string | null;
  badges: Badge[];
};

export type GameReviewRecord = {
  gameId: string;
  playerId: string;
  displayName: string;
  city: City;
  result: Game["result"];
  accuracy: number;
  blunders: number;
  mistakes: number;
  ratingChange: number;
  coachScoreChange: number;
  reviewedAt: string;
  summary: string;
};

export type LeaderboardEntry = PlayerProfile & {
  id: string;
  name: string;
  rank: number;
  isCurrentPlayer?: boolean;
  isDemo?: boolean;
  isPro?: boolean;
  streak: number;
};

export type LeaderboardUpdateResult = {
  alreadyCounted: boolean;
  player: PlayerProfile;
  previous: PlayerProfile;
  record: GameReviewRecord | null;
  ratingChange: number;
  coachScoreChange: number;
  cityRank: number;
  oldRank: number | null;
  newRank: number | null;
  badgesEarned: Badge[];
  adapterMode: "supabase" | "local";
};

export type LeaderboardPlayer = Player & {
  wins: number;
  games: number;
  reviews: number;
  streak: number;
  coachScore: number;
};

export type City = "Almaty" | "Astana" | "Shymkent" | "Karaganda" | "Other";

export type Player = {
  id: string;
  name: string;
  city: City;
  rating: number;
  color?: "white" | "black";
  isPro?: boolean;
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

export type AnalysisResult = {
  accuracy: number;
  blunders: number;
  biggestMistake: string;
  betterMove: string;
  whyItWorks: string;
  phaseAdvice: {
    opening: string;
    middlegame: string;
    endgame: string;
  };
  drill: string;
  tips: string[];
};

export type LeaderboardPlayer = Player & {
  wins: number;
  games: number;
  reviews: number;
  streak: number;
  coachScore: number;
};

import type { City, LeaderboardPlayer } from "@/lib/types";

export const cities: City[] = ["Almaty", "Astana", "Shymkent", "Karaganda", "Other"];

export const leaderboardPlayers: LeaderboardPlayer[] = [
  { id: "1", name: "Aruzhan T.", city: "Almaty", rating: 1884, wins: 42, games: 61, reviews: 31, streak: 9, coachScore: 94, isPro: true },
  { id: "2", name: "Dias Knight", city: "Astana", rating: 1810, wins: 37, games: 58, reviews: 22, streak: 6, coachScore: 89 },
  { id: "3", name: "Mira Endgame", city: "Almaty", rating: 1775, wins: 34, games: 49, reviews: 28, streak: 5, coachScore: 91, isPro: true },
  { id: "4", name: "Sanzhar Q.", city: "Shymkent", rating: 1712, wins: 30, games: 47, reviews: 19, streak: 4, coachScore: 84 },
  { id: "5", name: "Karina File", city: "Karaganda", rating: 1698, wins: 28, games: 43, reviews: 17, streak: 8, coachScore: 87 },
  { id: "6", name: "Timur Tempo", city: "Astana", rating: 1655, wins: 24, games: 38, reviews: 16, streak: 3, coachScore: 81 },
  { id: "7", name: "Ayan Fork", city: "Almaty", rating: 1604, wins: 22, games: 36, reviews: 14, streak: 2, coachScore: 78 },
  { id: "8", name: "Zere Tactic", city: "Other", rating: 1560, wins: 18, games: 31, reviews: 12, streak: 2, coachScore: 76 }
];

export const cityCopy: Record<City, string> = {
  Almaty: "High-altitude attackers, fast prep, spicy sacrifices.",
  Astana: "Cold-blooded defenders with brutal conversion technique.",
  Shymkent: "Tactical chaos merchants. Nobody leaves uncalculated.",
  Karaganda: "Endgame grinders. Pawn majorities are treated like startups.",
  Other: "Wildcards from everywhere, carrying unknown prep."
};

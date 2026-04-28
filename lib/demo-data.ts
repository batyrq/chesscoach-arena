import type { City, LeaderboardPlayer } from "@/lib/types";

export const cities: City[] = ["Almaty", "Astana", "Shymkent", "Karaganda", "Other"];

export const leaderboardPlayers: LeaderboardPlayer[] = [
  { id: "demo-aruzhan-s", name: "Aruzhan S.", city: "Almaty", rating: 1884, wins: 42, games: 61, reviews: 31, streak: 9, coachScore: 94, isPro: true },
  { id: "demo-nursultan-k", name: "Nursultan K.", city: "Astana", rating: 1810, wins: 37, games: 58, reviews: 22, streak: 6, coachScore: 89 },
  { id: "demo-dana-k", name: "Dana K.", city: "Almaty", rating: 1775, wins: 34, games: 49, reviews: 28, streak: 5, coachScore: 91, isPro: true },
  { id: "demo-dias-m", name: "Dias M.", city: "Shymkent", rating: 1712, wins: 30, games: 47, reviews: 19, streak: 4, coachScore: 84 },
  { id: "demo-amina-n", name: "Amina N.", city: "Karaganda", rating: 1698, wins: 28, games: 43, reviews: 17, streak: 8, coachScore: 87 },
  { id: "demo-timur-s", name: "Timur S.", city: "Astana", rating: 1655, wins: 24, games: 38, reviews: 16, streak: 3, coachScore: 81 },
  { id: "demo-miras-a", name: "Miras A.", city: "Almaty", rating: 1604, wins: 22, games: 36, reviews: 14, streak: 2, coachScore: 78 },
  { id: "demo-alina-b", name: "Alina B.", city: "Other", rating: 1560, wins: 18, games: 31, reviews: 12, streak: 2, coachScore: 76 }
];

export const cityCopy: Record<City, string> = {
  Almaty: "High-altitude attackers, fast prep, spicy sacrifices.",
  Astana: "Cold-blooded defenders with brutal conversion technique.",
  Shymkent: "Tactical chaos merchants. Nobody leaves uncalculated.",
  Karaganda: "Endgame grinders. Pawn majorities are treated like startups.",
  Other: "Wildcards from everywhere, carrying unknown prep."
};

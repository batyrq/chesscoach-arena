"use client";

import Link from "next/link";
import { BookOpen, Home, Play, Trophy, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function MobileBottomNav() {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const items = [
    { href: "/", label: ru ? "Домой" : "Home", icon: Home },
    { href: "/lobby", label: ru ? "Играть" : "Play", icon: Play },
    { href: "/learn", label: ru ? "Учиться" : "Learn", icon: BookOpen },
    { href: "/leaderboard", label: ru ? "Рейтинг" : "Ranking", icon: Trophy },
    { href: "/auth", label: ru ? "Профиль" : "Profile", icon: UserRound }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#171411]/95 px-2 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.28)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
              <Icon className="h-4 w-4 text-[var(--mint)]" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

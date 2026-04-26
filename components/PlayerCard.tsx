import { Crown, MapPin } from "lucide-react";
import { cn, formatClock } from "@/lib/utils";
import type { Player } from "@/lib/types";

type PlayerCardProps = {
  player: Player;
  active?: boolean;
  clockSeconds?: number;
};

export function PlayerCard({ player, active, clockSeconds = 300 }: PlayerCardProps) {
  return (
    <div className={cn("rounded-[1.5rem] border bg-white/[0.05] p-4 transition", active ? "border-[var(--mint)] shadow-[0_0_28px_rgba(118,247,203,0.16)]" : "border-white/10")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-[var(--font-display)] text-lg font-bold">
            {player.name}
            {player.isPro ? <Crown className="h-4 w-4 text-[var(--gold)]" /> : null}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5" /> {player.city} · {player.rating}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/70 px-3 py-2 font-[var(--font-display)] text-lg font-bold">
          {formatClock(clockSeconds)}
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", active ? "w-3/4 bg-[var(--mint)]" : "w-1/2 bg-slate-600")} />
      </div>
    </div>
  );
}

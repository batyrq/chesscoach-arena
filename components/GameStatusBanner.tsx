import { CircleAlert, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function GameStatusBanner({ status, intense }: { status: string; intense?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-[1.5rem] border p-4", intense ? "border-[var(--coral)]/40 bg-[rgba(255,127,127,0.12)]" : "border-white/10 bg-white/[0.06]")}>
      {intense ? <CircleAlert className="h-5 w-5 text-[var(--coral)]" /> : <Trophy className="h-5 w-5 text-[var(--gold)]" />}
      <p className="text-sm font-semibold text-slate-100">{status}</p>
    </div>
  );
}

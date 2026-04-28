import type { Move } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export function MoveHistory({ moves }: { moves: Move[] }) {
  const { t } = useI18n();
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ number: Math.floor(i / 2) + 1, white: moves[i], black: moves[i + 1] });
  }

  return (
    <div className="no-scrollbar max-h-72 overflow-auto rounded-[1.25rem] border border-white/10 bg-slate-950/40 p-3">
      {pairs.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{t("movesEmpty")}</p>
      ) : (
        <div className="space-y-1 text-sm">
          {pairs.map((pair) => (
            <div key={pair.number} className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded-xl px-2 py-1.5 hover:bg-white/[0.05]">
              <span className="text-slate-500">{pair.number}.</span>
              <span>{pair.white?.san}</span>
              <span className="text-slate-300">{pair.black?.san ?? ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

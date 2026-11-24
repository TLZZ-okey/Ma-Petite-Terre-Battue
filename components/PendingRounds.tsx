import type { PendingRound } from "@/lib/providers/types";
import { formatTime } from "@/lib/format";

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Matchs prévus mais pas encore affichables : leurs joueurs seront les vainqueurs
 * du tour précédent (ex. la finale, tant que les demi-finales ne sont pas terminées).
 */
export function PendingRounds({ rounds }: { rounds: PendingRound[] }) {
  if (rounds.length === 0) return null;
  return (
    <div className="space-y-3" aria-label="Matchs à venir dont les joueurs ne sont pas encore connus">
      {rounds.map((r) => (
        <div
          key={r.round}
          className="flex items-start gap-4 rounded-3xl border-[3px] border-dashed border-clay-200 bg-surface/70 px-5 py-4"
        >
          <span
            className="flex h-12 w-12 shrink-0 animate-wiggle items-center justify-center rounded-2xl border-2 border-clay-200 bg-clay-50 text-2xl"
            aria-hidden
          >
            🔒
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight font-semibold text-clay-600">
              {r.round}
              <span className="ml-2 font-sans text-sm font-bold text-ink-3">
                {formatTime(r.startTime)} · {r.count} match{r.count > 1 ? "s" : ""}
              </span>
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink-2">
              {r.waitingFor
                ? `Les joueurs seront connus à l'issue des ${lower(r.waitingFor)}. Le match s'affichera alors ici.`
                : "Les joueurs ne sont pas encore connus."}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

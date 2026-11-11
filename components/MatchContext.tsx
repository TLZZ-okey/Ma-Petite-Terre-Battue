import { SURFACE_LABELS } from "@/lib/data/tournaments";
import { formatTime } from "@/lib/format";
import type { MatchState } from "@/lib/types";
import { ClockIcon } from "./icons";

export function MatchContext({ match, showContext }: { match: MatchState; showContext?: boolean }) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 pt-3 text-xs text-muted">
        <ClockIcon width={14} height={14} />
        <span className="font-semibold text-ink">
          {showContext
            ? `${new Date(match.startTime).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${formatTime(match.startTime)}`
            : formatTime(match.startTime)}
        </span>
        <span aria-hidden>·</span>
        <span className="truncate">{showContext ? match.tournament.name : match.court}</span>
        <span className="ml-auto shrink-0">
          <StatusBadge match={match} />
        </span>
      </div>
      {showContext && (
        <p className="px-4 text-[11px] text-muted">
          {match.round} · {match.tour} · {SURFACE_LABELS[match.tournament.surface]}
        </p>
      )}
    </>
  );
}

export function StatusBadge({ match }: { match: MatchState }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 text-[11px] font-bold text-live uppercase">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" /> En cours
      </span>
    );
  }
  if (match.status === "finished") {
    return <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-bold text-muted uppercase">Terminé</span>;
  }
  return <span className="rounded-full bg-rg-light px-2 py-0.5 text-[11px] font-bold text-rg uppercase">{match.tour}</span>;
}


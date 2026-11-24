"use client";

import { useMemo, useState } from "react";
import { ApiNotice } from "@/components/ApiStatus";
import { useApp } from "@/components/AppProvider";
import { DayPicker } from "@/components/DayPicker";
import { useAsync, useMyPredictions } from "@/components/hooks";
import { InfoIcon } from "@/components/icons";
import { MatchCard } from "@/components/MatchCard";
import { MiniLeaderboard } from "@/components/MiniLeaderboard";
import { PendingRounds } from "@/components/PendingRounds";
import { RulesCard } from "@/components/RulesCard";
import { SummaryCard } from "@/components/SummaryCard";
import { EmptyState, PageHeader, Segmented, Skeleton, cx } from "@/components/ui";
import { usePredict } from "@/components/usePredict";
import { SURFACE_LABELS } from "@/lib/data/tournaments";
import { dayKey, parseDayKey } from "@/lib/dates";
import { formatDayLong, joinInfo } from "@/lib/format";
import { ENABLED_TOURS } from "@/lib/settings";
import type { MatchState, Tour } from "@/lib/types";

type TourFilter = "Tous" | Tour;

/** Filtre par circuit : seulement si plusieurs circuits sont suivis (lib/settings.ts). */
const TOUR_OPTIONS: Array<{ value: TourFilter; label: string }> = [
  { value: "Tous", label: "Tous" },
  ...ENABLED_TOURS.map((t) => ({ value: t as TourFilter, label: t })),
];

export default function MatchsPage() {
  const { matches, now, dataVersion } = useApp();
  const [day, setDay] = useState(() => dayKey(now));
  const [filter, setFilter] = useState<TourFilter>("Tous");
  const { busyId, predict, toastNode } = usePredict();

  const { data: dayMatches, loading, error } = useAsync(
    () => matches.getMatchesForDay(day, now),
    [day, now.getTime(), dataVersion],
  );
  // Matchs prévus dont les joueurs ne sont pas encore connus (tableau des matchs de démo).
  const { data: pending } = useAsync(
    async () => (matches.getPendingRounds ? matches.getPendingRounds(day, now) : []),
    [day, now.getTime(), dataVersion],
  );
  const { data: mine } = useMyPredictions();

  const predictionsByMatch = useMemo(
    () => new Map((mine?.predictions ?? []).map((p) => [p.matchId, p])),
    [mine],
  );
  const countsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of mine?.predictions ?? []) {
      const key = p.matchId.slice(0, 10);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [mine]);

  const groups = useMemo(() => {
    const visible = (dayMatches ?? []).filter((m) => filter === "Tous" || m.tour === filter);
    const map = new Map<string, MatchState[]>();
    for (const m of visible) map.set(m.tournament.id, [...(map.get(m.tournament.id) ?? []), m]);
    return [...map.values()];
  }, [dayMatches, filter]);

  const total = dayMatches?.length ?? 0;
  const predicted = (dayMatches ?? []).filter((m) => predictionsByMatch.has(m.id)).length;
  const upcoming = (dayMatches ?? []).filter((m) => m.status === "upcoming");
  const toPredict = upcoming.filter((m) => !predictionsByMatch.has(m.id)).length;

  return (
    <div>
      <PageHeader
        title="Matchs"
        subtitle={<span className="first-letter:uppercase">{formatDayLong(parseDayKey(day))}</span>}
        actions={
          ENABLED_TOURS.length > 1 ? (
            <Segmented label="Circuit" value={filter} onChange={setFilter} options={TOUR_OPTIONS} size="sm" />
          ) : undefined
        }
      />

      <div className="sticky top-[calc(56px+env(safe-area-inset-top))] z-20 -mt-1 bg-canvas/90 px-4 py-2 backdrop-blur sm:px-0 lg:top-0">
        <DayPicker now={now} value={day} onChange={setDay} counts={countsByDay} />
      </div>

      <div className="mt-4 px-4 sm:px-0 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div className="min-w-0">
          {dayMatches && total > 0 && (
            <p className="mb-4 text-sm text-ink-2" aria-live="polite">
              {toPredict > 0 ? (
                <>
                  <strong className="font-semibold text-clay-600">
                    {toPredict} match{toPredict > 1 ? "s" : ""} à pronostiquer
                  </strong>{" "}
                  · {predicted}/{total} pronostiqués
                </>
              ) : upcoming.length > 0 ? (
                <span className="font-semibold text-court-700">Tous les matchs à venir sont pronostiqués 👏</span>
              ) : (
                <>
                  {predicted}/{total} matchs pronostiqués ce jour
                </>
              )}
            </p>
          )}

          {/* Données réelles : explique une liste vide (hors tournoi, clé manquante). */}
          <ApiNotice />

          {error && (
            <p role="alert" className="mb-4 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <details className="group mb-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-clay-600">
              <InfoIcon width={16} height={16} /> Comment ça marche ?
            </summary>
            <RulesCard className="mt-3" />
          </details>

          {loading && !dayMatches ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            pending && pending.length > 0 ? (
              <PendingRounds rounds={pending} />
            ) : (
              <EmptyState title="Aucun match ce jour-là">Choisis un autre jour dans le calendrier.</EmptyState>
            )
          ) : (
            <div className="space-y-8">
              {groups.map((group) => {
                const t = group[0].tournament;
                const clay = t.surface === "terre-battue";
                return (
                  <section key={t.id} aria-labelledby={`t-${t.id}`}>
                    <div className="mb-3 flex items-center gap-3">
                      <span className={cx("h-9 w-1.5 shrink-0 rounded-full", clay ? "bg-clay-500" : "bg-court-500")} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <h2 id={`t-${t.id}`} className="truncate font-display text-xl leading-tight font-bold tracking-wide text-court-900 uppercase">
                          {t.name}
                        </h2>
                        <p className="truncate text-xs text-ink-3">
                          {joinInfo(group[0].tour, t.category, t.city, group[0].round)}
                        </p>
                      </div>
                      <span
                        className={cx(
                          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          clay ? "bg-clay-50 text-clay-700" : "bg-court-50 text-court-700",
                        )}
                      >
                        {SURFACE_LABELS[t.surface]}
                      </span>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      {group.map((m) => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          prediction={predictionsByMatch.get(m.id)}
                          busy={busyId === m.id}
                          onPredict={(w, s) => predict(m, w, s)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
              {pending && pending.length > 0 && <PendingRounds rounds={pending} />}
            </div>
          )}
        </div>

        <aside className="hidden lg:block" aria-label="Résumé">
          <div className="sticky top-28 space-y-4">
            <SummaryCard points={mine?.stats.points ?? 0} done={predicted} total={total} label="Pronostiqués ce jour" />
            <RulesCard />
            <MiniLeaderboard />
          </div>
        </aside>
      </div>
      {toastNode}
    </div>
  );
}

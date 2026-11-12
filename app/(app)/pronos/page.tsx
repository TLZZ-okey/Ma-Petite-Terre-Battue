"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useAsync, useMyPredictions } from "@/components/hooks";
import { MatchCard } from "@/components/MatchCard";
import { EmptyState, PageHeader, Segmented, Skeleton, StatCard } from "@/components/ui";
import { usePredict } from "@/components/usePredict";
import { addDays, dayKey, parseDayKey, startOfDay } from "@/lib/dates";
import { formatDayLong, formatPoints } from "@/lib/format";
import type { MatchState } from "@/lib/types";

type Tab = "upcoming" | "finished";
type FinishedFilter = "all" | "mine";

/** Nombre de jours affichés dans chaque onglet. */
const DAYS_AHEAD = 6;
const DAYS_BACK = 6;

export default function PronosPage() {
  const { matches, now, dataVersion } = useApp();
  const { data: mine } = useMyPredictions();
  const { busyId, predict, toastNode } = usePredict();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [finishedFilter, setFinishedFilter] = useState<FinishedFilter>("all");

  // Tous les matchs de la fenêtre [aujourd'hui - 6 j ; aujourd'hui + 6 j].
  const { data: windowMatches, loading } = useAsync(async () => {
    const today = startOfDay(now);
    const days = Array.from({ length: DAYS_BACK + DAYS_AHEAD + 1 }, (_, i) => dayKey(addDays(today, i - DAYS_BACK)));
    return (await Promise.all(days.map((d) => matches.getMatchesForDay(d, now)))).flat();
  }, [dayKey(now), now.getTime(), dataVersion]);

  const predictionsByMatch = useMemo(
    () => new Map((mine?.predictions ?? []).map((p) => [p.matchId, p])),
    [mine],
  );

  const groups = useMemo(() => {
    const all = new Map<string, MatchState>((windowMatches ?? []).map((m) => [m.id, m]));
    // Les matchs pronostiqués plus anciens restent visibles dans « Terminés ».
    for (const m of mine?.matches.values() ?? []) if (!all.has(m.id)) all.set(m.id, m);

    const list = [...all.values()]
      .filter((m) =>
        tab === "upcoming"
          ? m.status !== "finished"
          : m.status === "finished" && (finishedFilter === "all" || predictionsByMatch.has(m.id)),
      )
      .sort((a, b) =>
        tab === "upcoming" ? a.startTime.localeCompare(b.startTime) : b.startTime.localeCompare(a.startTime),
      );

    const byDay = new Map<string, MatchState[]>();
    for (const m of list) {
      const key = dayKey(new Date(m.startTime));
      byDay.set(key, [...(byDay.get(key) ?? []), m]);
    }
    return [...byDay.entries()];
  }, [windowMatches, mine, tab, finishedFilter, predictionsByMatch]);

  const stats = mine?.stats;
  const successRate = stats && stats.settled > 0 ? Math.round((stats.won / stats.settled) * 100) : 0;
  const upcomingTotal = (windowMatches ?? []).filter((m) => m.status === "upcoming").length;
  const upcomingPredicted = (windowMatches ?? []).filter(
    (m) => m.status === "upcoming" && predictionsByMatch.has(m.id),
  ).length;

  return (
    <div className="px-4 sm:px-0">
      <div className="-mx-4 sm:mx-0">
        <PageHeader title="Mes pronos" subtitle="Pronostique les prochains matchs et suis tes résultats" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard label="Points" value={formatPoints(stats?.points ?? 0)} tone="clay" />
        <StatCard label="Pronos joués" value={stats?.total ?? 0} />
        <StatCard
          label="Réussite"
          value={`${successRate}%`}
          hint={stats?.settled ? `${stats.won} sur ${stats.settled} terminés` : "Aucun match terminé"}
          tone="court"
        />
        <StatCard label="Scores exacts" value={stats?.perfect ?? 0} tone="gold" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Segmented
          label="Période"
          value={tab}
          onChange={setTab}
          className="w-full sm:w-auto sm:min-w-80"
          options={[
            { value: "upcoming", label: "À venir" },
            { value: "finished", label: "Terminés" },
          ]}
        />
        {tab === "upcoming" ? (
          <p className="text-sm text-ink-2">
            <strong className="tabular font-semibold text-ink">
              {upcomingPredicted}/{upcomingTotal}
            </strong>{" "}
            matchs à venir pronostiqués
          </p>
        ) : (
          <Segmented
            label="Filtre"
            size="sm"
            value={finishedFilter}
            onChange={setFinishedFilter}
            options={[
              { value: "all", label: "Tous les matchs" },
              { value: "mine", label: "Avec mon prono" },
            ]}
          />
        )}
      </div>

      <div className="mt-6">
        {loading && !windowMatches ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState title={tab === "upcoming" ? "Aucun match à venir" : "Aucun match terminé à afficher"}>
            {tab === "finished" && finishedFilter === "mine" && "Tes pronos apparaîtront ici une fois les matchs terminés."}
          </EmptyState>
        ) : (
          <div className="space-y-8">
            {groups.map(([day, list]) => (
              <section key={day}>
                <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-ink">
                  <span className="first-letter:uppercase">{formatDayLong(parseDayKey(day))}</span>
                  <span className="font-normal text-ink-3">
                    · {list.length} match{list.length > 1 ? "s" : ""}
                  </span>
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {list.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      prediction={predictionsByMatch.get(m.id)}
                      showContext
                      busy={busyId === m.id}
                      onPredict={(w, s) => predict(m, w, s)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      {toastNode}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { useAsync, useMyPredictions } from "@/components/hooks";
import { MatchCard } from "@/components/MatchCard";
import { StatTile } from "@/components/StatTile";
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
    <div>
      <PageTitle title="Mes pronos" subtitle="Pronostique les prochains matchs et suis tes résultats" />
      <div className="grid grid-cols-4 gap-2 px-4 md:gap-4 md:px-0">
        <StatTile label="Points" value={formatPoints(stats?.points ?? 0)} accent="text-clay" />
        <StatTile label="Pronos" value={String(stats?.total ?? 0)} />
        <StatTile label="Réussite" value={`${successRate}%`} />
        <StatTile label="Scores exacts" value={String(stats?.perfect ?? 0)} accent="text-gold" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 px-4 md:mt-6 md:px-0">
        <div className="grid w-full grid-cols-2 rounded-full bg-sand p-1 md:w-auto md:min-w-96" role="tablist">
          {(
            [
              ["upcoming", "À venir"],
              ["finished", "Terminés"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                tab === value ? "bg-white text-clay-dark shadow" : "text-rg-dark"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "upcoming" ? (
          <p className="text-xs text-muted">
            <strong className="text-rg-dark">
              {upcomingPredicted}/{upcomingTotal}
            </strong>{" "}
            matchs à venir pronostiqués
          </p>
        ) : (
          <div className="flex gap-2">
            {(
              [
                ["all", "Tous les matchs"],
                ["mine", "Avec mon prono"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFinishedFilter(value)}
                aria-pressed={finishedFilter === value}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  finishedFilter === value ? "bg-rg text-white" : "border border-sand bg-white text-rg-dark"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && !windowMatches ? (
        <div className="grid gap-3 p-4 md:grid-cols-2 md:px-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/70" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="m-4 rounded-2xl border border-dashed border-clay/40 bg-white p-8 text-center md:mx-0">
          <p className="text-3xl">🎾</p>
          <p className="mt-2 font-bold text-rg-dark">
            {tab === "upcoming" ? "Aucun match à venir" : "Aucun match terminé à afficher"}
          </p>
        </div>
      ) : (
        groups.map(([day, list]) => (
          <section key={day} className="pt-5">
            <h2 className="mb-3 px-4 text-sm font-extrabold text-rg-dark first-letter:uppercase md:px-0">
              {formatDayLong(parseDayKey(day))}
              <span className="ml-2 font-semibold text-muted">· {list.length} match{list.length > 1 ? "s" : ""}</span>
            </h2>
            <div className="grid gap-3 px-4 md:grid-cols-2 md:gap-4 md:px-0">
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
        ))
      )}
      {toastNode}
    </div>
  );
}

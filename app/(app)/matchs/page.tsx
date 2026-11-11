"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { DayPicker } from "@/components/DayPicker";
import { useAsync, useMyPredictions } from "@/components/hooks";
import { InfoIcon } from "@/components/icons";
import { MatchCard } from "@/components/MatchCard";
import { MiniLeaderboard } from "@/components/MiniLeaderboard";
import { RulesCard } from "@/components/RulesCard";
import { usePredict } from "@/components/usePredict";
import { SURFACE_LABELS } from "@/lib/data/tournaments";
import { dayKey, parseDayKey } from "@/lib/dates";
import { formatDayLong, formatPoints } from "@/lib/format";
import type { MatchState, Tour } from "@/lib/types";

type TourFilter = "Tous" | Tour;

export default function MatchsPage() {
  const { matches, now, dataVersion } = useApp();
  const [day, setDay] = useState(() => dayKey(now));
  const [filter, setFilter] = useState<TourFilter>("Tous");
  const [showRules, setShowRules] = useState(false);
  const { busyId, predict, toastNode } = usePredict();

  const { data: dayMatches, loading } = useAsync(
    () => matches.getMatchesForDay(day, now),
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
      const day = p.matchId.slice(0, 10);
      counts[day] = (counts[day] ?? 0) + 1;
    }
    return counts;
  }, [mine]);

  const groups = useMemo(() => {
    const visible = (dayMatches ?? []).filter((m) => filter === "Tous" || m.tour === filter);
    const map = new Map<string, MatchState[]>();
    for (const m of visible) map.set(m.tournament.id, [...(map.get(m.tournament.id) ?? []), m]);
    return [...map.values()];
  }, [dayMatches, filter]);

  const upcomingCount = (dayMatches ?? []).filter((m) => m.status === "upcoming").length;
  const predictedCount = (dayMatches ?? []).filter((m) => predictionsByMatch.has(m.id)).length;

  return (
    <div>
      <div className="sticky top-[calc(60px+env(safe-area-inset-top))] z-20 border-b border-sand bg-cream/95 backdrop-blur md:pt-2">
        <DayPicker now={now} value={day} onChange={setDay} counts={countsByDay} />
        <div className="flex items-center gap-2 px-4 pb-3 md:px-0">
          {(["Tous", "ATP", "WTA"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filter === f ? "bg-rg text-white" : "border border-sand bg-white text-rg-dark"
              }`}
            >
              {f}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            className="ml-auto flex items-center gap-1 text-xs font-bold text-clay-dark lg:hidden"
            aria-expanded={showRules}
          >
            <InfoIcon width={16} height={16} /> Règles
          </button>
        </div>
      </div>

      {showRules && <RulesCard className="mx-4 mt-4 md:mx-0 lg:hidden" />}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
      <div className="min-w-0">
      <div className="flex items-baseline justify-between px-4 pt-4 md:px-0 md:pt-6">
        <h1 className="text-base font-extrabold text-rg-dark first-letter:uppercase md:text-xl">{formatDayLong(parseDayKey(day))}</h1>
        {dayMatches && (
          <p className="text-xs text-muted">
            {predictedCount}/{dayMatches.length} pronostiqués
            {upcomingCount > 0 && ` · ${upcomingCount} à venir`}
          </p>
        )}
      </div>

      {loading && !dayMatches ? (
        <div className="grid gap-3 p-4 md:grid-cols-2 md:px-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-white/70" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted">Aucun match ce jour-là.</p>
      ) : (
        groups.map((group) => {
          const t = group[0].tournament;
          return (
            <section key={t.id} className="pt-4">
              <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl bg-rg px-3 py-2 text-white md:mx-0">
                <span
                  className={`h-8 w-1.5 rounded-full ${t.surface === "terre-battue" ? "bg-clay" : "bg-ball"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-extrabold">{t.name}</p>
                  <p className="text-[11px] text-white/75">
                    {group[0].tour} · {t.category} · {t.city} · {group[0].round}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    t.surface === "terre-battue" ? "bg-clay text-white" : "bg-white/15 text-white"
                  }`}
                >
                  {SURFACE_LABELS[t.surface]}
                </span>
              </div>
              <div className="grid gap-3 px-4 md:grid-cols-2 md:gap-4 md:px-0">
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
        })
      )}
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(60px+11rem)] space-y-4 pt-6">
          <MyDayCard predicted={predictedCount} total={dayMatches?.length ?? 0} points={mine?.stats.points ?? 0} />
          <RulesCard className="" />
          <MiniLeaderboard />
        </div>
      </aside>
      </div>
      {toastNode}
    </div>
  );
}

function MyDayCard({ predicted, total, points }: { predicted: number; total: number; points: number }) {
  const pct = total ? Math.round((predicted / total) * 100) : 0;
  return (
    <div className="clay-court rounded-2xl px-7 py-5 text-white shadow-sm">
      <p className="text-xs font-bold tracking-wide text-white/85 uppercase">Mon total</p>
      <p className="text-3xl font-black drop-shadow">{formatPoints(points)} pts</p>
      <p className="mt-3 text-xs font-semibold text-white/90">
        {predicted}/{total} matchs pronostiqués ce jour
      </p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/25">
        <div className="h-full rounded-full bg-ball transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageTitle } from "@/components/AppShell";
import { useMyPredictions } from "@/components/hooks";
import { MatchCard } from "@/components/MatchCard";
import { StatTile } from "@/components/StatTile";
import { usePredict } from "@/components/usePredict";
import { formatPoints } from "@/lib/format";

type Tab = "pending" | "finished";

export default function PronosPage() {
  const { data, loading } = useMyPredictions();
  const { busyId, predict, toastNode } = usePredict();
  const [tab, setTab] = useState<Tab>("pending");

  const items = useMemo(() => {
    if (!data) return [];
    return data.predictions
      .map((p) => ({ prediction: p, match: data.matches.get(p.matchId)! }))
      .filter(({ match }) => match && (tab === "finished" ? match.status === "finished" : match.status !== "finished"))
      .sort((a, b) =>
        tab === "finished"
          ? b.match.startTime.localeCompare(a.match.startTime)
          : a.match.startTime.localeCompare(b.match.startTime),
      );
  }, [data, tab]);

  const stats = data?.stats;
  const successRate = stats && stats.settled > 0 ? Math.round((stats.won / stats.settled) * 100) : 0;

  return (
    <div>
      <PageTitle title="Mes pronos" subtitle="Suis tes pronostics et tes points" />
      <div className="grid grid-cols-4 gap-2 px-4 md:gap-4 md:px-0">
        <StatTile label="Points" value={formatPoints(stats?.points ?? 0)} accent="text-clay" />
        <StatTile label="Pronos" value={String(stats?.total ?? 0)} />
        <StatTile label="Réussite" value={`${successRate}%`} />
        <StatTile label="Scores exacts" value={String(stats?.perfect ?? 0)} accent="text-gold" />
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 rounded-full bg-sand p-1 md:mx-0 md:mt-6 md:max-w-md" role="tablist">
        {(
          [
            ["pending", "À venir & en cours"],
            ["finished", "Terminés"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-full py-2 text-sm font-bold transition ${
              tab === value ? "bg-white text-clay-dark shadow" : "text-rg-dark"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 md:gap-4 md:px-0 md:pt-6">
        {loading && !data ? (
          <div className="h-48 animate-pulse rounded-2xl bg-white/70 md:col-span-2" />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-clay/40 bg-white p-8 text-center md:col-span-2">
            <p className="text-3xl">🎾</p>
            <p className="mt-2 font-bold text-rg-dark">
              {tab === "pending" ? "Aucun prono en attente" : "Aucun prono terminé pour l'instant"}
            </p>
            <Link
              href="/matchs"
              className="mt-4 inline-block rounded-full bg-clay px-5 py-2 text-sm font-bold text-white shadow"
            >
              Voir les matchs
            </Link>
          </div>
        ) : (
          items.map(({ match, prediction }) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={prediction}
              showContext
              busy={busyId === match.id}
              onPredict={(w, s) => predict(match, w, s)}
            />
          ))
        )}
      </div>
      {toastNode}
    </div>
  );
}

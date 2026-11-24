"use client";

import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { useLeaderboard } from "@/components/hooks";
import { Card, EmptyState, PageHeader, Skeleton, cx } from "@/components/ui";
import { formatPoints } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/game";
import { levelFor } from "@/lib/gamification";

const MEDALS = ["🥇", "🥈", "🥉"];

/** Marches du podium : 2e, 1er, 3e. */
const STEPS = [
  { rank: 2, height: "h-24", tone: "border-line-strong bg-surface text-ink shadow-chunky" },
  { rank: 1, height: "h-36", tone: "clay-surface border-clay-700 text-white shadow-chunky-clay" },
  { rank: 3, height: "h-16", tone: "border-line-strong bg-surface text-ink shadow-chunky" },
];

export default function ClassementPage() {
  const { user } = useApp();
  const { data, loading } = useLeaderboard();
  const entries = data ?? [];
  const byRank = (rank: number) => entries.find((e, i) => i === rank - 1);

  return (
    <div className="px-4 sm:px-0">
      <div className="-mx-4 sm:mx-0">
        <PageHeader title="Classement" emoji="🏆" subtitle="Qui sera le roi de la terre battue ?" />
      </div>

      {loading && !data ? (
        <Skeleton className="h-72" />
      ) : entries.length === 0 ? (
        <EmptyState icon="🏆" title="Personne au classement pour l'instant" />
      ) : (
        <div className="mx-auto max-w-4xl">
          {/* Podium */}
          <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
            {STEPS.map((step) => {
              const entry = byRank(step.rank);
              return (
                <div key={step.rank} className="flex flex-col items-center">
                  {entry ? <PodiumPlayer entry={entry} me={entry.user.id === user?.id} /> : <div className="h-24" />}
                  <div
                    className={cx(
                      "mt-2 flex w-full items-start justify-center rounded-t-3xl border-2 border-b-0 pt-2 font-display text-4xl font-bold",
                      step.height,
                      step.tone,
                    )}
                    aria-hidden
                  >
                    {step.rank}
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">Classement complet</caption>
              <thead>
                <tr className="border-b-2 border-line bg-subtle text-left text-xs font-extrabold text-ink-3 uppercase">
                  <th scope="col" className="w-16 py-3 pl-5">
                    Rang
                  </th>
                  <th scope="col" className="py-3">
                    Joueur
                  </th>
                  <th scope="col" className="hidden py-3 text-right sm:table-cell">
                    ✅ Vainqueurs
                  </th>
                  <th scope="col" className="hidden py-3 text-right sm:table-cell">
                    🎯 Exacts
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const me = e.user.id === user?.id;
                  const lvl = levelFor(e.points);
                  return (
                    <tr key={e.user.id} className={cx("border-b-2 border-line last:border-0", me ? "bg-clay-50" : "hover:bg-subtle/60")}>
                      <td className="py-3 pl-5">
                        <span className="flex h-9 w-9 items-center justify-center text-2xl" aria-label={`Rang ${e.rank}`}>
                          {MEDALS[e.rank - 1] ?? <span className="tabular font-display text-lg font-semibold text-ink-3">{e.rank}</span>}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={e.user.username} color={e.user.avatarColor} size={38} ring={false} />
                          <span className="min-w-0">
                            <span className="block truncate font-display text-lg leading-tight font-semibold text-ink">
                              {e.user.username}
                              {me && <span className="ml-1.5 font-sans text-xs font-extrabold text-clay-600">· toi</span>}
                            </span>
                            <span className="block truncate text-xs font-bold text-ink-3">
                              {lvl.current.emoji} Niv. {lvl.current.level} · {lvl.current.title}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="tabular hidden py-3 text-right font-bold text-ink-2 sm:table-cell">
                        {e.won}
                        <span className="text-ink-3">/{e.settled}</span>
                      </td>
                      <td className="tabular hidden py-3 text-right font-bold text-gold sm:table-cell">{e.perfect}</td>
                      <td className="tabular py-3 pr-5 text-right font-display text-2xl font-semibold text-clay-600">
                        {formatPoints(e.points)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {entries.length < 2 && (
            <Card className="mt-4 flex items-center gap-4 p-5" tone="ball">
              <span className="text-4xl" aria-hidden>
                🤝
              </span>
              <p className="font-bold">
                Tout seul sur le court ? Invite tes amis à créer un compte sur cet appareil pour vous affronter ! Les
                comptes en ligne arriveront avec la base de données.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function PodiumPlayer({ entry, me }: { entry: LeaderboardEntry; me: boolean }) {
  const first = entry.rank === 1;
  return (
    <div className="flex w-full flex-col items-center text-center">
      {first && (
        <span className="animate-float text-3xl" aria-hidden>
          👑
        </span>
      )}
      <span className="relative">
        <Avatar name={entry.user.username} color={entry.user.avatarColor} size={first ? 72 : 56} />
        <span className="absolute -right-2 -bottom-1 text-2xl" aria-hidden>
          {MEDALS[entry.rank - 1]}
        </span>
      </span>
      <p className="mt-2 w-full truncate font-display text-lg leading-tight font-semibold text-ink">
        {entry.user.username}
        {me && <span className="ml-1 font-sans text-xs font-extrabold text-clay-600">· toi</span>}
      </p>
      <p className="tabular font-display text-2xl font-bold text-clay-600">
        {formatPoints(entry.points)} <span className="text-sm text-ink-3">pts</span>
      </p>
    </div>
  );
}

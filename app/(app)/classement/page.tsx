"use client";

import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { useLeaderboard } from "@/components/hooks";
import { Card, EmptyState, PageHeader, Skeleton, cx } from "@/components/ui";
import { formatPoints } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/game";

const MEDAL = ["bg-gold-400", "bg-[#a9b4b9]", "bg-[#c0834f]"];

export default function ClassementPage() {
  const { user } = useApp();
  const { data, loading } = useLeaderboard();
  const entries = data ?? [];
  const podium = entries.slice(0, 3);

  return (
    <div className="px-4 sm:px-0">
      <div className="-mx-4 sm:mx-0">
        <PageHeader title="Classement" subtitle="Tous les joueurs de cet appareil" />
      </div>

      {loading && !data ? (
        <Skeleton className="h-72" />
      ) : entries.length === 0 ? (
        <EmptyState icon="🏆" title="Personne au classement pour l'instant" />
      ) : (
        <div className="mx-auto max-w-4xl">
          {/* Podium : 2e, 1er, 3e */}
          <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
            {[podium[1], podium[0], podium[2]].map((entry, i) =>
              entry ? (
                <PodiumCard key={entry.user.id} entry={entry} me={entry.user.id === user?.id} first={i === 1} />
              ) : (
                <div key={i} />
              ),
            )}
          </div>

          <Card className="mt-6 overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">Classement complet</caption>
              <thead>
                <tr className="border-b border-line bg-subtle/60 text-left text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
                  <th scope="col" className="w-20 py-3 pl-5">
                    Rang
                  </th>
                  <th scope="col" className="py-3">
                    Joueur
                  </th>
                  <th scope="col" className="hidden py-3 text-right sm:table-cell">
                    Bons vainqueurs
                  </th>
                  <th scope="col" className="hidden py-3 text-right sm:table-cell">
                    Scores exacts
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const me = e.user.id === user?.id;
                  return (
                    <tr key={e.user.id} className={cx("border-b border-line last:border-0", me ? "bg-court-50" : "hover:bg-subtle/50")}>
                      <td className="py-3 pl-5">
                        <span
                          className={cx(
                            "tabular inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                            e.rank <= 3 ? `${MEDAL[e.rank - 1]} text-white` : "bg-subtle text-ink-2",
                          )}
                        >
                          {e.rank}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={e.user.username} color={e.user.avatarColor} size={32} ring={false} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">
                              {e.user.username}
                              {me && <span className="ml-1.5 text-xs font-medium text-court-700">· toi</span>}
                            </span>
                            <span className="tabular block text-xs text-ink-3 sm:hidden">
                              {e.won}/{e.settled} justes · {e.perfect} exacts
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="tabular hidden py-3 text-right text-ink-2 sm:table-cell">
                        {e.won}
                        <span className="text-ink-3">/{e.settled}</span>
                      </td>
                      <td className="tabular hidden py-3 text-right text-gold sm:table-cell">{e.perfect}</td>
                      <td className="tabular py-3 pr-5 text-right font-display text-xl font-bold text-court-900">
                        {formatPoints(e.points)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {entries.length < 2 && (
            <p className="mt-4 text-center text-sm text-ink-3">
              Invite tes amis à créer un compte sur cet appareil pour vous affronter. Les comptes en ligne arriveront avec
              la base de données.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PodiumCard({ entry, me, first }: { entry: LeaderboardEntry; me: boolean; first: boolean }) {
  return (
    <div
      className={cx(
        "relative flex flex-col items-center rounded-2xl border px-2 text-center shadow-card",
        first ? "border-court-800 bg-court-900 pt-6 pb-5 text-white sm:pt-8 sm:pb-6" : "border-line bg-surface pt-5 pb-4",
      )}
    >
      <span
        className={cx(
          "tabular absolute -top-3 flex h-7 w-7 items-center justify-center rounded-full font-display text-base font-bold text-white ring-4",
          MEDAL[entry.rank - 1] ?? "bg-ink-3",
          first ? "ring-canvas" : "ring-canvas",
        )}
      >
        {entry.rank}
      </span>
      <Avatar name={entry.user.username} color={entry.user.avatarColor} size={first ? 64 : 48} ring={first} />
      <p className={cx("mt-2 w-full truncate text-sm font-semibold", first ? "text-white" : "text-ink")}>
        {entry.user.username}
        {me && <span className={cx("ml-1 text-xs font-medium", first ? "text-white/70" : "text-court-700")}>· toi</span>}
      </p>
      <p className={cx("tabular font-display text-2xl leading-tight font-bold sm:text-3xl", first ? "text-ball" : "text-court-900")}>
        {formatPoints(entry.points)}
      </p>
      <p className={cx("text-[11px]", first ? "text-white/65" : "text-ink-3")}>points</p>
    </div>
  );
}

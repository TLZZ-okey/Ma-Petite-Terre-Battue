"use client";

import { PageTitle } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { useLeaderboard } from "@/components/hooks";
import { formatPoints, pts } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/game";

const MEDALS = ["bg-gold", "bg-silver", "bg-bronze"];

export default function ClassementPage() {
  const { user } = useApp();
  const { data, loading } = useLeaderboard();
  const podium = (data ?? []).slice(0, 3);

  return (
    <div className="md:mx-auto md:max-w-3xl">
      <PageTitle title="Classement" subtitle="Tous les joueurs de cet appareil" />

      {loading && !data ? (
        <div className="mx-4 h-64 md:mx-0 animate-pulse rounded-2xl bg-white/70" />
      ) : (
        <>
          {podium.length > 0 && (
            <div className="clay-court mx-4 flex items-end justify-center gap-3 rounded-3xl px-3 pt-6 pb-0 shadow-md md:mx-0 md:gap-8">
              {[podium[1], podium[0], podium[2]].map((entry, i) =>
                entry ? <PodiumStep key={entry.user.id} entry={entry} height={[88, 120, 64][i]} /> : <div key={i} className="w-24" />,
              )}
            </div>
          )}

          <ol className="mx-4 mt-4 md:mx-0 md:mt-6 overflow-hidden rounded-2xl border border-sand bg-white shadow-sm">
            <li className="grid grid-cols-[2.5rem_1fr_3rem_3rem_4.5rem] md:grid-cols-[3rem_1fr_6rem_6rem_6rem] items-center gap-1 bg-rg px-3 py-2 text-[10px] font-bold tracking-wide text-white/85 uppercase">
              <span>#</span>
              <span>Joueur</span>
              <span className="text-center" title="Bons vainqueurs">
                Justes
              </span>
              <span className="text-center" title="Scores exacts">
                Exacts
              </span>
              <span className="text-right">Points</span>
            </li>
            {(data ?? []).map((e) => {
              const me = e.user.id === user?.id;
              return (
                <li
                  key={e.user.id}
                  className={`grid grid-cols-[2.5rem_1fr_3rem_3rem_4.5rem] md:grid-cols-[3rem_1fr_6rem_6rem_6rem] items-center gap-1 border-t transition-colors hover:bg-cream/60 border-sand px-3 py-2.5 text-sm ${
                    me ? "bg-clay-50" : ""
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                      e.rank <= 3 ? `${MEDALS[e.rank - 1]} text-white` : "bg-cream text-rg-dark"
                    }`}
                  >
                    {e.rank}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={e.user.username} color={e.user.avatarColor} size={30} />
                    <span className="truncate font-semibold">
                      {e.user.username}
                      {me && <span className="ml-1 text-xs font-bold text-clay">(moi)</span>}
                    </span>
                  </span>
                  <span className="text-center text-muted">
                    {e.won}/{e.settled}
                  </span>
                  <span className="text-center font-semibold text-gold">{e.perfect}</span>
                  <span className="text-right font-extrabold text-rg-dark">{formatPoints(e.points)}</span>
                </li>
              );
            })}
          </ol>
          {(data?.length ?? 0) < 2 && (
            <p className="mx-4 mt-4 md:mx-0 rounded-xl bg-white p-4 text-center text-sm text-muted">
              Invite tes amis à créer un compte sur cet appareil pour vous affronter ! Les comptes partagés en ligne
              arriveront avec la base de données.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PodiumStep({ entry, height }: { entry: LeaderboardEntry; height: number }) {
  return (
    <div className="flex w-24 flex-col items-center">
      <Avatar name={entry.user.username} color={entry.user.avatarColor} size={entry.rank === 1 ? 52 : 44} />
      <p className="mt-1 w-full truncate text-center text-xs font-bold text-white drop-shadow">{entry.user.username}</p>
      <p className="text-[11px] font-semibold text-white/90 drop-shadow">{pts(entry.points)}</p>
      <div
        className={`mt-1 flex w-full items-start justify-center rounded-t-xl pt-2 text-2xl font-black text-white shadow-inner ${
          MEDALS[entry.rank - 1] ?? "bg-silver"
        }`}
        style={{ height }}
      >
        {entry.rank}
      </div>
    </div>
  );
}

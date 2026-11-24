"use client";

import Link from "next/link";
import { formatPoints } from "@/lib/format";
import { useApp } from "./AppProvider";
import { Avatar } from "./Avatar";
import { useLeaderboard } from "./hooks";
import { Card, cx } from "./ui";

const MEDALS = ["🥇", "🥈", "🥉"];

export function MiniLeaderboard({ limit = 5 }: { limit?: number }) {
  const { user } = useApp();
  const { data } = useLeaderboard();
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="font-display text-xl font-semibold text-clay-600">🏆 Classement</p>
        <Link href="/classement" className="text-sm font-extrabold text-clay-600 hover:text-clay-700 hover:underline">
          Tout voir
        </Link>
      </div>
      <ol className="space-y-1 px-2 pb-3">
        {(data ?? []).slice(0, limit).map((e) => (
          <li
            key={e.user.id}
            className={cx(
              "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm",
              e.user.id === user?.id && "border-2 border-clay-200 bg-clay-50",
            )}
          >
            <span className="w-6 text-center text-lg" aria-label={`Rang ${e.rank}`}>
              {MEDALS[e.rank - 1] ?? <span className="tabular text-sm font-black text-ink-3">{e.rank}</span>}
            </span>
            <Avatar name={e.user.username} color={e.user.avatarColor} size={30} ring={false} />
            <span className="min-w-0 flex-1 truncate font-bold">{e.user.username}</span>
            <span className="tabular font-display text-base font-semibold text-ink">{formatPoints(e.points)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

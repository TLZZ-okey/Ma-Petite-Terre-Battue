"use client";

import Link from "next/link";
import { formatPoints } from "@/lib/format";
import { useApp } from "./AppProvider";
import { Avatar } from "./Avatar";
import { useLeaderboard } from "./hooks";
import { Card, cx } from "./ui";

export function MiniLeaderboard({ limit = 5 }: { limit?: number }) {
  const { user } = useApp();
  const { data } = useLeaderboard();
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="font-display text-lg font-bold tracking-wide text-court-900 uppercase">Classement</p>
        <Link href="/classement" className="text-xs font-semibold text-clay-600 hover:text-clay-700 hover:underline">
          Tout voir
        </Link>
      </div>
      <ol className="pb-2">
        {(data ?? []).slice(0, limit).map((e) => (
          <li
            key={e.user.id}
            className={cx("flex items-center gap-3 px-5 py-2 text-sm", e.user.id === user?.id && "bg-court-50")}
          >
            <span className="tabular w-4 text-center text-xs font-semibold text-ink-3">{e.rank}</span>
            <Avatar name={e.user.username} color={e.user.avatarColor} size={28} ring={false} />
            <span className="min-w-0 flex-1 truncate font-medium">{e.user.username}</span>
            <span className="tabular font-semibold text-ink">{formatPoints(e.points)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

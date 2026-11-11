"use client";

import Link from "next/link";
import { formatPoints } from "@/lib/format";
import { useApp } from "./AppProvider";
import { Avatar } from "./Avatar";
import { useLeaderboard } from "./hooks";

export function MiniLeaderboard({ limit = 5 }: { limit?: number }) {
  const { user } = useApp();
  const { data } = useLeaderboard();
  return (
    <div className="rounded-2xl border border-sand bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-sand px-4 py-3">
        <p className="text-sm font-extrabold text-rg-dark uppercase">Classement</p>
        <Link href="/classement" className="text-xs font-bold text-clay-dark hover:underline">
          Voir tout
        </Link>
      </div>
      <ol>
        {(data ?? []).slice(0, limit).map((e) => (
          <li
            key={e.user.id}
            className={`flex items-center gap-3 px-4 py-2 text-sm ${e.user.id === user?.id ? "bg-clay-50" : ""}`}
          >
            <span className="w-5 text-center font-extrabold text-muted">{e.rank}</span>
            <Avatar name={e.user.username} color={e.user.avatarColor} size={26} />
            <span className="flex-1 truncate font-semibold">{e.user.username}</span>
            <span className="font-extrabold text-rg-dark">{formatPoints(e.points)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

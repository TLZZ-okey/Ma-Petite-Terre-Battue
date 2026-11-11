"use client";

import { useEffect, useState, type DependencyList } from "react";
import { buildLeaderboard, computeStats, type LeaderboardEntry, type UserStats } from "@/lib/game";
import type { MatchState, Prediction } from "@/lib/types";
import { useApp } from "./AppProvider";

/** Exécute une fonction asynchrone à chaque changement de dépendances. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): { data: T | undefined; loading: boolean } {
  const [state, setState] = useState<{ data: T | undefined; loading: boolean }>({ data: undefined, loading: true });
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fn().then(
      (data) => !cancelled && setState({ data, loading: false }),
      (error) => {
        console.error(error);
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export interface MyPredictions {
  predictions: Prediction[];
  matches: Map<string, MatchState>;
  stats: UserStats;
}

/** Pronostics de l'utilisateur connecté, avec l'état des matchs associés. */
export function useMyPredictions() {
  const { user, repo, matches, now, dataVersion } = useApp();
  return useAsync<MyPredictions>(async () => {
    const predictions = user ? await repo.listPredictions({ userId: user.id }) : [];
    const states = await matches.getMatchesByIds(predictions.map((p) => p.matchId), now);
    const map = new Map(states.map((m) => [m.id, m]));
    return { predictions, matches: map, stats: computeStats(predictions, map) };
  }, [user?.id, dataVersion, now.getTime()]);
}

export function useLeaderboard() {
  const { repo, matches, now, dataVersion } = useApp();
  return useAsync<LeaderboardEntry[]>(async () => {
    const [users, predictions] = await Promise.all([repo.listUsers(), repo.listPredictions()]);
    const ids = [...new Set(predictions.map((p) => p.matchId))];
    const states = await matches.getMatchesByIds(ids, now);
    return buildLeaderboard(users, predictions, new Map(states.map((m) => [m.id, m])));
  }, [dataVersion, now.getTime()]);
}

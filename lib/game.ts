import { possibleSets, scorePrediction, type PredictionOutcome } from "./scoring";
import type { MatchState, Prediction, PublicUser } from "./types";

/** Vérifie qu'un pronostic peut être enregistré pour ce match. Renvoie un message d'erreur sinon. */
export function validatePrediction(
  match: MatchState,
  winnerId: string,
  sets: number | null,
): string | null {
  if (match.status !== "upcoming") return "Le match a commencé : les pronostics sont fermés.";
  if (winnerId !== match.player1.id && winnerId !== match.player2.id) return "Joueur inconnu.";
  if (sets !== null && !possibleSets(match.bestOf).includes(sets)) return "Nombre de sets invalide.";
  return null;
}

export interface UserStats {
  points: number;
  total: number;
  settled: number;
  won: number;
  perfect: number;
}

export interface LeaderboardEntry extends UserStats {
  user: PublicUser;
  rank: number;
}

export function emptyStats(): UserStats {
  return { points: 0, total: 0, settled: 0, won: 0, perfect: 0 };
}

export function computeStats(predictions: Prediction[], matches: Map<string, MatchState>): UserStats {
  const stats = emptyStats();
  for (const p of predictions) {
    const match = matches.get(p.matchId);
    if (!match) continue;
    stats.total++;
    const { outcome, points } = scorePrediction(match, p);
    if (outcome === "pending") continue;
    stats.settled++;
    stats.points += points;
    if (outcome === "won" || outcome === "perfect") stats.won++;
    if (outcome === "perfect") stats.perfect++;
  }
  stats.points = Math.round(stats.points * 100) / 100;
  return stats;
}

/** Classement : points, puis nombre de sets exacts, puis bons pronostics. Ex aequo = même rang. */
export function buildLeaderboard(
  users: PublicUser[],
  predictions: Prediction[],
  matches: Map<string, MatchState>,
): LeaderboardEntry[] {
  const byUser = new Map<string, Prediction[]>();
  for (const p of predictions) byUser.set(p.userId, [...(byUser.get(p.userId) ?? []), p]);

  const entries = users
    .map((user) => ({ user, rank: 0, ...computeStats(byUser.get(user.id) ?? [], matches) }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.perfect - a.perfect ||
        b.won - a.won ||
        a.user.username.localeCompare(b.user.username, "fr"),
    );

  entries.forEach((e, i) => {
    const prev = entries[i - 1];
    e.rank =
      prev && prev.points === e.points && prev.perfect === e.perfect && prev.won === e.won ? prev.rank : i + 1;
  });
  return entries;
}

export type { PredictionOutcome };

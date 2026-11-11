import type { MatchState } from "../types";

/**
 * Source des matchs et des cotes.
 *
 * V1 : `mockProvider` génère un programme fictif en local.
 * Plus tard : un provider branché sur une API de cotes implémentera ce même contrat.
 */
export interface MatchProvider {
  /** Matchs d'une journée (clé YYYY-MM-DD), avec statut et résultat à l'instant `now`. */
  getMatchesForDay(day: string, now: Date): Promise<MatchState[]>;
  /** Matchs par identifiant (les identifiants inconnus sont ignorés). */
  getMatchesByIds(ids: string[], now: Date): Promise<MatchState[]>;
}

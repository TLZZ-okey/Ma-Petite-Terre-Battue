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
  /**
   * Matchs prévus ce jour-là mais dont les joueurs ne sont pas encore connus
   * (vainqueurs du tour précédent attendus). Facultatif : seules les sources qui
   * connaissent le tableau à l'avance (matchs de démo) le fournissent.
   */
  getPendingRounds?(day: string, now: Date): Promise<PendingRound[]>;
}

export interface PendingRound {
  /** Tour en attente, ex. « Finale ». */
  round: string;
  /** Nombre de matchs de ce tour prévus ce jour-là. */
  count: number;
  /** Tour dont on attend les vainqueurs, ex. « Demi-finales ». */
  waitingFor: string | null;
  /** Heure prévue du premier de ces matchs (ISO). */
  startTime: string;
}

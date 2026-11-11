import type { MatchState, Prediction } from "./types";

/**
 * Règles de calcul des points :
 * - mauvais vainqueur : 0 point ;
 * - bon vainqueur : autant de points que la cote du vainqueur ;
 * - bon vainqueur ET nombre de sets exact : le double de la cote du vainqueur.
 */
export const EXACT_SETS_MULTIPLIER = 2;

export type PredictionOutcome = "pending" | "lost" | "won" | "perfect";

export interface PredictionScore {
  outcome: PredictionOutcome;
  points: number;
}

export function roundPoints(value: number): number {
  return Math.round(value * 100) / 100;
}

export function oddsFor(match: Pick<MatchState, "player1" | "odds1" | "odds2">, playerId: string): number {
  return playerId === match.player1.id ? match.odds1 : match.odds2;
}

export function scorePrediction(match: MatchState, prediction: Pick<Prediction, "winnerId" | "sets">): PredictionScore {
  if (match.status !== "finished" || !match.result) {
    return { outcome: "pending", points: 0 };
  }
  const { winnerId, sets } = match.result;
  if (prediction.winnerId !== winnerId) {
    return { outcome: "lost", points: 0 };
  }
  const odds = oddsFor(match, winnerId);
  if (prediction.sets !== null && prediction.sets === sets) {
    return { outcome: "perfect", points: roundPoints(odds * EXACT_SETS_MULTIPLIER) };
  }
  return { outcome: "won", points: roundPoints(odds) };
}

/** Gains possibles si le pronostic s'avère juste (affichés avant le match). */
export function potentialPoints(
  match: Pick<MatchState, "player1" | "odds1" | "odds2">,
  prediction: Pick<Prediction, "winnerId" | "sets">,
): { winner: number; exact: number | null } {
  const odds = oddsFor(match, prediction.winnerId);
  return {
    winner: roundPoints(odds),
    exact: prediction.sets !== null ? roundPoints(odds * EXACT_SETS_MULTIPLIER) : null,
  };
}

/** Nombres de sets possibles selon le format du match. */
export function possibleSets(bestOf: 3 | 5): number[] {
  return bestOf === 5 ? [3, 4, 5] : [2, 3];
}

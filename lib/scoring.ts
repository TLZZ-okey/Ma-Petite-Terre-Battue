import type { MatchState, Prediction } from "./types";

/**
 * Règles de calcul des points :
 * - mauvais vainqueur : 0 point ;
 * - bon vainqueur : la cote du vainqueur × 20, arrondie (cote 2,00 → 40 points) ;
 * - bon vainqueur ET score en sets exact (ex. 2-1) : ces points × 1,5, arrondis (40 → 60 points).
 */
export const POINTS_PER_ODDS_UNIT = 20;
export const EXACT_SCORE_MULTIPLIER = 1.5;

export type PredictionOutcome = "pending" | "lost" | "won" | "perfect";

export interface PredictionScore {
  outcome: PredictionOutcome;
  points: number;
}

/** Points gagnés pour un bon vainqueur : cote × 20, arrondi à l'entier. */
export function oddsToPoints(odds: number): number {
  return Math.round(odds * POINTS_PER_ODDS_UNIT);
}

/** Points gagnés avec le score exact : points de base × 1,5, arrondi à l'entier. */
export function exactScorePoints(basePoints: number): number {
  return Math.round(basePoints * EXACT_SCORE_MULTIPLIER);
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
  const points = oddsToPoints(oddsFor(match, winnerId));
  if (prediction.sets !== null && prediction.sets === sets) {
    return { outcome: "perfect", points: exactScorePoints(points) };
  }
  return { outcome: "won", points };
}

/** Gains possibles si le pronostic s'avère juste (affichés avant le match). */
export function potentialPoints(
  match: Pick<MatchState, "player1" | "odds1" | "odds2">,
  prediction: Pick<Prediction, "winnerId" | "sets">,
): { winner: number; exact: number | null } {
  const points = oddsToPoints(oddsFor(match, prediction.winnerId));
  return { winner: points, exact: prediction.sets !== null ? exactScorePoints(points) : null };
}

/** Nombre de sets à remporter pour gagner le match. */
export function setsToWin(bestOf: 3 | 5): number {
  return bestOf === 5 ? 3 : 2;
}

/** Nombres de sets possibles selon le format du match. */
export function possibleSets(bestOf: 3 | 5): number[] {
  return bestOf === 5 ? [3, 4, 5] : [2, 3];
}

/** Score en sets [joueur 1, joueur 2]. */
export type SetScore = [number, number];

/**
 * Vérifie la cohérence d'un score en sets saisi par l'utilisateur.
 * En 2 sets gagnants : 2-0, 2-1, 0-2 ou 1-2 uniquement (jamais 2-2, ni 1-1, ni 3-0…).
 */
export function validateSetScore(bestOf: 3 | 5, score: [number | null, number | null]): string | null {
  const need = setsToWin(bestOf);
  const [a, b] = score;
  if (a === null || b === null) return "Indique le nombre de sets de chaque joueur.";
  if (![a, b].every((n) => Number.isInteger(n) && n >= 0)) return "Les scores doivent être des nombres entiers positifs.";
  if (a > need || b > need) return `Un joueur ne peut pas gagner plus de ${need} sets.`;
  if (a === need && b === need) return "Les deux joueurs ne peuvent pas gagner le match.";
  if (a !== need && b !== need) return `Le vainqueur doit remporter ${need} sets.`;
  return null;
}

/** Convertit un score valide en pronostic (vainqueur + nombre total de sets). */
export function predictionFromScore(
  match: Pick<MatchState, "player1" | "player2">,
  score: SetScore,
): Pick<Prediction, "winnerId" | "sets"> {
  const p1Wins = score[0] > score[1];
  return { winnerId: p1Wins ? match.player1.id : match.player2.id, sets: score[0] + score[1] };
}

/** Score en sets correspondant à un pronostic (null si le nombre de sets n'est pas renseigné). */
export function scoreFromPrediction(
  match: Pick<MatchState, "player1" | "bestOf">,
  prediction: Pick<Prediction, "winnerId" | "sets">,
): SetScore | null {
  if (prediction.sets === null) return null;
  const need = setsToWin(match.bestOf);
  const loser = prediction.sets - need;
  return prediction.winnerId === match.player1.id ? [need, loser] : [loser, need];
}

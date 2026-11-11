/**
 * Modèle de données de l'application.
 * Ces types sont volontairement indépendants de la source des données
 * (mock local aujourd'hui, API de cotes + base de données demain).
 */

export type Tour = "ATP" | "WTA";

export type Surface = "terre-battue" | "dur" | "gazon" | "indoor";

export type TournamentCategory =
  | "Grand Chelem"
  | "Masters 1000"
  | "WTA 1000"
  | "500"
  | "250"
  | "Finales";

export interface Player {
  id: string;
  name: string;
  /** Code pays ISO 3166-1 alpha-2 (pour le drapeau). */
  country: string;
  ranking: number;
  tour: Tour;
}

export interface Tournament {
  id: string;
  name: string;
  city: string;
  surface: Surface;
  category: TournamentCategory;
}

export interface MatchResult {
  winnerId: string;
  /** Nombre total de sets joués. */
  sets: number;
  /** Score par set, du point de vue du vainqueur du match, ex. ["6-4", "3-6", "7-6"]. */
  score: string[];
}

export type MatchStatus = "upcoming" | "live" | "finished";

export interface Match {
  id: string;
  tournament: Tournament;
  tour: Tour;
  round: string;
  court: string;
  /** Date ISO du début du match. */
  startTime: string;
  bestOf: 3 | 5;
  player1: Player;
  player2: Player;
  /** Cote décimale du joueur 1. */
  odds1: number;
  /** Cote décimale du joueur 2. */
  odds2: number;
}

/** Un match enrichi de son statut et de son résultat à un instant donné. */
export interface MatchState extends Match {
  status: MatchStatus;
  result: MatchResult | null;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  avatarColor: string;
  createdAt: string;
}

/** Utilisateur sans les données sensibles, exposé à l'interface. */
export type PublicUser = Omit<User, "passwordHash" | "salt">;

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  winnerId: string;
  /** Nombre de sets pronostiqué (optionnel). */
  sets: number | null;
  createdAt: string;
  updatedAt: string;
}

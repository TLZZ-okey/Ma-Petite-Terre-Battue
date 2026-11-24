import { oddsFor, scorePrediction } from "./scoring";
import type { MatchState, Prediction } from "./types";

/**
 * Mécaniques de jeu : niveaux, séries et badges.
 * Tout est calculé à partir des pronostics et des matchs : rien de plus à stocker.
 */

/* ------------------------------------------------------------------ */
/* Niveaux                                                              */
/* ------------------------------------------------------------------ */

export interface Level {
  /** Numéro de niveau (1, 2, 3…). */
  level: number;
  title: string;
  emoji: string;
  /** Points nécessaires pour atteindre ce niveau. */
  min: number;
}

export const LEVELS: Level[] = [
  { level: 1, title: "Ramasseur de balles", emoji: "🎾", min: 0 },
  { level: 2, title: "Juge de ligne", emoji: "🧢", min: 50 },
  { level: 3, title: "Joueur de club", emoji: "🏸", min: 150 },
  { level: 4, title: "Espoir", emoji: "🌱", min: 300 },
  { level: 5, title: "Tête de série", emoji: "⭐", min: 500 },
  { level: 6, title: "Top 10", emoji: "🔥", min: 800 },
  { level: 7, title: "Champion", emoji: "🏆", min: 1200 },
  { level: 8, title: "Légende de la terre battue", emoji: "👑", min: 1800 },
];

export interface LevelProgress {
  current: Level;
  next: Level | null;
  /** Avancement vers le niveau suivant, de 0 à 1 (1 au niveau maximal). */
  progress: number;
  /** Points restants avant le niveau suivant (0 au niveau maximal). */
  toNext: number;
}

export function levelFor(points: number): LevelProgress {
  const p = Math.max(0, points);
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (p >= LEVELS[i].min) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  if (!next) return { current, next, progress: 1, toNext: 0 };
  return {
    current,
    next,
    progress: (p - current.min) / (next.min - current.min),
    toNext: Math.ceil(next.min - p),
  };
}

/* ------------------------------------------------------------------ */
/* Séries                                                               */
/* ------------------------------------------------------------------ */

export interface Streaks {
  /** Bons pronostics consécutifs les plus récents (0 si le dernier est raté). */
  current: number;
  best: number;
}

/** Séries de bons vainqueurs, dans l'ordre chronologique des matchs terminés. */
export function computeStreaks(predictions: Prediction[], matches: Map<string, MatchState>): Streaks {
  const settled = predictions
    .map((p) => ({ p, m: matches.get(p.matchId) }))
    .filter((x): x is { p: Prediction; m: MatchState } => !!x.m && x.m.status === "finished" && !!x.m.result)
    .sort((a, b) => a.m.startTime.localeCompare(b.m.startTime));

  let current = 0;
  let best = 0;
  for (const { p, m } of settled) {
    const { outcome } = scorePrediction(m, p);
    current = outcome === "won" || outcome === "perfect" ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { current, best };
}

/* ------------------------------------------------------------------ */
/* Badges                                                               */
/* ------------------------------------------------------------------ */

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  /** Avancement vers le badge, ex. « 3/5 » (absent si sans objet). */
  progress?: { value: number; target: number };
}

/** Cote à partir de laquelle un vainqueur est considéré comme un outsider. */
export const UNDERDOG_ODDS = 2.5;

export function computeAchievements(predictions: Prediction[], matches: Map<string, MatchState>): Achievement[] {
  let won = 0;
  let perfect = 0;
  let underdog = 0;
  for (const p of predictions) {
    const m = matches.get(p.matchId);
    if (!m) continue;
    const { outcome } = scorePrediction(m, p);
    if (outcome === "won" || outcome === "perfect") {
      won++;
      if (oddsFor(m, p.winnerId) >= UNDERDOG_ODDS) underdog++;
    }
    if (outcome === "perfect") perfect++;
  }
  const { best } = computeStreaks(predictions, matches);
  const total = predictions.length;

  const badge = (
    id: string,
    emoji: string,
    title: string,
    description: string,
    value: number,
    target: number,
  ): Achievement => ({
    id,
    emoji,
    title,
    description,
    unlocked: value >= target,
    progress: target > 1 ? { value: Math.min(value, target), target } : undefined,
  });

  return [
    badge("first", "🎾", "Premier service", "Faire son premier prono", total, 1),
    badge("eye", "👀", "Bon œil", "Trouver un premier vainqueur", won, 1),
    badge("bullseye", "🎯", "Dans le mille", "Trouver un score exact", perfect, 1),
    badge("flair", "🦊", "Flair d'outsider", `Trouver un vainqueur à une cote d'au moins ${UNDERDOG_ODDS.toLocaleString("fr-FR")}`, underdog, 1),
    badge("fire", "🔥", "En feu", "Enchaîner 3 bons pronos", best, 3),
    badge("regular", "📅", "Assidu", "Faire 10 pronos", total, 10),
    badge("sniper", "🏹", "Sniper", "Trouver 3 scores exacts", perfect, 3),
    badge("pro", "🏆", "Pro du court", "Trouver 10 vainqueurs", won, 10),
  ];
}

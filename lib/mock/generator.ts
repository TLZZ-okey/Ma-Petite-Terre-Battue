import { PLAYERS } from "../data/players";
import { MOCK_TOURNAMENT } from "../data/tournaments";
import { addDays, dayKey, parseDayKey, weekday } from "../dates";
import { createRng, shuffle } from "../random";
import type { Match, MatchResult, MatchState, Player, Tour } from "../types";

/**
 * Générateur de matchs de démonstration, 100 % déterministe :
 * une même semaine produit toujours le même tableau, les mêmes cotes
 * et les mêmes résultats. Aucune donnée n'a besoin d'être stockée et
 * tous les appareils voient le même tournoi.
 *
 * Chaque semaine, un tableau de Roland-Garros (tableau masculin) à 16 joueurs :
 * les vainqueurs passent au tour suivant, jusqu'à la finale du dimanche.
 * Un match n'est affiché qu'une fois ses deux joueurs connus (voir `feederIds`).
 */

const TOUR: Tour = "ATP";

/** Tours du tableau à 16 (index 0 à 3). */
export const ROUNDS = ["8es de finale", "Quarts de finale", "Demi-finales", "Finale"] as const;

/** Nombre de matchs par tour : 8, 4, 2, 1. */
const MATCHES_PER_ROUND = [8, 4, 2, 1];

/**
 * Programme de la semaine (lundi = 0) : tour joué et matchs de ce tour (positions dans le tableau).
 * Chaque match a lieu au plus tôt le lendemain des matchs dont il attend les vainqueurs.
 */
const SCHEDULE: Array<{ round: number; slots: number[] }> = [
  { round: 0, slots: [0, 1, 2, 3] }, // lundi : 8es, haut du tableau
  { round: 0, slots: [4, 5, 6, 7] }, // mardi : 8es, bas du tableau
  { round: 1, slots: [0, 1] }, // mercredi : quarts, haut
  { round: 1, slots: [2, 3] }, // jeudi : quarts, bas
  { round: 2, slots: [0] }, // vendredi : 1re demi-finale
  { round: 2, slots: [1] }, // samedi : 2e demi-finale
  { round: 3, slots: [0] }, // dimanche : finale
];

/** Horaires selon le nombre de matchs du jour. */
const TIMES: Record<number, Array<[number, number]>> = {
  4: [[11, 0], [13, 30], [16, 0], [20, 0]],
  2: [[14, 0], [20, 0]],
  1: [[15, 0]],
};

/** Courts selon l'ordre de passage (la session de nuit de 20h se joue sur le Central). */
const COURTS: Record<number, string[]> = {
  4: ["Court Suzanne-Lenglen", "Court Philippe-Chatrier", "Court Simonne-Mathieu", "Court Philippe-Chatrier"],
  2: ["Court Philippe-Chatrier", "Court Philippe-Chatrier"],
  1: ["Court Philippe-Chatrier"],
};

/**
 * Placement des têtes de série dans un tableau à 16 (n° de tête de série par position) :
 * la n°1 et la n°2 ne peuvent se rencontrer qu'en finale, les 4 premières qu'en demies.
 */
const SEED_POSITIONS = [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15];

const BOOKMAKER_MARGIN = 1.06;

export function matchId(day: string, tour: Tour, index: number): string {
  return `${day}_${tour}_${index}`;
}

export function parseMatchId(id: string): { day: string; tour: Tour; index: number } | null {
  const m = /^(\d{4}-\d{2}-\d{2})_(ATP|WTA)_(\d+)$/.exec(id);
  if (!m) return null;
  return { day: m[1], tour: m[2] as Tour, index: Number(m[3]) };
}

function strength(p: Player): number {
  return 1 / Math.sqrt(p.ranking ?? 100);
}

/** Probabilité (sans marge) que le joueur 1 batte le joueur 2. */
export function winProbability(p1: Player, p2: Player, noise = 0): number {
  const raw = strength(p1) / (strength(p1) + strength(p2)) + noise;
  return Math.min(0.94, Math.max(0.06, raw));
}

export function probabilityToOdds(p: number): number {
  return Math.max(1.01, Math.round((1 / (p * BOOKMAKER_MARGIN)) * 100) / 100);
}

/** Lundi (clé YYYY-MM-DD) de la semaine d'un jour donné. */
export function mondayOf(day: string): string {
  const date = parseDayKey(day);
  return dayKey(addDays(date, -weekday(date)));
}

/** Jour et ordre de passage d'un match du tableau (tour, position). */
function placeOf(round: number, slot: number): { dayOffset: number; index: number; count: number } {
  const dayOffset = SCHEDULE.findIndex((d) => d.round === round && d.slots.includes(slot));
  const { slots } = SCHEDULE[dayOffset];
  return { dayOffset, index: slots.indexOf(slot), count: slots.length };
}

/** Tirage au sort de la semaine : 16 joueurs placés selon leur classement. */
function drawOfWeek(monday: string): Player[] {
  const rng = createRng(`${monday}:tableau`);
  const seeds = shuffle(rng, PLAYERS)
    .slice(0, 16)
    .sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
  return SEED_POSITIONS.map((seed) => seeds[seed - 1]);
}

interface BracketMatch {
  match: Match;
  round: number;
  /** Identifiants des matchs dont il attend les vainqueurs (vide pour les 8es). */
  feeders: string[];
}

const weekCache = new Map<string, Map<string, BracketMatch>>();

/**
 * Tableau complet d'une semaine (15 matchs). Les joueurs des tours suivants sont les
 * vainqueurs (simulés, donc toujours les mêmes) des matchs précédents.
 */
function buildWeek(monday: string): Map<string, BracketMatch> {
  const cached = weekCache.get(monday);
  if (cached) return cached;

  const mondayDate = parseDayKey(monday);
  const draw = drawOfWeek(monday);
  const bySlot: Match[][] = [];
  const byId = new Map<string, BracketMatch>();

  for (let round = 0; round < ROUNDS.length; round++) {
    bySlot[round] = [];
    for (let slot = 0; slot < MATCHES_PER_ROUND[round]; slot++) {
      const { dayOffset, index, count } = placeOf(round, slot);
      const date = addDays(mondayDate, dayOffset);
      const day = dayKey(date);
      const id = matchId(day, TOUR, index);

      let player1: Player;
      let player2: Player;
      let feeders: string[] = [];
      if (round === 0) {
        player1 = draw[slot * 2];
        player2 = draw[slot * 2 + 1];
      } else {
        const [a, b] = [bySlot[round - 1][slot * 2], bySlot[round - 1][slot * 2 + 1]];
        feeders = [a.id, b.id];
        const winnerOf = (m: Match) => (simulateResult(m).winnerId === m.player1.id ? m.player1 : m.player2);
        player1 = winnerOf(a);
        player2 = winnerOf(b);
      }

      const rng = createRng(`${id}:cotes`);
      const p = winProbability(player1, player2, (rng() - 0.5) * 0.12);
      const [h, min] = TIMES[count][index];
      const match: Match = {
        id,
        tournament: MOCK_TOURNAMENT,
        tour: TOUR,
        round: ROUNDS[round],
        court: COURTS[count][index],
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min).toISOString(),
        bestOf: 5, // Grand Chelem masculin : 3 sets gagnants
        player1,
        player2,
        odds1: probabilityToOdds(p),
        odds2: probabilityToOdds(1 - p),
      };
      bySlot[round][slot] = match;
      byId.set(id, { match, round, feeders });
    }
  }

  if (weekCache.size > 20) weekCache.clear();
  weekCache.set(monday, byId);
  return byId;
}

/** Tous les matchs d'une semaine (lundi → dimanche), sans tenir compte de leur visibilité. */
export function generateWeek(day: string): Match[] {
  return [...buildWeek(mondayOf(day)).values()].map((b) => b.match);
}

/** Matchs programmés un jour donné (clé YYYY-MM-DD), dans l'ordre de passage. */
export function generateDay(day: string): Match[] {
  return generateWeek(day)
    .filter((m) => m.id.startsWith(`${day}_`))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function generateMatch(id: string): Match | undefined {
  const parsed = parseMatchId(id);
  if (!parsed) return undefined;
  return buildWeek(mondayOf(parsed.day)).get(id)?.match;
}

/** Matchs dont un match attend les vainqueurs (vide pour les 8es de finale). */
export function feederIds(id: string): string[] {
  const parsed = parseMatchId(id);
  if (!parsed) return [];
  return buildWeek(mondayOf(parsed.day)).get(id)?.feeders ?? [];
}

/** Tour précédent d'un tour donné (ex. « Finale » → « Demi-finales »). */
export function previousRound(round: string): string | null {
  const i = ROUNDS.indexOf(round as (typeof ROUNDS)[number]);
  return i > 0 ? ROUNDS[i - 1] : null;
}

/** Durée simulée d'un match, en millisecondes. */
export function matchDuration(bestOf: 3 | 5): number {
  return (bestOf === 5 ? 210 : 120) * 60_000;
}

function setScore(rng: () => number): [number, number] {
  const r = rng();
  if (r < 0.15) return [7, 6];
  if (r < 0.27) return [7, 5];
  return [6, Math.floor(rng() * 5)];
}

/** Résultat simulé (déterministe) d'un match. */
export function simulateResult(match: Match): MatchResult {
  const rng = createRng(`${match.id}:result`);
  const p1 = 1 / match.odds1 / (1 / match.odds1 + 1 / match.odds2);
  const p1Wins = rng() < p1;
  const winner = p1Wins ? match.player1 : match.player2;
  const favouriteWon = (p1Wins ? p1 : 1 - p1) >= 0.5;

  const needed = match.bestOf === 5 ? 3 : 2;
  let sets: number;
  const r = rng();
  if (match.bestOf === 3) {
    sets = r < (favouriteWon ? 0.62 : 0.45) ? 2 : 3;
  } else {
    sets = r < (favouriteWon ? 0.42 : 0.25) ? 3 : r < 0.75 ? 4 : 5;
  }

  // Sets gagnés par le vainqueur : le dernier set + (needed - 1) répartis au hasard.
  const lost = sets - needed;
  const firstSets = shuffle(rng, [
    ...Array<boolean>(needed - 1).fill(true),
    ...Array<boolean>(lost).fill(false),
  ]);
  const score = [...firstSets, true].map((winnerTookSet) => {
    const [a, b] = setScore(rng);
    return winnerTookSet ? `${a}-${b}` : `${b}-${a}`;
  });

  return { winnerId: winner.id, sets, score };
}

/** Calcule le statut et le résultat d'un match à l'instant `now`. */
export function resolveMatch(match: Match, now: Date, override?: MatchResult): MatchState {
  const start = new Date(match.startTime).getTime();
  const end = start + matchDuration(match.bestOf);
  const t = now.getTime();

  if (override) return { ...match, status: "finished", result: override };
  if (t < start) return { ...match, status: "upcoming", result: null };
  if (t < end) return { ...match, status: "live", result: null };
  return { ...match, status: "finished", result: simulateResult(match) };
}

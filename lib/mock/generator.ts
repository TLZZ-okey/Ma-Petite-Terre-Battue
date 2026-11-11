import { PLAYERS } from "../data/players";
import { TOURNAMENTS } from "../data/tournaments";
import { parseDayKey, weekIndex, weekday } from "../dates";
import { createRng, shuffle } from "../random";
import type { Match, MatchResult, MatchState, Player, Tour } from "../types";

/**
 * Générateur de matchs de démonstration, 100 % déterministe :
 * un même jour produit toujours les mêmes matchs, les mêmes cotes
 * et (une fois le match terminé) le même résultat. Aucune donnée n'a
 * donc besoin d'être stockée et tous les appareils voient le même programme.
 */

const TOURS: Tour[] = ["ATP", "WTA"];

/** Programme type selon le jour de la semaine (lundi = 0). */
const DAY_PROGRAM: Array<{ round: string; count: number }> = [
  { round: "1er tour", count: 4 },
  { round: "1er tour", count: 4 },
  { round: "2e tour", count: 4 },
  { round: "8es de finale", count: 4 },
  { round: "Quarts de finale", count: 4 },
  { round: "Demi-finales", count: 2 },
  { round: "Finale", count: 1 },
];

const SLOTS: Record<Tour, Array<[number, number]>> = {
  ATP: [[11, 0], [13, 30], [16, 0], [20, 0]],
  WTA: [[12, 0], [14, 30], [17, 30], [19, 0]],
};
const SHORT_DAY_SLOTS: Record<Tour, Array<[number, number]>> = {
  ATP: [[15, 0], [20, 0]],
  WTA: [[13, 0], [17, 30]],
};

const COURTS: Record<string, string[]> = {
  "Grand Chelem": ["Court Philippe-Chatrier", "Court Suzanne-Lenglen", "Court Simonne-Mathieu", "Court 14"],
  default: ["Court Central", "Court 1", "Court 2", "Court 3"],
};

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
  return 1 / Math.sqrt(p.ranking);
}

/** Probabilité (sans marge) que le joueur 1 batte le joueur 2. */
export function winProbability(p1: Player, p2: Player, noise = 0): number {
  const raw = strength(p1) / (strength(p1) + strength(p2)) + noise;
  return Math.min(0.94, Math.max(0.06, raw));
}

export function probabilityToOdds(p: number): number {
  return Math.max(1.01, Math.round((1 / (p * BOOKMAKER_MARGIN)) * 100) / 100);
}

/** Génère tous les matchs d'un jour donné (clé YYYY-MM-DD). */
export function generateDay(day: string): Match[] {
  const date = parseDayKey(day);
  const week = weekIndex(date);
  const program = DAY_PROGRAM[weekday(date)];
  const matches: Match[] = [];

  for (const tour of TOURS) {
    const tournaments = TOURNAMENTS[tour];
    const tournament = tournaments[(week + (tour === "WTA" ? 3 : 0)) % tournaments.length];
    const rng = createRng(`${day}:${tour}`);
    const players = shuffle(rng, PLAYERS[tour]);
    const slots = program.count <= 2 ? SHORT_DAY_SLOTS[tour] : SLOTS[tour];
    const courts = COURTS[tournament.category] ?? COURTS.default;

    for (let i = 0; i < program.count; i++) {
      const player1 = players[i * 2];
      const player2 = players[i * 2 + 1];
      const p = winProbability(player1, player2, (rng() - 0.5) * 0.12);
      const [h, min] = slots[i % slots.length];
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min);
      const bestOf: 3 | 5 = tournament.category === "Grand Chelem" && tour === "ATP" ? 5 : 3;

      matches.push({
        id: matchId(day, tour, i),
        tournament,
        tour,
        round: program.round,
        court: program.count === 1 ? courts[0] : courts[i % courts.length],
        startTime: start.toISOString(),
        bestOf,
        player1,
        player2,
        odds1: probabilityToOdds(p),
        odds2: probabilityToOdds(1 - p),
      });
    }
  }

  return matches.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
}

export function generateMatch(id: string): Match | undefined {
  const parsed = parseMatchId(id);
  if (!parsed) return undefined;
  return generateDay(parsed.day).find((m) => m.id === id);
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

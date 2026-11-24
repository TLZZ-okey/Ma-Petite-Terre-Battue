import { setsToWin } from "../scoring";
import type { MatchResult, MatchState } from "../types";
import type { MatchStore, StoreData, StoredMatch } from "./matchStore";
import { activeTennisKeys, eventToMatch, getTennisOdds, listSports, type Fetcher } from "./oddsApi";
import { fetchTennisMatch, fetchTennisMatches, findScoreMatch, matchSlug, type ScoreMatch } from "./sportscore";

export interface SyncConfig {
  apiKey: string | undefined;
  fetcher: Fetcher;
  store: MatchStore;
  /** Délai minimal entre deux mises à jour des cotes (The Odds API). */
  oddsTtlMs: number;
  /** Délai minimal entre deux mises à jour des scores (SportScore). */
  scoresTtlMs: number;
  now?: () => Date;
}

/** Nombre maximal de consultations « détail » par mise à jour (quota SportScore). */
const MAX_DETAIL_LOOKUPS = 5;

/** Durée minimale d'un match avant de chercher son résultat dans le détail. */
const MIN_MATCH_DURATION_MS = 75 * 60_000;

/** Au-delà de ce délai sans résultat, on arrête de chercher le score d'un match. */
const SCORE_LOOKBACK_MS = 4 * 24 * 3600_000;

const isStale = (iso: string | null, ttl: number, now: Date) => !iso || now.getTime() - Date.parse(iso) >= ttl;

function needsScores(data: StoreData, now: Date): boolean {
  const t = now.getTime();
  return Object.values(data.matches).some(({ match, result }) => {
    const start = Date.parse(match.startTime);
    return !result && start <= t && start > t - SCORE_LOOKBACK_MS;
  });
}

async function syncOdds(cfg: SyncConfig, data: StoreData, now: Date) {
  const { data: sports, quota } = await listSports(cfg.fetcher, cfg.apiKey!);
  data.meta.quota = quota;
  const keys = activeTennisKeys(sports);
  data.meta.activeTournaments = keys;

  for (const key of keys) {
    const { data: events, quota: q } = await getTennisOdds(cfg.fetcher, cfg.apiKey!, key);
    data.meta.quota = q;
    for (const event of events) {
      const match = eventToMatch(event);
      if (!match) continue;
      const existing = data.matches[match.id];
      // Une fois le match commencé, ses cotes sont figées (pas de cotes « en direct »).
      if (existing && Date.parse(existing.match.startTime) <= now.getTime()) continue;
      data.matches[match.id] = { match, result: existing?.result ?? null };
    }
  }
  data.meta.lastOddsSync = now.toISOString();
}

/** Calcule le résultat d'un match à partir du score SportScore (null si incomplet). */
export function resultFromScore(stored: StoredMatch, score: ScoreMatch, swapped: boolean): MatchResult | null {
  if (score.status !== "finished") return null;
  const { match } = stored;
  const p1Sets = swapped ? score.awaySets : score.homeSets;
  const p2Sets = swapped ? score.homeSets : score.awaySets;
  const periods = score.periods.map(([h, a]) => (swapped ? [a, h] : [h, a]) as [number, number]);

  let p1Wins: boolean | null = null;
  if (score.winner) p1Wins = (score.winner === "home") !== swapped;
  else if (p1Sets !== null && p2Sets !== null && p1Sets !== p2Sets) p1Wins = p1Sets > p2Sets;
  if (p1Wins === null) return null;

  const need = setsToWin(match.bestOf);
  const winnerSets = (p1Wins ? p1Sets : p2Sets) ?? need;
  const loserSets = (p1Wins ? p2Sets : p1Sets) ?? 0;
  return {
    winnerId: p1Wins ? match.player1.id : match.player2.id,
    sets: winnerSets + loserSets,
    score: periods.map(([a, b]) => (p1Wins ? `${a}-${b}` : `${b}-${a}`)),
  };
}

async function syncScores(cfg: SyncConfig, data: StoreData, now: Date) {
  const { matches: candidates, sample } = await fetchTennisMatches(cfg.fetcher);
  data.meta.scoresSample = sample;
  const t = now.getTime();
  let lookups = 0;
  for (const stored of Object.values(data.matches)) {
    const start = Date.parse(stored.match.startTime);
    if (stored.result || start > t || start <= t - SCORE_LOOKBACK_MS) continue;
    let found = findScoreMatch(stored.match.player1.name, stored.match.player2.name, stored.match.startTime, candidates);
    // Absent des 50 derniers matchs (jours chargés) : on consulte son détail, avec parcimonie.
    if (!found && lookups < MAX_DETAIL_LOOKUPS && t - start >= MIN_MATCH_DURATION_MS) {
      lookups++;
      const detail = await fetchTennisMatch(cfg.fetcher, matchSlug(stored.match.player1.name, stored.match.player2.name));
      if (detail) found = findScoreMatch(stored.match.player1.name, stored.match.player2.name, stored.match.startTime, [detail]);
    }
    if (!found) continue;
    const result = resultFromScore(stored, found.match, found.swapped);
    if (result) stored.result = result;
  }
  data.meta.lastScoresSync = now.toISOString();
}

/** Message d'erreur lisible, y compris pour les erreurs réseau (« fetch failed »). */
export function describeError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const cause = (e as Error & { cause?: { code?: string; message?: string } }).cause;
  if (e.message === "fetch failed") {
    const detail = cause?.code ?? cause?.message ?? "raison inconnue";
    return `Impossible de joindre l'API (${detail}) : vérifie la connexion Internet du serveur.`;
  }
  return e.message;
}

let inFlight: Promise<StoreData> | null = null;

/**
 * Met à jour les données si elles sont trop anciennes, puis les renvoie.
 * Les appels simultanés partagent la même mise à jour (économie de quota).
 * En cas d'erreur d'une API, on renvoie les dernières données connues.
 */
export function refresh(cfg: SyncConfig): Promise<StoreData> {
  inFlight ??= doRefresh(cfg).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRefresh(cfg: SyncConfig): Promise<StoreData> {
  const now = cfg.now?.() ?? new Date();
  const data = await cfg.store.read();
  let changed = false;
  const errors: string[] = [];

  if (cfg.apiKey && isStale(data.meta.lastOddsSync, cfg.oddsTtlMs, now)) {
    try {
      await syncOdds(cfg, data, now);
    } catch (e) {
      errors.push(describeError(e));
      // On attend le délai normal avant de réessayer, pour ne pas gaspiller le quota.
      data.meta.lastOddsSync = now.toISOString();
    }
    changed = true;
  }

  if (needsScores(data, now) && isStale(data.meta.lastScoresSync, cfg.scoresTtlMs, now)) {
    try {
      await syncScores(cfg, data, now);
    } catch (e) {
      errors.push(describeError(e));
      data.meta.lastScoresSync = now.toISOString();
    }
    changed = true;
  }

  if (changed) {
    data.meta.lastError = errors.length ? errors.join(" · ") : null;
    await cfg.store.write(data);
  }
  return data;
}

/** Statut d'un match à l'instant `now`. */
export function toMatchState({ match, result }: StoredMatch, now: Date): MatchState {
  if (result) return { ...match, status: "finished", result };
  return { ...match, status: Date.parse(match.startTime) <= now.getTime() ? "live" : "upcoming", result: null };
}

/** Réinitialise le verrou (tests uniquement). */
export function __resetInFlight() {
  inFlight = null;
}

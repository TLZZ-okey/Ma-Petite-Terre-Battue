import type { Match, Player, Tour, Tournament, TournamentCategory, Surface } from "../types";

/**
 * Client The Odds API (v4) — https://the-odds-api.com/liveapi/guides/v4/
 *
 * Coût : /v4/sports est gratuit ; /v4/sports/{clé}/odds coûte 1 crédit par
 * marché et par région (ici h2h × eu = 1 crédit), et rien si aucun match n'est renvoyé.
 */

/** Adresse de l'API (modifiable pour les tests via ODDS_API_BASE_URL). */
export const ODDS_API_BASE = process.env.ODDS_API_BASE_URL || "https://api.the-odds-api.com";

export interface OddsApiSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface OddsApiOutcome {
  name: string;
  price: number;
}

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    last_update?: string;
    markets: Array<{ key: string; last_update?: string; outcomes: OddsApiOutcome[] }>;
  }>;
}

export interface Quota {
  remaining: number | null;
  used: number | null;
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

function readQuota(res: Response): Quota {
  const n = (h: string) => {
    const v = res.headers.get(h);
    return v === null || v === "" ? null : Number(v);
  };
  return { remaining: n("x-requests-remaining"), used: n("x-requests-used") };
}

async function getJson<T>(fetcher: Fetcher, url: URL): Promise<{ data: T; quota: Quota }> {
  const res = await fetcher(url.toString(), { headers: { Accept: "application/json" }, cache: "no-store" });
  const quota = readQuota(res);
  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message += ` — ${body.message}`;
    } catch {
      // corps non JSON : on garde le code HTTP
    }
    // On ne journalise jamais l'URL complète : elle contient la clé API.
    throw new Error(`The Odds API : erreur ${message}`);
  }
  return { data: (await res.json()) as T, quota };
}

export async function listSports(fetcher: Fetcher, apiKey: string) {
  const url = new URL("/v4/sports/", ODDS_API_BASE);
  url.searchParams.set("apiKey", apiKey);
  return getJson<OddsApiSport[]>(fetcher, url);
}

export async function getTennisOdds(fetcher: Fetcher, apiKey: string, sportKey: string) {
  const url = new URL(`/v4/sports/${encodeURIComponent(sportKey)}/odds/`, ODDS_API_BASE);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "eu");
  url.searchParams.set("markets", "h2h");
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");
  return getJson<OddsApiEvent[]>(fetcher, url);
}

/** Tournois de tennis actifs (matchs à venir), hors paris « vainqueur du tournoi ». */
export function activeTennisKeys(sports: OddsApiSport[]): string[] {
  return sports.filter((s) => s.active && !s.has_outrights && s.key.startsWith("tennis_")).map((s) => s.key);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Cote de consensus de chaque joueur : médiane des cotes « vainqueur du match » (h2h)
 * de tous les bookmakers, arrondie au centième.
 */
export function consensusOdds(event: OddsApiEvent): { home: number | null; away: number | null } {
  const home: number[] = [];
  const away: number[] = [];
  for (const bookmaker of event.bookmakers ?? []) {
    const market = bookmaker.markets.find((m) => m.key === "h2h");
    if (!market) continue;
    for (const o of market.outcomes) {
      if (!(o.price > 1)) continue;
      if (o.name === event.home_team) home.push(o.price);
      else if (o.name === event.away_team) away.push(o.price);
    }
  }
  const round = (v: number | null) => (v === null ? null : Math.round(v * 100) / 100);
  return { home: round(median(home)), away: round(median(away)) };
}

const GRAND_SLAMS = ["aus_open", "french_open", "wimbledon", "us_open"];
const THOUSANDS = [
  "indian_wells",
  "miami",
  "madrid",
  "italian_open",
  "rome",
  "canadian_open",
  "cincinnati",
  "shanghai",
  "paris_masters",
  "monte_carlo",
  "china_open",
  "wuhan",
  "dubai",
  "qatar",
];
const CLAY = ["french_open", "madrid", "italian_open", "rome", "monte_carlo", "barcelona", "hamburg"];

export function tourFromKey(sportKey: string): Tour {
  return sportKey.startsWith("tennis_wta") ? "WTA" : "ATP";
}

/** Déduit les informations du tournoi à partir de la clé et du titre The Odds API. */
export function tournamentFromSport(sportKey: string, sportTitle: string): Tournament {
  const tour = tourFromKey(sportKey);
  const has = (list: string[]) => list.some((k) => sportKey.includes(k));
  let category: TournamentCategory = "500";
  if (has(GRAND_SLAMS)) category = "Grand Chelem";
  else if (has(THOUSANDS) || sportKey.includes("masters")) category = tour === "ATP" ? "Masters 1000" : "WTA 1000";
  else if (sportKey.includes("finals")) category = "Finales";

  let surface: Surface = "dur";
  if (has(CLAY)) surface = "terre-battue";
  else if (sportKey.includes("wimbledon")) surface = "gazon";
  else if (sportKey.includes("paris_masters") || sportKey.includes("finals")) surface = "indoor";

  const name = sportTitle.trim() || sportKey;
  return { id: sportKey, name, city: "", surface, category };
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function playerFromName(name: string, tour: Tour): Player {
  return { id: `${tour.toLowerCase()}-${slugify(name)}`, name, country: "", ranking: null, tour };
}

/** Identifiant interne d'un match issu de The Odds API. */
export function matchIdFromEvent(eventId: string): string {
  return `toa_${eventId}`;
}

/** Convertit un match The Odds API en match de l'application (null si les cotes manquent). */
export function eventToMatch(event: OddsApiEvent): Match | null {
  const { home, away } = consensusOdds(event);
  if (home === null || away === null) return null;
  const tour = tourFromKey(event.sport_key);
  const tournament = tournamentFromSport(event.sport_key, event.sport_title);
  return {
    id: matchIdFromEvent(event.id),
    tournament,
    tour,
    round: "",
    court: "",
    startTime: new Date(event.commence_time).toISOString(),
    bestOf: tournament.category === "Grand Chelem" && tour === "ATP" ? 5 : 3,
    player1: playerFromName(event.home_team, tour),
    player2: playerFromName(event.away_team, tour),
    odds1: home,
    odds2: away,
  };
}

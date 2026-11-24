import type { Player, Tour } from "../types";
import type { Fetcher } from "./oddsApi";

/**
 * Classements et nationalités via l'API publique d'ESPN (non officielle, sans clé) :
 *   GET https://site.api.espn.com/apis/site/v2/sports/tennis/{atp|wta}/rankings
 * Format (vérifié le 24/11/2026) : { rankings: [{ update: ISO, ranks: [{ current, previous, points,
 *   athlete: { displayName, firstName, lastName, citizenshipCountry: "ITA", flagAltText: "Italy" } }] }] }
 * Couvre les 150 premiers de chaque circuit. Au-delà, le joueur reste sans classement ni pays.
 */

export const ESPN_BASE = process.env.ESPN_BASE_URL || "https://site.api.espn.com";

export interface RankedPlayer {
  name: string;
  rank: number;
  /** Code pays ISO alpha-2 (pour le drapeau), "" si inconnu. */
  country: string;
  countryName: string;
}

export interface RankingTable {
  /** Date de publication du classement selon ESPN. */
  updated: string | null;
  players: RankedPlayer[];
}

/**
 * Codes pays d'ESPN (CIO pour l'essentiel, plus quelques variantes propres à ESPN)
 * vers les codes ISO alpha-2 utilisés pour les drapeaux emoji.
 */
const COUNTRY_CODES: Record<string, string> = {
  ALG: "DZ", AND: "AD", ARG: "AR", ARM: "AM", AUS: "AU", AUT: "AT", AZE: "AZ", BAH: "BS", BAR: "BB", BEL: "BE",
  BIH: "BA", BLR: "BY", BOL: "BO", BRA: "BR", BUL: "BG", CAN: "CA", CHI: "CL", CHN: "CN", COL: "CO", CRC: "CR",
  CRO: "HR", CYP: "CY", CZE: "CZ", DEN: "DK", DOM: "DO", ECU: "EC", EGY: "EG", ESA: "SV", ESP: "ES", EST: "EE",
  FIN: "FI", FRA: "FR", GBR: "GB", GEO: "GE", GER: "DE", GRE: "GR", GUA: "GT", HKG: "HK", HUN: "HU", INA: "ID",
  IND: "IN", IRL: "IE", ISR: "IL", ITA: "IT", JAM: "JM", JPN: "JP", KAZ: "KZ", KOR: "KR", LAT: "LV", LTU: "LT",
  LUX: "LU", MAR: "MA", MDA: "MD", MEX: "MX", MKD: "MK", MLT: "MT", MNE: "ME", MON: "MC", NED: "NL", NOR: "NO",
  NZL: "NZ", PAK: "PK", PAR: "PY", PER: "PE", PHI: "PH", POL: "PL", POR: "PT", PUR: "PR", QAT: "QA", ROU: "RO",
  ROM: "RO", RSA: "ZA", RUS: "RU", SER: "RS", SRB: "RS", SLO: "SI", SUI: "CH", SVK: "SK", SWE: "SE", THA: "TH",
  TPE: "TW", TPO: "TW", TUN: "TN", TUR: "TR", UAE: "AE", UKR: "UA", URU: "UY", USA: "US", UZB: "UZ", VEN: "VE",
  VIE: "VN", ZIM: "ZW",
};

export function countryToIso2(code: string | undefined | null): string {
  if (!code) return "";
  const upper = code.toUpperCase();
  if (upper.length === 2) return upper;
  return COUNTRY_CODES[upper] ?? "";
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

export function parseRankings(body: unknown): RankingTable {
  const ranking = isObj(body) && Array.isArray(body.rankings) && isObj(body.rankings[0]) ? body.rankings[0] : null;
  if (!ranking || !Array.isArray(ranking.ranks)) return { updated: null, players: [] };
  const players: RankedPlayer[] = [];
  for (const entry of ranking.ranks) {
    if (!isObj(entry) || !isObj(entry.athlete)) continue;
    const a = entry.athlete;
    const name = typeof a.displayName === "string" ? a.displayName : [a.firstName, a.lastName].filter(Boolean).join(" ");
    const rank = Number(entry.current);
    if (!name || !Number.isFinite(rank)) continue;
    players.push({
      name,
      rank,
      country: countryToIso2(typeof a.citizenshipCountry === "string" ? a.citizenshipCountry : null),
      countryName: typeof a.flagAltText === "string" ? a.flagAltText : "",
    });
  }
  return { updated: typeof ranking.update === "string" ? ranking.update : null, players };
}

export async function fetchRankings(fetcher: Fetcher, tour: Tour): Promise<RankingTable> {
  const url = new URL(`/apis/site/v2/sports/tennis/${tour.toLowerCase()}/rankings`, ESPN_BASE);
  const res = await fetcher(url.toString(), { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN (classements ${tour}) : erreur ${res.status}`);
  const table = parseRankings(await res.json());
  if (table.players.length === 0) throw new Error(`ESPN (classements ${tour}) : réponse vide ou format inattendu`);
  return table;
}

/* ------------------------------------------------------------------ */
/* Calendrier de mise à jour                                            */
/* ------------------------------------------------------------------ */

/**
 * Les classements ATP et WTA sont publiés le lundi. On les récupère une fois par semaine,
 * à partir du lundi 12:00 UTC (le temps qu'ESPN les publie).
 */
export const RANKINGS_REFRESH_HOUR_UTC = 12;

/** Délai avant de retenter après un échec. */
export const RANKINGS_RETRY_MS = 3600_000;

/** Dernier « lundi 12:00 UTC » passé (ou égal) par rapport à `now`. */
export function lastRankingsRelease(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), RANKINGS_REFRESH_HOUR_UTC));
  const daysSinceMonday = (d.getUTCDay() + 6) % 7; // lundi = 0
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  if (d.getTime() > now.getTime()) d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

/** Prochaine mise à jour prévue. */
export function nextRankingsRelease(now: Date): Date {
  const d = lastRankingsRelease(now);
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

/**
 * Faut-il interroger ESPN ? Oui si aucun classement n'a encore été récupéré, ou si le dernier
 * date d'avant le dernier lundi — sauf si une tentative a échoué il y a moins d'une heure.
 */
export function rankingsDue(cache: { fetchedAt: string | null; lastAttemptAt?: string | null }, now: Date): boolean {
  const fetched = cache.fetchedAt ? Date.parse(cache.fetchedAt) : null;
  const outdated = fetched === null || fetched < lastRankingsRelease(now).getTime();
  if (!outdated) return false;
  const attempted = cache.lastAttemptAt ? Date.parse(cache.lastAttemptAt) : null;
  const failedRecently = attempted !== null && attempted !== fetched && now.getTime() - attempted < RANKINGS_RETRY_MS;
  return !failedRecently;
}

/* ------------------------------------------------------------------ */
/* Rapprochement des noms                                               */
/* ------------------------------------------------------------------ */

function tokens(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

/** Clé indépendante de l'ordre et des accents : « Bu Yunchaokete » = « Yunchaokete Bu ». */
export function nameKey(name: string): string {
  return tokens(name).sort().join(" ");
}

/**
 * Retrouve un joueur dans le classement :
 * 1. même nom complet (accents, tirets, casse et ordre ignorés) ;
 * 2. sinon même nom de famille ET même initiale de prénom, si un seul joueur correspond
 *    (évite de confondre Francisco et Juan Manuel Cerundolo).
 */
export function findRanked(name: string, players: RankedPlayer[]): RankedPlayer | null {
  const key = nameKey(name);
  const exact = players.find((p) => nameKey(p.name) === key);
  if (exact) return exact;

  const t = tokens(name);
  if (t.length < 2) return null;
  const first = t[0][0];
  const last = t[t.length - 1];
  const candidates = players.filter((p) => {
    const pt = tokens(p.name);
    return pt.length >= 2 && pt[pt.length - 1] === last && pt[0][0] === first;
  });
  return candidates.length === 1 ? candidates[0] : null;
}

/** Complète un joueur avec son classement et sa nationalité, si on les connaît. */
export function enrichPlayer(player: Player, tables: Partial<Record<Tour, RankingTable>>): Player {
  const table = tables[player.tour];
  if (!table) return player;
  const found = findRanked(player.name, table.players);
  if (!found) return player;
  return { ...player, ranking: found.rank, country: found.country || player.country, countryName: found.countryName };
}

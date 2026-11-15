import type { Fetcher } from "./oddsApi";

/**
 * Client SportScore — https://sportscore.com/developers/
 *
 * Point d'accès : GET https://sportscore.com/api/widget/matches/?sport=tennis&limit=50
 * (matchs en cours et récents, sans clé API, ~1 000 requêtes / 24 h / IP).
 * Conditions : la mention « Powered by SportScore » doit rester visible dans l'app.
 *
 * ⚠️ Le format exact de la réponse n'a pas pu être vérifié (domaine inaccessible
 * lors du développement). La lecture ci-dessous est volontairement tolérante :
 * elle accepte plusieurs noms de champs courants. Un échantillon brut de la
 * dernière réponse est conservé (voir /api/status) pour ajuster ce fichier.
 */

/** Adresse de l'API (modifiable pour les tests via SPORTSCORE_BASE_URL). */
export const SPORTSCORE_BASE = process.env.SPORTSCORE_BASE_URL || "https://sportscore.com";
const USER_AGENT = "ma-petite-terre-battue/0.1 (+https://sportscore.com/developers/)";

export type ScoreStatus = "scheduled" | "live" | "finished" | "unknown";

/** Match normalisé, indépendant du format de SportScore. */
export interface ScoreMatch {
  id: string;
  home: string;
  away: string;
  startTime: string | null;
  status: ScoreStatus;
  /** Sets gagnés par chaque joueur. */
  homeSets: number | null;
  awaySets: number | null;
  /** Jeux par set [domicile, extérieur]. */
  periods: Array<[number, number]>;
  /** "home" | "away" si l'API l'indique explicitement. */
  winner: "home" | "away" | null;
}

export async function fetchTennisMatches(fetcher: Fetcher, limit = 50): Promise<{ matches: ScoreMatch[]; sample: unknown }> {
  const url = new URL("/api/widget/matches/", SPORTSCORE_BASE);
  url.searchParams.set("sport", "tennis");
  url.searchParams.set("limit", String(limit));
  const res = await fetcher(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SportScore : erreur ${res.status}`);
  const body = (await res.json()) as unknown;
  const list = extractList(body);
  return { matches: list.map(normalizeMatch).filter((m): m is ScoreMatch => m !== null), sample: list[0] ?? body };
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function extractList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!isObj(body)) return [];
  for (const key of ["matches", "data", "events", "results", "items"]) {
    const v = body[key];
    if (Array.isArray(v)) return v;
    if (isObj(v)) {
      const nested = extractList(v);
      if (nested.length) return nested;
    }
  }
  return [];
}

function first(obj: Obj, paths: string[]): unknown {
  for (const path of paths) {
    let cur: unknown = obj;
    for (const part of path.split(".")) {
      cur = isObj(cur) ? cur[part] : undefined;
    }
    if (cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return undefined;
}

function asString(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  if (isObj(v)) return asString(first(v, ["name", "full_name", "fullName", "shortName", "short_name", "title"]));
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  if (isObj(v)) return asNumber(first(v, ["current", "display", "sets", "value", "score"]));
  return null;
}

export function normalizeStatus(raw: unknown): ScoreStatus {
  const text = (isObj(raw) ? [raw.type, raw.short, raw.long, raw.description, raw.name, raw.code] : [raw])
    .filter((v) => v !== undefined && v !== null)
    .join(" ")
    .toLowerCase();
  if (!text) return "unknown";
  if (/(finish|ended|^ft\b|final|complet|retir|walkover|w\/o|\bended\b|aet|after)/.test(text)) return "finished";
  if (/(live|progress|inplay|in_play|playing|set \d|1st|2nd|3rd|4th|5th|break)/.test(text)) return "live";
  if (/(not ?started|scheduled|upcoming|fixture|pre|ns\b|tbd|postponed|delayed)/.test(text)) return "scheduled";
  return "unknown";
}

function normalizePeriods(m: Obj): Array<[number, number]> {
  // Format « SofaScore » : home_score.period1, away_score.period1…
  const hs = first(m, ["home_score", "homeScore", "scores.home"]);
  const as = first(m, ["away_score", "awayScore", "scores.away"]);
  if (isObj(hs) && isObj(as)) {
    const out: Array<[number, number]> = [];
    for (let i = 1; i <= 5; i++) {
      const h = asNumber(hs[`period${i}`]);
      const a = asNumber(as[`period${i}`]);
      if (h === null || a === null) break;
      out.push([h, a]);
    }
    if (out.length) return out;
  }
  // Format liste : periods / sets = [{home, away}] ou ["6-4", "3-6"]
  const list = first(m, ["periods", "sets", "score.periods", "score.sets", "set_scores"]);
  if (Array.isArray(list)) {
    const out: Array<[number, number]> = [];
    for (const p of list) {
      if (typeof p === "string") {
        const [h, a] = p.split(/[-:]/).map((x) => Number(x.trim()));
        if (Number.isFinite(h) && Number.isFinite(a)) out.push([h, a]);
      } else if (isObj(p)) {
        const h = asNumber(first(p, ["home", "home_score", "p1", "player1"]));
        const a = asNumber(first(p, ["away", "away_score", "p2", "player2"]));
        if (h !== null && a !== null) out.push([h, a]);
      }
    }
    return out;
  }
  return [];
}

export function normalizeMatch(raw: unknown): ScoreMatch | null {
  if (!isObj(raw)) return null;
  const home = asString(first(raw, ["home", "home_team", "homeTeam", "home_name", "player1", "participants.0", "competitors.0"]));
  const away = asString(first(raw, ["away", "away_team", "awayTeam", "away_name", "player2", "participants.1", "competitors.1"]));
  if (!home || !away) return null;

  let homeSets = asNumber(first(raw, ["home_score.current", "homeScore.current", "score.home", "scores.home", "home_score", "homeScore", "home_sets"]));
  let awaySets = asNumber(first(raw, ["away_score.current", "awayScore.current", "score.away", "scores.away", "away_score", "awayScore", "away_sets"]));
  const scoreText = first(raw, ["score", "result"]);
  if ((homeSets === null || awaySets === null) && typeof scoreText === "string") {
    const [h, a] = scoreText.split(/[-:]/).map((x) => Number(x.trim()));
    if (Number.isFinite(h) && Number.isFinite(a)) [homeSets, awaySets] = [h, a];
  }

  const periods = normalizePeriods(raw);
  if ((homeSets === null || awaySets === null) && periods.length) {
    homeSets = periods.filter(([h, a]) => h > a).length;
    awaySets = periods.filter(([h, a]) => a > h).length;
  }

  const winnerRaw = first(raw, ["winner", "winner_code", "winnerCode"]);
  let winner: ScoreMatch["winner"] = null;
  if (winnerRaw === 1 || winnerRaw === "1" || winnerRaw === "home") winner = "home";
  else if (winnerRaw === 2 || winnerRaw === "2" || winnerRaw === "away") winner = "away";

  const start = first(raw, ["start_time", "startTime", "start_at", "startAt", "kickoff", "date", "start_timestamp", "startTimestamp"]);
  let startTime: string | null = null;
  if (typeof start === "number") startTime = new Date(start < 1e12 ? start * 1000 : start).toISOString();
  else if (typeof start === "string" && !Number.isNaN(Date.parse(start))) startTime = new Date(start).toISOString();

  return {
    id: String(first(raw, ["id", "slug", "match_id"]) ?? `${home}-${away}`),
    home,
    away,
    startTime,
    status: normalizeStatus(first(raw, ["status", "state", "status_text", "statusText"])),
    homeSets,
    awaySets,
    periods,
    winner,
  };
}

/* ------------------------------------------------------------------ */
/* Rapprochement des joueurs entre les deux API                         */
/* ------------------------------------------------------------------ */

function tokens(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length >= 3);
}

/**
 * Deux noms désignent le même joueur s'ils partagent un mot d'au moins 3 lettres
 * (le nom de famille en pratique) : « Jannik Sinner » = « Sinner J. ».
 */
export function samePlayer(a: string, b: string): boolean {
  const tb = new Set(tokens(b));
  return tokens(a).some((t) => tb.has(t));
}

/** Retrouve le match SportScore correspondant (joueurs identiques, dans l'un ou l'autre ordre). */
export function findScoreMatch(
  player1: string,
  player2: string,
  startTime: string,
  candidates: ScoreMatch[],
): { match: ScoreMatch; swapped: boolean } | null {
  const start = Date.parse(startTime);
  for (const c of candidates) {
    if (c.startTime && Math.abs(Date.parse(c.startTime) - start) > 36 * 3600_000) continue;
    if (samePlayer(player1, c.home) && samePlayer(player2, c.away)) return { match: c, swapped: false };
    if (samePlayer(player1, c.away) && samePlayer(player2, c.home)) return { match: c, swapped: true };
  }
  return null;
}

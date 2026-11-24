import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Match, MatchResult, Tour } from "../types";
import type { Quota } from "./oddsApi";
import type { RankingTable } from "./rankings";

/**
 * Mémoire serveur des matchs vus via les API.
 * Indispensable car The Odds API ne renvoie plus un match une fois commencé :
 * on garde ici le programme, les cotes figées avant le match et les résultats.
 *
 * V1 : fichier JSON (.data/matches.json). À remplacer par la base de données.
 */

export interface StoredMatch {
  match: Match;
  result: MatchResult | null;
}

export interface SyncMeta {
  lastOddsSync: string | null;
  lastScoresSync: string | null;
  quota: Quota;
  lastError: string | null;
  activeTournaments: string[];
  /** Échantillon brut de la dernière réponse SportScore (pour vérifier son format). */
  scoresSample: unknown;
}

export interface RankingsCache {
  /** Dernière récupération réussie (ou tentée) auprès d'ESPN. */
  fetchedAt: string | null;
  tables: Partial<Record<Tour, RankingTable>>;
}

export interface StoreData {
  matches: Record<string, StoredMatch>;
  meta: SyncMeta;
  rankings: RankingsCache;
}

export interface MatchStore {
  read(): Promise<StoreData>;
  write(data: StoreData): Promise<void>;
}

export function emptyStore(): StoreData {
  return {
    matches: {},
    rankings: { fetchedAt: null, tables: {} },
    meta: {
      lastOddsSync: null,
      lastScoresSync: null,
      quota: { remaining: null, used: null },
      lastError: null,
      activeTournaments: [],
      scoresSample: null,
    },
  };
}

export function createMemoryStore(initial: StoreData = emptyStore()): MatchStore {
  let data = structuredClone(initial);
  return {
    read: async () => structuredClone(data),
    write: async (next) => {
      data = structuredClone(next);
    },
  };
}

export function createFileStore(file: string): MatchStore {
  return {
    async read() {
      try {
        const parsed = JSON.parse(await readFile(file, "utf8")) as StoreData;
        return {
          matches: parsed.matches ?? {},
          meta: { ...emptyStore().meta, ...parsed.meta },
          rankings: parsed.rankings ?? emptyStore().rankings,
        };
      } catch {
        return emptyStore();
      }
    },
    async write(data) {
      await mkdir(path.dirname(file), { recursive: true });
      // Écriture atomique : fichier temporaire puis renommage.
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(data), "utf8");
      await rename(tmp, file);
    },
  };
}

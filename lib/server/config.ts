import "server-only";
import path from "node:path";
import { createFileStore } from "./matchStore";
import type { SyncConfig } from "./sync";

const minutes = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return (Number.isFinite(n) && n > 0 ? n : fallback) * 60_000;
};

const store = createFileStore(path.join(process.env.DATA_DIR ?? path.join(process.cwd(), ".data"), "matches.json"));

/**
 * Configuration lue dans les variables d'environnement (.env.local) :
 * - ODDS_API_KEY : clé The Odds API (obligatoire pour les cotes) ;
 * - ODDS_REFRESH_MINUTES : délai entre deux mises à jour des cotes (défaut 360 = 6 h) ;
 * - SCORES_REFRESH_MINUTES : délai entre deux mises à jour des scores (défaut 3) ;
 * Les classements ESPN sont mis à jour chaque lundi (voir lib/server/rankings.ts).
 * - DATA_DIR : dossier du fichier de données (défaut .data/).
 */
export function syncConfig(): SyncConfig {
  return {
    apiKey: process.env.ODDS_API_KEY || undefined,
    fetcher: (url, init) => fetch(url, init),
    store,
    oddsTtlMs: minutes(process.env.ODDS_REFRESH_MINUTES, 360),
    scoresTtlMs: minutes(process.env.SCORES_REFRESH_MINUTES, 3),
  };
}

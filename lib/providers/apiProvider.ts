import { parseDayKey } from "../dates";
import type { MatchState } from "../types";
import type { MatchProvider } from "./types";

/**
 * Provider « API réelle » : interroge les routes du serveur Next.js, qui
 * agrègent The Odds API (programme + cotes) et SportScore (scores).
 * La clé API reste côté serveur, jamais dans le navigateur.
 */
export function createApiProvider(baseUrl = ""): MatchProvider {
  async function get(params: URLSearchParams): Promise<MatchState[]> {
    const res = await fetch(`${baseUrl}/api/matches?${params}`, { cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as { matches?: MatchState[]; error?: string };
    if (!res.ok) throw new Error(body.error ?? `Erreur ${res.status} lors du chargement des matchs.`);
    return body.matches ?? [];
  }

  return {
    async getMatchesForDay(day) {
      const from = parseDayKey(day);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return get(new URLSearchParams({ from: from.toISOString(), to: to.toISOString() }));
    },
    async getMatchesByIds(ids) {
      if (ids.length === 0) return [];
      // Découpage pour garder des URL de taille raisonnable.
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
      return (await Promise.all(chunks.map((c) => get(new URLSearchParams({ ids: c.join(",") }))))).flat();
    },
  };
}

/** Source des matchs choisie au build : "api" (réel) ou "mock" (démo, par défaut). */
export const MATCH_SOURCE: "api" | "mock" = process.env.NEXT_PUBLIC_MATCH_SOURCE === "api" ? "api" : "mock";

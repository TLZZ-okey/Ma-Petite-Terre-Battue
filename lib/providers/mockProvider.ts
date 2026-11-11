import type { KeyValueStorage } from "../repository/localRepository";
import { generateDay, generateMatch, resolveMatch, simulateResult } from "../mock/generator";
import type { MatchResult, MatchState } from "../types";
import type { MatchProvider } from "./types";

const OVERRIDES_KEY = "mptb:result-overrides";

export interface MockMatchProvider extends MatchProvider {
  /** Outil de démo : termine immédiatement un match avec son résultat simulé. */
  finishNow(matchId: string): void;
  clearOverrides(): void;
}

export function createMockProvider(storage: KeyValueStorage): MockMatchProvider {
  function overrides(): Record<string, MatchResult> {
    try {
      return JSON.parse(storage.getItem(OVERRIDES_KEY) ?? "{}");
    } catch {
      return {};
    }
  }

  return {
    async getMatchesForDay(day, now) {
      const o = overrides();
      return generateDay(day).map((m) => resolveMatch(m, now, o[m.id]));
    },
    async getMatchesByIds(ids, now) {
      const o = overrides();
      return ids
        .map((id) => generateMatch(id))
        .filter((m) => m !== undefined)
        .map((m) => resolveMatch(m, now, o[m.id]));
    },
    finishNow(matchId) {
      const match = generateMatch(matchId);
      if (!match) return;
      storage.setItem(OVERRIDES_KEY, JSON.stringify({ ...overrides(), [matchId]: simulateResult(match) }));
    },
    clearOverrides() {
      storage.removeItem(OVERRIDES_KEY);
    },
  };
}

export type { MatchState };

import type { KeyValueStorage } from "../repository/localRepository";
import { feederIds, generateDay, generateMatch, previousRound, resolveMatch, simulateResult } from "../mock/generator";
import type { MatchResult, MatchState } from "../types";
import type { MatchProvider, PendingRound } from "./types";

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

  /**
   * Un match n'est visible qu'une fois ses deux joueurs connus, c'est-à-dire quand
   * les matchs dont il attend les vainqueurs sont terminés (ex. la finale n'apparaît
   * qu'après les deux demi-finales).
   */
  function isVisible(matchId: string, now: Date, o: Record<string, MatchResult>): boolean {
    return feederIds(matchId).every((id) => {
      const feeder = generateMatch(id);
      return feeder !== undefined && resolveMatch(feeder, now, o[id]).status === "finished";
    });
  }

  return {
    async getMatchesForDay(day, now) {
      const o = overrides();
      return generateDay(day)
        .filter((m) => isVisible(m.id, now, o))
        .map((m) => resolveMatch(m, now, o[m.id]));
    },
    async getPendingRounds(day, now) {
      const o = overrides();
      const pending = new Map<string, PendingRound>();
      for (const m of generateDay(day)) {
        if (isVisible(m.id, now, o)) continue;
        const entry = pending.get(m.round);
        if (entry) entry.count++;
        else pending.set(m.round, { round: m.round, count: 1, waitingFor: previousRound(m.round), startTime: m.startTime });
      }
      return [...pending.values()];
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

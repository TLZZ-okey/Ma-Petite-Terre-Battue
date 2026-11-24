import { describe, expect, it } from "vitest";
import { computeAchievements, computeStreaks, levelFor } from "../lib/gamification";
import { generateDay } from "../lib/mock/generator";
import type { MatchState, Prediction } from "../lib/types";

describe("niveaux", () => {
  it("donne le niveau, le titre et la progression vers le suivant", () => {
    expect(levelFor(0)).toMatchObject({ current: { level: 1, title: "Ramasseur de balles" }, progress: 0, toNext: 50 });
    expect(levelFor(100)).toMatchObject({ current: { level: 2 }, next: { level: 3 }, progress: 0.5, toNext: 50 });
    expect(levelFor(150).current.level).toBe(3);
    expect(levelFor(5000)).toMatchObject({ current: { level: 8 }, next: null, progress: 1, toNext: 0 });
  });
});

describe("séries et badges", () => {
  const base = generateDay("2026-11-23"); // 4 matchs (8es)
  const at = (i: number, hour: number): MatchState => ({
    ...base[i],
    startTime: `2026-11-2${i}T${String(hour).padStart(2, "0")}:00:00.000Z`,
    odds1: 1.5,
    odds2: 3,
    status: "finished",
    result: { winnerId: base[i].player1.id, sets: 3, score: [] },
  });
  const matches = new Map([0, 1, 2, 3].map((i) => [base[i].id, at(i, 10 + i)]));
  const prono = (i: number, winner: 1 | 2, sets: number | null): Prediction => ({
    id: `p${i}`,
    userId: "u",
    matchId: base[i].id,
    winnerId: winner === 1 ? base[i].player1.id : base[i].player2.id,
    sets,
    createdAt: "",
    updatedAt: "",
  });

  it("compte la série en cours et la meilleure série", () => {
    // gagné, gagné, perdu, gagné
    const preds = [prono(0, 1, 4), prono(1, 1, 3), prono(2, 2, 3), prono(3, 1, 5)];
    expect(computeStreaks(preds, matches)).toEqual({ current: 1, best: 2 });
    expect(computeStreaks([], matches)).toEqual({ current: 0, best: 0 });
  });

  it("débloque les badges selon les résultats", () => {
    const preds = [prono(0, 1, 3), prono(1, 1, 3), prono(2, 1, 4)];
    const byId = Object.fromEntries(computeAchievements(preds, matches).map((a) => [a.id, a]));
    expect(byId.first.unlocked).toBe(true);
    expect(byId.eye.unlocked).toBe(true);
    expect(byId.bullseye.unlocked).toBe(true); // 2 scores exacts (3 sets)
    expect(byId.fire).toMatchObject({ unlocked: true, progress: { value: 3, target: 3 } });
    expect(byId.sniper).toMatchObject({ unlocked: false, progress: { value: 2, target: 3 } });
    expect(byId.flair.unlocked).toBe(false); // vainqueurs à 1,5
    expect(byId.regular.progress).toEqual({ value: 3, target: 10 });
  });

  it("récompense le flair sur un outsider", () => {
    const outsider = new Map(matches);
    const m = at(0, 10);
    outsider.set(m.id, { ...m, result: { winnerId: m.player2.id, sets: 3, score: [] } });
    const byId = Object.fromEntries(computeAchievements([prono(0, 2, null)], outsider).map((a) => [a.id, a]));
    expect(byId.flair.unlocked).toBe(true);
  });
});

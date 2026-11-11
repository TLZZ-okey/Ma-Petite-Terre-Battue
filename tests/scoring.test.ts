import { describe, expect, it } from "vitest";
import { generateDay, resolveMatch } from "../lib/mock/generator";
import { potentialPoints, possibleSets, scorePrediction } from "../lib/scoring";
import type { MatchState } from "../lib/types";

const base = generateDay("2026-11-09")[0];

function finished(winnerId: string, sets: number): MatchState {
  return { ...base, odds1: 1.8, odds2: 2.1, status: "finished", result: { winnerId, sets, score: [] } };
}

describe("scorePrediction", () => {
  const p1 = base.player1.id;
  const p2 = base.player2.id;

  it("donne 0 point pour un mauvais vainqueur, même avec le bon nombre de sets", () => {
    expect(scorePrediction(finished(p1, 2), { winnerId: p2, sets: 2 })).toEqual({ outcome: "lost", points: 0 });
  });

  it("donne la cote du vainqueur pour un bon vainqueur", () => {
    expect(scorePrediction(finished(p1, 3), { winnerId: p1, sets: null })).toEqual({ outcome: "won", points: 1.8 });
    expect(scorePrediction(finished(p2, 3), { winnerId: p2, sets: 2 })).toEqual({ outcome: "won", points: 2.1 });
  });

  it("double la cote si le nombre de sets est exact", () => {
    expect(scorePrediction(finished(p2, 3), { winnerId: p2, sets: 3 })).toEqual({ outcome: "perfect", points: 4.2 });
  });

  it("reste en attente tant que le match n'est pas terminé", () => {
    const live: MatchState = { ...base, status: "live", result: null };
    expect(scorePrediction(live, { winnerId: p1, sets: 2 })).toEqual({ outcome: "pending", points: 0 });
  });

  it("calcule les gains potentiels", () => {
    expect(potentialPoints({ ...base, odds1: 1.55, odds2: 2.4 }, { winnerId: p1, sets: 2 })).toEqual({
      winner: 1.55,
      exact: 3.1,
    });
  });

  it("propose les bons nombres de sets", () => {
    expect(possibleSets(3)).toEqual([2, 3]);
    expect(possibleSets(5)).toEqual([3, 4, 5]);
  });
});

describe("générateur de matchs", () => {
  it("est déterministe", () => {
    expect(generateDay("2026-11-11")).toEqual(generateDay("2026-11-11"));
  });

  it("ne fait jamais jouer un joueur deux fois le même jour", () => {
    for (const day of ["2026-11-09", "2026-11-10", "2026-11-13", "2026-11-15"]) {
      const ids = generateDay(day).flatMap((m) => [m.player1.id, m.player2.id]);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("produit des cotes cohérentes et des résultats valides", () => {
    for (const m of generateDay("2026-05-25")) {
      expect(m.odds1).toBeGreaterThan(1);
      expect(m.odds2).toBeGreaterThan(1);
      const s = resolveMatch(m, new Date("2100-01-01"));
      expect(s.status).toBe("finished");
      expect([m.player1.id, m.player2.id]).toContain(s.result!.winnerId);
      expect(possibleSets(m.bestOf)).toContain(s.result!.sets);
      expect(s.result!.score).toHaveLength(s.result!.sets);
      // Le vainqueur gagne exactement le nombre de sets requis.
      const setsWon = s.result!.score.filter((sc) => {
        const [a, b] = sc.split("-").map(Number);
        return a > b;
      }).length;
      expect(setsWon).toBe(m.bestOf === 5 ? 3 : 2);
    }
  });

  it("calcule le statut selon l'heure", () => {
    const m = generateDay("2026-11-11")[0];
    const start = new Date(m.startTime).getTime();
    expect(resolveMatch(m, new Date(start - 1)).status).toBe("upcoming");
    expect(resolveMatch(m, new Date(start + 1)).status).toBe("live");
    expect(resolveMatch(m, new Date(start + 6 * 3600_000)).status).toBe("finished");
  });
});

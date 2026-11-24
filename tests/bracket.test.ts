import { describe, expect, it } from "vitest";
import { feederIds, generateDay, generateWeek, matchDuration, simulateResult } from "../lib/mock/generator";
import { createMockProvider } from "../lib/providers/mockProvider";
import { memoryStorage } from "../lib/repository/localRepository";
import type { Match } from "../lib/types";

// Semaine du lundi 23 au dimanche 29 novembre 2026 (dates locales).
const MONDAY = "2026-11-23";
const days = ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"];
const winner = (m: Match) => (simulateResult(m).winnerId === m.player1.id ? m.player1 : m.player2);
const endOf = (m: Match) => new Date(Date.parse(m.startTime) + matchDuration(m.bestOf));

describe("tableau de Roland-Garros (matchs de démo)", () => {
  const week = generateWeek(MONDAY);

  it("joue un tableau à 16 sur la semaine : 8es, quarts, demies, finale", () => {
    expect(week).toHaveLength(15);
    expect(days.map((d) => generateDay(d).map((m) => m.round))).toEqual([
      Array(4).fill("8es de finale"),
      Array(4).fill("8es de finale"),
      Array(2).fill("Quarts de finale"),
      Array(2).fill("Quarts de finale"),
      ["Demi-finales"],
      ["Demi-finales"],
      ["Finale"],
    ]);
    // Le même tableau quel que soit le jour de la semaine demandé.
    expect(generateWeek("2026-11-27").map((m) => m.id)).toEqual(week.map((m) => m.id));
  });

  it("fait passer les vainqueurs au tour suivant, après la fin de leurs matchs", () => {
    for (const m of week) {
      const feeders = feederIds(m.id).map((id) => week.find((w) => w.id === id)!);
      if (m.round === "8es de finale") {
        expect(feeders).toEqual([]);
        continue;
      }
      expect(feeders).toHaveLength(2);
      expect([m.player1.id, m.player2.id]).toEqual(feeders.map((f) => winner(f).id));
      for (const f of feeders) expect(endOf(f).getTime()).toBeLessThan(Date.parse(m.startTime));
    }
  });

  it("aligne 16 joueurs différents et place les deux meilleurs dans des moitiés opposées", () => {
    const firstRound = week.filter((m) => m.round === "8es de finale").flatMap((m) => [m.player1, m.player2]);
    expect(new Set(firstRound.map((p) => p.id)).size).toBe(16);
    const byRank = [...firstRound].sort((a, b) => a.ranking! - b.ranking!);
    const half = (id: string) => (firstRound.findIndex((p) => p.id === id) < 8 ? "haut" : "bas");
    expect(half(byRank[0].id)).not.toBe(half(byRank[1].id));
  });
});

describe("visibilité des tours suivants", () => {
  const sf = generateDay("2026-11-27")[0]; // vendredi : 1re demi-finale
  const sf2 = generateDay("2026-11-28")[0]; // samedi : 2e demi-finale
  const final = generateDay("2026-11-29")[0];

  it("n'affiche la finale qu'une fois les deux demi-finales terminées", async () => {
    const provider = createMockProvider(memoryStorage());
    // Samedi, pendant la 2e demi-finale : finale invisible, annoncée comme en attente.
    let now = new Date(Date.parse(sf2.startTime) + 60 * 60_000);
    expect(await provider.getMatchesForDay("2026-11-29", now)).toEqual([]);
    expect(await provider.getPendingRounds!("2026-11-29", now)).toEqual([
      { round: "Finale", count: 1, waitingFor: "Demi-finales", startTime: final.startTime },
    ]);

    // Samedi soir, les deux demies terminées : la finale apparaît avec les deux vainqueurs.
    now = new Date(endOf(sf2).getTime() + 60_000);
    const [visible] = await provider.getMatchesForDay("2026-11-29", now);
    expect(visible).toMatchObject({ id: final.id, status: "upcoming" });
    expect([visible.player1.id, visible.player2.id]).toEqual([winner(sf).id, winner(sf2).id]);
    expect(await provider.getPendingRounds!("2026-11-29", now)).toEqual([]);
  });

  it("affiche les quarts du mercredi dès la fin des 8es du lundi, mais pas ceux du jeudi", async () => {
    const provider = createMockProvider(memoryStorage());
    const lastMondayMatch = generateDay("2026-11-23").at(-1)!;
    const now = new Date(endOf(lastMondayMatch).getTime() + 60_000); // lundi soir
    expect(await provider.getMatchesForDay("2026-11-25", now)).toHaveLength(2);
    expect(await provider.getMatchesForDay("2026-11-26", now)).toHaveLength(0);
    expect(await provider.getPendingRounds!("2026-11-26", now)).toMatchObject([
      { round: "Quarts de finale", count: 2, waitingFor: "8es de finale" },
    ]);
  });

  it("révèle le tour suivant quand un match est terminé avec l'outil de démo", async () => {
    const storage = memoryStorage();
    const provider = createMockProvider(storage);
    const now = new Date(Date.parse(sf.startTime) - 60 * 60_000); // vendredi, avant la 1re demie
    expect(await provider.getMatchesForDay("2026-11-29", now)).toEqual([]);
    provider.finishNow(sf.id);
    provider.finishNow(sf2.id);
    const [visible] = await provider.getMatchesForDay("2026-11-29", now);
    expect(visible.id).toBe(final.id);
  });
});

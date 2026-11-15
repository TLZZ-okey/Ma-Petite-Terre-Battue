import { describe, expect, it } from "vitest";
import { findScoreMatch, normalizeMatch, normalizeStatus, samePlayer } from "../lib/server/sportscore";

describe("SportScore (lecture tolérante)", () => {
  it("lit un format de type SofaScore (home_score.periodN)", () => {
    const m = normalizeMatch({
      id: 42,
      home_team: { name: "Sinner J." },
      away_team: { name: "Fils A." },
      status: { type: "finished" },
      home_score: { current: 3, period1: 6, period2: 6, period3: 6 },
      away_score: { current: 0, period1: 3, period2: 4, period3: 2 },
      start_timestamp: 1780131600,
    })!;
    expect(m).toMatchObject({ home: "Sinner J.", away: "Fils A.", status: "finished", homeSets: 3, awaySets: 0 });
    expect(m.periods).toEqual([[6, 3], [6, 4], [6, 2]]);
    expect(m.startTime).toBe(new Date(1780131600 * 1000).toISOString());
  });

  it("lit un format plat avec score texte et sets en liste", () => {
    const m = normalizeMatch({
      slug: "a-vs-b",
      home: "Iga Swiatek",
      away: "Coco Gauff",
      status: "Ended",
      score: "1-2",
      sets: ["6-4", "3-6", "2-6"],
      start_time: "2026-06-01T12:00:00Z",
    })!;
    expect(m).toMatchObject({ homeSets: 1, awaySets: 2, status: "finished" });
    expect(m.periods).toEqual([[6, 4], [3, 6], [2, 6]]);
  });

  it("déduit les sets des jeux si le total manque, et ignore les éléments sans joueurs", () => {
    const m = normalizeMatch({ home: "A Aaa", away: "B Bbb", status: "completed", periods: [{ home: 6, away: 1 }, { home: 7, away: 5 }] })!;
    expect(m).toMatchObject({ homeSets: 2, awaySets: 0, status: "finished" });
    expect(normalizeMatch({ foo: 1 })).toBeNull();
  });

  it("reconnaît les statuts courants", () => {
    expect(normalizeStatus("FT")).toBe("finished");
    expect(normalizeStatus({ type: "inprogress", description: "2nd set" })).toBe("live");
    expect(normalizeStatus("Not started")).toBe("scheduled");
    expect(normalizeStatus("Retired")).toBe("finished");
    expect(normalizeStatus(undefined)).toBe("unknown");
  });

  it("rapproche les noms des deux API", () => {
    expect(samePlayer("Jannik Sinner", "Sinner J.")).toBe(true);
    expect(samePlayer("Félix Auger-Aliassime", "Auger Aliassime F.")).toBe(true);
    expect(samePlayer("Jannik Sinner", "Alcaraz C.")).toBe(false);
    const candidates = [
      normalizeMatch({ home: "Fils A.", away: "Sinner J.", start_time: "2026-05-30T09:05:00Z" })!,
    ];
    expect(findScoreMatch("Jannik Sinner", "Arthur Fils", "2026-05-30T09:00:00Z", candidates)).toMatchObject({ swapped: true });
    // Trop éloigné dans le temps : pas le même match.
    expect(findScoreMatch("Jannik Sinner", "Arthur Fils", "2026-06-05T09:00:00Z", candidates)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  activeTennisKeys,
  consensusOdds,
  eventToMatch,
  tournamentFromSport,
  type OddsApiEvent,
} from "../lib/server/oddsApi";

export const EVENT: OddsApiEvent = {
  id: "e1",
  sport_key: "tennis_atp_french_open",
  sport_title: "ATP French Open",
  commence_time: "2026-05-30T09:00:00Z",
  home_team: "Jannik Sinner",
  away_team: "Arthur Fils",
  bookmakers: [
    { key: "a", title: "A", markets: [{ key: "h2h", outcomes: [{ name: "Jannik Sinner", price: 1.2 }, { name: "Arthur Fils", price: 4.5 }] }] },
    { key: "b", title: "B", markets: [{ key: "h2h", outcomes: [{ name: "Jannik Sinner", price: 1.25 }, { name: "Arthur Fils", price: 4.2 }] }] },
    { key: "c", title: "C", markets: [{ key: "h2h", outcomes: [{ name: "Jannik Sinner", price: 1.22 }, { name: "Arthur Fils", price: 4.0 }] }] },
    { key: "d", title: "D", markets: [{ key: "spreads", outcomes: [{ name: "Jannik Sinner", price: 1.9 }] }] },
  ],
};

describe("The Odds API", () => {
  it("garde uniquement les tournois de tennis actifs, hors paris sur le vainqueur du tournoi", () => {
    expect(
      activeTennisKeys([
        { key: "tennis_atp_french_open", group: "Tennis", title: "", description: "", active: true, has_outrights: false },
        { key: "tennis_wta_french_open", group: "Tennis", title: "", description: "", active: false, has_outrights: false },
        // Circuit WTA désactivé (lib/settings.ts) : jamais interrogé, même actif.
        { key: "tennis_wta_wimbledon", group: "Tennis", title: "", description: "", active: true, has_outrights: false },
        { key: "tennis_atp_french_open_winner", group: "Tennis", title: "", description: "", active: true, has_outrights: true },
        { key: "soccer_epl", group: "Soccer", title: "", description: "", active: true, has_outrights: false },
      ]),
    ).toEqual(["tennis_atp_french_open"]);
  });

  it("n'interroge que Roland-Garros (ATP), réglage de lib/settings.ts", () => {
    const sport = (key: string) => ({ key, group: "Tennis", title: key, description: "", active: true, has_outrights: false });
    expect(
      activeTennisKeys([
        sport("tennis_atp_aus_open_singles"),
        sport("tennis_atp_wimbledon"),
        sport("tennis_atp_paris_masters"),
        sport("tennis_wta_french_open"),
        sport("tennis_atp_french_open"),
      ]),
    ).toEqual(["tennis_atp_french_open"]);
  });

  it("calcule la cote médiane des bookmakers (marché h2h uniquement)", () => {
    expect(consensusOdds(EVENT)).toEqual({ home: 1.22, away: 4.2 });
    expect(consensusOdds({ ...EVENT, bookmakers: [] })).toEqual({ home: null, away: null });
  });

  it("déduit catégorie, surface et circuit du tournoi", () => {
    expect(tournamentFromSport("tennis_atp_french_open", "ATP French Open")).toMatchObject({
      name: "Roland-Garros",
      city: "Paris",
      category: "Grand Chelem",
      surface: "terre-battue",
    });
    expect(tournamentFromSport("tennis_wta_wimbledon", "WTA Wimbledon")).toMatchObject({ surface: "gazon" });
    expect(tournamentFromSport("tennis_atp_paris_masters", "ATP Paris Masters")).toMatchObject({
      category: "Masters 1000",
      surface: "indoor",
    });
    expect(tournamentFromSport("tennis_wta_madrid_open", "WTA Madrid Open")).toMatchObject({ category: "WTA 1000" });
  });

  it("convertit un match en match de l'application", () => {
    const m = eventToMatch(EVENT)!;
    expect(m.id).toBe("toa_e1");
    expect(m.bestOf).toBe(5); // Grand Chelem masculin
    expect(m.player1).toMatchObject({ id: "atp-jannik-sinner", name: "Jannik Sinner", ranking: null, country: "" });
    expect([m.odds1, m.odds2]).toEqual([1.22, 4.2]);
    expect(eventToMatch({ ...EVENT, sport_key: "tennis_wta_french_open" })!.bestOf).toBe(3);
    expect(eventToMatch({ ...EVENT, bookmakers: [] })).toBeNull();
  });
});

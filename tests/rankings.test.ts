import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { countryToIso2, enrichPlayer, findRanked, nameKey, parseRankings } from "../lib/server/rankings";
import type { Player } from "../lib/types";

const load = (tour: string) =>
  parseRankings(JSON.parse(readFileSync(new URL(`./fixtures/espn-rankings-${tour}.json`, import.meta.url), "utf8")));

describe("classements ESPN (format réel, relevé le 24/11/2026)", () => {
  const atp = load("atp");
  const wta = load("wta");

  it("lit le classement, le pays et la date de publication", () => {
    expect(atp.updated).toBe("2026-11-19T08:00Z");
    expect(atp.players[0]).toEqual({ name: "Alexander Zverev", rank: 1, country: "DE", countryName: "Germany" });
    expect(wta.players.find((p) => p.name === "Elena Rybakina")).toMatchObject({ rank: 1, country: "KZ" });
  });

  it("convertit les codes pays propres à ESPN", () => {
    expect(atp.players.find((p) => p.name === "Novak Djokovic")?.country).toBe("RS"); // SER
    expect(wta.players.find((p) => p.name === "Sorana Cirstea")?.country).toBe("RO"); // ROM
    expect(wta.players.find((p) => p.name === "Joanna Garland")?.country).toBe("TW"); // TPO
    expect(countryToIso2("FRA")).toBe("FR");
    expect(countryToIso2("XYZ")).toBe("");
  });

  it("retrouve les joueurs malgré accents, ordre des noms et homonymes", () => {
    expect(findRanked("Félix Auger-Aliassime", atp.players)?.rank).toBe(17);
    expect(findRanked("Yunchaokete Bu", atp.players)?.rank).toBe(94);
    expect(findRanked("Francisco Cerundolo", atp.players)?.rank).toBe(20);
    expect(findRanked("Juan Manuel Cerundolo", atp.players)?.rank).toBe(54);
    expect(findRanked("J. Sinner", atp.players)?.rank).toBe(2); // initiale + nom, sans ambiguïté
    expect(findRanked("Inconnu Total", atp.players)).toBeNull();
    expect(nameKey("Botic Van De Zandschulp")).toBe(nameKey("botic van de zandschulp"));
  });

  it("complète un joueur venant de The Odds API", () => {
    const p: Player = { id: "atp-jannik-sinner", name: "Jannik Sinner", country: "", ranking: null, tour: "ATP" };
    expect(enrichPlayer(p, { ATP: atp })).toMatchObject({ ranking: 2, country: "IT", countryName: "Italy" });
    // Hors des 150 premiers ou circuit sans classement : inchangé.
    expect(enrichPlayer({ ...p, name: "Inconnu Total" }, { ATP: atp })).toEqual({ ...p, name: "Inconnu Total" });
    expect(enrichPlayer({ ...p, tour: "WTA" }, { ATP: atp })).toEqual({ ...p, tour: "WTA" });
  });
});

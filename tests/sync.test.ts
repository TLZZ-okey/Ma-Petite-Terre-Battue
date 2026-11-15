import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryStore } from "../lib/server/matchStore";
import type { Fetcher, OddsApiEvent } from "../lib/server/oddsApi";
import { __resetInFlight, refresh, toMatchState, type SyncConfig } from "../lib/server/sync";
import { EVENT } from "./oddsApi.test";

const HOUR = 3600_000;

/** Fausses API : compte les appels pour vérifier l'économie de quota. */
function fakeApis(opts: { events: () => OddsApiEvent[]; scores: () => unknown[] }) {
  const calls = { sports: 0, odds: 0, scores: 0 };
  const fetcher: Fetcher = async (url) => {
    const u = new URL(url);
    const json = (body: unknown, headers: Record<string, string> = {}) =>
      new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json", ...headers } });
    if (u.hostname === "api.the-odds-api.com" && u.pathname === "/v4/sports/") {
      calls.sports++;
      return json([{ key: "tennis_atp_french_open", group: "Tennis", title: "ATP French Open", description: "", active: true, has_outrights: false }], {
        "x-requests-remaining": "499",
        "x-requests-used": "1",
      });
    }
    if (u.hostname === "api.the-odds-api.com" && u.pathname.endsWith("/odds/")) {
      calls.odds++;
      expect(u.searchParams.get("markets")).toBe("h2h");
      return json(opts.events(), { "x-requests-remaining": "498", "x-requests-used": "2" });
    }
    if (u.hostname === "sportscore.com") {
      calls.scores++;
      expect(u.searchParams.get("sport")).toBe("tennis");
      return json({ matches: opts.scores() });
    }
    return new Response("not found", { status: 404 });
  };
  return { fetcher, calls };
}

describe("synchronisation The Odds API + SportScore", () => {
  beforeEach(() => __resetInFlight());

  it("importe les matchs, fige les cotes au début du match puis récupère le résultat", async () => {
    let now = new Date("2026-05-30T06:00:00Z");
    let price = 1.22;
    const finished = [
      {
        home_team: { name: "Fils A." },
        away_team: { name: "Sinner J." },
        status: { type: "finished" },
        home_score: { current: 1, period1: 6, period2: 3, period3: 4, period4: 2 },
        away_score: { current: 3, period1: 4, period2: 6, period3: 6, period4: 6 },
        start_time: "2026-05-30T09:02:00Z",
      },
    ];
    let scores: unknown[] = [];
    const { fetcher, calls } = fakeApis({
      events: () => [{ ...EVENT, bookmakers: [{ key: "a", title: "A", markets: [{ key: "h2h", outcomes: [{ name: "Jannik Sinner", price }, { name: "Arthur Fils", price: 4.2 }] }] }] }],
      scores: () => scores,
    });
    const cfg: SyncConfig = { apiKey: "test", fetcher, store: createMemoryStore(), oddsTtlMs: 6 * HOUR, scoresTtlMs: 3 * 60_000, now: () => now };

    // 1. Import avant le match.
    let data = await refresh(cfg);
    expect(calls).toEqual({ sports: 1, odds: 1, scores: 0 });
    expect(data.meta.quota).toEqual({ remaining: 498, used: 2 });
    expect(toMatchState(data.matches.toa_e1, now)).toMatchObject({ status: "upcoming", odds1: 1.22 });

    // 2. Rappel immédiat : aucune nouvelle requête (cache).
    await refresh(cfg);
    expect(calls.odds).toBe(1);

    // 3. Le match a commencé, les bookmakers changent leur cote : la nôtre reste figée.
    now = new Date("2026-05-30T15:30:00Z");
    price = 1.05;
    data = await refresh(cfg);
    expect(calls.odds).toBe(2);
    expect(data.matches.toa_e1.match.odds1).toBe(1.22);
    expect(calls.scores).toBe(1); // match commencé sans résultat → on interroge SportScore
    expect(toMatchState(data.matches.toa_e1, now).status).toBe("live");

    // 4. SportScore annonce le match terminé (joueurs dans l'autre ordre).
    scores = finished;
    now = new Date(now.getTime() + 5 * 60_000);
    data = await refresh(cfg);
    const state = toMatchState(data.matches.toa_e1, now);
    expect(state.status).toBe("finished");
    expect(state.result).toEqual({
      winnerId: "atp-jannik-sinner",
      sets: 4,
      score: ["4-6", "6-3", "6-4", "6-2"], // du point de vue du vainqueur
    });

    // 5. Plus aucun match en attente : SportScore n'est plus interrogé.
    now = new Date(now.getTime() + 10 * 60_000);
    await refresh(cfg);
    expect(calls.scores).toBe(2);
  });

  it("garde les données connues et note l'erreur si une API échoue", async () => {
    const store = createMemoryStore();
    const now = new Date("2026-05-30T06:00:00Z");
    const fetcher: Fetcher = async () => new Response(JSON.stringify({ message: "Usage quota has been reached" }), { status: 401 });
    const data = await refresh({ apiKey: "k", fetcher, store, oddsTtlMs: HOUR, scoresTtlMs: HOUR, now: () => now });
    expect(data.meta.lastError).toContain("401");
    expect(data.meta.lastError).toContain("quota");
    expect(data.meta.lastError).not.toContain("apiKey");
  });

  it("n'appelle pas The Odds API sans clé", async () => {
    const { fetcher, calls } = fakeApis({ events: () => [], scores: () => [] });
    await refresh({ apiKey: undefined, fetcher, store: createMemoryStore(), oddsTtlMs: HOUR, scoresTtlMs: HOUR });
    expect(calls).toEqual({ sports: 0, odds: 0, scores: 0 });
  });
});

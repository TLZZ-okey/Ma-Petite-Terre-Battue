import { syncConfig } from "@/lib/server/config";
import { nextRankingsRelease } from "@/lib/server/rankings";

// Données toujours fraîches : jamais de mise en cache de la réponse.
export const dynamic = "force-dynamic";

/** État de la connexion aux API (diagnostic, sans jamais exposer la clé). */
export async function GET() {
  const cfg = syncConfig();
  const data = await cfg.store.read();
  const matches = Object.values(data.matches);
  return Response.json({
    oddsApiConfigured: Boolean(cfg.apiKey),
    refresh: { oddsMinutes: cfg.oddsTtlMs / 60_000, scoresMinutes: cfg.scoresTtlMs / 60_000 },
    lastOddsSync: data.meta.lastOddsSync,
    lastScoresSync: data.meta.lastScoresSync,
    quota: data.meta.quota,
    lastError: data.meta.lastError,
    activeTournaments: data.meta.activeTournaments,
    matches: { total: matches.length, withResult: matches.filter((m) => m.result).length },
    rankings: {
      fetchedAt: data.rankings.fetchedAt,
      nextRefresh: nextRankingsRelease(new Date()).toISOString(),
      atp: { updated: data.rankings.tables.ATP?.updated ?? null, players: data.rankings.tables.ATP?.players.length ?? 0 },
      wta: { updated: data.rankings.tables.WTA?.updated ?? null, players: data.rankings.tables.WTA?.players.length ?? 0 },
    },
    scoresSample: data.meta.scoresSample,
  });
}

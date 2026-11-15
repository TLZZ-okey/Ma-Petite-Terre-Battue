import { syncConfig } from "@/lib/server/config";

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
    scoresSample: data.meta.scoresSample,
  });
}

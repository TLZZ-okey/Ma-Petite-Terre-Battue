import { syncConfig } from "@/lib/server/config";
import { refresh, toMatchState } from "@/lib/server/sync";

// Données toujours fraîches : jamais de mise en cache de la réponse.
export const dynamic = "force-dynamic";

/**
 * GET /api/matches?from=ISO&to=ISO  → matchs dont le début est dans l'intervalle
 * GET /api/matches?ids=a,b,c        → matchs par identifiant
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const cfg = syncConfig();
  if (!cfg.apiKey) {
    return Response.json(
      { error: "Clé The Odds API manquante : ajoute ODDS_API_KEY dans .env.local puis redémarre le serveur." },
      { status: 503 },
    );
  }

  const data = await refresh(cfg);
  const now = new Date();
  let stored = Object.values(data.matches);

  const ids = params.get("ids");
  if (ids !== null) {
    const wanted = new Set(ids.split(",").filter(Boolean));
    stored = stored.filter((s) => wanted.has(s.match.id));
  } else {
    const from = Date.parse(params.get("from") ?? "");
    const to = Date.parse(params.get("to") ?? "");
    if (Number.isNaN(from) || Number.isNaN(to)) {
      return Response.json({ error: "Paramètres attendus : from et to (dates ISO), ou ids." }, { status: 400 });
    }
    stored = stored.filter((s) => {
      const t = Date.parse(s.match.startTime);
      return t >= from && t < to;
    });
  }

  const matches = stored
    .map((s) => toMatchState(s, now))
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
  return Response.json({ matches, warning: data.meta.lastError });
}

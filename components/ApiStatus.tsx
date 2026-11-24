"use client";

import { enabledTournamentsLabel } from "@/lib/settings";
import { useApp } from "./AppProvider";
import { useAsync } from "./hooks";

interface Status {
  oddsApiConfigured: boolean;
  refresh: { oddsMinutes: number; scoresMinutes: number };
  lastOddsSync: string | null;
  lastScoresSync: string | null;
  quota: { remaining: number | null; used: number | null };
  lastError: string | null;
  activeTournaments: string[];
  matches: { total: number; withResult: number };
  rankings?: {
    fetchedAt: string | null;
    nextRefresh: string;
    atp: { updated: string | null; players: number };
    wta: { updated: string | null; players: number };
  };
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "jamais";

/** État des API externes (affiché dans le profil quand la source est « api »). */
export function ApiStatusSection() {
  const { dataVersion } = useApp();
  const { data, error } = useAsync<Status>(async () => {
    const res = await fetch("/api/status", { cache: "no-store" });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return res.json();
  }, [dataVersion]);

  return (
    <section className="mx-4 mt-4 rounded-2xl border border-sand bg-white p-4 shadow-sm md:mx-0">
      <h2 className="mb-3 text-sm font-extrabold tracking-wide text-rg-dark uppercase">Données en direct</h2>
      <p className="mb-3 text-xs text-muted">
        Programme et cotes : <strong>The Odds API</strong>
        {enabledTournamentsLabel() && <> ({enabledTournamentsLabel()} uniquement)</>}. Scores : <strong>SportScore</strong>. Classements et
        nationalités : <strong>ESPN</strong> (150 premiers ATP). Les cotes sont figées au début de chaque match.
      </p>
      {error && <p className="mb-2 rounded-lg bg-live/10 px-3 py-2 text-xs font-semibold text-live">{error}</p>}
      {data && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          <dt className="text-muted">Clé The Odds API</dt>
          <dd className="font-semibold">{data.oddsApiConfigured ? "configurée ✓" : "manquante ✗"}</dd>
          <dt className="text-muted">Requêtes restantes</dt>
          <dd className="font-semibold">{data.quota.remaining ?? "—"} (ce mois-ci)</dd>
          <dt className="text-muted">Cotes mises à jour</dt>
          <dd className="font-semibold">
            {when(data.lastOddsSync)} · toutes les {Math.round(data.refresh.oddsMinutes / 60)} h
          </dd>
          <dt className="text-muted">Scores mis à jour</dt>
          <dd className="font-semibold">
            {when(data.lastScoresSync)} · toutes les {data.refresh.scoresMinutes} min
          </dd>
          <dt className="text-muted">Classements</dt>
          <dd className="font-semibold">
            {data.rankings?.atp.players
              ? `ATP ${data.rankings.atp.players} joueurs (ESPN, ${when(data.rankings.atp.updated)})`
              : "pas encore chargés"}
            {data.rankings && (
              <span className="block font-normal text-muted">
                Mis à jour chaque lundi · prochaine fois le{" "}
                {new Date(data.rankings.nextRefresh).toLocaleString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </dd>
          <dt className="text-muted">Tournois suivis</dt>
          <dd className="font-semibold">{data.activeTournaments.length || "aucun pour l'instant"}</dd>
          <dt className="text-muted">Matchs connus</dt>
          <dd className="font-semibold">
            {data.matches.total} dont {data.matches.withResult} terminés
          </dd>
        </dl>
      )}
      {data?.lastError && (
        <p className="mt-3 rounded-lg bg-live/10 px-3 py-2 text-xs text-live">Dernière erreur : {data.lastError}</p>
      )}
      <SportScoreCredit className="mt-3" />
    </section>
  );
}

/** Mention obligatoire des conditions d'utilisation gratuites de SportScore. */
export function SportScoreCredit({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] text-muted ${className}`}>
      Scores :{" "}
      <a href="https://sportscore.com/" target="_blank" rel="noopener" className="font-semibold underline">
        Powered by SportScore
      </a>
    </p>
  );
}

/**
 * Bandeau de la page Matchs (source « api ») : explique pourquoi aucun match n'apparaît
 * (clé manquante, intersaison…) au lieu d'une simple liste vide.
 */
export function ApiNotice() {
  const { source } = useApp();
  const { data } = useAsync<Status | null>(async () => {
    if (source !== "api") return null;
    const res = await fetch("/api/status", { cache: "no-store" });
    return res.ok ? res.json() : null;
  }, [source]);

  if (!data) return null;
  let message: string | null = null;
  if (!data.oddsApiConfigured) {
    message = "Clé The Odds API manquante : ajoute ODDS_API_KEY dans .env.local puis redémarre le serveur.";
  } else if (data.lastOddsSync && data.activeTournaments.length === 0) {
    const followed = enabledTournamentsLabel();
    message = followed
      ? `Aucun match de ${followed} pour l'instant : les matchs et leurs cotes apparaîtront quelques jours avant le début du tournoi.`
      : "Aucun tournoi de tennis n'est couvert par The Odds API en ce moment (intersaison). Les matchs réapparaîtront dès la reprise des grands tournois.";
  }
  if (!message) return null;
  return (
    <p role="status" className="mx-4 mt-4 rounded-xl border border-clay/30 bg-clay-50 px-4 py-3 text-sm text-ink md:mx-0">
      {message}
    </p>
  );
}

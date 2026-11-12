"use client";

import { enabledTournamentsLabel } from "@/lib/settings";
import { useApp } from "./AppProvider";
import { useAsync } from "./hooks";
import { InfoIcon } from "./icons";
import { Card, cx } from "./ui";

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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <dt className="text-ink-3 sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="font-medium text-ink">{children}</dd>
    </div>
  );
}

/** État des API externes (affiché dans le profil quand la source est « api »). */
export function ApiStatusSection() {
  const { dataVersion } = useApp();
  const { data, error } = useAsync<Status>(async () => {
    const res = await fetch("/api/status", { cache: "no-store" });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return res.json();
  }, [dataVersion]);
  const followed = enabledTournamentsLabel();

  return (
    <Card className="p-5">
      <p className="font-display text-lg font-bold tracking-wide text-court-900 uppercase">Données en direct</p>
      <p className="mt-1 text-sm text-ink-3">
        Programme et cotes : <strong className="font-semibold text-ink-2">The Odds API</strong>
        {followed && <> ({followed} uniquement)</>}. Scores : <strong className="font-semibold text-ink-2">SportScore</strong>.
        Classements et nationalités : <strong className="font-semibold text-ink-2">ESPN</strong> (150 premiers ATP). Les
        cotes sont figées au début de chaque match.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {data && (
        <dl className="mt-3 text-sm">
          <Row label="Clé The Odds API">
            <span className={data.oddsApiConfigured ? "text-court-700" : "text-danger"}>
              {data.oddsApiConfigured ? "Configurée ✓" : "Manquante ✗"}
            </span>
          </Row>
          <Row label="Requêtes restantes">
            <span className="tabular">{data.quota.remaining ?? "—"}</span> <span className="text-ink-3">ce mois-ci</span>
          </Row>
          <Row label="Cotes">
            {when(data.lastOddsSync)}{" "}
            <span className="text-ink-3">· toutes les {Math.round(data.refresh.oddsMinutes / 60)} h</span>
          </Row>
          <Row label="Scores">
            {when(data.lastScoresSync)} <span className="text-ink-3">· toutes les {data.refresh.scoresMinutes} min</span>
          </Row>
          <Row label="Classements">
            {data.rankings?.atp.players
              ? `ATP · ${data.rankings.atp.players} joueurs (publié le ${when(data.rankings.atp.updated)})`
              : "Pas encore chargés"}
            {data.rankings && (
              <span className="block text-xs font-normal text-ink-3">
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
          </Row>
          <Row label="Tournois en cours">{data.activeTournaments.length || "Aucun pour l'instant"}</Row>
          <Row label="Matchs connus">
            {data.matches.total} <span className="text-ink-3">dont {data.matches.withResult} terminés</span>
          </Row>
        </dl>
      )}

      {data?.lastError && (
        <p className="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-xs text-danger">Dernière erreur : {data.lastError}</p>
      )}
      <SportScoreCredit className="mt-4" />
    </Card>
  );
}

/** Mention obligatoire des conditions d'utilisation gratuites de SportScore. */
export function SportScoreCredit({ className }: { className?: string }) {
  return (
    <p className={cx("text-xs text-ink-3", className)}>
      Scores :{" "}
      <a
        href="https://sportscore.com/"
        target="_blank"
        rel="noopener"
        className="font-semibold text-ink-2 underline underline-offset-2 hover:text-court-700"
      >
        Powered by SportScore
      </a>
    </p>
  );
}

/**
 * Bandeau de la page Matchs (source « api ») : explique pourquoi aucun match n'apparaît
 * (clé manquante, hors période du tournoi…) au lieu d'une simple liste vide.
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
    <p role="status" className="mb-4 flex gap-3 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-ink-2">
      <InfoIcon width={18} height={18} className="mt-0.5 shrink-0 text-clay-600" />
      {message}
    </p>
  );
}

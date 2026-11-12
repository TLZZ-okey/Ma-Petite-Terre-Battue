"use client";

import { useState, type ReactNode } from "react";
import { SURFACE_LABELS } from "@/lib/data/tournaments";
import { flag, formatPoints, formatTime, pts, shortName } from "@/lib/format";
import {
  oddsToPoints,
  predictionFromScore,
  scoreFromPrediction,
  scorePrediction,
  setsToWin,
  validateSetScore,
} from "@/lib/scoring";
import type { MatchState, Player, Prediction } from "@/lib/types";
import { CheckIcon, LockIcon } from "./icons";
import { Badge, cx } from "./ui";

export interface MatchCardProps {
  match: MatchState;
  prediction?: Prediction;
  busy?: boolean;
  /** winnerId = null : suppression du pronostic. */
  onPredict?: (winnerId: string | null, sets: number | null) => void;
  /** Affiche la date et le tournoi (utile hors de la page Matchs). */
  showContext?: boolean;
}

type Draft = [number | null, number | null];

function draftFromPrediction(match: MatchState, prediction?: Prediction): Draft {
  if (!prediction) return [null, null];
  const score = scoreFromPrediction(match, prediction);
  if (score) return score;
  // Ancien prono sans nombre de sets : on pré-remplit le vainqueur.
  const need = setsToWin(match.bestOf);
  return prediction.winnerId === match.player1.id ? [need, null] : [null, need];
}

export function MatchCard(props: MatchCardProps) {
  if (props.match.status === "finished") return <FinishedCard {...props} />;
  return <OpenCard {...props} />;
}

/* ------------------------------------------------------------------ */
/* Éléments communs                                                    */
/* ------------------------------------------------------------------ */

function CardShell({ children, accent }: { children: ReactNode; accent?: string }) {
  return (
    <article
      className={cx(
        "flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-card transition-shadow hover:shadow-raised",
        accent ?? "border-line",
      )}
    >
      {children}
    </article>
  );
}

function CardHeader({ match, showContext, status }: { match: MatchState; showContext?: boolean; status: ReactNode }) {
  const date = new Date(match.startTime).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return (
    <header className="flex items-start gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0 flex-1">
        {showContext ? (
          <>
            <p className="tabular text-sm font-semibold whitespace-nowrap text-ink first-letter:uppercase">
              {date} · {formatTime(match.startTime)}
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-3">
              {match.tournament.name} · {match.round} · {SURFACE_LABELS[match.tournament.surface]}
            </p>
          </>
        ) : (
          <p className="flex items-center gap-1.5 text-sm">
            <span className="tabular font-semibold text-ink">{formatTime(match.startTime)}</span>
            <span className="text-ink-3" aria-hidden>
              ·
            </span>
            <span className="truncate text-ink-3">{match.court}</span>
          </p>
        )}
      </div>
      <div className="shrink-0">{status}</div>
    </header>
  );
}

function PlayerIdentity({ player, strong }: { player: Player; strong?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-xl ring-1 ring-line"
        aria-hidden
      >
        {flag(player.country)}
      </span>
      <span className="min-w-0">
        <span className={cx("block truncate text-[15px] leading-tight", strong ? "font-bold text-court-900" : "font-medium text-ink")}>
          <span className="sm:hidden">{shortName(player.name)}</span>
          <span className="hidden sm:inline">{player.name}</span>
        </span>
        <span className="tabular block text-xs text-ink-3">
          {player.country} · n°{player.ranking}
        </span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Match à venir ou en cours                                           */
/* ------------------------------------------------------------------ */

function OpenCard({ match, prediction, busy, onPredict, showContext }: MatchCardProps) {
  const open = match.status === "upcoming" && !!onPredict;
  // Le brouillon est la source de vérité de la saisie : il n'est pas réinitialisé
  // quand le prono est enregistré, pour ne pas faire perdre le focus.
  const [draft, setDraft] = useState<Draft>(() => draftFromPrediction(match, prediction));
  const shown = open ? draft : draftFromPrediction(match, prediction);

  const complete = shown[0] !== null && shown[1] !== null;
  const error = open && complete ? validateSetScore(match.bestOf, shown) : null;
  const valid = complete && !error;
  const draftWinner = valid ? predictionFromScore(match, shown as [number, number]).winnerId : undefined;
  const need = setsToWin(match.bestOf);

  const saved =
    !!prediction &&
    valid &&
    (() => {
      const p = predictionFromScore(match, shown as [number, number]);
      return p.winnerId === prediction.winnerId && p.sets === prediction.sets;
    })();

  function update(index: 0 | 1, raw: string) {
    if (!open) return;
    const digits = raw.replace(/\D/g, "").slice(-1);
    const value = digits === "" ? null : Number(digits);
    const next: Draft = index === 0 ? [value, draft[1]] : [draft[0], value];
    setDraft(next);

    // Enregistrement automatique dès que le score saisi est cohérent.
    if (next[0] !== null && next[1] !== null && !validateSetScore(match.bestOf, next)) {
      const p = predictionFromScore(match, next as [number, number]);
      if (p.winnerId !== prediction?.winnerId || p.sets !== prediction?.sets) onPredict!(p.winnerId, p.sets);
    } else if (next[0] === null && next[1] === null && prediction) {
      onPredict!(null, null);
    }
  }

  let status: ReactNode;
  if (match.status === "live") {
    status = (
      <Badge tone="live">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> En direct
      </Badge>
    );
  } else if (saved && !busy) {
    status = (
      <Badge tone="court">
        <CheckIcon width={12} height={12} strokeWidth={3} /> Enregistré
      </Badge>
    );
  } else {
    status = <Badge tone="neutral">{match.tour}</Badge>;
  }

  return (
    <CardShell accent={saved && match.status === "upcoming" ? "border-court-200" : undefined}>
      <CardHeader match={match} showContext={showContext} status={status} />

      <div className="px-2 pt-2 pb-2">
        <div className="flex items-center gap-3 px-2 pb-1 text-[10px] font-semibold tracking-wider text-ink-3 uppercase">
          <span className="flex-1">Joueur</span>
          <span className="w-16 text-right" title="Points gagnés si ce joueur gagne">
            Gain
          </span>
          <span className="w-12 text-center">Sets</span>
        </div>

        {([0, 1] as const).map((index) => {
          const player = index === 0 ? match.player1 : match.player2;
          const odds = index === 0 ? match.odds1 : match.odds2;
          const chosen = (open ? draftWinner : prediction?.winnerId) === player.id && !error;
          return (
            <div
              key={player.id}
              className={cx("flex items-center gap-3 rounded-xl px-2 py-2 transition-colors", chosen && "bg-court-50")}
            >
              <PlayerIdentity player={player} strong={chosen} />
              <span
                className={cx(
                  "tabular w-16 rounded-lg py-1 text-center text-sm font-semibold transition-colors",
                  chosen ? "bg-clay-500 text-white" : "bg-subtle text-ink-2",
                )}
                aria-label={`${formatPoints(oddsToPoints(odds))} points si ${player.name} gagne`}
              >
                +{formatPoints(oddsToPoints(odds))}
              </span>
              <label className="sr-only" htmlFor={`${match.id}-s${index}`}>
                Sets gagnés par {player.name}
              </label>
              <input
                id={`${match.id}-s${index}`}
                value={shown[index] ?? ""}
                onChange={(e) => update(index, e.target.value)}
                onFocus={(e) => e.target.select()}
                disabled={!open}
                inputMode="numeric"
                autoComplete="off"
                placeholder="–"
                aria-invalid={!!error}
                className={cx(
                  "tabular h-12 w-12 rounded-xl border-2 bg-surface text-center font-display text-2xl font-bold transition outline-none placeholder:text-line-strong disabled:cursor-not-allowed disabled:bg-subtle",
                  error
                    ? "border-danger text-danger"
                    : chosen
                      ? "border-court-600 text-court-800"
                      : "border-line-strong text-ink focus:border-court-600",
                  open && "focus:ring-4 focus:ring-court-100",
                )}
              />
            </div>
          );
        })}
      </div>

      <footer className="mt-auto flex min-h-10 items-center gap-2 border-t border-line bg-subtle/60 px-4 py-2 text-xs">
        {error ? (
          <p role="alert" className="font-medium text-danger">
            {error}
          </p>
        ) : match.status === "live" ? (
          <p className="flex items-center gap-1.5 text-ink-2">
            <LockIcon width={14} height={14} /> Pronos fermés pendant le match
          </p>
        ) : (
          <p className="text-ink-3">
            {need} sets gagnants · saisis le score, il s&apos;enregistre tout seul
          </p>
        )}
      </footer>
    </CardShell>
  );
}

/* ------------------------------------------------------------------ */
/* Match terminé                                                       */
/* ------------------------------------------------------------------ */

const OUTCOMES = {
  perfect: { tone: "gold", label: "Score exact", accent: "border-gold-400/60" },
  won: { tone: "court", label: "Gagné", accent: "border-court-200" },
  lost: { tone: "danger", label: "Perdu", accent: "border-danger/30" },
  none: { tone: "neutral", label: "Pas de prono", accent: "border-line" },
} as const;

function FinishedCard({ match, prediction, showContext = true }: MatchCardProps) {
  const result = match.result!;
  const p1Won = result.winnerId === match.player1.id;
  const winnerSets = setsToWin(match.bestOf);
  const loserSets = result.sets - winnerSets;

  const outcome = prediction ? scorePrediction(match, prediction) : null;
  const key = !outcome || outcome.outcome === "pending" ? "none" : outcome.outcome;
  const style = OUTCOMES[key];
  const predicted = prediction ? scoreFromPrediction(match, prediction) : null;
  const predictedWinner = prediction ? (prediction.winnerId === match.player1.id ? match.player1 : match.player2) : null;

  const rows = [
    { player: match.player1, won: p1Won, sets: p1Won ? winnerSets : loserSets, flip: !p1Won },
    { player: match.player2, won: !p1Won, sets: p1Won ? loserSets : winnerSets, flip: p1Won },
  ];

  return (
    <CardShell accent={style.accent}>
      <CardHeader match={match} showContext={showContext} status={<Badge tone="neutral">Terminé</Badge>} />

      <div className="space-y-1 px-2 py-2">
        {rows.map(({ player, won, sets, flip }) => (
          <div key={player.id} className={cx("flex items-center gap-3 rounded-xl px-2 py-2", won && "bg-court-50")}>
            <PlayerIdentity player={player} strong={won} />
            {won && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-court-600 text-white" aria-label="Vainqueur">
                <CheckIcon width={12} height={12} strokeWidth={3} />
              </span>
            )}
            <span className="tabular hidden gap-2.5 text-sm min-[400px]:flex" aria-label="Jeux par set">
              {result.score.map((s, i) => {
                const [w, l] = s.split("-").map(Number);
                const mine = flip ? l : w;
                const theirs = flip ? w : l;
                return (
                  <span key={i} className={cx("w-4 text-center", mine > theirs ? "font-semibold text-ink" : "text-ink-3")}>
                    {mine}
                  </span>
                );
              })}
            </span>
            <span
              className={cx(
                "tabular flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-2xl font-bold",
                won ? "bg-court-700 text-white" : "bg-subtle text-ink-3",
              )}
              aria-label={`${sets} sets`}
            >
              {sets}
            </span>
          </div>
        ))}
      </div>

      <footer className="mt-auto flex items-center gap-3 border-t border-line bg-subtle/60 px-4 py-2.5">
        <div className="min-w-0 flex-1 text-xs">
          {prediction && predictedWinner ? (
            <>
              <span className="text-ink-3">Ton prono · </span>
              <span className="font-semibold text-ink">
                {shortName(predictedWinner.name)}
                {predicted ? ` ${predicted[0]}-${predicted[1]}` : ""}
              </span>
            </>
          ) : (
            <span className="text-ink-3">Tu n&apos;as pas pronostiqué ce match</span>
          )}
        </div>
        <Badge tone={style.tone} className="h-7 px-2.5 text-xs">
          {style.label}
          {outcome && outcome.outcome !== "pending" && (
            <span className="tabular ml-1 normal-case">{outcome.points > 0 ? `+${pts(outcome.points)}` : "0 pt"}</span>
          )}
        </Badge>
      </footer>
    </CardShell>
  );
}

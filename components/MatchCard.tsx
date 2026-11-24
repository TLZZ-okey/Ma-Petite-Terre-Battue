"use client";

import { useState, type ReactNode } from "react";
import { SURFACE_LABELS } from "@/lib/data/tournaments";
import { countryLabel, formatPoints, formatTime, joinInfo, playerBadge, pts, shortName } from "@/lib/format";
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
        "flex animate-rise flex-col overflow-hidden rounded-3xl border-2 bg-surface shadow-chunky transition-transform hover:-translate-y-0.5",
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
    <header className="flex items-start gap-3 border-b-2 border-line bg-subtle px-4 py-3">
      <div className="min-w-0 flex-1">
        {showContext ? (
          <>
            <p className="tabular font-display text-base font-semibold whitespace-nowrap text-ink first-letter:uppercase">
              {date} · {formatTime(match.startTime)}
            </p>
            <p className="mt-0.5 truncate text-xs font-bold text-ink-3">
              {joinInfo(match.tournament.name, match.round, SURFACE_LABELS[match.tournament.surface])}
            </p>
          </>
        ) : (
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <span className="tabular font-display text-lg font-semibold text-ink">{formatTime(match.startTime)}</span>
            {/* Court inconnu avec les données d'API : pas de séparateur orphelin. */}
            {match.court && (
              <>
                <span className="text-ink-3" aria-hidden>
                  ·
                </span>
                <span className="truncate text-ink-3">{match.court}</span>
              </>
            )}
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
        className={cx(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-line bg-surface",
          // Pays inconnu (joueur hors classement ESPN) : initiales à la place du drapeau.
          player.country ? "text-2xl" : "text-xs font-black text-clay-700",
        )}
        title={countryLabel(player.country, player.countryName) || undefined}
        aria-hidden
      >
        {playerBadge(player)}
      </span>
      <span className="min-w-0">
        <span className={cx("block truncate font-display text-[17px] leading-tight", strong ? "font-semibold text-clay-700" : "font-medium text-ink")}>
          <span className="sm:hidden">{shortName(player.name)}</span>
          <span className="hidden sm:inline">{player.name}</span>
        </span>
        {(player.country || player.ranking) && (
          <span className="tabular block truncate text-xs font-bold text-ink-3">
            {joinInfo(countryLabel(player.country, player.countryName), player.ranking && `n°${player.ranking}`)}
          </span>
        )}
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
      <Badge tone="court" className="animate-pop">
        <CheckIcon width={12} height={12} strokeWidth={3.5} /> Prono validé
      </Badge>
    );
  } else if (open) {
    status = <Badge tone="clay">🎯 À toi de jouer</Badge>;
  } else {
    status = <Badge tone="neutral">{match.tour}</Badge>;
  }

  return (
    <CardShell accent={saved && match.status === "upcoming" ? "border-court-200" : error ? "border-danger/40" : undefined}>
      <CardHeader match={match} showContext={showContext} status={status} />

      <div className="px-3 pt-2 pb-3">
        <div className="flex items-center gap-3 px-2 pb-1 text-[11px] font-extrabold tracking-wide text-ink-3 uppercase">
          <span className="flex-1">Joueur</span>
          <span className="w-[4.5rem] text-center" title="Points gagnés si ce joueur gagne">
            À gagner
          </span>
          <span className="w-14 text-center">Sets</span>
        </div>

        {([0, 1] as const).map((index) => {
          const player = index === 0 ? match.player1 : match.player2;
          const odds = index === 0 ? match.odds1 : match.odds2;
          const chosen = (open ? draftWinner : prediction?.winnerId) === player.id && !error;
          return (
            <div key={player.id}>
              {index === 1 && (
                <div className="relative my-1 flex items-center justify-center" aria-hidden>
                  <span className="absolute inset-x-2 top-1/2 border-t-2 border-dashed border-line" />
                  <span className="relative rounded-full border-2 border-clay-200 bg-surface px-2.5 font-display text-xs font-bold text-clay-600">
                    VS
                  </span>
                </div>
              )}
              <div
                className={cx(
                  "flex items-center gap-3 rounded-2xl border-2 px-2 py-2 transition-colors",
                  chosen ? "border-clay-200 bg-clay-50" : "border-transparent",
                )}
              >
                <PlayerIdentity player={player} strong={chosen} />
                <span
                  className={cx(
                    "tabular flex w-[4.5rem] items-center justify-center gap-1 rounded-full border-2 py-1 font-display text-base font-semibold transition-all",
                    chosen ? "animate-pop border-ball-dark bg-ball text-ink" : "border-line bg-subtle text-ink-2",
                  )}
                  aria-label={`${formatPoints(oddsToPoints(odds))} points si ${player.name} gagne`}
                >
                  <span aria-hidden className="text-sm">
                    🎾
                  </span>
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
                  placeholder="?"
                  aria-invalid={!!error}
                  className={cx(
                    "tabular h-14 w-14 rounded-2xl border-2 bg-surface text-center font-display text-3xl font-semibold shadow-chunky transition outline-none placeholder:text-line-strong disabled:cursor-not-allowed disabled:bg-subtle disabled:shadow-none",
                    error
                      ? "border-danger text-danger"
                      : chosen
                        ? "border-clay-600 bg-clay-50 text-clay-700"
                        : "border-line-strong text-ink focus:border-clay-500",
                    open && "focus:ring-4 focus:ring-clay-100",
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-auto flex min-h-11 items-center gap-2 border-t-2 border-line px-4 py-2.5 text-sm font-bold">
        {error ? (
          <p role="alert" className="text-danger">
            ⚠️ {error}
          </p>
        ) : match.status === "live" ? (
          <p className="flex items-center gap-1.5 text-ink-2">
            <LockIcon width={16} height={16} /> Match en cours : les pronos sont fermés
          </p>
        ) : saved ? (
          <p className="text-court-700">✅ C&apos;est noté ! Tu peux encore changer d&apos;avis avant le match.</p>
        ) : (
          <p className="text-ink-3">
            {need} sets gagnants · entre le score, il s&apos;enregistre tout seul
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
  perfect: { label: "Score exact !", emoji: "🎯", banner: "border-ball-dark bg-ball text-ink", accent: "border-ball-dark" },
  won: { label: "Bien joué !", emoji: "✅", banner: "border-court-800 bg-court-600 text-white", accent: "border-court-200" },
  lost: { label: "Raté…", emoji: "😬", banner: "border-line bg-subtle text-ink-2", accent: "border-line" },
  none: { label: "Pas de prono", emoji: "🤷", banner: "border-line bg-subtle text-ink-3", accent: "border-line" },
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
      <CardHeader match={match} showContext={showContext} status={<Badge tone="neutral">🏁 Terminé</Badge>} />

      <div className="space-y-1 px-3 py-3">
        {rows.map(({ player, won, sets, flip }) => (
          <div key={player.id} className={cx("flex items-center gap-3 rounded-2xl border-2 px-2 py-2", won ? "border-court-200 bg-court-50" : "border-transparent")}>
            <PlayerIdentity player={player} strong={won} />
            {won && (
              <span className="shrink-0 text-xl" role="img" aria-label="Vainqueur">
                🏆
              </span>
            )}
            <span className="tabular hidden gap-2.5 text-sm font-bold min-[400px]:flex" aria-label="Jeux par set">
              {result.score.map((s, i) => {
                const [w, l] = s.split("-").map(Number);
                const mine = flip ? l : w;
                const theirs = flip ? w : l;
                return (
                  <span key={i} className={cx("w-4 text-center", mine > theirs ? "font-black text-ink" : "text-ink-3")}>
                    {mine}
                  </span>
                );
              })}
            </span>
            <span
              className={cx(
                "tabular flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 font-display text-2xl font-semibold",
                won ? "border-court-800 bg-court-600 text-white shadow-chunky-court" : "border-line bg-subtle text-ink-3",
              )}
              aria-label={`${sets} sets`}
            >
              {sets}
            </span>
          </div>
        ))}
      </div>

      <footer className={cx("mt-auto flex items-center gap-3 border-t-2 px-4 py-3", style.banner)}>
        <span className="text-2xl" aria-hidden>
          {style.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-tight font-semibold">{style.label}</p>
          <p className="truncate text-xs font-bold opacity-85">
            {prediction && predictedWinner
              ? `Ton prono : ${shortName(predictedWinner.name)}${predicted ? ` ${predicted[0]}-${predicted[1]}` : ""}`
              : "Tu n'as pas pronostiqué ce match"}
          </p>
        </div>
        {outcome && outcome.outcome !== "pending" && (
          <span
            className={cx(
              "tabular shrink-0 rounded-2xl border-2 px-3 py-1 font-display text-lg font-semibold",
              outcome.points > 0 ? "border-white/60 bg-white/90 text-clay-700" : "border-line bg-surface text-ink-3",
            )}
          >
            {outcome.points > 0 ? `+${pts(outcome.points)}` : "0 pt"}
          </span>
        )}
      </footer>
    </CardShell>
  );
}

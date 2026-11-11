"use client";

import { useState } from "react";
import { flag, formatPoints, shortName } from "@/lib/format";
import { oddsToPoints, predictionFromScore, scoreFromPrediction, setsToWin, validateSetScore } from "@/lib/scoring";
import type { MatchState, Player, Prediction } from "@/lib/types";
import { FinishedMatchCard } from "./FinishedMatchCard";
import { CheckIcon, LockIcon } from "./icons";
import { MatchContext } from "./MatchContext";

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
  if (props.match.status === "finished") return <FinishedMatchCard match={props.match} prediction={props.prediction} showContext={props.showContext} />;
  return <OpenMatchCard {...props} />;
}

/** Carte d'un match à venir (saisie du score) ou en cours (prono verrouillé). */
function OpenMatchCard({ match, prediction, busy, onPredict, showContext }: MatchCardProps) {
  const open = match.status === "upcoming" && !!onPredict;
  // Le brouillon est la source de vérité de la saisie : il n'est pas réinitialisé
  // quand le prono est enregistré, pour ne pas faire perdre le focus.
  const [draft, setDraft] = useState<Draft>(() => draftFromPrediction(match, prediction));
  const shown = open ? draft : draftFromPrediction(match, prediction);

  const complete = shown[0] !== null && shown[1] !== null;
  const error = open && complete ? validateSetScore(match.bestOf, shown) : null;
  const valid = complete && !error;
  const shownWinner = valid ? predictionFromScore(match, shown as [number, number]).winnerId : prediction?.winnerId;
  const need = setsToWin(match.bestOf);

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

  const saved =
    prediction && valid && (() => {
      const p = predictionFromScore(match, shown as [number, number]);
      return p.winnerId === prediction.winnerId && p.sets === prediction.sets;
    })();

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
        saved && match.status === "upcoming" ? "border-clay/50" : "border-sand"
      }`}
    >
      <MatchContext match={match} showContext={showContext} />

      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-2 px-4 pt-3 pb-4">
        <PlayerBlock player={match.player1} />
        <span
          className={`mt-1.5 flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white ${
            match.status === "live" ? "bg-live" : "bg-clay"
          }`}
        >
          VS
        </span>
        <PlayerBlock player={match.player2} />

        {([0, 1] as const).map((index) => {
          const player = index === 0 ? match.player1 : match.player2;
          const odds = index === 0 ? match.odds1 : match.odds2;
          const highlighted = shownWinner === player.id && !error;
          const cell = (
            <div key={player.id} className="flex flex-col items-center pt-3">
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
                className={`h-14 w-16 rounded-xl border-2 text-center text-2xl font-extrabold transition outline-none placeholder:text-sand disabled:cursor-not-allowed ${
                  error
                    ? "border-live/60 bg-live/5 text-live"
                    : highlighted
                      ? "border-clay bg-clay-50 text-clay-dark"
                      : "border-sand bg-cream text-rg-dark focus:border-rg"
                } ${open ? "focus:ring-4 focus:ring-clay/20" : "disabled:opacity-80"}`}
              />
              <span
                className={`mt-1.5 rounded-full px-2.5 py-0.5 text-sm font-extrabold transition-colors ${
                  highlighted ? "bg-clay text-white" : "bg-cream text-rg-dark"
                }`}
              >
                {formatPoints(oddsToPoints(odds))} pts
              </span>
            </div>
          );
          if (index === 0) return cell;
          return [
            <div key="sep" className="flex h-[4.25rem] flex-col items-center justify-center pt-3">
              {saved && !busy ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rg text-white" title="Prono enregistré">
                  <CheckIcon width={14} height={14} strokeWidth={3} />
                </span>
              ) : match.status === "live" ? (
                <LockIcon width={18} height={18} className="text-live" />
              ) : (
                <span className="text-xl font-black text-sand">–</span>
              )}
              <span className="mt-0.5 text-center text-[9px] leading-tight font-semibold text-muted uppercase">
                {need} sets
                <br />
                gagnants
              </span>
            </div>,
            cell,
          ];
        })}
      </div>

      {error && (
        <p role="alert" className="-mt-1 px-4 pb-3 text-center text-xs font-semibold text-live">
          {error}
        </p>
      )}
    </article>
  );
}

function PlayerBlock({ player }: { player: Player }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-2xl ring-2 ring-sand">
        <span aria-hidden>{flag(player.country)}</span>
      </span>
      <span className="mt-1.5 line-clamp-2 text-sm leading-tight font-semibold">
        <span className="sm:hidden">{shortName(player.name)}</span>
        <span className="hidden sm:inline">{player.name}</span>
      </span>
      <span className="text-[11px] text-muted">
        {player.country} · n°{player.ranking}
      </span>
    </div>
  );
}

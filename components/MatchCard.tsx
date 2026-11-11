"use client";

import { SURFACE_LABELS } from "@/lib/data/tournaments";
import { flag, formatOdds, formatTime, pts, shortName } from "@/lib/format";
import { possibleSets, potentialPoints, scorePrediction } from "@/lib/scoring";
import type { MatchState, Player, Prediction } from "@/lib/types";
import { CheckIcon, ClockIcon, LockIcon } from "./icons";

interface MatchCardProps {
  match: MatchState;
  prediction?: Prediction;
  busy?: boolean;
  /** winnerId = null : suppression du pronostic. */
  onPredict?: (winnerId: string | null, sets: number | null) => void;
  /** Affiche la date et le tournoi (utile hors de la page Matchs). */
  showContext?: boolean;
}

export function MatchCard({ match, prediction, busy, onPredict, showContext }: MatchCardProps) {
  const open = match.status === "upcoming" && !!onPredict;
  const score = prediction ? scorePrediction(match, prediction) : null;
  const winnerId = match.result?.winnerId;

  function chooseWinner(playerId: string) {
    if (!open || busy) return;
    if (prediction?.winnerId === playerId) onPredict!(null, null);
    else onPredict!(playerId, prediction?.sets ?? null);
  }

  function chooseSets(sets: number) {
    if (!open || busy || !prediction) return;
    onPredict!(prediction.winnerId, prediction.sets === sets ? null : sets);
  }

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        prediction && match.status === "upcoming" ? "border-clay/40" : "border-sand"
      }`}
    >
      <div className="flex items-center gap-2 px-4 pt-3 text-xs text-muted">
        <ClockIcon width={14} height={14} />
        <span className="font-semibold text-ink">
          {showContext
            ? new Date(match.startTime).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) +
              " · " +
              formatTime(match.startTime)
            : formatTime(match.startTime)}
        </span>
        <span aria-hidden>·</span>
        <span className="truncate">{showContext ? match.tournament.name : match.court}</span>
        <span className="ml-auto shrink-0">
          <StatusBadge match={match} />
        </span>
      </div>
      {showContext && (
        <p className="px-4 text-[11px] text-muted">
          {match.round} · {match.tour} · {SURFACE_LABELS[match.tournament.surface]}
        </p>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-3 pb-2">
        <PlayerBlock player={match.player1} winner={winnerId} />
        <Center match={match} />
        <PlayerBlock player={match.player2} winner={winnerId} />
      </div>

      <div className="grid grid-cols-2 gap-2 px-4">
        {[
          { player: match.player1, odds: match.odds1 },
          { player: match.player2, odds: match.odds2 },
        ].map(({ player, odds }) => (
          <OddsButton
            key={player.id}
            odds={odds}
            selected={prediction?.winnerId === player.id}
            open={open}
            correct={winnerId ? winnerId === player.id : undefined}
            disabled={busy}
            onClick={() => chooseWinner(player.id)}
            label={`Pronostiquer la victoire de ${player.name}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 pt-3">
        <span className="text-xs font-bold tracking-wide text-muted uppercase">Sets</span>
        <div className="flex gap-1.5">
          {possibleSets(match.bestOf).map((n) => {
            const selected = prediction?.sets === n;
            const actual = match.result?.sets === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => chooseSets(n)}
                disabled={!open || !prediction || busy}
                aria-pressed={selected}
                className={`h-8 min-w-11 rounded-full px-3 text-sm font-bold transition ${
                  selected
                    ? match.status === "finished"
                      ? actual
                        ? "bg-gold text-white"
                        : "bg-sand text-muted line-through"
                      : "animate-pop bg-rg text-white shadow"
                    : actual
                      ? "border border-gold text-gold"
                      : "border border-sand text-rg-dark enabled:hover:border-rg disabled:opacity-50"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-[11px] text-muted">
          {match.bestOf === 5 ? "3 sets gagnants" : "2 sets gagnants"}
        </span>
      </div>

      <Footer match={match} prediction={prediction} score={score} />
    </article>
  );
}

function StatusBadge({ match }: { match: MatchState }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 text-[11px] font-bold text-live uppercase">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" /> En cours
      </span>
    );
  }
  if (match.status === "finished") {
    return <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-bold text-muted uppercase">Terminé</span>;
  }
  return (
    <span className="rounded-full bg-rg-light px-2 py-0.5 text-[11px] font-bold text-rg uppercase">
      {match.tour}
    </span>
  );
}

function PlayerBlock({ player, winner }: { player: Player; winner?: string }) {
  const isWinner = winner === player.id;
  const isLoser = winner !== undefined && !isWinner;
  return (
    <div className={`flex min-w-0 flex-col items-center text-center ${isLoser ? "opacity-55" : ""}`}>
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cream text-2xl ring-2 ring-sand">
        <span aria-hidden>{flag(player.country)}</span>
        {isWinner && (
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-rg text-white ring-2 ring-white">
            <CheckIcon width={12} height={12} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={`mt-1.5 line-clamp-2 text-sm leading-tight ${isWinner ? "font-extrabold" : "font-semibold"}`}>
        <span className="sm:hidden">{shortName(player.name)}</span>
        <span className="hidden sm:inline">{player.name}</span>
      </span>
      <span className="text-[11px] text-muted">
        {player.country} · n°{player.ranking}
      </span>
    </div>
  );
}

function Center({ match }: { match: MatchState }) {
  if (match.result) {
    const p1Won = match.result.winnerId === match.player1.id;
    return (
      <div className="flex flex-col items-center gap-0.5 font-mono text-sm font-bold text-rg-dark">
        {match.result.score.map((s, i) => {
          const [w, l] = s.split("-");
          return (
            <span key={i} className="rounded bg-clay-50 px-1.5 leading-5">
              {p1Won ? `${w}-${l}` : `${l}-${w}`}
            </span>
          );
        })}
      </div>
    );
  }
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${
        match.status === "live" ? "bg-live text-white" : "bg-clay text-white"
      }`}
    >
      VS
    </span>
  );
}

function OddsButton(props: {
  odds: number;
  selected: boolean;
  open: boolean;
  correct?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  const { odds, selected, open, correct, disabled, label, onClick } = props;
  let cls = "border border-sand bg-cream text-rg-dark";
  if (selected) {
    if (correct === true) cls = "bg-rg text-white shadow";
    else if (correct === false) cls = "bg-sand text-muted";
    else cls = "animate-pop bg-clay text-white shadow-md ring-2 ring-clay/30";
  } else if (correct === true) {
    cls = "border border-rg/40 bg-rg-light text-rg-dark";
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!open || disabled}
      aria-pressed={selected}
      aria-label={`${label}, cote ${formatOdds(odds)}`}
      className={`flex h-12 flex-col items-center justify-center rounded-xl transition ${cls} ${
        open ? "enabled:hover:brightness-95 enabled:active:scale-[0.98]" : "cursor-default"
      }`}
    >
      <span className={`text-[10px] font-bold tracking-wider uppercase ${selected ? "opacity-90" : "text-muted"}`}>
        {selected ? "Mon prono" : "Cote"}
      </span>
      <span className={`text-lg leading-none font-extrabold ${selected && correct === false ? "line-through" : ""}`}>
        {formatOdds(odds)}
      </span>
    </button>
  );
}

function Footer({
  match,
  prediction,
  score,
}: {
  match: MatchState;
  prediction?: Prediction;
  score: ReturnType<typeof scorePrediction> | null;
}) {
  const base = "mt-3 flex items-center gap-2 px-4 py-2.5 text-xs";

  if (!prediction) {
    if (match.status === "upcoming") {
      return (
        <div className={`${base} bg-cream/70 text-muted`}>
          Touche une cote pour choisir ton vainqueur.
        </div>
      );
    }
    return (
      <div className={`${base} bg-cream/70 text-muted`}>
        <LockIcon width={14} height={14} /> Pas de prono sur ce match.
      </div>
    );
  }

  if (match.status !== "finished" || !score) {
    const potential = potentialPoints(match, prediction);
    return (
      <div className={`${base} ${match.status === "live" ? "bg-live/5" : "bg-clay-50"} text-ink`}>
        {match.status === "live" && <LockIcon width={14} height={14} className="text-live" />}
        <span>
          Gain : <strong className="text-clay-dark">{pts(potential.winner)}</strong>
          {potential.exact !== null ? (
            <>
              {" "}
              · <strong className="text-gold">{pts(potential.exact)}</strong> si {prediction.sets} sets
            </>
          ) : (
            match.status === "upcoming" && <span className="text-muted"> · choisis les sets pour doubler</span>
          )}
        </span>
      </div>
    );
  }

  if (score.outcome === "perfect") {
    return (
      <div className={`${base} bg-gold/15 font-bold text-ink`}>
        <span className="text-base">🎾</span> Sets exacts ! Cote doublée
        <span className="ml-auto rounded-full bg-gold px-2.5 py-0.5 text-sm text-white">+{pts(score.points)}</span>
      </div>
    );
  }
  if (score.outcome === "won") {
    return (
      <div className={`${base} bg-rg-light font-bold text-rg-dark`}>
        <CheckIcon width={14} height={14} /> Bon vainqueur
        <span className="ml-auto rounded-full bg-rg px-2.5 py-0.5 text-sm text-white">+{pts(score.points)}</span>
      </div>
    );
  }
  return (
    <div className={`${base} bg-sand/60 font-semibold text-muted`}>
      Raté, ce sera pour la prochaine !
      <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-sm">0 pt</span>
    </div>
  );
}

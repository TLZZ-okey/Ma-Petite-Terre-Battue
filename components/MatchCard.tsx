"use client";

import { useState, type FormEvent } from "react";
import { SURFACE_LABELS } from "@/lib/data/tournaments";
import { flag, formatOdds, formatPoints, formatTime, pts, shortName } from "@/lib/format";
import {
  oddsToPoints,
  predictionFromScore,
  scoreFromPrediction,
  scorePrediction,
  setsToWin,
  validateSetScore,
} from "@/lib/scoring";
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
  // La clé réinitialise le brouillon quand le prono enregistré change.
  const key = `${props.match.id}:${props.prediction?.updatedAt ?? "none"}`;
  return <MatchCardInner key={key} {...props} />;
}

function MatchCardInner({ match, prediction, busy, onPredict, showContext }: MatchCardProps) {
  const open = match.status === "upcoming" && !!onPredict;
  const saved = draftFromPrediction(match, prediction);
  const [draft, setDraft] = useState<Draft>(saved);
  const [touched, setTouched] = useState(false);

  const complete = draft[0] !== null && draft[1] !== null;
  const error = complete || touched ? validateSetScore(match.bestOf, draft) : null;
  const valid = complete && !error;
  const dirty = draft[0] !== saved[0] || draft[1] !== saved[1];
  const draftWinner = valid ? predictionFromScore(match, draft as [number, number]).winnerId : undefined;
  const shownWinner = open ? draftWinner : prediction?.winnerId;

  const result = prediction ? scorePrediction(match, prediction) : null;
  const winnerId = match.result?.winnerId;
  const need = setsToWin(match.bestOf);

  function update(index: 0 | 1, raw: string) {
    const digits = raw.replace(/\D/g, "").slice(-1);
    const value = digits === "" ? null : Number(digits);
    setDraft((d) => (index === 0 ? [value, d[1]] : [d[0], value]));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!open || busy || !valid) return;
    const p = predictionFromScore(match, draft as [number, number]);
    onPredict!(p.winnerId, p.sets);
  }

  const sides = [
    { player: match.player1, odds: match.odds1, index: 0 as const },
    { player: match.player2, odds: match.odds2, index: 1 as const },
  ];

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
        prediction && match.status === "upcoming" ? "border-clay/40" : "border-sand"
      }`}
    >
      <div className="flex items-center gap-2 px-4 pt-3 text-xs text-muted">
        <ClockIcon width={14} height={14} />
        <span className="font-semibold text-ink">
          {showContext
            ? `${new Date(match.startTime).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${formatTime(match.startTime)}`
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

      <form onSubmit={submit} className="flex flex-1 flex-col">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-2 px-4 pt-3">
          <PlayerBlock player={match.player1} winner={winnerId} />
          <Center match={match} />
          <PlayerBlock player={match.player2} winner={winnerId} />

          {sides.map(({ player, odds, index }) => {
            const highlighted = shownWinner === player.id;
            const input = (
              <div key={player.id} className="flex flex-col items-center pt-3">
                <label className="sr-only" htmlFor={`${match.id}-s${index}`}>
                  Sets gagnés par {player.name}
                </label>
                <input
                  id={`${match.id}-s${index}`}
                  value={draft[index] ?? ""}
                  onChange={(e) => update(index, e.target.value)}
                  onBlur={() => complete && setTouched(true)}
                  disabled={!open || busy}
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
                  className={`mt-1.5 rounded-full px-2.5 py-0.5 text-sm font-extrabold ${
                    winnerId === player.id
                      ? "bg-rg text-white"
                      : highlighted
                        ? "bg-clay text-white"
                        : "bg-cream text-rg-dark"
                  }`}
                  title={`Cote ${formatOdds(odds)} × 100`}
                >
                  {formatPoints(oddsToPoints(odds))} pts
                </span>
                <span className="mt-0.5 text-[10px] text-muted">cote {formatOdds(odds)}</span>
              </div>
            );
            return index === 0 ? (
              input
            ) : (
              <FragmentWithSeparator key={player.id} label={`${need} sets gagnants`}>
                {input}
              </FragmentWithSeparator>
            );
          })}
        </div>

        <div className="mt-auto">
          {open && (
            <div className="flex min-h-12 items-center gap-2 px-4 pt-3">
              <p className={`flex-1 text-xs ${error ? "font-semibold text-live" : "text-muted"}`} role={error ? "alert" : undefined}>
                {error ??
                  (valid
                    ? dirty
                      ? "Score cohérent : valide ton prono."
                      : "Prono enregistré. Tu peux le modifier jusqu'au début du match."
                    : `Indique les sets gagnés par chaque joueur (ex. ${need}-0, ${need}-1…).`)}
              </p>
              {prediction && !dirty && (
                <button
                  type="button"
                  onClick={() => onPredict!(null, null)}
                  disabled={busy}
                  className="text-xs font-semibold text-muted underline-offset-2 hover:text-live hover:underline"
                >
                  Retirer
                </button>
              )}
              {(dirty || !prediction) && (
                <button
                  type="submit"
                  disabled={!valid || busy}
                  className="rounded-full bg-clay px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-clay-dark disabled:bg-sand disabled:text-muted disabled:shadow-none"
                >
                  {busy ? "…" : prediction ? "Modifier" : "Valider"}
                </button>
              )}
            </div>
          )}
          <Footer match={match} prediction={prediction} result={result} />
        </div>
      </form>
    </article>
  );
}

/** Place le séparateur central entre les deux cases de score (2e colonne de la grille). */
function FragmentWithSeparator({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <>
      <div className="flex h-[4.25rem] flex-col items-center justify-center self-start pt-3">
        <span className="text-xl font-black text-sand">–</span>
        <span className="text-center text-[9px] leading-tight font-semibold text-muted uppercase">
          {label.split(" ").slice(0, 2).join(" ")}
          <br />
          {label.split(" ").slice(2).join(" ")}
        </span>
      </div>
      {children}
    </>
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
  return <span className="rounded-full bg-rg-light px-2 py-0.5 text-[11px] font-bold text-rg uppercase">{match.tour}</span>;
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
      <div className="flex min-w-12 flex-col items-center gap-0.5 font-mono text-sm font-bold text-rg-dark">
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
      className={`mt-1.5 flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white ${
        match.status === "live" ? "bg-live" : "bg-clay"
      }`}
    >
      VS
    </span>
  );
}

function Footer({
  match,
  prediction,
  result,
}: {
  match: MatchState;
  prediction?: Prediction;
  result: ReturnType<typeof scorePrediction> | null;
}) {
  const base = "mt-3 flex items-center gap-2 px-4 py-2.5 text-xs";
  const real = match.result
    ? match.result.winnerId === match.player1.id
      ? `${setsToWin(match.bestOf)}-${match.result.sets - setsToWin(match.bestOf)}`
      : `${match.result.sets - setsToWin(match.bestOf)}-${setsToWin(match.bestOf)}`
    : null;

  if (!prediction) {
    if (match.status === "upcoming") return null;
    return (
      <div className={`${base} bg-cream/70 text-muted`}>
        <LockIcon width={14} height={14} /> Pas de prono sur ce match{real && ` · score final ${real}`}.
      </div>
    );
  }

  if (match.status === "upcoming") {
    const score = scoreFromPrediction(match, prediction);
    const points = oddsToPoints(prediction.winnerId === match.player1.id ? match.odds1 : match.odds2);
    return (
      <div className={`${base} bg-clay-50 text-ink`}>
        <span>
          Mon prono{score && <strong> {score.join("-")}</strong>} · Gain : <strong className="text-clay-dark">{pts(points)}</strong>
          {score && (
            <>
              {" "}
              · <strong className="text-gold">{pts(points * 2)}</strong> si score exact
            </>
          )}
        </span>
      </div>
    );
  }

  if (match.status === "live" || !result) {
    return (
      <div className={`${base} bg-live/5 text-ink`}>
        <LockIcon width={14} height={14} className="text-live" /> Prono verrouillé, en attente du résultat.
      </div>
    );
  }

  if (result.outcome === "perfect") {
    return (
      <div className={`${base} bg-gold/15 font-bold text-ink`}>
        <span className="text-base">🎾</span> Score exact ({real}) ! Points doublés
        <span className="ml-auto rounded-full bg-gold px-2.5 py-0.5 text-sm text-white">+{pts(result.points)}</span>
      </div>
    );
  }
  if (result.outcome === "won") {
    return (
      <div className={`${base} bg-rg-light font-bold text-rg-dark`}>
        <CheckIcon width={14} height={14} /> Bon vainqueur (score final {real})
        <span className="ml-auto rounded-full bg-rg px-2.5 py-0.5 text-sm text-white">+{pts(result.points)}</span>
      </div>
    );
  }
  return (
    <div className={`${base} bg-sand/60 font-semibold text-muted`}>
      Raté (score final {real}), ce sera pour la prochaine !
      <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-sm">0 pt</span>
    </div>
  );
}

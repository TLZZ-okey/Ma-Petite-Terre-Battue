import { flag, pts, shortName } from "@/lib/format";
import { scoreFromPrediction, scorePrediction, setsToWin } from "@/lib/scoring";
import type { MatchState, Player, Prediction } from "@/lib/types";
import { CheckIcon } from "./icons";
import { MatchContext } from "./MatchContext";

const OUTCOME_STYLES = {
  perfect: { border: "border-l-gold", badge: "bg-gold text-white", label: "Score exact !" },
  won: { border: "border-l-rg", badge: "bg-rg text-white", label: "Prono gagné" },
  lost: { border: "border-l-live", badge: "bg-live text-white", label: "Prono perdu" },
  none: { border: "border-l-sand", badge: "bg-sand text-muted", label: "Pas de prono" },
} as const;

/** Carte d'un match terminé : tableau de score + rappel du prono et de son résultat. */
export function FinishedMatchCard({
  match,
  prediction,
  showContext = true,
}: {
  match: MatchState;
  prediction?: Prediction;
  showContext?: boolean;
}) {
  const result = match.result!;
  const p1Won = result.winnerId === match.player1.id;
  // Sets gagnés par chaque joueur.
  const winnerSets = setsToWin(match.bestOf);
  const loserSets = result.sets - winnerSets;

  const outcome = prediction ? scorePrediction(match, prediction) : null;
  const key = !outcome ? "none" : outcome.outcome === "pending" ? "none" : outcome.outcome;
  const style = OUTCOME_STYLES[key];
  const predicted = prediction ? scoreFromPrediction(match, prediction) : null;
  const predictedWinner = prediction
    ? prediction.winnerId === match.player1.id
      ? match.player1
      : match.player2
    : null;

  const rows = [
    { player: match.player1, won: p1Won, sets: p1Won ? winnerSets : loserSets, flip: !p1Won },
    { player: match.player2, won: !p1Won, sets: p1Won ? loserSets : winnerSets, flip: p1Won },
  ];

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border border-l-4 border-sand bg-white shadow-sm ${style.border}`}>
      <MatchContext match={match} showContext={showContext} />

      <div className="mt-3 space-y-1.5 px-4">
        {rows.map(({ player, won, sets, flip }) => (
          <ScoreRow
            key={player.id}
            player={player}
            won={won}
            sets={sets}
            games={result.score.map((s) => {
              const [w, l] = s.split("-").map(Number);
              return flip ? l : w;
            })}
            opponentGames={result.score.map((s) => {
              const [w, l] = s.split("-").map(Number);
              return flip ? w : l;
            })}
          />
        ))}
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-sand px-4 py-3 pt-3">
        <div className="min-w-0 flex-1 text-xs text-muted">
          {prediction && predictedWinner ? (
            <>
              <span className="block text-[10px] font-bold tracking-wide uppercase">Ton prono</span>
              <span className="font-semibold text-ink">
                {shortName(predictedWinner.name)}
                {predicted ? ` ${predicted[0]}-${predicted[1]}` : ""}
              </span>
            </>
          ) : (
            <span>Tu n&apos;as pas pronostiqué ce match.</span>
          )}
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase ${style.badge}`}>
          {style.label}
          {outcome && outcome.outcome !== "pending" && (
            <span className="text-sm normal-case">{outcome.points > 0 ? `+${pts(outcome.points)}` : "0 pt"}</span>
          )}
        </span>
      </div>
    </article>
  );
}

function ScoreRow({
  player,
  won,
  sets,
  games,
  opponentGames,
}: {
  player: Player;
  won: boolean;
  sets: number;
  games: number[];
  opponentGames: number[];
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
        won ? "bg-rg-light text-rg-dark" : "text-muted"
      }`}
    >
      <span className="text-xl" aria-hidden>
        {flag(player.country)}
      </span>
      <span className={`min-w-0 flex-1 truncate text-sm ${won ? "font-extrabold" : "font-medium"}`}>
        <span className="sm:hidden">{shortName(player.name)}</span>
        <span className="hidden sm:inline">{player.name}</span>
        {won && (
          <span className="ml-1.5 inline-flex h-4 w-4 translate-y-0.5 items-center justify-center rounded-full bg-rg text-white">
            <CheckIcon width={10} height={10} strokeWidth={3.5} />
          </span>
        )}
      </span>
      <span className="flex gap-2 font-mono text-sm">
        {games.map((g, i) => (
          <span key={i} className={`w-4 text-center ${g > opponentGames[i] ? "font-bold text-ink" : ""}`}>
            {g}
          </span>
        ))}
      </span>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg font-black ${
          won ? "bg-rg text-white" : "bg-cream text-muted"
        }`}
        aria-label={`${sets} sets`}
      >
        {sets}
      </span>
    </div>
  );
}

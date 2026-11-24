import { formatPoints } from "@/lib/format";
import { levelFor } from "@/lib/gamification";
import { ProgressBar, cx } from "./ui";

/**
 * « Ma partie » : niveau, barre d'XP et défi du jour (pronostiquer tous les matchs du jour).
 */
export function SummaryCard({
  points,
  done,
  total,
  label,
  className,
}: {
  points: number;
  done: number;
  total: number;
  label: string;
  className?: string;
}) {
  const lvl = levelFor(points);
  const challengeDone = total > 0 && done >= total;
  return (
    <div
      className={cx(
        "clay-surface relative overflow-hidden rounded-3xl border-2 border-clay-700 p-5 text-white shadow-chunky-clay",
        className,
      )}
    >
      <span className="tennis-ball absolute -top-6 -right-6 h-24 w-24 animate-float opacity-90" aria-hidden />

      <p className="text-xs font-extrabold tracking-wide text-white/85 uppercase">Ma partie</p>
      <p className="tabular mt-1 font-display text-5xl leading-none font-bold drop-shadow-[0_3px_0_rgb(0_0_0_/_0.2)]">
        {formatPoints(points)}
        <span className="ml-1.5 text-xl text-white/85">pts</span>
      </p>

      <div className="mt-4 rounded-2xl bg-white/15 p-3">
        <div className="flex items-center justify-between gap-2 text-sm font-extrabold">
          <span className="truncate">
            {lvl.current.emoji} Niv. {lvl.current.level} · {lvl.current.title}
          </span>
        </div>
        <ProgressBar value={lvl.progress} label="Progression vers le niveau suivant" className="mt-2 border-white/30 bg-white/20" />
        <p className="mt-1.5 text-xs font-bold text-white/90">
          {lvl.next ? `Encore ${formatPoints(lvl.toNext)} pts pour devenir « ${lvl.next.title} »` : "Niveau maximal atteint !"}
        </p>
      </div>

      <div className="mt-3 rounded-2xl bg-white p-3 text-ink">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-extrabold">{challengeDone ? "🏅 Défi du jour réussi !" : "🎯 Défi du jour"}</p>
          <span className="tabular font-display text-base font-semibold text-clay-600">
            {done}/{total}
          </span>
        </div>
        <p className="text-xs font-bold text-ink-3">{label}</p>
        <ProgressBar value={total ? done / total : 0} label={label} tone="clay" className="mt-2 border-line bg-subtle" />
      </div>
    </div>
  );
}

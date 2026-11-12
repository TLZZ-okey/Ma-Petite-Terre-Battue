import { formatPoints } from "@/lib/format";
import { cx } from "./ui";

/** Carte récapitulative sur fond vert court : total de points et progression. */
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
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className={cx("relative overflow-hidden rounded-2xl bg-court-900 p-5 text-white shadow-raised", className)}>
      <span className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-ball/15" aria-hidden />
      <span className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-ball/25" aria-hidden />
      <p className="text-xs font-medium text-white/70">Mon total</p>
      <p className="tabular mt-1 font-display text-5xl leading-none font-bold">
        {formatPoints(points)}
        <span className="ml-1.5 text-xl text-white/70">pts</span>
      </p>
      <div className="mt-5 flex items-baseline justify-between text-xs">
        <span className="text-white/80">{label}</span>
        <span className="tabular font-semibold">
          {done}/{total}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-ball transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

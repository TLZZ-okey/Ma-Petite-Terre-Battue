"use client";

import { useEffect, useRef } from "react";
import { addDays, dayKey, startOfDay } from "@/lib/dates";
import { cx } from "./ui";

interface DayPickerProps {
  now: Date;
  value: string;
  onChange: (day: string) => void;
  /** Nombre de pronostics par jour (pastille). */
  counts?: Record<string, number>;
  before?: number;
  after?: number;
}

export function DayPicker({ now, value, onChange, counts = {}, before = 3, after = 6 }: DayPickerProps) {
  const today = startOfDay(now);
  const todayKey = dayKey(today);
  const days = Array.from({ length: before + after + 1 }, (_, i) => addDays(today, i - before));
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [value]);

  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0" role="group" aria-label="Choisir un jour">
      {days.map((d) => {
        const key = dayKey(d);
        const selected = key === value;
        const isToday = key === todayKey;
        const weekday = isToday ? "Auj." : d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
        const count = counts[key] ?? 0;
        return (
          <button
            key={key}
            ref={selected ? selectedRef : undefined}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={selected}
            aria-label={`${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${
              count ? `, ${count} prono${count > 1 ? "s" : ""}` : ""
            }`}
            className={cx(
              "relative flex h-[68px] w-14 shrink-0 snap-center flex-col items-center justify-center rounded-xl border transition-colors",
              selected
                ? "border-court-800 bg-court-800 text-white shadow-raised"
                : "border-line bg-surface text-ink hover:border-line-strong hover:bg-subtle",
            )}
          >
            <span className={cx("text-[11px] font-medium capitalize", selected ? "text-white/75" : isToday ? "text-clay-600" : "text-ink-3")}>
              {weekday}
            </span>
            <span className="tabular font-display text-2xl leading-tight font-bold">{d.getDate()}</span>
            {count > 0 ? (
              <span
                className={cx(
                  "tabular absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-canvas",
                  "bg-clay-500 text-white",
                )}
              >
                {count}
              </span>
            ) : null}
            {isToday && !selected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-clay-500" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

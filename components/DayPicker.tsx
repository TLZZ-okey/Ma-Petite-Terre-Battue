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
    <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pt-2 pb-2 sm:mx-0 sm:px-0" role="group" aria-label="Choisir un jour">
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
              "press relative flex h-[72px] w-15 shrink-0 snap-center flex-col items-center justify-center rounded-2xl border-2",
              selected
                ? "border-clay-800 bg-clay-600 text-white shadow-chunky-clay"
                : isToday
                  ? "border-clay-300 bg-surface text-ink shadow-chunky hover:bg-subtle"
                  : "border-line bg-surface text-ink shadow-chunky hover:bg-subtle",
            )}
          >
            <span className={cx("text-xs font-extrabold capitalize", selected ? "text-white/90" : isToday ? "text-clay-600" : "text-ink-3")}>
              {weekday}
            </span>
            <span className="tabular font-display text-2xl leading-tight font-semibold">{d.getDate()}</span>
            {count > 0 ? (
              <span
                className={cx(
                  "tabular absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white px-1 text-[11px] font-black",
                  "bg-ball text-ink",
                )}
              >
                {count}
              </span>
            ) : null}
            {isToday && !selected && <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-clay-500" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

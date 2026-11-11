"use client";

import { useEffect, useRef } from "react";
import { addDays, dayKey, startOfDay } from "@/lib/dates";

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
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-4 pb-3">
      {days.map((d) => {
        const key = dayKey(d);
        const selected = key === value;
        const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
        const label =
          diff === 0 ? "Auj." : diff === 1 ? "Demain" : diff === -1 ? "Hier" : d.toLocaleDateString("fr-FR", { weekday: "short" });
        return (
          <button
            key={key}
            ref={selected ? selectedRef : undefined}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={selected}
            className={`relative flex w-15 shrink-0 flex-col items-center rounded-2xl py-2 transition ${
              selected
                ? "bg-clay text-white shadow-md"
                : key === todayKey
                  ? "border-2 border-clay/40 bg-white text-ink"
                  : "border border-sand bg-white text-ink"
            }`}
          >
            <span className={`text-[11px] font-bold uppercase ${selected ? "text-white/85" : "text-muted"}`}>{label}</span>
            <span className="text-lg leading-tight font-extrabold">{d.getDate()}</span>
            <span className={`text-[10px] ${selected ? "text-white/80" : "text-muted"}`}>
              {d.toLocaleDateString("fr-FR", { month: "short" })}
            </span>
            {counts[key] ? (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rg px-1 text-[10px] font-bold text-white ring-2 ring-cream">
                {counts[key]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

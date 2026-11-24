"use client";

import { useEffect, useState, type CSSProperties } from "react";

const EVENT = "mptb:celebrate";
const COLORS = ["#f26a21", "#ffffff", "#e4f25a", "#1f8a63", "#ff9e64"];

/** Déclenche une pluie de confettis (ex. prono validé). */
export function celebrate(intensity: "small" | "big" = "small") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: intensity }));
}

interface Burst {
  id: number;
  pieces: Array<{ left: number; dx: number; rot: number; dur: number; color: string; delay: number; round: boolean }>;
}

/** Couche de confettis, montée une seule fois dans l'interface. */
export function Celebration() {
  const [burst, setBurst] = useState<Burst | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const onCelebrate = (e: Event) => {
      const big = (e as CustomEvent).detail === "big";
      const count = big ? 70 : 28;
      setBurst({
        id: Date.now(),
        pieces: Array.from({ length: count }, (_, i) => ({
          left: big ? Math.random() * 100 : 30 + Math.random() * 40,
          dx: (Math.random() - 0.5) * 240,
          rot: (Math.random() - 0.5) * 900,
          dur: 1 + Math.random() * 0.9,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.15,
          round: Math.random() < 0.3,
        })),
      });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setBurst(null), 2200);
    };
    window.addEventListener(EVENT, onCelebrate);
    return () => {
      window.removeEventListener(EVENT, onCelebrate);
      window.clearTimeout(timer);
    };
  }, []);

  if (!burst) return null;
  return (
    <div key={burst.id} className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {burst.pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              borderRadius: p.round ? "9999px" : undefined,
              boxShadow: p.color === "#ffffff" ? "0 0 0 1px #eabfa0" : undefined,
              animationDelay: `${p.delay}s`,
              "--dx": `${p.dx}px`,
              "--rot": `${p.rot}deg`,
              "--dur": `${p.dur}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

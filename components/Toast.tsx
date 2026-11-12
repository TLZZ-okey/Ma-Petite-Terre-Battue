"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "error"; id: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((text: string, tone: "ok" | "error" = "ok") => {
    window.clearTimeout(timer.current);
    setMessage({ text, tone, id: Date.now() });
    timer.current = window.setTimeout(() => setMessage(null), 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const node = message ? (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-8 lg:pl-64"
      role="status"
      aria-live="polite"
    >
      <div
        key={message.id}
        className={`animate-fade-up rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-float ${
          message.tone === "ok" ? "bg-court-900" : "bg-danger"
        }`}
      >
        {message.text}
      </div>
    </div>
  ) : null;

  return { show, node };
}

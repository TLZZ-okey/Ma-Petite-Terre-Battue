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
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4" role="status">
      <div
        key={message.id}
        className={`animate-pop rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg ${
          message.tone === "ok" ? "bg-rg-dark" : "bg-live"
        }`}
      >
        {message.text}
      </div>
    </div>
  ) : null;

  return { show, node };
}

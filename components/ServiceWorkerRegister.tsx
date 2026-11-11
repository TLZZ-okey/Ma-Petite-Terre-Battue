"use client";

import { useEffect } from "react";

/** Enregistre le service worker (uniquement en production, pour ne pas gêner le rechargement à chaud). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
      console.warn("Service worker non enregistré :", error);
    });
  }, []);
  return null;
}

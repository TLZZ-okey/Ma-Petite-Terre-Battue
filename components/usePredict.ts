"use client";

import { useState } from "react";
import { validatePrediction } from "@/lib/game";
import type { MatchState } from "@/lib/types";
import { useApp } from "./AppProvider";
import { useToast } from "./Toast";

/** Enregistre / modifie / supprime un pronostic, avec vérification de l'heure du match. */
export function usePredict() {
  const { user, repo, matches, timeOffset, invalidate } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  async function predict(match: MatchState, winnerId: string | null, sets: number | null) {
    if (!user) return;
    setBusyId(match.id);
    try {
      // On revérifie l'état du match à l'instant précis du clic.
      const [fresh] = await matches.getMatchesByIds([match.id], new Date(Date.now() + timeOffset));
      if (!fresh) throw new Error("Match introuvable.");
      if (winnerId === null) {
        if (fresh.status !== "upcoming") throw new Error("Le match a commencé : les pronostics sont fermés.");
        await repo.deletePrediction(user.id, match.id);
        toast.show("Prono retiré");
      } else {
        const error = validatePrediction(fresh, winnerId, sets);
        if (error) throw new Error(error);
        await repo.savePrediction({ userId: user.id, matchId: match.id, winnerId, sets });
        toast.show("Prono enregistré ✓");
      }
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      invalidate();
      setBusyId(null);
    }
  }

  return { busyId, predict, toastNode: toast.node };
}

import type { Tournament } from "../types";

/** Tournoi de démonstration : pour l'instant, seul Roland-Garros (tableau masculin) est proposé. */
export const MOCK_TOURNAMENT: Tournament = {
  id: "rg-atp",
  name: "Roland-Garros",
  city: "Paris",
  surface: "terre-battue",
  category: "Grand Chelem",
};

export const SURFACE_LABELS: Record<Tournament["surface"], string> = {
  "terre-battue": "Terre battue",
  dur: "Dur",
  gazon: "Gazon",
  indoor: "Indoor",
};

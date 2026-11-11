import type { Tour, Tournament } from "../types";

/**
 * Tournois de démonstration. Chaque semaine, le générateur de matchs
 * choisit un tournoi ATP et un tournoi WTA dans ces listes.
 */
export const TOURNAMENTS: Record<Tour, Tournament[]> = {
  ATP: [
    { id: "rg-atp", name: "Roland-Garros", city: "Paris", surface: "terre-battue", category: "Grand Chelem" },
    { id: "monte-carlo", name: "Rolex Monte-Carlo Masters", city: "Monte-Carlo", surface: "terre-battue", category: "Masters 1000" },
    { id: "paris-masters", name: "Rolex Paris Masters", city: "Paris", surface: "indoor", category: "Masters 1000" },
    { id: "rome-atp", name: "Internazionali BNL d'Italia", city: "Rome", surface: "terre-battue", category: "Masters 1000" },
    { id: "lyon", name: "Open Parc Auvergne-Rhône-Alpes", city: "Lyon", surface: "terre-battue", category: "250" },
    { id: "madrid-atp", name: "Mutua Madrid Open", city: "Madrid", surface: "terre-battue", category: "Masters 1000" },
    { id: "finals", name: "Nitto ATP Finals", city: "Turin", surface: "indoor", category: "Finales" },
    { id: "montpellier", name: "Open Occitanie", city: "Montpellier", surface: "indoor", category: "250" },
  ],
  WTA: [
    { id: "rg-wta", name: "Roland-Garros", city: "Paris", surface: "terre-battue", category: "Grand Chelem" },
    { id: "stuttgart", name: "Porsche Tennis Grand Prix", city: "Stuttgart", surface: "terre-battue", category: "500" },
    { id: "rouen", name: "Open Capfinances Rouen", city: "Rouen", surface: "terre-battue", category: "250" },
    { id: "rome-wta", name: "Internazionali BNL d'Italia", city: "Rome", surface: "terre-battue", category: "WTA 1000" },
    { id: "strasbourg", name: "Internationaux de Strasbourg", city: "Strasbourg", surface: "terre-battue", category: "500" },
    { id: "madrid-wta", name: "Mutua Madrid Open", city: "Madrid", surface: "terre-battue", category: "WTA 1000" },
    { id: "wta-finals", name: "WTA Finals", city: "Riyad", surface: "indoor", category: "Finales" },
    { id: "linz", name: "Upper Austria Ladies Linz", city: "Linz", surface: "indoor", category: "500" },
  ],
};

export const SURFACE_LABELS: Record<Tournament["surface"], string> = {
  "terre-battue": "Terre battue",
  dur: "Dur",
  gazon: "Gazon",
  indoor: "Indoor",
};

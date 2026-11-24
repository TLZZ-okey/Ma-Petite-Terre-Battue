import type { Tour } from "./types";

/**
 * Circuits suivis par l'application. Pour l'instant : uniquement le circuit masculin (ATP).
 * Ce réglage s'applique aux matchs de démo, aux cotes (The Odds API) et aux classements (ESPN).
 * Pour réactiver le circuit féminin : ["ATP", "WTA"].
 */
export const ENABLED_TOURS: readonly Tour[] = ["ATP"];

/**
 * Tournois suivis avec les données réelles, identifiés comme dans The Odds API
 * (clé « tennis_{circuit}_{tournoi} », ex. tennis_atp_french_open → "french_open").
 * Pour l'instant : uniquement Roland-Garros. `null` = tous les tournois couverts.
 * Les tournois non suivis ne sont jamais interrogés : aucun crédit dépensé.
 */
export const ENABLED_TOURNAMENTS: readonly string[] | null = ["french_open"];

/** Nom affiché pour les tournois suivis (au lieu du titre anglais de The Odds API). */
export const TOURNAMENT_LABELS: Record<string, { name: string; city: string }> = {
  french_open: { name: "Roland-Garros", city: "Paris" },
};

export const isTourEnabled = (tour: Tour) => ENABLED_TOURS.includes(tour);

/** Découpe une clé The Odds API : tennis_atp_french_open → { tour: "ATP", tournament: "french_open" }. */
export function parseOddsKey(key: string): { tour: Tour; tournament: string } | null {
  const m = /^tennis_(atp|wta)_(.+)$/.exec(key);
  return m ? { tour: m[1].toUpperCase() as Tour, tournament: m[2] } : null;
}

/** Ce tournoi de l'API est-il suivi (circuit ET tournoi) ? */
export function isOddsKeyEnabled(key: string): boolean {
  const parsed = parseOddsKey(key);
  if (!parsed || !isTourEnabled(parsed.tour)) return false;
  return ENABLED_TOURNAMENTS === null || ENABLED_TOURNAMENTS.includes(parsed.tournament);
}

/** Libellé lisible des tournois suivis, pour les messages (ex. « Roland-Garros »). */
export function enabledTournamentsLabel(): string | null {
  if (ENABLED_TOURNAMENTS === null) return null;
  return ENABLED_TOURNAMENTS.map((t) => TOURNAMENT_LABELS[t]?.name ?? t).join(", ");
}

import type { Tour } from "./types";

/**
 * Circuits suivis par l'application. Pour l'instant : uniquement le circuit masculin (ATP).
 * Ce réglage s'applique aux matchs de démo, aux cotes (The Odds API) et aux classements (ESPN).
 * Pour réactiver le circuit féminin : ["ATP", "WTA"].
 */
export const ENABLED_TOURS: readonly Tour[] = ["ATP"];

export const isTourEnabled = (tour: Tour) => ENABLED_TOURS.includes(tour);

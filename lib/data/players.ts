import type { Player, Tour } from "../types";

/**
 * Joueurs de démonstration. Les classements sont indicatifs et seront
 * remplacés par les données de l'API externe dans une prochaine version.
 */
const atp: Array<[string, string, number]> = [
  ["Jannik Sinner", "IT", 1],
  ["Carlos Alcaraz", "ES", 2],
  ["Alexander Zverev", "DE", 3],
  ["Novak Djokovic", "RS", 4],
  ["Taylor Fritz", "US", 5],
  ["Jack Draper", "GB", 6],
  ["Lorenzo Musetti", "IT", 7],
  ["Alex de Minaur", "AU", 8],
  ["Ben Shelton", "US", 9],
  ["Holger Rune", "DK", 10],
  ["Daniil Medvedev", "RU", 11],
  ["Casper Ruud", "NO", 12],
  ["Arthur Fils", "FR", 13],
  ["Tommy Paul", "US", 14],
  ["Andrey Rublev", "RU", 15],
  ["Frances Tiafoe", "US", 16],
  ["Ugo Humbert", "FR", 18],
  ["Stefanos Tsitsipas", "GR", 20],
  ["Joao Fonseca", "BR", 22],
  ["Jakub Mensik", "CZ", 24],
  ["Félix Auger-Aliassime", "CA", 26],
  ["Giovanni Mpetshi Perricard", "FR", 31],
  ["Alexandre Müller", "FR", 38],
  ["Corentin Moutet", "FR", 45],
];

function slug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function build(list: Array<[string, string, number]>, tour: Tour): Player[] {
  return list.map(([name, country, ranking]) => ({
    id: `${tour.toLowerCase()}-${slug(name)}`,
    name,
    country,
    ranking,
    tour,
  }));
}

/** Joueurs du tableau de démonstration (circuit ATP uniquement). */
export const PLAYERS: Player[] = build(atp, "ATP");

const byId = new Map<string, Player>(
  PLAYERS.map((p) => [p.id, p]),
);

export function getPlayer(id: string): Player | undefined {
  return byId.get(id);
}

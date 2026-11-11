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

const wta: Array<[string, string, number]> = [
  ["Aryna Sabalenka", "BY", 1],
  ["Iga Swiatek", "PL", 2],
  ["Coco Gauff", "US", 3],
  ["Jessica Pegula", "US", 4],
  ["Elena Rybakina", "KZ", 5],
  ["Mirra Andreeva", "RU", 6],
  ["Jasmine Paolini", "IT", 7],
  ["Madison Keys", "US", 8],
  ["Qinwen Zheng", "CN", 9],
  ["Amanda Anisimova", "US", 10],
  ["Emma Navarro", "US", 11],
  ["Paula Badosa", "ES", 12],
  ["Elina Svitolina", "UA", 13],
  ["Karolina Muchova", "CZ", 14],
  ["Diana Shnaider", "RU", 15],
  ["Clara Tauson", "DK", 17],
  ["Ons Jabeur", "TN", 20],
  ["Leylah Fernandez", "CA", 23],
  ["Naomi Osaka", "JP", 25],
  ["Victoria Mboko", "CA", 27],
  ["Loïs Boisson", "FR", 34],
  ["Caroline Garcia", "FR", 42],
  ["Varvara Gracheva", "FR", 55],
  ["Diane Parry", "FR", 68],
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

export const PLAYERS: Record<Tour, Player[]> = {
  ATP: build(atp, "ATP"),
  WTA: build(wta, "WTA"),
};

const byId = new Map<string, Player>(
  [...PLAYERS.ATP, ...PLAYERS.WTA].map((p) => [p.id, p]),
);

export function getPlayer(id: string): Player | undefined {
  return byId.get(id);
}

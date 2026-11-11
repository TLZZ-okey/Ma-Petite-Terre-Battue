import type { Repository } from "./repository/types";
import { newId } from "./repository/localRepository";
import { sha256Hex } from "./sha256";
import type { PublicUser } from "./types";
import { toPublicUser } from "./repository/types";

/**
 * Comptes locaux (V1) : pseudo + mot de passe, sans adresse e-mail.
 * Le mot de passe n'est jamais stocké en clair (SHA-256 salé et itéré).
 * Remarque : en V1 tout reste dans le navigateur ; une vraie authentification
 * serveur sera mise en place avec la base de données.
 */

const ITERATIONS = 2000;

export const AVATAR_COLORS = [
  "#C8541E", // terre battue
  "#0B5B43", // vert Roland-Garros
  "#D9A21B", // balle / or
  "#1F4E79", // bleu nuit
  "#8E3B5B", // prune
  "#3B7A57", // vert gazon
  "#6B4E3D", // brun
  "#E07A3F", // orange clair
];

export function hashPassword(password: string, salt: string): string {
  let digest = `${salt}:${password}`;
  for (let i = 0; i < ITERATIONS; i++) digest = sha256Hex(`${salt}${digest}`);
  return digest;
}

export function validateUsername(username: string): string | null {
  const u = username.trim();
  if (u.length < 3) return "Le pseudo doit contenir au moins 3 caractères.";
  if (u.length > 20) return "Le pseudo doit contenir au plus 20 caractères.";
  if (!/^[\p{L}\p{N}_.\- ]+$/u.test(u)) return "Le pseudo contient des caractères non autorisés.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 4) return "Le mot de passe doit contenir au moins 4 caractères.";
  return null;
}

export async function register(repo: Repository, username: string, password: string): Promise<PublicUser> {
  const error = validateUsername(username) ?? validatePassword(password);
  if (error) throw new Error(error);
  const salt = newId();
  const existing = await repo.listUsers();
  return repo.createUser({
    username: username.trim(),
    salt,
    passwordHash: hashPassword(password, salt),
    avatarColor: AVATAR_COLORS[existing.length % AVATAR_COLORS.length],
  });
}

export async function login(repo: Repository, username: string, password: string): Promise<PublicUser> {
  const user = await repo.findUserByUsername(username);
  if (!user || user.passwordHash !== hashPassword(password, user.salt)) {
    throw new Error("Pseudo ou mot de passe incorrect.");
  }
  return toPublicUser(user);
}

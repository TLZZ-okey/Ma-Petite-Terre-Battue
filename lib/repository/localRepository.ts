import type { Prediction, User } from "../types";
import { toPublicUser, type Repository } from "./types";

const USERS_KEY = "mptb:users";
const PREDICTIONS_KEY = "mptb:predictions";

/** Stockage clé/valeur minimal (localStorage dans le navigateur, Map dans les tests). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // randomUUID n'existe qu'en contexte sécurisé : on retombe sur la version ci-dessous.
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createLocalRepository(storage: KeyValueStorage): Repository {
  function read<T>(key: string): T[] {
    try {
      const raw = storage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }
  function write<T>(key: string, value: T[]) {
    storage.setItem(key, JSON.stringify(value));
  }

  const normalize = (s: string) => s.trim().toLocaleLowerCase("fr");

  return {
    async listUsers() {
      return read<User>(USERS_KEY).map(toPublicUser);
    },
    async getUser(id) {
      const user = read<User>(USERS_KEY).find((u) => u.id === id);
      return user && toPublicUser(user);
    },
    async findUserByUsername(username) {
      return read<User>(USERS_KEY).find((u) => normalize(u.username) === normalize(username));
    },
    async createUser(input) {
      const users = read<User>(USERS_KEY);
      if (users.some((u) => normalize(u.username) === normalize(input.username))) {
        throw new Error("Ce pseudo est déjà utilisé.");
      }
      const user: User = { ...input, id: newId(), createdAt: new Date().toISOString() };
      write(USERS_KEY, [...users, user]);
      return toPublicUser(user);
    },
    async updateUser(id, patch) {
      const users = read<User>(USERS_KEY);
      const index = users.findIndex((u) => u.id === id);
      if (index === -1) throw new Error("Utilisateur introuvable.");
      users[index] = { ...users[index], ...patch };
      write(USERS_KEY, users);
      return toPublicUser(users[index]);
    },
    async deleteUser(id) {
      write(USERS_KEY, read<User>(USERS_KEY).filter((u) => u.id !== id));
      write(PREDICTIONS_KEY, read<Prediction>(PREDICTIONS_KEY).filter((p) => p.userId !== id));
    },

    async listPredictions(filter = {}) {
      const ids = filter.matchIds && new Set(filter.matchIds);
      return read<Prediction>(PREDICTIONS_KEY).filter(
        (p) => (!filter.userId || p.userId === filter.userId) && (!ids || ids.has(p.matchId)),
      );
    },
    async savePrediction({ userId, matchId, winnerId, sets }) {
      const predictions = read<Prediction>(PREDICTIONS_KEY);
      const now = new Date().toISOString();
      const index = predictions.findIndex((p) => p.userId === userId && p.matchId === matchId);
      let saved: Prediction;
      if (index === -1) {
        saved = { id: newId(), userId, matchId, winnerId, sets, createdAt: now, updatedAt: now };
        predictions.push(saved);
      } else {
        saved = { ...predictions[index], winnerId, sets, updatedAt: now };
        predictions[index] = saved;
      }
      write(PREDICTIONS_KEY, predictions);
      return saved;
    },
    async deletePrediction(userId, matchId) {
      write(
        PREDICTIONS_KEY,
        read<Prediction>(PREDICTIONS_KEY).filter((p) => !(p.userId === userId && p.matchId === matchId)),
      );
    },
  };
}

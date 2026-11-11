import type { Prediction, PublicUser, User } from "../types";

/**
 * Contrat d'accès aux données (utilisateurs et pronostics).
 *
 * V1 : implémentation locale (localStorage) dans `localRepository.ts`.
 * Plus tard : une implémentation qui appellera une API adossée à une base de
 * données pourra être branchée sans toucher à l'interface.
 */
export interface Repository {
  listUsers(): Promise<PublicUser[]>;
  getUser(id: string): Promise<PublicUser | undefined>;
  findUserByUsername(username: string): Promise<User | undefined>;
  createUser(input: Omit<User, "id" | "createdAt">): Promise<PublicUser>;
  updateUser(id: string, patch: Partial<Pick<User, "avatarColor">>): Promise<PublicUser>;
  deleteUser(id: string): Promise<void>;

  listPredictions(filter?: { userId?: string; matchIds?: string[] }): Promise<Prediction[]>;
  savePrediction(input: Pick<Prediction, "userId" | "matchId" | "winnerId" | "sets">): Promise<Prediction>;
  deletePrediction(userId: string, matchId: string): Promise<void>;
}

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, salt, ...rest } = user;
  return rest;
}

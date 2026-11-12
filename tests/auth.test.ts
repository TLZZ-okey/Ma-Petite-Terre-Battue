import { describe, expect, it } from "vitest";
import { login, register } from "../lib/auth";
import { buildLeaderboard } from "../lib/game";
import { createLocalRepository, memoryStorage } from "../lib/repository/localRepository";
import { sha256Hex } from "../lib/sha256";
import { generateDay } from "../lib/mock/generator";
import type { MatchState } from "../lib/types";

describe("sha256", () => {
  it("respecte les vecteurs de test officiels", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256Hex("a".repeat(1000))).toBe("41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3");
  });
});

describe("comptes locaux", () => {
  it("inscrit puis connecte un utilisateur sans stocker le mot de passe en clair", async () => {
    const storage = memoryStorage();
    const repo = createLocalRepository(storage);
    const user = await register(repo, "Suzanne", "lenglen");
    expect(user.username).toBe("Suzanne");
    expect(storage.getItem("mptb:users")).not.toContain("lenglen");
    expect((await login(repo, "suzanne", "lenglen")).id).toBe(user.id);
    await expect(login(repo, "Suzanne", "mauvais")).rejects.toThrow();
    await expect(register(repo, "SUZANNE", "autre")).rejects.toThrow(/déjà/);
  });
});

describe("classement", () => {
  it("classe par points puis gère les ex aequo", async () => {
    const repo = createLocalRepository(memoryStorage());
    const [a, b, c] = await Promise.all([
      register(repo, "alice", "pass1"),
      register(repo, "bruno", "pass2"),
      register(repo, "chloe", "pass3"),
    ]);
    const m = generateDay("2026-11-11")[0];
    const match: MatchState = {
      ...m,
      odds1: 1.5,
      odds2: 2.5,
      status: "finished",
      result: { winnerId: m.player1.id, sets: 2, score: ["6-3", "6-4"] },
    };
    await repo.savePrediction({ userId: a.id, matchId: m.id, winnerId: m.player1.id, sets: 3 });
    await repo.savePrediction({ userId: b.id, matchId: m.id, winnerId: m.player1.id, sets: 2 });
    await repo.savePrediction({ userId: c.id, matchId: m.id, winnerId: m.player2.id, sets: 2 });

    const board = buildLeaderboard(await repo.listUsers(), await repo.listPredictions(), new Map([[m.id, match]]));
    expect(board.map((e) => [e.user.username, e.points, e.rank])).toEqual([
      ["bruno", 45, 1], // 1,5 × 20 = 30, score exact × 1,5
      ["alice", 30, 2],
      ["chloe", 0, 3],
    ]);
  });
});

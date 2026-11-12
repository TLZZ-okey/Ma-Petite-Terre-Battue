"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as auth from "@/lib/auth";
import { createMockProvider, type MockMatchProvider } from "@/lib/providers/mockProvider";
import { createLocalRepository } from "@/lib/repository/localRepository";
import type { Repository } from "@/lib/repository/types";
import type { PublicUser } from "@/lib/types";

const SESSION_KEY = "mptb:session";
const TIME_OFFSET_KEY = "mptb:time-offset";

interface AppContextValue {
  /** false tant que les données locales n'ont pas été lues (évite les flashs à l'hydratation). */
  ready: boolean;
  repo: Repository;
  matches: MockMatchProvider;
  user: PublicUser | null;
  login(username: string, password: string): Promise<void>;
  register(username: string, password: string): Promise<void>;
  logout(): void;
  refreshUser(): Promise<void>;
  /** Heure courante de l'application (heure réelle + décalage du mode démo). */
  now: Date;
  timeOffset: number;
  setTimeOffset(ms: number): void;
  /** Incrémenté à chaque modification des données : à utiliser comme dépendance de chargement. */
  dataVersion: number;
  invalidate(): void;
}

const AppContext = createContext<AppContextValue | null>(null);

type Services = { repo: Repository; matches: MockMatchProvider };

export function AppProvider({ children }: { children: ReactNode }) {
  // Les services s'appuient sur localStorage : ils ne sont créés que côté navigateur,
  // après l'hydratation, pour que le rendu serveur et le premier rendu client soient identiques.
  const [services, setServices] = useState<Services | null>(null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [timeOffset, setTimeOffsetState] = useState(0);
  const [tick, setTick] = useState(() => Date.now());
  const [dataVersion, setDataVersion] = useState(0);

  // Création des services, lecture de la session et du décalage horaire au démarrage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const storage = window.localStorage;
      const created: Services = { repo: createLocalRepository(storage), matches: createMockProvider(storage) };
      const offset = Number(storage.getItem(TIME_OFFSET_KEY) ?? 0) || 0;
      const sessionId = storage.getItem(SESSION_KEY);
      const sessionUser = sessionId ? await created.repo.getUser(sessionId) : undefined;
      if (cancelled) return;
      setServices(created);
      setTimeOffsetState(offset);
      setTick(Date.now());
      setUser(sessionUser ?? null);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Horloge : rafraîchit les statuts des matchs toutes les 30 secondes.
  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 30_000);
    const onVisible = () => document.visibilityState === "visible" && setTick(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Synchronisation entre onglets.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("mptb:")) setDataVersion((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const startSession = useCallback((u: PublicUser) => {
    localStorage.setItem(SESSION_KEY, u.id);
    setUser(u);
    setDataVersion((v) => v + 1);
  }, []);

  const value = useMemo<AppContextValue | null>(() => {
    if (!services) return null;
    return {
      ready,
      repo: services.repo,
      matches: services.matches,
      user,
      login: async (username, password) => startSession(await auth.login(services.repo, username, password)),
      register: async (username, password) => startSession(await auth.register(services.repo, username, password)),
      logout: () => {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      },
      refreshUser: async () => {
        if (!user) return;
        setUser((await services.repo.getUser(user.id)) ?? null);
      },
      now: new Date(tick + timeOffset),
      timeOffset,
      setTimeOffset: (ms) => {
        localStorage.setItem(TIME_OFFSET_KEY, String(ms));
        setTimeOffsetState(ms);
        setTick(Date.now());
      },
      dataVersion,
      invalidate: () => {
        setTick(Date.now());
        setDataVersion((v) => v + 1);
      },
    };
  }, [services, ready, user, tick, timeOffset, dataVersion, startSession]);

  if (!value) return <SplashScreen />;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp doit être utilisé dans <AppProvider>.");
  return ctx;
}

export function SplashScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-court-900" role="status">
      <div className="h-12 w-12 animate-bounce rounded-full bg-ball shadow-lg" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

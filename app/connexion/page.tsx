"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { SplashScreen, useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { useAsync } from "@/components/hooks";
import { Logo } from "@/components/icons";

type Mode = "login" | "register";

export default function ConnexionPage() {
  const { ready, user, repo, login, register, dataVersion } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: accounts } = useAsync(() => repo.listUsers(), [dataVersion]);

  useEffect(() => {
    if (ready && user) router.replace("/matchs");
  }, [ready, user, router]);

  // Aucun compte sur l'appareil : on propose directement l'inscription.
  useEffect(() => {
    if (accounts && accounts.length === 0) setMode("register");
  }, [accounts]);

  if (!ready || user) return <SplashScreen />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await (mode === "login" ? login(username, password) : register(username, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-rg">
      <div className="clay-court pt-safe relative flex h-64 flex-col items-center justify-center text-white">
        <div className="rounded-full bg-white/10 p-2 backdrop-blur-sm">
          <Logo size={76} />
        </div>
        <h1 className="mt-3 text-center text-2xl font-black tracking-wide uppercase drop-shadow">
          Ma Petite Terre Battue
        </h1>
        <p className="text-sm font-medium text-white/90 drop-shadow">Pronostics tennis entre amis</p>
      </div>

      <div className="-mt-6 flex flex-1 flex-col rounded-t-3xl bg-cream px-5 pt-6 pb-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-5 grid grid-cols-2 rounded-full bg-sand p-1" role="tablist">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`rounded-full py-2 text-sm font-bold transition ${
                  mode === m ? "bg-rg text-white shadow" : "text-rg-dark"
                }`}
              >
                {m === "login" ? "Connexion" : "Créer un compte"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-muted uppercase">Pseudo</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                required
                className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-base outline-none focus:border-clay focus:ring-2 focus:ring-clay/30"
                placeholder="ex. Suzanne"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-muted uppercase">Mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-base outline-none focus:border-clay focus:ring-2 focus:ring-clay/30"
                placeholder="••••••"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-lg bg-clay-50 px-3 py-2 text-sm font-medium text-clay-dark">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-clay py-3.5 text-base font-extrabold tracking-wide text-white uppercase shadow-md transition hover:bg-clay-dark active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "C'est parti !"}
            </button>
          </form>

          {mode === "register" && (
            <p className="mt-3 text-center text-xs text-muted">
              Pas d&apos;adresse e-mail : ton compte est enregistré uniquement sur cet appareil.
            </p>
          )}

          {mode === "login" && accounts && accounts.length > 0 && (
            <div className="mt-8">
              <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Comptes sur cet appareil</p>
              <ul className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setUsername(a.username)}
                      className={`flex items-center gap-2 rounded-full border bg-white py-1 pr-3 pl-1 text-sm font-semibold transition ${
                        username === a.username ? "border-clay text-clay-dark" : "border-sand text-ink"
                      }`}
                    >
                      <Avatar name={a.username} color={a.avatarColor} size={28} />
                      {a.username}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

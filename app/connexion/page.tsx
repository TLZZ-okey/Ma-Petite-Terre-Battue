"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { SplashScreen, useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { useAsync } from "@/components/hooks";
import { Logo } from "@/components/icons";
import { Button, Segmented, cx } from "@/components/ui";

type Mode = "login" | "register";

export default function ConnexionPage() {
  const { ready, user, repo, login, register, dataVersion } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const inputClass =
    "h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-base text-ink outline-none transition placeholder:text-ink-3/70 focus:border-court-600 focus:ring-4 focus:ring-court-100";

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Panneau de présentation */}
      <section className="relative flex flex-col overflow-hidden bg-court-900 text-white lg:w-[46%] lg:justify-between lg:p-12">
        <span className="absolute -right-24 -bottom-24 hidden h-96 w-96 rounded-full bg-clay-500/90 lg:block" aria-hidden />
        <span className="absolute right-24 bottom-40 hidden h-20 w-20 rounded-full bg-ball lg:block" aria-hidden />

        <div className="relative flex items-center gap-3 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-10 lg:p-0">
          <Logo size={44} />
          <span className="font-display text-2xl leading-none font-bold tracking-wide uppercase">
            Ma Petite Terre Battue
          </span>
        </div>

        <div className="relative hidden max-w-md lg:block">
          <h1 className="font-display text-6xl leading-[0.95] font-bold tracking-wide uppercase">
            Joue le match
            <br />
            <span className="text-clay-200">avant le match.</span>
          </h1>
          <ul className="mt-8 space-y-4 text-white/85">
            {[
              ["Pronostique le score en sets", "2-0, 2-1… ton prono s'enregistre tout seul."],
              ["Gagne des points", "Chaque joueur rapporte des points selon sa cote."],
              ["Vise le score exact", "Bon vainqueur et bons sets : points × 1,5."],
            ].map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-ball" aria-hidden />
                <span>
                  <span className="block font-semibold text-white">{title}</span>
                  <span className="text-sm">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden text-xs text-white/50 lg:block">Version locale · aucune adresse e-mail requise</p>
      </section>

      {/* Formulaire */}
      <section className="-mt-5 flex flex-1 items-start justify-center rounded-t-3xl bg-canvas px-5 pt-8 pb-12 lg:mt-0 lg:items-center lg:rounded-none lg:px-12">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl font-bold tracking-wide text-court-900 uppercase">
            {mode === "login" ? "Bon retour !" : "Crée ton compte"}
          </h2>
          <p className="mt-1 text-sm text-ink-3">
            {mode === "login"
              ? "Connecte-toi pour faire tes pronos."
              : "Un pseudo et un mot de passe suffisent, sans adresse\u00a0e‑mail."}
          </p>

          <Segmented
            label="Mode"
            className="mt-6 w-full"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
            }}
            options={[
              { value: "login", label: "Connexion" },
              { value: "register", label: "Inscription" },
            ]}
          />

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink-2">
                Pseudo
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                required
                className={inputClass}
                placeholder="ex. Suzanne"
              />
              {mode === "register" && <p className="mt-1 text-xs text-ink-3">3 à 20 caractères.</p>}
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  className={cx(inputClass, "pr-24")}
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-3 hover:bg-subtle hover:text-ink"
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
              {mode === "register" && <p className="mt-1 text-xs text-ink-3">4 caractères minimum.</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-danger-50 px-3 py-2.5 text-sm font-medium text-danger">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={busy || !username || !password} className="w-full">
              {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          {mode === "login" && accounts && accounts.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <p className="text-xs font-semibold text-ink-3">Comptes sur cet appareil</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername(a.username);
                        document.getElementById("password")?.focus();
                      }}
                      className={cx(
                        "flex items-center gap-2 rounded-full border bg-surface py-1 pr-3.5 pl-1 text-sm font-medium transition",
                        username === a.username ? "border-court-600 text-court-800" : "border-line text-ink hover:border-line-strong",
                      )}
                    >
                      <Avatar name={a.username} color={a.avatarColor} size={28} ring={false} />
                      {a.username}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

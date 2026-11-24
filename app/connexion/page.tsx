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
    "h-14 w-full rounded-2xl border-2 border-line-strong bg-surface px-4 text-base font-bold text-ink shadow-chunky outline-none transition placeholder:font-semibold placeholder:text-ink-3/60 focus:border-clay-500 focus:ring-4 focus:ring-clay-100";

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Panneau de présentation : court de terre battue */}
      <section className="clay-surface relative flex flex-col overflow-hidden text-white lg:min-h-dvh lg:w-1/2 lg:justify-center lg:gap-10 lg:px-12 lg:py-10">
        <span className="tennis-ball absolute -top-12 -right-12 h-28 w-28 animate-float opacity-90 lg:-top-10 lg:-right-10 lg:h-40 lg:w-40" aria-hidden />
        <span
          className="tennis-ball absolute bottom-24 -left-8 hidden h-24 w-24 animate-float opacity-80 [animation-delay:1.2s] lg:block"
          aria-hidden
        />

        <div className="relative flex items-center gap-3 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-12 lg:px-0 lg:pt-0 lg:pb-0">
          <Logo size={52} />
          <span className="font-display text-2xl leading-none font-bold drop-shadow-[0_2px_0_rgb(0_0_0_/_0.2)] lg:text-3xl">
            Ma Petite Terre Battue
          </span>
        </div>

        <div className="relative hidden max-w-xl lg:block">
          <h1 className="font-display text-6xl leading-[0.95] font-bold drop-shadow-[0_4px_0_rgb(0_0_0_/_0.2)] xl:text-7xl">
            Joue le match
            <br />
            <span className="text-ball">avant le match !</span>
          </h1>
          <ul className="mt-8 grid gap-2.5">
            {[
              ["✍️", "Devine le score", "3-0, 3-1, 3-2… ton prono s'enregistre tout seul."],
              ["🎾", "Gagne des points", "Plus ton joueur est outsider, plus il rapporte."],
              ["🏆", "Monte au classement", "Niveaux, badges et séries à débloquer entre amis."],
            ].map(([emoji, title, text]) => (
              <li
                key={title}
                className="flex items-center gap-4 rounded-3xl border-2 border-white/40 bg-white/15 px-4 py-2.5 backdrop-blur-sm"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl" aria-hidden>
                  {emoji}
                </span>
                <span>
                  <span className="block font-display text-xl font-semibold">{title}</span>
                  <span className="text-sm font-bold text-white/90">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden text-sm font-bold text-white/80 lg:block lg:pt-2">
          Version locale · aucune adresse e-mail requise
        </p>
      </section>

      {/* Formulaire */}
      <section className="-mt-6 flex flex-1 items-start justify-center rounded-t-[2rem] bg-canvas px-5 pt-8 pb-12 lg:mt-0 lg:items-center lg:rounded-none lg:px-12">
        <div className="w-full max-w-sm">
          <p className="text-4xl" aria-hidden>
            {mode === "login" ? "👋" : "🎉"}
          </p>
          <h2 className="mt-2 font-display text-4xl font-bold text-clay-600">
            {mode === "login" ? "Bon retour !" : "Rejoins la partie !"}
          </h2>
          <p className="mt-1 font-semibold text-ink-3">
            {mode === "login"
              ? "Connecte-toi pour faire tes pronos."
              : "Un pseudo et un mot de passe suffisent, sans adresse e‑mail."}
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
              <label htmlFor="username" className="mb-1.5 block text-sm font-extrabold text-ink-2">
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
              {mode === "register" && <p className="mt-1.5 text-xs font-bold text-ink-3">3 à 20 caractères.</p>}
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-extrabold text-ink-2">
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
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-extrabold text-clay-600 hover:bg-subtle"
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
              {mode === "register" && <p className="mt-1.5 text-xs font-bold text-ink-3">4 caractères minimum.</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-2xl border-2 border-danger/30 bg-danger-50 px-4 py-3 text-sm font-bold text-danger">
                ⚠️ {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={busy || !username || !password} className="w-full">
              {busy ? "Un instant…" : mode === "login" ? "C'est parti ! 🎾" : "Créer mon compte 🎾"}
            </Button>
          </form>

          {mode === "login" && accounts && accounts.length > 0 && (
            <div className="mt-8 border-t-2 border-dashed border-line pt-6">
              <p className="text-sm font-extrabold text-ink-2">Joueurs sur cet appareil</p>
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
                        "press flex items-center gap-2 rounded-full border-2 bg-surface py-1 pr-4 pl-1 text-sm font-extrabold shadow-chunky",
                        username === a.username ? "border-clay-500 text-clay-700" : "border-line text-ink hover:border-line-strong",
                      )}
                    >
                      <Avatar name={a.username} color={a.avatarColor} size={30} ring={false} />
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

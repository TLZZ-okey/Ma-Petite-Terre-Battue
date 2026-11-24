"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { useMyPredictions } from "@/components/hooks";
import { LogoutIcon } from "@/components/icons";
import { ApiStatusSection } from "@/components/ApiStatus";
import { RulesCard } from "@/components/RulesCard";
import { Button, Card, PageHeader, ProgressBar, StatCard, cx } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { AVATAR_COLORS } from "@/lib/auth";
import { dayKey } from "@/lib/dates";
import { formatPoints } from "@/lib/format";
import { computeAchievements, computeStreaks, levelFor } from "@/lib/gamification";

const HOUR = 3_600_000;

export default function ProfilPage() {
  const { user, repo, demo, now, timeOffset, setTimeOffset, logout, refreshUser, invalidate } = useApp();
  const { data } = useMyPredictions();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;
  const stats = data?.stats;
  const lvl = levelFor(stats?.points ?? 0);
  const streaks = data ? computeStreaks(data.predictions, data.matches) : { current: 0, best: 0 };
  const achievements = data ? computeAchievements(data.predictions, data.matches) : [];
  const unlocked = achievements.filter((a) => a.unlocked).length;

  async function changeColor(color: string) {
    await repo.updateUser(user!.id, { avatarColor: color });
    await refreshUser();
    invalidate();
  }

  async function finishMatches(scope: "live" | "day") {
    // Outils de démo : uniquement avec les matchs simulés.
    if (!demo) return;
    const day = await demo.getMatchesForDay(dayKey(now), now);
    const targets = day.filter((m) => (scope === "live" ? m.status === "live" : m.status !== "finished"));
    targets.forEach((m) => demo.finishNow(m.id));
    invalidate();
    toast.show(targets.length ? `${targets.length} match(s) terminé(s)` : "Aucun match à terminer");
  }

  function shiftTime(ms: number) {
    setTimeOffset(ms === 0 ? 0 : timeOffset + ms);
    toast.show(ms === 0 ? "Retour à l'heure réelle" : "Horloge avancée");
  }

  async function deleteAccount() {
    await repo.deleteUser(user!.id);
    logout();
    router.replace("/connexion");
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-4 sm:px-0">
      <div className="-mx-4 sm:mx-0">
        <PageHeader
          title="Profil"
          emoji="🧢"
          subtitle={demo ? "Ta progression, tes badges et les outils de démo" : "Ta progression, tes badges et les données en direct"}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          {/* Carte joueur */}
          <div className="clay-surface relative overflow-hidden rounded-3xl border-2 border-clay-700 p-5 text-white shadow-chunky-clay">
            <span className="tennis-ball absolute -top-8 -right-8 h-28 w-28 animate-float opacity-90" aria-hidden />
            <div className="relative flex items-center gap-4">
              <span className="relative">
                <Avatar name={user.username} color={user.avatarColor} size={76} />
                <span className="absolute -right-2 -bottom-2 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-ball font-display text-lg font-bold text-ink">
                  {lvl.current.level}
                </span>
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-display text-3xl leading-none font-bold drop-shadow-[0_2px_0_rgb(0_0_0_/_0.2)]">
                  {user.username}
                </h2>
                <p className="mt-1 font-extrabold">
                  {lvl.current.emoji} {lvl.current.title}
                </p>
                <p className="text-xs font-bold text-white/85">Membre depuis le {memberSince}</p>
              </div>
            </div>
            <div className="relative mt-5">
              <ProgressBar value={lvl.progress} label="Progression vers le niveau suivant" className="border-white/30 bg-white/20" />
              <p className="tabular mt-1.5 flex justify-between text-xs font-extrabold text-white/90">
                <span>Niv. {lvl.current.level} · {formatPoints(stats?.points ?? 0)} pts</span>
                <span>{lvl.next ? `Niv. ${lvl.next.level} dans ${formatPoints(lvl.toNext)} pts` : "Niveau max !"}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard emoji="🎾" label="Points" value={formatPoints(stats?.points ?? 0)} tone="clay" />
            <StatCard emoji="📝" label="Pronos joués" value={stats?.total ?? 0} />
            <StatCard emoji="🔥" label="Série en cours" value={streaks.current} hint={`Record : ${streaks.best}`} tone="clay" />
            <StatCard emoji="🎯" label="Scores exacts" value={stats?.perfect ?? 0} tone="gold" />
          </div>

          <Card className="p-5">
            <p className="font-display text-lg font-semibold text-ink" id="avatar-color">
              🎨 Couleur de l&apos;avatar
            </p>
            <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-labelledby="avatar-color">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={user.avatarColor === c}
                  aria-label={`Couleur ${c}`}
                  onClick={() => changeColor(c)}
                  className={cx(
                    "press h-10 w-10 rounded-2xl border-[3px] shadow-chunky",
                    user.avatarColor === c ? "scale-110 border-ink" : "border-white hover:scale-105",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Card>

          <Card className="p-2">
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/connexion");
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-extrabold text-ink hover:bg-subtle"
            >
              <LogoutIcon width={20} height={20} className="text-clay-600" />
              Changer de joueur / Se déconnecter
            </button>
            {confirmDelete ? (
              <div className="m-1 rounded-2xl border-2 border-danger/30 bg-danger-50 p-3">
                <p className="font-extrabold text-danger">Supprimer ton compte et tous tes pronos ?</p>
                <p className="mt-0.5 text-xs font-bold text-ink-2">Cette action est définitive.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="danger" size="sm" onClick={deleteAccount}>
                    Supprimer définitivement
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full rounded-2xl px-3 py-3 text-left text-sm font-bold text-danger hover:bg-danger-50"
              >
                Supprimer mon compte et mes pronos
              </button>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {/* Badges */}
          <Card className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-2xl font-semibold text-clay-600">🏅 Mes badges</p>
              <span className="tabular rounded-full border-2 border-ball-dark bg-ball px-3 py-0.5 font-display font-semibold text-ink">
                {unlocked}/{achievements.length}
              </span>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {achievements.map((a) => (
                <li
                  key={a.id}
                  className={cx(
                    "flex flex-col items-center rounded-3xl border-2 px-2 py-4 text-center",
                    a.unlocked ? "border-clay-200 bg-clay-50 shadow-chunky" : "border-dashed border-line bg-surface",
                  )}
                >
                  <span
                    className={cx(
                      "flex h-14 w-14 items-center justify-center rounded-full text-3xl",
                      a.unlocked ? "animate-pop bg-white shadow-chunky" : "bg-subtle opacity-50 grayscale",
                    )}
                    aria-hidden
                  >
                    {a.unlocked ? a.emoji : "🔒"}
                  </span>
                  <p className={cx("mt-2 font-display text-base leading-tight font-semibold", a.unlocked ? "text-clay-700" : "text-ink-2")}>
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug font-bold text-ink-3">{a.description}</p>
                  {!a.unlocked && a.progress && (
                    <div className="mt-2 w-full px-2">
                      <ProgressBar value={a.progress.value / a.progress.target} label={`Progression : ${a.title}`} tone="clay" className="h-2.5 border-line bg-subtle" />
                      <p className="tabular mt-1 text-[11px] font-extrabold text-ink-3">
                        {a.progress.value}/{a.progress.target}
                      </p>
                    </div>
                  )}
                  <span className="sr-only">{a.unlocked ? "Badge obtenu" : "Badge à débloquer"}</span>
                </li>
              ))}
            </ul>
          </Card>

          <RulesCard />

          {/* Données réelles : état des API à la place des outils de démo. */}
          {!demo ? (
            <ApiStatusSection />
          ) : (
            <Card className="p-5">
              <p className="font-display text-xl font-semibold text-ink">🛠️ Outils de démo</p>
              <p className="mt-1 text-sm font-semibold text-ink-3">
                Les matchs et les cotes sont fictifs dans cette version. Avance l&apos;horloge ou termine des matchs pour voir
                tes points arriver.
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-subtle px-4 py-3 text-sm font-bold">
                <span aria-hidden>⏰</span>
                <span className="text-ink-2">
                  Horloge du jeu :{" "}
                  <strong className="font-extrabold text-ink">
                    {now.toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </strong>
                  {timeOffset !== 0 && <span className="text-clay-600"> (+{Math.round(timeOffset / HOUR)} h)</span>}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => shiftTime(HOUR)}>
                  ⏩ Avancer d&apos;1 heure
                </Button>
                <Button variant="secondary" onClick={() => shiftTime(24 * HOUR)}>
                  ⏭️ Avancer d&apos;1 jour
                </Button>
                <Button variant="secondary" onClick={() => finishMatches("live")}>
                  🏁 Terminer les matchs en cours
                </Button>
                <Button variant="primary" onClick={() => finishMatches("day")}>
                  🎲 Simuler les résultats du jour
                </Button>
                <Button
                  variant="ghost"
                  className="sm:col-span-2"
                  onClick={() => {
                    demo.clearOverrides();
                    shiftTime(0);
                  }}
                >
                  ↩️ Revenir à l&apos;heure réelle
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
      {toast.node}
    </div>
  );
}

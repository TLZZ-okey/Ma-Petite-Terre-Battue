"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { useMyPredictions } from "@/components/hooks";
import { LogoutIcon } from "@/components/icons";
import { RulesCard } from "@/components/RulesCard";
import { Button, Card, PageHeader, StatCard, cx } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { AVATAR_COLORS } from "@/lib/auth";
import { dayKey } from "@/lib/dates";
import { formatPoints } from "@/lib/format";

const HOUR = 3_600_000;

export default function ProfilPage() {
  const { user, repo, matches, now, timeOffset, setTimeOffset, logout, refreshUser, invalidate } = useApp();
  const { data } = useMyPredictions();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;
  const stats = data?.stats;

  async function changeColor(color: string) {
    await repo.updateUser(user!.id, { avatarColor: color });
    await refreshUser();
    invalidate();
  }

  async function finishMatches(scope: "live" | "day") {
    const day = await matches.getMatchesForDay(dayKey(now), now);
    const targets = day.filter((m) => (scope === "live" ? m.status === "live" : m.status !== "finished"));
    targets.forEach((m) => matches.finishNow(m.id));
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
        <PageHeader title="Profil" subtitle="Ton compte, tes statistiques et les outils de démo" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="clay-surface court-lines h-24" aria-hidden />
            <div className="relative z-10 -mt-10 flex flex-col items-center px-5 pb-5 text-center">
              <Avatar name={user.username} color={user.avatarColor} size={80} />
              <h2 className="mt-3 font-display text-2xl leading-none font-bold tracking-wide text-court-900 uppercase">
                {user.username}
              </h2>
              <p className="mt-1 text-xs text-ink-3">Membre depuis le {memberSince}</p>
            </div>
            <div className="border-t border-line px-5 py-4">
              <p className="text-xs font-semibold text-ink-2" id="avatar-color">
                Couleur de l&apos;avatar
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5" role="radiogroup" aria-labelledby="avatar-color">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={user.avatarColor === c}
                    aria-label={`Couleur ${c}`}
                    onClick={() => changeColor(c)}
                    className={cx(
                      "h-8 w-8 rounded-full ring-offset-2 ring-offset-surface transition",
                      user.avatarColor === c ? "ring-2 ring-ink" : "hover:scale-110",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Points" value={formatPoints(stats?.points ?? 0)} tone="clay" />
            <StatCard label="Pronos joués" value={stats?.total ?? 0} />
            <StatCard label="Bons vainqueurs" value={stats?.won ?? 0} tone="court" />
            <StatCard label="Scores exacts" value={stats?.perfect ?? 0} tone="gold" />
          </div>

          <Card className="p-2">
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/connexion");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-ink hover:bg-subtle"
            >
              <LogoutIcon width={18} height={18} className="text-ink-3" />
              Changer de compte / Se déconnecter
            </button>
            {confirmDelete ? (
              <div className="m-1 rounded-xl bg-danger-50 p-3">
                <p className="text-sm font-semibold text-danger">Supprimer ton compte et tous tes pronos ?</p>
                <p className="mt-0.5 text-xs text-ink-2">Cette action est définitive.</p>
                <div className="mt-3 flex gap-2">
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
                className="w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-danger hover:bg-danger-50"
              >
                Supprimer mon compte et mes pronos
              </button>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <RulesCard />

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold tracking-wide text-court-900 uppercase">Outils de démo</p>
                <p className="mt-1 text-sm text-ink-3">
                  Les matchs et les cotes sont fictifs dans cette version. Avance l&apos;horloge ou termine des matchs
                  pour voir tes points arriver.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-subtle px-4 py-3 text-sm">
              <span className={cx("h-2 w-2 rounded-full", timeOffset ? "bg-clay-500" : "bg-court-500")} aria-hidden />
              <span className="text-ink-2">
                Horloge de l&apos;app :{" "}
                <strong className="font-semibold text-ink">
                  {now.toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </strong>
                {timeOffset !== 0 && <span className="text-clay-600"> (+{Math.round(timeOffset / HOUR)} h)</span>}
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => shiftTime(HOUR)}>
                Avancer d&apos;1 heure
              </Button>
              <Button variant="secondary" onClick={() => shiftTime(24 * HOUR)}>
                Avancer d&apos;1 jour
              </Button>
              <Button variant="secondary" onClick={() => finishMatches("live")}>
                Terminer les matchs en cours
              </Button>
              <Button variant="primary" onClick={() => finishMatches("day")}>
                Simuler les résultats du jour
              </Button>
              <Button
                variant="ghost"
                className="sm:col-span-2"
                onClick={() => {
                  matches.clearOverrides();
                  shiftTime(0);
                }}
              >
                Revenir à l&apos;heure réelle
              </Button>
            </div>
          </Card>
        </div>
      </div>
      {toast.node}
    </div>
  );
}

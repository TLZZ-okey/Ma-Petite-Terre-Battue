"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar } from "@/components/Avatar";
import { useMyPredictions } from "@/components/hooks";
import { LogoutIcon } from "@/components/icons";
import { RulesCard } from "@/components/RulesCard";
import { StatTile } from "@/components/StatTile";
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

  return (
    <div className="pb-6 md:grid md:grid-cols-2 md:items-start md:gap-6 md:pt-8">
      <div>
      <div className="clay-court relative mx-4 mt-5 md:mx-0 md:mt-0 flex flex-col items-center rounded-3xl px-4 pt-6 pb-5 text-white shadow-md">
        <Avatar name={user.username} color={user.avatarColor} size={76} />
        <h1 className="mt-2 text-xl font-black drop-shadow">{user.username}</h1>
        <p className="text-xs font-medium text-white/90 drop-shadow">
          Membre depuis le {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 px-4 md:px-0">
        <StatTile label="Points" value={formatPoints(stats?.points ?? 0)} accent="text-clay" />
        <StatTile label="Pronos joués" value={String(stats?.total ?? 0)} />
        <StatTile label="Bons vainqueurs" value={String(stats?.won ?? 0)} accent="text-rg" />
        <StatTile label="Scores exacts" value={String(stats?.perfect ?? 0)} accent="text-gold" />
      </div>

      <Section title="Couleur de l'avatar">
        <div className="flex flex-wrap gap-3">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => changeColor(c)}
              aria-label={`Couleur ${c}`}
              aria-pressed={user.avatarColor === c}
              className={`h-9 w-9 rounded-full transition ${
                user.avatarColor === c ? "scale-110 ring-4 ring-clay/40" : "ring-2 ring-white"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Section>

      {renderAccountActions()}
      </div>
      <div>
      <RulesCard className="mx-4 mt-4 md:mx-0 md:mt-0" />

      <Section title="Outils de démo">
        <p className="mb-3 text-xs text-muted">
          Les matchs et les cotes sont fictifs pour cette première version. Avance l&apos;horloge ou termine des matchs
          pour voir tes points tomber.
          {timeOffset !== 0 && (
            <strong className="mt-1 block text-clay-dark">
              Horloge de l&apos;app : {now.toLocaleString("fr-FR", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}{" "}
              (+{Math.round(timeOffset / HOUR)} h)
            </strong>
          )}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm font-bold">
          <DemoButton onClick={() => shiftTime(HOUR)}>+1 heure</DemoButton>
          <DemoButton onClick={() => shiftTime(24 * HOUR)}>+1 jour</DemoButton>
          <DemoButton onClick={() => finishMatches("live")}>Terminer les matchs en cours</DemoButton>
          <DemoButton onClick={() => finishMatches("day")}>Simuler tous les résultats du jour</DemoButton>
          <DemoButton
            onClick={() => {
              matches.clearOverrides();
              shiftTime(0);
            }}
            className="col-span-2"
          >
            Revenir à l&apos;heure réelle
          </DemoButton>
        </div>
      </Section>

      </div>
      {toast.node}
    </div>
  );

  function renderAccountActions() {
    return (
      <div className="mt-6 space-y-2 px-4 md:px-0">
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/connexion");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rg py-3 font-bold text-white shadow"
        >
          <LogoutIcon width={18} height={18} /> Changer de compte / Se déconnecter
        </button>
        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={deleteAccount}
              className="flex-1 rounded-xl bg-live py-3 text-sm font-bold text-white"
            >
              Confirmer la suppression
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-xl border border-sand bg-white py-3 text-sm font-bold"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2 text-sm font-semibold text-live"
          >
            Supprimer mon compte et mes pronos
          </button>
        )}
      </div>
    );
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-4 mt-4 md:mx-0 rounded-2xl border border-sand bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-extrabold tracking-wide text-rg-dark uppercase">{title}</h2>
      {children}
    </section>
  );
}

function DemoButton({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-xl border border-clay/40 bg-clay-50 px-3 py-2.5 text-clay-dark transition hover:bg-clay hover:text-white ${className}`}
    />
  );
}

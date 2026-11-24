"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { formatPoints } from "@/lib/format";
import { levelFor } from "@/lib/gamification";
import { SportScoreCredit } from "./ApiStatus";
import { SplashScreen, useApp } from "./AppProvider";
import { Avatar } from "./Avatar";
import { Celebration } from "./Celebration";
import { useMyPredictions } from "./hooks";
import { BallIcon, Logo, TicketIcon, TrophyIcon, UserIcon } from "./icons";
import { ProgressBar, cx } from "./ui";

const TABS = [
  { href: "/matchs", label: "Matchs", Icon: BallIcon },
  { href: "/pronos", label: "Mes pronos", Icon: TicketIcon },
  { href: "/classement", label: "Classement", Icon: TrophyIcon },
  { href: "/profil", label: "Profil", Icon: UserIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, user, source } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/connexion");
  }, [ready, user, router]);

  if (!ready || !user) return <SplashScreen />;

  return (
    <div className="min-h-dvh">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-xl bg-surface px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <Sidebar />
      <TopBar />
      <main id="contenu" className="pb-28 lg:pb-16 lg:pl-72">
        <div className="mx-auto w-full max-w-6xl sm:px-6 lg:px-10">
          {children}
          {/* Mention exigée par l'offre gratuite de SportScore (données réelles uniquement). */}
          {source === "api" && <SportScoreCredit className="px-4 pt-10 text-center" />}
        </div>
      </main>
      <TabBar />
      <Celebration />
    </div>
  );
}

function usePoints() {
  const { data } = useMyPredictions();
  return data?.stats.points ?? 0;
}

/** Navigation latérale (ordinateur) : terre battue, carte de joueur avec niveau et XP. */
function Sidebar() {
  const pathname = usePathname();
  const { user } = useApp();
  const points = usePoints();
  const lvl = levelFor(points);
  return (
    <aside className="clay-surface fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r-4 border-clay-700 text-white lg:flex">
      <Link href="/matchs" className="flex items-center gap-3 px-6 pt-7 pb-7">
        <span className="animate-float">
          <Logo size={48} />
        </span>
        <span className="font-display text-2xl leading-[1.02] font-bold drop-shadow-[0_2px_0_rgb(0_0_0_/_0.2)]">
          Ma Petite
          <br />
          Terre Battue
        </span>
      </Link>

      <nav aria-label="Navigation principale" className="flex-1 space-y-2 px-4">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "press flex items-center gap-3 rounded-2xl border-2 px-4 py-3 font-display text-lg font-semibold",
                active
                  ? "border-white bg-white text-clay-600 shadow-[0_4px_0_0_rgb(0_0_0_/_0.18)]"
                  : "border-transparent text-white hover:bg-white/15",
              )}
            >
              <Icon width={24} height={24} />
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <Link
          href="/profil"
          className="press m-4 block rounded-3xl border-2 border-white/40 bg-white/15 p-4 backdrop-blur-sm hover:bg-white/20"
        >
          <span className="flex items-center gap-3">
            <span className="relative">
              <Avatar name={user.username} color={user.avatarColor} size={46} />
              <span className="absolute -right-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ball text-[11px] font-black text-ink">
                {lvl.current.level}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-lg leading-tight font-semibold">{user.username}</span>
              <span className="block truncate text-xs font-bold text-white/85">
                {lvl.current.emoji} {lvl.current.title}
              </span>
            </span>
          </span>
          <ProgressBar value={lvl.progress} label="Progression vers le niveau suivant" className="mt-3 border-white/30 bg-white/20" />
          <span className="tabular mt-1.5 flex justify-between text-xs font-bold text-white/90">
            <span>{formatPoints(points)} pts</span>
            <span>{lvl.next ? `encore ${formatPoints(lvl.toNext)} pts` : "niveau max !"}</span>
          </span>
        </Link>
      )}
    </aside>
  );
}

/** Barre supérieure (mobile et tablette). */
function TopBar() {
  const points = usePoints();
  const lvl = levelFor(points);
  return (
    <header className="clay-surface pt-safe sticky top-0 z-30 border-b-4 border-clay-700 text-white lg:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/matchs" className="flex min-w-0 flex-1 items-center gap-2.5">
          <Logo size={38} />
          <span className="truncate font-display text-xl font-bold drop-shadow-[0_2px_0_rgb(0_0_0_/_0.2)]">
            Ma Petite Terre Battue
          </span>
        </Link>
        <Link
          href="/profil"
          className="press tabular flex items-center gap-2 rounded-2xl border-2 border-white bg-white py-1 pr-3 pl-1 font-display font-semibold text-clay-600 shadow-[0_3px_0_0_rgb(0_0_0_/_0.2)]"
          aria-label={`Niveau ${lvl.current.level}, ${formatPoints(points)} points`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-ball text-sm font-black text-ink">
            {lvl.current.level}
          </span>
          {formatPoints(points)}
        </Link>
      </div>
    </header>
  );
}

/** Barre d'onglets inférieure (mobile et tablette). */
function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-surface/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center gap-0.5 pt-2 pb-2.5 font-display text-xs font-semibold transition-colors",
                  active ? "text-clay-600" : "text-ink-3 hover:text-ink",
                )}
              >
                <span
                  className={cx(
                    "flex h-9 w-14 items-center justify-center rounded-2xl transition-all",
                    active && "-translate-y-0.5 bg-clay-600 text-white shadow-chunky-clay",
                  )}
                >
                  <Icon width={22} height={22} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

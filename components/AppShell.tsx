"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { formatPoints } from "@/lib/format";
import { SplashScreen, useApp } from "./AppProvider";
import { Avatar } from "./Avatar";
import { useMyPredictions } from "./hooks";
import { BallIcon, Logo, TicketIcon, TrophyIcon, UserIcon } from "./icons";
import { cx } from "./ui";

const TABS = [
  { href: "/matchs", label: "Matchs", Icon: BallIcon },
  { href: "/pronos", label: "Mes pronos", Icon: TicketIcon },
  { href: "/classement", label: "Classement", Icon: TrophyIcon },
  { href: "/profil", label: "Profil", Icon: UserIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/connexion");
  }, [ready, user, router]);

  if (!ready || !user) return <SplashScreen />;

  return (
    <div className="min-h-dvh">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <Sidebar />
      <TopBar />
      <main id="contenu" className="pb-28 lg:pb-16 lg:pl-64">
        <div className="mx-auto w-full max-w-6xl sm:px-6 lg:px-10">{children}</div>
      </main>
      <TabBar />
    </div>
  );
}

function usePoints() {
  const { data } = useMyPredictions();
  return data?.stats.points ?? 0;
}

/** Navigation latérale (ordinateur). */
function Sidebar() {
  const pathname = usePathname();
  const { user } = useApp();
  const points = usePoints();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-court-900 text-white lg:flex">
      <Link href="/matchs" className="flex items-center gap-3 px-6 pt-7 pb-8">
        <Logo size={40} />
        <span className="font-display text-xl leading-[1.05] font-bold tracking-wide uppercase">
          Ma Petite
          <br />
          Terre Battue
        </span>
      </Link>

      <nav aria-label="Navigation principale" className="flex-1 space-y-1 px-3">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
              )}
            >
              {active && <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-clay-400" aria-hidden />}
              <Icon width={20} height={20} className={active ? "text-clay-200" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <Link
          href="/profil"
          className="m-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3 transition-colors hover:bg-white/10"
        >
          <Avatar name={user.username} color={user.avatarColor} size={40} ring={false} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{user.username}</span>
            <span className="tabular block text-xs text-white/60">{formatPoints(points)} points</span>
          </span>
        </Link>
      )}
    </aside>
  );
}

/** Barre supérieure (mobile et tablette). */
function TopBar() {
  const points = usePoints();
  return (
    <header className="pt-safe sticky top-0 z-30 bg-court-900 text-white lg:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/matchs" className="flex min-w-0 flex-1 items-center gap-2.5">
          <Logo size={32} />
          <span className="truncate font-display text-lg font-bold tracking-wide uppercase">Ma Petite Terre Battue</span>
        </Link>
        <Link
          href="/pronos"
          className="tabular flex items-center gap-1.5 rounded-full bg-white/10 py-1.5 pr-3 pl-2 text-sm font-semibold"
          aria-label={`${formatPoints(points)} points`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-ball" aria-hidden />
          {formatPoints(points)} pts
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
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
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
                  "flex flex-col items-center gap-1 pt-2 pb-2.5 text-[11px] font-semibold transition-colors",
                  active ? "text-court-800" : "text-ink-3 hover:text-ink",
                )}
              >
                <span
                  className={cx(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-court-50 text-clay-600",
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

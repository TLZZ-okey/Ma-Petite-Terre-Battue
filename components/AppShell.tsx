"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { pts } from "@/lib/format";
import { SplashScreen, useApp } from "./AppProvider";
import { useMyPredictions } from "./hooks";
import { BallIcon, Logo, TicketIcon, TrophyIcon, UserIcon } from "./icons";

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
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-cream sm:shadow-xl">
      <Header />
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}

function Header() {
  const { data } = useMyPredictions();
  return (
    <header className="pt-safe sticky top-0 z-30 bg-rg text-white shadow-md">
      <div className="flex h-14 items-center gap-3 px-4">
        <Logo size={34} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-extrabold tracking-wide uppercase">Ma Petite Terre Battue</p>
          <p className="text-[11px] font-medium text-white/70">Pronostics tennis entre amis</p>
        </div>
        <Link
          href="/pronos"
          className="flex items-center gap-1.5 rounded-full bg-clay px-3 py-1.5 text-sm font-bold shadow-inner ring-1 ring-white/30"
          aria-label="Mes points"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-ball" />
          {pts(data?.stats.points ?? 0)}
        </Link>
      </div>
      <div className="h-1 bg-clay" />
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                  active ? "text-clay" : "text-muted hover:text-rg"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className={`rounded-full px-4 py-1 transition-colors ${active ? "bg-clay-50" : ""}`}>
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

export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-4 pt-5 pb-3">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-rg-dark uppercase">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

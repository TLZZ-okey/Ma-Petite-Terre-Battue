import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Assemble des classes CSS en ignorant les valeurs vides. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

type CardTone = "default" | "clay" | "court" | "ball";

const CARD_TONES: Record<CardTone, string> = {
  default: "border-line bg-surface shadow-chunky",
  clay: "border-clay-700 bg-clay-500 text-white shadow-chunky-clay",
  court: "border-court-800 bg-court-700 text-white shadow-chunky-court",
  ball: "border-ball-dark bg-ball text-ink shadow-[0_4px_0_0_var(--color-ball-dark)]",
};

/** Carte « jeu » : coins très arrondis, bordure épaisse, ombre pleine. */
export function Card({ className, tone = "default", children }: { className?: string; tone?: CardTone; children: ReactNode }) {
  return <div className={cx("rounded-3xl border-2", CARD_TONES[tone], className)}>{children}</div>;
}

export function PageHeader({
  title,
  emoji,
  subtitle,
  actions,
}: {
  title: string;
  emoji?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-6 pb-4 sm:px-0 lg:pt-10 lg:pb-6">
      <div className="flex min-w-0 items-center gap-3">
        {emoji && (
          <span
            className="flex h-12 w-12 shrink-0 animate-pop items-center justify-center rounded-2xl border-2 border-clay-200 bg-surface text-2xl shadow-chunky lg:h-14 lg:w-14 lg:text-3xl"
            aria-hidden
          >
            {emoji}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none font-bold text-clay-600 lg:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm font-semibold text-ink-3">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-semibold text-ink first-letter:uppercase">{children}</h2>
      {meta && <span className="text-xs font-semibold text-ink-3">{meta}</span>}
    </div>
  );
}

type Tone = "neutral" | "court" | "clay" | "danger" | "gold" | "live" | "ball";

const BADGE_TONES: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-2 border-line",
  court: "bg-court-50 text-court-700 border-court-200",
  clay: "bg-clay-50 text-clay-700 border-clay-200",
  danger: "bg-danger-50 text-danger border-danger/30",
  gold: "bg-gold-50 text-gold border-gold-400/50",
  live: "bg-danger text-white border-danger",
  ball: "bg-ball text-ink border-ball-dark",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-extrabold",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "success" | "ghost" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-clay-600 text-white border-clay-800 shadow-chunky-clay hover:bg-clay-700",
  secondary: "bg-surface text-clay-700 border-line-strong shadow-chunky hover:bg-subtle",
  success: "bg-court-600 text-white border-court-900 shadow-chunky-court hover:bg-court-700",
  ghost: "border-transparent text-ink-2 hover:bg-subtle hover:text-ink",
  danger: "bg-danger text-white border-[#8e1b27] shadow-[0_4px_0_0_#8e1b27] hover:brightness-110",
};

/** Bouton « jeu » : épais, qui s'enfonce au clic. */
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "press inline-flex items-center justify-center gap-2 rounded-2xl border-2 font-display font-semibold tracking-wide disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-10 px-4 text-sm",
        size === "md" && "h-12 px-5 text-base",
        size === "lg" && "h-14 px-6 text-lg",
        BUTTON_VARIANTS[variant],
        className,
      )}
    />
  );
}

/** Contrôle segmenté (onglets ou filtres exclusifs). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "md",
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx("inline-flex gap-1 rounded-2xl border-2 border-line bg-surface p-1 shadow-chunky", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "flex-1 rounded-xl font-display font-semibold whitespace-nowrap transition-colors",
            size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-base",
            value === o.value ? "bg-clay-600 text-white" : "text-ink-2 hover:bg-subtle hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  emoji,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  emoji?: string;
  tone?: "default" | "clay" | "gold" | "court";
}) {
  const color = { default: "text-ink", clay: "text-clay-600", gold: "text-gold", court: "text-court-600" }[tone];
  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      {emoji && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-subtle text-2xl" aria-hidden>
          {emoji}
        </span>
      )}
      <div className="min-w-0">
        <p className={cx("tabular font-display text-2xl leading-none font-bold sm:text-3xl", color)}>{value}</p>
        <p className="mt-1 truncate text-xs font-bold text-ink-3">{label}</p>
        {hint && <p className="truncate text-[11px] font-semibold text-ink-3">{hint}</p>}
      </div>
    </Card>
  );
}

/** Barre de progression (XP, défi du jour…). */
export function ProgressBar({
  value,
  label,
  tone = "ball",
  className,
}: {
  /** De 0 à 1. */
  value: number;
  label: string;
  tone?: "ball" | "clay" | "court";
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const fill = { ball: "bg-ball", clay: "bg-clay-500", court: "bg-court-500" }[tone];
  return (
    <div
      className={cx("h-3.5 overflow-hidden rounded-full border-2 border-black/10 bg-black/10", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cx("h-full rounded-full transition-[width] duration-700", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon = "🎾", title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-20 w-20 animate-float items-center justify-center rounded-full bg-clay-50 text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="mt-4 font-display text-xl font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm font-semibold text-ink-3">{children}</div>}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-3xl bg-clay-100/70", className)} />;
}

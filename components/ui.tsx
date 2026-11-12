import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Assemble des classes CSS en ignorant les valeurs vides. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-2xl border border-line bg-surface shadow-card", className)}>{children}</div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-6 pb-4 sm:px-0 lg:pt-10 lg:pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl leading-none font-bold tracking-wide text-court-900 uppercase lg:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold text-ink first-letter:uppercase">{children}</h2>
      {meta && <span className="text-xs text-ink-3">{meta}</span>}
    </div>
  );
}

type Tone = "neutral" | "court" | "clay" | "danger" | "gold" | "live";

const BADGE_TONES: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-2",
  court: "bg-court-50 text-court-700",
  clay: "bg-clay-50 text-clay-700",
  danger: "bg-danger-50 text-danger",
  gold: "bg-gold-50 text-gold",
  live: "bg-danger text-white",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-clay-500 text-white shadow-card hover:bg-clay-600 active:bg-clay-700",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-subtle",
  ghost: "text-ink-2 hover:bg-subtle hover:text-ink",
  danger: "bg-danger text-white hover:brightness-110",
};

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
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-base",
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
    <div role="tablist" aria-label={label} className={cx("inline-flex rounded-xl bg-subtle p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "flex-1 rounded-lg font-semibold whitespace-nowrap transition",
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            value === o.value ? "bg-surface text-court-800 shadow-card" : "text-ink-3 hover:text-ink",
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
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "clay" | "gold" | "court";
}) {
  const color = { default: "text-ink", clay: "text-clay-600", gold: "text-gold", court: "text-court-600" }[tone];
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-medium text-ink-3">{label}</p>
      <p className={cx("tabular mt-1 font-display text-2xl leading-none font-bold sm:text-3xl", color)}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink-3">{hint}</p>}
    </Card>
  );
}

export function EmptyState({ icon = "🎾", title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-clay-50 text-2xl">{icon}</span>
      <p className="mt-4 font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-3">{children}</div>}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-line/60", className)} />;
}

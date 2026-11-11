/** Clé de jour locale au format YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Convertit une clé YYYY-MM-DD en date locale à minuit. */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Numéro de semaine absolu (semaines commençant le lundi) pour un jour donné. */
export function weekIndex(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor(utc / 86_400_000);
  // Le 1er janvier 1970 était un jeudi : +3 aligne les semaines sur le lundi.
  return Math.floor((days + 3) / 7);
}

/** Jour de la semaine, lundi = 0 … dimanche = 6. */
export function weekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

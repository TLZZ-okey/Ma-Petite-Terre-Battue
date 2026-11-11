export function StatTile({ label, value, accent = "text-rg-dark" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-sand bg-white px-3 py-3 text-center shadow-sm">
      <p className={`text-xl leading-tight font-extrabold ${accent}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-muted uppercase">{label}</p>
    </div>
  );
}

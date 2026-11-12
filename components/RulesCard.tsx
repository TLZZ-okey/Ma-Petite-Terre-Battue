import { Card, cx } from "./ui";

const STEPS = [
  {
    title: "Saisis le score en sets",
    text: "Pour chaque match, indique les sets gagnés par chaque joueur (2-0, 2-1, 1-2…). Ton prono s'enregistre dès que le score est cohérent.",
  },
  {
    title: "Bon vainqueur",
    text: "Tu gagnes le nombre de points affiché à côté du joueur (sa cote × 20).",
  },
  {
    title: "Score exact",
    text: "Bon vainqueur et bon nombre de sets : tes points sont multipliés par 1,5.",
  },
];

export function RulesCard({ className }: { className?: string }) {
  return (
    <Card className={cx("p-5", className)}>
      <p className="font-display text-lg font-bold tracking-wide text-court-900 uppercase">Comment ça marche</p>
      <ol className="mt-3 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay-50 text-xs font-bold text-clay-700">
              {i + 1}
            </span>
            <div className="text-sm">
              <p className="font-semibold text-ink">{s.title}</p>
              <p className="mt-0.5 text-ink-3">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl bg-subtle px-3 py-2 text-xs text-ink-2">
        Mauvais vainqueur : 0 point. Les pronos ferment au début du match.
      </p>
    </Card>
  );
}

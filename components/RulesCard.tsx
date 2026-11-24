import { Card, cx } from "./ui";

const STEPS = [
  {
    emoji: "✍️",
    title: "Devine le score",
    text: "Entre les sets gagnés par chaque joueur (3-0, 3-1, 2-3…). Ton prono s'enregistre tout seul.",
  },
  {
    emoji: "🎾",
    title: "Bon vainqueur",
    text: "Tu remportes les points affichés à côté du joueur. Plus c'est risqué, plus ça rapporte !",
  },
  {
    emoji: "🎯",
    title: "Score exact",
    text: "Bon vainqueur et bons sets : tes points sont multipliés par 1,5.",
  },
];

export function RulesCard({ className }: { className?: string }) {
  return (
    <Card className={cx("p-5", className)}>
      <p className="font-display text-xl font-semibold text-clay-600">Comment gagner des points ?</p>
      <ol className="mt-3 space-y-3">
        {STEPS.map((s) => (
          <li key={s.title} className="flex gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-clay-200 bg-clay-50 text-xl"
              aria-hidden
            >
              {s.emoji}
            </span>
            <div className="text-sm">
              <p className="font-extrabold text-ink">{s.title}</p>
              <p className="mt-0.5 font-semibold text-ink-3">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-2xl bg-subtle px-3 py-2 text-xs font-bold text-ink-2">
        ❌ Mauvais vainqueur : 0 point. ⏱️ Les pronos ferment au début du match.
      </p>
    </Card>
  );
}

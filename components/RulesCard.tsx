export function RulesCard({ className = "mx-4 mt-4" }: { className?: string }) {
  return (
    <div className={`${className} rounded-2xl border border-clay/30 bg-white p-4 text-sm shadow-sm`}>
      <p className="mb-2 font-extrabold text-rg-dark uppercase">Comment marquer des points ?</p>
      <ul className="space-y-1.5 text-ink">
        <li>
          🎾 <strong>Bon vainqueur</strong> : tu gagnes la <strong>cote</strong> du joueur en points (cote 1,85 = 1,85
          pt).
        </li>
        <li>
          🏆 <strong>Bon vainqueur + nombre de sets exact</strong> : la cote est <strong>doublée</strong> (1,85 → 3,70
          pts).
        </li>
        <li>❌ Mauvais vainqueur : 0 point, même si le nombre de sets est juste.</li>
        <li>🔒 Les pronos ferment au début du match. Tu peux les modifier jusque-là.</li>
      </ul>
    </div>
  );
}

export function RulesCard({ className = "mx-4 mt-4" }: { className?: string }) {
  return (
    <div className={`${className} rounded-2xl border border-clay/30 bg-white p-4 text-sm shadow-sm`}>
      <p className="mb-2 font-extrabold text-rg-dark uppercase">Comment marquer des points ?</p>
      <ul className="space-y-1.5 text-ink">
        <li>
          ✍️ Pour chaque match, indique le <strong>nombre de sets gagnés</strong> par chaque joueur (ex. 2-0, 2-1, 1-2…).
        </li>
        <li>
          🎾 <strong>Bon vainqueur</strong> : tu gagnes la <strong>cote × 100</strong> en points (cote 1,47 = 147 pts).
        </li>
        <li>
          🏆 <strong>Bon vainqueur + score en sets exact</strong> : les points sont <strong>doublés</strong> (147 → 294
          pts).
        </li>
        <li>❌ Mauvais vainqueur : 0 point.</li>
        <li>🔒 Les pronos ferment au début du match. Tu peux les modifier jusque-là.</li>
      </ul>
    </div>
  );
}

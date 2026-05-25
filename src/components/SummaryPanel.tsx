import type { GameData } from '../types';
import type { Solution } from '../solver/solver';

interface Props {
  solution: Solution;
  gameData: GameData;
}

function fmt(n: number) {
  if (n >= 100) return n.toFixed(1);
  if (n >= 10) return n.toFixed(2);
  return n.toFixed(3);
}

export function SummaryPanel({ solution, gameData }: Props) {
  const rawSorted = Object.entries(solution.totals.rawByItem).sort((a, b) => b[1] - a[1]);
  const bldSorted = Object.entries(solution.totals.machinesByBuilding).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4 text-sm">
      <section>
        <div className="text-xs uppercase text-slate-400 mb-1">Total power</div>
        <div className="text-2xl font-bold text-accent tabular-nums">
          {fmt(solution.totals.power)} MW
        </div>
      </section>

      <section>
        <div className="text-xs uppercase text-slate-400 mb-1">Buildings</div>
        <ul className="space-y-1">
          {bldSorted.map(([key, count]) => (
            <li key={key} className="flex justify-between">
              <span>{gameData.buildings[key]?.name ?? key}</span>
              <span className="tabular-nums">×{fmt(count)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="text-xs uppercase text-slate-400 mb-1">Raw inputs</div>
        <ul className="space-y-1">
          {rawSorted.map(([item, rate]) => (
            <li key={item} className="flex justify-between">
              <span className="truncate">{gameData.items[item]?.name ?? item}</span>
              <span className="tabular-nums">{fmt(rate)}/min</span>
            </li>
          ))}
        </ul>
      </section>

      {solution.unresolved.size > 0 && (
        <section>
          <div className="text-xs uppercase text-red-400 mb-1">Unresolved items</div>
          <ul className="space-y-1">
            {[...solution.unresolved].map((it) => (
              <li key={it} className="text-red-300">
                {gameData.items[it]?.name ?? it}
              </li>
            ))}
          </ul>
        </section>
      )}

      {solution.cycleCuts.size > 0 && (
        <section>
          <div className="text-xs uppercase text-yellow-400 mb-1">Cycles broken</div>
          <ul className="space-y-1">
            {[...solution.cycleCuts].map((it) => (
              <li key={it} className="text-yellow-300">
                {gameData.items[it]?.name ?? it}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

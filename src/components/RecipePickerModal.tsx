import type { GameData } from '../types';

interface Props {
  gameData: GameData;
  itemClass: string;
  currentRecipe?: string;
  onPick: (recipeKey: string) => void;
  onClose: () => void;
}

function fmt(n: number) {
  return n >= 10 ? n.toFixed(1) : n.toFixed(2);
}

export function RecipePickerModal({ gameData, itemClass, currentRecipe, onPick, onClose }: Props) {
  const item = gameData.items[itemClass];
  const recipes = (gameData.producersByItem[itemClass] ?? []).map((rk) => gameData.recipes[rk]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border rounded-md max-w-2xl w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-slate-400">Pick recipe for</div>
            <div className="font-semibold">{item?.name ?? itemClass}</div>
          </div>
          <button className="text-slate-400 hover:text-slate-100" onClick={onClose}>
            ✕
          </button>
        </div>
        <ul>
          {recipes.map((r) => {
            const product = r.products.find((p) => p.item === itemClass)!;
            const perMin = product.amount * (60 / r.time);
            const isCur = r.className === currentRecipe;
            return (
              <li key={r.className} className="border-b border-border last:border-0">
                <button
                  className={`w-full text-left px-4 py-3 hover:bg-panel2 ${isCur ? 'bg-panel2' : ''}`}
                  onClick={() => onPick(r.className)}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">
                        {r.name}
                        {r.alternate && (
                          <span className="ml-2 text-[10px] text-accent uppercase">Alt</span>
                        )}
                        {isCur && (
                          <span className="ml-2 text-[10px] text-accent2 uppercase">Selected</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {gameData.buildings[r.producedIn[0]]?.name ?? r.producedIn[0]} · {r.time}s
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-raw">{fmt(perMin)}/min out</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    <span className="text-slate-400">in:</span>{' '}
                    {r.ingredients
                      .map(
                        (i) =>
                          `${fmt(i.amount * (60 / r.time))}/min ${
                            gameData.items[i.item]?.name ?? i.item
                          }`,
                      )
                      .join(', ')}
                  </div>
                  {r.products.length > 1 && (
                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400">+byproducts:</span>{' '}
                      {r.products
                        .filter((p) => p.item !== itemClass)
                        .map(
                          (p) =>
                            `${fmt(p.amount * (60 / r.time))}/min ${
                              gameData.items[p.item]?.name ?? p.item
                            }`,
                        )
                        .join(', ')}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { loadGameData } from './data/loader';
import { pickDefaultRecipe, solve, type SolveInput } from './solver/solver';
import type { GameData } from './types';
import { ItemPicker } from './components/ItemPicker';
import { ProductionGraph } from './components/ProductionGraph';
import { RecipePickerModal } from './components/RecipePickerModal';
import { SummaryPanel } from './components/SummaryPanel';

const DEFAULT_TARGET = 'Desc_ModularFrame_C';

/**
 * Output rate (items/min) of one machine running the default recipe for this item.
 * Falls back to 1/min if no recipe is known.
 */
function defaultRateForItem(
  data: GameData,
  itemClass: string,
  allowAlternates: boolean,
): number {
  const recipeKey = pickDefaultRecipe(data, itemClass, allowAlternates);
  if (!recipeKey) return 1;
  const recipe = data.recipes[recipeKey];
  const product = recipe.products.find((p) => p.item === itemClass);
  if (!product) return 1;
  return product.amount * (60 / recipe.time);
}

export function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [targetItem, setTargetItem] = useState(DEFAULT_TARGET);
  const [targetRate, setTargetRate] = useState(1);
  const [recipeChoices, setRecipeChoices] = useState<Record<string, string>>({});
  const [pinnedRaw, setPinnedRaw] = useState<Record<string, boolean>>({});
  const [allowAlternates, setAllowAlternates] = useState(false);

  const [pickerForItem, setPickerForItem] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'plan' | 'graph'>('plan');

  useEffect(() => {
    loadGameData()
      .then((d) => {
        setGameData(d);
        let initial = DEFAULT_TARGET;
        if (!d.items[DEFAULT_TARGET]) {
          // Fall back to first non-raw item if our default isn't present.
          const fallback = d.allItems.find((cn) => !d.rawItems.has(cn));
          if (fallback) initial = fallback;
        }
        setTargetItem(initial);
        setTargetRate(defaultRateForItem(d, initial, false));
      })
      .catch((e) => setError(String(e)));
  }, []);

  const solveInput: SolveInput | null = useMemo(() => {
    if (!gameData) return null;
    return {
      targetItem,
      targetRate,
      recipeChoices,
      pinnedRaw,
      allowAlternates,
    };
  }, [gameData, targetItem, targetRate, recipeChoices, pinnedRaw, allowAlternates]);

  const solution = useMemo(() => {
    if (!gameData || !solveInput) return null;
    return solve(gameData, solveInput);
  }, [gameData, solveInput]);

  if (error) {
    return (
      <div className="p-6 text-red-300">
        Failed to load game data: {error}
      </div>
    );
  }
  if (!gameData || !solution) {
    return <div className="p-6 text-slate-400">Loading game data…</div>;
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col">
      <header className="px-4 py-3 border-b border-border bg-panel flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-accent truncate">
            <span className="hidden sm:inline">Satisfactory Dependencies</span>
            <span className="sm:hidden">Satisfactory Deps</span>
          </div>
          <div className="text-[11px] text-slate-400 hidden sm:block">
            {gameData.allItems.length} items · {Object.keys(gameData.recipes).length} recipes
          </div>
        </div>
        {/* Mobile-only view switcher */}
        <div className="md:hidden flex bg-panel2 border border-border rounded overflow-hidden text-sm shrink-0">
          <button
            className={`px-3 py-1.5 ${
              mobileView === 'plan' ? 'bg-accent text-bg font-medium' : 'text-slate-300'
            }`}
            onClick={() => setMobileView('plan')}
          >
            Plan
          </button>
          <button
            className={`px-3 py-1.5 ${
              mobileView === 'graph' ? 'bg-accent text-bg font-medium' : 'text-slate-300'
            }`}
            onClick={() => setMobileView('graph')}
          >
            Graph
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <aside
          className={`${
            mobileView === 'plan' ? 'flex' : 'hidden'
          } md:flex flex-col flex-1 md:flex-none md:w-72 md:border-r border-border bg-panel p-4 overflow-y-auto shrink-0 space-y-4`}
        >
          <ItemPicker
            gameData={gameData}
            value={targetItem}
            onChange={(v) => {
              setTargetItem(v);
              setTargetRate(defaultRateForItem(gameData, v, allowAlternates));
              // Reset per-item choices when we switch targets so the new tree starts clean.
              setRecipeChoices({});
              setPinnedRaw({});
            }}
          />

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400 block mb-1">
              Target rate (items/min)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={targetRate}
              onChange={(e) => setTargetRate(Number(e.target.value) || 0)}
              className="w-full bg-panel2 border border-border rounded px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowAlternates}
              onChange={(e) => setAllowAlternates(e.target.checked)}
            />
            Prefer alternate recipes as default
          </label>

          {Object.keys(recipeChoices).length > 0 && (
            <button
              className="text-xs text-accent2 hover:underline"
              onClick={() => setRecipeChoices({})}
            >
              Reset recipe overrides ({Object.keys(recipeChoices).length})
            </button>
          )}
          {Object.keys(pinnedRaw).length > 0 && (
            <button
              className="text-xs text-accent2 hover:underline block"
              onClick={() => setPinnedRaw({})}
            >
              Clear pinned raw items ({Object.keys(pinnedRaw).length})
            </button>
          )}

          <hr className="border-border" />

          <SummaryPanel solution={solution} gameData={gameData} />
        </aside>

        <main
          className={`${
            mobileView === 'graph' ? 'block' : 'hidden'
          } md:block flex-1 min-w-0 bg-bg`}
        >
          <ProductionGraph
            key={mobileView}
            solution={solution}
            gameData={gameData}
            onPickAlternate={(itemClass) => setPickerForItem(itemClass)}
            onPinRaw={(itemClass) =>
              setPinnedRaw((prev) => ({ ...prev, [itemClass]: true }))
            }
            onUnpinRaw={(itemClass) =>
              setPinnedRaw((prev) => {
                const next = { ...prev };
                delete next[itemClass];
                return next;
              })
            }
          />
        </main>
      </div>

      {pickerForItem && (
        <RecipePickerModal
          gameData={gameData}
          itemClass={pickerForItem}
          currentRecipe={
            recipeChoices[pickerForItem] ??
            pickDefaultRecipe(gameData, pickerForItem, allowAlternates)
          }
          onPick={(rk) => {
            setRecipeChoices((prev) => ({ ...prev, [pickerForItem]: rk }));
            setPickerForItem(null);
          }}
          onClose={() => setPickerForItem(null)}
        />
      )}
    </div>
  );
}

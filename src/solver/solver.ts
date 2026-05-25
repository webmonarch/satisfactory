import type { GameData, RawRecipe } from '../types';

export interface SolveInput {
  /** className of the target item */
  targetItem: string;
  /** desired output rate in items/min */
  targetRate: number;
  /** itemClassName -> recipe className the user has chosen for that item */
  recipeChoices: Record<string, string>;
  /** itemClassName -> true means "treat as raw input, don't recurse" */
  pinnedRaw: Record<string, boolean>;
  /** allow alternate recipes when auto-selecting defaults */
  allowAlternates: boolean;
}

export interface RecipeNode {
  id: string; // unique per (recipe, path) — but we collapse by recipe className
  recipeKey: string;
  recipe: RawRecipe;
  /** how many machines of producedIn are needed (fractional) */
  machineCount: number;
  /** power draw for the chosen building * machineCount (approx, ignores overclocking) */
  power: number;
  /** items/min produced of the *primary* output (the one this node was created for) */
  primaryOutputRate: number;
  primaryOutputItem: string;
  /** per-ingredient items/min consumed */
  inputs: Array<{ item: string; rate: number }>;
  /** all products of the recipe at this scale (including byproducts) */
  outputs: Array<{ item: string; rate: number }>;
  buildingKey: string;
}

export interface RawNode {
  id: string;
  item: string;
  rate: number;
}

export interface Solution {
  recipeNodes: Map<string, RecipeNode>; // key: recipeKey (collapsed)
  rawNodes: Map<string, RawNode>; // key: item className
  /** edges: from sourceId -> { targetId, item, rate } */
  edges: Array<{ source: string; target: string; item: string; rate: number }>;
  /** items requested but no recipe was chosen / no producer exists */
  unresolved: Set<string>;
  /** items where recursion was cut to break a cycle */
  cycleCuts: Set<string>;
  /** totals */
  totals: {
    rawByItem: Record<string, number>;
    machinesByBuilding: Record<string, number>;
    power: number;
  };
}

export function pickDefaultRecipe(
  data: GameData,
  itemClass: string,
  allowAlternates: boolean,
): string | undefined {
  const list = data.producersByItem[itemClass];
  if (!list || list.length === 0) return undefined;
  if (allowAlternates) return list[0];
  const nonAlt = list.find((rk) => !data.recipes[rk].alternate);
  return nonAlt ?? list[0];
}

function rawId(item: string) {
  return `raw:${item}`;
}
function recipeId(recipeKey: string) {
  return `recipe:${recipeKey}`;
}

export function solve(data: GameData, input: SolveInput): Solution {
  const recipeNodes = new Map<string, RecipeNode>();
  const rawNodes = new Map<string, RawNode>();
  const edges: Solution['edges'] = [];
  const unresolved = new Set<string>();
  const cycleCuts = new Set<string>();

  const rawByItem: Record<string, number> = {};
  const machinesByBuilding: Record<string, number> = {};
  let totalPower = 0;

  // Track the recursion stack of items currently being expanded — used to detect cycles.
  const stack = new Set<string>();

  /**
   * Ensure a demand of `rate` items/min of `item` is satisfied. Returns the id of the
   * supplying node (raw or recipe) so the caller can wire up an edge.
   */
  function demand(item: string, rate: number, fromNodeId: string): void {
    if (rate <= 0) return;

    // Treat as raw input if: marked raw, is a game resource, or no producer exists.
    const treatAsRaw =
      input.pinnedRaw[item] ||
      data.rawItems.has(item) ||
      !data.producersByItem[item] ||
      data.producersByItem[item].length === 0;

    if (treatAsRaw) {
      const id = rawId(item);
      const existing = rawNodes.get(item);
      if (existing) existing.rate += rate;
      else rawNodes.set(item, { id, item, rate });
      rawByItem[item] = (rawByItem[item] ?? 0) + rate;
      edges.push({ source: id, target: fromNodeId, item, rate });
      if (!data.rawItems.has(item) && !input.pinnedRaw[item]) {
        unresolved.add(item);
      }
      return;
    }

    if (stack.has(item)) {
      // Cycle: treat as raw to break it.
      cycleCuts.add(item);
      const id = rawId(item);
      const existing = rawNodes.get(item);
      if (existing) existing.rate += rate;
      else rawNodes.set(item, { id, item, rate });
      rawByItem[item] = (rawByItem[item] ?? 0) + rate;
      edges.push({ source: id, target: fromNodeId, item, rate });
      return;
    }

    const recipeKey =
      input.recipeChoices[item] ?? pickDefaultRecipe(data, item, input.allowAlternates);
    if (!recipeKey) {
      unresolved.add(item);
      const id = rawId(item);
      rawNodes.set(item, { id, item, rate: (rawNodes.get(item)?.rate ?? 0) + rate });
      edges.push({ source: id, target: fromNodeId, item, rate });
      return;
    }

    const recipe = data.recipes[recipeKey];
    const product = recipe.products.find((p) => p.item === item);
    if (!product) {
      unresolved.add(item);
      return;
    }

    // items/min produced by ONE machine running this recipe = amount * (60 / time)
    const perMachine = product.amount * (60 / recipe.time);
    // The fraction of one machine we need to add for THIS demand alone.
    const addMachines = rate / perMachine;

    const nodeId = recipeId(recipeKey);
    let node = recipeNodes.get(recipeKey);
    const buildingKey = recipe.producedIn[0]; // first listed; usually only one

    if (!node) {
      node = {
        id: nodeId,
        recipeKey,
        recipe,
        machineCount: 0,
        power: 0,
        primaryOutputRate: 0,
        primaryOutputItem: item,
        inputs: recipe.ingredients.map((i) => ({ item: i.item, rate: 0 })),
        outputs: recipe.products.map((p) => ({ item: p.item, rate: 0 })),
        buildingKey,
      };
      recipeNodes.set(recipeKey, node);
    }

    // Wire the edge from this recipe (which makes `item`) to the consumer.
    edges.push({ source: nodeId, target: fromNodeId, item, rate });

    // First time we touch this recipe in this branch — recurse for ingredients
    // scaled to the *additional* machine count we're adding.
    stack.add(item);
    node.machineCount += addMachines;
    if (item === node.primaryOutputItem) {
      node.primaryOutputRate += rate;
    }
    // Recalculate inputs/outputs for the cumulative machineCount.
    node.inputs = recipe.ingredients.map((ing) => ({
      item: ing.item,
      rate: ing.amount * (60 / recipe.time) * node!.machineCount,
    }));
    node.outputs = recipe.products.map((p) => ({
      item: p.item,
      rate: p.amount * (60 / recipe.time) * node!.machineCount,
    }));

    // Recurse for the *added* ingredient demand only.
    for (const ing of recipe.ingredients) {
      const addedIngredientRate = ing.amount * (60 / recipe.time) * addMachines;
      demand(ing.item, addedIngredientRate, nodeId);
    }
    stack.delete(item);
  }

  demand(input.targetItem, input.targetRate, 'sink:final');

  // Compute power and machine totals from the final machine counts.
  for (const node of recipeNodes.values()) {
    const bld = data.buildings[node.buildingKey];
    const power = bld?.metadata.powerConsumption ?? 0;
    node.power = power * node.machineCount;
    totalPower += node.power;
    machinesByBuilding[node.buildingKey] =
      (machinesByBuilding[node.buildingKey] ?? 0) + node.machineCount;
  }

  return {
    recipeNodes,
    rawNodes,
    edges,
    unresolved,
    cycleCuts,
    totals: { rawByItem, machinesByBuilding, power: totalPower },
  };
}

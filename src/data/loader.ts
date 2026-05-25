import type { GameData, RawData } from '../types';

let cached: GameData | null = null;

export async function loadGameData(): Promise<GameData> {
  if (cached) return cached;
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`);
  if (!res.ok) throw new Error(`Failed to load data.json: ${res.status}`);
  const raw = (await res.json()) as RawData;

  const producersByItem: Record<string, string[]> = {};
  for (const [recipeKey, recipe] of Object.entries(raw.recipes)) {
    // Only consider recipes that actually run in a production machine.
    if (!recipe.inMachine || recipe.producedIn.length === 0) continue;
    for (const product of recipe.products) {
      (producersByItem[product.item] ||= []).push(recipeKey);
    }
  }

  // Prefer non-alternate recipes first in the producer list so defaults are sane.
  for (const list of Object.values(producersByItem)) {
    list.sort((a, b) => {
      const ra = raw.recipes[a];
      const rb = raw.recipes[b];
      if (ra.alternate !== rb.alternate) return ra.alternate ? 1 : -1;
      return ra.name.localeCompare(rb.name);
    });
  }

  const rawItems = new Set(Object.values(raw.resources).map((r) => r.item));

  // All items that appear as recipe IO — used to populate the picker.
  const seen = new Set<string>();
  for (const recipe of Object.values(raw.recipes)) {
    if (!recipe.inMachine) continue;
    for (const p of recipe.products) seen.add(p.item);
    for (const i of recipe.ingredients) seen.add(i.item);
  }
  const allItems = [...seen]
    .filter((cn) => raw.items[cn])
    .sort((a, b) => raw.items[a].name.localeCompare(raw.items[b].name));

  cached = {
    items: raw.items,
    recipes: raw.recipes,
    buildings: raw.buildings,
    resources: raw.resources,
    producersByItem,
    rawItems,
    allItems,
  };
  return cached;
}

// Shape of greeny/SatisfactoryTools data.json. Only the fields we use are typed.

export interface RawItem {
  slug: string;
  name: string;
  description: string;
  className: string;
  stackSize: number;
  energyValue: number;
  liquid: boolean;
  sinkPoints: number;
}

export interface RawRecipeIO {
  item: string;
  amount: number;
}

export interface RawRecipe {
  slug: string;
  name: string;
  className: string;
  alternate: boolean;
  time: number;
  inMachine: boolean;
  forBuilding: boolean;
  ingredients: RawRecipeIO[];
  products: RawRecipeIO[];
  producedIn: string[];
  isVariablePower: boolean;
  minPower: number;
  maxPower: number;
}

export interface RawBuilding {
  slug: string;
  name: string;
  className: string;
  metadata: {
    powerConsumption?: number;
    powerConsumptionExponent?: number;
    manufacturingSpeed?: number;
  };
}

export interface RawResource {
  item: string;
}

export interface RawData {
  items: Record<string, RawItem>;
  recipes: Record<string, RawRecipe>;
  buildings: Record<string, RawBuilding>;
  resources: Record<string, RawResource>;
}

// Indexed / normalized forms used by the app.

export interface GameData {
  items: Record<string, RawItem>;
  recipes: Record<string, RawRecipe>;
  buildings: Record<string, RawBuilding>;
  resources: Record<string, RawResource>;
  /** itemClassName -> list of recipe classNames that produce it (inMachine only) */
  producersByItem: Record<string, string[]>;
  /** className set of raw resources */
  rawItems: Set<string>;
  /** itemClassName -> Item, including synthesized entries for any missing */
  allItems: string[];
}

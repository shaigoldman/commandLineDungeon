import type { Game, Item } from "./types";
export const lootRarities = ["common", "uncommon", "rare", "ultrarare"] as const;
export type Rarity = typeof lootRarities[number] | "legendary";
/** Numeric values are accepted only when reading journeys saved before the four-tier system. */
export function normalizeRarity(value: Rarity | number): Rarity {
  return typeof value === "string" ? value : value > 10 ? "legendary" : value >= 9 ? "ultrarare" : value >= 6 ? "rare" : value >= 3 ? "uncommon" : "common";
}
export function rarityRank(value: Rarity | number) {
  return [...lootRarities, "legendary"].indexOf(normalizeRarity(value));
}
export function migrateItemRarities(g: Game) {
  const actors = [g.player, ...g.monsters];
  const items: Item[] = [...g.inventory, ...g.loot.map(l => l.item), ...(g.pendingLoot ? [g.pendingLoot] : []), ...(g.chests || []).map(c => c.reward),
    ...actors.flatMap(a => [...a.weapons, ...(a.inventory || []), ...(a.merchant?.stock.map(s => s.item) || [])])];
  for (const item of items) item.rarity = ["Awathons Broadsword", "EXP Pill", "Mystery Staff"].includes(item.name) ? "legendary" : normalizeRarity(item.rarity);
}

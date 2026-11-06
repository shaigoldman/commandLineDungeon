import type { Game, Item } from "./types";
export const lootRarities = ["common", "uncommon", "rare", "ultrarare"] as const;
export type Rarity = typeof lootRarities[number] | "legendary";
/** Numeric values are accepted only when reading journeys saved before the four-tier system. */
export function normalizeRarity(value: Rarity | number): Rarity {
  return typeof value === "string" ? value : value >= 9 ? "ultrarare" : value >= 6 ? "rare" : value >= 3 ? "uncommon" : "common";
}
export function rarityRank(value: Rarity | number) {
  return [...lootRarities, "legendary"].indexOf(normalizeRarity(value));
}
export function migrateItemRarities(g: Game) {
  const actors = [g.player, ...g.monsters];
  const items: Item[] = [...g.inventory, ...g.loot.map(l => l.item), ...(g.pendingLoot ? [g.pendingLoot] : []), ...(g.chests || []).map(c => c.reward),
    ...actors.flatMap(a => [...a.weapons, ...(a.inventory || []), ...(a.merchant?.stock.map(s => s.item) || [])])];
  for (const item of items) {
    if (item.kind === "blade-shard") item.description = "Restore all uses to one carried or equipped weapon or shield.";
    if (item.kind === "anvil") item.description = "Upgrade a carried or equipped weapon, shield, or staff.";
    if (item.name === "Really Greedy Amulet") {
      item.maxUses = 2;
      item.uses = Math.max(0, Math.min(2, item.uses ?? 2));
      item.description = `Trade all but 1 HP for 20 gold. ${item.uses} ${item.uses === 1 ? "use" : "uses"} remaining.`;
    }
    item.rarity = item.name === "Bomb" ? "uncommon" : ["Awathons Broadsword", "EXP Pill", "Mystery Staff"].includes(item.name) ? "legendary" : normalizeRarity(item.rarity);
  }
}

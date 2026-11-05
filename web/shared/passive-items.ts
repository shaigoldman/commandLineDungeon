import type { Actor, Item } from "./types";

export const gauntletDescriptions: Record<string, string> = {
  "golden-gauntlet": "While carried, +10 Attack at 0 mana. Works automatically; no use or equip action needed.",
  "silver-gauntlet": "While carried, +10 Attack and Speed at 5 HP or less. Works automatically; no use or equip action needed.",
};

const carriedPassives = new Set([
  "mana-link", "golden-apple", "diamond-apple", "thief-gloves", "mana-leech",
  "energy-belt", "energy-armor", "ghost-boots", "lucky-amulet", "lucky-necklace",
  "golden-gauntlet", "silver-gauntlet", "mana-battery", "immunity",
]);
export const isCarriedPassive = (item: Pick<Item, "kind">) => carriedPassives.has(item.kind);

/** The same condition drives combat and the item card's active/inactive indicator. */
export function gauntletBonus(actor: Pick<Actor, "hp" | "stats">, item: Pick<Item, "kind">) {
  if (!["golden-gauntlet", "silver-gauntlet"].includes(item.kind)) return undefined;
  const golden = item.kind === "golden-gauntlet";
  const active = golden ? actor.stats.Mana === 0 : actor.hp <= 5;
  return {
    active,
    attack: active ? 10 : 0,
    speed: active && !golden ? 10 : 0,
    requirement: golden ? "0 mana" : "5 HP or less",
    label: golden ? "+10 Attack" : "+10 Attack and Speed",
  };
}

import type { Game, Item } from "./types";

export type ItemOutcome = { title: string; detail: string; reward?: Item; revision: number };
/** Summarize actual state changes, including reusable items that have no use log. */
export function itemOutcome(before: Game, after: Game, item: Item, entries: string[]): ItemOutcome {
  const known = new Set([...before.inventory, ...before.player.weapons, ...before.loot.map((loot) => loot.item)].map((entry) => entry.id));
  const reward = [...after.inventory, ...after.loot.map((loot) => loot.item)].find((entry) => !known.has(entry.id) && entry.kind !== "gold");
  const changes: string[] = [];
  const delta = (label: string, amount: number) => {
    if (amount) changes.push(`${label} ${amount > 0 ? "+" : "−"}${Math.abs(Math.round(amount * 10) / 10)}`);
  };
  delta("HP", after.player.hp - before.player.hp);
  delta("MP", after.player.stats.Mana - before.player.stats.Mana);
  delta("Gold", (after.player.gold || 0) - (before.player.gold || 0));
  delta("EXP", after.xp - before.xp);
  delta("Stair Keys", after.keys - before.keys);
  delta("Hands", after.hands - before.hands);
  for (const stat of ["Health", "Power", "Speed", "Luck", "Accuracy", "Magic", "Armor"])
    delta(stat === "Power" ? "Strength" : stat, (after.player.stats[stat] || 0) - (before.player.stats[stat] || 0));
  if (!before.player.poisonImmune && after.player.poisonImmune) changes.push("Poison immunity gained");
  if ((after.stealthSteps || 0) > (before.stealthSteps || 0)) changes.push(`${after.stealthSteps} stealth steps`);
  for (const [effect, value] of Object.entries(after.player.effects))
    if (!before.player.effects[effect] && !["Poison", "Curse"].includes(effect))
      changes.push(`${effect} active${value[0] > 1 ? ` · ${value[0]} turns` : ""}`);
  const beforeEnemy = before.monsters.find((enemy) => enemy.id === before.combat);
  const afterEnemy = after.monsters.find((enemy) => enemy.id === before.combat);
  if (beforeEnemy && afterEnemy) delta(`${beforeEnemy.name} HP`, afterEnemy.hp - beforeEnemy.hp);
  const outcomeLog = entries.find((line) => !line.startsWith("Used ") && !line.startsWith("WEAPON BROKE:"));
  if (reward) changes.unshift(`Found ${reward.name}`);
  if (!changes.length && outcomeLog) changes.push(outcomeLog);
  const title = item.kind === "gold-chalice" && reward ? `${item.name} revealed ${reward.name}` : `${item.name} used`;
  return { title, detail: changes.join(" · ") || "Effect applied.", reward, revision: after.revision };
}

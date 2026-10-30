import { expect, it } from "vitest";
import { act, makeItem, newGame, pickItemDefinition, randomItem } from "../shared/engine";
import { itemDefinitions } from "../shared/catalog";
import { itemOutcome } from "../shared/item-outcome";

it("gives a seven-stat family one loot ticket before choosing its variant", () => {
  const g = newGame("Loot tester", "Scout", "Wind", 0, 418);
  for (const family of ["jewel", "crown", "double", "stat", "boost"]) {
    const choices = itemDefinitions.filter((d) => d[1] === family || d[0] === "Mana Rock");
    let familyDraws = 0;
    for (let n = 0; n < 4000; n++)
      if (pickItemDefinition(g, choices)[1] === family) familyDraws++;
    expect(familyDraws / 4000).toBeGreaterThan(0.45);
    expect(familyDraws / 4000).toBeLessThan(0.55);
  }
});

it("finds gold more often than any common item and keeps larger coins possible", () => {
  const g = newGame("Loot tester", "Scout", "Wind", 0, 612);
  const counts = new Map<string, number>();
  for (let n = 0; n < 5000; n++) {
    const item = randomItem(g, 0);
    counts.set(item.name, (counts.get(item.name) || 0) + 1);
  }
  const coins = [...counts].filter(([name]) => name.includes("Gold Coin"));
  const goldShare = coins.reduce((sum, [, count]) => sum + count, 0) / 5000;
  expect(goldShare).toBeGreaterThan(0.3);
  expect(goldShare).toBeLessThan(0.38);
  expect(counts.get("20 Gold Coins")).toBeGreaterThan(0);
  expect(counts.get("1 Gold Coin")).toBeGreaterThan(counts.get("5 Gold Coins") || 0);
  expect(itemDefinitions.find((d) => d[0] === "1 Gold Coin")?.[2]).toBe(0);
  expect(itemDefinitions.find((d) => d[0] === "20 Gold Coins")?.[2]).toBe(7);
});

it("reports exact changes for reusable trades and shows a chalice reward", () => {
  let g = newGame("Tester", "Mage", "Fire", 0, 320);
  g.monsters = []; g.traps = []; g.player.hp = g.player.stats.Health - 2; g.player.gold = 20;
  const pot = makeItem(g, "Health Pot"); g.inventory = [pot];
  let before = g; g = act(g, { type: "use", id: pot.id });
  const healed = itemOutcome(before, g, pot, []);
  expect(healed.detail).toContain("HP +1");
  expect(healed.detail).toContain("Gold −1");
  const chalice = makeItem(g, "Gold Chalice"); g.inventory.push(chalice);
  before = g; g = act(g, { type: "use", id: chalice.id });
  const result = itemOutcome(before, g, chalice, []);
  expect(result.reward?.id).toBeTruthy();
  expect(result.title).toContain(result.reward!.name);
  expect(result.detail).toContain("Gold −10");
  const star = makeItem(g, "Critical Star"); g.inventory.push(star);
  before = g; g = act(g, { type: "use", id: star.id });
  expect(itemOutcome(before, g, star, []).detail).toContain("Critical Star active");
});

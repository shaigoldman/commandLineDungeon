import { describe, it, expect } from "vitest";
import {
  newGame,
  makeItem,
  makeMonster,
  incomingDamage,
  attackInitiative,
  itemUseProblem,
  canUseFromFloor,
} from "../shared/engine";
import { itemArtKey } from "../src/item-art";
describe("attack order and item readiness", () => {
  it("gives ties to the player and accounts for quarter-weight initiative penalties", () => {
    const g = newGame("Shai", "Warrior", "Wind", 0, 91),
      m = makeMonster(g, "Zombie", 1);
    g.player.stats.Speed = 10;
    m.stats.Speed = 10;
    g.player.weapons = [];
    expect(incomingDamage(m, g.player).enemyFirst).toBe(false);
    const sword = makeItem(g, "Sword");
    sword.weight = 2;
    g.player.weapons = [sword];
    expect(attackInitiative(g.player)).toBe(9.5);
    expect(incomingDamage(m, g.player).enemyFirst).toBe(true);
  });
  it("recomputes the order after changing equipment without consuming effects", () => {
    const g = newGame("Shai", "Warrior", "Wind", 0, 91),
      m = makeMonster(g, "Zombie", 1);
    g.player.stats.Speed = 10;
    m.stats.Speed = 9;
    const sword = makeItem(g, "Sword");
    sword.weight = 8;
    g.player.weapons = [sword];
    g.player.effects["Speed Booster"] = [1, 50];
    expect(incomingDamage(m, g.player).enemyFirst).toBe(true);
    g.player.weapons = [];
    expect(incomingDamage(m, g.player).enemyFirst).toBe(false);
    expect(g.player.effects["Speed Booster"]).toEqual([1, 50]);
  });
  it("marks health and mana consumables unavailable when already full", () => {
    const g = newGame("Shai", "Mage", "Wind", 0, 91),
      heal = makeItem(g, "Small Health Potion"),
      mana = makeItem(g, "Mana Potion");
    expect(itemUseProblem(g, heal)).toBe("Health is already full.");
    expect(itemUseProblem(g, mana)).toBe("Mana is already full.");
    g.player.hp--;
    g.player.stats.Mana--;
    expect(itemUseProblem(g, heal)).toBeUndefined();
    expect(itemUseProblem(g, mana)).toBeUndefined();
  });
  it("makes antidotes ready only when poisoned and explains unresolved level choices", () => {
    const g = newGame("Shai", "Scout", "Wind", 0, 91),
      i = makeItem(g, "Poison Antidote");
    expect(itemUseProblem(g, i)).toBe("You have no poison or curse.");
    g.player.effects.Poison = [3, 1];
    expect(itemUseProblem(g, i)).toBeUndefined();
    g.pendingLevels = 1;
    expect(itemUseProblem(g, i)).toBe("Choose your level bonus first.");
  });
  it("keeps escape ropes and every targeted projectile out of floor use", () => {
    const g = newGame("Shai", "Scout", "Wind", 0, 91);
    for (const name of [
      "Escape Rope",
      "Throwing Knife",
      "Javelin",
      "Bomb",
      "Ballistic Missile",
    ])
      expect(canUseFromFloor(makeItem(g, name))).toBe(false);
  });
  it("uses distinct original item silhouettes and stable keys across floor/bag copies", () => {
    const g = newGame("Shai", "Scout", "Wind", 0, 91);
    const names = [
      "Escape Rope",
      "Throwing Knife",
      "Javelin",
      "Bomb",
      "Ballistic Missile",
      "Small Health Potion",
      "Mana Potion",
      "Sword",
      "Spear",
      "Axe",
    ];
    const keys = names.map((name) => itemArtKey(makeItem(g, name)));
    expect(new Set(keys).size).toBe(10); // Throwing javelins now have their own silhouette.
    const knife = makeItem(g, "Throwing Knife");
    expect(itemArtKey(knife)).toBe(itemArtKey(structuredClone(knife)));
  });
});

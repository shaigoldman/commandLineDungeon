import { describe, expect, it } from "vitest";
import { act, attackInitiative, combatAttackStats, itemUseProblem, makeItem, makeMonster, newGame, nextWeaponName } from "../shared/engine";

function base(seed = 97) {
  const g = newGame("Smith", "Warrior", "Wind", 0, seed);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  Object.assign(g.player, { x: 10, y: 7, hp: 10000 });
  Object.assign(g.player.stats, { Health: 10000, Accuracy: 1000, Speed: 100, Power: 15 });
  g.inventory = []; g.monsters = []; g.loot = []; g.pods = []; g.chests = []; g.secretDoors = [];
  g.player.weapons = [];
  return g;
}

describe("weapon relic playthroughs", () => {
  it("upgrades a chosen bag weapon by one material and restores its new full durability", () => {
    let g = base();
    const sword = makeItem(g, "Fragile Sword"), axe = makeItem(g, "Iron Axe"), anvil = makeItem(g, "Anvil");
    sword.uses = 1; g.inventory.push(sword, axe, anvil);
    expect(nextWeaponName(sword)).toBe("Iron Sword");
    expect(() => act(g, { type: "use", id: anvil.id, target: "missing" })).toThrow(/Choose an upgradeable/);
    g = act(g, { type: "use", id: anvil.id, target: sword.id });
    expect(g.inventory.find((i) => i.id === sword.id)).toMatchObject({ name: "Iron Sword", uses: 10, maxUses: 10 });
    expect(g.inventory.find((i) => i.id === axe.id)?.name).toBe("Iron Axe");
    expect(g.inventory.some((i) => i.id === anvil.id)).toBe(false);
    expect(nextWeaponName(makeItem(g, "Obsidian Sword"))).toBeUndefined();
  });

  it("uses Blade Shard only on a worn unequipped bag weapon", () => {
    let g = base();
    const sword = makeItem(g, "Steel Sword"), shard = makeItem(g, "Blade Shard");
    sword.uses = 2; g.inventory.push(sword, shard);
    expect(() => act(g, { type: "use", id: shard.id, target: "missing" })).toThrow(/Choose a worn/);
    g = act(g, { type: "use", id: shard.id, target: sword.id });
    expect(g.inventory.find((i) => i.id === sword.id)?.uses).toBe(sword.maxUses);
    expect(g.inventory.some((i) => i.id === shard.id)).toBe(false);
    const more = makeItem(g, "Blade Shard"); g.inventory.push(more);
    expect(itemUseProblem(g, more)).toMatch(/worn/);
  });

  it("doubles the weapon bonus and removes weight penalties while passives are carried", () => {
    let g = base();
    const sword = makeItem(g, "Steel Sword"); g.player.weapons = [sword];
    const normal = combatAttackStats(g.player), initiative = attackInitiative(g.player);
    const stone = makeItem(g, "Sharpening Stone"), book = makeItem(g, "Skill Book");
    g.inventory.push(stone, book); g = act(g, { type: "wait" });
    const enhanced = combatAttackStats(g.player);
    expect(enhanced.Attack - normal.Attack).toBe(sword.attack);
    expect(enhanced.Speed).toBe(g.player.stats.Speed);
    expect(enhanced.Accuracy).toBe(g.player.stats.Accuracy);
    expect(attackInitiative(g.player)).toBe(g.player.stats.Speed);
    expect(attackInitiative(g.player)).toBeGreaterThan(initiative);
    g = act(g, { type: "drop", id: stone.id });
    g = act(g, { type: "drop", id: book.id });
    expect(combatAttackStats(g.player)).toEqual(normal);
  });

  it("spends durability on each attack, announces a break, and applies the stronger of two grips", () => {
    const attacks = (grips: string[]) => {
      let g = base(121);
      const sword = makeItem(g, "Iron Sword"); sword.uses = sword.maxUses = 200;
      g.player.weapons = [sword];
      for (const name of grips) g.inventory.push(makeItem(g, name));
      const enemy = makeMonster(g, "Zombie", 1);
      Object.assign(enemy, { x: 11, y: 7, hp: 100000 });
      Object.assign(enemy.stats, { Health: 100000, Power: 0, Accuracy: 0, Speed: 0 });
      g.monsters = [enemy]; g.combat = enemy.id;
      for (let n = 0; n < 100; n++) g = act(g, { type: "attack" });
      return 200 - g.player.weapons[0].uses!;
    };
    expect(attacks([])).toBe(100);
    expect(attacks(["Gentle Grip"])).toBeGreaterThan(35);
    expect(attacks(["Gentle Grip"])).toBeLessThan(65);
    expect(attacks(["Really Gentle Grip"])).toBeLessThan(35);
    expect(attacks(["Gentle Grip", "Really Gentle Grip"])).toBeLessThan(35);

    let g = base();
    const sword = makeItem(g, "Fragile Sword"); sword.uses = 1; g.player.weapons = [sword];
    const enemy = makeMonster(g, "Zombie", 1); Object.assign(enemy, { x: 11, y: 7, hp: 100 }); enemy.stats.Health = 100;
    g.monsters = [enemy]; g.combat = enemy.id;
    g = act(g, { type: "attack" });
    expect(g.player.weapons).toHaveLength(0);
    expect(g.log.some((line) => line.includes("WEAPON BROKE: Fragile Sword"))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { act, armorOf, combatAttackStats, generateFloor, itemUseProblem, makeItem, makeMonster, newGame, randomItem } from "../shared/engine";
import { itemDefinitions } from "../shared/catalog";
import type { Trap } from "../shared/types";
import { loreOptions } from "../shared/item-lore";

function base(seed = 813) {
  const g = newGame("Relic tester", "Warrior", "Fire", 0, seed);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  Object.assign(g.player, { x: 10, y: 7, hp: 100 });
  Object.assign(g.player.stats, { Health: 100, Power: 30, Magic: 30, Mana: 10, Speed: 30 });
  g.inventory = []; g.player.weapons = []; g.monsters = []; g.loot = []; g.pods = []; g.chests = []; g.secretDoors = []; g.traps = [];
  g.capacity = 50;
  return g;
}
function trap(kind: Trap["kind"]): Trap { return { id: `trap-${kind}`, x: 11, y: 7, kind, revealed: false }; }

describe("new relic and trap playthroughs", () => {
  it("leaves a full-health energy pod in place and reports why it had no effect", () => {
    let g = base();
    g.pods = [{ x: 11, y: 7, max: false }];
    g = act(g, { type: "move", dx: 1, dy: 0 });
    expect(g.pods).toHaveLength(1);
    expect(g.log.at(-1)).toContain("ENERGY FULL:");
    expect(g.player.hp).toBe(100);
  });
  it("charges jewels and crowns their rolled gold price for the chosen permanent stat", () => {
    let g = base(); g.player.gold = 20;
    const jewel = makeItem(g, "Strength Jewel"), crown = makeItem(g, "Luck Crown");
    expect(jewel.value).toBeGreaterThanOrEqual(1); expect(jewel.value).toBeLessThanOrEqual(5);
    expect(crown.value).toBeGreaterThanOrEqual(5); expect(crown.value).toBeLessThanOrEqual(10);
    const power = g.player.stats.Power, luck = g.player.stats.Luck;
    g.inventory.push(jewel, crown);
    g = act(g, { type: "use", id: jewel.id });
    expect([g.player.gold, g.player.stats.Power]).toEqual([15, power + jewel.value]);
    g = act(g, { type: "use", id: crown.id });
    expect([g.player.gold, g.player.stats.Luck]).toEqual([5, luck + crown.value]);
  });

  it("doubles uses past usual maximum and doubles exactly five EXP gains", () => {
    let g = base();
    const sword = makeItem(g, "Iron Sword"), scabbard = makeItem(g, "Magic Scabbard"), candy = makeItem(g, "Hard Candy");
    sword.uses = sword.maxUses = 10; g.inventory.push(sword, scabbard, candy);
    g = act(g, { type: "use", id: scabbard.id, target: sword.id });
    expect(g.inventory.find((item) => item.id === sword.id)?.uses).toBe(20);
    expect(g.inventory.find((item) => item.id === sword.id)?.maxUses).toBe(10);
    g = act(g, { type: "use", id: candy.id });
    expect(g.expDoubles).toBe(5);
    for (let n = 0; n < 5; n++) {
      const sweet = makeItem(g, "Candy"); g.inventory.push(sweet);
      const before = g.xp;
      g = act(g, { type: "use", id: sweet.id });
      if (g.pendingLevels) g = act(g, { type: "level", stat: "Power" });
      expect(g.xp >= before || g.player.level > 1).toBe(true);
    }
    expect(g.expDoubles).toBe(0);
  });

  it("handcuffs remove Strength and reusable gold relics enforce their costs", () => {
    let g = base();
    const cuffs = makeItem(g, "Handcuffs"), greedy = makeItem(g, "Greedy Amulet"), worse = makeItem(g, "Really Greedy Amulet"), channel = makeItem(g, "Mana Channel");
    const m = makeMonster(g, "Zombie", 1); Object.assign(m, { x: 11, y: 7, hp: 100 }); m.stats.Health = 100;
    g.monsters = [m]; g.combat = m.id; g.inventory.push(cuffs, greedy, worse, channel);
    const power = m.stats.Power;
    g = act(g, { type: "use", id: cuffs.id });
    expect(g.monsters[0].stats.Power).toBe(Math.max(0, power - 10));
    g.combat = undefined; g.monsters = [];
    g = act(g, { type: "use", id: greedy.id });
    expect([g.player.hp, g.player.gold]).toEqual([90, 5]);
    g = act(g, { type: "use", id: worse.id });
    expect([g.player.hp, g.player.gold]).toEqual([1, 25]);
    g = act(g, { type: "use", id: channel.id });
    expect([g.player.stats.Mana, g.player.gold]).toEqual([0, 35]);
  });

  it("alchemy book and wand make higher rarity or trash, chalice makes rare loot, and magic wand makes a chosen staff", () => {
    let g = base(); g.player.gold = 100;
    const source = makeItem(g, "Mana Potion"), book = makeItem(g, "Alchemy Book");
    g.inventory.push(source, book);
    g = act(g, { type: "use", id: book.id, target: source.id });
    const changed = g.inventory.find((item) => item.id === source.id)!;
    expect(changed.kind === "trash" || changed.rarity >= 3).toBe(true);
    const wand = makeItem(g, "Alchemy Wand"), second = makeItem(g, "Tiny Health Potion");
    g.inventory.push(wand, second);
    const before = g.player.gold!;
    g = act(g, { type: "use", id: wand.id });
    expect(g.player.gold).toBeLessThan(before);
    expect(g.inventory.find((item) => item.id === second.id)!.kind === "trash" || g.inventory.find((item) => item.id === second.id)!.rarity >= 3).toBe(true);
    const chalice = makeItem(g, "Gold Chalice"); g.inventory.push(chalice);
    g = act(g, { type: "use", id: chalice.id });
    expect(g.inventory.some((item) => item.rarity >= 6 && item.rarity < 9)).toBe(true);
    const magicWand = makeItem(g, "Magic Wand"), target = makeItem(g, "Mana Potion");
    g.inventory.push(magicWand, target);
    g = act(g, { type: "use", id: magicWand.id, target: target.id, spell: "Water" });
    expect(g.inventory.find((item) => item.id === target.id)).toMatchObject({ name: "Water Staff", kind: "tome" });
  });

  it("alchemy sometimes misfires and sometimes skips more than one rarity tier", () => {
    let misfires = 0, leaps = 0;
    for (let seed = 1; seed <= 150; seed++) {
      let g = base(seed); g.player.gold = 5;
      const source = makeItem(g, "Mana Potion"), book = makeItem(g, "Alchemy Book");
      g.inventory = [source, book];
      g = act(g, { type: "use", id: book.id, target: source.id });
      const result = g.inventory.find((item) => item.id === source.id)!;
      if (result.kind === "trash") misfires++;
      else if (result.rarity >= 6) leaps++;
      else expect(result.rarity).toBeGreaterThanOrEqual(3);
    }
    expect(misfires).toBeGreaterThan(0);
    expect(leaps).toBeGreaterThan(0);
  });

  it("turns a chosen energy pod into floor loot and casts accessible Fire gold magic", () => {
    let g = base(); const harness = makeItem(g, "Energy Harness"); g.inventory.push(harness);
    g.pods = [{ x: 11, y: 7, max: false }];
    g = act(g, { type: "use", id: harness.id, target: "11,7" });
    expect(g.pods).toHaveLength(0);
    expect(g.loot.some((loot) => loot.x === 11 && loot.y === 7)).toBe(true);
    const staff = makeItem(g, "Fire Staff"); g.inventory.push(staff);
    g = act(g, { type: "use", id: staff.id });
    const before = g.player.gold || 0;
    g = act(g, { type: "cast", spell: "Gild" });
    expect(g.player.gold).toBeGreaterThan(before);
    expect(g.player.stats.Mana).toBe(6);
  });

  it("only converts cardinally adjacent energy pods, even when a distant pod is chosen directly", () => {
    const g = base(); const harness = makeItem(g, "Energy Harness"); g.inventory.push(harness);
    g.pods = [{ x: 12, y: 7, max: false }, { x: 11, y: 8, max: true }];
    expect(itemUseProblem(g, harness)).toContain("Stand beside");
    expect(() => act(g, { type: "use", id: harness.id, target: "12,7" })).toThrow();
    expect(() => act(g, { type: "use", id: harness.id, target: "11,8" })).toThrow();
    g.pods.push({ x: 11, y: 7, max: false });
    expect(itemUseProblem(g, harness)).toBeUndefined();
    expect(() => act(g, { type: "use", id: harness.id, target: "12,7" })).toThrow("adjacent");
    expect(g.pods).toHaveLength(3);
  });

  it("shields absorb direct attacks and spend blocks, not attacks", () => {
    let g = base();
    const shield = makeItem(g, "Iron Shield"); shield.uses = shield.maxUses = 3;
    expect(shield.armorBonus).toBeGreaterThanOrEqual(10);
    g.player.weapons = [shield];
    expect(armorOf(g.player)).toBe(shield.armorBonus);
    expect(combatAttackStats(g.player).Attack).toBeLessThan(g.player.stats.Power);
    const enemy = makeMonster(g, "Zombie", 1);
    Object.assign(enemy, { x: 11, y: 7, hp: 10000 });
    Object.assign(enemy.stats, { Health: 10000, Accuracy: 1000, Power: 10, Speed: 0 });
    g.monsters = [enemy]; g.combat = enemy.id;
    g = act(g, { type: "attack" });
    expect(g.player.weapons[0].uses).toBe(2);
    expect(g.player.hp).toBe(100);
    g = act(g, { type: "attack" });
    g = act(g, { type: "attack" });
    expect(g.player.weapons).toHaveLength(0);
    expect(g.log.some((line) => line.includes("WEAPON BROKE: Iron Shield"))).toBe(true);
  });

  it("reveals reusable traps, removes monster traps, and scales their count by floor", () => {
    for (const kind of ["poison", "curse", "rust", "trip", "fairy", "sap", "monster"] as const) {
      let g = base(); g.traps = [trap(kind)]; g.player.gold = 20;
      g.inventory = [makeItem(g, "Mana Potion")];
      g.player.weapons = [makeItem(g, "Iron Sword")];
      const before = { ...g.player.stats };
      g = act(g, { type: "move", dx: 1, dy: 0 });
      if (kind === "monster") { expect(g.traps).toHaveLength(0); expect(g.monsters.length).toBeGreaterThan(0); }
      else expect(g.traps?.[0].revealed).toBe(true);
      if (kind === "poison") expect(g.player.effects.Poison).toBeTruthy();
      if (kind === "curse") expect(g.player.effects.Curse).toBeTruthy();
      if (kind === "rust") expect(g.player.weapons).toHaveLength(0);
      if (kind === "trip") { expect(g.inventory).toHaveLength(0); expect(g.loot).toHaveLength(0); }
      if (kind === "fairy") expect(g.player.gold).toBeLessThan(20);
      if (kind === "sap") expect(Object.keys(before).some((key) => g.player.stats[key] < before[key])).toBe(true);
      expect(g.log.some((line) => line.startsWith("TRAP:"))).toBe(true);
    }
    for (let seed = 1; seed <= 50; seed++) {
      const early = newGame("A", "Warrior", "Wind", 0, seed);
      expect(early.traps!.length).toBeLessThanOrEqual(2);
      const later = base(seed); later.floor = 12;
      // Generate by ascending an existing journey.
      generateFloor(later);
      expect(later.traps!.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("leaves ordinary traps visible and active on later visits", () => {
    let g = base(211);
    g.traps = [trap("fairy")]; g.player.gold = 40;
    g = act(g, { type: "move", dx: 1, dy: 0 });
    const afterFirst = g.player.gold!;
    expect(g.traps![0].revealed).toBe(true);
    g = act(g, { type: "move", dx: -1, dy: 0 });
    g = act(g, { type: "move", dx: 1, dy: 0 });
    expect(g.traps![0].revealed).toBe(true);
    expect(g.player.gold).toBeLessThan(afterFirst);
  });

  it("weights chest keys more often and keeps item lore deliberately mysterious", () => {
    const g = base(); let keys = 0;
    for (let n = 0; n < 1000; n++) if (randomItem(g).kind === "key") keys++;
    expect(keys).toBeGreaterThan(15);
    expect(itemDefinitions.some((entry) => entry[0] === "Shield")).toBe(true);
    for (const [name] of itemDefinitions)
      expect(loreOptions(makeItem(g, name)).join(" ")).not.toMatch(/apocalypse|Ashfall/i);
  });
});

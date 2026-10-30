import { describe, expect, it } from "vitest";
import { act, availableSpells, capacityOf, itemUseProblem, makeItem, makeMonster, newGame, spellCost } from "../shared/engine";
import { itemDefinitions, spells } from "../shared/catalog";

function start() {
  const g = newGame("Tester", "Mage", "Fire", 0, 140);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  Object.assign(g.player, { x: 10, y: 7, hp: 100 });
  Object.assign(g.player.stats, { Health: 100, Magic: 90, Power: 15, Mana: 5 });
  g.monsters = []; g.loot = []; g.pods = []; g.chests = []; g.secretDoors = [];
  g.inventory = []; g.capacity = 25;
  return g;
}

describe("new item playthroughs", () => {
  it("rolls charged items, charms and the added rarity catalog", () => {
    const g = start();
    for (const [name] of itemDefinitions) expect(makeItem(g, name).kind).not.toBe("trash");
    for (const name of ["Reusable Key", "Reusable Door Key", "Reusable Tiny Potion", "Reusable Medium Potion", "Energy Generator", "Summoner Stone"])
      for (let n = 0; n < 30; n++) expect(makeItem(g, name).uses).toBeGreaterThanOrEqual(1);
    for (let n = 0; n < 50; n++) {
      const charm = makeItem(g, "Mystic Charm");
      expect(charm.value).toBeGreaterThanOrEqual(1);
      expect(charm.value).toBeLessThanOrEqual(5);
      expect(charm.stat).toBeTruthy();
    }
  });

  it("applies carried passives, frees capacity and restores stats when dropped", () => {
    let g = start();
    const charm = makeItem(g, "Mystic Charm");
    const before = g.player.stats[charm.stat!] || 0;
    g.inventory.push(charm, makeItem(g, "Infinite Bag"), makeItem(g, "Mana Gem"), makeItem(g, "Mana Diamond"));
    g.capacity = 1;
    g = act(g, { type: "wait" });
    expect(g.player.stats[charm.stat!]).toBe(before + charm.value);
    expect(capacityOf(g)).toBe(Infinity);
    expect(spellCost(g, spells.find((s) => s.name === "Light")!)).toBe(0);
    g = act(g, { type: "drop", id: charm.id });
    expect(g.player.stats[charm.stat!]).toBe(before);
  });

  it("casts Mana Expansion and spends a Mana Star without spending mana", () => {
    let g = start();
    g.player.stats.Mana = 10;
    g = act(g, { type: "cast", spell: "Mana Expansion" });
    expect(g.player.maxMana).toBe(12);
    expect(g.player.stats.Mana).toBe(2);
    const star = makeItem(g, "Double Mana Star");
    g.inventory.push(star);
    expect(availableSpells(g, { free: true }).some((s) => s.name === "Light")).toBe(true);
    g = act(g, { type: "use", id: star.id, spell: "Light" });
    expect(g.player.stats.Mana).toBe(2);
    expect(g.inventory.find((i) => i.id === star.id)?.uses).toBe(1);
    g = act(g, { type: "use", id: star.id, spell: "Light" });
    expect(g.inventory.find((i) => i.id === star.id)).toBeUndefined();
  });

  it("uses charged potions in succession and trades mana for health with Mana Rock", () => {
    let g = start();
    const potion = makeItem(g, "Reusable Tiny Potion"); potion.uses = potion.maxUses = 3;
    const rock = makeItem(g, "Mana Rock");
    g.inventory.push(potion, rock);
    g.player.hp = 60;
    for (let n = 2; n >= 0; n--) {
      g = act(g, { type: "use", id: potion.id });
      expect(g.inventory.find((i) => i.id === potion.id)?.uses).toBe(n || undefined);
    }
    const hp = g.player.hp, mana = g.player.stats.Mana;
    g = act(g, { type: "use", id: rock.id });
    expect(g.player.hp).toBe(hp + 1);
    expect(g.player.stats.Mana).toBe(mana - 1);
    expect(g.inventory.some((i) => i.id === rock.id)).toBe(true);
    g.player.hp = g.player.stats.Health;
    expect(itemUseProblem(g, rock)).toContain("room to heal");
    g.player.hp--;
    g.player.stats.Mana = 0;
    expect(itemUseProblem(g, rock)).toContain("at least 1 mana");
  });

  it("turns an enemy into a peaceful villager and keeps the ultra stairfinder", () => {
    let g = start();
    const enemy = makeMonster(g, "Zombie", 1); Object.assign(enemy, { x: 11, y: 7 });
    g.monsters = [enemy]; g.combat = enemy.id;
    const cleanser = makeItem(g, "Cleanser"); g.inventory.push(cleanser);
    g = act(g, { type: "use", id: cleanser.id });
    expect(g.monsters[0].merchant || g.monsters[0].npc).toBeTruthy();
    expect(g.combat).toBeUndefined();
    const finder = makeItem(g, "Ultrastairfinder"); g.inventory.push(finder);
    g.stairs = { x: 20, y: 7, locked: false };
    g = act(g, { type: "use", id: finder.id });
    expect(g.inventory.some((i) => i.id === finder.id)).toBe(true);
    expect(Math.abs(g.player.x - g.stairs.x) + Math.abs(g.player.y - g.stairs.y)).toBeLessThanOrEqual(2);
  });

  it("trades gold or life with reusable relics and chooses a Spiked Potion stat", () => {
    let g = start();
    g.player.gold = 3; g.player.hp = 40;
    const pot = makeItem(g, "Health Pot"), drain = makeItem(g, "Health Drain"), spike = makeItem(g, "Spiked Potion");
    g.inventory.push(pot, drain, spike);
    g = act(g, { type: "use", id: pot.id });
    expect([g.player.gold, g.player.hp]).toEqual([2, 41]);
    g = act(g, { type: "use", id: drain.id });
    expect([g.player.hp, g.player.stats.Mana]).toEqual([40, 6]);
    g = act(g, { type: "use", id: spike.id, spell: "Armor" });
    expect(g.player.hp).toBe(20);
    expect(g.player.stats.Armor).toBe(5);
    expect(g.inventory.some((i) => i.id === spike.id)).toBe(false);
    expect(g.inventory.some((i) => i.id === pot.id || i.id === drain.id)).toBe(true);
  });

  it("consumes a Critical Star only on a landed hit and Speedy Boots on the next enemy attack", () => {
    let g = start();
    const star = makeItem(g, "Critical Star"), boots = makeItem(g, "Speedy Boots");
    g.inventory.push(star, boots);
    g = act(g, { type: "use", id: star.id });
    g = act(g, { type: "use", id: boots.id });
    expect(g.player.effects["Critical Star"]).toBeTruthy();
    expect(g.player.effects["Speedy Boots"]).toBeTruthy();
    const enemy = makeMonster(g, "Zombie", 1); Object.assign(enemy, { x: 11, y: 7, hp: 500 }); enemy.stats.Health = 500;
    g.monsters = [enemy]; g.combat = enemy.id;
    g.player.stats.Accuracy = 1000; g.player.stats.Speed = 1000;
    g = act(g, { type: "attack" });
    expect(g.player.effects["Critical Star"]).toBeUndefined();
    expect(g.log.some((line) => line.includes("Critical hit"))).toBe(true);
    expect(g.player.effects["Speedy Boots"]).toBeUndefined();
  });

  it("cursed candy and potion apply their rewards and a curse; cursed gold collects on touch", () => {
    let g = start();
    const candy = makeItem(g, "Cursed Candy"), potion = makeItem(g, "Cursed Potion");
    g.inventory.push(candy, potion);
    const level = g.player.level;
    g = act(g, { type: "use", id: candy.id });
    expect(g.player.level).toBe(level + 1);
    expect(g.player.effects.Curse).toBeTruthy();
    g = act(g, { type: "level", stat: "Power" });
    g.player.hp = 5;
    g = act(g, { type: "use", id: potion.id });
    expect(g.player.hp).toBe(g.player.stats.Health);
    g.player.effects = {};
    const cursedGold = makeItem(g, "Cursed Gold");
    g.loot.push({ x: 11, y: 7, item: cursedGold });
    const coins = g.player.gold || 0;
    g = act(g, { type: "move", dx: 1, dy: 0 });
    expect(g.player.gold).toBe(coins + 10);
    expect(g.player.effects.Curse).toBeTruthy();
    expect(g.loot.some((l) => l.item.id === cursedGold.id)).toBe(false);
    expect(g.log.some((line) => line.startsWith("CURSED:"))).toBe(true);
  });
});

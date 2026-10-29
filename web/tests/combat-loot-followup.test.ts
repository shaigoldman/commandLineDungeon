import { it, expect } from "vitest";
import {
  act,
  newGame,
  makeItem,
  makeMonster,
  combatAttackStats,
} from "../shared/engine";
import {
  criticalChance,
  retaliationRisk,
  outgoingDamage,
  combatBreakdown,
} from "../shared/presentation";
function arena() {
  const g = newGame("Followup", "Scout", "Wind", 0, 42);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  Object.assign(g.player, { x: 15, y: 7, hp: 5 });
  Object.assign(g.player.stats, {
    Health: 20,
    Power: 20,
    Accuracy: 1000,
    Speed: 100,
    Luck: 0,
  });
  g.player.weapons = [];
  g.inventory = [];
  g.monsters = [];
  g.loot = [];
  g.chests = [];
  g.secretDoors = [];
  g.pods = [];
  const m = makeMonster(g, "Zombie", 1);
  Object.assign(m, { x: 16, y: 7, hp: 5 });
  Object.assign(m.stats, {
    Health: 5,
    Power: 100,
    Speed: 1,
    Armor: 0,
    Luck: 0,
  });
  g.monsters = [m];
  return g;
}
it("guaranteed first-strike kills suppress a misleading lethal retaliation warning", () => {
  const g = arena();
  expect(outgoingDamage(g.player, g.monsters[0]).hit).toBe(100);
  expect(retaliationRisk(g.player, g.monsters[0]).safeKill).toBe(true);
  expect(retaliationRisk(g.player, g.monsters[0]).warning).toBeUndefined();
});
it("a possible miss qualifies the lethal warning, and enemy-first hits still warn", () => {
  const g = arena();
  g.player.stats.Accuracy = 0;
  g.player.stats.Speed = 2;
  expect(retaliationRisk(g.player, g.monsters[0]).warning).toContain(
    "if you miss",
  );
  g.monsters[0].stats.Speed = 100;
  expect(retaliationRisk(g.player, g.monsters[0]).warning).toContain(
    "they act first",
  );
});
it("critical chance follows the two-roll product formula and its cap, not raw Luck percent", () => {
  expect(criticalChance(0)).toBe(0);
  expect(criticalChance(35)).toBeCloseTo(6.999111, 4);
  expect(criticalChance(70)).toBeCloseTo(33.880816, 4);
  expect(criticalChance(9001)).toBe(criticalChance(70));
});
it("hit estimates count landed normal hits, respect armor, and handle zero damage", () => {
  const g = arena();
  g.monsters[0].hp = 41;
  expect(outgoingDamage(g.player, g.monsters[0]).hitsToKill).toBe(3);
  g.monsters[0].stats.Armor = 30;
  expect(outgoingDamage(g.player, g.monsters[0]).hitsToKill).toBeNull();
});
it("base, temporary boosts and gear adjustments sum exactly to displayed combat totals", () => {
  const g = arena();
  g.player.weapons = [makeItem(g, "Iron Sword")];
  g.player.effects["Attack Booster"] = [2, 20];
  for (const row of combatBreakdown(g.player)) {
    expect(row.base + row.effects + row.gear).toBeCloseTo(row.now);
    expect(row.now).toBeCloseTo(combatAttackStats(g.player)[row.stat]);
  }
  expect(
    combatBreakdown(g.player).find((r) => r.stat === "Accuracy")!.gear,
  ).toBe(-4);
});
it("moving from loot leaves the entire pile and takes one normal move, including stairs", () => {
  for (const stairs of [false, true]) {
    let g = arena();
    g.monsters = [];
    g.player.hp = 20;
    const a = makeItem(g, "Rare Key"),
      b = makeItem(g, "Candy");
    g.loot = [
      { x: 15, y: 7, item: a },
      { x: 15, y: 7, item: b },
    ];
    g.pendingLoot = a;
    if (stairs) Object.assign(g.stairs, { x: 15, y: 7, locked: false });
    g = act(g, { type: "move", dx: 1, dy: 0 });
    expect(g.player.x).toBe(16);
    expect(g.pendingLoot).toBeUndefined();
    expect(g.loot.map((l) => l.item.id)).toEqual([a.id, b.id]);
    expect(g.turn).toBe(1);
  }
});
it("a selected item from a pile can be collected without collecting the first item", () => {
  let g = arena();
  const a = makeItem(g, "Rare Key"),
    b = makeItem(g, "Candy");
  g.loot = [
    { x: 15, y: 7, item: a },
    { x: 15, y: 7, item: b },
  ];
  g.pendingLoot = a;
  g = act(g, { type: "pickup", id: b.id });
  expect(g.inventory.map((i) => i.id)).toEqual([b.id]);
  expect(g.loot.map((l) => l.item.id)).toEqual([a.id]);
});
it("stairs can be used while loot inspection is pending without consuming or collecting it", () => {
  let g = arena();
  g.monsters = [];
  Object.assign(g.stairs, { x: 15, y: 7, locked: false });
  const a = makeItem(g, "Rare Key");
  g.pendingLoot = a;
  g.loot = [{ x: 15, y: 7, item: a }];
  g = act(g, { type: "ascend" });
  expect(g.floor).toBe(1);
  expect(g.inventory.some((i) => i.id === a.id)).toBe(false);
  expect(g.pendingLoot).toBeUndefined();
});
it("temporary effect expiry is included in hit forecasts without consuming real effects", () => {
  const g = arena();
  g.player.stats.Accuracy = 50;
  g.player.stats.Speed = 2;
  g.player.effects["Accuracy Booster"] = [1, 100];
  const before = structuredClone(g);
  expect(outgoingDamage(g.player, g.monsters[0]).hit).toBeCloseTo(50.8);
  expect(g).toEqual(before);
});
import { chancePercent } from "../shared/presentation";
it("percentage formatting never rounds a possible miss up to a guaranteed 100 percent", () => {
  expect(chancePercent(99.999)).toBe("99.9%");
  expect(chancePercent(100)).toBe("100%");
  expect(chancePercent(0.005)).toBe("<0.1%");
});
it("staff attack-mode changes are included in gear adjustments from unarmed base Power", () => {
  const g = arena();
  g.player.stats.Power = 20;
  g.player.stats.Magic = 30;
  g.player.stats.Mana = 10;
  g.player.weapons = [makeItem(g, "Wind Staff")];
  const attack = combatBreakdown(g.player).find(
    (row) => row.stat === "Attack",
  )!;
  expect(attack).toMatchObject({ base: 20, effects: 0, gear: 10, now: 30 });
});

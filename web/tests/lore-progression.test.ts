import { it, expect } from "vitest";
import {
  act,
  newGame,
  makeItem,
  combatAttackStats,
  floorEquipPlan,
} from "../shared/engine";
import {
  equipmentComparison,
  placeCombatLabel,
  type LabelBox,
} from "../shared/presentation";
import { itemLore, loreOptions, rarityInfo } from "../shared/item-lore";
import { itemDefinitions } from "../shared/catalog";
function base(seed = 1) {
  const g = newGame("Lore tester", "Warrior", "Wind", 0, seed);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  Object.assign(g.player, { x: 15, y: 7, hp: 100 });
  Object.assign(g.player.stats, {
    Health: 100,
    Power: 9001,
    Accuracy: 9001,
    Speed: 9001,
    Armor: 9001,
  });
  g.monsters = [];
  g.loot = [];
  g.pods = [];
  g.chests = [];
  g.secretDoors = [];
  g.inventory = [];
  g.capacity = 100;
  return g;
}
it("every item has three authored, stable lore choices and a colored rarity band", () => {
  const g = base();
  for (const d of itemDefinitions) {
    const i = makeItem(g, d[0]);
    expect(loreOptions(i)).toHaveLength(3);
    expect(new Set(loreOptions(i)).size).toBe(3);
    expect(itemLore(JSON.parse(JSON.stringify(i)))).toBe(itemLore(i));
  }
  expect([1, 4, 7, 10].map((r) => rarityInfo(r).name)).toEqual([
    "Common",
    "Uncommon",
    "Rare",
    "Ultrarare",
  ]);
});
for (const [name, xp] of [
  ["Candy", 10],
  ["Rare Candy", 35],
  ["Ultra Candy", 100],
] as const)
  it(`${name} grants its EXP and level choice`, () => {
    let g = base();
    const i = makeItem(g, name);
    g.inventory.push(i);
    g = act(g, { type: "use", id: i.id });
    if (xp === 100) {
      expect(g.player.level).toBe(2);
      expect(g.pendingLevels).toBe(1);
      g = act(g, { type: "level", stat: "Power" });
      expect(g.pendingLevels).toBe(0);
    } else expect(g.xp).toBe(xp);
    expect(g.inventory.some((a) => a.id === i.id)).toBe(false);
  });
it("one hand applies to staves too; preview matches replacement, Extra Hand permits two", () => {
  let g = base();
  g.player.stats.Power = 20;
  g.player.stats.Magic = 30;
  const sword = makeItem(g, "Iron Sword"),
    staff = makeItem(g, "Fire Staff");
  g.player.weapons = [sword];
  g.inventory = [staff];
  const preview = equipmentComparison(g, staff);
  expect(preview.replaced?.id).toBe(sword.id);
  g = act(g, { type: "use", id: staff.id });
  expect(g.player.weapons.map((i) => i.id)).toEqual([staff.id]);
  expect(g.inventory.map((i) => i.id)).toContain(sword.id);
  expect(preview.rows.find((r) => r.name === "Attack")!.after).toBe(
    combatAttackStats(g.player).Attack,
  );
  const hand = makeItem(g, "Extra Hand");
  g.inventory.push(hand);
  g = act(g, { type: "use", id: hand.id });
  g = act(g, { type: "use", id: sword.id });
  expect(g.player.weapons).toHaveLength(2);
});
it("floor staff replacement with a full bag leaves displaced gear, not duplicated ownership", () => {
  let g = base();
  g.capacity = 1;
  const a = makeItem(g, "Wind Staff"),
    b = makeItem(g, "Water Staff");
  g.player.weapons = [a];
  g.pendingLoot = b;
  g.loot = [{ x: 15, y: 7, item: b }];
  expect(floorEquipPlan(g, b).leaveOnFloor).toBe(true);
  g = act(g, { type: "equip-floor" });
  expect(g.player.weapons[0].id).toBe(b.id);
  expect(g.loot.map((l) => l.item.id)).toEqual([a.id]);
});
it("summoner stones roll all charge counts, summon monsters, preserve charges across reload and break exactly on zero", () => {
  const observed = new Set<number>();
  for (let seed = 0; seed < 80; seed++) {
    let g = base(seed);
    const stone = makeItem(g, "Summoner Stone");
    observed.add(stone.uses!);
    g.inventory.push(stone);
    const max = stone.uses!;
    for (let charge = max; charge > 0; charge--) {
      g = act(JSON.parse(JSON.stringify(g)), { type: "use", id: stone.id });
      expect(g.monsters).toHaveLength(1);
      expect(g.monsters[0].merchant).toBeUndefined();
      expect(g.monsters[0].npc).toBeUndefined();
      expect(g.inventory.find((i) => i.id === stone.id)?.uses).toBe(
        charge === 1 ? undefined : charge - 1,
      );
      const m = g.monsters[0],
        dx = m.x - g.player.x,
        dy = m.y - g.player.y;
      g = act(g, { type: "move", dx, dy });
      g = act(g, { type: "attack" });
      if (g.pendingLevels) g = act(g, { type: "level", stat: "Power" });
      g = act(g, { type: "move", dx, dy });
      if (g.pendingLoot) g = act(g, { type: "pickup" });
      g = act(g, { type: "move", dx: -dx, dy: -dy });
    }
  }
  expect([...observed].sort()).toEqual([1, 2, 3, 4, 5]);
});
it("blocked stone summons preserve both RNG and remaining charges", () => {
  const g = base();
  const stone = makeItem(g, "Summoner Stone");
  g.inventory = [stone];
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    g.tiles[7 + dy][15 + dx] = 1;
  const before = structuredClone(g);
  expect(() => act(g, { type: "use", id: stone.id })).toThrow("adjacent");
  expect(g).toEqual(before);
});
it("damage, defeat, miss and critical captions have disjoint measured boxes even for adjacent actors", () => {
  const boxes: LabelBox[] = [];
  for (const [x, width] of [
    [300, 130],
    [348, 160],
    [300, 180],
    [348, 90],
    [300, 70],
    [348, 160],
  ]) {
    const b = placeCombatLabel(boxes, { x, y: 300, width, height: 24 });
    for (const a of boxes)
      expect(
        b.x >= a.x + a.width ||
          b.x + b.width <= a.x ||
          b.y >= a.y + a.height ||
          b.y + b.height <= a.y,
      ).toBe(true);
    boxes.push(b);
  }
});

import { describe, it, expect } from "vitest";
import {
  act,
  newGame,
  makeItem,
  makeMonster,
  availableSpells,
  combatAttackStats,
} from "../shared/engine";
import {
  equipmentComparison,
  swipeDirection,
  outgoingDamage,
  freshLog,
  freshGameLog,
  displayNumber,
  floorTheme,
} from "../shared/presentation";
function arena() {
  const g = newGame("Shai", "Mage", "Wind", 0, 91);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  g.player.x = 15;
  g.player.y = 7;
  g.player.hp = 10;
  const m = makeMonster(g, "Zombie", 1);
  Object.assign(m, { x: 16, y: 7, hp: 30 });
  m.stats.Health = 30;
  m.stats.Armor = 0;
  m.stats.Power = 1;
  m.stats.Luck = 0;
  g.monsters = [m];
  g.loot = [];
  g.pods = [];
  return g;
}
describe("requested interaction redesign", () => {
  it("maps swipes to exactly one cardinal move and ignores taps", () => {
    expect(swipeDirection(80, 3)).toEqual({ dx: 1, dy: 0 });
    expect(swipeDirection(-80, 3)).toEqual({ dx: -1, dy: 0 });
    expect(swipeDirection(2, -60)).toEqual({ dx: 0, dy: -1 });
    expect(swipeDirection(2, 60)).toEqual({ dx: 0, dy: 1 });
    expect(swipeDirection(4, 5)).toBeNull();
  });
  it("does not randomly damage any enemy on the first move or wait", () => {
    const g = arena();
    g.monsters[0].hp = 27.812345;
    g.player.hp = 9.75;
    const a = act(g, { type: "move", dx: 0, dy: 1 });
    expect(a.monsters[0].hp).toBe(27.812345);
    expect(a.player.hp).toBe(9.75);
    expect(a.log.some((s) => s.includes("damage"))).toBe(false);
    expect(act(a, { type: "wait" }).monsters[0].hp).toBe(27.812345);
  });
  it("throws a reachable floor projectile at an adjacent enemy without taking inventory space", () => {
    const g = arena(),
      item = makeItem(g, "Throwing Knife");
    g.loot = [{ x: 15, y: 7, item }];
    g.pendingLoot = item;
    const r = act(g, {
      type: "throw-floor",
      id: item.id,
      target: g.monsters[0].id,
    });
    expect(r.monsters[0].hp).toBe(25);
    expect(r.loot).toEqual([]);
    expect(r.inventory).toEqual(g.inventory);
    expect(r.turn).toBe(g.turn);
  });
  it("rejects remote floor throwing items and remote targets atomically", () => {
    const g = arena(),
      item = makeItem(g, "Throwing Knife");
    g.loot = [{ x: 14, y: 7, item }];
    const before = structuredClone(g);
    expect(() =>
      act(g, { type: "throw-floor", id: item.id, target: g.monsters[0].id }),
    ).toThrow("at your feet");
    expect(g).toEqual(before);
    g.loot[0].x = 15;
    g.monsters[0].x = 18;
    expect(() =>
      act(g, { type: "throw-floor", id: item.id, target: g.monsters[0].id }),
    ).toThrow("adjacent");
  });
  it("uses a floor teleporter once to escape and removes it from its original location", () => {
    const g = arena(),
      item = makeItem(g, "Teleporter");
    g.combat = g.monsters[0].id;
    g.loot = [{ x: 15, y: 7, item }];
    g.pendingLoot = item;
    const r = act(g, { type: "use-floor" });
    expect(r.combat).toBeUndefined();
    expect(r.loot).toEqual([]);
    expect([r.player.x, r.player.y]).not.toEqual([15, 7]);
    expect(() => act(r, { type: "use-floor" })).toThrow("within reach");
  });
  it("keeps a carried teleporter reusable and clears encounters", () => {
    const g = arena(),
      item = makeItem(g, "Teleporter");
    g.inventory.push(item);
    g.combat = g.monsters[0].id;
    const r = act(g, { type: "use", id: item.id });
    expect(r.combat).toBeUndefined();
    expect(r.inventory.some((i) => i.id === item.id)).toBe(true);
    expect(r.pendingLoot).toBeUndefined();
  });
  it("allows Teleport magic in combat, spends mana and ends the encounter", () => {
    const g = arena();
    g.combat = g.monsters[0].id;
    expect(availableSpells(g).some((s) => s.name === "Teleport")).toBe(true);
    const r = act(g, { type: "cast", spell: "Teleport" });
    expect(r.combat).toBeUndefined();
    expect(r.player.stats.Mana).toBe(9);
    expect(r.turn).toBe(g.turn);
  });
  it("previews actual gear effects without mutating RNG, equipment, or booster duration", () => {
    const g = arena(),
      item = makeItem(g, "Sword");
    g.player.stats.Power = 100;
    g.inventory.push(item);
    g.player.effects["Attack Booster"] = [2, 20];
    const before = structuredClone(g);
    const comparison = equipmentComparison(g, item);
    expect(g).toEqual(before);
    const r = act(g, { type: "use", id: item.id });
    expect(comparison.rows.find((r) => r.name === "Attack")!.after).toBe(
      combatAttackStats(r.player).Attack,
    );
    expect(comparison.rows.find((r) => r.name === "Speed")!.after).toBe(
      combatAttackStats(r.player).Speed,
    );
  });
  it("does not preview adding a second copy of an already-equipped item", () => {
    const g = arena(),
      item = makeItem(g, "Sword");
    g.player.weapons = [item];
    const r = equipmentComparison(g, item);
    expect(r.alreadyEquipped).toBe(true);
    expect(r.rows.every((v) => v.before === v.after)).toBe(true);
  });
  it("forecasts staff damage correctly when mana drops below two", () => {
    const g = arena(),
      staff = makeItem(g, "Magic Staff");
    g.player.weapons = [staff];
    g.player.stats.Magic = 20;
    g.player.stats.Power = 3;
    g.player.stats.Luck = 10;
    g.monsters[0].stats.Armor = 2;
    g.player.stats.Mana = 2;
    expect(outgoingDamage(g.player, g.monsters[0]).normal).toBe(18);
    g.player.stats.Mana = 1;
    expect(outgoingDamage(g.player, g.monsters[0])).toMatchObject({
      normal: 1,
      critical: 7,
    });
  });
  it("keeps only new critical messages even when the saved log is capped", () => {
    expect(
      freshLog(["a", "Critical hit!", "b"], ["Critical hit!", "b", "c"]),
    ).toEqual(["c"]);
    expect(freshLog(["a", "b"], ["a", "b", "Critical hit!", "damage"])).toEqual(
      ["Critical hit!", "damage"],
    );
  });
  it("rounds display values without changing real values and cycles distinct themes", () => {
    expect(displayNumber(12.345678)).toBe("12.3");
    expect(displayNumber(10)).toBe("10");
    expect(new Set([0, 1, 2, 3].map((f) => floorTheme(f).name)).size).toBe(4);
    expect(floorTheme(4)).toEqual(floorTheme(0));
  });
  it("uses the specified item at the player feet even without a pending prompt", () => {
    const g = arena(),
      item = makeItem(g, "Teleporter");
    g.loot = [{ x: 15, y: 7, item }];
    g.pendingLoot = undefined;
    const r = act(g, { type: "use-floor", id: item.id });
    expect(r.loot).toEqual([]);
    expect([r.player.x, r.player.y]).not.toEqual([15, 7]);
    expect(() => act(g, { type: "use-floor", id: "remote" })).toThrow(
      "within reach",
    );
  });
  it("detects repeated new critical hits even when a capped log has identical text", () => {
    const g = arena();
    g.log = Array.from({ length: 100 }, (_, i) =>
      i % 2 ? "damage" : "Critical hit!",
    );
    g.logSerial = 100;
    const after = structuredClone(g);
    after.logSerial = 102;
    expect(freshGameLog(g, after)).toEqual(["Critical hit!", "damage"]);
  });
});

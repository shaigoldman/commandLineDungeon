import { describe, it, expect } from "vitest";
import {
  act,
  newGame,
  makeItem,
  makeMonster,
  incomingDamage,
  canUseFromFloor,
} from "../shared/engine";

describe("floor items and combat safety forecast", () => {
  function floorGame() {
    const g = newGame("Shai", "Scout", "Wind", 0, 91);
    const item = makeItem(g, "Medium Health Potion");
    g.player.hp = 1;
    g.loot.push({ x: g.player.x, y: g.player.y, item });
    g.pendingLoot = item;
    while (g.inventory.length < g.capacity)
      g.inventory.push(makeItem(g, "Tiny Health Potion"));
    return g;
  }
  it("uses a floor potion with a full bag, once, without consuming a turn or inventory slot", () => {
    const g = floorGame(),
      id = g.pendingLoot!.id;
    const result = act(g, { type: "use-floor" });
    expect(result.player.hp).toBeGreaterThan(1);
    expect(result.inventory).toEqual(g.inventory);
    expect(result.turn).toBe(g.turn);
    expect(result.pendingLoot).toBeUndefined();
    expect(result.loot.some((l) => l.item.id === id)).toBe(false);
    expect(() => act(result, { type: "use-floor" })).toThrow("within reach");
    expect(g.player.hp).toBe(1);
  });
  it("rejects stale floor items and equipment without mutating the save", () => {
    const g = floorGame();
    g.loot = [];
    expect(() => act(g, { type: "use-floor" })).toThrow("within reach");
    expect(canUseFromFloor({ ...g.pendingLoot!, kind: "weapon" })).toBe(false);
    expect(canUseFromFloor({ ...g.pendingLoot!, kind: "tome" })).toBe(false);
  });
  it("uses a permanent floor boost and applies its normal effect", () => {
    const g = floorGame();
    const i = { ...g.pendingLoot!, kind: "stat", stat: "Power", value: 3 };
    g.pendingLoot = i;
    g.loot = [{ x: g.player.x, y: g.player.y, item: i }];
    expect(act(g, { type: "use-floor" }).player.stats.Power).toBe(
      g.player.stats.Power + 3,
    );
  });
  it("warns at exact lethal thresholds, accounts for armor, crits and attack order without side effects", () => {
    const g = floorGame(),
      m = makeMonster(g, "Zombie", 1);
    m.stats.Power = 10;
    m.stats.Luck = 10;
    m.stats.Speed = 100;
    m.weapons = [];
    g.player.stats.Armor = 2;
    g.player.hp = 8;
    const before = structuredClone({ m, p: g.player });
    expect(incomingDamage(m, g.player)).toEqual({
      normal: 8,
      critical: 28,
      lethal: true,
      criticalLethal: true,
      enemyFirst: true,
    });
    expect({ m, p: g.player }).toEqual(before);
    g.player.hp = 9;
    expect(incomingDamage(m, g.player).lethal).toBe(false);
    expect(incomingDamage(m, g.player).criticalLethal).toBe(true);
    m.stats.Luck = 0;
    expect(incomingDamage(m, g.player).criticalLethal).toBe(false);
    g.player.stats.Armor = 50;
    expect(incomingDamage(m, g.player).normal).toBe(0);
  });
  it("forecasts magical attacks and boosters without spending mana or duration", () => {
    const g = floorGame(),
      m = makeMonster(g, "Zombie", 1);
    m.weapons = [{ ...g.pendingLoot!, kind: "tome" }];
    m.stats.Magic = 20;
    m.stats.Mana = 2;
    m.stats.Luck = 0;
    m.effects["Attack Booster"] = [1, 50];
    g.player.stats.Armor = 0;
    expect(incomingDamage(m, g.player).normal).toBe(30);
    expect(m.stats.Mana).toBe(2);
    expect(m.effects["Attack Booster"]).toEqual([1, 50]);
    m.stats.Mana = 1;
    expect(incomingDamage(m, g.player).normal).toBe(
      Math.trunc(m.stats.Power + Math.ceil(m.stats.Power * 0.5)),
    );
  });
});

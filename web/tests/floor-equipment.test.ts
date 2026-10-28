import { describe, it, expect } from "vitest";
import { newGame, makeItem, act, floorEquipPlan } from "../shared/engine";
import { itemArtKey } from "../src/item-art";
function fixture() {
  const g = newGame("Shai", "Warrior", "Wind", 0, 91);
  g.player.stats.Power = 100;
  g.inventory = [];
  g.player.weapons = [];
  const item = makeItem(g, "Sword");
  item.name = "Steel Sword";
  g.pendingLoot = item;
  g.loot = [{ x: g.player.x, y: g.player.y, item }];
  return g;
}
describe("ground equipment", () => {
  it("equips without a bag pickup, a world turn, or input mutation", () => {
    const g = fixture(),
      before = structuredClone(g),
      r = act(g, { type: "equip-floor" });
    expect(r.player.weapons).toEqual([g.pendingLoot]);
    expect(r.inventory).toEqual([]);
    expect(r.turn).toBe(g.turn);
    expect(r.pendingLoot).toBeUndefined();
    expect(r.loot).toEqual([]);
    expect(g).toEqual(before);
  });
  it("puts displaced equipment into the bag when there is room", () => {
    const g = fixture(),
      old = makeItem(g, "Axe");
    g.player.weapons = [old];
    const r = act(g, { type: "equip-floor" });
    expect(r.player.weapons[0].id).toBe(g.pendingLoot!.id);
    expect(r.inventory).toEqual([old]);
    expect(r.loot).toEqual([]);
  });
  it("safely swaps on the floor when the bag is full, conserving every item", () => {
    const g = fixture(),
      old = makeItem(g, "Axe");
    g.player.weapons = [old];
    while (g.inventory.length < g.capacity - 1)
      g.inventory.push(makeItem(g, "Small Health Potion"));
    expect(floorEquipPlan(g, g.pendingLoot!).leaveOnFloor).toBe(true);
    const r = act(g, { type: "equip-floor" });
    expect(r.inventory).toEqual(g.inventory);
    expect(r.player.weapons[0].id).toBe(g.pendingLoot!.id);
    expect(r.loot).toEqual([{ x: g.player.x, y: g.player.y, item: old }]);
    expect(r.pendingLoot).toBeUndefined();
  });
  it("rejects weak, remote, and non-equipment attempts atomically", () => {
    const g = fixture();
    g.player.stats.Power = 0;
    expect(() => act(g, { type: "equip-floor" })).toThrow("Power");
    g.player.stats.Power = 100;
    g.loot[0].x++;
    expect(() => act(g, { type: "equip-floor" })).toThrow("within reach");
    g.loot[0].x--;
    g.pendingLoot!.kind = "rope";
    expect(() => act(g, { type: "equip-floor" })).toThrow("cannot be equipped");
    expect(g.player.weapons).toEqual([]);
  });
  it("requires a gear slot in a bag filled without equipped weapons", () => {
    const g = fixture();
    while (g.inventory.length < g.capacity)
      g.inventory.push(makeItem(g, "Small Health Potion"));
    expect(floorEquipPlan(g, g.pendingLoot!).problem).toContain(
      "Free one bag slot",
    );
    expect(() => act(g, { type: "equip-floor" })).toThrow("bag slot");
  });
  it("preserves dual-hand and staff equip rules", () => {
    const g = fixture(),
      old = makeItem(g, "Axe");
    g.hands = 2;
    g.player.weapons = [old];
    expect(act(g, { type: "equip-floor" }).player.weapons).toHaveLength(2);
    g.pendingLoot!.kind = "tome";
    g.pendingLoot!.element = "Fire";
    expect(act(g, { type: "equip-floor" }).player.weapons).toHaveLength(2);
  });
  it("gives materials and the named relic separate shared art identities", () => {
    const keys = ["Fragile", "Iron", "Steel", "Lucky", "Magic", "Obsidian"].map(
      (m) => itemArtKey({ kind: "weapon", name: m + " Sword" }),
    );
    expect(new Set(keys).size).toBe(6);
    expect(itemArtKey({ kind: "weapon", name: "Awathons Broadsword" })).toBe(
      "broadsword:relic",
    );
    expect(itemArtKey({ kind: "weapon", name: "Obsidian Axe" })).toBe(
      "axe:obsidian",
    );
  });
});

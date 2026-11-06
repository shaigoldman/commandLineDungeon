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
  it("equips immediately and lets the player choose which item frees bag space", () => {
    const g = fixture(),
      old = makeItem(g, "Axe");
    g.player.weapons = [old];
    while (g.inventory.length < g.capacity - 1)
      g.inventory.push(makeItem(g, "Small Health Potion"));
    expect(floorEquipPlan(g, g.pendingLoot!).requiresCleanup).toBe(true);
    const r = act(g, { type: "equip-floor" });
    expect(r.inventory).toEqual([...g.inventory,old]);
    expect(r.pendingBagCleanup).toBe(true);
    expect(()=>act(r,{type:"move",dx:1,dy:0})).toThrow("over capacity");
    const resolved=act(r,{type:"drop",id:g.inventory[0].id});
    expect(resolved.pendingBagCleanup).toBe(false);
    expect(resolved.inventory.some(i=>i.id===old.id)).toBe(true);
    expect(r.player.weapons[0].id).toBe(g.pendingLoot!.id);
    expect(r.loot).toEqual([]);
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
  it("equips into an unarmed full bag, persists cleanup, and allows using a potion to resolve it", () => {
    const g = fixture();
    while (g.inventory.length < g.capacity)
      g.inventory.push(makeItem(g, "Small Health Potion"));
    expect(floorEquipPlan(g,g.pendingLoot!).problem).toBeUndefined();
    let result=act(g,{type:"equip-floor"});
    expect(result.player.weapons[0].id).toBe(g.pendingLoot!.id);
    expect(result.inventory).toEqual(g.inventory);expect(result.pendingBagCleanup).toBe(true);
    result=JSON.parse(JSON.stringify(result));result.player.hp=1;
    result=act(result,{type:"use",id:result.inventory[0].id});
    expect(result.pendingBagCleanup).toBe(false);expect(result.inventory).toHaveLength(g.capacity-1);
    expect(result.player.weapons[0].id).toBe(g.pendingLoot!.id);
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

it("lets bag management drop equipped gear without deleting other equipment",()=>{
 const g=fixture(),sword=makeItem(g,"Iron Sword"),shield=makeItem(g,"Iron Shield");g.player.weapons=[sword,shield];g.hands=2;
 const after=act(g,{type:"drop",id:sword.id});expect(after.player.weapons).toEqual([shield]);expect(after.loot.some(l=>l.item.id===sword.id)).toBe(true);
});

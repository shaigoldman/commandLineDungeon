import { describe, it, expect } from "vitest";
import {
  newGame,
  makeMonster,
  makeItem,
  act,
  canUseFromFloor,
  itemUseProblem,
} from "../shared/engine";
function fixture() {
  const g = newGame("Shai", "Warrior", "Wind", 0, 91);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  g.player.x = 15;
  g.player.y = 7;
  const enemy = makeMonster(g, "Zombie", 1);
  Object.assign(enemy, { x: 16, y: 7, hp: 100 });
  enemy.stats.Health = 100;
  enemy.npc = undefined;
  g.monsters = [enemy];
  return g;
}
describe("explicit encounter choices", () => {
  it("opening inspection never attacks or advances a turn, and closing is safe", () => {
    const g = fixture(),
      opened = act(g, { type: "move", dx: 1, dy: 0 });
    expect(opened.encounter).toMatchObject({
      origin: "inspection",
      engaged: false,
      exchanges: 0,
    });
    expect(opened.player.hp).toBe(g.player.hp);
    expect(opened.monsters[0].hp).toBe(100);
    expect(opened.turn).toBe(g.turn);
    const closed = act(opened, { type: "leave" });
    expect(closed.combat).toBeUndefined();
    expect(closed.encounter).toBeUndefined();
    expect(closed.player.hp).toBe(g.player.hp);
  });
  it("distinguishes an enemy challenge from an actual attack and preserves its origin after saving", () => {
    const g = fixture();
    g.player.stats.Speed = 10;
    g.monsters[0].stats.Speed = 10;
    let challenged;
    for (let seed = 0; seed < 1000; seed++) {
      g.seed = seed;
      const result = act(g, { type: "wait" });
      if (result.combat) {
        challenged = result;
        break;
      }
    }
    expect(challenged).toBeDefined();
    expect(challenged!.encounter).toMatchObject({
      origin: "enemy",
      engaged: false,
      exchanges: 0,
    });
    expect(challenged!.player.hp).toBe(g.player.hp);
    const exchanged = act(JSON.parse(JSON.stringify(challenged)), {
      type: "attack",
    });
    expect(exchanged.encounter).toMatchObject({
      origin: "enemy",
      engaged: true,
      exchanges: 1,
    });
    expect(exchanged.log.some((s) => s.includes("Zombie attacks Shai."))).toBe(
      true,
    );
  });
  it("offers floor consumption only for appropriate items and rejects knives on the server", () => {
    const g = fixture(),
      knife = makeItem(g, "Throwing Knife");
    g.pendingLoot = knife;
    g.loot = [{ x: 15, y: 7, item: knife }];
    expect(canUseFromFloor(knife)).toBe(false);
    expect(canUseFromFloor(makeItem(g, "Escape Rope"))).toBe(false);
    expect(canUseFromFloor(makeItem(g, "Small Health Potion"))).toBe(true);
    expect(() => act(g, { type: "use-floor" })).toThrow("Pick up");
    expect(g.loot).toHaveLength(1);
  });
  it("explains the exact equip requirement and becomes available at the boundary", () => {
    const g = fixture(),
      weapon = makeItem(g, "Sword");
    weapon.weight = 10;
    g.player.stats.Power = 19;
    g.inventory.push(weapon);
    expect(itemUseProblem(g, weapon)).toBe("Requires 20 Power; you have 19.");
    expect(() => act(g, { type: "use", id: weapon.id })).toThrow("Power");
    g.player.stats.Power = 20;
    expect(itemUseProblem(g, weapon)).toBeUndefined();
    expect(
      act(g, { type: "use", id: weapon.id }).player.weapons.some(
        (i) => i.id === weapon.id,
      ),
    ).toBe(true);
  });
  it("explains item context restrictions without changing stats or inventory", () => {
    const g = fixture(),
      knife = makeItem(g, "Throwing Knife"),
      nuke = makeItem(g, "Nuke");
    expect(itemUseProblem(g, knife)).toBe("Requires an enemy encounter.");
    g.combat = g.monsters[0].id;
    expect(itemUseProblem(g, knife)).toBeUndefined();
    expect(itemUseProblem(g, nuke)).toBe("Use outside combat.");
  });
});

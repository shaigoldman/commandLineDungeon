import { describe, expect, it } from "vitest";
import { act, availableSpells, makeItem, makeMonster, newGame } from "../shared/engine";

function encounter() {
  const g = newGame("Test", "Warrior", "Wind", 0, 91);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  Object.assign(g.player, { x: 5, y: 5 });
  Object.assign(g.player.stats, { Magic: 15, Mana: 10 });
  g.player.weapons = [makeItem(g, "Wind Staff")];
  g.inventory = []; g.loot = []; g.chests = []; g.traps = []; g.pods = []; g.secretDoors = [];
  g.pendingLevels = 0;
  g.stairs = { x: 25, y: 10, locked: false };
  const enemy = makeMonster(g, "Zombie", 1);
  Object.assign(enemy, { x: 6, y: 5, hp: 100 });
  enemy.stats.Health = 100;
  g.monsters = [enemy];
  g.combat = enemy.id;
  g.encounter = { enemyId: enemy.id, origin: "inspection", engaged: false, exchanges: 0 };
  return g;
}

describe("Blow displacement and mana", () => {
  it.each(["wall", "edge", "monster", "chest"])("keeps combat engaged when a %s prevents any movement", blocker => {
    const g = encounter();
    if (blocker === "wall") g.tiles[5][7] = 1;
    if (blocker === "edge") g.tiles[5] = g.tiles[5].slice(0, 7);
    if (blocker === "monster") {
      const other = makeMonster(g, "Golem", 1);
      Object.assign(other, { x: 7, y: 5 });
      g.monsters.push(other);
    }
    if (blocker === "chest") g.chests = [{ id: "blocker", x: 7, y: 5, opened: false, locked: false, ultra: false, reward: makeItem(g, "Iron Sword") }];
    const after = act(g, { type: "cast", spell: "Blow" });
    expect(after.monsters[0]).toMatchObject({ x: 6, y: 5, hp: 95 });
    expect(after.combat).toBe(g.combat);
    expect(after.encounter).toMatchObject({ enemyId: g.combat, engaged: true });
    expect(after.player.stats.Mana).toBe(5);
    expect(() => act(after, { type: "leave" })).toThrow("must flee");
  });

  it.each([false, true])("ends combat after actual movement (collision: %s)", collision => {
    const g = encounter();
    if (collision) g.tiles[5][8] = 1;
    const after = act(g, { type: "cast", spell: "Blow" });
    expect(after.monsters[0]).toMatchObject({ x: collision ? 7 : 16, y: 5, hp: collision ? 95 : 100 });
    expect(after.combat).toBeUndefined();
    expect(after.encounter).toBeUndefined();
    expect(after.player.stats.Mana).toBe(5);
  });

  it("ends combat when a collision kills the enemy without moving it", () => {
    const g = encounter();
    g.tiles[5][7] = 1;
    g.monsters[0].hp = 5;
    const after = act(g, { type: "cast", spell: "Blow" });
    expect(after.monsters).toHaveLength(0);
    expect(after.combat).toBeUndefined();
    expect(after.encounter).toBeUndefined();
  });

  it("requires 5 mana and still applies mana discounts", () => {
    const g = encounter();
    g.player.stats.Mana = 4;
    expect(availableSpells(g).some(s => s.name === "Blow")).toBe(false);
    expect(() => act(g, { type: "cast", spell: "Blow" })).toThrow("Spell unavailable");
    g.inventory.push(makeItem(g, "Mana Gem"));
    const after = act(g, { type: "cast", spell: "Blow" });
    expect(after.player.stats.Mana).toBe(0);
  });
});

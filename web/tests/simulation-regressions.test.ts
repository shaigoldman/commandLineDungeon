import { describe, it, expect } from "vitest";
import {
  act,
  newGame,
  makeItem,
  makeMonster,
  generateFloor,
  combatAttackStats,
} from "../shared/engine";
function base(className = "Warrior") {
  return newGame("Regression", className, "Wind", 0, 7);
}
describe("simulation regressions", () => {
  it("rejects an unearned level bonus without changing the input", () => {
    const g = base(),
      before = structuredClone(g);
    expect(() => act(g, { type: "level", stat: "Power" })).toThrow("pending");
    expect(g).toEqual(before);
  });
  it("preserves fractional player HP when waiting without damage", () => {
    const g = base("Scout");
    g.player.hp = 0.5;
    const next = act(g, { type: "wait" });
    expect(next.player.hp).toBe(0.5);
    expect(next.status).toBe("playing");
    expect(next.combat).toBeUndefined();
  });
  it("preserves fractional monster HP and gives no unearned reward on a turn", () => {
    const g = base();
    g.monsters = [g.monsters[0]];
    g.monsters[0].hp = 0.3;
    const next = act(g, { type: "wait" });
    expect(next.monsters[0].hp).toBe(0.3);
    expect(next.xp).toBe(0);
  });
  it("shielded nukes preserve key and loot drops without awarding combat EXP", () => {
    let g = base("Knight");
    g.floor = 1;
    generateFloor(g);
    const nuke = makeItem(g, "Nuke");
    g.inventory.push(nuke);
    g.player.effects["Nuke Shield"] = [1, 1];
    const count = g.monsters.filter((m) => !m.merchant).length;
    g = act(g, { type: "use", id: nuke.id });
    expect(g.status).toBe("playing");
    expect(g.monsters).toHaveLength(0);
    expect(g.keys).toBe(1);
    expect(g.xp).toBe(0);
    expect(g.score).toBe(100);
    expect(g.loot).toHaveLength(10 + count - 1);
    Object.assign(g.player, g.stairs);
    g = act(g, { type: "ascend" });
    expect(g.floor).toBe(2);
  });
  it("rejects unequipping into a full bag when another weapon remains equipped", () => {
    const g = base();
    g.hands = 2;
    const a = makeItem(g, "Sword"),
      b = makeItem(g, "Magic Staff");
    g.hands = 2;
    g.player.weapons = [a, b];
    while (g.inventory.length < 4)
      g.inventory.push(makeItem(g, "Tiny Health Potion"));
    const before = structuredClone(g);
    expect(() => act(g, { type: "unequip", id: a.id })).toThrow("full");
    expect(g).toEqual(before);
  });
  for (const kind of ["spell", "item"])
    it(`${kind} teleport dismisses the old treasure prompt without collecting it`, () => {
      const g = base("Mage");
      const loot = g.loot[0];
      Object.assign(g.player, { x: loot.x, y: loot.y });
      g.pendingLoot = loot.item;
      const teleporter = makeItem(g, "Teleporter");
      g.inventory.push(teleporter);
      const next = act(
        g,
        kind === "spell"
          ? { type: "cast", spell: "Teleport" }
          : { type: "use", id: teleporter.id },
      );
      expect(next.pendingLoot).toBeUndefined();
      expect(next.loot.some((l) => l.item.id === loot.item.id)).toBe(true);
      const after = act(next, { type: "pickup" });
      expect(after.inventory.some((i) => i.id === loot.item.id)).toBe(false);
    });
  it("a chief cannot reduce maximum health below one or leave HP above its new maximum", () => {
    for (const health of [1, 10])
      for (let seed = 1; seed <= 40; seed++) {
        const g = newGame("Regression", "Warrior", "Wind", 0, seed);
        g.player.stats.Health = health;
        g.player.hp = health;
        const npc = makeMonster(g, "Chieftan", 100);
        npc.npc = { tribe: "Awa", deal: "Stat", done: false, line: "Test" };
        Object.assign(npc, { x: g.monsters[0].x, y: g.monsters[0].y });
        npc.className = "Chieftan";
        npc.npc = { tribe: "Awa", deal: "Stat", done: false, line: "Test" };
        npc.level = 100;
        g.monsters = [npc];
        g.combat = npc.id;
        const next = act(g, { type: "deal" });
        expect(next.player.stats.Health).toBeGreaterThanOrEqual(1);
        expect(next.player.hp).toBeLessThanOrEqual(next.player.stats.Health);
      }
  });
});

describe("combat and conversation forecasts", () => {
  it("shows the same pure-staff attack damage that a deterministic exchange deals", () => {
    let g = base("Mage");
    g.player.stats.Luck = 0;
    g.player.stats.Accuracy = 200;
    g.player.stats.Speed = 200;
    const m = g.monsters[0];
    m.hp = 100;
    m.stats.Health = 100;
    m.stats.Power = 0;
    m.stats.Armor = 0;
    g.monsters = [m];
    g.combat = m.id;
    const forecast = combatAttackStats(g.player).Attack;
    g = act(g, { type: "attack" });
    expect(100 - g.monsters[0].hp).toBe(forecast);
    expect(forecast).toBe(10);
  });
  it("does not offer an already completed bargain in dialogue", () => {
    const g = base(),
      m = g.monsters[0];
    m.npc = { tribe: "Awa", deal: "Life", done: true, line: "Hello" };
    g.combat = m.id;
    const next = act(g, { type: "talk" });
    expect(next.log.at(-1)).toContain("already traded");
    expect(next.log.at(-1)).not.toContain("Accept");
    expect(() => act(g, { type: "deal" })).toThrow("No available deal");
  });
});

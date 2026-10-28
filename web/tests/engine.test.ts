import { describe, it, expect } from "vitest";
import {
  newGame,
  act,
  hitRate,
  attackStats,
  experience,
  makeItem,
  makeMonster,
  availableSpells,
  generateFloor,
  randomItem,
} from "../shared/engine";
import { classes, spells, itemDefinitions } from "../shared/catalog";
function game() {
  return newGame("Ada", "Warrior", "Wind", 0, 42);
}
describe("source mechanics", () => {
  it("preserves class bases, starting inventory, and fixed mana", () => {
    for (const c of ["Warrior", "Knight", "Scout", "Mage"]) {
      const g = newGame("Ada", c, "Wind", 0, 42);
      expect(g.player.stats).toMatchObject(classes[c]);
      expect(g.inventory[0].value).toBe(10);
      expect(g.inventory[1].kind).toBe("rope");
      expect(g.player.stats.Mana).toBe(10);
    }
  });
  it("matches original hit and EXP formulas", () => {
    const a = game().player,
      b = newGame("B", "Scout").player;
    expect(hitRate(a, b)).toBeCloseTo(73.6);
    a.stats.Accuracy = 1;
    expect(hitRate(a, b)).toBe(40);
    expect(experience(4, 1)).toBe(80);
    expect(experience(4, 7)).toBe(4);
  });
  it("consumes attack boosters once", () => {
    const g = game();
    g.player.effects["Attack Booster"] = [1, 25];
    expect(attackStats(g.player, true).Attack).toBe(15);
    expect(g.player.effects["Attack Booster"]).toBeUndefined();
  });
  it("preserves item roster and all ten spells", () => {
    expect(spells).toHaveLength(10);
    for (const d of itemDefinitions) {
      const i = makeItem(game(), d[0]);
      expect(i.id).toBeTruthy();
      expect(i.kind).toBe(d[1]);
    }
  });
  it("builds reproducible connected floors without overlapping spawns", () => {
    for (let seed = 0; seed < 100; seed++) {
      const g = newGame("A", "Warrior", "Wind", 0, seed);
      expect(g).toEqual(newGame("A", "Warrior", "Wind", 0, seed));
      const seen = new Set<string>(),
        stack = [[g.player.x, g.player.y]];
      while (stack.length) {
        const [x, y] = stack.pop()!,
          k = x + "," + y;
        if (seen.has(k) || g.tiles[y]?.[x] !== 0) continue;
        seen.add(k);
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      expect(seen.size).toBe(g.tiles.flat().filter((t) => !t).length);
      expect(seen.has(g.stairs.x + "," + g.stairs.y)).toBe(true);
      expect(g.monsters).toHaveLength(19);
      const occupied = [g.player, ...g.monsters, ...g.loot, ...g.pods].map(
        (p) => p.x + "," + p.y,
      );
      expect(new Set(occupied).size).toBe(occupied.length);
    }
  });
  it("generates locked floor, key carrier, dragon, and late monsters", () => {
    const g = game();
    g.floor = 1;
    generateFloor(g);
    expect(g.stairs.locked).toBe(true);
    expect(g.monsters.some((m) => m.key)).toBe(true);
    g.floor = 2;
    generateFloor(g);
    expect(g.monsters.find((m) => m.boss)?.name).toContain("Ruthagor");
    g.floor = 3;
    generateFloor(g);
    expect(g.monsters.some((m) => m.className === "Golem")).toBe(true);
  });
  it("rejects invalid movement without mutating its input", () => {
    const g = game(),
      before = structuredClone(g);
    expect(() => act(g, { type: "move", dx: 2, dy: 0 })).toThrow();
    expect(g).toEqual(before);
  });
  it("enforces weapon power and durability", () => {
    let g = game();
    const w = makeItem(g, "Axe");
    w.weight = 100;
    g.inventory.push(w);
    expect(() => act(g, { type: "use", id: w.id })).toThrow("Power");
    w.weight = 1;
    w.uses = 1;
    g = act(g, { type: "use", id: w.id });
    const m = makeMonster(g, "Zombie", 1);
    m.hp = 1000;
    m.stats.Power = 0;
    m.stats.Accuracy = 0;
    g.monsters = [m];
    g.combat = m.id;
    g = act(g, { type: "attack" });
    expect(g.player.weapons).toHaveLength(0);
    expect(g.log.some((s) => s.includes("broke"))).toBe(true);
  });
  it("does not allow unaffordable spells and spends mana", () => {
    let g = newGame("A", "Mage", "Wind", 0, 7);
    expect(availableSpells(g).map((s) => s.name)).toContain("Teleport");
    g = act(g, { type: "cast", spell: "Teleport" });
    expect(g.player.stats.Mana).toBe(9);
    expect(() => act(g, { type: "cast", spell: "Annihilate" })).toThrow();
  });
  it("armor absorbs attacks and poison bypasses it", () => {
    let g = game();
    g.player.stats.Armor = 900;
    g.player.effects.Poison = [2, 3];
    const p = g.player;
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const [dx, dy] = directions.find(
      ([x, y]) =>
        g.tiles[p.y + y]?.[p.x + x] === 0 &&
        !g.monsters.some((m) => m.x === p.x + x && m.y === p.y + y),
    )!;
    g = act(g, { type: "move", dx, dy });
    expect(g.player.hp).toBe(17);
    expect(g.player.effects.Poison).toEqual([1, 3]);
  });
  it("rope guarantees escape and is consumed", () => {
    let g = game();
    g.combat = g.monsters[0].id;
    const rope = g.inventory.find((i) => i.kind === "rope")!;
    g = act(g, { type: "use", id: rope.id });
    expect(g.combat).toBeUndefined();
    expect(g.inventory.some((i) => i.id === rope.id)).toBe(false);
  });
  it("advances floors, requires keys and wins at floor three", () => {
    let g = game();
    g.monsters = [];
    Object.assign(g.player, g.stairs);
    g = act(g, { type: "ascend" });
    expect(g.floor).toBe(1);
    g.monsters = [];
    Object.assign(g.player, g.stairs);
    expect(() => act(g, { type: "ascend" })).toThrow("key");
    g.keys = 1;
    g = act(g, { type: "ascend" });
    expect(g.floor).toBe(2);
    g.monsters = [];
    Object.assign(g.player, g.stairs);
    g = act(g, { type: "ascend" });
    expect(g.status).toBe("won");
    g = act(g, { type: "continue" });
    expect(g.floor).toBe(3);
    expect(g.status).toBe("playing");
  });
  it("nuke shield protects once, unshielded nukes kill", () => {
    let g = game();
    let shield = makeItem(g, "Nuke Shield");
    g.inventory.push(shield);
    g = act(g, { type: "use", id: shield.id });
    let nuke = makeItem(g, "Nuke");
    g.inventory.push(nuke);
    g = act(g, { type: "use", id: nuke.id });
    expect(g.monsters).toHaveLength(0);
    expect(g.status).toBe("playing");
    nuke = makeItem(g, "Nuke");
    g.inventory.push(nuke);
    g = act(g, { type: "use", id: nuke.id });
    expect(g.status).toBe("dead");
  });
  it("levels restore HP and mana, then require a stat choice", () => {
    let g = game();
    g.xp = 100;
    const pill = makeItem(g, "EXP Pill");
    pill.kind = "xp";
    g.inventory.push(pill);
    g = act(g, { type: "use", id: pill.id });
    expect(g.pendingLevels).toBe(1);
    expect(g.player.level).toBe(2);
    expect(g.player.hp).toBe(g.player.stats.Health);
    expect(() => act(g, { type: "wait" })).toThrow("bonus");
    g = act(g, { type: "level", stat: "Power" });
    expect(g.player.level).toBe(3);
  });
  it("random loot remains valid through deep endless floors", () => {
    const g = game();
    for (let d = 0; d < 100; d++) expect(randomItem(g, d).id).toBeTruthy();
  });
});
describe("spell and NPC paths", () => {
  it("supports all spell effects and dragon immunity", () => {
    for (const spell of spells) {
      let g = newGame("A", "Mage", "Wind", 0, 20);
      g.player.stats.Magic = 100;
      g.player.stats.Health = 200;
      g.player.hp = 100;
      g.player.effects.Poison = [5, 2];
      const staff = g.player.weapons[0];
      staff.element = spell.element;
      g.player.stats.Mana = 10;
      const m = makeMonster(g, "Zombie", 1);
      g.monsters = [m];
      if (spell.when === "combat") g.combat = m.id;
      g = act(g, { type: "cast", spell: spell.name });
      expect(g.player.stats.Mana).toBe(10 - spell.cost);
      if (["Cleanse", "Healing Winds"].includes(spell.name))
        expect(g.player.effects).toEqual({});
      if (spell.name === "Grow") expect(g.player.stats.Health).toBe(210);
      if (spell.name === "Heal") expect(g.player.hp).toBe(200);
    }
    let g = newGame("A", "Mage", "Fire", 0, 4);
    g.player.stats.Magic = 80;
    const m = makeMonster(g, "Dragon", 20);
    g.monsters = [m];
    g.combat = m.id;
    const hp = m.hp;
    g = act(g, { type: "cast", spell: "Annihilate" });
    expect(g.monsters[0].hp).toBe(hp);
  });
  it("supports every NPC bargain without corrupting the save", () => {
    for (const deal of [
      "Life",
      "All Items",
      "Item of Choice",
      "Random Item",
      "Weapon",
      "Death Wheel",
      "Stat",
      "Health Gain",
    ]) {
      let g = game();
      const npc = makeMonster(g, "Chieftan", 1);
      npc.npc = { tribe: "Awa", deal, done: false, line: "Hello" };
      g.monsters = [npc];
      g.combat = npc.id;
      g = act(g, { type: "talk" });
      expect(g.log.at(-1)).toContain(deal);
      g = act(g, { type: "deal" });
      expect(JSON.parse(JSON.stringify(g))).toEqual(g);
      expect(g.combat).toBeUndefined();
    }
  });
});
it("plays a generated campaign through real moves, fights, keys, and stairs", () => {
  let g = newGame("Campaign fixture", "Knight", "Wind", 0, 91);
  g.player.stats.Power = 9001;
  g.player.stats.Accuracy = 9001;
  g.player.stats.Health = 9001;
  g.player.hp = 9001;
  g.player.stats.Armor = 9001;
  const go = (tx: number, ty: number) => {
    for (let step = 0; step < 800; step++) {
      if (g.pendingLevels) {
        g = act(g, { type: "level", stat: "Power" });
        continue;
      }
      if (g.combat) {
        g = act(g, { type: "attack" });
        continue;
      }
      if (g.pendingLoot) {
        g = act(g, { type: "ignore" });
        continue;
      }
      if (g.player.x === tx && g.player.y === ty) return;
      const queue: [[number, number], number[][]][] = [
          [[g.player.x, g.player.y], []],
        ],
        seen = new Set<string>();
      let path: number[][] | undefined;
      while (queue.length) {
        const [[x, y], moves] = queue.shift()!;
        if (x === tx && y === ty) {
          path = moves;
          break;
        }
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const xx = x + dx,
            yy = y + dy,
            key = xx + "," + yy;
          if (g.tiles[yy]?.[xx] === 0 && !seen.has(key)) {
            seen.add(key);
            queue.push([
              [xx, yy],
              [...moves, [dx, dy]],
            ]);
          }
        }
      }
      expect(path?.length).toBeTruthy();
      const [dx, dy] = path![0];
      g = act(g, { type: "move", dx, dy });
    }
    throw Error("Campaign path stalled");
  };
  for (let floor = 0; floor < 3; floor++) {
    const carrier = g.monsters.find((m) => m.key);
    if (carrier) go(carrier.x, carrier.y);
    const stair = { ...g.stairs };
    go(stair.x, stair.y);
    g = act(g, { type: "ascend" });
    expect(g.status).not.toBe("dead");
  }
  expect(g.status).toBe("won");
  expect(g.log.some((s) => s.includes("You won"))).toBe(true);
});

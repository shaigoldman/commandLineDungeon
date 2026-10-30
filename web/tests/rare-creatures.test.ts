import { describe, expect, it } from "vitest";
import { act, availableSpells, fleeChance, generateFloor, makeItem, makeMonster, newGame, randomItem } from "../shared/engine";
import { makeVillager, makeChief, addChest, addSecretDoor, catalogItems } from "../shared/expansion";
import type { Game } from "../shared/types";

function arena(seed = 1) {
  const g = newGame("Rare tester", "Mage", "Fire", 0, seed);
  g.tiles = Array.from({ length: 15 }, (_, y) => Array.from({ length: 30 }, (_, x) => x === 0 || x === 29 || y === 0 || y === 14 ? 1 : 0));
  g.light = g.tiles.map((r) => r.map(() => true));
  g.monsters = []; g.loot = []; g.pods = []; g.chests = []; g.secretDoors = []; g.haunting = [];
  g.stairs = { x: 27, y: 13, locked: false };
  Object.assign(g.player, { x: 5, y: 7, hp: 100 });
  Object.assign(g.player.stats, { Health: 100, Power: 30, Magic: 20, Speed: 40, Accuracy: 1000, Mana: 10 });
  g.inventory = []; g.pendingLoot = undefined; g.combat = undefined; g.pendingLevels = 0;
  return g;
}
function target(g: Game, type: string, x = 6, y = 7) {
  const m = makeMonster(g, type, 1);
  Object.assign(m, { x, y });
  g.monsters = [m]; g.combat = m.id;
  g.encounter = { enemyId: m.id, origin: "inspection", engaged: false, exchanges: 0 };
  return m;
}
describe("rare creatures and keyless magic", () => {
  it("spawns 0–2 villagers and much fewer rare enemies on every floor", () => {
    let rare = 0, ordinary = 0; const villageCounts = new Set<number>();
    for (let seed = 1; seed <= 80; seed++) {
      const g = newGame("Spawn", "Scout", "Wind", 0, seed);
      villageCounts.add(g.monsters.filter((m) => !!m.merchant).length);
      for (const m of g.monsters.filter((m) => !m.boss && !m.key && !m.merchant && !m.npc)) {
        if (["Gremlin", "Shadow", "Robot", "Dark Fairy", "Wild Villager"].includes(m.className)) rare++;
        else ordinary++;
      }
    }
    expect(villageCounts).toEqual(new Set([0, 1, 2]));
    expect(rare).toBeGreaterThan(0);
    expect(rare).toBeLessThan(ordinary / 10);
    let lateRare = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const g = newGame("Late spawn", "Scout", "Wind", 0, seed);
      g.floor = 4; generateFloor(g);
      expect(g.monsters.filter((m) => !!m.merchant).length).toBeLessThanOrEqual(2);
      lateRare += g.monsters.filter((m) => ["Gremlin", "Shadow", "Robot", "Dark Fairy", "Wild Villager"].includes(m.className)).length;
    }
    expect(lateRare).toBeGreaterThan(0);
  });
  it("reserves weighted gold pots for gremlins and pays EXP", () => {
    let g = arena(2); const m = target(g, "Gremlin"); m.hp = 1; m.stats.Speed = 0;
    g = act(g, { type: "attack" });
    const pot = g.loot.find((l) => l.item.name === "Pot of Gold")?.item;
    expect(pot).toBeDefined(); expect(pot!.value).toBeGreaterThanOrEqual(1); expect(pot!.value).toBeLessThanOrEqual(50);
    expect(g.xp).toBeGreaterThan(0);
    const beforeGold = g.player.gold || 0;
    g = act(g, { type: "move", dx: 1, dy: 0 });
    expect(g.player.gold).toBe(beforeGold + pot!.value);
    expect(g.loot.some((l) => l.item.id === pot!.id)).toBe(false);
    expect(catalogItems(g).some((i) => i.name === "Pot of Gold")).toBe(false);
    expect(Array.from({ length: 100 }, () => randomItem(g)).some((i) => i.name === "Pot of Gold")).toBe(false);
    const values = Array.from({ length: 1000 }, () => makeItem(g, "Pot of Gold").value);
    expect(values.reduce((a, b) => a + b) / values.length).toBeGreaterThan(8);
    expect(values.reduce((a, b) => a + b) / values.length).toBeLessThan(13);
  });
  it("explodes on robot death and hits nearby actors, but not distant ones", () => {
    let g = arena(3); const robot = target(g, "Robot"); robot.hp = 1; robot.stats.Speed = 0;
    const near = makeMonster(g, "Zombie", 1), far = makeMonster(g, "Zombie", 1);
    Object.assign(near, { x: 7, y: 7, hp: 20 }); Object.assign(far, { x: 10, y: 7, hp: 20 });
    g.monsters.push(near, far); const hp = g.player.hp;
    g = act(g, { type: "attack" });
    expect(g.player.hp).toBeLessThan(hp);
    expect(g.monsters.find((m) => m.id === near.id)!.hp).toBeLessThan(20);
    expect(g.monsters.find((m) => m.id === far.id)!.hp).toBe(20);
    expect(g.log.some((line) => line.includes("robot explodes"))).toBe(true);
    let doomed = arena(13); const dyingRobot = target(doomed, "Robot");
    dyingRobot.hp = 1; dyingRobot.stats.Speed = 0;
    doomed.player.hp = 1; doomed.xp = 99;
    doomed = act(doomed, { type: "attack" });
    expect(doomed.status).toBe("dead");
    expect(doomed.player.hp).toBe(0);
  });
  it("gives dark fairies rarer loot and wild villagers EXP, curse and a delayed ghost", () => {
    let g = arena(4); const fairy = target(g, "Dark Fairy"); fairy.hp = 1; fairy.stats.Speed = 0;
    g = act(g, { type: "attack" });
    expect(g.loot[0].item.rarity).toBeGreaterThanOrEqual(3);
    g = arena(5); const wild = target(g, "Wild Villager"); wild.hp = 1; wild.stats.Speed = 0;
    g = act(g, { type: "attack" });
    expect(g.xp).toBeGreaterThan(0); expect(g.player.effects.Curse).toBeDefined();
    expect(g.haunting).toHaveLength(1);
    for (let n = 0; n < 5; n++) g = act(g, { type: "wait" });
    expect(g.monsters.some((m) => m.className === "Ghost")).toBe(true);
  });
  it("makes shadows hard to flee, move twice, ambush and harm NPCs", () => {
    const g = arena(6); const shadow = target(g, "Shadow", 12, 7); g.combat = undefined;
    expect(fleeChance(g.player, shadow)).toBe(0.12);
    let doubleMove = false;
    for (let seed = 1; seed <= 100; seed++) {
      const trial = structuredClone(g); trial.seed = seed;
      const after = act(trial, { type: "wait" });
      if (Math.abs(after.monsters[0].x - 12) + Math.abs(after.monsters[0].y - 7) === 2) doubleMove = true;
    }
    expect(doubleMove).toBe(true);
    let evenMove = false;
    for (let seed = 1; seed <= 100; seed++) {
      const trial = structuredClone(g); trial.seed = seed; trial.turn = 1;
      trial.player.stats.Speed = 1;
      const after = act(trial, { type: "wait" });
      const distance = Math.abs(after.monsters[0].x - 12) + Math.abs(after.monsters[0].y - 7);
      expect(distance).toBeLessThanOrEqual(2);
      if (distance > 0) evenMove = true;
    }
    expect(evenMove).toBe(true);
    let struck = false;
    for (let seed = 1; seed <= 200 && !struck; seed++) {
      const trial = arena(seed); const attacker = target(trial, "Shadow", 6, 7);
      trial.combat = undefined; attacker.stats.Accuracy = 1000; attacker.stats.Power = 10;
      const villager = makeVillager(trial); Object.assign(villager, { x: 7, y: 7 }); trial.monsters.push(villager);
      const after = act(trial, { type: "wait" });
      struck = after.log.some((line) => line.includes("Shadow attacks")) && !after.player.effects.Curse;
    }
    expect(struck).toBe(true);
    let struckChief = false;
    for (let seed = 1; seed <= 200 && !struckChief; seed++) {
      const trial = arena(seed); const attacker = target(trial, "Shadow", 6, 7);
      trial.combat = undefined; attacker.stats.Accuracy = 1000;
      const chief = makeChief(trial); Object.assign(chief, { x: 7, y: 7 }); trial.monsters.push(chief);
      struckChief = act(trial, { type: "wait" }).log.some((line) => line.includes("Shadow attacks " + chief.name));
    }
    expect(struckChief).toBe(true);
    const approaches = (type: string) => {
      let encounters = 0;
      for (let seed = 1; seed <= 300; seed++) {
        const trial = arena(seed); target(trial, type, 6, 7); trial.combat = undefined;
        trial.player.stats.Speed = 1;
        if (act(trial, { type: "wait" }).encounter?.origin === "enemy") encounters++;
      }
      return encounters;
    };
    expect(approaches("Shadow")).toBeGreaterThan(approaches("Zombie"));
  });
  it("befriends an ordinary enemy, unseals keyed objects, and burns moving enemies", () => {
    let g = arena(7); const m = target(g, "Zombie"); g.player.weapons = [makeItem(g, "Water Staff")];
    g = act(g, { type: "cast", spell: "Befriend" });
    expect(g.combat).toBeUndefined(); expect(g.monsters[0].merchant).toBeDefined();
    expect(g.monsters[0].x).toBe(m.x); expect(g.xp).toBe(0);
    const guarded = arena(14); const boss = target(guarded, "Zombie");
    boss.boss = true; guarded.player.weapons = [makeItem(guarded, "Water Staff")];
    expect(availableSpells(guarded).some((s) => s.name === "Befriend")).toBe(false);
    expect(() => act(guarded, { type: "cast", spell: "Befriend" })).toThrow("Spell unavailable");
    expect(guarded.player.stats.Mana).toBe(10);
    g = arena(8); g.player.weapons = [makeItem(g, "Wind Staff")];
    addChest(g, 6, 7); expect(availableSpells(g).some((s) => s.name === "Unseal")).toBe(true);
    g = act(g, { type: "cast", spell: "Unseal" });
    expect(g.chests![0].opened).toBe(true); expect(g.pendingLoot).toBeDefined(); expect(g.inventory.some((i) => i.kind === "key")).toBe(false);
    g = arena(10); g.player.weapons = [makeItem(g, "Wind Staff")];
    const door = addSecretDoor(g, "chest"); Object.assign(g.player, { x: door.x - 1, y: door.y });
    g = act(g, { type: "cast", spell: "Unseal" });
    expect(g.inSecret).toBe(door.id); expect(g.secretDoors![0].unlocked).toBe(true);
    g = arena(11); g.player.weapons = [makeItem(g, "Wind Staff")]; g.stairs = { x: 6, y: 7, locked: true };
    g = act(g, { type: "cast", spell: "Unseal" }); expect(g.stairs.locked).toBe(false); expect(g.keys).toBe(0);
    g = arena(9); g.player.weapons = [makeItem(g, "Fire Staff")]; const victim = target(g, "Robot");
    g = act(g, { type: "cast", spell: "Kindle" }); expect(g.monsters[0].burn?.[0]).toBe(4);
    const hp = g.monsters[0].hp; g = act(g, { type: "attack" });
    expect(g.monsters[0]?.hp).toBeLessThan(hp); expect(g.log.some((line) => line.includes("fire damage"))).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  act,
  newGame,
  makeItem,
  makeMonster,
  availableSpells,
  generateFloor,
} from "../shared/engine";
import {
  makeVillager,
  marketValue,
  addChest,
  addSecretDoor,
  makeChief,
  catalogItems,
} from "../shared/expansion";
import type { Game } from "../shared/types";
function arena(seed = 1) {
  const g = newGame("Ashfall tester", "Scout", "Wind", 0, seed);
  g.tiles = Array.from({ length: 15 }, (_, y) =>
    Array.from({ length: 30 }, (_, x) =>
      x === 0 || x === 29 || y === 0 || y === 14 ? 1 : 0,
    ),
  );
  g.light = g.tiles.map((r) => r.map(() => false));
  Object.assign(g.player, { x: 5, y: 7, hp: 100 });
  g.player.stats = {
    Health: 100,
    Power: 10,
    Magic: 100,
    Speed: 100,
    Accuracy: 1000,
    Luck: 0,
    Mana: 10,
    Armor: 0,
  };
  g.monsters = [];
  g.loot = [];
  g.pods = [];
  g.inventory = [];
  g.chests = [];
  g.secretDoors = [];
  g.haunting = [];
  g.stairs = { x: 27, y: 13, locked: false };
  g.capacity = 100;
  return g;
}
function use(g: Game, name: string) {
  const item = makeItem(g, name);
  g.inventory.push(item);
  return act(g, { type: "use", id: item.id });
}
function meet(g: Game, king = false) {
  const m = makeVillager(g, king);
  Object.assign(m, { x: 6, y: 7 });
  g.monsters = [m];
  return act(g, { type: "move", dx: 1, dy: 0 });
}
function staff(g: Game, element: string) {
  g.player.weapons = [makeItem(g, element + " Staff")];
}
describe("Ashfall playthroughs", () => {
  it("seismic hits all actors for exactly five through armor", () => {
    let g = arena();
    g.player.stats.Armor = 900;
    const actors = [makeMonster(g, "Golem", 1), makeChief(g), makeVillager(g)];
    for (const [i, m] of actors.entries()) {
      Object.assign(m, { x: 7 + i, y: 7, hp: 20 });
      m.stats.Armor = 900;
    }
    g.monsters = actors;
    g = use(g, "Seismic Shocker");
    expect(g.player.hp).toBe(95);
    expect(g.monsters.map((m) => m.hp)).toEqual([15, 15, 15]);
    expect(g.inventory).toHaveLength(0);
  });
  it("seismic resolves player and villager deaths with no villager rewards", () => {
    let g = meet(arena());
    g.combat = undefined;
    g.player.hp = 5;
    g = use(g, "Seismic Shocker");
    expect(g.status).toBe("dead");
    expect(g.xp).toBe(0);
    expect(g.loot).toHaveLength(0);
    expect(g.haunting).toHaveLength(1);
  });
  it("antibody cures poison permanently, survives cleanse/reload and blocks snake hits", () => {
    let g = arena();
    g.player.effects.Poison = [5, 2];
    g = use(g, "Poison Antibody");
    expect(g.player.effects.Poison).toBeUndefined();
    staff(g, "Water");
    g = act(JSON.parse(JSON.stringify(g)), { type: "cast", spell: "Cleanse" });
    expect(g.player.poisonImmune).toBe(true);
    const m = makeMonster(g, "Snake", 1);
    m.stats.Accuracy = 9001;
    m.stats.Power = 1;
    m.stats.Speed = 9001;
    m.poison = [8, 5];
    g.monsters = [m];
    g.combat = m.id;
    g = act(g, { type: "attack", unarmed: true });
    expect(g.player.effects.Poison).toBeUndefined();
  });
  for (const stat of [
    "Health",
    "Power",
    "Speed",
    "Luck",
    "Accuracy",
    "Magic",
    "Armor",
  ])
    it(`doubles ${stat} permanently`, () => {
      let g = arena();
      g.player.stats[stat] = 7;
      if (stat === "Health") g.player.hp = 7;
      g = use(g, stat + " Doubler");
      expect(g.player.stats[stat]).toBe(14);
      if (stat === "Health") expect(g.player.hp).toBe(14);
      expect(g.inventory).toHaveLength(0);
    });
  for (const [name, value, rarity] of [
    ["1 Gold Coin", 1, 0],
    ["5 Gold Coins", 5, 2],
    ["10 Gold Coins", 10, 4],
    ["20 Gold Coins", 20, 7],
  ] as const)
    it(`collects ${name} through a full bag`, () => {
      let g = arena();
      g.capacity = 0;
      const item = makeItem(g, name);
      expect(item.rarity).toBe(rarity);
      g.loot = [{ x: 5, y: 7, item }];
      g.pendingLoot = item;
      g = act(g, { type: "pickup" });
      expect(g.player.gold).toBe(value);
      expect(g.inventory).toHaveLength(0);
      expect(g.loot).toHaveLength(0);
      expect(JSON.parse(JSON.stringify(g)).player.gold).toBe(value);
    });
  it("villagers have 3–5 fixed offers, weak stats and persistent, nonduplicated stories", () => {
    for (let seed = 0; seed < 40; seed++) {
      let g = meet(arena(seed));
      const m = g.monsters[0];
      expect(m.hp).toBe(3);
      expect(m.stats.Power).toBe(1);
      expect(m.stats.Speed).toBe(45);
      expect(m.merchant!.stock.length).toBeGreaterThanOrEqual(3);
      expect(m.merchant!.stock.length).toBeLessThanOrEqual(5);
      const offers = structuredClone(m.merchant!.stock);
      g = act(g, { type: "talk" });
      g = act(JSON.parse(JSON.stringify(g)), { type: "talk" });
      expect(g.monsters[0].merchant!.stock).toEqual(offers);
      expect(g.chronicles).toHaveLength(1);
    }
  });
  it("buying is atomic, consumes an offer once and rejects remote/poor/full-bag purchases", () => {
    let g = meet(arena());
    const item = makeItem(g, "Throwing Knife");
    g.monsters[0].merchant!.stock = [{ item, price: 25 }];
    g.player.gold = 24;
    expect(() => act(g, { type: "buy", id: item.id })).toThrow("gold");
    g.player.gold = 100;
    g.capacity = 0;
    const before = structuredClone(g);
    expect(() => act(g, { type: "buy", id: item.id })).toThrow("bag");
    expect(g).toEqual(before);
    g.capacity = 100;
    g = act(g, { type: "buy", id: item.id });
    expect(g.player.gold).toBe(75);
    expect(g.inventory[0].id).toBe(item.id);
    expect(() => act(g, { type: "buy", id: item.id })).toThrow("sold out");
    g = act(g, { type: "leave" });
    expect(() => act(g, { type: "buy", id: item.id })).toThrow("No villager");
  });
  it("sell quotes persist below market, refusals retain items, wanted offers reach 3x", () => {
    let g = meet(arena());
    const normal = makeItem(g, "Small Health Potion"),
      wanted = makeItem(g, "Fragile Axe"),
      refused = makeItem(g, "Throwing Knife");
    g.inventory = [normal, wanted, refused];
    g.monsters[0].merchant!.wanted = wanted.name;
    g.monsters[0].merchant!.premium = 3;
    g.monsters[0].merchant!.dislikes = ["projectile"];
    g = act(g, { type: "quote", id: normal.id });
    const price = g.monsters[0].merchant!.buyPrices[normal.id]!;
    expect(price).toBeLessThan(marketValue(normal));
    const seed = g.seed;
    g = act(JSON.parse(JSON.stringify(g)), { type: "quote", id: normal.id });
    expect(g.seed).toBe(seed);
    expect(g.monsters[0].merchant!.buyPrices[normal.id]).toBe(price);
    g = act(g, { type: "sell", id: normal.id });
    expect(g.player.gold).toBe(price);
    g = act(g, { type: "quote", id: wanted.id });
    expect(g.monsters[0].merchant!.buyPrices[wanted.id]).toBe(
      marketValue(wanted) * 3,
    );
    g = act(g, { type: "sell", id: refused.id });
    expect(g.inventory.some((i) => i.id === refused.id)).toBe(true);
    expect(g.marketNotice).toContain(g.monsters[0].merchant!.refusal);
  });
  it("villager death curses through immunity, gives no rewards and spawns a ghost exactly five turns later", () => {
    let g = meet(arena());
    const v = g.monsters[0];
    g.player.poisonImmune = true;
    g = act(g, { type: "attack" });
    expect(g.xp).toBe(0);
    expect(g.score).toBe(0);
    expect(g.loot).toHaveLength(0);
    expect(g.log.some((l) => l.includes(v.name + ": “"))).toBe(true);
    expect(g.player.effects.Curse).toEqual([12, 3]);
    for (let n = 1; n <= 5; n++) {
      g = act(JSON.parse(JSON.stringify(g)), { type: "wait" });
      expect(g.monsters.filter((m) => m.className === "Ghost")).toHaveLength(
        n === 5 ? 1 : 0,
      );
    }
    expect([g.monsters[0].x, g.monsters[0].y]).toEqual([v.x, v.y]);
    expect(g.player.hp).toBe(85);
    g = use(g, "Poison Antidote");
    expect(g.player.effects.Curse).toBeUndefined();
  });
  it("occupied ghost spawns defer safely; a damaging ghost hit can curse", () => {
    let g = arena();
    g.haunting = [{ x: 5, y: 7, due: 1, name: "Pip" }];
    g = act(g, { type: "wait" });
    expect(g.monsters).toHaveLength(0);
    g = act(g, { type: "move", dx: 0, dy: 1 });
    const m = g.monsters[0];
    expect(m.className).toBe("Ghost");
    g.combat = m.id;
    m.curseChance = 1;
    m.stats.Accuracy = 9001;
    m.stats.Speed = 9001;
    g.player.stats.Power = 0;
    g.player.poisonImmune = true;
    g = act(g, { type: "attack" });
    expect(g.player.effects.Curse).toBeTruthy();
  });
  it("curse exceeds existing poison and an antidote clears both", () => {
    let g = meet(arena());
    g.player.effects.Poison = [20, 8];
    g = act(g, { type: "attack" });
    expect(g.player.effects.Curse).toEqual([26, 10]);
    g = use(g, "Poison Antidote");
    expect(g.player.effects).toEqual({});
  });
  it("Summon samples all outcomes, mainly villagers, and rejects a blocked space without charging mana", () => {
    const count: Record<string, number> = {};
    for (let seed = 0; seed < 160; seed++) {
      let g = arena(seed);
      staff(g, "Wind");
      g = act(g, { type: "cast", spell: "Summon" });
      expect(g.player.stats.Mana).toBe(1);
      const m = g.monsters[0],
        kind = m.merchant ? "villager" : m.npc ? "chief" : "monster";
      count[kind] = (count[kind] || 0) + 1;
      expect(Math.abs(m.x - 5) + Math.abs(m.y - 7)).toBe(1);
    }
    expect(count.villager).toBeGreaterThan(count.chief + count.monster);
    expect(count.chief).toBeGreaterThan(0);
    expect(count.monster).toBeGreaterThan(0);
    const g = arena();
    staff(g, "Wind");
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      g.tiles[7 + dy][5 + dx] = 1;
    const before = structuredClone(g);
    expect(() => act(g, { type: "cast", spell: "Summon" })).toThrow("adjacent");
    expect(g).toEqual(before);
  });
  it("Alchemize requires advanced Magic and exchanges mana for 3–25 gold", () => {
    let g = arena();
    staff(g, "Fire");
    g.player.stats.Magic = 24;
    expect(availableSpells(g).some((s) => s.name === "Alchemize")).toBe(false);
    g.player.stats.Magic = 25;
    g = act(g, { type: "cast", spell: "Alchemize" });
    expect(g.player.stats.Mana).toBe(2);
    expect(g.player.gold).toBeGreaterThanOrEqual(3);
    expect(g.player.gold).toBeLessThanOrEqual(25);
  });
  it("standard keys open chests first, rewards persist and cannot be duplicated", () => {
    let g = arena();
    const c = addChest(g, 6, 7),
      standard = makeItem(g, "Standard Key"),
      rare = makeItem(g, "Rare Key");
    g.inventory = [rare, standard];
    g = act(g, { type: "move", dx: 1, dy: 0 });
    expect(g.pendingChest).toBe(c.id);
    g = act(JSON.parse(JSON.stringify(g)), { type: "open-chest", id: c.id });
    expect(g.inventory.map((i) => i.id)).toEqual([rare.id]);
    expect(g.pendingLoot!.id).toBe(c.reward.id);
    g = act(g, { type: "pickup" });
    expect(() => act(g, { type: "open-chest", id: c.id })).toThrow();
  });
  it("locked chests reject missing keys and remote access; loot strongly favors rare+", () => {
    let rares = 0;
    for (let seed = 0; seed < 160; seed++) {
      const g = arena(seed),
        c = addChest(g, 6, 7);
      if (c.reward.rarity >= 6) rares++;
      expect(() => act(g, { type: "open-chest", id: c.id })).toThrow("Key");
      g.inventory = [makeItem(g, "Rare Key")];
      c.x = 20;
      const before = structuredClone(g);
      expect(() => act(g, { type: "open-chest", id: c.id })).toThrow("reach");
      expect(g).toEqual(before);
    }
    expect(rares).toBeGreaterThan(96);
  });
  for (const outcome of ["chest", "ultra", "chief", "emperor", "king"])
    it(`enters and returns from a ${outcome} chamber, with save/reload and reusable open door`, () => {
      let g = arena();
      const d = addSecretDoor(g, outcome);
      Object.assign(g.player, { x: 28, y: d.y });
      g.inventory = [makeItem(g, "Standard Key")];
      g = act(g, { type: "move", dx: 1, dy: 0 });
      expect(g.pendingDoor).toBe(d.id);
      expect(() => act(g, { type: "unlock-door", id: d.id })).toThrow(
        "Rare Key",
      );
      const rare = makeItem(g, "Rare Key");
      g.inventory.push(rare);
      g = act(g, { type: "unlock-door", id: d.id });
      expect(g.player.x).toBe(34);
      expect(g.inventory.some((i) => i.id === rare.id)).toBe(false);
      g = JSON.parse(JSON.stringify(g));
      if (["chest", "ultra"].includes(outcome)) {
        expect(g.chests![0].locked).toBe(false);
        if (outcome === "ultra")
          expect(g.chests![0].reward.rarity).toBeGreaterThanOrEqual(6);
      } else if (outcome === "king")
        expect(g.monsters[0].merchant!.stock.length).toBe(
          Math.ceil(catalogItems(arena()).length / 2),
        );
      else
        expect(g.monsters[0].npc!.tribe === "Emperor").toBe(
          outcome === "emperor",
        );
      g = act(g, { type: "move", dx: -1, dy: 0 });
      g = act(g, { type: "move", dx: -1, dy: 0 });
      expect(g.inSecret).toBeUndefined();
      expect([g.player.x, g.player.y]).toEqual([28, d.y]);
      g = act(g, { type: "move", dx: 1, dy: 0 });
      expect(g.inSecret).toBe(d.id);
    });
  it("ultrarare chests always give rare+ and sometimes ultrarare", () => {
    let ultra = 0;
    for (let seed = 0; seed < 100; seed++) {
      const c = addChest(arena(seed), 6, 7, false, true);
      expect(c.reward.rarity).toBeGreaterThanOrEqual(6);
      if (c.reward.rarity >= 9) ultra++;
    }
    expect(ultra).toBeGreaterThan(0);
  });
  it("emperor bargains charge distinct costs and give meaningful rewards", () => {
    for (const deal of [
      "Imperial Treasury",
      "Crown of Plenty",
      "Royal Ascension",
    ]) {
      let g = arena();
      const m = makeChief(g, true);
      m.npc!.deal = deal;
      g.monsters = [m];
      g.combat = m.id;
      g.player.gold = 100;
      g = act(g, { type: "deal" });
      expect(g.monsters[0].npc!.done).toBe(true);
      if (deal === "Imperial Treasury") {
        expect(g.player.gold).toBe(200);
        expect(g.player.hp).toBe(95);
      }
      if (deal === "Crown of Plenty") {
        if (g.pendingLoot) {
          expect(g.player.gold).toBe(60);
          expect(g.pendingLoot.rarity).toBeGreaterThanOrEqual(6);
        } else {
          // A coin gift goes directly to the purse, never to inspection.
          expect(g.player.gold).toBe(80);
          expect(g.loot).toHaveLength(0);
        }
      }
      if (deal === "Royal Ascension") {
        expect(g.player.stats.Health).toBe(90);
        expect(g.player.stats.Power).toBe(20);
      }
    }
  });
  it("full-bag pickup swaps atomically or leaves the incoming item without spending a turn", () => {
    for (const leave of [true, false]) {
      let g = arena();
      g.capacity = 1;
      const old = makeItem(g, "Throwing Knife"),
        incoming = makeItem(g, "Rare Key");
      g.inventory = [old];
      g.loot = [{ x: 5, y: 7, item: incoming }];
      g.pendingLoot = incoming;
      const before = structuredClone(g);
      expect(() => act(g, { type: "pickup" })).toThrow("full");
      expect(g).toEqual(before);
      g = act(g, { type: "pickup-swap", id: leave ? incoming.id : old.id });
      expect(g.inventory[0].id).toBe(leave ? old.id : incoming.id);
      expect(g.loot[0].item.id).toBe(leave ? incoming.id : old.id);
      expect(g.pendingLoot).toBeUndefined();
      expect(g.turn).toBe(0);
    }
  });
  it("rejects forged swaps and supports picking up ignored but reachable loot", () => {
    let g = arena();
    const i = makeItem(g, "Rare Key");
    g.loot = [{ x: 5, y: 7, item: i }];
    g.pendingLoot = i;
    expect(() => act(g, { type: "pickup-swap", id: "fake" })).toThrow("Choose");
    g = act(g, { type: "ignore" });
    g = act(g, { type: "pickup", id: i.id });
    expect(g.inventory[0].id).toBe(i.id);
  });
  it("new floors preserve purse, immunity and history while discarding room state", () => {
    const g = arena();
    g.player.gold = 81;
    g.player.poisonImmune = true;
    g.chronicles = ["one"];
    g.inSecret = "old";
    g.haunting = [{ x: 3, y: 3, due: 5, name: "old" }];
    generateFloor(g);
    expect(g.player.gold).toBe(81);
    expect(g.player.poisonImmune).toBe(true);
    expect(g.chronicles).toEqual(["one"]);
    expect(g.inSecret).toBeUndefined();
    expect(g.haunting).toEqual([]);
  });
});

it("a closed chest cannot permanently block a corridor, and a Rare Key also opens a normal chest", () => {
  let g = arena();
  const c = addChest(g, 6, 7);
  g = act(g, { type: "move", dx: 1, dy: 0 });
  expect(g.player.x).toBe(6);
  g = act(g, { type: "dismiss-object" });
  g = act(g, { type: "move", dx: 1, dy: 0 });
  expect(g.player.x).toBe(7);
  g.inventory = [makeItem(g, "Rare Key")];
  g = act(g, { type: "open-chest", id: c.id });
  expect(g.pendingLoot).toBeTruthy();
  expect(g.inventory).toHaveLength(0);
});
it("full-bag swap can release a single equipped weapon slot", () => {
  let g = arena();
  g.capacity = 1;
  const old = makeItem(g, "Fragile Sword"),
    incoming = makeItem(g, "Rare Key");
  g.player.weapons = [old];
  g.inventory = [];
  g.pendingLoot = incoming;
  g.loot = [{ x: 5, y: 7, item: incoming }];
  g = act(g, { type: "pickup-swap", id: old.id });
  expect(g.player.weapons).toHaveLength(0);
  expect(g.inventory[0].id).toBe(incoming.id);
  expect(g.loot[0].item.id).toBe(old.id);
});

it("secret-room entry and exit never overlap an actor that moved into the landing spot", () => {
  let g = arena();
  const d = addSecretDoor(g, "chest");
  Object.assign(g.player, { x: 28, y: d.y });
  g.inventory = [makeItem(g, "Rare Key")];
  g = act(g, { type: "unlock-door", id: d.id });
  const blocker = makeVillager(g);
  Object.assign(blocker, { x: 28, y: d.y });
  g.monsters.push(blocker);
  Object.assign(g.player, { x: 33, y: 7 });
  g = act(g, { type: "move", dx: -1, dy: 0 });
  expect(g.monsters.some((m) => m.x === g.player.x && m.y === g.player.y)).toBe(
    false,
  );
  g.monsters = [];
  Object.assign(g.player, { x: 28, y: d.y });
  const roomBlocker = makeVillager(g);
  Object.assign(roomBlocker, { x: 34, y: 7 });
  g.monsters = [roomBlocker];
  g = act(g, { type: "move", dx: 1, dy: 0 });
  expect(g.inSecret).toBe(d.id);
  expect(g.player.x === 34 && g.player.y === 7).toBe(false);
});

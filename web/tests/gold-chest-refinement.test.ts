import { expect, it } from "vitest";
import { act, makeItem, newGame } from "../shared/engine";
import { addChest } from "../shared/expansion";
function arena() {
  const g = newGame("Coin tester", "Scout", "Wind", 0, 93);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  Object.assign(g.player, { x: 10, y: 7 });
  g.monsters = [];
  g.loot = [];
  g.pods = [];
  g.chests = [];
  g.secretDoors = [];
  g.player.gold = 0;
  g.capacity = 0;
  return g;
}
it("collects every coin in a mixed pile on entry, with a full bag and no gold inspection", () => {
  let g = arena();
  const potion = makeItem(g, "Tiny Health Potion");
  g.loot.push({ x: 11, y: 7, item: potion });
  for (const amount of [1, 5, 10, 20])
    g.loot.push({
      x: 11,
      y: 7,
      item: makeItem(g, `${amount} Gold Coin${amount === 1 ? "" : "s"}`),
    });
  const turn = g.turn;
  g = act(g, { type: "move", dx: 1, dy: 0 });
  expect(g.player.gold).toBe(36);
  expect(g.pendingLoot?.id).toBe(potion.id);
  expect(g.loot.map((l) => l.item.id)).toEqual([potion.id]);
  expect(g.inventory.filter((i) => i.kind === "gold")).toHaveLength(0);
  expect(g.turn).toBe(turn + 1);
  g = act(g, { type: "move", dx: 1, dy: 0 });
  g = act(g, { type: "move", dx: -1, dy: 0 });
  expect(g.player.gold).toBe(36);
});
it("collects gold chest rewards immediately without an inspection or extra turn", () => {
  let g = arena();
  const chest = addChest(g, 11, 7, false);
  chest.reward = makeItem(g, "20 Gold Coins");
  const before = g.turn;
  g = act(g, { type: "open-chest", id: chest.id });
  expect(g.player.gold).toBe(20);
  expect(g.pendingLoot).toBeUndefined();
  expect(g.loot).toHaveLength(0);
  expect(g.turn).toBe(before);
});
it("moves straight away from an active chest prompt without opening or consuming a key", () => {
  let g = arena();
  const c = addChest(g, 11, 7);
  g.inventory = [makeItem(g, "Standard Key")];
  g = act(g, { type: "move", dx: 1, dy: 0 });
  expect(g.pendingChest).toBe(c.id);
  const turn = g.turn;
  g = act(g, { type: "move", dx: 0, dy: 1 });
  expect(g.pendingChest).toBeUndefined();
  expect(g.chests![0].opened).toBe(false);
  expect(g.inventory[0].name).toBe("Standard Key");
  expect(g.turn).toBe(turn + 1);
});
it("generates one or two ordinary chests per floor, averaging about 1.5", () => {
  const counts = Array.from(
    { length: 160 },
    (_, seed) => newGame("Explorer", "Scout", "Wind", 0, seed).chests!.length,
  );
  for (const count of counts) expect([1, 2]).toContain(count);
  const average = counts.reduce((a, b) => a + b, 0) / counts.length;
  expect(average).toBeGreaterThan(1.3);
  expect(average).toBeLessThan(1.7);
});

it("does not reveal villager death consequences in the Seismic Shocker description", () => {
  const item = makeItem(arena(), "Seismic Shocker");
  expect(item.description).not.toMatch(/villager|curse|ghost/i);
});
it("requires a Stair Key to ascend; Standard and Rare Keys remain separate inventory items", () => {
  let g = arena();
  Object.assign(g.stairs, { x: 10, y: 7, locked: true });
  g.inventory = [makeItem(g, "Standard Key"), makeItem(g, "Rare Key")];
  for (const item of g.inventory)
    expect(item.description).toContain("not stairs");
  expect(() => act(g, { type: "ascend" })).toThrow("Stair Key");
  expect(g.keys).toBe(0);
  const ids = g.inventory.map((i) => i.id);
  g.keys = 1;
  g = act(g, { type: "ascend" });
  expect(g.keys).toBe(0);
  expect(g.floor).toBe(1);
  expect(g.inventory.map((i) => i.id)).toEqual(ids);
});
it("a Stair Key cannot open a chest or be spent as a chest key", () => {
  let g = arena();
  g.keys = 1;
  g.inventory = [];
  const chest = addChest(g, 11, 7);
  expect(() => act(g, { type: "open-chest", id: chest.id })).toThrow(
    "Standard Key or Rare Key",
  );
  expect(g.keys).toBe(1);
  g.inventory = [makeItem(g, "Standard Key")];
  g = act(g, { type: "open-chest", id: chest.id });
  expect(g.keys).toBe(1);
  expect(g.inventory).toHaveLength(0);
});

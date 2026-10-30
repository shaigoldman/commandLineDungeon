import { it, expect } from "vitest";
import request from "supertest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../server/store";
import { createApp } from "../server/app";
import { newGame, makeItem } from "../shared/engine";
import { makeVillager, addSecretDoor } from "../shared/expansion";
it("API persists gold, fixed merchant offers and room state; rejects forged prices and stale/remote sales", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ashfall-api-"));
  const store = new Store("", dir);
  await store.init();
  const key = "b".repeat(64);
  const headers = { Authorization: "Bearer " + key };
  const app = createApp(store);
  try {
    const g = newGame("API shopper", "Scout", "Wind", 0, 3);
    const m = makeVillager(g);
    Object.assign(m, { x: g.player.x + 1, y: g.player.y });
    g.monsters = [m];
    g.combat = m.id;
    g.player.gold = 100;
    g.capacity = 20;
    const item = makeItem(g, "Rare Key");
    m.merchant!.stock = [{ item, price: 25 }];
    await store.put(key, g);
    const bought = await request(app)
      .post("/api/action")
      .set(headers)
      .send({
        revision: 0,
        action: { type: "buy", id: item.id, price: -9000, gold: 90000 },
      });
    expect(bought.status).toBe(200);
    expect(bought.body.game.player.gold).toBe(75);
    expect(
      bought.body.game.inventory.some((i: { id: string }) => i.id === item.id),
    ).toBe(true);
    expect(
      (
        await request(app)
          .post("/api/action")
          .set(headers)
          .send({ revision: 0, action: { type: "buy", id: item.id } })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post("/api/action")
          .set(headers)
          .send({ revision: 1, action: { type: "sell", id: "invented" } })
      ).status,
    ).toBe(400);
    const reopened = new Store("", dir);
    await reopened.init();
    expect((await reopened.get(key))?.player.gold).toBe(75);
    expect((await reopened.get(key))?.monsters[0].merchant!.stock).toEqual([]);
    const saved = (await reopened.get(key))!;
    saved.combat = undefined;
    saved.monsters = [];
    const d = addSecretDoor(saved, "king");
    Object.assign(saved.player, { x: 28, y: d.y });
    saved.player.poisonImmune = true;
    await reopened.put(key, saved, saved.revision);
    const opened = await request(createApp(reopened))
      .post("/api/action")
      .set(headers)
      .send({ revision: 1, action: { type: "unlock-door", id: d.id } });
    expect(opened.status).toBe(200);
    expect(opened.body.game.inSecret).toBe(d.id);
    expect(opened.body.game.player.poisonImmune).toBe(true);
    const reloaded = new Store("", dir);
    await reloaded.init();
    expect((await reloaded.get(key))?.monsters[0].merchant!.king).toBe(true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

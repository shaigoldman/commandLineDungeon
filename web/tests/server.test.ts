import { describe, it, expect } from "vitest";
import request from "supertest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../server/store";
import { createApp } from "../server/app";
describe("saved games API", () => {
  it("creates, isolates, persists, reloads, and prevents stale writes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "dungeon-"));
    const store = new Store("", dir);
    await store.init();
    const app = createApp(store);
    try {
      expect((await request(app).get("/api/health")).status).toBe(200);
      expect((await request(app).get("/api/game")).status).toBe(404);
      const created = await request(app)
        .post("/api/games")
        .send({
          name: "Ada",
          className: "Mage",
          element: "Wind",
          difficulty: 0,
        });
      expect(created.status).toBe(201);
      const key = created.body.recoveryKey;
      expect(key).toHaveLength(64);
      const headers = { Authorization: "Bearer " + key };
      const moved = await request(app)
        .post("/api/action")
        .set(headers)
        .send({ revision: 0, action: { type: "wait" } });
      expect(moved.status).toBe(200);
      expect(moved.body.game.revision).toBe(1);
      expect(
        (
          await request(app)
            .post("/api/action")
            .set(headers)
            .send({ revision: 0, action: { type: "wait" } })
        ).status,
      ).toBe(409);
      const reopened = new Store("", dir);
      await reopened.init();
      const resumed = await request(createApp(reopened))
        .get("/api/game")
        .set(headers);
      expect(resumed.body.game).toEqual(moved.body.game);
      expect(
        (
          await request(app)
            .get("/api/game")
            .set("Authorization", "Bearer " + "0".repeat(64))
        ).status,
      ).toBe(404);
      expect(
        (
          await request(app)
            .post("/api/action")
            .set(headers)
            .send({ revision: 1, action: { type: "cast", spell: "Grow" } })
        ).status,
      ).toBe(400);
      expect(
        (await request(app).get("/api/game").set(headers)).body.game.revision,
      ).toBe(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("rejects malformed characters and cross-origin mutations", async () => {
    const dir = await mkdtemp(join(tmpdir(), "dungeon-"));
    const store = new Store("", dir);
    await store.init();
    const app = createApp(store);
    try {
      expect(
        (
          await request(app)
            .post("/api/games")
            .send({ name: "A", className: "Hacker" })
        ).status,
      ).toBe(400);
      expect(
        (
          await request(app)
            .post("/api/games")
            .set("Origin", "https://evil.example")
            .send({})
        ).status,
      ).toBe(403);
      expect((await request(app).post("/api/action").send({})).status).toBe(
        401,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

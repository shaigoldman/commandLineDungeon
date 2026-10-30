import { describe, it, expect } from "vitest";
import { LocalGameAPI, type DeviceStorage } from "../shared/local-api";
const options = {
  name: "Android tester",
  className: "Mage",
  element: "Wind",
  difficulty: 0,
};
function memory() {
  const map = new Map<string, string>();
  return {
    map,
    get: async (key: string) => map.get(key) || null,
    set: async (key: string, value: string) => {
      map.set(key, value);
    },
  };
}
describe("offline Android game saves", () => {
  it("plays the same rules, persists before success, and resumes across app instances", async () => {
    const storage = memory(),
      app = new LocalGameAPI(storage);
    expect((await app.request("game")).status).toBe(404);
    const created = await app.request("games", options),
      key = created.data.recoveryKey!;
    expect(created.status).toBe(201);
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(storage.map.size).toBe(1);
    const cast = await app.request(
      "action",
      { revision: 0, action: { type: "cast", spell: "Teleport" } },
      key,
    );
    expect(cast.ok).toBe(true);
    expect(cast.data.game?.player.stats.Mana).toBe(9);
    const resumed = await new LocalGameAPI(storage).request(
      "game",
      undefined,
      key,
    );
    expect(resumed.data.game).toEqual(cast.data.game);
    expect((await app.request("game", undefined, "0".repeat(64))).status).toBe(
      404,
    );
  });
  it("serializes overlapping actions and rejects stale writes", async () => {
    const storage = memory(),
      app = new LocalGameAPI(storage);
    const key = (await app.request("games", options)).data.recoveryKey!;
    const replies = await Promise.all([
      app.request("action", { revision: 0, action: { type: "wait" } }, key),
      app.request("action", { revision: 0, action: { type: "wait" } }, key),
    ]);
    expect(replies.map((r) => r.status)).toEqual([200, 409]);
    expect(
      (await app.request("game", undefined, key)).data.game?.revision,
    ).toBe(1);
  });
  it("retains multiple journeys and rejects invalid actions without changing a save", async () => {
    const storage = memory(),
      app = new LocalGameAPI(storage);
    const a = await app.request("games", options),
      b = await app.request("games", { ...options, name: "Another hero" });
    expect(a.data.recoveryKey).not.toBe(b.data.recoveryKey);
    expect(
      (await app.request("game", undefined, a.data.recoveryKey)).data.game
        ?.player.name,
    ).toBe("Android tester");
    expect(
      (
        await app.request(
          "action",
          { revision: 0, action: { type: "level", stat: "Power" } },
          a.data.recoveryKey,
        )
      ).status,
    ).toBe(400);
    expect(
      (await app.request("game", undefined, a.data.recoveryKey)).data.game
        ?.revision,
    ).toBe(0);
    expect(
      (await app.request("games", { ...options, className: ["Mage"] })).status,
    ).toBe(400);
  });
  it("does not claim an action was saved if device storage fails", async () => {
    const storage = memory(),
      app = new LocalGameAPI(storage);
    const key = (await app.request("games", options)).data.recoveryKey!;
    const failing: DeviceStorage = {
      get: storage.get,
      set: async () => {
        throw Error("Disk full");
      },
    };
    const r = await new LocalGameAPI(failing).request(
      "action",
      { revision: 0, action: { type: "wait" } },
      key,
    );
    expect(r.status).toBe(503);
    expect(r.data.game).toBeUndefined();
    expect(
      (await app.request("game", undefined, key)).data.game?.revision,
    ).toBe(0);
  });
  it("preserves unreadable or future saves instead of resetting them", async () => {
    const storage = memory();
    storage.map.set("dungeon.android.saves.v1", "invalid saved data");
    const r = await new LocalGameAPI(storage).request("games", options);
    expect(r.status).toBe(503);
    expect(storage.map.get("dungeon.android.saves.v1")).toBe(
      "invalid saved data",
    );
  });
});

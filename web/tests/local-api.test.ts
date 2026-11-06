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
      app.request("action", { revision: 0, action: { type: "move", dx: 0, dy: -1 } }, key),
      app.request("action", { revision: 0, action: { type: "move", dx: 0, dy: -1 } }, key),
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
      { revision: 0, action: { type: "move", dx: 0, dy: -1 } },
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

it("lists every device adventure by hero and original start date, including legacy saves without dates",async()=>{
 const storage=memory(),keys=["a".repeat(64),"b".repeat(64)],app=new LocalGameAPI(storage,()=>keys.shift()!);
 expect((await app.request("saved-adventures")).data.adventures).toEqual([]);
 const first=await app.request("games",{...options,name:"Liora"});
 const started=first.data.game!.startedAt!;expect(Number.isFinite(Date.parse(started))).toBe(true);
 const key=first.data.recoveryKey!;
 await app.request("action",{revision:0,action:{type:"cast",spell:"Teleport"}},key);
 expect((await app.request("game",undefined,key)).data.game!.startedAt).toBe(started);
 await app.request("games",{...options,name:"Elara"});
 const storeKey=[...storage.map.keys()][0],data=JSON.parse(storage.map.get(storeKey)!);delete data.games[key].startedAt;
 storage.map.set(storeKey,JSON.stringify(data));const before=storage.map.get(storeKey);
 const listed=await new LocalGameAPI(storage).request("saved-adventures");
 expect(listed.data.adventures).toHaveLength(2);expect(listed.data.adventures![0].heroName).toBe("Elara");
 expect(listed.data.adventures![1]).toMatchObject({id:key,heroName:"Liora"});expect(listed.data.adventures![1].startedAt).toBeUndefined();
 expect(storage.map.get(storeKey)).toBe(before);
 expect((await app.request("game",undefined,listed.data.adventures![1].id)).data.game!.player.name).toBe("Liora");
});

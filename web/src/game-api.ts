import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { LocalGameAPI, type GameResponse } from "../shared/local-api";
import { repairSecretRoomLighting } from "../shared/expansion";
function repairLighting(response: GameResponse): GameResponse {
  if (response.data.game) repairSecretRoomLighting(response.data.game);
  return response;
}
export const isDeviceGame =
  import.meta.env.MODE === "android" || Capacitor.isNativePlatform();
const device = new LocalGameAPI({
  get: async (key) => (await Preferences.get({ key })).value,
  set: async (key, value) => {
    await Preferences.set({ key, value });
  },
});
export async function requestGame(
  path: string,
  body?: unknown,
  key?: string,
): Promise<GameResponse> {
  if (isDeviceGame) return repairLighting(await device.request(path, body, key));
  const r = await fetch("/api/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: "Bearer " + key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return repairLighting({ ok: r.ok, status: r.status, data: await r.json() });
}

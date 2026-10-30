import { act, newGame } from "./engine";
import type { Game, Action } from "./types";
export interface DeviceStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
export interface GameResponse {
  ok: boolean;
  status: number;
  data: { game?: Game; recoveryKey?: string; score?: number; error?: string };
}
interface DeviceSaves {
  version: 1;
  games: Record<string, Game>;
  highScore: number;
}
const STORAGE_KEY = "dungeon.android.saves.v1";
const result = (status: number, data: GameResponse["data"]): GameResponse => ({
  ok: status < 400,
  status,
  data,
});
/** The Android test build runs the identical engine locally and commits before reporting success. */
export class LocalGameAPI {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private storage: DeviceStorage,
    private makeKey = () =>
      Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join(""),
  ) {}
  request(path: string, body?: unknown, key?: string): Promise<GameResponse> {
    const job = this.queue
      .catch(() => {})
      .then(() => this.handle(path, body, key));
    this.queue = job;
    return job;
  }
  private async handle(
    path: string,
    body?: unknown,
    key?: string,
  ): Promise<GameResponse> {
    let saves: DeviceSaves;
    try {
      const raw = await this.storage.get(STORAGE_KEY);
      saves = raw ? JSON.parse(raw) : { version: 1, games: {}, highScore: 0 };
      if (
        saves.version !== 1 ||
        !saves.games ||
        !Number.isFinite(saves.highScore)
      )
        throw Error("Invalid device save");
    } catch {
      return result(503, {
        error:
          "The saved journeys on this phone could not be read. They have not been overwritten.",
      });
    }
    const data =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    if (path === "high-score") return result(200, { score: saves.highScore });
    if (path === "game") {
      const game =
        key && /^[a-f0-9]{64}$/.test(key) ? saves.games[key] : undefined;
      return game
        ? result(200, { game })
        : result(404, {
            error: "No journey with that code is saved on this phone.",
          });
    }
    let game: Game,
      newKey = key;
    if (path === "games") {
      if (
        typeof data.name !== "string" ||
        data.name.length > 32 ||
        !["Warrior", "Knight", "Scout", "Mage", "D"].includes(
          data.className as string,
        ) ||
        !["Wind", "Fire", "Water"].includes(data.element as string) ||
        ![0, 1].includes(data.difficulty as number)
      )
        return result(400, { error: "Invalid character" });
      newKey = this.makeKey();
      game = newGame(
        data.name,
        data.className as string,
        data.element as string,
        data.difficulty as number,
      );
    } else if (path === "action") {
      const current =
        key && /^[a-f0-9]{64}$/.test(key) ? saves.games[key] : undefined;
      if (!current)
        return result(404, {
          error: "This journey is not saved on this phone.",
        });
      if (data.revision !== current.revision)
        return result(409, {
          error: "Save changed. Reloading.",
          game: current,
        });
      const action = data.action as Action | undefined;
      if (!action || typeof action.type !== "string")
        return result(400, { error: "Invalid action" });
      try {
        game = act(current, action);
      } catch (e) {
        return result(400, { error: (e as Error).message });
      }
    } else return result(404, { error: "Unknown game operation" });
    saves.games[newKey!] = game;
    saves.highScore = Math.max(saves.highScore, game.score);
    try {
      await this.storage.set(STORAGE_KEY, JSON.stringify(saves));
    } catch {
      return result(503, {
        error:
          "This phone could not save the action. Free some storage and try again.",
      });
    }
    return result(path === "games" ? 201 : 200, {
      game,
      ...(path === "games" ? { recoveryKey: newKey } : {}),
    });
  }
}

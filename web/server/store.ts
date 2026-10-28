import { Pool } from "pg";
import { mkdir, readFile, writeFile, rename, readdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes, createHash } from "node:crypto";
import type { Game } from "../shared/types";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export const token = () => randomBytes(32).toString("hex");
export class Store {
  pool?: Pool;
  dir: string;
  constructor(
    url = process.env.DATABASE_URL,
    dir = process.env.DATA_DIR || "data",
  ) {
    this.dir = dir;
    if (url) this.pool = new Pool({ connectionString: url });
  }
  async init() {
    if (this.pool)
      await this.pool.query(
        `CREATE TABLE IF NOT EXISTS schema_migrations(version integer PRIMARY KEY); CREATE TABLE IF NOT EXISTS saved_games (token_hash text PRIMARY KEY, state jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()); INSERT INTO schema_migrations(version) VALUES(1) ON CONFLICT DO NOTHING`,
      );
    else await mkdir(this.dir, { recursive: true });
  }
  async get(key: string): Promise<Game | undefined> {
    if (this.pool) {
      const r = await this.pool.query(
        "SELECT state FROM saved_games WHERE token_hash=$1",
        [digest(key)],
      );
      return r.rows[0]?.state;
    }
    try {
      return JSON.parse(
        await readFile(join(this.dir, digest(key) + ".json"), "utf8"),
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  }
  async put(key: string, g: Game, expectedRevision?: number) {
    if (this.pool) {
      if (expectedRevision !== undefined) {
        const r = await this.pool.query(
          "UPDATE saved_games SET state=$2,updated_at=now() WHERE token_hash=$1 AND (state->>'revision')::integer=$3",
          [digest(key), JSON.stringify(g), expectedRevision],
        );
        return r.rowCount === 1;
      }
      await this.pool.query(
        "INSERT INTO saved_games(token_hash,state) VALUES($1,$2) ON CONFLICT(token_hash) DO UPDATE SET state=$2,updated_at=now()",
        [digest(key), JSON.stringify(g)],
      );
      return true;
    }
    const file = join(this.dir, digest(key) + ".json"),
      tmp = file + "." + randomBytes(6).toString("hex") + ".tmp";
    await writeFile(tmp, JSON.stringify(g), { mode: 0o600 });
    await rename(tmp, file);
    return true;
  }
  async highScore() {
    if (this.pool) {
      const r = await this.pool.query(
        "SELECT COALESCE(MAX((state->>'score')::numeric),0) AS score FROM saved_games",
      );
      return Number(r.rows[0].score);
    }
    let best = 0;
    for (const name of await readdir(this.dir)) {
      if (!name.endsWith(".json")) continue;
      const g = JSON.parse(await readFile(join(this.dir, name), "utf8"));
      best = Math.max(best, Number(g.score) || 0);
    }
    return best;
  }
  async close() {
    await this.pool?.end();
  }
}

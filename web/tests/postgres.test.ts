import { PGlite } from "@electric-sql/pglite";
import { it, expect } from "vitest";
import { Store } from "../server/store";
import { newGame, act } from "../shared/engine";
import { readFileSync } from "node:fs";
it("executes the migration and PostgreSQL persistence/CAS queries", async () => {
  const pg = new PGlite();
  await pg.exec(readFileSync("migrations/001_saved_games.sql", "utf8"));
  const store = new Store("");
  store.pool = {
    query: async (sql: string, args?: unknown[]) => {
      if (!args) {
        await pg.exec(sql);
        return { rows: [] };
      }
      const r = await pg.query(sql, args);
      return { ...r, rowCount: r.affectedRows };
    },
    end: async () => pg.close(),
  } as unknown as NonNullable<Store["pool"]>;
  await store.init();
  const key = "a".repeat(64),
    g = newGame("A", "Mage", "Fire", 0, 8);
  await store.put(key, g);
  expect(await store.get(key)).toEqual(g);
  const next = act(g, { type: "wait" });
  expect(await store.put(key, next, 0)).toBe(true);
  expect(await store.put(key, g, 0)).toBe(false);
  expect(await store.get(key)).toEqual(next);
  await store.close();
}, 20000);

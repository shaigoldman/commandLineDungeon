import express from "express";
import { join } from "node:path";
import { act, newGame } from "../shared/engine";
import type { Action } from "../shared/types";
import { Store, token } from "./store";
export function createApp(store: Store) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    next();
  });
  const queues = new Map<string, Promise<unknown>>();
  const limits = new Map<string, { n: number; t: number }>();
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    const key = req.ip || "";
    const now = Date.now();
    if (limits.size > 10000) limits.clear();
    let bucket = limits.get(key);
    if (!bucket || now - bucket.t > 60000) {
      bucket = { n: 0, t: now };
      limits.set(key, bucket);
    }
    if (++bucket.n > 600) {
      res.status(429).json({ error: "Too many requests. Try again shortly." });
      return;
    }
    if (req.method === "POST" && req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) {
          res.status(403).json({ error: "Origin rejected" });
          return;
        }
      } catch {
        res.status(403).json({ error: "Invalid origin" });
        return;
      }
    }
    next();
  });
  const getKey = (req: express.Request) => {
    const key =
      req.headers.authorization?.replace(/^Bearer /, "") ||
      req.headers.cookie
        ?.split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith("dungeon="))
        ?.slice(8);
    return key && /^[a-f0-9]{64}$/.test(key) ? key : undefined;
  };
  app.get("/api/health", async (_req, res) => {
    try {
      if (store.pool) await store.pool.query("SELECT 1");
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });
  app.get("/api/high-score", async (_req, res, next) => {
    try {
      res.json({ score: await store.highScore() });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/games", async (req, res, next) => {
    try {
      const { name, className, element, difficulty } = req.body;
      if (
        typeof name !== "string" ||
        name.length > 32 ||
        !["Warrior", "Knight", "Scout", "Mage", "D"].includes(className) ||
        !["Wind", "Fire", "Water"].includes(element) ||
        ![0, 1].includes(difficulty)
      ) {
        res.status(400).json({ error: "Invalid character" });
        return;
      }
      const key = token(),
        game = newGame(name, className, element, difficulty);
      await store.put(key, game);
      res.cookie("dungeon", key, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 365 * 86400000,
        path: "/",
      });
      res.status(201).json({ game, recoveryKey: key });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/game", async (req, res, next) => {
    try {
      const key = getKey(req);
      const game = key ? await store.get(key) : undefined;
      if (!game) {
        res.status(404).json({ error: "No saved journey" });
        return;
      }
      res.json({ game });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/action", async (req, res, next) => {
    const key = getKey(req);
    if (!key) {
      res.status(401).json({ error: "Load a journey first" });
      return;
    }
    const previous = queues.get(key) || Promise.resolve();
    const job = previous
      .catch(() => {})
      .then(async () => {
        const game = await store.get(key);
        if (!game) {
          res.status(404).json({ error: "Save not found" });
          return;
        }
        if (req.body.revision !== game.revision) {
          res.status(409).json({ error: "Save changed. Reloading.", game });
          return;
        }
        try {
          if (!req.body.action || typeof req.body.action.type !== "string")
            throw Error("Invalid action");
          const updated = act(game, req.body.action as Action);
          const written = await store.put(key, updated, game.revision);
          if (!written) {
            res.status(409).json({
              error: "Save changed. Reloading.",
              game: await store.get(key),
            });
            return;
          }
          res.json({ game: updated });
        } catch (e) {
          res.status(400).json({ error: (e as Error).message });
        }
      });
    queues.set(key, job);
    try {
      await job;
    } catch (e) {
      next(e);
    } finally {
      if (queues.get(key) === job) queues.delete(key);
    }
  });
  app.use(express.static(join(process.cwd(), "dist/client")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(join(process.cwd(), "dist/client/index.html")),
  );
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err.message);
      res.status(500).json({
        error: "The server could not save your action. Please retry.",
      });
    },
  );
  return app;
}

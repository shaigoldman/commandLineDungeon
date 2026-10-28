import { it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { simulate } from "../scripts/simulate";
it("keeps all invariants across short ordinary and powered seeded games", () => {
  const dir = mkdtempSync(join(tmpdir(), "dungeon-sim-"));
  try {
    for (const powered of [false, true]) {
      const r = simulate(
        2,
        120,
        join(dir, powered ? "powered.json" : "ordinary.json"),
        powered,
      );
      expect(r.games).toBe(24);
      expect(r.actions).toBeGreaterThan(100);
      expect(r.findings).toEqual({});
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 20000);

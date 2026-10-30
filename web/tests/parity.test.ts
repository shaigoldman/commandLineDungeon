import { it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { newGame, attackStats, hitRate } from "../shared/engine";
it("matches 80 original Python class/weight/hit fixtures", () => {
  const cases = JSON.parse(
    execFileSync("python3", ["tests/oracle.py"], { encoding: "utf8" }),
  );
  for (const fixture of cases) {
    const a = newGame("A", fixture.className, "Wind", 0, 1).player,
      b = newGame("B", fixture.enemy, "Wind", 0, 1).player;
    a.weapons = [];
    b.weapons = [];
    if (fixture.weight)
      a.weapons.push({
        id: "w",
        name: "fixture",
        kind: "weapon",
        rarity: 1,
        value: 0,
        attack: 3,
        weight: fixture.weight,
        luck: 3,
        uses: 10,
        maxUses: 10,
        description: "",
      });
    expect(attackStats(a, false, true, false)).toEqual(fixture.stats);
    expect(hitRate(a, b)).toBeCloseTo(fixture.hit);
  }
});

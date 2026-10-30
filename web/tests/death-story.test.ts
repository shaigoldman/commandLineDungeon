import { describe, expect, it } from "vitest";
import { act, makeItem, makeMonster, newGame, randomItem } from "../shared/engine";
import { deathStory } from "../shared/death-story";

function arena() {
  const g = newGame("Elara", "Warrior", "Fire", 0, 417);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  Object.assign(g.player, { x: 10, y: 7, hp: 1 });
  g.monsters = []; g.traps = []; g.pods = []; g.loot = [];
  g.inventory = []; g.player.weapons = [];
  return g;
}

describe("final journey context", () => {
  it("names the monster and fatal blow even after combat is cleared", () => {
    let g = arena();
    const zombie = makeMonster(g, "Zombie", 1);
    Object.assign(zombie, { x: 11, y: 7, hp: 1000 });
    Object.assign(zombie.stats, { Power: 1000, Accuracy: 1000, Speed: 1000, Luck: 0 });
    g.monsters = [zombie]; g.combat = zombie.id;
    g.encounter = { enemyId: zombie.id, origin: "enemy", engaged: true, exchanges: 0 };
    g = act(g, { type: "attack" });
    expect(g.status).toBe("dead");
    expect(g.death).toMatchObject({ source: "Attack", attacker: zombie.name });
    expect(deathStory(g).cause).toContain(zombie.name);
    expect(deathStory(g).context).toContain("floor 1");
  });

  it("records poison and curse as the fatal causes", () => {
    let poisoned = arena(); poisoned.player.effects.Poison = [2, 2]; poisoned.player.poisonSource = "Snake";
    poisoned = act(poisoned, { type: "move", dx: 1, dy: 0 });
    expect(poisoned.death?.source).toBe("Poison");
    expect(deathStory(poisoned).cause).toContain("Snake");
    expect(deathStory(poisoned).flavor).toContain("green stain");
    let cursed = arena(); cursed.player.effects.Curse = [2, 3]; cursed.player.curseSource = "Ghost";
    cursed = act(cursed, { type: "wait" });
    expect(cursed.death?.source).toBe("Curse");
    expect(deathStory(cursed).cause).toContain("Ghost");
  });

  it("distinguishes self-inflicted item damage", () => {
    let g = arena();
    const shocker = makeItem(g, "Seismic Shocker"); g.inventory.push(shocker);
    g = act(g, { type: "use", id: shocker.id });
    expect(g.death?.source).toBe("Seismic");
    expect(deathStory(g).cause).toContain("Seismic Shocker");
  });
});

it("keeps jewels common but reduces the seven-variant family's share of ordinary loot", () => {
  const g = arena();
  let jewels = 0;
  const variants = new Set<string>();
  for (let n = 0; n < 3000; n++) {
    const item = randomItem(g, 0);
    if (item.kind === "jewel") { jewels++; variants.add(item.stat!); }
  }
  expect(variants.size).toBe(7);
  expect(jewels / 3000).toBeGreaterThan(0.02);
  expect(jewels / 3000).toBeLessThan(0.12);
});

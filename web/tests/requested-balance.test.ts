import { expect, it } from "vitest";
import { act, attackStats, generateFloor, incomingDamage, makeItem, makeMonster, migrateGuardians, newGame } from "../shared/engine";
import { migrateItemRarities } from "../shared/rarity";

it("makes Mana Pot rare in new loot and existing saves", () => {
  const g = newGame();
  const pot = makeItem(g, "Mana Pot");
  expect(pot.rarity).toBe("rare");
  pot.rarity = "uncommon";
  g.inventory.push(pot);
  migrateItemRarities(g);
  expect(pot.rarity).toBe("rare");
});

it("makes new and saved gloves rare and limits kill payouts to zero through two", () => {
  const payouts = new Set<number>();
  for (let seed = 1; seed <= 120; seed++) {
    let g = newGame("Gloves", "Warrior", "Wind", 0, seed);
    const gloves = makeItem(g, "Thief's Gloves");
    expect(gloves.rarity).toBe("rare");
    gloves.rarity = "uncommon";
    g.inventory = [gloves];
    migrateItemRarities(g);
    expect(gloves.rarity).toBe("rare");
    expect(gloves.description).toContain("0–2 gold");
    const enemy = makeMonster(g, "Zombie", 0);
    Object.assign(enemy, { x: g.player.x + 1, y: g.player.y, hp: 1 });
    enemy.stats.Speed = 0;
    g.monsters = [enemy]; g.combat = enemy.id; g.pendingLoot = undefined;
    g.player.stats.Power = 1000; g.player.stats.Accuracy = 1000; g.player.stats.Speed = 1000;
    g.player.gold = 0;
    g = act(g, { type: "attack", unarmed: true });
    expect(g.player.gold).toBeLessThanOrEqual(2);
    expect(g.player.gold).toBeGreaterThanOrEqual(0);
    if (g.log.some(l => l.includes("Thief's Gloves found"))) payouts.add(g.player.gold!);
  }
  expect([...payouts].sort()).toEqual([0, 1, 2]);
});

it("raises Ruthagor attack by 50 percent, including saved bosses, exactly once", () => {
  const g = newGame();
  for (const floor of [2, 5, 8]) {
    g.floor = floor; generateFloor(g);
    const boss = g.monsters.find(m => m.boss)!;
    const base = makeMonster(g, "Dragon", 10 * floor);
    expect(boss.stats.Power).toBeCloseTo(base.stats.Power * 1.5);
    const power = boss.stats.Power;
    migrateGuardians(g); migrateGuardians(g);
    expect(boss.stats.Power).toBe(power);
    delete boss.ruthagorAttackVersion; boss.stats.Power /= 1.5;
    boss.hp = 3;
    migrateGuardians(g);
    expect(boss.stats.Power).toBeCloseTo(power);
    expect(boss.hp).toBe(3);
  }
});

it("previews incoming hit odds with the strike formula without consuming effects", () => {
  const g = newGame(), p = g.player, enemy = makeMonster(g, "Zombie", 0);
  enemy.stats.Accuracy = 54; enemy.stats.Speed = 5;
  p.weapons = [makeItem(g, "Sword")];
  enemy.effects["Accuracy Penalty"] = [3, 50];
  const before = structuredClone({ enemy, p });
  const h = attackStats(enemy, false, false, false), e = attackStats(p, false, true, false);
  expect(incomingDamage(enemy, p).hit).toBe(Math.min(100, Math.max(5, h.Accuracy + h.Speed - e.Speed * 1.2)));
  expect({ enemy, p }).toEqual(before);
  enemy.stats.Accuracy = 1000;
  expect(incomingDamage(enemy, p).hit).toBe(100);
  p.effects["Speedy Boots"] = [1, 0];
  expect(incomingDamage(enemy, p).hit).toBe(1);
  delete p.effects["Speedy Boots"]; enemy.stats.Accuracy = -100;
  expect(incomingDamage(enemy, p).hit).toBe(5);
});

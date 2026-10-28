import type { Actor, Game, Item } from "./types";
import {
  attackInitiative,
  combatAttackStats,
  hitRate,
  floorEquipPlan,
  itemUseProblem,
} from "./engine";
export const displayNumber = (n: number) =>
  Number.isFinite(n)
    ? (Math.round(n * 10) / 10).toLocaleString("en-US", {
        maximumFractionDigits: 1,
      })
    : "—";
export function swipeDirection(dx: number, dy: number, threshold = 24) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null;
  return Math.abs(dx) > Math.abs(dy)
    ? { dx: Math.sign(dx), dy: 0 }
    : { dx: 0, dy: Math.sign(dy) };
}
export function equipmentComparison(g: Game, item: Item, ground = false) {
  const after = structuredClone(g.player),
    beforeStats = combatAttackStats(g.player);
  const alreadyEquipped = g.player.weapons.some((w) => w.id === item.id);
  const replaced =
    !alreadyEquipped &&
    item.kind === "weapon" &&
    after.weapons.length >= g.hands
      ? after.weapons.shift()
      : undefined;
  if (!alreadyEquipped) after.weapons.push(item);
  const afterStats = combatAttackStats(after),
    enemy = g.monsters.find((m) => m.id === g.combat);
  const problem = alreadyEquipped
    ? undefined
    : ground
      ? floorEquipPlan(g, item).problem
      : itemUseProblem(g, item);
  const rows = ["Attack", "Speed", "Accuracy", "Luck"].map((name) => ({
    name,
    before: beforeStats[name],
    after: afterStats[name],
  }));
  rows.push({
    name: "Initiative",
    before: attackInitiative(g.player),
    after: attackInitiative(after),
  });
  if (enemy) {
    rows.push({
      name: "Damage / hit",
      before: Math.max(
        0,
        Math.trunc(beforeStats.Attack - Math.max(0, enemy.stats.Armor || 0)),
      ),
      after: Math.max(
        0,
        Math.trunc(afterStats.Attack - Math.max(0, enemy.stats.Armor || 0)),
      ),
    });
    rows.push({
      name: "Hit chance %",
      before: Math.min(100, hitRate(g.player, enemy)),
      after: Math.min(100, hitRate(after, enemy)),
    });
  }
  return {
    rows,
    replaced,
    problem,
    alreadyEquipped,
    leaveOnFloor: ground && floorEquipPlan(g, item).leaveOnFloor,
    attackType:
      after.weapons.some((w) => w.kind === "tome") && after.stats.Mana >= 2
        ? "Magic"
        : "Power",
  };
}
export const floorThemes = [
  {
    name: "Forgotten stone",
    base: 0x727f7a,
    floor: [0x79877b, 0x718277, 0x849183, 0x6d7b73],
    wall: [0x637779, 0x4f6269],
    trim: 0xa1ab94,
    shadow: 0x34464f,
  },
  {
    name: "Mossbound ruins",
    base: 0x566b4d,
    floor: [0x677b52, 0x5d704b, 0x75865c, 0x536646],
    wall: [0x5b7060, 0x3f574e],
    trim: 0xa3b17e,
    shadow: 0x293d36,
  },
  {
    name: "Frost vault",
    base: 0x7598a5,
    floor: [0x8aabb8, 0x7e9eae, 0x96bac5, 0x7295a8],
    wall: [0x7f9eae, 0x55798e],
    trim: 0xc5e7eb,
    shadow: 0x334c68,
  },
  {
    name: "Ember depths",
    base: 0x634e4b,
    floor: [0x73594e, 0x66494a, 0x81624f, 0x59454a],
    wall: [0x76605c, 0x503f4a],
    trim: 0xc3a182,
    shadow: 0x342935,
  },
];
export const floorTheme = (floor: number) =>
  floorThemes[
    ((floor % floorThemes.length) + floorThemes.length) % floorThemes.length
  ];
export function adjacentEnemies(g: Game) {
  return g.monsters.filter(
    (m) =>
      !m.npc &&
      Math.abs(m.x - g.player.x) + Math.abs(m.y - g.player.y) === 1 &&
      (!g.combat || g.combat === m.id),
  );
}
export function outgoingDamage(player: Actor, enemy: Actor) {
  const s = combatAttackStats(player),
    armor = Math.max(0, enemy.stats.Armor || 0);
  return {
    normal: Math.max(0, Math.trunc(s.Attack - armor)),
    critical: Math.max(0, Math.trunc(s.Attack * (s.Luck > 0 ? 3 : 1) - armor)),
    hit: Math.min(100, hitRate(player, enemy)),
  };
}
export function freshLog(before: string[], after: string[]) {
  for (
    let overlap = Math.min(before.length, after.length);
    overlap > 0;
    overlap--
  )
    if (before.slice(-overlap).every((line, i) => line === after[i]))
      return after.slice(overlap);
  return after;
}

export function freshGameLog(before: Game, after: Game) {
  if (after.logSerial !== undefined) {
    const count = after.logSerial - (before.logSerial ?? before.log.length);
    return count > 0 ? after.log.slice(-Math.min(count, after.log.length)) : [];
  }
  return freshLog(before.log, after.log);
}

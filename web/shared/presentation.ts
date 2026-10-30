import type { Actor, Game, Item } from "./types";
import {
  attackInitiative,
  combatAttackStats,
  attackStats,
  hitRate,
  floorEquipPlan,
  itemUseProblem,
  armorOf,
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
    ["weapon", "tome"].includes(item.kind) &&
    after.weapons.length >= g.hands
      ? after.weapons.shift()
      : undefined;
  if (!alreadyEquipped) {
    while (after.weapons.length >= g.hands) after.weapons.shift();
    after.weapons.push(item);
  }
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
  rows.push({ name: "Armor", before: armorOf(g.player), after: armorOf(after) });
  rows.push({
    name: "Crit chance %",
    before: criticalChance(beforeStats.Luck),
    after: criticalChance(afterStats.Luck),
  });
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
        Math.trunc(beforeStats.Attack - armorOf(enemy)),
      ),
      after: Math.max(
        0,
        Math.trunc(afterStats.Attack - armorOf(enemy)),
      ),
    });
    rows.push({
      name: "Hit chance %",
      before: outgoingDamage(g.player, enemy).hit,
      after: outgoingDamage(after, enemy).hit,
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
export function criticalChance(luck: number) {
  const threshold = 1 - Math.min(0.7, Math.max(0, luck) * 0.01);
  return (1 - threshold + threshold * Math.log(threshold)) * 100;
}
export function outgoingDamage(player: Actor, enemy: Actor) {
  const actor = structuredClone(player),
    defender = structuredClone(enemy);
  const s = combatAttackStats(actor, true),
    physical = actor.weapons.some((w) => w.kind === "weapon");
  const h = attackStats(actor, true, physical, false),
    e = attackStats(defender, true, defender.weapons.length > 0, false);
  const normal = Math.max(
    0,
    Math.trunc(s.Attack - armorOf(enemy)),
  );
  return {
    normal,
    critical: Math.max(
      0,
      Math.trunc(
        s.Attack * (s.Luck > 0 ? 3 : 1) - armorOf(enemy),
      ),
    ),
    hit: Math.min(100, Math.max(40, h.Accuracy + h.Speed - e.Speed * 1.2)),
    critChance: criticalChance(s.Luck),
    hitsToKill: normal > 0 ? Math.ceil(enemy.hp / normal) : null,
  };
}
export function retaliationRisk(player: Actor, enemy: Actor) {
  const forecast = outgoingDamage(player, enemy),
    incoming = Math.max(
      0,
      Math.trunc(
        combatAttackStats(enemy).Attack - armorOf(player),
      ),
    );
  const crit = Math.max(
    0,
    Math.trunc(
      combatAttackStats(enemy).Attack *
        (combatAttackStats(enemy).Luck > 0 ? 3 : 1) -
        armorOf(player),
    ),
  );
  const first = attackInitiative(player) >= enemy.stats.Speed,
    kill = forecast.normal >= enemy.hp;
  if (first && kill && forecast.hit >= 100)
    return { warning: undefined, safeKill: true, conditionalMiss: false };
  if (incoming < player.hp && crit < player.hp)
    return { warning: undefined, safeKill: false, conditionalMiss: false };
  const conditionalMiss = first && kill;
  const hit = incoming >= player.hp ? "Enemy hit" : "Enemy critical hit";
  return {
    warning: conditionalMiss
      ? `${hit} can kill you if you miss.`
      : first && forecast.critical >= enemy.hp && forecast.critChance > 0
        ? `${hit} can kill you if your strike does not finish them.`
        : `${hit} can kill you${first ? "" : "; they act first"}.`,
    safeKill: false,
    conditionalMiss,
  };
}
export function combatBreakdown(actor: Actor) {
  const magical =
    actor.weapons.some((w) => w.kind === "tome") && actor.stats.Mana >= 2;
  const base = {
    Attack: actor.stats.Power,
    Accuracy: actor.stats.Accuracy,
    Speed: actor.stats.Speed,
    Luck: actor.stats.Luck,
  };
  const boosted = attackStats(actor, false, false, magical),
    now = combatAttackStats(actor);
  const rows = Object.entries(base).map(([stat, value]) => {
    const modeBase = stat === "Attack" && magical ? actor.stats.Magic : value;
    const effects = boosted[stat] - modeBase;
    return {
      stat,
      base: value,
      effects,
      gear: now[stat] - value - effects,
      now: now[stat],
    };
  });
  return rows;
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

export interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** Canvas-space collision avoidance; all labels subsequently float at the same speed. */
export function placeCombatLabel(
  existing: LabelBox[],
  desired: LabelBox,
): LabelBox {
  const placed = { ...desired };
  for (let n = 0; n <= existing.length; n++) {
    const overlaps = existing.filter(
      (b) =>
        placed.x < b.x + b.width + 5 &&
        placed.x + placed.width + 5 > b.x &&
        placed.y < b.y + b.height + 5 &&
        placed.y + placed.height + 5 > b.y,
    );
    if (!overlaps.length) return placed;
    placed.y = Math.min(...overlaps.map((b) => b.y)) - placed.height - 6;
  }
  return placed;
}

export function chancePercent(percent: number) {
  if (percent >= 100) return "100%";
  if (percent > 0 && percent < 0.1) return "<0.1%";
  return `${Math.min(99.9, Math.round(percent * 10) / 10)}%`;
}

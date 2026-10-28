import npcDialogue from "./npc-dialogue.json";
import {
  classes,
  bonuses,
  monsterBase,
  growth,
  itemDefinitions,
  spells,
} from "./catalog";
import type { Game, Actor, Item, Action, Stats } from "./types";
export function random(g: Pick<Game, "seed">) {
  let t = (g.seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  g.seed >>>= 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const roll = (g: Game, n: number) => Math.floor(random(g) * n);
const pick = <T>(g: Game, a: T[]) => a[roll(g, a.length)];
const id = (g: Game) => Math.floor(random(g) * 2 ** 32).toString(36);
export function log(g: Game, s: string) {
  g.log.push(s);
  g.log = g.log.slice(-100);
}
export function makeItem(g: Game, name: string): Item {
  const d = itemDefinitions.find((d) => d[0] === name);
  let i: Item = {
    id: id(g),
    name,
    kind: d?.[1] || "trash",
    rarity: d?.[2] || 0,
    value: d?.[3] || 0,
    stat: d?.[4],
    description: "",
  };
  if (i.kind === "heal") i.description = `Restore ${i.value} HP.`;
  if (i.kind === "mana") i.description = "Fully restore 10 mana.";
  if (i.kind === "projectile")
    i.description = `Throw for ${i.value} damage. Dragons may dodge.`;
  if (i.kind === "stat") {
    i.value = roll(g, i.value) + 1;
    i.auto = true;
    i.name = `${i.stat} Boost ${i.value}`;
    i.description = `Permanently add ${i.value} ${i.stat}.`;
  }
  if (i.kind === "boost") {
    i.value = 10 + roll(g, 50);
    i.duration = Math.floor(random(g) ** 2 * 10) + 1;
    i.name = `${i.duration} turn ${i.value}% ${i.stat} Boost`;
    i.description = `Boost ${i.stat} by ${i.value}%. First application lasts one calculation, as in Python.`;
  }
  if (i.kind === "armor") {
    i.value =
      random(g) > 0.7 ? (random(g) > 0.9 ? (random(g) > 0.5 ? 15 : -1) : 3) : 1;
    i.name =
      (
        { 1: "Rusty", 3: "Iron", 15: "Diamond", "-1": "???" } as Record<
          string,
          string
        >
      )[i.value] + " Armor";
    i.auto = i.value !== -1;
    i.description = `Permanently add ${i.value} armor.`;
  }
  if (["bag", "hand", "sight"].includes(i.kind)) i.auto = true;
  if (i.kind === "weapon") {
    const chance = 0.5 - g.floor / 10;
    let m = 0;
    while (m < 5 && random(g) > chance) m++;
    const material = ["Fragile", "Iron", "Steel", "Lucky", "Magic", "Obsidian"][
      m
    ];
    i.attack = i.value;
    i.weight = ({ Sword: 2, Spear: 4, Axe: 6 } as Record<string, number>)[name];
    i.luck = ({ Sword: 3, Spear: 1, Axe: 6 } as Record<string, number>)[name];
    i.maxUses = [3, 10, 20, 8, 1, 35][m];
    if (m === 0) {
      i.attack--;
      i.weight = Math.max(1, i.weight - 2);
      i.luck += 4;
    }
    if (m === 2) {
      i.attack = Math.trunc(i.attack * 1.5);
      i.weight = Math.trunc(i.weight * 1.4);
    }
    if (m === 3) {
      i.attack = Math.trunc(i.attack * 1.5);
      i.luck += 30;
    }
    if (m >= 4) {
      i.attack *= 3;
      if (m === 4) i.luck += 50;
      else i.weight *= 2;
    }
    i.uses = random(g) < 0.3 ? roll(g, i.maxUses) + 1 : i.maxUses;
    i.name = material + " " + name;
  }
  if (i.kind === "tome") {
    i.element = pick(g, ["Wind", "Fire", "Water"]);
    staff(i, i.element);
  }
  const desc: Record<string, string> = {
    antidote: "Cure poison.",
    rope: "Guarantee escape from combat.",
    nuke: "Destroy all monsters and yourself unless shielded.",
    shield: "Protect against one nuke.",
    teleport: "Reusable random teleport outside combat.",
    vision: "Permanently reveal this floor.",
    sight: "Increase sight range by 1.",
    hand: "Add one equipment slot.",
    bag: `Increase inventory capacity to ${i.value}.`,
    trash: "It is just trash. Please do not litter.",
  };
  i.description = i.description || desc[i.kind] || "";
  return i;
}
function staff(i: Item, e: string) {
  i.element = e;
  i.name = e + " Staff";
  i.attack = (
    { Wind: 5, Fire: 6, Water: 4, Mystery: 0 } as Record<string, number>
  )[e];
  i.luck = (
    { Wind: 3, Fire: 10, Water: 5, Mystery: 50 } as Record<string, number>
  )[e];
  i.weight = 0;
}
export function randomItem(g: Game, depth = g.floor): Item {
  const rars: number[] = [];
  for (let n = 0; n < 11; n++) {
    let v = Math.trunc(Math.abs(depth * 2 - n) ** 2);
    if (v > 100) v = 99;
    for (let j = 0; j < 100 - v; j++) rars.push(n);
  }
  const rarity = pick(g, rars) + 1;
  return makeItem(
    g,
    pick(
      g,
      itemDefinitions.filter(
        (d) => d[2] <= rarity && d[0] !== "Small Health Potion",
      ),
    )[0],
  );
}

function randomName(g: Game, maxlen: number) {
  const consonants = [..."bcdfghklmnprstvwxyz", "sh", "ch"],
    starts = [
      "j",
      "br",
      "cr",
      "dr",
      "fr",
      "gr",
      "kr",
      "pr",
      "sr",
      "tr",
      "vr",
      "wr",
      "qu",
      "dj",
      "dw",
      "swbl",
      "cl",
      "fl",
      "pl",
      "sl",
      "zl",
    ],
    vowels = [
      ..."aeiouaeiouaeiou",
      "oo",
      "ea",
      "ou",
      "ie",
      "ei",
      "ai",
      "oi",
      "ii",
      "ee",
    ];
  let name = "";
  for (let i = 0, n = roll(g, maxlen) + 1; i < n; i++) {
    if (random(g) > 0.5) name += pick(g, consonants);
    else if (random(g) > 0.2) name += pick(g, starts);
    name += pick(g, vowels);
    if (random(g) > 0.5) name += pick(g, consonants);
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function makeMonster(g: Game, type: string, level: number): Actor {
  level = Math.max(1, level);
  const stats = { ...monsterBase[type] };
  for (const [s, v] of Object.entries(growth[type] || {}))
    stats[s] += v * level;
  if (type === "Chieftan") {
    stats.Health += 2 * level;
    stats.Power += 9 * (level * 0.7);
    stats.Magic += 9 * (level * 0.7);
    stats.Accuracy += 6 * Math.sqrt(level);
    stats.Speed += level;
  }
  if (type === "Dragon")
    for (const s of ["Health", "Power", "Accuracy", "Speed"])
      stats[s] *= Math.floor(level / 10) - 1;
  else {
    let mult = random(g) < 0.5 ? -2 : 2;
    const r = random(g);
    if (r > 0.8) mult += (r * 10 - 8) * 2;
    for (const s of Object.keys(stats)) {
      // Python only randomizes integer-valued fields; growth through floats stays untouched.
      const floatGrowth = [
        "Zombie:Health",
        "Zombie:Accuracy",
        "Zombie:Speed",
        "Spider:Health",
        "Spider:Power",
        "Spider:Accuracy",
        "Parasite:Accuracy",
        "Parasite:Speed",
        "Golem:Speed",
      ];
      if (
        Number.isInteger(stats[s]) &&
        !floatGrowth.includes(type + ":" + s) &&
        stats[s] !== 0
      )
        stats[s] = Math.max(0, stats[s] + Math.trunc(random(g) * mult)) ** 1.05;
    }
  }
  for (let d = 0; d < g.difficulty; d++)
    for (const s of ["Health", "Power", "Accuracy", "Speed"])
      stats[s] = Math.trunc(stats[s] * 1.3);
  stats.Mana = 10;
  const a: Actor = {
    id: id(g),
    name: type,
    className: type,
    stats,
    hp: stats.Health,
    effects: {},
    weapons: [],
    x: 0,
    y: 0,
    level,
  };
  if (type === "Snake")
    a.poison = [
      level,
      Math.max(1, Math.floor(Math.sqrt(level)) + roll(g, 3) - 1),
    ];
  if (type === "Parasite") {
    a.poison = [level, level / 2 + 1];
    a.drain = true;
  }
  if (a.poison)
    for (let d = 0; d < g.difficulty; d++) a.poison[1] += a.poison[1] / 2 + 1;
  return a;
}
function empty(g: Game, x: number, y: number) {
  return (
    g.tiles[y]?.[x] === 0 &&
    !g.monsters.some((m) => m.hp > 0 && m.x === x && m.y === y) &&
    !(g.player.x === x && g.player.y === y) &&
    !g.loot.some((i) => i.x === x && i.y === y) &&
    !g.pods.some((i) => i.x === x && i.y === y) &&
    !(g.stairs.x === x && g.stairs.y === y)
  );
}
function position(g: Game) {
  const a: { x: number; y: number }[] = [];
  for (let y = 0; y < 15; y++)
    for (let x = 0; x < 30; x++) if (empty(g, x, y)) a.push({ x, y });
  if (!a.length) throw Error("No open tiles");
  return pick(g, a);
}
export function generateFloor(g: Game) {
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(1));
  g.light = Array.from({ length: 15 }, () => Array(30).fill(false));
  g.monsters = [];
  g.loot = [];
  g.pods = [];
  g.stairs = { x: -1, y: -1, locked: (g.floor + 1) % 3 === 2 };
  g.player.x = -1;
  g.player.y = -1;
  const rooms: { x: number; y: number }[] = [];
  const carve = (x: number, y: number) => {
    if (g.tiles[y]?.[x] !== undefined) g.tiles[y][x] = 0;
  };
  for (let i = 0; i < 8; i++) {
    const h = 3 + roll(g, 2),
      w = 3 + roll(g, 2),
      minx = i % 2 ? 15 : 0,
      miny = i % 4 >= 2 ? 7 : 0;
    const x = minx + roll(g, (minx ? 30 : 15) - minx - w),
      y = miny + roll(g, (miny ? 15 : 7) - miny - h);
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) carve(xx, yy);
    if (rooms.length) {
      const prev = pick(g, rooms),
        flip = random(g) > 0.5;
      for (let xx = Math.min(x, prev.x); xx <= Math.max(x, prev.x); xx++)
        carve(xx, flip ? prev.y : y);
      for (let yy = Math.min(y, prev.y); yy <= Math.max(y, prev.y); yy++)
        carve(flip ? x : prev.x, yy);
    }
    rooms.push({ x, y });
  }
  for (let n = 0; n < 10; n++)
    g.loot.push({ ...position(g), item: randomItem(g) });
  const types = [
    "Zombie",
    "Spider",
    "Snake",
    ...(g.floor >= 2 ? ["Parasite"] : []),
    ...(g.floor >= 3 ? ["Golem"] : []),
  ];
  for (let n = 0; n < 18; n++) {
    const m = makeMonster(
      g,
      pick(g, types),
      roll(g, 2) + (g.floor + 2) * g.floor,
    );
    Object.assign(m, position(g));
    g.monsters.push(m);
  }
  for (let n = 0; n < 10; n++)
    g.pods.push({ ...position(g), max: random(g) > 0.6 });
  Object.assign(g.stairs, position(g));
  if (g.stairs.locked) {
    const m = makeMonster(
      g,
      pick(g, types),
      g.floor + 3 + (g.floor + 2) * g.floor,
    );
    m.key = true;
    Object.assign(m, position(g));
    g.monsters.push(m);
  }
  const boss = makeMonster(
    g,
    (g.floor + 1) % 3 === 0 ? "Dragon" : pick(g, types),
    (g.floor + 1) % 3 === 0
      ? 10 * g.floor
      : 1 + g.floor + 3 + (g.floor + 2) * g.floor,
  );
  boss.name =
    (g.floor + 1) % 3 === 0
      ? "Ruthagor, Dungeon Master"
      : g.stairs.locked
        ? "Ergathon, Ruthagor’s chosen"
        : boss.name + " Boss";
  boss.boss = true;
  Object.assign(boss, { x: g.stairs.x, y: g.stairs.y });
  g.monsters.push(boss);
  if (g.floor > 0 && random(g) > 0.5) {
    let level = random(g) > 0.5 ? 20 : 0;
    for (let n = 0; n < Math.floor(g.floor / 3); n++)
      level += random(g) > 0.5 ? 20 : 0;
    const m = makeMonster(g, "Chieftan", Math.max(1, level));
    const tribe = roll(g, 3);
    m.name = "Chief " + randomName(g, tribe * 2 + 1);
    m.npc = {
      tribe: ["Pallu", "Awa", "Vraskii"][tribe],
      acceptsNoWeapon: random(g) > 0.5,
      deal: pick(g, [
        "Life",
        "All Items",
        "Item of Choice",
        "Random Item",
        "Weapon",
        "Death Wheel",
        "Stat",
        "Health Gain",
      ]),
      done: false,
      line: pick(g, npcDialogue[0]),
    };
    Object.assign(m, position(g));
    g.monsters.push(m);
  }
  Object.assign(g.player, position(g));
  g.combat = undefined;
  g.pendingLoot = undefined;
  log(g, `Floor ${g.floor + 1}: find the guardian and the stairs.`);
}
export function newGame(
  name = "Adventurer",
  className = "Warrior",
  element = "Wind",
  difficulty = 0,
  seed = Date.now(),
): Game {
  if (!classes[className]) throw Error("Unknown class");
  const p: Actor = {
    id: "player",
    name: name.trim().slice(0, 32) || "Adventurer",
    className,
    stats: { ...classes[className], Mana: 10 },
    hp: classes[className].Health,
    effects: {},
    weapons: [],
    x: -1,
    y: -1,
    level: 1,
  };
  const g: Game = {
    version: 1,
    seed: seed >>> 0,
    floor: 0,
    difficulty,
    tiles: [],
    light: [],
    player: p,
    monsters: [],
    loot: [],
    pods: [],
    stairs: { x: -1, y: -1, locked: false },
    inventory: [],
    keys: 0,
    hands: 1,
    capacity: 5,
    sight: 4,
    xp: 0,
    score: 0,
    turn: 0,
    pendingLevels: 0,
    status: "playing",
    log: [],
    revision: 0,
  };
  if (name === "Over9000") {
    p.className = "Over9000";
    p.stats = { ...classes.Over9000, Mana: 10 };
    p.hp = p.stats.Health;
    p.level = 9001;
    g.sight = 400;
  }
  g.inventory = [
    makeItem(g, "Small Health Potion"),
    makeItem(g, "Escape Rope"),
  ];
  if (className === "Mage") {
    const i = makeItem(g, "Magic Staff");
    staff(i, ["Wind", "Fire", "Water"].includes(element) ? element : "Wind");
    p.weapons.push(i);
    g.inventory.push(makeItem(g, "Mana Potion"));
  }
  generateFloor(g);
  return g;
}
export function attackStats(
  a: Actor,
  consume = false,
  usingWeapons = true,
  usingTome = a.weapons.some((w) => w.kind === "tome") && a.stats.Mana >= 2,
) {
  const w = usingWeapons ? a.weapons : [];
  const s: Stats = {
    Attack: usingTome ? a.stats.Magic : a.stats.Power,
    Luck: a.stats.Luck,
    Accuracy: a.stats.Accuracy,
    Speed: a.stats.Speed,
  };
  for (const stat of Object.keys(s)) {
    const e = a.effects[stat + " Booster"];
    if (e) {
      s[stat] += Math.ceil((s[stat] * e[1]) / 100);
      if (consume && --e[0] <= 0) delete a.effects[stat + " Booster"];
    }
    for (const i of w) {
      if (stat === "Accuracy") s[stat] -= (i.weight || 0) * 2;
      else if (stat === "Speed") s[stat] -= (i.weight || 0) / 2;
      else s[stat] += stat === "Attack" ? i.attack || 0 : i.luck || 0;
    }
  }
  return s;
}
/** Forecast uses the same selected attack mode as the authoritative strike. */
export function combatAttackStats(a: Actor, consume = false, unarmed = false) {
  const physical = !unarmed && a.weapons.some((w) => w.kind === "weapon");
  const magical =
    !unarmed && a.weapons.some((w) => w.kind === "tome") && a.stats.Mana >= 2;
  return attackStats(a, consume, physical, magical);
}
export function hitRate(a: Actor, b: Actor) {
  const s = attackStats(a),
    e = attackStats(b);
  return Math.max(40, s.Accuracy + s.Speed - e.Speed * 1.2);
}
export function fleeChance(a: Actor, b: Actor) {
  return Math.min(
    1,
    Math.max(
      0.3,
      (a.stats.Speed - b.stats.Speed) /
        ((a.stats.Speed + b.stats.Speed) / 2 || 1),
    ),
  );
}
export function experience(monsterLevel: number, playerLevel: number) {
  return monsterLevel >= playerLevel
    ? 20 * (monsterLevel - playerLevel + 1)
    : Math.ceil(10 / (playerLevel - monsterLevel));
}
function hurt(g: Game, a: Actor, n: number, source = "Attack") {
  if (source === "Attack") n = Math.max(0, n - Math.max(0, a.stats.Armor || 0));
  n = Math.trunc(n);
  a.hp = Math.max(0, a.hp - n);
  log(g, `${a.name} takes ${n} ${source === "Poison" ? "poison " : ""}damage.`);
  if (a.hp <= 0) {
    if (a.id === "player") {
      g.status = "dead";
      g.combat = undefined;
      log(g, "Your journey ends here. Your score: " + g.score);
    } else kill(g, a);
  }
}
function heal(a: Actor, n: number) {
  a.hp = Math.min(a.stats.Health, a.hp + n);
}
function kill(g: Game, m: Actor, reward = true, drops = reward) {
  if (!g.monsters.some((a) => a.id === m.id)) return;
  g.monsters = g.monsters.filter((a) => a.id !== m.id);
  if (g.combat === m.id) g.combat = undefined;
  log(g, m.name + " falls.");
  if (reward) {
    const xp = experience(m.level, g.player.level);
    g.xp += xp;
    g.score += xp;
    log(g, `Gained ${xp} EXP.`);
  }
  if (drops) {
    if (m.key) {
      g.keys++;
      g.score += 100;
      log(g, "Acquired the staircase key!");
    } else {
      const i = randomItem(g, g.floor + g.player.stats.Luck * 0.01);
      g.loot.push({ x: m.x, y: m.y, item: i });
    }
  }
  if (reward) checkLevel(g);
}
function checkLevel(g: Game) {
  if (g.xp >= 100 && !g.pendingLevels) {
    g.xp -= 100;
    g.player.level++;
    g.score += 100;
    for (const s of Object.keys(g.player.stats)) {
      if (s === "Mana") continue;
      let n =
        s === "Health"
          ? roll(g, 7) + 2
          : s === "Armor"
            ? roll(g, 3)
            : roll(g, 4);
      if (bonuses[g.player.className] === s) n += 2;
      g.player.stats[s] += n;
    }
    g.player.hp = g.player.stats.Health;
    g.player.stats.Mana = 10;
    g.pendingLevels = 1;
    log(g, "Level up! Health and mana restored. Choose an extra stat.");
  }
}
function strike(g: Game, a: Actor, b: Actor, unarmed = false) {
  const physical = !unarmed && a.weapons.some((w) => w.kind === "weapon");
  const s = combatAttackStats(a, true, unarmed);
  const h = attackStats(a, true, physical, false),
    e = attackStats(b, true, b.weapons.length > 0, false);
  const rate = Math.max(40, h.Accuracy + h.Speed - e.Speed * 1.2);
  if (!unarmed && a.weapons.some((w) => w.kind === "tome") && a.stats.Mana >= 2)
    a.stats.Mana -= 2;
  for (const w of [...a.weapons])
    if (!unarmed && w.kind === "weapon" && --w.uses! <= 0) {
      a.weapons = a.weapons.filter((i) => i.id !== w.id);
      log(g, w.name + " broke!");
    }
  if (random(g) * 100 >= rate) {
    log(g, a.name + " missed.");
    return false;
  }
  let damage = s.Attack;
  if (random(g) * random(g) > 1 - Math.min(0.7, s.Luck * 0.01)) {
    damage *= 3;
    log(g, "Critical hit!");
  }
  hurt(g, b, damage);
  if (a.drain) heal(a, damage);
  if (a.poison && b.hp > 0) {
    const old = b.effects.Poison || [0, 0];
    b.effects.Poison = [
      Math.max(old[0], a.poison[0]),
      Math.max(old[1], a.poison[1]),
    ];
    log(g, b.name + " is poisoned.");
  }
  return damage > 0;
}
function poison(g: Game) {
  const e = g.player.effects.Poison;
  if (e) {
    hurt(g, g.player, e[1], "Poison");
    if (--e[0] <= 0) delete g.player.effects.Poison;
  }
}
function monsterTurn(g: Game) {
  g.turn++;
  if (g.player.stats.Speed > 5) {
    g.player.hp = Math.trunc(g.player.hp);
    if (g.player.hp <= 0) {
      hurt(g, g.player, 0, "Exhaustion");
      return;
    }
  }
  for (let pass = 0; pass < (g.player.stats.Speed <= 5 ? 2 : 1); pass++)
    for (const m of [...g.monsters]) {
      if (pass === 1 && m.stats.Speed <= 5) continue;
      m.hp = Math.trunc(m.hp);
      if (m.hp <= 0) {
        kill(g, m);
        continue;
      }
      if (g.status !== "playing" || g.combat) break;
      if (g.player.stats.Speed > 5 && g.turn % 2 === 0 && m.stats.Speed <= 5)
        continue;
      const [dx, dy] = pick(g, [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [0, 0],
      ]);
      const x = m.x + dx,
        y = m.y + dy;
      if (!m.boss && empty(g, x, y)) {
        m.x = x;
        m.y = y;
      } else if (
        x === g.player.x &&
        y === g.player.y &&
        !m.npc &&
        random(g) < 0.6 &&
        (m.level <= g.player.level ||
          random(g) <= Math.min(0.8, 0.48 * g.difficulty) * 1.1 * g.floor)
      ) {
        g.combat = m.id;
        log(g, m.name + " challenges you. Fight or flee.");
      }
    }
}
export function availableSpells(g: Game) {
  const elements = [...g.inventory, ...g.player.weapons]
    .filter((i) => i.kind === "tome")
    .map((i) => i.element);
  return spells.filter(
    (s) =>
      elements.includes(s.element) &&
      g.player.stats.Magic >= s.req &&
      g.player.stats.Mana >= s.cost &&
      (s.when === "any" || s.when === (g.combat ? "combat" : "peace")),
  );
}
function use(g: Game, i: Item) {
  const p = g.player,
    m = g.monsters.find((m) => m.id === g.combat);
  if (
    g.combat &&
    [
      "stat",
      "nuke",
      "shield",
      "teleport",
      "vision",
      "sight",
      "hand",
      "bag",
    ].includes(i.kind)
  )
    throw Error("Use this outside combat.");
  if (i.kind === "weapon" || i.kind === "tome") {
    if (i.kind === "weapon" && (i.weight || 0) * 2 > p.stats.Power)
      throw Error("Not enough Power to wield this weapon.");
    if (i.kind === "weapon" && p.weapons.length >= g.hands) {
      g.inventory.push(p.weapons.shift()!);
    }
    p.weapons.push(i);
    g.inventory = g.inventory.filter((a) => a.id !== i.id);
    log(g, "Equipped " + i.name);
    return;
  }
  switch (i.kind) {
    case "heal":
      heal(p, i.value);
      break;
    case "mana":
      p.stats.Mana = 10;
      break;
    case "antidote":
      delete p.effects.Poison;
      break;
    case "rope":
      if (!m) throw Error("Use the rope when fleeing.");
      g.combat = undefined;
      break;
    case "projectile":
      if (!m) throw Error("A target is required.");
      if (
        m.className !== "Dragon" ||
        random(g) < 0.5 ||
        (i.value <= 10 && random(g) > 0.33)
      )
        hurt(g, m, i.value);
      else log(g, "The dragon dodged!");
      break;
    case "armor":
      p.stats.Armor = (p.stats.Armor || 0) + i.value;
      break;
    case "stat":
      p.stats[i.stat!] += i.value;
      break;
    case "boost": {
      const e = p.effects[i.stat + " Booster"];
      p.effects[i.stat + " Booster"] = [
        e ? i.duration! : 1,
        (e?.[1] || 0) + i.value,
      ];
      break;
    }
    case "shield":
      p.effects["Nuke Shield"] = [1, 1];
      break;
    case "nuke":
      for (const m of [...g.monsters]) kill(g, m, false, true);
      if (p.effects["Nuke Shield"]) delete p.effects["Nuke Shield"];
      else hurt(g, p, p.hp, "Nuke");
      break;
    case "teleport":
      Object.assign(p, position(g));
      g.pendingLoot = undefined;
      break;
    case "vision":
      g.light = g.light.map((r) => r.map(() => true));
      break;
    case "sight":
      g.sight++;
      break;
    case "hand":
      g.hands++;
      break;
    case "bag":
      g.capacity = Math.max(g.capacity, i.value);
      break;
    case "xp":
      g.xp += 100;
      checkLevel(g);
      break;
    case "trash":
      log(g, "Please do not litter.");
      break;
  }
  log(g, "Used " + i.name);
  if (!["teleport", "trash"].includes(i.kind))
    g.inventory = g.inventory.filter((a) => a.id !== i.id);
}
export function act(input: Game, a: Action): Game {
  const g = structuredClone(input),
    p = g.player;
  g.revision++;
  if (g.status === "dead") throw Error("This journey has ended.");
  if (g.status === "won" && a.type !== "continue")
    throw Error("Continue your journey first.");
  if (g.pendingLevels && a.type !== "level")
    throw Error("Choose your level-up bonus first.");
  const m = g.monsters.find((m) => m.id === g.combat);
  switch (a.type) {
    case "level": {
      if (!g.pendingLevels) throw Error("No level-up bonus is pending.");
      const allowed = [
        "Health",
        "Power",
        "Luck",
        "Magic",
        "EXP",
        "Accuracy + Speed",
        ...(p.className === "Knight" && p.level % 3 === 0 ? ["Armor"] : []),
      ];
      if (!allowed.includes(a.stat)) throw Error("Invalid bonus");
      if (a.stat === "EXP") g.xp += 20;
      else if (a.stat === "Accuracy + Speed") {
        p.stats.Accuracy += 2;
        p.stats.Speed += 2;
      } else p.stats[a.stat] = (p.stats[a.stat] || 0) + 2;
      g.pendingLevels = 0;
      checkLevel(g);
      break;
    }
    case "move": {
      if (m || g.pendingLoot)
        throw Error("Finish the current encounter first.");
      if (Math.abs(a.dx) + Math.abs(a.dy) !== 1) throw Error("Invalid move");
      const x = p.x + a.dx,
        y = p.y + a.dy;
      if (g.tiles[y]?.[x] !== 0) break;
      const enemy = g.monsters.find((m) => m.x === x && m.y === y);
      if (enemy) {
        g.combat = enemy.id;
        log(g, `Encountered ${enemy.name}.`);
        break;
      }
      p.x = x;
      p.y = y;
      poison(g);
      if (p.hp <= 0) break;
      const pod = g.pods.find((i) => i.x === x && i.y === y);
      if (pod) {
        const magic =
          [...g.inventory, ...p.weapons].some((i) => i.kind === "tome") &&
          ((random(g) > 0.5 && p.stats.Mana !== p.stats.Magic) ||
            p.hp === p.stats.Health);
        if (magic && p.stats.Mana < 10) {
          p.stats.Mana = Math.min(10, p.stats.Mana + (pod.max ? 10 : 3));
          g.pods = g.pods.filter((i) => i !== pod);
          log(g, "Mana pod restored your mana.");
        } else if (!magic && p.hp < p.stats.Health) {
          heal(p, pod.max ? p.stats.Health : p.stats.Health / 4 + 1);
          g.pods = g.pods.filter((i) => i !== pod);
          log(g, "Health pod restored your health.");
        }
      }
      const loot = g.loot.find((i) => i.x === x && i.y === y);
      if (loot) g.pendingLoot = loot.item;
      monsterTurn(g);
      break;
    }
    case "pickup": {
      const i = g.pendingLoot;
      if (!i) break;
      if (!g.loot.some((l) => l.item.id === i.id && l.x === p.x && l.y === p.y))
        throw Error("That treasure is no longer within reach.");
      if (i.auto) {
        use(g, i);
      } else {
        if (g.inventory.length + Number(p.weapons.length > 0) >= g.capacity)
          throw Error("Inventory full. Use or drop an item.");
        g.inventory.push(i);
      }
      g.loot = g.loot.filter((l) => l.item.id !== i.id);
      g.pendingLoot = undefined;
      break;
    }
    case "ignore":
      g.pendingLoot = undefined;
      break;
    case "wait":
      if (m) throw Error("Finish combat first.");
      monsterTurn(g);
      break;
    case "attack": {
      if (!m) throw Error("No enemy");
      if (m.npc) log(g, m.name + ": It did not have to end this way…");
      const first =
        p.stats.Speed -
          p.weapons.reduce((n, w) => n + (w.weight || 0) / 4, 0) >=
        m.stats.Speed;
      if (first) strike(g, p, m, a.unarmed);
      if (m.hp > 0 && p.hp > 0) strike(g, m, p);
      if (!first && p.hp > 0 && m.hp > 0) strike(g, p, m, a.unarmed);
      break;
    }
    case "flee":
      if (!m) break;
      if (random(g) < fleeChance(p, m)) {
        g.combat = undefined;
        log(g, "You escaped safely.");
      } else {
        log(g, "Could not get away!");
        strike(g, m, p);
      }
      break;
    case "leave":
      g.combat = undefined;
      log(g, "You end the encounter.");
      break;
    case "use": {
      const i = g.inventory.find((i) => i.id === a.id);
      if (!i) throw Error("Item not found");
      use(g, i);
      break;
    }
    case "drop": {
      const i = g.inventory.find((i) => i.id === a.id);
      if (!i) throw Error("Item not found");
      g.inventory = g.inventory.filter((i) => i.id !== a.id);
      g.loot.push({ x: p.x, y: p.y, item: i });
      break;
    }
    case "unequip": {
      const i = p.weapons.find((i) => i.id === a.id);
      if (!i) throw Error("Equipment not found");
      if (g.inventory.length + 1 + Number(p.weapons.length > 1) > g.capacity)
        throw Error("Inventory full. Use or drop an item before unequipping.");
      p.weapons = p.weapons.filter((i) => i.id !== a.id);
      g.inventory.push(i);
      break;
    }
    case "cast": {
      const s = availableSpells(g).find((s) => s.name === a.spell);
      if (!s) throw Error("Spell unavailable");
      p.stats.Mana -= s.cost;
      log(g, p.name + " cast " + s.name);
      switch (s.name) {
        case "Teleport":
          Object.assign(p, position(g));
          g.pendingLoot = undefined;
          break;
        case "Gust":
          hurt(g, m!, 10);
          break;
        case "Healing Winds":
          heal(p, p.stats.Health / 2);
          p.effects = {};
          break;
        case "Light": {
          const x = roll(g, 30),
            y = roll(g, 15);
          g.light = g.light.map((r, yy) =>
            r.map(
              (v, xx) =>
                v ||
                Math.floor(Math.abs(xx - x) / 2) + Math.abs(yy - y) < g.sight,
            ),
          );
          break;
        }
        case "Burn":
          hurt(g, m!, Math.min(40, p.stats.Magic));
          break;
        case "Annihilate":
          if (m!.className === "Dragon") log(g, "The spell was countered!");
          else hurt(g, m!, m!.hp);
          break;
        case "Cleanse":
          p.effects = {};
          break;
        case "Heal":
          heal(p, p.stats.Magic);
          break;
        case "Grow":
          p.stats.Health += 10;
          break;
        case "Mystery":
          if (random(g) > 0.75)
            hurt(g, p, Math.min(p.hp - 1, p.stats.Health / 4));
          else {
            const loc = position(g);
            g.loot.push({ ...loc, item: randomItem(g) });
          }
          break;
      }
      break;
    }
    case "ascend":
      if (m || p.x !== g.stairs.x || p.y !== g.stairs.y)
        throw Error("Stand on the cleared stairs first.");
      if (g.stairs.locked) {
        if (!g.keys) throw Error("Find the key carrier first.");
        g.keys--;
        g.stairs.locked = false;
      }
      if (g.floor === 2) {
        g.status = "won";
        g.score += 1000;
        log(
          g,
          "Ruthagor is defeated. You won! Continue to explore deeper floors.",
        );
      } else {
        g.floor++;
        g.score += 500;
        generateFloor(g);
      }
      break;
    case "continue":
      if (g.status !== "won") throw Error("No completed campaign");
      g.status = "playing";
      g.floor++;
      g.score += 500;
      generateFloor(g);
      break;
    case "talk":
      if (!m?.npc) throw Error("No NPC");
      log(
        g,
        m.npc.done
          ? `${m.name}: We have already traded. Safe travels.`
          : `${m.name} of the ${m.npc.tribe}: ${m.npc.line} My deal: ${m.npc.deal}. Accept, or leave.`,
      );
      break;
    case "deal": {
      if (!m?.npc || m.npc.done) throw Error("No available deal");
      switch (m.npc.deal) {
        case "Life":
          heal(m, p.hp);
          p.hp = 1;
          break;
        case "Health Gain":
          heal(p, m.hp);
          kill(g, m, false);
          break;
        case "All Items":
          g.inventory = [];
          if (p.weapons.length) m.weapons.push(p.weapons.shift()!);
          break;
        case "Item of Choice":
        case "Random Item":
          if (g.inventory.length) {
            const index =
              m.npc.deal === "Random Item"
                ? roll(g, g.inventory.length)
                : a.id
                  ? g.inventory.findIndex((i) => i.id === a.id)
                  : 0;
            if (index < 0) throw Error("Choose an inventory item to trade.");
            const [item] = g.inventory.splice(index, 1);
            if (["weapon", "tome"].includes(item.kind)) m.weapons.push(item);
          }
          break;
        case "Weapon":
          if (p.weapons.length) m.weapons.push(p.weapons.shift()!);
          else if (m.npc.acceptsNoWeapon === false) {
            log(g, "You have no weapon. The chief declines the deal.");
            g.combat = undefined;
            return g;
          }
          break;
        case "Death Wheel": {
          const bar = roll(g, 100),
            hit = roll(g, 100);
          log(g, `Death Wheel: ${hit}, threshold ${bar}.`);
          if (hit < bar) hurt(g, p, p.hp, "Deal");
          break;
        }
        case "Stat": {
          const s = pick(g, [
              "Power",
              "Magic",
              "Luck",
              "Speed",
              "Accuracy",
              "Health",
            ]),
            rolled = roll(g, 5 + Math.floor(m.level / 10));
          const n =
            s === "Health"
              ? Math.min(rolled, Math.max(0, p.stats.Health - 1))
              : rolled;
          p.stats[s] -= n;
          if (s === "Health") p.hp = Math.min(p.hp, p.stats.Health);
          m.stats[s] += n;
          break;
        }
      }
      if (p.hp > 0 && m.npc.deal !== "Health Gain") {
        const gift = pick(g, [
          "Awathons Broadsword",
          "EXP Pill",
          "Piece of Trash",
          "Mystery Staff",
        ]);
        const i = makeItem(g, gift);
        if (gift === "Awathons Broadsword")
          Object.assign(i, {
            kind: "weapon",
            attack: 25,
            weight: 10,
            luck: 11,
            uses: 50,
            maxUses: 50,
          });
        if (gift === "EXP Pill")
          Object.assign(i, { kind: "xp", description: "+100 EXP." });
        if (gift === "Mystery Staff") {
          i.kind = "tome";
          staff(i, "Mystery");
        }
        g.loot.push({ x: p.x, y: p.y, item: i });
        g.pendingLoot = i;
        log(g, "A gift: " + i.name);
        m.npc.done = true;
        if (random(g) > 0.2) kill(g, m, false);
      }
      g.combat = undefined;
      break;
    }
    default:
      throw Error("Unknown action");
  }
  return g;
}

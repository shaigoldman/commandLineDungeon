import {
  expansionFloor,
  applyCurse,
  villagerDeath,
  spawnGhosts,
  rememberVillager,
  summon,
  makeVillager,
  buy,
  quote,
  openChest,
  unlockDoor,
  enterSecret,
  chestReward,
} from "./expansion";
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
  g.logSerial = (g.logSerial ?? g.log.length) + 1;
  g.log.push(s);
  g.log = g.log.slice(-100);
}
export function makeItem(g: Game, name: string): Item {
  const named =
    /^(Fragile|Iron|Steel|Lucky|Magic|Obsidian) (Sword|Spear|Axe)$/.exec(name);
  const element = /^(Wind|Fire|Water|Mystery) Staff$/.exec(name)?.[1];
  const base = named?.[2] || (element ? "Magic Staff" : name);
  const d = itemDefinitions.find((d) => d[0] === base);
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
  if (i.kind === "candy")
    i.description =
      i.value === 100
        ? "Gain 100 EXP: one level-up and its stat choice."
        : `Gain ${i.value} EXP.`;
  if (i.kind === "summon-stone") {
    i.uses = i.maxUses = 1 + roll(g, 5);
    i.description = `Summon a random mob next to you. ${i.uses} uses before breaking.`;
  }
  if (i.kind === "mana") i.description = "Fully restore 10 mana.";
  if (name === "Pot of Gold") {
    i.value = Math.min(50, 1 + Math.floor(-Math.log(Math.max(random(g), 1e-9)) * 9));
    i.description = `A gremlin's hoard: ${i.value} gold coins.`;
  }
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
  if (["bag", "hand", "sight", "gold"].includes(i.kind)) i.auto = true;
  if (i.kind === "weapon") {
    const chance = 0.5 - g.floor / 10;
    let m = 0;
    if (named)
      m = ["Fragile", "Iron", "Steel", "Lucky", "Magic", "Obsidian"].indexOf(
        named[1],
      );
    else while (m < 5 && random(g) > chance) m++;
    const material = ["Fragile", "Iron", "Steel", "Lucky", "Magic", "Obsidian"][
      m
    ];
    i.attack = i.value;
    i.weight = ({ Sword: 2, Spear: 4, Axe: 6 } as Record<string, number>)[base];
    i.luck = ({ Sword: 3, Spear: 1, Axe: 6 } as Record<string, number>)[base];
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
    i.name = material + " " + base;
  }
  if (i.kind === "tome") {
    i.element = element || pick(g, ["Wind", "Fire", "Water"]);
    staff(i, i.element);
  }
  if (name === "Awathons Broadsword")
    Object.assign(i, {
      kind: "weapon",
      rarity: 10,
      attack: 25,
      weight: 10,
      luck: 11,
      uses: 50,
      maxUses: 50,
    });
  if (name === "EXP Pill")
    Object.assign(i, { kind: "xp", rarity: 9, description: "Gain 100 EXP." });
  if (name === "Piece of Trash") Object.assign(i, { rarity: 1 });
  const desc: Record<string, string> = {
    antidote: "Cure poison and curses.",
    seismic:
      "Deal exactly 5 damage to every monster, NPC and yourself, ignoring armor.",
    immunity: "Permanent poison immunity. Curses are not poison.",
    double: `Permanently double ${i.stat}.`,
    gold: `Add ${i.value} gold to your purse. No bag slot needed.`,
    key:
      i.value === 2
        ? "Opens chests or secret doors, not stairs; consumed once."
        : "Opens regular chests only, not stairs; consumed once.",
    rope: "Guarantee escape from combat.",
    nuke: "Destroy all monsters and yourself unless shielded.",
    shield: "Protect against one nuke.",
    teleport: "Reusable teleport to an open tile; also escapes encounters.",
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
        (d) => d[2] <= rarity && d[0] !== "Small Health Potion" && d[0] !== "Pot of Gold",
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
    (g.inSecret ? x >= 33 : x < 29) &&
    !(g.inSecret && x === 33 && y === 7) &&
    !g.monsters.some((m) => m.hp > 0 && m.x === x && m.y === y) &&
    !(g.player.x === x && g.player.y === y) &&
    !g.loot.some((i) => i.x === x && i.y === y) &&
    !g.pods.some((i) => i.x === x && i.y === y) &&
    !g.chests?.some((c) => !c.opened && c.x === x && c.y === y) &&
    !(g.stairs.x === x && g.stairs.y === y)
  );
}
function position(g: Game) {
  const a: { x: number; y: number }[] = [];
  for (let y = 0; y < g.tiles.length; y++)
    for (let x = g.inSecret ? 33 : 0; x < (g.inSecret ? 40 : 29); x++)
      if (empty(g, x, y)) a.push({ x, y });
  if (!a.length) throw Error("No open tiles");
  return pick(g, a);
}
export function generateFloor(g: Game) {
  g.chests = [];
  g.secretDoors = [];
  g.inSecret = undefined;
  g.haunting = [];
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
    const rare = random(g) < 0.035;
    const m = makeMonster(
      g,
      rare ? pick(g, ["Gremlin", "Shadow", "Robot", "Dark Fairy", "Wild Villager"]) : pick(g, types),
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
  expansionFloor(g);
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
    gold: 0,
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
/** Preview only: no RNG, durability, mana or effect duration is consumed. */
export function attackInitiative(player: Actor) {
  return (
    player.stats.Speed -
    player.weapons.reduce((n, w) => n + (w.weight || 0) / 4, 0)
  );
}
export function incomingDamage(enemy: Actor, player: Actor) {
  const s = combatAttackStats(enemy);
  const armor = Math.max(0, player.stats.Armor || 0);
  const normal = Math.max(0, Math.trunc(s.Attack - armor));
  const critical =
    s.Luck > 0 ? Math.max(0, Math.trunc(s.Attack * 3 - armor)) : normal;
  return {
    normal,
    critical,
    lethal: normal >= player.hp,
    criticalLethal: critical >= player.hp,
    enemyFirst: attackInitiative(player) < enemy.stats.Speed,
  };
}
/** Floor use consumes an item in place without using an inventory slot. */
export function canUseFromFloor(item: Item) {
  return [
    "candy",
    "seismic",
    "immunity",
    "double",
    "gold",
    "heal",
    "mana",
    "antidote",
    "armor",
    "stat",
    "boost",
    "shield",
    "nuke",
    "vision",
    "sight",
    "hand",
    "bag",
    "xp",
    "teleport",
  ].includes(item.kind);
}
/** Floor equipment never disappears: a displaced weapon stays here if the bag is full. */
export function floorEquipPlan(g: Game, item: Item) {
  const replaced =
    ["weapon", "tome"].includes(item.kind) && g.player.weapons.length >= g.hands
      ? g.player.weapons[0]
      : undefined;
  const leaveOnFloor = !!replaced && g.inventory.length + 2 > g.capacity;
  const problem = !["weapon", "tome"].includes(item.kind)
    ? "This item cannot be equipped."
    : itemUseProblem(g, item) ||
      (g.inventory.length + 1 > g.capacity
        ? "Free one bag slot for equipped gear first."
        : undefined);
  return { replaced, leaveOnFloor, problem };
}
/** Read-only availability shared by item menus; use() remains authoritative. */
export function itemUseProblem(g: Game, i: Item): string | undefined {
  if (g.status === "dead") return "This journey has ended.";
  if (g.status === "won") return "Continue your journey first.";
  if (g.pendingLevels) return "Choose your level bonus first.";
  if (i.kind === "weapon" && (i.weight || 0) * 2 > g.player.stats.Power)
    return `Requires ${(i.weight || 0) * 2} Power; you have ${g.player.stats.Power}.`;
  if (
    g.combat &&
    ["stat", "nuke", "shield", "vision", "sight", "hand", "bag"].includes(
      i.kind,
    )
  )
    return "Use outside combat.";
  if (!g.combat && ["rope", "projectile"].includes(i.kind))
    return "Requires an enemy encounter.";
  if (i.kind === "heal" && g.player.hp >= g.player.stats.Health)
    return "Health is already full.";
  if (i.kind === "mana" && g.player.stats.Mana >= 10)
    return "Mana is already full.";
  if (
    i.kind === "antidote" &&
    !g.player.effects.Poison &&
    !g.player.effects.Curse
  )
    return "You have no poison or curse.";
  if (i.kind === "immunity" && g.player.poisonImmune)
    return "Already immune to poison.";
  if (i.kind === "key")
    return i.value === 2
      ? "Use at chests or secret doors, not stairs."
      : "Use at regular chests only, not stairs.";
}
export function hitRate(a: Actor, b: Actor) {
  const s = attackStats(a),
    e = attackStats(b);
  return Math.max(40, s.Accuracy + s.Speed - e.Speed * 1.2);
}
export function fleeChance(a: Actor, b: Actor) {
  if (b.className === "Shadow") return 0.12;
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
function hurt(g: Game, a: Actor, n: number, source = "Attack", reward = true) {
  if (source === "Attack") n = Math.max(0, n - Math.max(0, a.stats.Armor || 0));
  n = Math.trunc(n);
  a.hp = Math.max(0, a.hp - n);
  log(g, `${a.name} takes ${n} ${["Poison", "Fire"].includes(source) ? source.toLowerCase() + " " : ""}damage.`);
  if (a.hp <= 0) {
    if (a.id === "player") {
      g.status = "dead";
      g.combat = undefined;
      log(g, "Your journey ends here. Your score: " + g.score);
    } else kill(g, a, reward, reward);
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
  if (m.merchant) {
    villagerDeath(g, m, reward);
    return;
  }
  if (m.className === "Wild Villager") villagerDeath(g, m, reward);
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
      log(g, "Acquired a Stair Key!");
    } else {
      const i = m.className === "Gremlin"
        ? makeItem(g, "Pot of Gold")
        : m.className === "Dark Fairy"
          ? chestReward(g)
          : randomItem(g, g.floor + g.player.stats.Luck * 0.01);
      g.loot.push({ x: m.x, y: m.y, item: i });
    }
  }
  if (m.className === "Robot") {
    log(g, "The robot explodes!");
    for (const a of [...g.monsters, g.player])
      if (Math.abs(a.x - m.x) + Math.abs(a.y - m.y) <= 2)
        hurt(g, a, 8 + Math.floor(m.level / 2), "Explosion", reward);
  }
  if (reward && g.status === "playing") checkLevel(g);
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
  if (a.burn) {
    const [turns, damage] = a.burn;
    hurt(g, a, damage, "Fire");
    if (a.hp <= 0) return false;
    if (turns <= 1) delete a.burn;
    else a.burn[0]--;
  }
  log(g, `${a.name} attacks ${b.name}.`);
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
  const hpBeforeHit = b.hp;
  hurt(g, b, damage, "Attack", a.id === "player");
  if (a.drain) heal(a, damage);
  if (
    a.curseChance &&
    b.id === "player" &&
    b.hp > 0 &&
    b.hp < hpBeforeHit &&
    random(g) < a.curseChance
  )
    applyCurse(g);
  if (a.poison && b.hp > 0 && !b.poisonImmune) {
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
  if (e && !g.player.poisonImmune) {
    hurt(g, g.player, e[1], "Poison");
    if (--e[0] <= 0) delete g.player.effects.Poison;
  }
}
function monsterTurn(g: Game) {
  g.turn++;
  const curse = g.player.effects.Curse;
  if (curse) {
    hurt(g, g.player, curse[1], "Curse");
    if (--curse[0] <= 0) delete g.player.effects.Curse;
  }
  spawnGhosts(g);
  if (g.player.hp <= 0) {
    hurt(g, g.player, 0, "Exhaustion");
    return;
  }
  for (let pass = 0; pass < (g.player.stats.Speed <= 5 ? 2 : 1); pass++)
    for (const m of [...g.monsters]) {
      if (!!g.inSecret !== m.x >= 29 || m.spawnTurn === g.turn) continue;
      if (pass === 1 && m.stats.Speed <= 5) continue;
      if (m.hp <= 0) {
        kill(g, m);
        continue;
      }
      if (g.status !== "playing" || g.combat) break;
      if (g.player.stats.Speed > 5 && g.turn % 2 === 0 && m.stats.Speed <= 5)
        continue;
      for (let step = 0; step < (m.className === "Shadow" ? 2 : 1); step++) {
      const [dx, dy] = pick(g, [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [0, 0],
      ]);
      const x = m.x + dx,
        y = m.y + dy;
      const other = g.monsters.find((a) => a.id !== m.id && a.x === x && a.y === y);
      if (m.className === "Shadow" && other && (other.merchant || other.npc)) {
        strike(g, m, other);
        continue;
      }
      if (!m.boss && empty(g, x, y)) {
        m.x = x;
        m.y = y;
        if (m.burn) {
          const [turns, damage] = m.burn;
          hurt(g, m, damage, "Fire");
          if (m.hp <= 0) break;
          if (turns <= 1) delete m.burn;
          else m.burn[0]--;
        }
      } else if (
        x === g.player.x &&
        y === g.player.y &&
        !m.npc &&
        !m.merchant &&
        random(g) < (m.className === "Shadow" ? 0.95 : 0.6) &&
        (m.className === "Shadow" || m.level <= g.player.level ||
          random(g) <= Math.min(0.8, 0.48 * g.difficulty) * 1.1 * g.floor)
      ) {
        g.combat = m.id;
        g.encounter = {
          enemyId: m.id,
          origin: "enemy",
          engaged: false,
          exchanges: 0,
        };
        log(g, m.name + " challenges you. Fight or flee.");
        break;
      }
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
      (s.name !== "Unseal" || (!g.pendingLoot && (
        (g.stairs.locked && Math.abs(g.stairs.x - g.player.x) + Math.abs(g.stairs.y - g.player.y) <= 1) || !![
        ...(g.chests || []).filter((c) => !c.opened),
        ...(g.secretDoors || []).filter((d) => !d.unlocked),
      ].find((o) => Math.abs(o.x - g.player.x) + Math.abs(o.y - g.player.y) <= 1)))) &&
      (s.when === "any" || s.when === (g.combat ? "combat" : "peace")),
  );
}
function use(g: Game, i: Item) {
  const p = g.player,
    m = g.monsters.find((m) => m.id === g.combat);
  if (
    g.combat &&
    ["stat", "nuke", "shield", "vision", "sight", "hand", "bag"].includes(
      i.kind,
    )
  )
    throw Error("Use this outside combat.");
  if (i.kind === "weapon" || i.kind === "tome") {
    if (i.kind === "weapon" && (i.weight || 0) * 2 > p.stats.Power)
      throw Error("Not enough Power to wield this weapon.");
    g.inventory = g.inventory.filter((a) => a.id !== i.id);
    const displaced: Item[] = [];
    while (p.weapons.length >= g.hands) displaced.push(p.weapons.shift()!);
    p.weapons.push(i);
    for (const old of displaced) {
      if (g.inventory.length + 1 < g.capacity) g.inventory.push(old);
      else {
        g.loot.push({ x: p.x, y: p.y, item: old });
        log(g, old.name + " left on the floor because your bag is full.");
      }
    }
    log(g, "Equipped " + i.name);
    return;
  }
  switch (i.kind) {
    case "candy":
      g.xp += i.value;
      checkLevel(g);
      break;
    case "summon-stone":
      summon(g, true);
      i.uses!--;
      log(g, `Summoner Stone: ${i.uses} uses left.`);
      if (i.uses! > 0) {
        i.description = `Summon a random mob next to you. ${i.uses} uses before breaking.`;
        return;
      }
      log(g, "Summoner Stone broke.");
      break;
    case "seismic":
      for (const target of [...g.monsters]) hurt(g, target, 5, "Seismic");
      hurt(g, p, 5, "Seismic");
      break;
    case "immunity":
      p.poisonImmune = true;
      delete p.effects.Poison;
      break;
    case "double": {
      const stat = i.stat!;
      p.stats[stat] = (p.stats[stat] || 0) * 2;
      if (stat === "Health") p.hp *= 2;
      break;
    }
    case "gold":
      p.gold = (p.gold || 0) + i.value;
      break;
    case "key":
      throw Error("Use this key at a chest or secret door.");
    case "heal":
      heal(p, i.value);
      break;
    case "mana":
      p.stats.Mana = 10;
      break;
    case "antidote":
      delete p.effects.Poison;
      delete p.effects.Curse;
      break;
    case "rope":
      if (!m) throw Error("Use the rope when fleeing.");
      g.combat = undefined;
      break;
    case "projectile":
      if (!m) throw Error("A target is required.");
      g.encounter = {
        enemyId: m.id,
        origin: "resumed",
        exchanges: 0,
        ...g.encounter,
        engaged: true,
      };
      if (
        m.className !== "Dragon" ||
        random(g) < 0.5 ||
        (i.value <= 10 && random(g) > 0.33)
      )
        hurt(g, m, i.value);
      else log(g, "The dragon dodged!");
      g.encounter.result = `You threw ${i.name}. ${m.name}: ${m.hp} HP remaining.`;
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
      g.pendingChest = undefined;
      g.pendingDoor = undefined;
      g.combat = undefined;
      g.encounter = undefined;
      log(g, "Teleported to safety.");
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
/** Coins never interrupt exploration, take bag space, or need inspection. */
function collectFloorGold(g: Game) {
  const coins = g.loot.filter(
    (l) => l.x === g.player.x && l.y === g.player.y && l.item.kind === "gold",
  );
  if (!coins.length) return;
  const ids = new Set(coins.map((l) => l.item.id));
  const amount = coins.reduce((sum, l) => sum + l.item.value, 0);
  g.player.gold = (g.player.gold || 0) + amount;
  g.loot = g.loot.filter((l) => !ids.has(l.item.id));
  if (g.pendingLoot && ids.has(g.pendingLoot.id)) {
    g.pendingLoot = g.loot.find(
      (l) => l.x === g.player.x && l.y === g.player.y,
    )?.item;
  }
  log(g, `Collected ${amount} gold.`);
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
  if (["open-chest", "unlock-door"].includes(a.type) && g.pendingLevels)
    throw Error("Choose your level bonus first.");
  switch (a.type) {
    case "buy": {
      if (!m?.merchant || Math.abs(m.x - p.x) + Math.abs(m.y - p.y) > 1)
        throw Error("No villager shop in this encounter.");
      const item = buy(g, m, a.id);
      if (item.auto) {
        // Trading is a peaceful action even when the villager is the current encounter.
        const encounter = g.combat;
        g.combat = undefined;
        use(g, item);
        g.combat = encounter;
      }
      else g.inventory.push(item);
      g.marketNotice = `Bought ${item.name}.`;
      log(g, g.marketNotice);
      break;
    }
    case "quote":
    case "sell":
      if (!m?.merchant || Math.abs(m.x - p.x) + Math.abs(m.y - p.y) > 1)
        throw Error("No villager shop in this encounter.");
      quote(g, m, a.id, a.type === "sell");
      break;
    case "open-chest":
      openChest(g, a.id);
      break;
    case "unlock-door":
      unlockDoor(g, a.id);
      break;
    case "dismiss-object":
      g.pendingChest = undefined;
      g.pendingDoor = undefined;
      break;
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
      if (m) throw Error("Finish the current encounter first.");
      if (Math.abs(a.dx) + Math.abs(a.dy) !== 1) throw Error("Invalid move");
      g.pendingLoot = undefined;
      const x = p.x + a.dx,
        y = p.y + a.dy;
      if (g.inSecret && x === 32 && y === 7) {
        const door = g.secretDoors?.find((d) => d.id === g.inSecret)!;
        p.x = door.x - 1;
        p.y = door.y;
        g.inSecret = undefined;
        if (g.monsters.some((m) => m.x === p.x && m.y === p.y)) {
          const spots = [];
          for (let yy = 0; yy < g.tiles.length; yy++)
            for (let xx = 0; xx < 29; xx++)
              if (
                g.tiles[yy][xx] === 0 &&
                !g.monsters.some((m) => m.x === xx && m.y === yy)
              )
                spots.push({ x: xx, y: yy });
          spots.sort(
            (a, b) =>
              Math.abs(a.x - p.x) +
              Math.abs(a.y - p.y) -
              Math.abs(b.x - p.x) -
              Math.abs(b.y - p.y),
          );
          if (!spots.length) throw Error("The dungeon exit is blocked.");
          Object.assign(p, spots[0]);
        }
        g.pendingChest = undefined;
        g.pendingDoor = undefined;
        monsterTurn(g);
        log(g, "Returned to the dungeon.");
        break;
      }
      const door = g.secretDoors?.find((d) => d.x === x && d.y === y);
      if (door) {
        if (door.unlocked) enterSecret(g, door);
        else {
          g.pendingDoor = door.id;
          log(g, "Secret door: a Rare Key is required.");
        }
        break;
      }
      const chest = g.chests?.find((c) => !c.opened && c.x === x && c.y === y);
      if (g.tiles[y]?.[x] !== 0) break;
      g.pendingChest = undefined;
      g.pendingDoor = undefined;
      const enemy = g.monsters.find((m) => m.x === x && m.y === y);
      if (enemy) {
        g.combat = enemy.id;
        g.encounter = {
          enemyId: enemy.id,
          origin: "inspection",
          engaged: false,
          exchanges: 0,
        };
        rememberVillager(g, enemy);
        log(g, `Encountered ${enemy.name}.`);
        break;
      }
      p.x = x;
      p.y = y;
      if (chest) {
        g.pendingChest = chest.id;
        log(g, "A chest. Open it or leave it and continue walking.");
      }
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
      collectFloorGold(g);
      const loot = g.loot.find((i) => i.x === x && i.y === y);
      if (loot) g.pendingLoot = loot.item;
      monsterTurn(g);
      break;
    }
    case "throw-floor": {
      const ground = g.loot.find(
        (l) => l.item.id === a.id && l.x === p.x && l.y === p.y,
      );
      const target = g.monsters.find((m) => m.id === a.target);
      if (!ground || ground.item.kind !== "projectile")
        throw Error("No throwing item at your feet.");
      if (!target || Math.abs(target.x - p.x) + Math.abs(target.y - p.y) !== 1)
        throw Error("Choose an adjacent enemy.");
      if (g.combat && g.combat !== target.id)
        throw Error("Finish your current encounter first.");
      g.combat = target.id;
      g.encounter = {
        enemyId: target.id,
        origin: "inspection",
        engaged: true,
        exchanges: 0,
      };
      use(g, ground.item);
      g.loot = g.loot.filter((l) => l.item.id !== a.id);
      g.pendingLoot = undefined;
      break;
    }
    case "equip-floor": {
      const i =
        a.id !== undefined
          ? g.loot.find((l) => l.item.id === a.id && l.x === p.x && l.y === p.y)
              ?.item
          : g.pendingLoot ||
            g.loot.find((l) => l.x === p.x && l.y === p.y)?.item;
      if (
        !i ||
        !g.loot.some((l) => l.item.id === i.id && l.x === p.x && l.y === p.y)
      )
        throw Error("That equipment is no longer within reach.");
      const plan = floorEquipPlan(g, i);
      if (plan.problem) throw Error(plan.problem);
      use(g, i);
      if (
        plan.leaveOnFloor &&
        plan.replaced &&
        !g.loot.some((l) => l.item.id === plan.replaced!.id)
      ) {
        g.inventory = g.inventory.filter((a) => a.id !== plan.replaced!.id);
        g.loot.push({ x: p.x, y: p.y, item: plan.replaced });
        log(
          g,
          `Equipped ${i.name}. ${plan.replaced.name} was left on the floor because your bag is full.`,
        );
      }
      g.loot = g.loot.filter((l) => l.item.id !== i.id);
      g.pendingLoot = undefined;
      break;
    }
    case "use-floor": {
      const i =
        a.id !== undefined
          ? g.loot.find((l) => l.item.id === a.id && l.x === p.x && l.y === p.y)
              ?.item
          : g.pendingLoot ||
            g.loot.find((l) => l.x === p.x && l.y === p.y)?.item;
      if (
        !i ||
        !g.loot.some((l) => l.item.id === i.id && l.x === p.x && l.y === p.y)
      )
        throw Error("That treasure is no longer within reach.");
      if (!canUseFromFloor(i))
        throw Error("Pick up this item before using it.");
      use(g, i);
      g.loot = g.loot.filter((l) => l.item.id !== i.id);
      g.pendingLoot = undefined;
      break;
    }
    case "pickup-swap": {
      const incoming = a.incomingId
        ? g.loot.find(
            (l) => l.item.id === a.incomingId && l.x === p.x && l.y === p.y,
          )?.item
        : g.pendingLoot;
      if (
        !incoming ||
        !g.loot.some(
          (l) => l.item.id === incoming.id && l.x === p.x && l.y === p.y,
        )
      )
        throw Error("No item within reach to swap.");
      if (a.id === incoming.id) {
        g.pendingLoot = undefined;
        log(g, "Left " + incoming.name + " on the floor.");
        break;
      }
      const held = p.weapons.length === 1 && p.weapons[0].id === a.id;
      const dropped =
        g.inventory.find((i) => i.id === a.id) ||
        (held ? p.weapons[0] : undefined);
      if (!dropped)
        throw Error("Choose a carried item or leave the incoming item.");
      if (g.inventory.length + Number(p.weapons.length > 0) > g.capacity)
        throw Error("Resolve bag capacity first.");
      g.inventory = g.inventory.filter((i) => i.id !== dropped.id);
      if (held) p.weapons = [];
      g.loot = g.loot.filter((l) => l.item.id !== incoming.id);
      g.loot.push({ x: p.x, y: p.y, item: dropped });
      if (incoming.auto) use(g, incoming);
      else g.inventory.push(incoming);
      g.pendingLoot = undefined;
      log(g, `Picked up ${incoming.name}; left ${dropped.name} here.`);
      break;
    }
    case "pickup": {
      const i = a.id
        ? g.loot.find((l) => l.item.id === a.id && l.x === p.x && l.y === p.y)
            ?.item
        : g.pendingLoot;
      if (!i) {
        if (a.id) throw Error("No item within reach.");
        break;
      }
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
      const beforeHP = p.hp,
        beforeEnemyHP = m.hp;
      g.encounter = {
        enemyId: m.id,
        origin: "resumed",
        exchanges: 0,
        ...g.encounter,
        engaged: true,
      };
      g.encounter.exchanges++;
      if (m.npc || m.merchant)
        log(g, m.name + ": It did not have to end this way…");
      const first = attackInitiative(p) >= m.stats.Speed;
      if (first) strike(g, p, m, a.unarmed);
      if (m.hp > 0 && p.hp > 0) strike(g, m, p);
      if (!first && p.hp > 0 && m.hp > 0) strike(g, p, m, a.unarmed);
      g.encounter.result = `Exchange ${g.encounter.exchanges}: you lost ${Math.max(0, beforeHP - p.hp)} HP; ${m.name} lost ${Math.max(0, beforeEnemyHP - m.hp)} HP.`;
      break;
    }
    case "flee":
      if (!m) break;
      if (random(g) < fleeChance(p, m)) {
        g.combat = undefined;
        log(g, "You escaped safely.");
      } else {
        g.encounter = {
          enemyId: m.id,
          origin: "resumed",
          exchanges: 0,
          ...g.encounter,
          engaged: true,
        };
        log(g, "Could not get away!");
        strike(g, m, p);
      }
      break;
    case "leave":
      if (m && (g.encounter?.engaged || g.encounter?.origin === "enemy"))
        throw Error("You must flee to escape this encounter.");
      g.combat = undefined;
      g.encounter = undefined;
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
      if (s.name === "Befriend" && (!m || m.boss || m.merchant || m.npc))
        throw Error("Only ordinary enemies can be befriended.");
      p.stats.Mana -= s.cost;
      if (m && s.when === "combat")
        g.encounter = {
          enemyId: m.id,
          origin: "resumed",
          exchanges: 0,
          ...g.encounter,
          engaged: true,
          result: `You cast ${s.name}.`,
        };
      log(g, p.name + " cast " + s.name);
      switch (s.name) {
        case "Befriend": {
          const villager = makeVillager(g);
          Object.assign(villager, { x: m!.x, y: m!.y });
          g.monsters = g.monsters.map((actor) => actor.id === m!.id ? villager : actor);
          g.combat = undefined;
          g.encounter = undefined;
          log(g, `${m!.name} becomes ${villager.name}, a peaceful villager.`);
          break;
        }
        case "Unseal": {
          const chest = (g.chests || []).find((c) => !c.opened && Math.abs(c.x-p.x)+Math.abs(c.y-p.y)<=1);
          const door = (g.secretDoors || []).find((d) => !d.unlocked && Math.abs(d.x-p.x)+Math.abs(d.y-p.y)<=1);
          if (chest) {
            chest.locked = false;
            openChest(g, chest.id);
          } else if (door) {
            door.unlocked = true;
            enterSecret(g, door);
          } else if (g.stairs.locked && Math.abs(g.stairs.x-p.x)+Math.abs(g.stairs.y-p.y)<=1) {
            g.stairs.locked = false;
            log(g, "The stair lock yields to wind magic.");
          }
          break;
        }
        case "Kindle":
          m!.burn = [4, Math.max(2, 2 + Math.floor(p.stats.Magic / 5))];
          log(g, `${m!.name} is burning: ${m!.burn[1]} damage when it moves.`);
          break;
        case "Summon":
          summon(g);
          break;
        case "Alchemize": {
          const gold = 3 + roll(g, 23);
          p.gold = (p.gold || 0) + gold;
          log(g, `Alchemized ${gold} gold.`);
          break;
        }
        case "Teleport":
          Object.assign(p, position(g));
          g.pendingLoot = undefined;
          g.pendingChest = undefined;
          g.pendingDoor = undefined;
          g.combat = undefined;
          g.encounter = undefined;
          log(g, "Teleported to safety.");
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
        if (!g.keys)
          throw Error(
            "A Stair Key is required. Defeat this floor’s key carrier; Standard and Rare Keys cannot unlock stairs.",
          );
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
      if (m?.merchant) {
        rememberVillager(g, m);
        log(g, m.name + ": " + m.merchant.line);
        break;
      }
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
      if (m.npc.tribe === "Emperor") {
        if (m.npc.deal === "Imperial Treasury") {
          if (p.hp <= 5) throw Error("You need more than 5 HP.");
          p.hp -= 5;
          p.gold = (p.gold || 0) + 100;
        } else if (m.npc.deal === "Crown of Plenty") {
          if ((p.gold || 0) < 40) throw Error("The crown costs 40 gold.");
          p.gold! -= 40;
          const gift = chestReward(g, true);
          g.loot.push({ x: p.x, y: p.y, item: gift });
          g.pendingLoot = gift;
        } else {
          if (p.stats.Health <= 10)
            throw Error("You need more than 10 maximum HP.");
          p.stats.Health -= 10;
          p.hp = Math.min(p.hp, p.stats.Health);
          p.stats.Power *= 2;
          p.stats.Magic *= 2;
        }
        m.npc.done = true;
        g.combat = undefined;
        log(g, "Imperial bargain complete: " + m.npc.deal);
        break;
      }
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
  collectFloorGold(g);
  return g;
}

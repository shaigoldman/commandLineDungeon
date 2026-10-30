import {
  expansionFloor,
  applyCurse,
  villagerDeath,
  spawnGhosts,
  rememberVillager,
  summon,
  makeVillager,
  makeChief,
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
    /^(Fragile|Iron|Steel|Lucky|Magic|Obsidian) (Sword|Spear|Axe|Shield)$/.exec(name);
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
  if (["reusable-key", "reusable-heal", "energy-generator"].includes(i.kind))
    i.uses = i.maxUses = 1 + roll(g, 5);
  if (name === "Boomerang") i.uses = i.maxUses = 1 + roll(g, 10);
  if (i.kind === "mana-star") i.uses = i.maxUses = i.value;
  if (i.kind === "charm") {
    i.stat = pick(g, ["Power", "Luck", "Health", "Speed", "Magic", "Accuracy", "Armor"]);
    i.value = 1 + roll(g, 5);
    i.name = `${i.stat === "Power" ? "Strength" : i.stat} Charm`;
    i.description = `While carried, ${i.stat === "Power" ? "Strength" : i.stat} +${i.value}.`;
  }
  if (i.kind === "jewel" || i.kind === "crown") {
    const bonus = i.kind === "jewel" ? 1 + roll(g, 5) : 5 + roll(g, 6);
    i.value = bonus;
    i.description = `Spend ${i.kind === "jewel" ? 5 : 10} gold to permanently gain +${bonus} ${i.stat === "Power" ? "Strength" : i.stat}.`;
    i.name = `${name} +${bonus}`;
  }
  if (i.kind === "stealth") i.duration = 1 + roll(g, 40);
  if (i.kind === "energy-generator") i.value = 1 + roll(g, 10);
  const descriptions: Record<string, string> = {
    "Cleanser": "Turn an enemy into a villager, or rarely a chieftain.",
    "Health Pot": "Trade one gold for one health. Never runs dry.",
    "Health Drain": "Trade one life for one mana. Never runs dry.",
    "Spiked Potion": "Sacrifice half your current health for +5 to a chosen stat.",
    "Critical Star": "Your next landed attack is a critical hit.",
    "Speedy Boots": "The next enemy attack has a 99% chance to miss.",
    "Cursed Candy": "Gain one level, but take on a curse.",
    "Cursed Potion": "Restore all health, but take on a curse.",
    "Cursed Gold": "Take 10 gold and an unwanted curse.",
    "Gentle Grip": "While carried, 50% chance a weapon attack spends no durability.",
    "Really Gentle Grip": "While carried, 80% chance a weapon attack spends no durability.",
    "Sharpening Stone": "While carried, equipped weapons deal twice their normal attack bonus.",
    "Anvil": "Upgrade one unequipped bag weapon to its next material.",
    "Blade Shard": "Restore all uses to one unequipped bag weapon.",
    "Skill Book": "While carried, ignore equipped weapon weight penalties to Speed and Accuracy.",
    "Magic Scabbard": "Double a chosen item's remaining uses, even beyond its usual limit.",
    "Hard Candy": "The next five EXP gains are doubled.",
    "Handcuffs": "Throw at an enemy to reduce its Strength by 10.",
    "Greedy Amulet": "Trade 10 HP for 5 gold. Never breaks.",
    "Really Greedy Amulet": "Trade all but 1 HP for 20 gold. Never breaks.",
    "Alchemy Book": "Spend 5 gold to transform a chosen bag item into a rarer random item; rarely misfires.",
    "Alchemy Wand": "Spend 5 gold per bag item to transform them all into rarer items; rarely misfires.",
    "Mana Channel": "Turn all your current mana into an equal amount of gold.",
    "Gold Chalice": "Spend 10 gold to receive a random rare item.",
    "Magic Wand": "Turn one chosen bag item into a basic Fire, Wind, or Water staff.",
    "Energy Harness": "Turn an adjacent energy pod into an item.",
    "Reusable Key": `Opens chests. ${i.uses} uses remaining.`,
    "Reusable Door Key": `Opens chests or secret doors. ${i.uses} uses remaining.`,
    "Mystery Potion": "A random boon (70%) or small setback (30%).",
    "Reusable Tiny Potion": `Restore 5 HP per use. ${i.uses} uses remaining.`,
    "Reusable Medium Potion": `Restore 15 HP per use. ${i.uses} uses remaining.`,
    "Stealth Shoes": `Prevent enemy ambushes for ${i.duration} moves.`,
    "Stairfinder": "Teleport to the stairs once.",
    "Ultrastairfinder": "Teleport to the stairs as often as you like.",
    "Mana Rock": "Spend 1 mana to restore 1 HP. Never breaks.",
    "Mana Shard": "Pay 10 HP to restore 10 mana.",
    "Mana Gem": "While carried, spells cost 1 less mana.",
    "Mana Diamond": "While carried, spells cost 2 less mana.",
    "Mana Star": "Cast one available spell for free.",
    "Double Mana Star": "Cast an available spell for free twice.",
    "Magic Book": "Cast a random spell for free; costly magic is rarer.",
    "Bad Candy": "Strip 1–5 levels from the enemy you target.",
    "Super Potion": "Restore all health and mana.",
    "Item Magnet": "Pull every floor item into nearby open spaces.",
    "Invisibility Cloak": "While carried, enemies cannot ambush you.",
    "Energy Magnet": "Pull and consume one existing energy pod. Never breaks.",
    "Energy Generator": `Create ${i.value} energy pods. ${i.uses} uses remaining.`,
    "Mana Pod": "While carried, gain 1 mana after each basic attack.",
    "Magic Scales": "While carried, use the higher of Power and Magic for both.",
    "Infinite Bag": "While carried, your bag has no item limit.",
    "Poison Potion": "60% chance to fully heal; 40% chance to take 5 damage.",
    "Boomerang": `Throw for 5 damage. ${i.uses} throws remaining.`,
    "Giant Bomb": "50 damage to target, 20 to you, 10 to each actor beside target.",
  };
  if (descriptions[name]) i.description = descriptions[name];
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
  if (["bag", "hand", "sight", "gold", "cursed-gold"].includes(i.kind)) i.auto = true;
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
    i.weight = ({ Sword: 2, Spear: 4, Axe: 6, Shield: 2 } as Record<string, number>)[base];
    i.luck = ({ Sword: 3, Spear: 1, Axe: 6, Shield: 0 } as Record<string, number>)[base];
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
    if (base === "Shield") {
      i.attack = -(1 + Math.floor(m / 2));
      i.weight = 2 + Math.floor(m / 2);
      i.luck = 0;
      i.armorBonus = [5, 10, 15, 20, 27, 35][m];
      i.maxUses = [1, 3, 4, 4, 5, 6][m];
      i.description = `Equipped: +${i.armorBonus} Armor, ${i.attack} Strength. Loses one use when a direct enemy attack lands.`;
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
  // Currency has its own draw, below the ordinary common-item pool.
  if (random(g) < 0.34) {
    const coins = itemDefinitions.filter((d) => d[1] === "gold" && d[0] !== "Pot of Gold" && d[2] <= rarity);
    const weights = coins.map((d) => ({ "1 Gold Coin": 12, "5 Gold Coins": 5, "10 Gold Coins": 2, "20 Gold Coins": 1 })[d[0]] || 1);
    let draw = random(g) * weights.reduce((a, b) => a + b, 0);
    for (let n = 0; n < coins.length; n++) if ((draw -= weights[n]) < 0) return makeItem(g, coins[n][0]);
    return makeItem(g, coins.at(-1)![0]);
  }
  const candidates = itemDefinitions.filter(
    (d) => d[2] <= rarity && d[0] !== "Small Health Potion" && d[1] !== "gold",
  );
  return makeItem(g, pickItemDefinition(g, candidates, true)[0]);
}
type ItemDefinition = (typeof itemDefinitions)[number];
const variantFamilies = new Set(["jewel", "crown", "double", "stat", "boost", "heal", "gold", "key", "projectile", "bag", "reusable-key", "reusable-heal", "candy", "mana-star", "greedy-amulet", "stairfinder", "gentle-grip"]);
/** First select an item family, then a variant; seven stats no longer mean seven tickets. */
export function pickItemDefinition(g: Game, definitions: ItemDefinition[], boostKeys = false): ItemDefinition {
  if (!definitions.length) throw Error("No item candidates.");
  const groups = new Map<string, ItemDefinition[]>();
  for (const definition of definitions) {
    const family = variantFamilies.has(definition[1]) ? definition[1] : definition[0];
    const group = groups.get(family) || [];
    group.push(definition);
    groups.set(family, group);
  }
  const families = [...groups.keys()];
  if (boostKeys && groups.has("key")) families.push("key", "key", "key");
  const variants = groups.get(pick(g, families))!;
  if (variants.length === 1) return variants[0];
  const minimum = Math.min(...variants.map((d) => d[2]));
  const weights = variants.map((d) => 1 / (1 + d[2] - minimum));
  let draw = random(g) * weights.reduce((a, b) => a + b, 0);
  for (let n = 0; n < variants.length; n++) if ((draw -= weights[n]) < 0) return variants[n];
  return variants.at(-1)!;
}
function rarityTier(rarity: number) {
  return rarity >= 9 ? 3 : rarity >= 6 ? 2 : rarity >= 3 ? 1 : 0;
}
function transmute(g: Game, original: Item) {
  if (random(g) < 0.06) return makeItem(g, "Piece of Trash");
  const tier = Math.min(3, rarityTier(original.rarity) + 1 + (random(g) < 0.12 ? 1 : 0));
  const bounds = [[1, 2], [3, 5], [6, 8], [9, 11]][tier];
  const candidates = itemDefinitions.filter((d) => d[2] >= bounds[0] && d[2] <= bounds[1] && d[0] !== "Pot of Gold");
  return makeItem(g, pickItemDefinition(g, candidates)[0]);
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
    !g.traps?.some((trap) => trap.x === x && trap.y === y) &&
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
  g.traps = [];
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
  const trapKinds = ["poison", "curse", "rust", "trip", "fairy", "sap", "monster"] as const;
  const trapCount = roll(g, 3) + Math.min(5, Math.floor(g.floor / 3));
  for (let n = 0; n < trapCount; n++)
    g.traps.push({ id: id(g), ...position(g), kind: pick(g, [...trapKinds]), revealed: false });
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
    maxMana: 10,
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
    Attack: usingTome ? magicOf(a) : powerOf(a),
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
      if (stat === "Accuracy") s[stat] -= a.skillBook && i.kind === "weapon" ? 0 : (i.weight || 0) * 2;
      else if (stat === "Speed") s[stat] -= a.skillBook && i.kind === "weapon" ? 0 : (i.weight || 0) / 2;
      else s[stat] += stat === "Attack" ? (i.attack || 0) * (a.sharpening && i.kind === "weapon" && !i.armorBonus ? 2 : 1) : i.luck || 0;
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
export const manaCap = (a: Actor) => a.maxMana || 10;
export const armorOf = (a: Actor) => Math.max(0, (a.stats.Armor || 0) + a.weapons.reduce((sum, w) => sum + (w.armorBonus || 0), 0));
const magicOf = (a: Actor) => a.magicScale ? Math.max(a.stats.Magic, a.stats.Power) : a.stats.Magic;
const powerOf = (a: Actor) => a.magicScale ? Math.max(a.stats.Magic, a.stats.Power) : a.stats.Power;
export function spellCost(g: Game, spell: { cost: number }) {
  const discount = g.inventory.reduce((sum, i) => sum + (i.kind === "mana-gem" ? 1 : i.kind === "mana-diamond" ? 2 : 0), 0);
  return Math.max(0, spell.cost - discount);
}
export const capacityOf = (g: Game) => g.inventory.some((i) => i.kind === "infinite-bag") ? Infinity : g.capacity;
function syncPassiveStats(g: Game) {
  const p = g.player;
  for (const [stat, bonus] of Object.entries(p.passiveStats || {})) p.stats[stat] = (p.stats[stat] || 0) - bonus;
  const bonus: Stats = {};
  for (const item of g.inventory)
    if (item.kind === "charm" && item.stat)
      bonus[item.stat] = (bonus[item.stat] || 0) + item.value;
  if (g.inventory.some((i) => i.kind === "magic-scales")) {
    const high = Math.max(p.stats.Power + (bonus.Power || 0), p.stats.Magic + (bonus.Magic || 0));
    bonus.Power = high - p.stats.Power;
    bonus.Magic = high - p.stats.Magic;
  }
  for (const [stat, value] of Object.entries(bonus)) p.stats[stat] = (p.stats[stat] || 0) + value;
  p.passiveStats = bonus;
  p.sharpening = g.inventory.some((i) => i.kind === "sharpening-stone");
  p.skillBook = g.inventory.some((i) => i.kind === "skill-book");
  p.hp = Math.min(p.hp, p.stats.Health);
}
/** Preview only: no RNG, durability, mana or effect duration is consumed. */
export function attackInitiative(player: Actor) {
  return (
    player.stats.Speed -
    player.weapons.reduce((n, w) => n + (player.skillBook && w.kind === "weapon" ? 0 : (w.weight || 0) / 4), 0)
  );
}
export function incomingDamage(enemy: Actor, player: Actor) {
  const s = combatAttackStats(enemy);
  const armor = armorOf(player);
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
    "cleanser", "mystery-potion", "reusable-heal", "stealth", "stairfinder",
    "mana-rock", "mana-shard", "mana-star", "magic-book", "super-potion",
    "item-magnet", "energy-magnet", "energy-generator", "poison-potion",
    "health-pot", "health-drain", "spiked-potion", "critical-star", "speedy-boots",
    "cursed-candy", "cursed-potion", "cursed-gold",
    "jewel", "crown", "hard-candy", "mana-channel", "gold-chalice",
  ].includes(item.kind);
}
const weaponMaterials = ["Fragile", "Iron", "Steel", "Lucky", "Magic", "Obsidian"];
export function nextWeaponName(item: Item) {
  if (item.kind !== "weapon") return undefined;
  const match = /^(Fragile|Iron|Steel|Lucky|Magic|Obsidian) (Sword|Spear|Axe)$/.exec(item.name);
  if (!match) return undefined;
  const next = weaponMaterials.indexOf(match[1]) + 1;
  return next < weaponMaterials.length ? `${weaponMaterials[next]} ${match[2]}` : undefined;
}
/** Floor equipment never disappears: a displaced weapon stays here if the bag is full. */
export function floorEquipPlan(g: Game, item: Item) {
  const replaced =
    ["weapon", "tome"].includes(item.kind) && g.player.weapons.length >= g.hands
      ? g.player.weapons[0]
      : undefined;
  const leaveOnFloor = !!replaced && g.inventory.length + 2 > capacityOf(g);
  const problem = !["weapon", "tome"].includes(item.kind)
    ? "This item cannot be equipped."
    : itemUseProblem(g, item) ||
      (g.inventory.length + 1 > capacityOf(g)
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
    ["stat", "nuke", "shield", "vision", "sight", "hand", "bag", "anvil", "blade-shard"].includes(
      i.kind,
    )
  )
    return "Use outside combat.";
  if (!g.combat && ["rope", "projectile"].includes(i.kind))
    return "Requires an enemy encounter.";
  if (["mana-gem", "mana-diamond", "mana-pod", "magic-scales", "invisibility", "charm", "infinite-bag", "gentle-grip", "sharpening-stone", "skill-book"].includes(i.kind))
    return "Active while carried; no use action needed.";
  if ((i.kind === "jewel" || i.kind === "crown") && (g.player.gold || 0) < (i.kind === "jewel" ? 5 : 10))
    return `Need ${i.kind === "jewel" ? 5 : 10} gold to use this.`;
  if (i.kind === "magic-scabbard" && ![...g.inventory, ...g.player.weapons].some((item) => item.id !== i.id && (item.uses || 0) > 0))
    return "Keep a charged item or weapon to double its uses.";
  if (i.kind === "greedy-amulet" && g.player.hp <= (i.value === 20 ? 1 : 10))
    return "Not enough health to make this trade.";
  if (i.kind === "alchemy-book" && ((g.player.gold || 0) < 5 || !g.inventory.some((item) => item.id !== i.id && rarityTier(item.rarity) < 3)))
    return "Need 5 gold and an item below ultrarare in your bag.";
  if (i.kind === "alchemy-wand" && !g.inventory.some((item) => item.id !== i.id && rarityTier(item.rarity) < 3))
    return "No eligible bag items to transmute.";
  if (i.kind === "alchemy-wand" && (g.player.gold || 0) < 5 * g.inventory.filter((item) => item.id !== i.id && rarityTier(item.rarity) < 3).length)
    return "Need 5 gold per eligible bag item.";
  if (i.kind === "mana-channel" && g.player.stats.Mana <= 0) return "No mana to convert.";
  if (i.kind === "gold-chalice" && (g.player.gold || 0) < 10) return "Need 10 gold.";
  if (i.kind === "magic-wand" && !g.inventory.some((item) => item.id !== i.id)) return "Keep an item to turn into a staff.";
  if (i.kind === "energy-harness" && !g.pods.some((pod) => Math.abs(pod.x - g.player.x) + Math.abs(pod.y - g.player.y) === 1))
    return "Stand beside an energy pod to use this.";
  if (i.kind === "anvil" && !g.inventory.some((weapon) => nextWeaponName(weapon)))
    return "Keep an upgradeable, unequipped weapon in your bag first.";
  if (i.kind === "blade-shard" && !g.inventory.some((weapon) => weapon.kind === "weapon" && (weapon.uses || 0) < (weapon.maxUses || 0)))
    return "Keep a worn, unequipped weapon in your bag first.";
  if (["cleanser", "bad-candy"].includes(i.kind) && !g.combat)
    return "Choose an enemy encounter first.";
  if (i.kind === "cleanser" && g.monsters.find((m) => m.id === g.combat)?.boss)
    return "A guardian resists conversion.";
  if (i.kind === "mana-star" && !availableSpells(g, { free: true }).length)
    return "No accessible spell for this encounter.";
  if (i.kind === "mana-rock" && (g.player.stats.Mana < 1 || g.player.hp >= g.player.stats.Health))
    return "Need at least 1 mana and room to heal.";
  if (i.kind === "mana-shard" && (g.player.hp <= 10 || g.player.stats.Mana >= manaCap(g.player)))
    return "Need more than 10 HP and room for mana.";
  if (i.kind === "health-pot" && (!(g.player.gold || 0) || g.player.hp >= g.player.stats.Health))
    return "Need one gold and room to heal.";
  if (i.kind === "health-drain" && (g.player.hp <= 1 || g.player.stats.Mana >= manaCap(g.player)))
    return "Need more than one health and room for mana.";
  if (i.kind === "energy-magnet" && !g.pods.length)
    return "No energy pod remains on this floor.";
  if (i.kind === "heal" && g.player.hp >= g.player.stats.Health)
    return "Health is already full.";
  if (i.kind === "reusable-heal" && g.player.hp >= g.player.stats.Health)
    return "Health is already full.";
  if (i.kind === "super-potion" && g.player.hp >= g.player.stats.Health && g.player.stats.Mana >= manaCap(g.player))
    return "Health and mana are already full.";
  if (i.kind === "mana" && g.player.stats.Mana >= manaCap(g.player))
    return "Mana is already full.";
  if (
    i.kind === "antidote" &&
    !g.player.effects.Poison &&
    !g.player.effects.Curse
  )
    return "You have no poison or curse.";
  if (i.kind === "immunity" && g.player.poisonImmune)
    return "Already immune to poison.";
  if (i.kind === "key" || i.kind === "reusable-key")
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
function hurt(g: Game, a: Actor, n: number, source = "Attack", reward = true, attacker?: Actor) {
  if (source === "Attack") n = Math.max(0, n - armorOf(a));
  n = Math.trunc(n);
  a.hp = Math.max(0, a.hp - n);
  log(g, `${a.name} takes ${n} ${["Poison", "Fire"].includes(source) ? source.toLowerCase() + " " : ""}damage.`);
  if (a.hp <= 0) {
    if (a.id === "player") {
      if (!g.death)
        g.death = { source, attacker: attacker?.name || (source === "Poison" ? a.poisonSource : source === "Curse" ? a.curseSource : undefined), damage: n, floor: g.floor + 1, turn: g.turn };
      g.status = "dead";
      g.combat = undefined;
      log(g, "Your journey ends here. Your score: " + g.score);
    } else kill(g, a, reward, reward);
  }
}
function heal(a: Actor, n: number) {
  a.hp = Math.min(a.stats.Health, a.hp + n);
}
function addXP(g: Game, amount: number) {
  const gained = amount * ((g.expDoubles || 0) > 0 ? 2 : 1);
  if (g.expDoubles) g.expDoubles--;
  g.xp += gained;
  return gained;
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
    const gained = addXP(g, xp);
    g.score += xp;
    log(g, `Gained ${gained} EXP.`);
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
        hurt(g, a, 8 + Math.floor(m.level / 2), "Explosion", reward, m);
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
    g.player.stats.Mana = manaCap(g.player);
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
  const grip = a.id === "player" ? Math.max(0, ...g.inventory.filter((i) => i.kind === "gentle-grip").map((i) => i.value)) / 100 : 0;
  for (const w of [...a.weapons])
    if (!unarmed && w.kind === "weapon" && !w.armorBonus && !(grip > 0 && random(g) < grip) && --w.uses! <= 0) {
      a.weapons = a.weapons.filter((i) => i.id !== w.id);
      log(g, a.id === "player" ? `WEAPON BROKE: ${w.name} broke! Equip another weapon from your bag.` : `${a.name}'s ${w.name} broke!`);
    }
  const speedy = a.id !== "player" && b.id === "player" && !!b.effects["Speedy Boots"];
  if (speedy) delete b.effects["Speedy Boots"];
  if ((speedy && random(g) < 0.99) || random(g) * 100 >= rate) {
    log(g, a.name + " missed.");
    if (a.id === "player" && g.inventory.some((i) => i.kind === "mana-pod"))
      a.stats.Mana = Math.min(manaCap(a), a.stats.Mana + 1);
    return false;
  }
  let damage = s.Attack;
  const guaranteedCritical = a.id === "player" && !!a.effects["Critical Star"];
  if (guaranteedCritical) delete a.effects["Critical Star"];
  if (guaranteedCritical || random(g) * random(g) > 1 - Math.min(0.7, s.Luck * 0.01)) {
    damage *= 3;
    log(g, "Critical hit!");
  }
  const hpBeforeHit = b.hp;
  hurt(g, b, damage, "Attack", a.id === "player", a);
  for (const shield of [...b.weapons].filter((weapon) => weapon.armorBonus))
    if (--shield.uses! <= 0) {
      b.weapons = b.weapons.filter((weapon) => weapon.id !== shield.id);
      log(g, b.id === "player" ? `WEAPON BROKE: ${shield.name} broke! Its protection is gone.` : `${b.name}'s ${shield.name} broke!`);
    }
  if (a.drain) heal(a, damage);
  if (
    a.curseChance &&
    b.id === "player" &&
    b.hp > 0 &&
    b.hp < hpBeforeHit &&
    random(g) < a.curseChance
  )
    applyCurse(g, 12, 3, a.name);
  if (a.poison && b.hp > 0 && !b.poisonImmune) {
    const old = b.effects.Poison || [0, 0];
    b.effects.Poison = [
      Math.max(old[0], a.poison[0]),
      Math.max(old[1], a.poison[1]),
    ];
    b.poisonSource = a.name;
    log(g, b.name + " is poisoned.");
  }
  if (a.id === "player" && g.inventory.some((i) => i.kind === "mana-pod"))
    a.stats.Mana = Math.min(manaCap(a), a.stats.Mana + 1);
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
  if (g.status === "dead") return;
  spawnGhosts(g);
  if (g.player.hp <= 0) {
    return;
  }
  for (let pass = 0; pass < (g.player.stats.Speed <= 5 ? 2 : 1); pass++)
    for (const m of [...g.monsters]) {
      if (!!g.inSecret !== m.x >= 29 || m.spawnTurn === g.turn) continue;
      if (pass === 1 && (m.stats.Speed <= 5 || m.className === "Shadow")) continue;
      if (m.hp <= 0) {
        kill(g, m);
        continue;
      }
      if (g.status !== "playing" || g.combat) break;
      if (g.player.stats.Speed > 5 && g.turn % 2 === 0 && m.stats.Speed <= 5 && m.className !== "Shadow")
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
        !g.inventory.some((i) => i.kind === "invisibility") &&
        !(g.stealthSteps && g.stealthSteps > 0) &&
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
export function availableSpells(g: Game, options: { free?: boolean; anyElement?: boolean; ignoreReq?: boolean } = {}) {
  const elements = [...g.inventory, ...g.player.weapons]
    .filter((i) => i.kind === "tome")
    .map((i) => i.element);
  return spells.filter(
    (s) =>
      (options.anyElement || elements.includes(s.element)) &&
      (options.ignoreReq || magicOf(g.player) >= s.req) &&
      (options.free || g.player.stats.Mana >= spellCost(g, s)) &&
      (s.name !== "Befriend" || !!g.monsters.find((m) => m.id === g.combat && !m.boss && !m.merchant && !m.npc)) &&
      (s.name !== "Unseal" || (!g.pendingLoot && (
        (g.stairs.locked && Math.abs(g.stairs.x - g.player.x) + Math.abs(g.stairs.y - g.player.y) <= 1) || !![
        ...(g.chests || []).filter((c) => !c.opened),
        ...(g.secretDoors || []).filter((d) => !d.unlocked),
      ].find((o) => Math.abs(o.x - g.player.x) + Math.abs(o.y - g.player.y) <= 1)))) &&
      (s.when === "any" || s.when === (g.combat ? "combat" : "peace")),
  );
}
function performSpell(g: Game, s: (typeof spells)[number], m: Actor | undefined, free = false) {
  const p = g.player;
  if (s.name === "Befriend" && (!m || m.boss || m.merchant || m.npc))
    throw Error("Only ordinary enemies can be befriended.");
  if (!free) p.stats.Mana -= spellCost(g, s);
  if (m && s.when === "combat")
    g.encounter = { enemyId: m.id, origin: "resumed", exchanges: 0, ...g.encounter, engaged: true, result: `You cast ${s.name}.` };
  log(g, `${p.name} cast ${s.name}${free ? " for free" : ""}.`);
  switch (s.name) {
    case "Gild": {
      const gold = 1 + roll(g, 6);
      p.gold = (p.gold || 0) + gold;
      log(g, `Gild conjured ${gold} gold.`);
      break;
    }
    case "Mana Expansion":
      p.maxMana = manaCap(p) + 2;
      p.stats.Mana = Math.min(manaCap(p), p.stats.Mana + 2);
      log(g, `Maximum mana is now ${p.maxMana}.`);
      break;
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
}

function use(g: Game, i: Item, chosenSpell?: string, targetId?: string) {
  const p = g.player,
    m = g.monsters.find((m) => m.id === g.combat);
  if (
    g.combat &&
    ["stat", "nuke", "shield", "vision", "sight", "hand", "bag", "anvil", "blade-shard"].includes(
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
      if (g.inventory.length + 1 < capacityOf(g)) g.inventory.push(old);
      else {
        g.loot.push({ x: p.x, y: p.y, item: old });
        log(g, old.name + " left on the floor because your bag is full.");
      }
    }
    log(g, "Equipped " + i.name);
    return;
  }
  switch (i.kind) {
    case "jewel": case "crown": {
      const cost = i.kind === "jewel" ? 5 : 10;
      if ((p.gold || 0) < cost) throw Error(`Need ${cost} gold.`);
      p.gold! -= cost;
      p.stats[i.stat!] = (p.stats[i.stat!] || 0) + i.value;
      log(g, `${i.stat === "Power" ? "Strength" : i.stat} rose by ${i.value} for ${cost} gold.`);
      break;
    }
    case "magic-scabbard": {
      const target = [...g.inventory, ...p.weapons].find((item) => item.id === targetId && item.id !== i.id && (item.uses || 0) > 0);
      if (!target) throw Error("Choose a charged item or weapon.");
      target.uses! *= 2;
      log(g, `${target.name} now has ${target.uses} uses (usual maximum ${target.maxUses}).`);
      break;
    }
    case "hard-candy":
      g.expDoubles = (g.expDoubles || 0) + 5;
      log(g, `The next ${g.expDoubles} EXP gains are doubled.`);
      break;
    case "greedy-amulet": {
      const cost = i.value === 20 ? p.hp - 1 : 10;
      if (cost <= 0 || p.hp <= cost) throw Error("Not enough health for this trade.");
      p.hp -= cost;
      p.gold = (p.gold || 0) + i.value;
      log(g, `Traded ${cost} HP for ${i.value} gold.`);
      return;
    }
    case "alchemy-book": {
      const target = g.inventory.find((item) => item.id === targetId && item.id !== i.id && rarityTier(item.rarity) < 3);
      if (!target || (p.gold || 0) < 5) throw Error("Choose an eligible bag item and pay 5 gold.");
      p.gold! -= 5;
      const result = transmute(g, target);
      Object.assign(target, result, { id: target.id });
      log(g, `Alchemy Book turned the item into ${target.name}.`);
      break;
    }
    case "alchemy-wand": {
      const targets = g.inventory.filter((item) => item.id !== i.id && rarityTier(item.rarity) < 3);
      if (!targets.length || (p.gold || 0) < targets.length * 5) throw Error("Need 5 gold per eligible bag item.");
      p.gold! -= targets.length * 5;
      for (const target of targets) Object.assign(target, transmute(g, target), { id: target.id });
      log(g, `Alchemy Wand changed ${targets.length} items for ${targets.length * 5} gold.`);
      break;
    }
    case "mana-channel": {
      const mana = Math.trunc(p.stats.Mana);
      if (mana <= 0) throw Error("No mana to convert.");
      p.stats.Mana = 0;
      p.gold = (p.gold || 0) + mana;
      log(g, `Converted ${mana} mana into gold.`);
      return;
    }
    case "gold-chalice": {
      if ((p.gold || 0) < 10) throw Error("Need 10 gold.");
      p.gold! -= 10;
      const candidates = itemDefinitions.filter((d) => d[2] >= 6 && d[2] < 9 && d[1] !== "gold");
      const reward = makeItem(g, pickItemDefinition(g, candidates)[0]);
      if (g.inventory.length + Number(p.weapons.length > 0) + (g.inventory.some((item) => item.id === i.id) ? 0 : 1) > capacityOf(g))
        g.loot.push({ x: p.x, y: p.y, item: reward });
      else g.inventory.push(reward);
      log(g, `Gold Chalice revealed ${reward.name}.`);
      break;
    }
    case "magic-wand": {
      const target = g.inventory.find((item) => item.id === targetId && item.id !== i.id);
      if (!target || !["Fire", "Wind", "Water"].includes(chosenSpell || "")) throw Error("Choose an item and basic staff type.");
      if (target.kind === "infinite-bag" && g.inventory.length - 1 + Number(p.weapons.length > 0) > g.capacity)
        throw Error("Bag too full to transform the Infinite Bag.");
      Object.assign(target, makeItem(g, `${chosenSpell} Staff`), { id: target.id });
      log(g, `Magic Wand made ${target.name}.`);
      break;
    }
    case "energy-harness": {
      const pod = g.pods.find((pod) => `${pod.x},${pod.y}` === targetId);
      if (!pod || Math.abs(pod.x - p.x) + Math.abs(pod.y - p.y) !== 1)
        throw Error("Choose an adjacent energy pod.");
      g.pods = g.pods.filter((other) => other !== pod);
      const reward = randomItem(g, g.floor + 1);
      g.loot.push({ x: pod.x, y: pod.y, item: reward });
      log(g, `Energy Harness formed ${reward.name} at ${pod.x},${pod.y}.`);
      break;
    }
    case "anvil": {
      const target = g.inventory.find((weapon) => weapon.id === targetId);
      const nextName = target && nextWeaponName(target);
      if (!target || !nextName) throw Error("Choose an upgradeable weapon in your bag.");
      const upgraded = makeItem(g, nextName);
      Object.assign(target, upgraded, { id: target.id, uses: upgraded.maxUses });
      log(g, `Anvil upgraded your weapon to ${target.name} (${target.uses} uses).`);
      break;
    }
    case "blade-shard": {
      const target = g.inventory.find((weapon) => weapon.id === targetId && weapon.kind === "weapon");
      if (!target || (target.uses || 0) >= (target.maxUses || 0)) throw Error("Choose a worn weapon in your bag.");
      target.uses = target.maxUses;
      log(g, `Blade Shard restored ${target.name} to ${target.uses} uses.`);
      break;
    }
    case "cursed-candy":
      addXP(g, 100); checkLevel(g); applyCurse(g, 12, 3, i.name); break;
    case "cursed-potion":
      p.hp = p.stats.Health; applyCurse(g, 12, 3, i.name); break;
    case "cursed-gold":
      p.gold = (p.gold || 0) + 10; applyCurse(g, 12, 3, i.name); break;
    case "critical-star":
      p.effects["Critical Star"] = [1, 1]; break;
    case "speedy-boots":
      p.effects["Speedy Boots"] = [1, 99]; break;
    case "health-pot":
      if (!(p.gold || 0) || p.hp >= p.stats.Health) throw Error("Need one gold and room to heal.");
      p.gold!--; heal(p, 1); return;
    case "health-drain":
      if (p.hp <= 1 || p.stats.Mana >= manaCap(p)) throw Error("Need health and room for mana.");
      p.hp--; p.stats.Mana++; return;
    case "spiked-potion": {
      const stat = chosenSpell;
      if (!stat || !["Health", "Power", "Luck", "Speed", "Magic", "Accuracy", "Armor"].includes(stat))
        throw Error("Choose a stat for the potion.");
      p.hp -= Math.floor(p.hp / 2);
      p.stats[stat] = (p.stats[stat] || 0) + 5;
      log(g, `${stat} rose by 5 at a cost of half your health.`);
      break;
    }
    case "cleanser": {
      if (!m || m.boss) throw Error("Choose an ordinary enemy to cleanse.");
      const changed = random(g) < 0.05 ? makeChief(g) : makeVillager(g);
      Object.assign(changed, { x: m.x, y: m.y });
      g.monsters = g.monsters.map((actor) => actor.id === m.id ? changed : actor);
      g.combat = undefined;
      g.encounter = undefined;
      log(g, `${m.name} became ${changed.name}.`);
      break;
    }
    case "reusable-key":
      throw Error("Use this key at a chest or secret door.");
    case "mystery-potion": {
      if (random(g) < 0.7) {
        if (random(g) < 0.5) heal(p, 5 + roll(g, 16));
        else {
          const stat = pick(g, ["Health", "Power", "Luck", "Speed", "Accuracy", "Magic", "Armor"]);
          const gain = 1 + roll(g, 3);
          p.stats[stat] += gain;
          log(g, `${stat} rose by ${gain}.`);
        }
      } else if (random(g) < 0.5) hurt(g, p, 2 + roll(g, 5), "Potion");
      else {
        const stat = pick(g, ["Power", "Luck", "Speed", "Accuracy", "Magic", "Armor"]);
        const loss = Math.min(Math.max(0, p.stats[stat] - 1), 1 + roll(g, 2));
        p.stats[stat] -= loss;
        log(g, `${stat} fell by ${loss}.`);
      }
      break;
    }
    case "reusable-heal":
      heal(p, i.value);
      i.uses!--;
      if (i.uses! > 0) {
        i.description = `Restore ${i.value} HP per use. ${i.uses} uses remaining.`;
        log(g, `${i.name}: ${i.uses} uses left.`);
        return;
      }
      break;
    case "stealth":
      g.stealthSteps = Math.max(g.stealthSteps || 0, i.duration || 1);
      break;
    case "stairfinder": {
      const spots = g.tiles.flatMap((row, y) => row.map((tile, x) => ({ tile, x, y })))
        .filter((a) => a.tile === 0 && (g.inSecret ? a.x >= 33 : a.x < 29) && !g.monsters.some((m) => m.x === a.x && m.y === a.y))
        .sort((a, b) => Math.abs(a.x - g.stairs.x) + Math.abs(a.y - g.stairs.y) - Math.abs(b.x - g.stairs.x) - Math.abs(b.y - g.stairs.y));
      if (!spots.length) throw Error("No open place near the stairs.");
      Object.assign(p, spots[0]);
      g.combat = undefined; g.encounter = undefined; g.pendingLoot = undefined;
      g.pendingChest = undefined; g.pendingDoor = undefined;
      log(g, "The stairs draw near.");
      if (i.value < 0) return;
      break;
    }
    case "mana-rock":
      if (p.stats.Mana < 1 || p.hp >= p.stats.Health) throw Error("Need mana and room to heal.");
      p.stats.Mana--; heal(p, 1);
      log(g, "Mana Rock: 1 mana became 1 HP.");
      return;
    case "mana-shard":
      if (p.hp <= 10 || p.stats.Mana >= manaCap(p)) throw Error("Need more than 10 HP and room for mana.");
      p.hp -= 10; p.stats.Mana = Math.min(manaCap(p), p.stats.Mana + 10);
      break;
    case "mana-star": {
      const spell = availableSpells(g, { free: true }).find((s) => s.name === chosenSpell);
      if (!spell) throw Error("Choose an accessible spell to cast for free.");
      performSpell(g, spell, m, true);
      i.uses!--;
      if (i.uses! > 0) {
        i.description = `Cast an available spell for free. ${i.uses} uses remaining.`;
        log(g, `${i.name}: ${i.uses} use left.`);
        return;
      }
      break;
    }
    case "magic-book": {
      const choices = availableSpells(g, { free: true, anyElement: true, ignoreReq: true });
      if (!choices.length) throw Error("No spell can be cast here.");
      const weights = choices.map((s) => 1 / Math.pow(1 + s.cost, 1.5));
      let chance = random(g) * weights.reduce((a, b) => a + b, 0), selected = choices.at(-1)!;
      for (let n = 0; n < choices.length; n++) if ((chance -= weights[n]) < 0) { selected = choices[n]; break; }
      performSpell(g, selected, m, true);
      log(g, `Magic Book opened to ${selected.name}.`);
      break;
    }
    case "bad-candy": {
      if (!m) throw Error("Choose an enemy target.");
      const lost = Math.min(m.level - 1, 1 + roll(g, 5));
      m.level -= lost;
      const scale = Math.max(0.3, (m.level + 1) / (m.level + lost + 1));
      for (const stat of ["Health", "Power", "Speed", "Accuracy", "Magic"])
        m.stats[stat] = Math.max(1, m.stats[stat] * scale);
      m.hp = Math.min(m.hp, m.stats.Health);
      log(g, `${m.name} lost ${lost} levels.`);
      break;
    }
    case "super-potion":
      p.hp = p.stats.Health; p.stats.Mana = manaCap(p);
      break;
    case "item-magnet": {
      const spots = g.tiles.flatMap((row, y) => row.map((tile, x) => ({ tile, x, y })))
        .filter((a) => a.tile === 0 && Math.abs(a.x - p.x) + Math.abs(a.y - p.y) <= 4 && !g.monsters.some((m) => m.x === a.x && m.y === a.y) && !(a.x === p.x && a.y === p.y));
      if (!spots.length) throw Error("No room nearby for the items.");
      for (const loot of g.loot) Object.assign(loot, pick(g, spots));
      log(g, `${g.loot.length} items flew into this room.`);
      break;
    }
    case "energy-magnet": {
      const pod = g.pods.shift();
      if (!pod) throw Error("No energy pod remains on this floor.");
      if (p.hp < p.stats.Health) heal(p, pod.max ? p.stats.Health : p.stats.Health / 4 + 1);
      else p.stats.Mana = Math.min(manaCap(p), p.stats.Mana + (pod.max ? 10 : 3));
      log(g, "An energy pod rushed to you.");
      return;
    }
    case "energy-generator":
      for (let n = 0; n < i.value; n++) g.pods.push({ ...position(g), max: random(g) > 0.6 });
      i.uses!--;
      if (i.uses! > 0) {
        i.description = `Create ${i.value} energy pods. ${i.uses} uses remaining.`;
        log(g, `${i.value} energy pods appeared. ${i.uses} uses left.`);
        return;
      }
      break;
    case "poison-potion":
      if (random(g) < 0.6) p.hp = p.stats.Health;
      else hurt(g, p, 5, "Potion");
      break;
    case "mana-gem": case "mana-diamond": case "mana-pod": case "magic-scales": case "invisibility": case "charm": case "infinite-bag": case "gentle-grip": case "sharpening-stone": case "skill-book":
      throw Error("This item works while carried.");
    case "candy":
      addXP(g, i.value);
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
      p.stats.Mana = manaCap(p);
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
      if (i.name === "Handcuffs") {
        m.stats.Power = Math.max(0, m.stats.Power - 10);
        log(g, `${m.name} loses 10 Strength to the handcuffs.`);
        break;
      }
      if (i.name === "Giant Bomb") {
        const near = [...g.monsters].filter((other) => other.id !== m.id && Math.abs(other.x - m.x) + Math.abs(other.y - m.y) === 1);
        hurt(g, m, 50, "Explosion");
        for (const other of near) hurt(g, other, 10, "Explosion");
        hurt(g, p, 20, "Explosion");
        log(g, "Giant Bomb detonated: 50 target / 20 self / 10 adjacent.");
        break;
      }
      if (
        m.className !== "Dragon" ||
        random(g) < 0.5 ||
        (i.value <= 10 && random(g) > 0.33)
      )
        hurt(g, m, i.value);
      else log(g, "The dragon dodged!");
      g.encounter.result = `You threw ${i.name}. ${m.name}: ${m.hp} HP remaining.`;
      if (i.name === "Boomerang") {
        i.uses!--;
        if (i.uses! > 0) {
          i.description = `Throw for 5 damage. ${i.uses} throws remaining.`;
          log(g, `Boomerang returned. ${i.uses} throws left.`);
          return;
        }
      }
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
      addXP(g, 100);
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
    (l) => l.x === g.player.x && l.y === g.player.y && ["gold", "cursed-gold"].includes(l.item.kind),
  );
  if (!coins.length) return;
  const ids = new Set(coins.map((l) => l.item.id));
  const amount = coins.reduce((sum, l) => sum + l.item.value, 0);
  g.player.gold = (g.player.gold || 0) + amount;
  for (const coin of coins) if (coin.item.kind === "cursed-gold") applyCurse(g, 12, 3, coin.item.name);
  g.loot = g.loot.filter((l) => !ids.has(l.item.id));
  if (g.pendingLoot && ids.has(g.pendingLoot.id)) {
    g.pendingLoot = g.loot.find(
      (l) => l.x === g.player.x && l.y === g.player.y,
    )?.item;
  }
  log(g, `Collected ${amount} gold.`);
}
function triggerTrap(g: Game) {
  const p = g.player;
  const trap = g.traps?.find((trap) => trap.x === p.x && trap.y === p.y);
  if (!trap) return;
  trap.revealed = true;
  const strength = 1 + Math.floor(g.floor / 3);
  switch (trap.kind) {
    case "poison": {
      const prior = p.effects.Poison || [0, 0];
      p.effects.Poison = [Math.max(prior[0], 2 + strength), Math.max(prior[1], strength)];
      p.poisonSource = "Poison trap";
      log(g, `TRAP: Poison! ${p.effects.Poison[1]} damage for ${p.effects.Poison[0]} steps.`);
      break;
    }
    case "curse":
      applyCurse(g, 5 + strength * 2, strength + 1, "Curse trap");
      log(g, "TRAP: A curse clings to you.");
      break;
    case "rust": {
      const weapon = p.weapons.find((item) => item.kind === "weapon" || item.kind === "tome");
      if (weapon) {
        p.weapons = p.weapons.filter((item) => item.id !== weapon.id);
        log(g, `WEAPON BROKE: Rust trap destroyed ${weapon.name}!`);
      }
      log(g, weapon ? "TRAP: Rust ate your equipped weapon." : "TRAP: Rust hissed across empty hands.");
      break;
    }
    case "trip": {
      const count = Math.min(g.inventory.length, 1 + Math.floor(g.floor / 4));
      const lost: string[] = [];
      for (let n = 0; n < count; n++) {
        const choices = g.inventory.filter((item) => item.kind !== "infinite-bag" || g.inventory.length - 1 + Number(p.weapons.length > 0) <= g.capacity);
        if (!choices.length) break;
        const item = pick(g, choices);
        g.inventory = g.inventory.filter((other) => other.id !== item.id);
        lost.push(item.name);
      }
      log(g, `TRAP: You lost ${lost.length ? lost.join(", ") : "nothing"}.`);
      break;
    }
    case "fairy": {
      const lost = Math.min(p.gold || 0, 1 + roll(g, 3 + strength * 3));
      p.gold = (p.gold || 0) - lost;
      log(g, `TRAP: A fairy stole ${lost} gold.`);
      break;
    }
    case "sap": {
      const stat = pick(g, ["Health", "Power", "Luck", "Speed", "Accuracy", "Magic", "Armor"]);
      const low = stat === "Armor" ? 0 : 1;
      const lost = Math.min(Math.max(0, (p.stats[stat] || 0) - low), strength);
      p.stats[stat] = (p.stats[stat] || 0) - lost;
      p.hp = Math.min(p.hp, p.stats.Health);
      log(g, `TRAP: Sap drained ${lost} ${stat}.`);
      break;
    }
    case "monster": {
      g.traps = g.traps!.filter((other) => other.id !== trap.id);
      let spawned = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
        if (empty(g, p.x + dx, p.y + dy)) {
          const monster = makeMonster(g, pick(g, ["Zombie", "Spider", "Snake", ...(g.floor > 1 ? ["Parasite"] : [])]), Math.max(1, g.floor + 1));
          Object.assign(monster, { x: p.x + dx, y: p.y + dy });
          g.monsters.push(monster);
          spawned++;
        }
      log(g, `TRAP: ${spawned} enemies emerged around you!`);
      break;
    }
  }
}
export function act(input: Game, a: Action): Game {
  const g = structuredClone(input),
    p = g.player;
  syncPassiveStats(g);
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
      if (a.stat === "EXP") addXP(g, 20);
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
        if (g.stealthSteps) g.stealthSteps--;
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
      triggerTrap(g);
      if (p.hp <= 0) break;
      const pod = g.pods.find((i) => i.x === x && i.y === y);
      if (pod) {
        const magic =
          [...g.inventory, ...p.weapons].some((i) => i.kind === "tome") &&
          ((random(g) > 0.5 && p.stats.Mana !== p.stats.Magic) ||
            p.hp === p.stats.Health);
        if (magic && p.stats.Mana < manaCap(p)) {
          p.stats.Mana = Math.min(manaCap(p), p.stats.Mana + (pod.max ? 10 : 3));
          g.pods = g.pods.filter((i) => i !== pod);
          log(g, "Mana pod restored your mana.");
        } else if (!magic && p.hp < p.stats.Health) {
          heal(p, pod.max ? p.stats.Health : p.stats.Health / 4 + 1);
          g.pods = g.pods.filter((i) => i !== pod);
          log(g, "Health pod restored your health.");
        } else {
          log(g, "ENERGY FULL: No energy restored. This pod remains here for later.");
        }
      }
      collectFloorGold(g);
      const loot = g.loot.find((i) => i.x === x && i.y === y);
      if (loot) g.pendingLoot = loot.item;
      monsterTurn(g);
      if (g.stealthSteps) g.stealthSteps--;
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
      if (!(ground.item.name === "Boomerang" && (ground.item.uses || 0) > 0))
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
      use(g, i, a.spell);
      if (!(i.uses && i.uses > 0) && !["mana-rock", "energy-magnet", "health-pot", "health-drain"].includes(i.kind) && !(i.kind === "stairfinder" && i.value < 0))
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
      if (g.inventory.length + Number(p.weapons.length > 0) > capacityOf(g))
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
        if (g.inventory.length + Number(p.weapons.length > 0) >= capacityOf(g))
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
      use(g, i, a.spell, a.target);
      break;
    }
    case "drop": {
      const i = g.inventory.find((i) => i.id === a.id);
      if (!i) throw Error("Item not found");
      if (i.kind === "infinite-bag" && g.inventory.length - 1 + Number(p.weapons.length > 0) > g.capacity)
        throw Error("Bag too full to drop the Infinite Bag.");
      g.inventory = g.inventory.filter((i) => i.id !== a.id);
      g.loot.push({ x: p.x, y: p.y, item: i });
      break;
    }
    case "unequip": {
      const i = p.weapons.find((i) => i.id === a.id);
      if (!i) throw Error("Equipment not found");
      if (g.inventory.length + 1 + Number(p.weapons.length > 1) > capacityOf(g))
        throw Error("Inventory full. Use or drop an item before unequipping.");
      p.weapons = p.weapons.filter((i) => i.id !== a.id);
      g.inventory.push(i);
      break;
    }
    case "cast": {
      const s = availableSpells(g).find((s) => s.name === a.spell);
      if (!s) throw Error("Spell unavailable");
      performSpell(g, s, m);
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
  syncPassiveStats(g);
  return g;
}

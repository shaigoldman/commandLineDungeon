/** Ashfall market rules. All RNG is part of the persisted game seed. */
import type { Actor, Game, Item, SecretDoor } from "./types";
import { itemDefinitions } from "./catalog";
import { makeItem, makeMonster, random, randomItem, log, capacityOf } from "./engine";
const roll = (g: Game, n: number) => Math.floor(random(g) * n);
const pick = <T>(g: Game, a: T[]) => a[roll(g, a.length)];
const uid = (g: Game) => "ash-" + roll(g, 2 ** 32).toString(36);
export const history = [
  [
    "Mabel Crumb",
    "I baked for the royal observatory. The astronomers ordered a cake shaped like a second sun. Nobody asked why.",
  ],
  [
    "Pip Bellwether",
    "Three nights before Ashfall, the palace bells rang thirteen times. We only owned twelve bells. The thirteenth sounded hungry.",
  ],
  [
    "Orla Soot",
    "My husband delivered a mirror to the moon engine. It reflected tomorrow. He came home with yesterday’s haircut.",
  ],
  [
    "Bram Pickle",
    "The emperor taxed shadows to power his machine. Rich folk bought extra candles. Poor folk learned to stand very still.",
  ],
  [
    "Tansy Bolt",
    "I tightened the last screw in the moon engine. There was one screw left over. Management called it an efficiency gain.",
  ],
  [
    "Hob Nettle",
    "At noon the sun sneezed. The emperor said it was scheduled maintenance. Then the stairs started leading underground.",
  ],
  [
    "Dora Teaspoon",
    "The engine did not destroy the world. It folded it. My kitchen is now floor nine. Please return my kettle.",
  ],
  [
    "Fenwick Moss",
    "Ruthagor ate the instruction manual. Apparently the emergency stop was on page two. He said it needed salt.",
  ],
  [
    "Ada Candle",
    "Our king saved us by declaring the apocalypse a public holiday. We still owe him three days of work.",
  ],
  [
    "Nell Thread",
    "The ghosts remember the world before the fold. They do not want revenge. Mostly they want their deposits back.",
  ],
  [
    "Bix Turnip",
    "I found the missing screw in a turnip. If we fix the moon engine, will my turnip become a moon?",
  ],
  [
    "Wren Lastlight",
    "Put the mirror back, return the shadows, turn the thirteenth bell upside down. That is the repair plan. I have the bell.",
  ],
] as const;
const farewells = [
  "Why…?",
  "Tell my wife I love her.",
  "I was saving you the good biscuits.",
  "My loyalty card… only one stamp left…",
  "Please water my impossible turnip.",
  "Not again. I just paid my resurrection tax.",
];
export function catalogItems(g: Game) {
  const names = [
    ...itemDefinitions
      .filter((d) => !["weapon", "tome"].includes(d[1]) && d[0] !== "Pot of Gold")
      .map((d) => d[0]),
    ...["Fragile", "Iron", "Steel", "Lucky", "Magic", "Obsidian"].flatMap((m) =>
      ["Sword", "Spear", "Axe"].map((w) => m + " " + w),
    ),
    ...["Wind", "Fire", "Water", "Mystery"].map((e) => e + " Staff"),
    "Awathons Broadsword",
    "EXP Pill",
    "Piece of Trash",
  ];
  return names.map((name) => makeItem(g, name));
}
export function marketValue(i: Item) {
  // Gold coins keep their face value; rarity raises equipment prices gently.
  if (i.kind === "gold") return i.value;
  return Math.max(
    2,
    Math.round(
      3 + i.rarity * 1.5 + i.rarity * i.rarity * 0.35 + (i.attack || 0) * 0.8,
    ),
  );
}
function askingPrice(g: Game, item: Item) {
  const multiplier =
    item.kind === "gold" ? 0.8 + random(g) * 0.2 : 0.72 + random(g) * 0.33;
  return Math.max(1, Math.ceil(marketValue(item) * multiplier));
}
export function makeVillager(g: Game, king = false): Actor {
  const [name, line] = pick(g, [...history]);
  const all = king ? catalogItems(g) : [];
  const stock = king
    ? all
        .map((item) => ({ item, sort: random(g) }))
        .sort((a, b) => a.sort - b.sort)
        .slice(0, Math.ceil(all.length / 2))
        .map((a) => a.item)
    : Array.from({ length: 3 + roll(g, 3) }, () => randomItem(g));
  // A villager cannot sell the very item they are hunting for.
  const wantedCandidates = [
    "Fragile Axe",
    "Mana Potion",
    "Poison Antidote",
    "Standard Key",
    "Tiny Health Potion",
  ].filter((name) => !stock.some((item) => item.name === name));
  const wanted =
    wantedCandidates.length && random(g) < 0.35
      ? pick(g, wantedCandidates)
      : undefined;
  return {
    id: uid(g),
    name: king ? "King Niblet the Underprepared" : name,
    className: king ? "VillagerKing" : "Villager",
    stats: {
      Health: 3,
      Power: 1,
      Luck: 0,
      Accuracy: 65,
      Speed: 45,
      Magic: 1,
      Mana: 0,
    },
    hp: 3,
    effects: {},
    weapons: [],
    x: 0,
    y: 0,
    level: 1,
    merchant: {
      stock: stock.map((item) => ({
        item,
        price: askingPrice(g, item),
      })),
      buyPrices: {},
      taste: roll(g, 100000),
      dislikes: [pick(g, ["projectile", "armor", "boost", "trash", "tome"])],
      wanted,
      premium: 1.5 + random(g) * 1.5,
      line:
        (king
          ? "My coronation happened during a roof collapse. The crown is technically a saucepan. I declared Ashfall a holiday. "
          : line) +
        (wanted ? ` Have you seen a ${wanted}? I’m looking for one…` : ""),
      refusal: pick(g, [
        "Last time I bought that, my soup became sentient.",
        "My wife said: one more of those and I become the apocalypse.",
        "That clashes with my emergency curtains.",
        "I am allergic to terrible business decisions.",
      ]),
      king,
    },
  };
}
export function rememberVillager(g: Game, m: Actor) {
  if (!m.merchant) return;
  const line = m.name + ": " + m.merchant.line;
  g.chronicles ??= [];
  if (!g.chronicles.includes(line)) g.chronicles.push(line);
}
export function saleQuote(m: Actor, i: Item): number | null {
  const shop = m.merchant!;
  if (Object.hasOwn(shop.buyPrices, i.id)) return shop.buyPrices[i.id];
  // Merchant taste fixes all future offers, independent of inspection order and save/reload.
  let h = shop.taste;
  for (const c of i.id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const wanted = shop.wanted === i.name;
  const price = wanted
    ? Math.floor(marketValue(i) * shop.premium)
    : shop.dislikes.includes(i.kind)
      ? null
      : Math.max(1, Math.floor(marketValue(i) * (0.4 + (h % 1500) / 10000)));
  shop.buyPrices[i.id] = price;
  return price;
}
export function buy(g: Game, m: Actor, id: string) {
  if (!m.merchant) throw Error("No villager shop here.");
  const offer = m.merchant.stock.find((s) => s.item.id === id);
  if (!offer) throw Error("That item is sold out.");
  if ((g.player.gold || 0) < offer.price) throw Error("Not enough gold.");
  if (
    !offer.item.auto &&
    g.inventory.length + Number(g.player.weapons.length > 0) >= capacityOf(g)
  )
    throw Error("Your bag is full.");
  g.player.gold = (g.player.gold || 0) - offer.price;
  m.merchant.stock = m.merchant.stock.filter((s) => s !== offer);
  return offer.item;
}
export function quote(g: Game, m: Actor, id: string, sell = false) {
  if (!m.merchant) throw Error("No villager shop here.");
  const i = g.inventory.find((i) => i.id === id);
  if (!i) throw Error("Select an item in your bag; unequip held gear first.");
  const n = saleQuote(m, i);
  g.marketNotice =
    n === null
      ? `${m.name}: ${m.merchant.refusal}`
      : `${m.name} offers ${n} gold for ${i.name}${m.merchant.wanted === i.name ? " — my most wanted item!" : ""}.`;
  log(g, g.marketNotice);
  if (sell && n !== null) {
    if (i.kind === "infinite-bag" && g.inventory.length - 1 + Number(g.player.weapons.length > 0) > g.capacity)
      throw Error("Bag too full to sell the Infinite Bag.");
    g.inventory = g.inventory.filter((a) => a.id !== id);
    g.player.gold = (g.player.gold || 0) + n;
    g.marketNotice = `Sold ${i.name} for ${n} gold.`;
    log(g, g.marketNotice);
  }
}
export function applyCurse(g: Game, turns = 12, damage = 3) {
  turns = Math.max(turns, (g.player.effects.Poison?.[0] || 0) + 6);
  damage = Math.max(damage, (g.player.effects.Poison?.[1] || 0) + 2);
  const old = g.player.effects.Curse || [0, 0];
  g.player.effects.Curse = [Math.max(old[0], turns), Math.max(old[1], damage)];
  log(
    g,
    `CURSED: ${damage} HP per world turn for ${turns} turns. A Poison Antidote cures it.`,
  );
}
export function villagerDeath(g: Game, m: Actor, curseHero = true) {
  log(g, `${m.name}: “${pick(g, farewells)}”`);
  if (curseHero) applyCurse(g);
  (g.haunting ??= []).push({ x: m.x, y: m.y, due: g.turn + 5, name: m.name });
}
export function spawnGhosts(g: Game) {
  for (const h of [...(g.haunting || [])])
    if (
      g.turn >= h.due &&
      !(g.player.x === h.x && g.player.y === h.y) &&
      !g.monsters.some((m) => m.x === h.x && m.y === h.y)
    ) {
      const m: Actor = {
        id: uid(g),
        name: `Ghost of ${h.name}`,
        className: "Ghost",
        stats: {
          Health: 18 + g.floor * 3,
          Power: 4 + g.floor,
          Luck: 0,
          Accuracy: 90,
          Speed: 30,
          Magic: 10,
          Mana: 0,
        },
        hp: 18 + g.floor * 3,
        effects: {},
        weapons: [],
        x: h.x,
        y: h.y,
        level: Math.max(1, g.floor + 2),
        curseChance: 0.35,
        spawnTurn: g.turn,
      };
      g.monsters.push(m);
      g.haunting = g.haunting!.filter((a) => a !== h);
      log(g, `${m.name} rises at the place they fell.`);
    }
}
export function makeChief(g: Game, emperor = false): Actor {
  const m = makeMonster(g, "Chieftan", emperor ? 30 : Math.max(1, g.floor * 2));
  m.name = emperor
    ? "Emperor Vey of the Thirteenth Bell"
    : "Chief " +
      pick(g, ["Cinderwhisk", "Moss-Ear", "Twelve Hats", "Puddlethrone"]);
  m.npc = {
    tribe: emperor ? "Emperor" : pick(g, ["Pallu", "Awa", "Vraskii"]),
    deal: emperor
      ? pick(g, ["Imperial Treasury", "Crown of Plenty", "Royal Ascension"])
      : pick(g, ["Health Gain", "Stat", "Random Item"]),
    done: false,
    line: emperor
      ? "The world folded because my astronomer said “a little more power.” Shall we make a smaller mistake together?"
      : "A stranger called me here. Was it you, or the bell?",
  };
  return m;
}
export function summon(g: Game, monstersOnly = false) {
  const spots = [];
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const x = g.player.x + dx,
      y = g.player.y + dy;
    if (
      g.tiles[y]?.[x] === 0 &&
      (g.inSecret ? x >= 33 : x < 29) &&
      !(g.inSecret && x === 33 && y === 7) &&
      !g.monsters.some((m) => m.x === x && m.y === y) &&
      !g.chests?.some((c) => !c.opened && c.x === x && c.y === y) &&
      !g.loot.some((l) => l.x === x && l.y === y) &&
      !(g.stairs.x === x && g.stairs.y === y)
    )
      spots.push({ x, y });
  }
  if (!spots.length) throw Error("No clear adjacent tile for Summon.");
  const r = random(g),
    m =
      !monstersOnly && r < 0.75
        ? makeVillager(g)
        : !monstersOnly && r < 0.9
          ? makeChief(g)
          : makeMonster(
              g,
              pick(g, ["Zombie", "Spider", "Snake"]),
              Math.max(1, g.floor + 1),
            );
  Object.assign(m, pick(g, spots));
  g.monsters.push(m);
  log(g, `Summoned ${m.name} nearby.`);
}
export function chestReward(g: Game, ultra = false) {
  const r = random(g),
    min = ultra ? (r < 0.3 ? 9 : 6) : r < 0.15 ? 9 : r < 0.65 ? 6 : 3;
  return makeItem(
    g,
    pick(
      g,
      itemDefinitions.filter((d) => d[2] >= min && d[0] !== "Pot of Gold"),
    )[0],
  );
}
export function addChest(
  g: Game,
  x: number,
  y: number,
  locked = true,
  ultra = false,
) {
  const c = {
    id: uid(g),
    x,
    y,
    locked,
    ultra,
    opened: false,
    reward: chestReward(g, ultra),
  };
  (g.chests ??= []).push(c);
  return c;
}
export function addSecretDoor(g: Game, outcome?: string) {
  // Connect an existing room to a right-border door; the reward chamber remains offscreen.
  const floors = g.tiles
    .flatMap((row, y) => row.map((v, x) => ({ v, x, y })))
    .filter((t) => t.v === 0 && t.x < 29);
  const anchor = pick(
    g,
    floors.filter((t) => t.x === Math.max(...floors.map((t) => t.x))),
  );
  for (let x = anchor.x; x < 29; x++) g.tiles[anchor.y][x] = 0;
  const r = random(g),
    door: SecretDoor = {
      id: uid(g),
      x: 29,
      y: anchor.y,
      unlocked: false,
      outcome:
        outcome ||
        (r < 0.4
          ? "chest"
          : r < 0.65
            ? "ultra"
            : r < 0.87
              ? "chief"
              : r < 0.98
                ? "emperor"
                : "king"),
    };
  (g.secretDoors ??= []).push(door);
  return door;
}
export function expansionFloor(g: Game) {
  g.chests = [];
  g.secretDoors = [];
  g.haunting = [];
  g.inSecret = undefined;
  g.pendingChest = undefined;
  g.pendingDoor = undefined;
  const used = (x: number, y: number) =>
    g.monsters.some((m) => m.x === x && m.y === y) ||
    g.loot.some((l) => l.x === x && l.y === y) ||
    g.pods.some((p) => p.x === x && p.y === y) ||
    (g.player.x === x && g.player.y === y) ||
    (g.stairs.x === x && g.stairs.y === y) ||
    g.chests!.some((c) => c.x === x && c.y === y);
  const spots = () =>
    g.tiles
      .flatMap((row, y) => row.map((v, x) => ({ v, x, y })))
      .filter((t) => t.v === 0 && !used(t.x, t.y));
  const chestCount = 1 + roll(g, 2);
  for (let n = 0; n < chestCount; n++) {
    const loc = pick(g, spots());
    if (loc) addChest(g, loc.x, loc.y);
  }
  for (let n = 0; n < roll(g, 3); n++) {
    const loc = pick(g, spots());
    if (loc) {
      const m = makeVillager(g);
      Object.assign(m, loc);
      g.monsters.push(m);
    }
  }
  if (random(g) < 0.18) addSecretDoor(g);
}
export function openChest(g: Game, id: string) {
  const c = g.chests?.find((c) => c.id === id);
  if (
    !c ||
    c.opened ||
    Math.abs(c.x - g.player.x) + Math.abs(c.y - g.player.y) > 1
  )
    throw Error("No unopened chest within reach.");
  if (g.combat || g.pendingLoot)
    throw Error("Finish the encounter or item first.");
  if (c.locked) {
    const k =
      g.inventory.find((i) => i.kind === "key" && i.value === 1) ||
      g.inventory.find((i) => i.kind === "key" && i.value === 2) ||
      g.inventory.find((i) => i.kind === "reusable-key" && (i.uses || 0) > 0);
    if (!k) throw Error("A Standard Key or Rare Key is required.");
    if (k.kind === "reusable-key") {
      k.uses!--;
      if (!k.uses) g.inventory = g.inventory.filter((i) => i.id !== k.id);
      else k.description = `Opens ${k.value === 2 ? "chests or secret doors" : "chests"}. ${k.uses} uses remaining.`;
    } else g.inventory = g.inventory.filter((i) => i.id !== k.id);
    log(g, `Used ${k.name}.`);
  }
  c.opened = true;
  c.locked = false;
  g.pendingChest = undefined;
  g.loot.push({ x: g.player.x, y: g.player.y, item: c.reward });
  g.pendingLoot = c.reward;
  log(g, `Chest opened: ${c.reward.name}.`);
}
export function enterSecret(g: Game, door: SecretDoor) {
  if (!door.roomMade) {
    for (let y = 0; y < g.tiles.length; y++) {
      while (g.tiles[y].length < 41) g.tiles[y].push(1);
      while (g.light[y].length < 41) g.light[y].push(false);
    }
    for (let y = 4; y <= 10; y++)
      for (let x = 33; x <= 39; x++) {
        g.tiles[y][x] = 0;
        g.light[y][x] = true;
      }
    for (let x = 29; x <= 33; x++) {
      g.tiles[door.y][x] = 0;
      g.light[door.y][x] = true;
    }
    // Corridor meets the room even when the border door is above or below it.
    for (let y = Math.min(door.y, 7); y <= Math.max(door.y, 7); y++) {
      g.tiles[y][33] = 0;
      g.light[y][33] = true;
    }
    if (["chest", "ultra"].includes(door.outcome))
      addChest(g, 37, 7, false, door.outcome === "ultra");
    else {
      const m =
        door.outcome === "king"
          ? makeVillager(g, true)
          : makeChief(g, door.outcome === "emperor");
      Object.assign(m, { x: 37, y: 7 });
      g.monsters.push(m);
    }
    door.roomMade = true;
  }
  g.inSecret = door.id;
  const spots = [];
  for (let y = 4; y <= 10; y++)
    for (let x = 33; x <= 39; x++)
      if (
        g.tiles[y][x] === 0 &&
        !g.monsters.some((m) => m.x === x && m.y === y) &&
        !g.chests?.some((c) => !c.opened && c.x === x && c.y === y)
      )
        spots.push({ x, y });
  spots.sort(
    (a, b) =>
      Math.abs(a.x - 34) +
      Math.abs(a.y - 7) -
      Math.abs(b.x - 34) -
      Math.abs(b.y - 7),
  );
  if (!spots.length)
    throw Error("The chamber entrance is crowded. Clear a space first.");
  Object.assign(g.player, spots[0]);
  g.pendingDoor = undefined;
  g.pendingChest = undefined;
  log(g, "You enter a hidden chamber. Return through the western passage.");
}
export function unlockDoor(g: Game, id: string) {
  const d = g.secretDoors?.find((d) => d.id === id);
  if (!d || Math.abs(d.x - g.player.x) + Math.abs(d.y - g.player.y) !== 1)
    throw Error("Stand beside the secret door.");
  if (g.combat || g.pendingLoot)
    throw Error("Finish the encounter or item first.");
  if (!d.unlocked) {
    const k = g.inventory.find((i) => i.kind === "key" && i.value === 2) ||
      g.inventory.find((i) => i.kind === "reusable-key" && i.value === 2 && (i.uses || 0) > 0);
    if (!k) throw Error("A Rare Key opens this secret door.");
    if (k.kind === "reusable-key") {
      k.uses!--;
      if (!k.uses) g.inventory = g.inventory.filter((i) => i.id !== k.id);
      else k.description = `Opens chests or secret doors. ${k.uses} uses remaining.`;
    } else g.inventory = g.inventory.filter((i) => i.id !== k.id);
    d.unlocked = true;
  }
  enterSecret(g, d);
}

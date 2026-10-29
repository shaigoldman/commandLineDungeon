import {
  makeVillager,
  addSecretDoor,
  addChest,
  makeChief,
} from "../shared/expansion";
import {
  newGame,
  makeItem,
  makeMonster,
  act,
  generateFloor,
} from "../shared/engine";
const explore = newGame("Shai", "Scout", "Wind", 0, 91);
explore.player.hp = 6;
explore.monsters = explore.monsters.filter(
  (m) =>
    m.boss ||
    Math.abs(m.x - explore.player.x) + Math.abs(m.y - explore.player.y) > 3,
);
explore.loot = explore.loot.filter(
  (l) =>
    Math.abs(l.x - explore.player.x) + Math.abs(l.y - explore.player.y) > 2,
);
const combat = newGame("Shai", "Mage", "Wind", 0, 91);
combat.player.hp = 10;
const m = makeMonster(combat, "Zombie", 1);
Object.assign(m, { x: combat.monsters[0].x, y: combat.monsters[0].y, hp: 30 });
m.stats.Health = 30;
m.stats.Power = 1;
m.stats.Armor = 0;
combat.monsters = [m];
combat.combat = m.id;
combat.encounter = {
  enemyId: m.id,
  origin: "inspection",
  engaged: false,
  exchanges: 0,
};
combat.inventory.push(makeItem(combat, "Throwing Knife"));
const enemyInitiated = structuredClone(combat);
enemyInitiated.encounter!.origin = "enemy";
const equipment = structuredClone(explore);
const heavy = makeItem(equipment, "Sword");
heavy.name = "Heavy practice sword";
heavy.weight = 20;
equipment.player.stats.Power = 1;
equipment.inventory.push(heavy);
const loot = structuredClone(explore);
const item = makeItem(loot, "Medium Health Potion");
loot.loot.push({ x: loot.player.x, y: loot.player.y, item });
loot.pendingLoot = item;
const fullBag = structuredClone(loot);
while (fullBag.inventory.length < fullBag.capacity)
  fullBag.inventory.push(makeItem(fullBag, "Tiny Health Potion"));
let level = newGame("Shai", "Warrior", "Wind", 0, 91);
const pill = makeItem(level, "EXP Pill");
pill.kind = "xp";
level.inventory.push(pill);
level = act(level, { type: "use", id: pill.id });
const dead = structuredClone(explore);
dead.status = "dead";
dead.player.hp = 0;
dead.log.push("Your journey has ended.");
let won = structuredClone(explore);
won.floor = 2;
generateFloor(won);
won.monsters = won.monsters.filter((m) => !m.boss);
Object.assign(won.player, won.stairs);
won = act(won, { type: "ascend" });
const stairs = structuredClone(explore);
stairs.monsters = stairs.monsters.filter((m) => !m.boss);
Object.assign(stairs.player, stairs.stairs);
const critical = structuredClone(explore);
critical.player.stats.Health = 100;
critical.player.hp = 10;
const lastBreath = structuredClone(critical);
lastBreath.player.hp = 1;
const lethal = structuredClone(combat);
lethal.monsters[0].stats.Power = 10;
const critThreat = structuredClone(combat);
critThreat.monsters[0].stats.Power = 4;
critThreat.monsters[0].stats.Luck = 100;
const floorKnife = structuredClone(loot);
const knife = makeItem(floorKnife, "Throwing Knife");
floorKnife.pendingLoot = knife;
floorKnife.loot = [
  { x: floorKnife.player.x, y: floorKnife.player.y, item: knife },
];
const enemyFirst = structuredClone(combat);
enemyFirst.monsters[0].stats.Speed = 100;
const floorRope = structuredClone(loot);
const rope = makeItem(floorRope, "Escape Rope");
floorRope.pendingLoot = rope;
floorRope.loot = [{ x: floorRope.player.x, y: floorRope.player.y, item: rope }];
const bagReadiness = structuredClone(explore);
bagReadiness.player.hp = bagReadiness.player.stats.Health;
for (const name of [
  "Small Health Potion",
  "Mana Potion",
  "Poison Antidote",
  "Power Boost",
])
  bagReadiness.inventory.push(makeItem(bagReadiness, name));
bagReadiness.capacity = 8;
const combatLowHealth = structuredClone(combat);
combatLowHealth.player.hp = 1;
const floorWeapon = structuredClone(explore);
const groundSword = makeItem(floorWeapon, "Sword");
groundSword.name = "Steel Sword";
groundSword.weight = 2;
floorWeapon.player.stats.Power = 30;
floorWeapon.pendingLoot = groundSword;
floorWeapon.loot = [
  { x: floorWeapon.player.x, y: floorWeapon.player.y, item: groundSword },
];
const floorSwap = structuredClone(floorWeapon);
const oldAxe = makeItem(floorSwap, "Axe");
oldAxe.name = "Iron Axe";
floorSwap.player.weapons = [oldAxe];
while (floorSwap.inventory.length < floorSwap.capacity - 1)
  floorSwap.inventory.push(makeItem(floorSwap, "Small Health Potion"));
const floorWeak = structuredClone(floorWeapon);
floorWeak.player.stats.Power = 1;
const armory = structuredClone(explore);
armory.player.stats.Power = 100;
armory.capacity = 10;
armory.inventory = [];
for (const name of [
  "Fragile Sword",
  "Iron Sword",
  "Steel Sword",
  "Lucky Sword",
  "Magic Sword",
  "Obsidian Sword",
  "Obsidian Axe",
  "Steel Spear",
  "Awathons Broadsword",
]) {
  const w = makeItem(armory, "Sword");
  w.name = name;
  w.weight = 2;
  armory.inventory.push(w);
}
function openArena(className = "Mage") {
  const g = newGame("Shai", className, "Wind", 0, 91);
  g.tiles = Array.from({ length: 15 }, () => Array(30).fill(0));
  g.player.x = 15;
  g.player.y = 7;
  g.player.hp = 10;
  g.loot = [];
  g.chests = [];
  g.secretDoors = [];
  g.haunting = [];
  g.pods = [];
  g.stairs = { x: 25, y: 12, locked: false };
  const staff = g.inventory.find((i) => i.kind === "tome");
  if (staff) {
    g.player.weapons = [staff];
    g.inventory = g.inventory.filter((i) => i.id !== staff.id);
  }
  const m = makeMonster(g, "Zombie", 1);
  Object.assign(m, { x: 16, y: 7, hp: 100 });
  m.stats.Health = 100;
  m.stats.Armor = 2;
  m.stats.Power = 1;
  m.stats.Luck = 0;
  m.stats.Speed = 4;
  g.monsters = [m];
  return g;
}
const swipe = openArena("Scout");
swipe.monsters = [];
const lootPaused = structuredClone(swipe);
const pausedItem = makeItem(lootPaused, "Small Health Potion");
lootPaused.pendingLoot = pausedItem;
lootPaused.loot = [
  { x: lootPaused.player.x, y: lootPaused.player.y, item: pausedItem },
];
const lootAhead = structuredClone(lootPaused);
lootAhead.pendingLoot = undefined;
lootAhead.loot[0].x++;
const poisonMove = structuredClone(swipe);
poisonMove.player.effects.Poison = [3, 1];
const staffLow = openArena();
staffLow.combat = staffLow.monsters[0].id;
staffLow.player.stats.Mana = 1;
staffLow.player.stats.Magic = 20;
staffLow.player.stats.Power = 3;
const staffEmpty = structuredClone(staffLow);
staffEmpty.player.stats.Mana = 0;
const groundThrow = openArena("Scout");
groundThrow.monsters[0].hp = 30;
groundThrow.monsters[0].stats.Health = 30;
groundThrow.monsters[0].stats.Armor = 0;
const floorKnifeItem = makeItem(groundThrow, "Throwing Knife");
groundThrow.pendingLoot = floorKnifeItem;
groundThrow.loot = [{ x: 15, y: 7, item: floorKnifeItem }];
const groundTeleport = openArena("Scout");
groundTeleport.combat = groundTeleport.monsters[0].id;
const floorPortal = makeItem(groundTeleport, "Teleporter");
groundTeleport.pendingLoot = floorPortal;
groundTeleport.loot = [{ x: 15, y: 7, item: floorPortal }];
const carriedTeleport = openArena("Scout");
carriedTeleport.combat = carriedTeleport.monsters[0].id;
carriedTeleport.inventory.push(makeItem(carriedTeleport, "Teleporter"));
const npcTalk = openArena("Warrior");
const chief = makeMonster(npcTalk, "Chieftan", 1);
chief.name = "Yarrow";
chief.x = 16;
chief.y = 7;
chief.hp = 8;
chief.stats.Health = 8;
chief.npc = {
  tribe: "Awa",
  deal: "Health Gain",
  done: false,
  line: "Curious traveler, my lantern has seen stranger things. Shall we make a bargain?",
};
npcTalk.monsters = [chief];
npcTalk.combat = chief.id;
npcTalk.player.hp = 5;
const criticalHit = openArena("Warrior");
criticalHit.player.weapons = [];
criticalHit.player.stats.Power = 5;
criticalHit.player.stats.Speed = 10;
criticalHit.player.stats.Luck = 100;
criticalHit.player.stats.Accuracy = 200;
criticalHit.monsters[0].stats.Armor = 0;
criticalHit.monsters[0].stats.Speed = 1;
criticalHit.combat = criticalHit.monsters[0].id;
for (let seed = 0; seed < 100; seed++) {
  criticalHit.seed = seed;
  if (act(criticalHit, { type: "attack" }).log.includes("Critical hit!")) break;
}
const moss = structuredClone(explore);
moss.floor = 1;
generateFloor(moss);
const ice = structuredClone(explore);
ice.floor = 2;
generateFloor(ice);
const ember = structuredClone(explore);
ember.floor = 3;
generateFloor(ember);
const market = openArena("Scout");
market.monsters = [];
market.player.gold = 500;
const seller = makeVillager(market);
Object.assign(seller, { x: 16, y: 7 });
seller.merchant!.wanted = "Fragile Axe";
seller.merchant!.premium = 3;
seller.merchant!.dislikes = ["projectile"];
seller.merchant!.line =
  "The moon engine folded the world. Have you seen a Fragile Axe? I’m looking for one…";
seller.merchant!.stock = [
  "Poison Antibody",
  "Seismic Shocker",
  "Rare Key",
  "Power Doubler",
].map((name) => ({ item: makeItem(market, name), price: 20 }));
market.monsters = [seller];
market.combat = seller.id;
market.inventory = [
  makeItem(market, "Fragile Axe"),
  makeItem(market, "Throwing Knife"),
  makeItem(market, "Poison Antidote"),
];
market.capacity = 10;
const fullLoot = openArena("Scout");
fullLoot.monsters = [];
fullLoot.capacity = 2;
fullLoot.inventory = [
  makeItem(fullLoot, "Throwing Knife"),
  makeItem(fullLoot, "Escape Rope"),
];
const swapKey = makeItem(fullLoot, "Rare Key");
fullLoot.pendingLoot = swapKey;
fullLoot.loot = [{ x: 15, y: 7, item: swapKey }];
const lockedChest = openArena("Scout");
lockedChest.monsters = [];
lockedChest.inventory = [makeItem(lockedChest, "Standard Key")];
const chest = addChest(lockedChest, 16, 7);
lockedChest.pendingChest = chest.id;
const secretDoor = openArena("Scout");
secretDoor.monsters = [];
const doorway = addSecretDoor(secretDoor, "ultra");
Object.assign(secretDoor.player, { x: 28, y: doorway.y });
secretDoor.inventory = [makeItem(secretDoor, "Rare Key")];
secretDoor.pendingDoor = doorway.id;
const chamber = act(secretDoor, { type: "unlock-door", id: doorway.id });
const emperor = openArena("Scout");
const ruler = makeChief(emperor, true);
ruler.npc!.deal = "Imperial Treasury";
Object.assign(ruler, { x: 16, y: 7 });
emperor.monsters = [ruler];
emperor.combat = ruler.id;
emperor.player.hp = 15;
emperor.player.stats.Health = 20;
const king = structuredClone(market);
const kingActor = makeVillager(king, true);
Object.assign(kingActor, { x: 16, y: 7 });
king.monsters = [kingActor];
king.combat = kingActor.id;
king.player.gold = 99999;
const curse = openArena("Scout");
curse.player.effects.Curse = [12, 3];
curse.inventory = [makeItem(curse, "Poison Antidote")];
curse.monsters = [];
const summonReady = openArena();
summonReady.monsters = [];
summonReady.player.weapons = [makeItem(summonReady, "Wind Staff")];
summonReady.player.stats.Magic = 30;
const alchemizeReady = structuredClone(summonReady);
alchemizeReady.player.weapons = [makeItem(alchemizeReady, "Fire Staff")];
const expansionBag = structuredClone(summonReady);
expansionBag.capacity = 20;
expansionBag.player.hp = 100;
expansionBag.player.stats.Health = 100;
expansionBag.player.stats.Power = 10;
expansionBag.inventory = [
  "Seismic Shocker",
  "Poison Antibody",
  "Power Doubler",
  "20 Gold Coins",
  "Candy",
  "Rare Candy",
  "Ultra Candy",
  "Summoner Stone",
].map((name) => makeItem(expansionBag, name));
const target = makeMonster(expansionBag, "Golem", 1);
Object.assign(target, { x: 17, y: 7, hp: 20 });
target.stats.Health = 20;
expansionBag.monsters = [target];
const staffSwap = openArena();
staffSwap.monsters = [];
staffSwap.player.stats.Power = 20;
staffSwap.player.stats.Magic = 30;
staffSwap.capacity = 10;
staffSwap.inventory.push(makeItem(staffSwap, "Extra Hand"));
const newBlade = makeItem(staffSwap, "Iron Sword");
staffSwap.pendingLoot = newBlade;
staffSwap.loot = [{ x: 15, y: 7, item: newBlade }];
const villagerDoom = structuredClone(market);
Object.assign(villagerDoom.player.stats, {
  Health: 100,
  Power: 9001,
  Accuracy: 9001,
  Speed: 9001,
  Luck: 0,
});
villagerDoom.player.hp = 100;
villagerDoom.inventory = [makeItem(villagerDoom, "Poison Antidote")];
const lootPile = structuredClone(lootPaused);
const pileKey = makeItem(lootPile, "Rare Key"),
  pileDouble = makeItem(lootPile, "Power Doubler");
lootPile.loot.push(
  { x: 15, y: 7, item: pileKey },
  { x: 15, y: 7, item: pileDouble },
);
const stairPile = structuredClone(lootPile);
Object.assign(stairPile.stairs, { x: 15, y: 7, locked: false });
const guaranteedKill = openArena("Scout");
Object.assign(guaranteedKill.player.stats, {
  Power: 20,
  Accuracy: 1000,
  Speed: 100,
  Luck: 0,
});
guaranteedKill.player.hp = 5;
Object.assign(guaranteedKill.monsters[0].stats, {
  Health: 5,
  Power: 100,
  Speed: 1,
  Armor: 0,
  Luck: 0,
});
guaranteedKill.monsters[0].hp = 5;
guaranteedKill.combat = guaranteedKill.monsters[0].id;
const missKill = structuredClone(guaranteedKill);
missKill.player.stats.Accuracy = 0;
missKill.player.stats.Speed = 2;
const firstThreat = structuredClone(guaranteedKill);
firstThreat.monsters[0].stats.Speed = 200;
const dragonEncounter = openArena("Scout");
const redDragon = makeMonster(dragonEncounter, "Dragon", 20);
Object.assign(redDragon, {
  x: 16,
  y: 7,
  name: "Ruthagor, Dungeon Master",
  boss: true,
});
dragonEncounter.monsters = [redDragon];
dragonEncounter.combat = redDragon.id;
const goldAhead = openArena("Scout");
goldAhead.monsters = [];
goldAhead.inventory = [];
goldAhead.capacity = 0;
goldAhead.player.gold = 7;
goldAhead.loot = [{ x: 16, y: 7, item: makeItem(goldAhead, "20 Gold Coins") }];
const goldChest = structuredClone(lockedChest);
goldChest.chests![0].reward = makeItem(goldChest, "10 Gold Coins");
const lockedStairs = structuredClone(stairs);
lockedStairs.stairs.locked = true;
lockedStairs.keys = 0;
lockedStairs.monsters = [];
lockedStairs.loot = [];
lockedStairs.pendingLoot = undefined;
lockedStairs.inventory = [
  makeItem(lockedStairs, "Standard Key"),
  makeItem(lockedStairs, "Rare Key"),
];
const stairKeyReady = structuredClone(lockedStairs);
stairKeyReady.keys = 1;
const stairKeyCarrier = structuredClone(guaranteedKill);
stairKeyCarrier.monsters[0].key = true;
stairKeyCarrier.monsters[0].name = "Stair Key carrier";
stairKeyCarrier.keys = 0;
console.log(
  JSON.stringify({
    lockedStairs,
    stairKeyReady,
    stairKeyCarrier,
    goldAhead,
    goldChest,
    explore,
    swipe,
    poisonMove,
    market,
    fullLoot,
    lockedChest,
    secretDoor,
    chamber,
    emperor,
    king,
    curse,
    summonReady,
    alchemizeReady,
    expansionBag,
    lootPile,
    stairPile,
    guaranteedKill,
    missKill,
    firstThreat,
    dragonEncounter,
    villagerDoom,
    staffSwap,
    lootAhead,
    lootPaused,
    staffLow,
    staffEmpty,
    groundThrow,
    groundTeleport,
    carriedTeleport,
    npcTalk,
    criticalHit,
    moss,
    ice,
    ember,
    floorWeapon,
    floorSwap,
    floorWeak,
    armory,
    combatLowHealth,
    bagReadiness,
    enemyFirst,
    floorRope,
    enemyInitiated,
    equipment,
    floorKnife,
    combat,
    loot,
    fullBag,
    level,
    dead,
    won,
    stairs,
    critical,
    lastBreath,
    lethal,
    critThreat,
  }),
);

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
console.log(
  JSON.stringify({
    explore,
    swipe,
    poisonMove,
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

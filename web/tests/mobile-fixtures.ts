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
console.log(
  JSON.stringify({
    explore,
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

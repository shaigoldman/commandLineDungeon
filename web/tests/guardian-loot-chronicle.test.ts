import { describe, expect, it } from "vitest";
import { act, newGame, makeItem, makeMonster, randomItem, randomItemOfRarity, generateFloor, balanceGuardian, combatAttackStats, incomingDamage } from "../shared/engine";
import { makeVillager, villagerStock, catalogItems } from "../shared/expansion";
import { describe as describeItem, itemDefinitions } from "../shared/catalog";
import { normalizeRarity, migrateItemRarities } from "../shared/rarity";
import { chronicleEntries, chronicleTokens } from "../src/Chronicle";
import type { Game } from "../shared/types";
function arena(seed=1): Game {
  const g=newGame("Test Warrior","Warrior","Wind",0,seed);
  g.tiles=Array.from({length:15},()=>Array(30).fill(0));
  Object.assign(g.player,{x:5,y:5}); g.monsters=[];g.loot=[];g.chests=[];g.traps=[];g.pods=[];g.secretDoors=[];
  g.pendingLevels=0;g.combat=undefined;g.encounter=undefined;g.inventory=[];return g;
}
describe("the second-floor guardian",()=>{
  it("is always a gold golem with a deliberately bounded profile",()=>{
    for(let seed=1;seed<=30;seed++) {
      const g=arena(seed);g.floor=1;generateFloor(g);
      const boss=g.monsters.find(m=>m.name.startsWith("Ergathon"))!;
      expect(boss.className).toBe("Golem");expect(boss.level).toBe(3);
      expect(boss.stats).toMatchObject({Health:58,Power:11,Armor:4,Speed:2});
      expect(combatAttackStats(g.player).Attack-boss.stats.Armor).toBeGreaterThan(0);
    }
  });
  it("lets a modest level-three Warrior win reliably, while an unprepared hero struggles",()=>{
    const wins=[0,0];
    for(let prepared=0;prepared<=1;prepared++)for(let seed=1;seed<=300;seed++){
      let g=arena(seed);g.floor=1;
      if(prepared){g.player.level=3;Object.assign(g.player.stats,{Health:30,Power:19,Armor:2,Accuracy:88,Speed:6,Luck:13});g.player.hp=30;g.player.weapons=[makeItem(g,"Iron Sword")];g.player.weapons[0].uses=10;}
      const boss=makeMonster(g,"Golem",8);boss.name="Ergathon, Ruthagor’s chosen";boss.boss=true;balanceGuardian(g,boss);
      Object.assign(boss,{x:6,y:5});g.monsters=[boss];g.combat=boss.id;
      for(let round=0;round<60&&g.status==="playing"&&g.monsters.some(m=>m.id===boss.id);round++) g=act(g,{type:"attack"});
      if(g.status!=="dead"&&!g.monsters.some(m=>m.id===boss.id))wins[prepared]++;
    }
    console.info("Guardian wins over 300 seeds: starting Warrior",wins[0],"level-three Warrior with Iron Sword",wins[1]);
    expect(wins[1]/300).toBeGreaterThan(0.8);
    expect(wins[1]/300).toBeLessThan(0.96);expect(wins[0]/300).toBeLessThan(0.1);
    expect(wins[1]).toBeGreaterThan(wins[0]);
  });
  it("migrates an existing wounded boss without healing it on later actions",()=>{
    let g=arena();g.floor=1;const m=makeMonster(g,"Golem",8);m.name="Ergathon, Ruthagor’s chosen";m.hp=m.stats.Health/2;g.monsters=[m];
    const sand=makeItem(g,"Sand");g.inventory=[sand];Object.assign(m,{x:6,y:5});
    g=act(g,{type:"use",id:sand.id,target:m.id});expect(g.monsters[0].hp).toBe(29);
    const heal=makeItem(g,"Tiny Mana Potion");g.inventory=[heal];g.player.stats.Mana=0;
    g=act(g,{type:"use",id:heal.id});expect(g.monsters[0].hp).toBe(29);
  });
});
describe("explicit rarity and survivor shops",()=>{
  it("uses only four drop classes, never legendary rewards or stair keys, at every depth",()=>{
    const counts:Record<string,number>={};let weapons=0,potions=0;
    const g=arena(72);
    for(let n=0;n<20000;n++){const item=randomItem(g,n%20);const tier=item.kind==="gold"?"gold":item.kind==="decoy"?"rare":normalizeRarity(item.rarity);counts[tier]=(counts[tier]||0)+1;if(item.kind==="weapon")weapons++;if(["heal","mana","energy-potion"].includes(item.kind))potions++;expect(item.kind).not.toBe("stair-key");}
    for(const [tier,p]of Object.entries({gold:.36,common:.32,uncommon:.24,rare:.07,ultrarare:.01}))expect(Math.abs(counts[tier]/20000-p)).toBeLessThan(tier==="ultrarare"?.003:tier==="rare"?.007:.012);
    expect(counts.legendary).toBeUndefined();expect(weapons/20000).toBeGreaterThan(.03);expect(weapons/20000).toBeLessThan(.043);
    expect(potions/20000).toBeGreaterThan(.10);expect(potions/20000).toBeLessThan(.12);
    console.info("Loot counts over 20,000 draws",counts,"weapons",weapons,"restorative potions",potions);
    expect(()=>randomItemOfRarity(g,"legendary")).toThrow("special rewards");
    expect(makeItem(g,"Awathons Broadsword").rarity).toBe("legendary");
    expect(catalogItems(g).some(i=>i.rarity==="legendary")).toBe(false);
  });
  it("gives half of shops exactly one premium item and ordinary slots a ten-percent common chance",()=>{
    const g=arena(200);let premium=0,common=0,ordinary=0;
    for(let n=0;n<5000;n++){const stock=villagerStock(g);const rare=stock.filter(i=>["rare","ultrarare"].includes(normalizeRarity(i.rarity)));expect(rare.length).toBeLessThanOrEqual(1);premium+=rare.length;for(const i of stock)if(["common","uncommon"].includes(normalizeRarity(i.rarity))){ordinary++;if(i.rarity==="common")common++;}}
    expect(Math.abs(premium/5000-.5)).toBeLessThan(.03);expect(Math.abs(common/ordinary-.1)).toBeLessThan(.015);
  });
  it("does not create duplicate villagers even after all named survivors are present",()=>{
    const g=arena(300);for(let n=0;n<20;n++)g.monsters.push(makeVillager(g));
    const names=g.monsters.filter(m=>m.merchant).map(m=>m.name);expect(names).toHaveLength(12);expect(new Set(names).size).toBe(names.length);
  });
  it("migrates legacy inventories, equipped gear, shops, floor loot and chest rewards",()=>{
    const g=arena();const i=makeItem(g,"Sapphire Staff");i.rarity=7;g.inventory=[i];const m=makeVillager(g);m.merchant!.stock[0].item.rarity=10;g.monsters=[m];migrateItemRarities(g);expect(i.rarity).toBe("rare");expect(m.merchant!.stock[0].item.rarity).toBe("ultrarare");
  });
});
describe("hostile throws and poison weapons",()=>{
  for(const name of ["Throwing Knife","Handcuffs","Sand","Sand Bag","Sandstorm Wand","Quicksand Wand","Bad Candy"])it(name+" commits the hero to fleeing",()=>{
    let g=arena();const m=makeMonster(g,"Zombie",1);Object.assign(m,{x:6,y:5,hp:200});m.stats.Health=200;g.monsters=[m];const i=makeItem(g,name);g.inventory=[i];
    g=act(g,{type:"use",id:i.id,target:m.id});expect(g.combat).toBe(m.id);expect(g.encounter?.engaged).toBe(true);expect(()=>act(g,{type:"leave"})).toThrow("must flee");
  });
  for(const weapon of ["Sword","Spear","Axe","Shield"])it("Poison "+weapon+" has Iron stats and applies poison on a landed hit",()=>{
    let g=arena(40);const iron=makeItem(g,"Iron "+weapon),poison=makeItem(g,"Poison "+weapon);
    for(const stat of ["attack","weight","luck","maxUses","armorBonus"] as const)expect(poison[stat]).toBe(iron[stat]);
    g.player.weapons=[poison];g.player.stats.Accuracy=200;g.player.stats.Power=30;const m=makeMonster(g,"Golem",1);Object.assign(m,{x:6,y:5,hp:200});m.stats.Health=200;m.stats.Power=0;g.monsters=[m];g.combat=m.id;
    g=act(g,{type:"attack"});expect(g.monsters[0].effects.Poison).toBeDefined();
    const hp=g.monsters[0].hp;g.player.stats.Accuracy=-200;g=act(g,{type:"attack"});expect(g.monsters[0].hp).toBeLessThan(hp);
  });
  it("shows the Sapphire Staff’s actual passive Magic bonus",()=>{
    const g=arena();const i=makeItem(g,"Sapphire Staff");expect(describeItem(i)).toContain("+5 Magic");g.inventory=[i];g.player.stats.Mana=0;const potion=makeItem(g,"Tiny Mana Potion");g.inventory.push(potion);
    const after=act(g,{type:"use",id:potion.id});expect(after.player.stats.Magic).toBe(g.player.stats.Magic+5);
  });
});
it("chronicle tokens preserve text while identifying names, conditions and HP",()=>{
  const text="Dark Hero takes 12 poison damage. You gain 5 HP.";const tokens=chronicleTokens(text,["Dark Hero"]);
  expect(tokens.map(t=>t.value).join("")).toBe(text);expect(tokens).toContainEqual({value:"Dark Hero",kind:"name"});expect(tokens).toContainEqual({value:"poison",kind:"status"});expect(tokens).toContainEqual({value:"HP",kind:"hp"});
});

it("keeps chronicle event numbers stable when older events are trimmed",()=>{
  expect(chronicleEntries({log:["older","newest"],logSerial:102})).toEqual([{text:"older",serial:101},{text:"newest",serial:102}]);
  expect(chronicleEntries({log:["legacy"],logSerial:undefined})).toEqual([{text:"legacy",serial:1}]);
});

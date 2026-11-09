import { expect, it } from "vitest";
import { act, canUseFromFloor, itemUseProblem, makeItem, makeMonster, migrateGuardians, newGame } from "../shared/engine";
import { makeVillager } from "../shared/expansion";
function arena() {
 const g=newGame("Flow","Warrior","Wind",0,42);
 g.monsters=[];g.loot=[];g.pods=[];g.traps=[];g.inventory=[];g.pendingLoot=undefined;
 g.player.stats.Health=30;g.player.hp=10;g.player.stats.Mana=0;
 return g;
}
it("uses Mixing Potion from the floor with a full bag, once",()=>{
 let g=arena();const item=makeItem(g,"Mixing Potion");g.loot=[{x:g.player.x,y:g.player.y,item}];g.pendingLoot=item;
 g.inventory=Array.from({length:g.capacity},()=>makeItem(g,"Piece of Trash"));
 const before=structuredClone(g),power=g.player.stats.Power,magic=g.player.stats.Magic;
 expect(canUseFromFloor(item)).toBe(true);
 expect(()=>act(g,{type:"use-floor",id:item.id,spell:"Health:Health"})).toThrow();expect(g).toEqual(before);
 g=act(g,{type:"use-floor",id:item.id,spell:"Power:Magic"});
 expect(g.player.stats.Power).toBe(power-3);expect(g.player.stats.Magic).toBe(magic+3);
 expect(g.inventory).toHaveLength(g.capacity);expect(g.loot).toHaveLength(0);
 expect(()=>act(g,{type:"use-floor",id:item.id,spell:"Power:Magic"})).toThrow();
});
it.each(["Health","Mana"])("restores only chosen %s with bag and floor Energy Potions",choice=>{
 for(const ground of [false,true]) {
  let g=arena();const item=makeItem(g,"Energy Potion");if(ground)g.loot=[{x:g.player.x,y:g.player.y,item}];else g.inventory=[item];
  const type=ground?"use-floor":"use";
  expect(()=>act(g,{type,id:item.id})).toThrow("Choose health or mana");
  g=act(g,{type,id:item.id,spell:choice});
  expect(g.player.hp).toBe(choice==="Health"?15:10);expect(g.player.stats.Mana).toBe(choice==="Mana"?5:0);
  expect(g.inventory).toHaveLength(0);expect(g.loot).toHaveLength(0);
 }
});
it("retains Energy Potion when chosen resource is full",()=>{
 const g=arena(),item=makeItem(g,"Energy Potion");g.inventory=[item];g.player.stats.Mana=10;
 expect(()=>act(g,{type:"use",id:item.id,spell:"Mana"})).toThrow("already full");expect(g.inventory).toHaveLength(1);
});
it("buys into a full bag and uses a utility item to free a slot during a conversation",()=>{
 let g=arena();const seller=makeVillager(g);Object.assign(seller,{x:g.player.x+1,y:g.player.y});g.monsters=[seller];g.combat=seller.id;
 const item=makeItem(g,"Night Vision Goggles"),offer=makeItem(g,"Mixing Potion");
 g.inventory=[item,...Array.from({length:g.capacity-1},()=>makeItem(g,"Piece of Trash"))];
 seller.merchant!.stock=[{item:offer,price:3}];g.player.gold=10;
 expect(itemUseProblem(g,item)).toBeUndefined();
 g=act(g,{type:"buy",id:offer.id});expect(g.player.gold).toBe(7);expect(g.pendingBagCleanup).toBe(true);
 expect(()=>act(g,{type:"wait"})).toThrow("over capacity");
 g=act(g,{type:"use",id:item.id});expect(g.inventory).toHaveLength(5);expect(g.light.flat().every(Boolean)).toBe(true);expect(g.combat).toBe(seller.id);expect(g.pendingBagCleanup).toBe(false);
});
it("allows vision goggles during an enemy encounter",()=>{
 let g=arena();const enemy=makeMonster(g,"Zombie",0);g.monsters=[enemy];g.combat=enemy.id;
 const item=makeItem(g,"Night Vision Goggles");g.inventory=[item];expect(itemUseProblem(g,item)).toBeUndefined();
 g=act(g,{type:"use",id:item.id});expect(g.light.flat().every(Boolean)).toBe(true);expect(g.combat).toBe(enemy.id);
});
it("upgrades the previous Ruthagor revision once, preserving wounds",()=>{
 const g=arena(),boss=makeMonster(g,"Dragon",20);boss.boss=true;boss.name="Ruthagor, Dungeon Master";boss.ruthagorAttackVersion=1;boss.stats.Power=100;boss.hp=2;g.monsters=[boss];
 migrateGuardians(g);migrateGuardians(g);expect(boss.stats.Power).toBe(120);expect(boss.hp).toBe(2);expect(boss.ruthagorAttackVersion).toBe(2);
});

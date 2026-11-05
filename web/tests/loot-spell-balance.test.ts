import {it,expect} from "vitest";
import {act,newGame,makeItem,makeMonster,syncPassiveStats,manaCap,availableSpells,spellCost,spellMenu,balanceGuardian} from "../shared/engine";
it("orders spell menus by castability, effective cost, then name without hiding unavailable spells",()=>{
 const g=newGame("Mage","Mage","Water",0,17);g.player.stats.Magic=40;g.player.stats.Mana=3;g.inventory=[makeItem(g,"Elemental Staff"),makeItem(g,"Mana Diamond")];
 const before=structuredClone(g),menu=spellMenu(g),usable=new Set(availableSpells(g).map(s=>s.name));
 expect(menu.length).toBeGreaterThan(usable.size);expect(usable.size).toBeGreaterThan(0);
 expect(menu.map(s=>s.name).sort()).toEqual(availableSpells(g,{free:true,ignoreReq:true}).map(s=>s.name).sort());
 for(let n=1;n<menu.length;n++){
  const a=menu[n-1],b=menu[n];expect(Number(usable.has(a.name))).toBeGreaterThanOrEqual(Number(usable.has(b.name)));
  if(usable.has(a.name)===usable.has(b.name))expect(spellCost(g,a)).toBeLessThanOrEqual(spellCost(g,b));
 }
 expect(g).toEqual(before);
});
it("clamps current mana when a carried Mana Battery is lost",()=>{
 let g=newGame("Battery","Warrior","Wind",0,12);g.monsters=[];g.pendingLoot=undefined;const battery=makeItem(g,"Mana Battery");g.inventory=[battery];syncPassiveStats(g);g.player.stats.Mana=manaCap(g.player);
 g=act(g,{type:"drop",id:battery.id});expect(manaCap(g.player)).toBe(10);expect(g.player.stats.Mana).toBe(10);
});
it("updates an existing half-wounded guardian without healing it again on later actions",()=>{
 let g=newGame("Guardian","Warrior","Wind",0,21);g.floor=1;const boss=makeMonster(g,"Golem",3);boss.name="Ergathon, Ruthagor’s chosen";boss.level=3;boss.boss=true;boss.stats={Health:44,Power:9,Armor:3,Accuracy:68,Speed:2,Luck:0,Magic:5,Mana:10};boss.hp=22;g.monsters=[boss];g.pendingLoot=undefined;
 const battery=makeItem(g,"Mana Battery");g.inventory=[battery];g=act(g,{type:"drop",id:battery.id});expect(g.monsters[0].hp).toBe(29);expect(g.monsters[0].stats.Health).toBe(58);
 const hp=g.monsters[0].hp;g.inventory=[makeItem(g,"Sand")];g=act(g,{type:"drop",id:g.inventory[0].id});expect(g.monsters[0].hp).toBe(hp);
});

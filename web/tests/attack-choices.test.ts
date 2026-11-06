import {it,expect} from "vitest";
import {act,newGame,makeItem,makeMonster} from "../shared/engine";
import {outgoingDamage} from "../shared/presentation";
function arena(gear:string){
 const g=newGame("Fighter","Mage","Wind",0,91);g.tiles=Array.from({length:15},()=>Array(30).fill(0));
 Object.assign(g.player,{x:15,y:7,hp:100,effects:{}});Object.assign(g.player.stats,{Health:100,Power:12,Magic:20,Mana:10,Luck:0,Speed:100,Accuracy:1000});
 g.inventory=[];g.loot=[];g.pods=[];g.traps=[];g.chests=[];g.secretDoors=[];g.pendingLoot=undefined;
 const weapon=makeItem(g,gear);weapon.luck=0;if(weapon.kind==="weapon")weapon.uses=7;g.player.weapons=[weapon];
 const enemy=makeMonster(g,"Zombie",1);Object.assign(enemy,{x:16,y:7,hp:500});Object.assign(enemy.stats,{Health:500,Power:0,Armor:0,Speed:0,Luck:0});g.monsters=[enemy];g.combat=enemy.id;
 return g;
}
it("uses the unarmed preview and spends no staff mana while retaining equipped gear",()=>{
 const g=arena("Wind Staff"),before=structuredClone(g);
 expect(outgoingDamage(g.player,g.monsters[0]).normal).toBe(20);expect(outgoingDamage(g.player,g.monsters[0],true).normal).toBe(12);expect(g).toEqual(before);
 const result=act(g,{type:"attack",unarmed:true});expect(result.monsters[0].hp).toBe(488);expect(result.player.stats.Mana).toBe(10);expect(result.player.weapons).toEqual(g.player.weapons);
 expect(result.encounter?.engaged).toBe(true);expect(()=>act(result,{type:"leave"})).toThrow("flee");
 const armed=act(g,{type:"attack"});expect(armed.monsters[0].hp).toBe(480);expect(armed.player.stats.Mana).toBe(8);
});
it("an unarmed attack spends no blade durability and applies no weapon poison",()=>{
 const g=arena("Poison Sword"),weapon=g.player.weapons[0];
 const result=act(g,{type:"attack",unarmed:true});expect(result.monsters[0].hp).toBe(488);expect(result.player.weapons[0]).toMatchObject({id:weapon.id,uses:7});expect(result.monsters[0].effects.Poison).toBeUndefined();
});

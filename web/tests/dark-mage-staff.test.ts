import { expect, it } from "vitest";
import { act, makeMonster, newGame } from "../shared/engine";
function mage() {
 const g=newGame("Mage tester","Scout","Wind",0,12);
 for(let seed=1;seed<1000;seed++){g.seed=seed;const m=makeMonster(g,"Dark Hero",1);if(m.heroClass==="Mage")return {g,m};}
 throw Error("No seeded Mage found");
}
it("every Dark Hero Mage starts with exactly one equipped staff and up to five bag items",()=>{
 const {g}=mage();let count=0;const elements=new Set<string>();
 for(let seed=1;seed<=2000;seed++){
  g.seed=seed;const m=makeMonster(g,"Dark Hero",1);
  expect(m.inventory!.length).toBeLessThanOrEqual(5);
  if(m.heroClass!=="Mage"){expect(m.weapons).toHaveLength(0);continue;}
  count++;expect(m.weapons).toHaveLength(1);expect(m.weapons[0].kind).toBe("tome");expect(m.inventory!.some(i=>i.id===m.weapons[0].id)).toBe(false);elements.add(m.weapons[0].element!);
 }
 expect(count).toBeGreaterThan(400);for(const element of ["Wind","Fire","Water"])expect(elements.has(element)).toBe(true);
});
it("an equipped staff remains usable for casting even with an empty bag",()=>{
 const {g,m}=mage();g.tiles=Array.from({length:15},()=>Array(30).fill(0));g.chests=[];g.traps=[];g.loot=[];g.pods=[];g.secretDoors=[];g.combat=undefined;
 Object.assign(g.player,{x:5,y:5,hp:1000});Object.assign(g.player.stats,{Health:1000,Speed:100});Object.assign(m,{x:5,y:7,inventory:[]});m.stats.Speed=10;m.stats.Magic=100;g.monsters=[m];
 let casts=0;for(let seed=1;seed<=100;seed++){const attempt=structuredClone(g);attempt.seed=seed;const next=act(attempt,{type:"move",dx:0,dy:1});if(next.log.some(line=>line.includes("casts ")&&line.includes("from "))){casts++;expect(next.monsters[0].stats.Mana).toBeLessThan(10);}}
 expect(casts).toBeGreaterThan(0);
});
it("the equipped staff drops once at the Mage's death square",()=>{
 const {g,m}=mage();g.inventory=[];g.loot=[];g.monsters=[m];g.combat=m.id;const staff=m.weapons[0];Object.assign(m,{x:6,y:5,hp:1});Object.assign(g.player,{x:5,y:5});Object.assign(g.player.stats,{Power:10000,Accuracy:10000,Speed:10000});
 const next=act(g,{type:"attack"});const drops=next.loot.filter(l=>l.item.id===staff.id);expect(drops).toHaveLength(1);expect(drops[0]).toMatchObject({x:6,y:5});
});

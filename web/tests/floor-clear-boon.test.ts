import { describe, expect, it } from "vitest";
import { act, makeItem, makeMonster, newGame, generateFloor, itemUseProblem } from "../shared/engine";
import { makeVillager, makeChief } from "../shared/expansion";
function scene(seed=91) {
 const g=newGame("Boon tester","Warrior","Wind",0,seed);
 g.tiles=Array.from({length:15},()=>Array(30).fill(0));g.light=g.tiles.map(r=>r.map(()=>true));g.monsters=[];g.loot=[];g.pods=[];g.chests=[];g.traps=[];g.secretDoors=[];g.inventory=[];g.player.weapons=[];g.pendingLoot=undefined;
 Object.assign(g.player,{x:5,y:5,hp:100});Object.assign(g.player.stats,{Health:100,Power:1000,Speed:1000,Accuracy:1000,Luck:0});
 const boss=makeMonster(g,"Golem",1);Object.assign(boss,{boss:true,x:20,y:7});
 const enemy=makeMonster(g,"Zombie",1);Object.assign(enemy,{x:6,y:5,hp:1});g.monsters=[boss,enemy];g.combat=enemy.id;return g;
}
describe("floor-clearing boon",()=>{
 it("spawns exactly three distinct, empty health pods and records an announcement",()=>{
  const g=scene();g.pods=[{x:8,y:5,max:true}];g.loot=[{x:9,y:5,item:makeItem(g,"Sand")}];g.traps=[{id:"trap",x:10,y:5,kind:"rust",revealed:false}];g.chests=[{id:"chest",x:11,y:5,locked:true,opened:false,ultra:false,reward:makeItem(g,"Sand")}];
  const next=act(g,{type:"attack"});const pods=next.pods.filter(p=>p.healthOnly);expect(pods).toHaveLength(3);expect(next.pods).toHaveLength(4);expect(new Set(pods.map(p=>p.x+","+p.y)).size).toBe(3);
  for(const p of pods){expect(p.max).toBe(false);expect(p.x).toBeLessThan(29);expect(next.tiles[p.y][p.x]).toBe(0);expect(next.monsters.some(m=>m.x===p.x&&m.y===p.y)).toBe(false);expect(next.loot.some(l=>l.x===p.x&&l.y===p.y)).toBe(false);expect(next.traps!.some(t=>t.x===p.x&&t.y===p.y)).toBe(false);expect(next.chests!.some(c=>c.x===p.x&&c.y===p.y)).toBe(false);expect(p.x===g.player.x&&p.y===g.player.y).toBe(false);expect(p.x===g.stairs.x&&p.y===g.stairs.y).toBe(false);}
  expect(next.log.join(" ")).toContain("FLOOR BOON:");expect(next.floorBoonGranted).toBe(true);
 });
 it("waits for all hostiles, but does not require killing friendly villagers or chiefs",()=>{
  let g=scene();const extra=makeMonster(g,"Spider",1);extra.hp=1;g.monsters.push(extra,makeVillager(g),makeChief(g));g=act(g,{type:"attack"});expect(g.floorBoonGranted).not.toBe(true);g.combat=extra.id;g=act(g,{type:"attack"});expect(g.pods.filter(p=>p.healthOnly)).toHaveLength(3);expect(g.monsters.some(m=>m.merchant)).toBe(true);
 });
 it("does not trigger if the boss is already dead, or simply on an empty scene",()=>{
  const g=scene();g.monsters=g.monsters.filter(m=>!m.boss);expect(act(g,{type:"attack"}).pods).toHaveLength(0);
  const h=scene();h.monsters=h.monsters.filter(m=>m.boss);h.combat=undefined;expect(act(h,{type:"ignore"}).pods).toHaveLength(0);
 });
 it("persists across reloads and cannot be farmed with summoned enemies",()=>{
  let g=act(scene(),{type:"attack"});g=JSON.parse(JSON.stringify(g));g=act(g,{type:"ignore"});expect(g.pods).toHaveLength(3);const enemy=makeMonster(g,"Zombie",1);enemy.hp=1;g.monsters.push(enemy);g.combat=enemy.id;g=act(g,{type:"attack"});expect(g.pods).toHaveLength(3);expect(g.log.filter(l=>l.startsWith("FLOOR BOON:"))).toHaveLength(1);
 });
 it("also rewards an already-cleared floor loaded from an older save",()=>{
  let g=scene();g.monsters=g.monsters.filter(m=>m.boss);g.combat=undefined;delete g.floorEnemyKills;delete g.floorBoonGranted;g=act(g,{type:"ignore"});expect(g.pods).toHaveLength(3);expect(g.floorBoonGranted).toBe(true);g=act(JSON.parse(JSON.stringify(g)),{type:"ignore"});expect(g.pods).toHaveLength(3);
 });
 it("resets eligibility for a new floor",()=>{
  const g=act(scene(),{type:"attack"});g.floor++;generateFloor(g);expect(g.floorBoonGranted).toBe(false);expect(g.floorEnemyKills).toBe(0);expect(g.pods.some(p=>p.healthOnly)).toBe(false);
 });
 it("health pods heal staff users rather than randomly restoring mana",()=>{
  let g=scene();g.monsters=[];g.combat=undefined;g.player.weapons=[makeItem(g,"Fire Staff")];g.player.hp=10;g.player.stats.Mana=0;g.pods=[{x:6,y:5,max:false,healthOnly:true}];g=act(g,{type:"move",dx:1,dy:0});expect(g.player.hp).toBe(36);expect(g.player.stats.Mana).toBe(0);expect(g.pods).toHaveLength(0);
 });
 it("keeps full-health pods available and respects Energy Belt and Energy Armor",()=>{
  let g=scene();g.monsters=[];g.combat=undefined;g.player.weapons=[makeItem(g,"Fire Staff")];g.player.stats.Mana=0;g.pods=[{x:6,y:5,max:false,healthOnly:true}];g=act(g,{type:"move",dx:1,dy:0});expect(g.pods).toHaveLength(1);expect(g.player.stats.Mana).toBe(0);
  g.player.hp=10;g.player.x=5;g.inventory=[makeItem(g,"Energy Belt"),makeItem(g,"Energy Armor")];g=act(g,{type:"move",dx:1,dy:0});expect(g.player.hp).toBe(62);expect(g.player.stats.Mana).toBe(6);expect(g.pods).toHaveLength(0);
 });
 it("waits until chained explosions finish, so a simultaneous boss death grants nothing",()=>{
  const g=scene();const robot=g.monsters[1];robot.className="Robot";robot.level=1;Object.assign(g.monsters[0],{x:7,y:5,hp:1});const next=act(g,{type:"attack"});expect(next.monsters).toHaveLength(0);expect(next.floorBoonGranted).not.toBe(true);
 });
 it("Energy Magnet keeps full-health boon pods and heals instead of restoring mana",()=>{
  let g=scene();g.monsters=[];g.combat=undefined;g.pods=[{x:10,y:5,max:false,healthOnly:true}];const magnet=makeItem(g,"Energy Magnet");g.inventory=[magnet];g.player.stats.Mana=0;
  expect(itemUseProblem(g,magnet)).toContain("Health is already full");expect(()=>act(g,{type:"use",id:magnet.id})).toThrow("Health is already full");expect(g.pods).toHaveLength(1);
  g.player.hp=10;g=act(g,{type:"use",id:magnet.id});expect(g.player.hp).toBe(36);expect(g.player.stats.Mana).toBe(0);expect(g.pods).toHaveLength(0);
 });
 it("uses seeded randomness and can place pods in the main dungeon from a secret room",()=>{
  const g=scene();expect(act(g,{type:"attack"}).pods).toEqual(act(g,{type:"attack"}).pods);
  g.inSecret="secret";Object.assign(g.player,{x:35,y:7});Object.assign(g.monsters[1],{x:36,y:7});const next=act(g,{type:"attack"});expect(next.pods).toHaveLength(3);expect(next.pods.every(p=>p.x<29)).toBe(true);
 });
 it("defers the complete boon if fewer than three free tiles exist",()=>{
  let g=scene();g.tiles=g.tiles.map(row=>row.map(()=>1));for(const[x,y]of[[5,5],[6,5],[20,7],[7,5],[8,5]])g.tiles[y][x]=0;g=act(g,{type:"attack"});expect(g.pods).toHaveLength(0);expect(g.floorBoonGranted).not.toBe(true);g.tiles[5][9]=0;g=act(g,{type:"ignore"});expect(g.pods).toHaveLength(3);
 });
});

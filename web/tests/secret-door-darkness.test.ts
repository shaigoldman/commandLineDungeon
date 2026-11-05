import { expect, it } from "vitest";
import { newGame, act, makeItem } from "../shared/engine";
import { addSecretDoor, prepareSecretRoom, repairSecretRoomLighting } from "../shared/expansion";
import type { Game, SecretDoor } from "../shared/types";
function scene() {
  const g=newGame("Fog tester","Scout","Wind",0,91);
  g.tiles=Array.from({length:15},()=>Array(30).fill(0));g.light=g.tiles.map(r=>r.map(()=>false));
  g.monsters=[];g.chests=[];g.secretDoors=[];g.loot=[];g.pods=[];g.traps=[];g.inventory=[];
  Object.assign(g.player,{x:10,y:7});const door=addSecretDoor(g,"chest");door.y=7;
  return {g,door};
}
function oldLighting(g:Game,door:SecretDoor) {
  delete door.fogVersion;
  for(let y=4;y<=10;y++)for(let x=33;x<=39;x++)g.light[y][x]=true;
  for(let x=29;x<=33;x++)g.light[door.y][x]=true;
  for(let y=Math.min(door.y,7);y<=Math.max(door.y,7);y++)g.light[y][33]=true;
}
it("creating a room for a remote teleport does not reveal the doorway, corridor or room",()=>{
  const {g,door}=scene();prepareSecretRoom(g,door);
  expect(door.roomMade).toBe(true);expect(g.chests).toHaveLength(1);expect(g.tiles[7][33]).toBe(0);
  expect(g.light.flat().some(Boolean)).toBe(false);
});
it("keeps deliberate Light reveals when a room is generated",()=>{
  const {g,door}=scene();g.light[7][29]=true;g.light[3][10]=true;prepareSecretRoom(g,door);
  expect(g.light[7][29]).toBe(true);expect(g.light[3][10]).toBe(true);expect(g.light[7][30]).toBe(false);
});
it("Night Vision reveals newly generated secret terrain too",()=>{
  const {g,door}=scene();g.light=g.light.map(r=>r.map(()=>true));prepareSecretRoom(g,door);
  expect(g.light.every(r=>r.every(Boolean))).toBe(true);
});
it("repairs legacy room illumination once without repeatedly erasing later Light spells",()=>{
  const {g,door}=scene();prepareSecretRoom(g,door);oldLighting(g,door);g.light[2][4]=true;
  const loaded=JSON.parse(JSON.stringify(g));repairSecretRoomLighting(loaded);
  expect(loaded.light[7][29]).toBe(false);expect(loaded.light[7][33]).toBe(false);expect(loaded.light[7][37]).toBe(false);expect(loaded.light[2][4]).toBe(true);
  loaded.light[7][29]=true;repairSecretRoomLighting(loaded);expect(loaded.light[7][29]).toBe(true);
});
it("preserves Night Vision in a legacy save",()=>{
  const {g,door}=scene();prepareSecretRoom(g,door);oldLighting(g,door);g.light=g.light.map(r=>r.map(()=>true));repairSecretRoomLighting(g);
  expect(g.light.every(r=>r.every(Boolean))).toBe(true);
});
it("persists the legacy lighting repair on the next real action",()=>{
  const {g,door}=scene();prepareSecretRoom(g,door);oldLighting(g,door);const potion=makeItem(g,"Tiny Mana Potion");g.inventory=[potion];g.player.stats.Mana=0;
  const next=act(g,{type:"use",id:potion.id});expect(next.light[door.y][door.x]).toBe(false);expect(next.secretDoors![0].fogVersion).toBe(1);
});

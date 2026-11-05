import { afterEach, expect, it, vi } from "vitest";
import { sprite } from "../src/art";
import { itemCanvas } from "../src/item-art";
function draw(render:()=>unknown) {
  const pixels=Array<string>(40*40).fill("");
  const ctx={fillStyle:"",scale(){},fillRect(x:number,y:number,w:number,h:number){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx>=0&&xx<40&&yy>=0&&yy<40)pixels[yy*40+xx]=this.fillStyle;}};
  vi.stubGlobal("document",{createElement:()=>({getContext:()=>ctx})});render();return pixels;
}
afterEach(()=>vi.unstubAllGlobals());
it("gives the robot its own silhouette and the guardian a visibly golden palette",()=>{
  const golem=draw(()=>sprite("Golem",1)),robot=draw(()=>sprite("Robot",1)),gold=draw(()=>sprite("Ergathon",1));
  expect(robot.map(Boolean)).not.toEqual(golem.map(Boolean));
  expect(gold.map(Boolean)).toEqual(golem.map(Boolean));
  expect(gold).not.toEqual(golem);
  expect(gold.filter(c=>["#966322","#ffe29a","#ffefb0","#bb8a35","#fff1b0","#ffeabd"].includes(c)).length).toBeGreaterThan(30);
});
it("renders visible rust patches and a green poison weapon coating",()=>{
  const armor=draw(()=>itemCanvas({kind:"armor",name:"Iron Armor"},1));
  const rusty=draw(()=>itemCanvas({kind:"armor",name:"Rusty Armor"},1));
  expect(rusty).not.toEqual(armor);expect(rusty.filter(c=>c==="#874624").length).toBeGreaterThan(10);
  const iron=draw(()=>itemCanvas({kind:"weapon",name:"Iron Sword"},1)),poison=draw(()=>itemCanvas({kind:"weapon",name:"Poison Sword"},1));expect(poison).not.toEqual(iron);
});

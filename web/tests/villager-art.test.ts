import { afterEach, describe, expect, it, vi } from "vitest";
import { history } from "../shared/expansion";
import { namedVillagers } from "../src/villager-art";
import { worldArt } from "../src/world-art";
function raster(name: string) {
  const pixels=Array<string>(32*32).fill("");
  const context={fillStyle:"",imageSmoothingEnabled:false,scale(){},fillRect(x:number,y:number,w:number,h:number){
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx>=0&&xx<32&&yy>=0&&yy<32)pixels[yy*32+xx]=this.fillStyle;
  }};
  vi.stubGlobal("document",{createElement:()=>({width:0,height:0,getContext:()=>context})});
  worldArt("Villager",1,name);
  return pixels;
}
afterEach(()=>vi.unstubAllGlobals());
describe("individually drawn villagers",()=>{
  it("covers every named villager from the game",()=>{
    expect([...namedVillagers].sort()).toEqual(history.map(([name])=>name).sort());
    const generic=raster("").join(",");
    for(const name of namedVillagers)expect(raster(name).join(","),name).not.toBe(generic);
  });
  it("gives everyone a distinct silhouette, including below the head",()=>{
    const bodies=namedVillagers.map(name=>({name,mask:raster(name).slice(16*32).map(Boolean)}));
    for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j],difference=a.mask.filter((pixel,index)=>pixel!==b.mask[index]).length;
      expect(difference,`${a.name} and ${b.name} must differ in body geometry, not just hats or color`).toBeGreaterThanOrEqual(10);
    }
  });
  it("keeps each identity deterministic across repeated renders",()=>{
    for(const name of namedVillagers)expect(raster(name)).toEqual(raster(name));
  });
});

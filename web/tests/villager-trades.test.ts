import { describe, expect, it } from "vitest";
import { makeItem, newGame, act } from "../shared/engine";
import { history, makeVillager, marketValue, saleQuote, villagerStock } from "../shared/expansion";
import { merchantSpecialty, specialtyItem, villagerTrades } from "../shared/merchant-trades";
import { normalizeRarity } from "../shared/rarity";

const game = () => {const g=newGame("Trader","Scout","Wind",0,100);g.monsters=[];return g;};
describe("character-driven trade",()=>{
  it("gives every named survivor a distinct specialty and in-character requests",()=>{
    expect(new Set(history.map(([name])=>villagerTrades[name].label)).size).toBe(12);
    const g=game();
    for(const [name] of history) {
      const p=merchantSpecialty({name})!;expect(p.bio).toContain(name.split(" ")[0]);
      for(const wanted of p.wanted)expect(specialtyItem(p,makeItem(g,wanted))).toBe(true);
    }
    for(let n=0;n<150;n++) {
      const m=makeVillager(g),p=merchantSpecialty(m)!;
      expect(m.merchant!.line).toContain(p.pitch);
      if(m.merchant!.wanted){expect(p.wanted).toContain(m.merchant!.wanted);expect(m.merchant!.stock.some(s=>s.item.name===m.merchant!.wanted)).toBe(false);}
    }
  });
  for(const [name] of history)it(name+" strongly favors its specialty without changing rarity rolls",()=>{
    const g=game(),p=merchantSpecialty({name})!;let preferred=0,total=0,common=0,ordinary=0,premiums=0;
    for(let n=0;n<1000;n++) {
      const stock=villagerStock(g,p);let premium=0;
      for(const i of stock){total++;if(specialtyItem(p,i))preferred++;const tier=i.kind==="decoy"?"rare":normalizeRarity(i.rarity);if(tier==="common"||tier==="uncommon"){ordinary++;if(tier==="common")common++;}else premium++;expect(i.rarity).not.toBe("legendary");expect(i.kind).not.toBe("stair-key");}
      expect(premium).toBeLessThanOrEqual(1);premiums+=premium;
    }
    expect(preferred/total).toBeGreaterThan(.75);
    expect(Math.abs(common/ordinary-.1)).toBeLessThan(.025);
    expect(Math.abs(premiums/1000-.5)).toBeLessThan(.07);
  });
  it("pays more for matching goods, honors wanted premiums and never permits a normal resale loop",()=>{
    const g=game();const m=makeVillager(g);m.name="Orla Soot";m.merchant!.wanted=undefined;m.merchant!.dislikes=["tome"];
    for(const name of ["Wind Staff","Sapphire Staff","Dark Staff","Mana Battery","Tiny Mana Potion"]) {
      const i=makeItem(g,name),general=structuredClone(m);general.name="A passing trader";general.merchant!.dislikes=[];
      const offer=saleQuote(m,i)!;expect(offer).toBeGreaterThan(saleQuote(general,i)!);expect(offer).toBeLessThan(Math.ceil(marketValue(i)*.72));
      const reloaded=JSON.parse(JSON.stringify(m));expect(saleQuote(reloaded,i)).toBe(offer);
    }
    const wanted=makeItem(g,"Sapphire Staff");m.merchant!.wanted=wanted.name;m.merchant!.premium=3;expect(saleQuote(m,wanted)).toBe(marketValue(wanted)*3);
  });
  it("honors old cached offers and preserves unrelated refusals",()=>{
    const g=game(),m=makeVillager(g);m.name="Orla Soot";m.merchant!.wanted=undefined;m.merchant!.dislikes=["projectile"];
    const old=makeItem(g,"Sapphire Staff");m.merchant!.buyPrices[old.id]=3;expect(saleQuote(m,old)).toBe(3);expect(saleQuote(m,makeItem(g,"Throwing Knife"))).toBeNull();
  });
  it("specializes wind and poison stock and retains a broad royal bazaar",()=>{
    const g=game();let wind=false,poison=false;
    for(let n=0;n<100;n++) {
      const a=villagerStock(g,villagerTrades["Pip Bellwether"]);wind ||=a.some(i=>i.name==="Wind Staff");
      const b=villagerStock(g,villagerTrades["Hob Nettle"]);poison ||=b.some(i=>i.name.startsWith("Poison ")&&i.kind==="weapon");
    }
    expect(wind&&poison).toBe(true);const king=makeVillager(g,true);expect(merchantSpecialty(king)?.label).toBe("Royal treasures");expect(king.merchant!.stock.length).toBeGreaterThan(30);
  });
  it("pays and persists the specialty price through a real sale action",()=>{
    let g=game();const m=makeVillager(g);m.name="Orla Soot";m.merchant!.wanted=undefined;m.merchant!.dislikes=[];Object.assign(m,{x:g.player.x+1,y:g.player.y});g.monsters=[m];g.combat=m.id;
    const i=makeItem(g,"Sapphire Staff");g.inventory=[i];const price=saleQuote(structuredClone(m),i)!;const gold=g.player.gold||0;
    g=act(g,{type:"sell",id:i.id});expect(g.player.gold).toBe(gold+price);expect(g.inventory).toHaveLength(0);expect(g.monsters[0].merchant!.buyPrices[i.id]).toBe(price);
  });
});

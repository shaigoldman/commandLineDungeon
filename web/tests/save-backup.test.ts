import { describe, expect, it } from "vitest";
import { LocalGameAPI } from "../shared/local-api";
import { decodeBackup, encodeBackup } from "../shared/save-backup";
import { newGame } from "../shared/engine";
function memory() {
  const map=new Map<string,string>();
  return {map,get:async(k:string)=>map.get(k)||null,set:async(k:string,v:string)=>{map.set(k,v);}};
}
const options={name:"Elara",className:"Mage",element:"Wind",difficulty:0};
describe("portable browser save backups",()=>{
  it("round trips every hero and generated floor including merchants and equipped gear",()=>{
    for(const cls of ["Warrior","Knight","Scout","Mage","D"])
      for(let seed=1;seed<=10;seed++) {
        const game=newGame("Hero",cls,"Wind",0,seed);
        const decoded=decodeBackup(encodeBackup([game],42));
        expect(decoded).toEqual({games:[game],highScore:42});
      }
  });
  it("exports all heroes and imports copies without overwriting active progress",async()=>{
    const source=new LocalGameAPI(memory());
    const a=await source.request("games",options),id=a.data.recoveryKey!;
    await source.request("action",{revision:0,action:{type:"cast",spell:"Teleport"}},id);
    await source.request("games",{...options,name:"Bran",className:"Warrior"});
    const backup=(await source.request("export-saves")).data.backup!;
    expect(backup).not.toContain(id);
    const storage=memory(),target=new LocalGameAPI(storage);
    const existing=await target.request("games",{...options,name:"Existing"});
    const imported=await target.request("import-saves",{backup});
    expect(imported.data.imported).toBe(2);
    expect((await target.request("game",undefined,existing.data.recoveryKey)).data.game).toEqual(existing.data.game);
    const resumed=new LocalGameAPI(storage),list=(await resumed.request("saved-adventures")).data.adventures!;
    expect(list.map(g=>g.heroName).sort()).toEqual(["Bran","Elara","Existing"]);
    const elara=await resumed.request("game",undefined,list.find(g=>g.heroName==="Elara")!.id);
    expect(elara.data.game?.revision).toBe(1);
    expect(elara.data.game?.player.stats.Mana).toBe(9);
    expect(elara.data.game?.startedAt).toBe(a.data.game?.startedAt);
  });
  it("restores the high score even when it exceeds the scores of surviving adventures",async()=>{
    const api=new LocalGameAPI(memory());
    await api.request("import-saves",{backup:encodeBackup([newGame("Hero")],1234)});
    expect((await api.request("high-score")).data.score).toBe(1234);
  });
  it("rejects broken or future files and leaves stored adventures byte-for-byte intact",async()=>{
    const storage=memory(),api=new LocalGameAPI(storage);await api.request("games",options);
    const before=[...storage.map.entries()];
    const valid=JSON.parse((await api.request("export-saves")).data.backup!);
    for(const backup of ["oops",JSON.stringify({...valid,version:99}),JSON.stringify({...valid,games:[{}]}),JSON.stringify({...valid,games:[{...valid.games[0],tiles:[]}]}),JSON.stringify({...valid,games:[{...valid.games[0],player:{}}]})]) {
      expect((await api.request("import-saves",{backup})).status).toBe(400);
      expect([...storage.map.entries()]).toEqual(before);
    }
  });
  it("reports failed imports without claiming success or changing stored journeys",async()=>{
    const storage=memory(),api=new LocalGameAPI(storage);await api.request("games",options);
    const backup=(await api.request("export-saves")).data.backup!,before=[...storage.map.entries()];
    const failing=new LocalGameAPI({...storage,set:async()=>{throw Error("full");}});
    const result=await failing.request("import-saves",{backup});
    expect(result.status).toBe(503);expect(result.data.imported).toBeUndefined();expect([...storage.map.entries()]).toEqual(before);
  });
});

import {it,expect} from "vitest";
import {newGame} from "../shared/engine";
import {rememberAdventure,readSavedAdventures,adventureStartLabel,SAVED_ADVENTURES_KEY} from "../src/saved-adventures";
function storage(){const entries=new Map<string,string>();return {entries,getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>{entries.set(key,value);}};}
it("remembers multiple named adventures, sorts by start date and deduplicates by ID rather than hero name",()=>{
 const store=storage(),g=newGame("Ada","Warrior","Wind",0,12),first="1".repeat(64),second="2".repeat(64);
 g.startedAt="2026-11-01T12:00:00.000Z";rememberAdventure(first,g,store);
 g.startedAt="2026-11-06T12:00:00.000Z";rememberAdventure(second,g,store);rememberAdventure(second,g,store);
 expect(readSavedAdventures(store)).toEqual([{id:second,heroName:"Ada",startedAt:g.startedAt},{id:first,heroName:"Ada",startedAt:"2026-11-01T12:00:00.000Z"}]);
 expect(store.entries.size).toBe(1);
});
it("keeps legacy adventures visible without inventing a start date",()=>{
 const store=storage(),g=newGame("Older hero","Scout","Wind",0,7);rememberAdventure("3".repeat(64),g,store);
 expect(readSavedAdventures(store)[0]).toEqual({id:"3".repeat(64),heroName:"Older hero"});
 expect(adventureStartLabel(undefined)).toContain("unavailable");expect(adventureStartLabel("invalid")).toContain("unavailable");
 expect(adventureStartLabel("2026-11-06T12:00:00.000Z")).toContain("2026");
});
it("does not overwrite an unreadable adventure index",()=>{
 const store=storage();store.setItem(SAVED_ADVENTURES_KEY,"broken");
 expect(()=>rememberAdventure("4".repeat(64),newGame("Ada","Mage","Wind",0,7),store)).toThrow("not been changed");
 expect(store.getItem(SAVED_ADVENTURES_KEY)).toBe("broken");
});

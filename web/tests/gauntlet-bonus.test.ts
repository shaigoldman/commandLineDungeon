import { describe, expect, it } from "vitest";
import { act, combatAttackStats, makeItem, makeMonster, newGame, syncPassiveStats } from "../shared/engine";
import { gauntletBonus } from "../shared/passive-items";
import { describe as describeItem } from "../shared/catalog";
import type { Game } from "../shared/types";
function scene(names=["Golden Gauntlet"]) {
  const g=newGame("Gauntlet tester","Warrior","Wind",0,91);
  g.monsters=[];g.loot=[];g.pods=[];g.chests=[];g.traps=[];g.secretDoors=[];g.pendingLoot=undefined;g.inventory=names.map(name=>makeItem(g,name));
  g.player.weapons=[];g.player.effects={};g.player.passiveStats={};
  Object.assign(g.player.stats,{Health:80,Power:12,Magic:30,Mana:0,Luck:0,Accuracy:1000,Speed:1000,Armor:0});Object.assign(g.player,{hp:80,x:5,y:5});
  const enemy=makeMonster(g,"Zombie",1);Object.assign(enemy,{hp:500,x:6,y:5});Object.assign(enemy.stats,{Health:500,Power:0,Armor:0,Luck:0,Accuracy:0,Speed:0});g.monsters=[enemy];g.combat=enemy.id;syncPassiveStats(g);return g;
}
function damage(g:Game) {const before=g.monsters[0].hp;const after=act(g,{type:"attack"});return {after,damage:before-after.monsters[0].hp};}
describe("conditional gauntlet Attack bonuses",()=>{
  it("adds ten actual damage at zero mana, including unarmed attacks",()=>{
    const g=scene();expect(g.player.stats.Power).toBe(12);expect(combatAttackStats(g.player).Attack).toBe(22);expect(damage(g).damage).toBe(22);
    const after=act(g,{type:"attack",unarmed:true});expect(after.monsters[0].hp).toBe(478);
  });
  it("applies after Magic Scales instead of being swallowed by higher Magic",()=>{
    const g=scene(["Golden Gauntlet","Magic Scales"]);expect(g.player.stats.Power).toBe(30);expect(combatAttackStats(g.player).Attack).toBe(40);expect(damage(g).damage).toBe(40);
    const dropped=act(g,{type:"drop",id:g.inventory[0].id});expect(combatAttackStats(dropped.player).Attack).toBe(30);
  });
  it("switches off when mana returns and reactivates when mana is spent",()=>{
    let g=scene(["Golden Gauntlet","Magic Scales","Tiny Mana Potion","Mana Channel"]);
    g=act(g,{type:"use",id:g.inventory[2].id});expect(g.player.stats.Mana).toBe(5);expect(combatAttackStats(g.player).Attack).toBe(30);
    g=act(g,{type:"use",id:g.inventory.find(i=>i.kind==="mana-channel")!.id});expect(g.player.stats.Mana).toBe(0);expect(combatAttackStats(g.player).Attack).toBe(40);
    for(let n=0;n<5;n++)syncPassiveStats(g);expect(combatAttackStats(g.player).Attack).toBe(40);
  });
  it("takes effect after the last mana-powered staff attack, on the next attack",()=>{
    let g=scene();g.player.weapons=[makeItem(g,"Fire Staff")];g.player.stats.Mana=2;syncPassiveStats(g);
    const first=damage(g);expect(first.damage).toBe(30);expect(first.after.player.stats.Mana).toBe(0);expect(combatAttackStats(first.after.player).Attack).toBe(22);
    expect(damage(first.after).damage).toBe(22);
  });
  it("migrates old cached Strength bonuses without double counting on reload",()=>{
    const g=scene();g.player.stats.Power=22;g.player.passiveStats={Power:10};delete g.player.attackBonus;
    const loaded=JSON.parse(JSON.stringify(g));syncPassiveStats(loaded);expect(loaded.player.stats.Power).toBe(12);expect(combatAttackStats(loaded.player).Attack).toBe(22);
    syncPassiveStats(loaded);expect(combatAttackStats(loaded.player).Attack).toBe(22);
    const scaled=scene(["Golden Gauntlet","Magic Scales"]);scaled.player.stats.Power=30;scaled.player.passiveStats={Power:18,Magic:0};delete scaled.player.attackBonus;syncPassiveStats(scaled);expect(combatAttackStats(scaled.player).Attack).toBe(40);
  });
  it("Silver Gauntlet increases magical attacks too, and turns off after healing",()=>{
    let g=scene(["Silver Gauntlet","Magic Scales","Tiny Health Potion"]);g.player.stats.Mana=10;g.player.hp=5;g.player.weapons=[makeItem(g,"Fire Staff")];syncPassiveStats(g);
    expect(combatAttackStats(g.player).Attack).toBe(40);expect(g.player.stats.Speed).toBe(1010);expect(damage(g).damage).toBe(40);
    g=act(g,{type:"use",id:g.inventory[2].id});expect(g.player.hp).toBe(10);expect(combatAttackStats(g.player).Attack).toBe(30);expect(g.player.stats.Speed).toBe(1000);
  });
  it("stacks Golden and Silver without corrupting base Strength or Speed",()=>{
    const g=scene(["Golden Gauntlet","Silver Gauntlet","Magic Scales"]);g.player.hp=5;syncPassiveStats(g);expect(damage(g).damage).toBe(50);expect(g.player.stats.Power).toBe(30);expect(g.player.stats.Speed).toBe(1010);
    const removed=act(g,{type:"drop",id:g.inventory[1].id});expect(combatAttackStats(removed.player).Attack).toBe(40);expect(removed.player.stats.Speed).toBe(1000);
  });
  it("applies the same flat bonus to an item-wielding enemy",()=>{
    let g=scene([]);const enemy=g.monsters[0];enemy.className="Dark Hero";enemy.inventory=[makeItem(g,"Golden Gauntlet")];Object.assign(enemy.stats,{Power:5,Mana:0,Accuracy:10000});
    g=act(g,{type:"attack"});expect(g.player.hp).toBe(65);expect(combatAttackStats(g.monsters[0]).Attack).toBe(15);
  });
  it("reports actual activation conditions and corrects legacy descriptions",()=>{
    const g=scene();const i=g.inventory[0];expect(gauntletBonus(g.player,i)?.active).toBe(true);g.player.stats.Mana=1;expect(gauntletBonus(g.player,i)?.active).toBe(false);
    i.description="While carried, +10 Strength at 0 mana.";expect(describeItem(i)).toContain("+10 Attack");expect(describeItem(i)).toContain("automatically");
  });
});

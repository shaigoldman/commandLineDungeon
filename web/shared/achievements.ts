import type { Game } from "./types";

export const ACHIEVEMENTS = [
  { name: "First Blood", description: "Defeat your first enemy." },
  { name: "Dungeon Veteran", description: "Defeat ten enemies in one adventure." },
  { name: "Guardian Slayer", description: "Defeat a floor guardian." },
  { name: "Dungeon Liberator", description: "Rescue a villager." },
  { name: "Another Bite at Life", description: "Survive a fatal hit with a life-saving apple." },
  ...["Warrior", "Knight", "Scout", "Mage"].map(hero => ({
    name: `Dragon Slayer: ${hero}`,
    description: `Defeat Ruthagor as a ${hero}.`,
  })),
  { name: "Into the Depths", description: "Reach floor 6." },
  { name: "Monster Hunter", description: "Defeat 25 enemies in one adventure." },
  { name: "Dungeon Legend", description: "Defeat 50 enemies in one adventure." },
  { name: "Seasoned Adventurer", description: "Reach level 5." },
  { name: "Deep Pockets", description: "Hold 100 gold at once." },
  { name: "Treasure Seeker", description: "Open a treasure chest." },
  { name: "Behind Closed Doors", description: "Unlock a secret door." },
  { name: "Supporting Local Business", description: "Buy an item from a villager." },
  { name: "Gremlin Repellent", description: "Defeat a gremlin." },
  { name: "Afraid of the Dark?", description: "Defeat a shadow." },
  { name: "Robot Recycling", description: "Defeat a robot." },
  { name: "Fairy Tale Ending", description: "Defeat a dark fairy." },
  { name: "Snake Charmer", description: "Defeat a snake." },
  { name: "Here Be Dragons", description: "Defeat a dragon other than Ruthagor." },
  { name: "Bare Knuckle Champion", description: "Defeat an enemy with an unarmed attack." },
  { name: "Critical Acclaim", description: "Land a critical hit." },
  { name: "Not a Scratch", description: "Have armor absorb all damage from an enemy attack." },
  { name: "By a Thread", description: "Survive an enemy attack with exactly 1 health." },
  { name: "Blown Away", description: "Cast Blow." },
  { name: "Make a Friend", description: "Cast Befriend on an enemy." },
  { name: "Bookworm", description: "Cast Study." },
  { name: "Midas Touch", description: "Cast Gild." },
  { name: "Blood for Magic", description: "Cast Mana Drain." },
  { name: "Now You See Me", description: "Cast Teleport." },
  { name: "Playing with Fire", description: "Cast Kindle." },
  { name: "Uninvited Guest", description: "Cast Summon or Dark Summon." },
  { name: "Rope Trick", description: "Use a rope to escape an encounter." },
  { name: "Nuclear Survivor", description: "Survive your own nuke with a Nuke Shield." },
  { name: "What Could Go Wrong?", description: "Drink a Mystery Potion." },
  { name: "More Room for Loot", description: "Use a bag upgrade." },
  { name: "Pocket Alchemist", description: "Use an Alchemy Book or Alchemy Wand." },
  { name: "Forged in the Dungeon", description: "Upgrade a weapon with an Anvil." },
  { name: "Liquid Assets", description: "Use a Mana Pot." },
  { name: "A Dangerous Bargain", description: "Use a Really Greedy Amulet." },
  { name: "Entrepreneur", description: "Sell an item to a villager." },
  { name: "Watch Your Step", description: "Trigger a trap." },
  { name: "Surprise Inside", description: "Open a trapped chest." },
  { name: "The Good Stuff", description: "Open an ultrarare chest." },
  { name: "Deal or No Deal", description: "Complete a bargain with a dungeon character." },
  { name: "Clean Sweep", description: "Clear every ordinary enemy from a floor and earn its boon." },
  { name: "Live to Fight Another Day", description: "Successfully flee an encounter." },
  { name: "Obsidian Obliteration", description: "Break an equipped obsidian weapon or shield." },
  { name: "Obsidian Smith", description: "Use an Anvil to make an obsidian weapon or shield." },
  { name: "Cursed to Death", description: "Die from curse damage." },
  { name: "Curiosity Cursed the Cat", description: "Curse yourself with a cursed item." },
  { name: "Might Beyond Measure", description: "Raise your Power above 100." },
  { name: "Magical Overload", description: "Raise your Magic above 100." },
  { name: "Faster Than Thought", description: "Raise your Speed above 100." },
];

/** Infer only milestones established by the state of an existing adventure. */
export function achievementsFromGame(game: Game): string[] {
  const names = (game.achievements || []).map(a => a.name);
  if ((game.status === "won" || game.floor >= 3) && ["Warrior", "Knight", "Scout", "Mage"].includes(game.player.className))
    names.push(`Dragon Slayer: ${game.player.className}`);
  if (game.floor >= 5) names.push("Into the Depths");
  if ((game.kills || 0) >= 25) names.push("Monster Hunter");
  if ((game.kills || 0) >= 50) names.push("Dungeon Legend");
  if (game.player.level >= 5) names.push("Seasoned Adventurer");
  if ((game.player.gold || 0) >= 100) names.push("Deep Pockets");
  if (game.chests?.some(c => c.opened)) names.push("Treasure Seeker");
  if (game.secretDoors?.some(d => d.unlocked)) names.push("Behind Closed Doors");
  if (game.death?.source === "Curse") names.push("Cursed to Death");
  if (game.player.stats.Power > 100) names.push("Might Beyond Measure");
  if (game.player.stats.Magic > 100) names.push("Magical Overload");
  if (game.player.stats.Speed > 100) names.push("Faster Than Thought");
  return names;
}

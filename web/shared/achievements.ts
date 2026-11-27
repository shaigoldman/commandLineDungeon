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
  return names;
}

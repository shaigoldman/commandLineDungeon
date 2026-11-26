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
];

/** Infer only milestones established by the state of an existing adventure. */
export function achievementsFromGame(game: Game): string[] {
  const names = (game.achievements || []).map(a => a.name);
  if ((game.status === "won" || game.floor >= 3) && ["Warrior", "Knight", "Scout", "Mage"].includes(game.player.className))
    names.push(`Dragon Slayer: ${game.player.className}`);
  if (game.floor >= 5) names.push("Into the Depths");
  return names;
}

import type { Game } from "./types";

/** The game records the fatal hit before clearing combat, so the epitaph is exact. */
export function deathStory(g: Game) {
  const death = g.death;
  if (!death) return {
    cause: "The dungeon claimed you",
    context: `Your journey ended on floor ${g.floor + 1}, turn ${g.turn}.`,
    flavor: "The stones will carry your story farther than your feet could.",
  };
  const { source, attacker, damage, floor, turn } = death;
  const cause = source === "Attack" ? `Slain by ${attacker || "an enemy"}`
    : source === "Explosion" ? attacker ? `Caught in ${attacker}'s explosion` : "Caught in an explosion"
    : source === "Poison" ? attacker ? `Poison from ${attacker} claimed you` : "Poison claimed you"
    : source === "Curse" ? attacker ? `A curse from ${attacker} claimed you` : "The curse claimed you"
    : source === "Fire" ? "Fire claimed you"
    : source === "Seismic" ? "Your Seismic Shocker claimed you"
    : source === "Potion" ? "A potion turned against you"
    : source === "Nuke" ? "Your Nuke claimed you"
    : source === "Deal" ? "A bargain claimed you"
    : `${source} claimed you`;
  const flavor = source === "Attack" ? "The halls grow quiet. Somewhere ahead, a door waits for the next traveler."
    : source === "Poison" ? "A green stain fades from the stones, but the path remembers your footsteps."
    : source === "Curse" ? "The whisper that followed you has finally learned your name."
    : source === "Explosion" || source === "Seismic" || source === "Nuke" ? "For a moment, the dungeon was brighter than day."
    : source === "Potion" ? "Even the smallest vial can hold a cruel surprise."
    : "The stones will carry your story farther than your feet could.";
  return {
    cause,
    context: `The final blow dealt ${damage} damage on floor ${floor}, turn ${turn}.`,
    flavor,
  };
}

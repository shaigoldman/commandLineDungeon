import type { Item, Stats } from "./types";
export const classes: Record<string, Stats> = {
  Warrior: {
    Health: 20,
    Power: 12,
    Luck: 10,
    Accuracy: 85,
    Speed: 3,
    Magic: 5,
  },
  Knight: {
    Health: 30,
    Power: 8,
    Luck: 1,
    Accuracy: 85,
    Speed: 1,
    Magic: 5,
    Armor: 1,
  },
  Scout: { Health: 15, Power: 6, Luck: 35, Accuracy: 90, Speed: 12, Magic: 5 },
  Mage: { Health: 17, Power: 2, Luck: 8, Accuracy: 80, Speed: 2, Magic: 10 },
  Over9000: {
    Health: 9001,
    Power: 0,
    Luck: 9001,
    Accuracy: 9001,
    Speed: 9001,
    Magic: 9001,
    Armor: 9001,
  },
  D: { Health: 1, Power: 1, Luck: 1, Accuracy: 1, Speed: 1, Magic: 1 },
};
export const bonuses: Record<string, string> = {
  Warrior: "Power",
  Knight: "Health",
  Scout: "Speed",
  Mage: "Magic",
  Over9000: "Power",
  D: "Power",
};
export const monsterBase: Record<string, Stats> = {
  Zombie: { Health: 7, Power: 4, Luck: 0, Accuracy: 65, Speed: 1, Magic: 1 },
  Spider: { Health: 5, Power: 2, Luck: 0, Accuracy: 85, Speed: 5, Magic: 4 },
  Snake: { Health: 3, Power: 1, Luck: 0, Accuracy: 75, Speed: 3, Magic: 2 },
  Parasite: {
    Health: 10,
    Power: 1,
    Luck: 0,
    Accuracy: 65,
    Speed: 1,
    Magic: 10,
  },
  Golem: {
    Health: 20,
    Power: 20,
    Luck: 10,
    Accuracy: 65,
    Speed: 1,
    Magic: 15,
    Armor: 1,
  },
  Dragon: {
    Health: 200,
    Power: 50,
    Luck: 0,
    Accuracy: 150,
    Speed: 40,
    Magic: 20,
  },
  Chieftan: { Health: 3, Power: 9, Luck: 0, Accuracy: 80, Speed: 9, Magic: 10 },
};
export const growth: Record<string, Stats> = {
  Zombie: { Health: 4.5, Power: 6, Accuracy: 1.8, Speed: 1 / 3 },
  Spider: { Health: 5.3, Power: 2.2, Accuracy: 2.4, Speed: 4 },
  Snake: { Health: 6, Power: 4, Accuracy: 2, Speed: 2 },
  Parasite: { Health: 7, Power: 3, Accuracy: 1.7, Speed: 1.5 },
  Golem: { Health: 7, Power: 4, Accuracy: 2, Speed: 1.8, Armor: 2 },
};
export interface Spell {
  name: string;
  element: string;
  cost: number;
  req: number;
  when: "combat" | "peace" | "any";
  description: string;
}
export const spells: Spell[] = [
  {
    name: "Teleport",
    element: "Wind",
    cost: 1,
    req: 1,
    when: "peace",
    description: "Teleport to a random open tile.",
  },
  {
    name: "Gust",
    element: "Wind",
    cost: 5,
    req: 8,
    when: "combat",
    description: "Deal 10 damage, reduced by armor.",
  },
  {
    name: "Healing Winds",
    element: "Wind",
    cost: 8,
    req: 15,
    when: "any",
    description: "Restore half maximum HP and clear all effects.",
  },
  {
    name: "Light",
    element: "Fire",
    cost: 1,
    req: 1,
    when: "peace",
    description: "Permanently illuminate a random area.",
  },
  {
    name: "Burn",
    element: "Fire",
    cost: 7,
    req: 10,
    when: "combat",
    description: "Deal Magic damage, up to 40, reduced by armor.",
  },
  {
    name: "Annihilate",
    element: "Fire",
    cost: 10,
    req: 80,
    when: "combat",
    description: "Kill an enemy. Dragons counter this spell.",
  },
  {
    name: "Cleanse",
    element: "Water",
    cost: 4,
    req: 5,
    when: "peace",
    description: "Remove all status effects.",
  },
  {
    name: "Heal",
    element: "Water",
    cost: 7,
    req: 15,
    when: "peace",
    description: "Restore HP equal to Magic.",
  },
  {
    name: "Grow",
    element: "Water",
    cost: 10,
    req: 60,
    when: "peace",
    description: "Permanently add 10 maximum HP.",
  },
  {
    name: "Mystery",
    element: "Mystery",
    cost: 5,
    req: 1,
    when: "peace",
    description: "Conjure an item nearby; 25% chance to backfire.",
  },
];
export const itemDefinitions: [string, string, number, number, string?][] = [
  ["Tiny Health Potion", "heal", 1, 5],
  ["Small Health Potion", "heal", 1, 10],
  ["Medium Health Potion", "heal", 3, 15],
  ["Large Health Potion", "heal", 7, 30],
  ["Huge Health Potion", "heal", 8, 50],
  ["Giant Health Potion", "heal", 9, 100],
  ["Mana Potion", "mana", 2, 10],
  ["Poison Antidote", "antidote", 3, 0],
  ["Escape Rope", "rope", 3, 0],
  ["Throwing Knife", "projectile", 2, 5],
  ["Javelin", "projectile", 4, 10],
  ["Bomb", "projectile", 9, 20],
  ["Ballistic Missile", "projectile", 10, 100],
  ["Armor", "armor", 4, 1],
  ["Nuke", "nuke", 11, 0],
  ["Nuke Shield", "shield", 9, 0],
  ["Teleporter", "teleport", 5, 0],
  ["Night Vision Goggles", "vision", 8, 0],
  ["Binoculars", "sight", 6, 1],
  ["Extra Hand", "hand", 4, 1],
  ["Bigger Bag", "bag", 4, 8],
  ["Huge Bag", "bag", 8, 10],
  ["Max Health Boost", "stat", 4, 4, "Health"],
  ["Power Boost", "stat", 4, 2, "Power"],
  ["Speed Boost", "stat", 4, 2, "Speed"],
  ["Luck Boost", "stat", 4, 5, "Luck"],
  ["Accuracy Boost", "stat", 4, 5, "Accuracy"],
  ["Magic Boost", "stat", 4, 5, "Magic"],
  ["Attack Booster", "boost", 2, 0, "Attack"],
  ["Speed Booster", "boost", 2, 0, "Speed"],
  ["Luck Booster", "boost", 2, 0, "Luck"],
  ["Accuracy Booster", "boost", 2, 0, "Accuracy"],
  ["Sword", "weapon", 3, 3],
  ["Spear", "weapon", 3, 4],
  ["Axe", "weapon", 5, 6],
  ["Magic Staff", "tome", 4, 0],
];
export function describe(i: Item) {
  if (i.kind === "weapon")
    return `Attack +${i.attack} · Luck +${i.luck} · Weight ${i.weight} · Power required ${(i.weight || 0) * 2} · ${i.uses}/${i.maxUses} uses`;
  if (i.kind === "tome")
    return `${i.element} magic · Attack +${i.attack} · Luck +${i.luck} · Basic attack costs 2 mana`;
  return i.description;
}

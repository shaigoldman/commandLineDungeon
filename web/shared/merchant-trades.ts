import type { Actor, Item } from "./types";

export interface TradeSpecialty {
  label: string;
  bio: string;
  pitch: string;
  kinds: string[];
  wanted: string[];
  elements?: string[];
  poisonWeapons?: boolean;
}

/** Names, rather than a fresh random roll, determine a survivor's trade. */
export const villagerTrades: Record<string, TradeSpecialty> = {
  "Mabel Crumb": {
    label: "Provisions & recovery",
    bio: "Mabel supplies shelter kitchens with restorative provisions and saves the best sweets for exhausted travelers.",
    pitch: "A proper meal gets people back on their feet. I stock restoratives and sweets, and pay extra for more.",
    kinds: ["heal", "candy", "energy-potion", "health-pot", "golden-apple", "diamond-apple"],
    wanted: ["Tiny Health Potion", "Energy Potion", "Rare Candy", "Golden Apple"],
  },
  "Pip Bellwether": {
    label: "Wind & travel",
    bio: "Pip uses his bell routes to guide survivors, collecting Wind staves, escape gear and anything that makes a journey safer.",
    pitch: "The bells once told people when to go home. Now I trade Wind magic and travel gear to help them get there.",
    kinds: ["rope", "teleport", "quickfoot", "speedy-boots", "ghost-boots", "stealth", "sight", "vision"],
    elements: ["Wind"],
    wanted: ["Wind Staff", "Escape Rope", "Teleporter", "Emerald Staff"],
  },
  "Orla Soot": {
    label: "Magic & mana",
    bio: "Orla carries on her household's mirror craft by trading staves and mana supplies while studying the engine's magical traces.",
    pitch: "Mirror work taught me to recognize a sound enchantment. I stock staves and mana supplies, and pay extra for them.",
    kinds: ["tome", "mana", "mana-pool", "mana-stream", "mana-pot", "mana-battery", "mana-star", "mana-link", "mana-leech", "mana-rock", "mana-shard", "mana-gem", "mana-diamond", "mana-pod", "magic-book"],
    wanted: ["Tiny Mana Potion", "Mana Battery", "Sapphire Staff", "Dark Staff"],
  },
  "Bram Pickle": {
    label: "Trade & treasure",
    bio: "Bram weighs portable valuables and equips small traders, keeping honest accounts of every purse, jewel and costly bargain.",
    pitch: "A fair weight is worth more than an imperial promise. I trade valuables, bags and gold-making relics.",
    kinds: ["jewel", "crown", "bag", "infinite-bag", "greedy-amulet", "thief-gloves", "gold-chalice", "mana-channel", "cursed-gold"],
    wanted: ["Greedy Amulet", "Thief's Gloves", "Gold Chalice", "Really Greedy Amulet"],
  },
  "Tansy Bolt": {
    label: "Tools & equipment",
    bio: "Tansy repairs survivors' equipment with recovered workshop tools, upgrade relics and salvaged energy mechanisms.",
    pitch: "Good equipment deserves maintenance. Bring me workshop tools, upgrade relics and energy mechanisms; I pay for useful parts.",
    kinds: ["anvil", "blade-shard", "sharpening-stone", "skill-book", "magic-scabbard", "gentle-grip", "energy-harness", "energy-generator", "energy-belt", "energy-armor", "hand", "reusable-key"],
    wanted: ["Anvil", "Blade Shard", "Energy Harness", "Sharpening Stone"],
  },
  "Hob Nettle": {
    label: "Poison & remedies",
    poisonWeapons: true,
    bio: "Hob's medicinal garden supplies antidotes and careful doses of poison; he also restores poison-coated blades for hunters.",
    pitch: "The same leaf can mend you or ruin your afternoon. I trade antidotes, poisons and poison-coated weapons.",
    kinds: ["antidote", "immunity", "poison-potion", "mixing-potion", "energy-potion", "heal", "bad-candy"],
    wanted: ["Poison Antidote", "Poison Potion", "Poison Sword", "Poison Antibody"],
  },
  "Dora Teaspoon": {
    label: "Restoration & supplies",
    bio: "Dora equips makeshift guest kitchens with dependable healing vessels, carry space and the keys needed to reach them.",
    pitch: "You cannot welcome guests with an empty cupboard. I keep healing vessels, bags and keys, and pay extra for supplies.",
    kinds: ["heal", "reusable-heal", "health-pot", "mana-link", "bag", "infinite-bag", "key", "energy-belt", "golden-apple", "diamond-apple"],
    wanted: ["Health Pot", "Reusable Tiny Potion", "Mana Link", "Standard Key"],
  },
  "Fenwick Moss": {
    label: "Arms & armor",
    bio: "Fenwick removes unwanted ownership marks from recovered arms, then repairs weapons and armor for people guarding the shelters.",
    pitch: "A blade need not keep its old owner's name. I trade arms and armor, and pay extra for serviceable fighting gear.",
    kinds: ["weapon", "armor", "projectile", "golden-gauntlet", "silver-gauntlet", "quickfoot", "shield"],
    wanted: ["Iron Sword", "Iron Shield", "Steel Spear", "Bloodthirsty Dagger"],
  },
  "Ada Candle": {
    label: "Stats & growth",
    bio: "Ada measures charms and training aids as carefully as rations, trading items whose benefits can be counted and checked.",
    pitch: "Write the cost beside the benefit. I stock charms, stat boosts and training aids, and pay extra for measurable improvements.",
    kinds: ["stat", "boost", "jewel", "crown", "double", "charm", "mixing-potion", "mana-pool", "mana-battery", "critical-diamond"],
    wanted: ["Mana Battery", "Mixing Potion", "Mana Pool", "Mana Spring"],
  },
  "Nell Thread": {
    label: "Wards & cleansing",
    bio: "Nell's undertaking craft includes remedies for harmful bindings; her counter offers cleansing relics and protection for the living.",
    pitch: "Some things need mending before they become a shroud. I trade cleansing remedies and protective relics.",
    kinds: ["antidote", "immunity", "cleanser", "shield", "golden-apple", "diamond-apple", "lucky-necklace", "lucky-amulet", "invisibility", "heal"],
    wanted: ["Poison Antidote", "Cleanser", "Lucky Necklace", "Nuke Shield"],
  },
  "Bix Turnip": {
    label: "Alchemy & transformation",
    bio: "Bix apprentices with salvage alchemists, exchanging catalysts and transformation relics while testing what his impossible harvest can become.",
    pitch: "My turnip has possibilities. I stock alchemy tools and transformation potions, and pay extra for promising catalysts.",
    kinds: ["alchemy-book", "alchemy-wand", "alchemy-nuke", "mixing-potion", "mystery-potion", "spiked-potion", "super-potion", "magic-wand", "cleanser", "energy-harness", "charm"],
    wanted: ["Alchemy Book", "Mixing Potion", "Alchemy Wand", "Mystery Potion"],
  },
  "Wren Lastlight": {
    label: "Secrets & forbidden magic",
    bio: "Wren exchanges survey charms, hidden-route instruments and Dark staves while comparing fragments of the engine's inaccessible passages.",
    pitch: "A locked room can still leave a trace. I trade secret-finding tools and Dark magic, and pay extra for either.",
    kinds: ["key", "reusable-key", "stairfinder", "vision", "sight", "charm", "ghost-boots"],
    elements: ["Dark"],
    wanted: ["Rare Key", "Stairfinder", "Dark Staff", "Onyx Staff"],
  },
  "King Niblet the Underprepared": {
    label: "Royal treasures",
    bio: "Niblet maintains a broad royal bazaar but reserves his strongest interest for jewels, crowns and lucky treasures fit for his improvised court.",
    pitch: "The royal bazaar welcomes every trade. Jewels, crowns and lucky treasures receive particular royal consideration.",
    kinds: ["jewel", "crown", "lucky-amulet", "lucky-necklace", "golden-apple", "diamond-apple", "golden-gauntlet", "silver-gauntlet"],
    wanted: ["Lucky Amulet", "Lucky Necklace", "Golden Apple", "Diamond Apple"],
  },
};

export function merchantSpecialty(merchant: Pick<Actor, "name">): TradeSpecialty | undefined {
  return Object.hasOwn(villagerTrades, merchant.name) ? villagerTrades[merchant.name] : undefined;
}

export function specialtyItem(profile: TradeSpecialty | undefined, item: Pick<Item, "name" | "kind" | "element">): boolean {
  if (!profile) return false;
  if (profile.kinds.includes(item.kind)) return true;
  if (profile.poisonWeapons && item.kind === "weapon" && item.name.startsWith("Poison ")) return true;
  if (item.kind !== "tome") return false;
  const element = item.element || ({ "Emerald Staff": "Wind", "Dark Staff": "Dark", "Onyx Staff": "Dark" } as Record<string,string>)[item.name];
  return !!element && !!profile.elements?.includes(element);
}

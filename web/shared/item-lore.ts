import type { Item } from "./types";
export function rarityInfo(rarity: number) {
  return rarity >= 9
    ? { name: "Ultrarare", className: "ultra" }
    : rarity >= 6
      ? { name: "Rare", className: "rare" }
      : rarity >= 3
        ? { name: "Uncommon", className: "uncommon" }
        : { name: "Common", className: "common" };
}
/** Three authored lore variations per item, selected by persistent item identity. */
export function loreOptions(item: Item): string[] {
  const n = item.name;
  const specific: Record<string, string[]> = {
    "Pot of Gold": [
      "Gremlins say the moon engine minted these from stolen sunsets.",
      "“One pot per lifetime. I have had several lifetimes.” — Pip Bellwether",
      "A tiny hoard with a large opinion of its own value.",
    ],
    seismic: [
      "“That is not a doorbell.” — Tansy Bolt, just before that day",
      "The observatory used these to stir the moon. The moon objected.",
      "Its maker engraved a safety warning on the inside.",
    ],
    immunity: [
      "Orla claims the first antibodies grew in a kettle that refused to boil.",
      "“Poison is negotiable. Ghosts are not.” — Nell Thread",
      "A little green promise, bottled before the thirteenth bell.",
    ],
    gold: [
      "King Niblet insists the royal face is on both sides. Neither side agrees.",
      "“Gold survived that day. My pension did not.” — Ada Candle",
      "Debts changed shape after that day. Coins proved less obliging.",
    ],
    key: [
      "Dora swears every key in the dungeon once opened her pantry.",
      "“If it hums, do not put it in your mouth.” — Pip Bellwether",
      "The teeth point toward a lock that remembers sunlight.",
    ],
    candy: [
      "“We put the lessons inside the sweets. Attendance improved.” — Mabel Crumb",
      "Astronomers chewed these while calculating how badly the sun was sneezing.",
      "It tastes faintly of strawberries, chalk, and a useful mistake.",
    ],
    "summon-stone": [
      "“I asked for help. It brought my landlord.” — Bram Pickle",
      "A pebble from the moon engine. Something on the other side is listening.",
      "Every crack is a farewell; every glow is an introduction.",
    ],
    double: [
      "The emperor ordered twice the power. Nobody doubled the instruction manual.",
      "“Use one mirror. Two mirrors start a committee.” — Orla Soot",
      "A reflection from before that event, looking decidedly stronger.",
    ],
    heal: [
      "Mabel still calls it soup. The apothecaries have stopped arguing.",
      "“If it glows, it might be dinner.” — Hob Nettle",
      "Bottled sunlight from a morning the dungeon has not reached yet.",
    ],
    antidote: [
      "Nell Thread stitched the recipe into every undertaker’s apron.",
      "“For snakebites, ghosts, and regrettable dinner invitations.” — Orla Soot",
      "It smells like an apology made out of nettles.",
    ],
    weapon: [
      "“A fine tool for opening stubborn conversations.” — Chief Twelve Hats",
      "The blade remembers an army. The handle remembers a gardener.",
      "Someone scratched “return to Fenwick” beneath the old maker’s mark.",
    ],
    tome: [
      "The moon engine sang in three voices. This staff remembers one.",
      "“Point away from the curtains.” — Tansy Bolt",
      "A royal astronomer used it as a walking stick. His walks were spectacular.",
    ],
  };
  return (
    specific[item.name] || specific[item.kind] || [
      "“I remember this from before the stairs went wrong.” — Dora Teaspoon",
      "Found beneath an observatory that insists it was always a dungeon.",
      "Bix Turnip believes it is the missing part of something important.",
    ]
  ).map((text, i) =>
    i === 2 ? `${n}: ${text.charAt(0).toLowerCase() + text.slice(1)}` : text,
  );
}
export function itemLore(item: Item) {
  let h = 0;
  for (const c of item.id) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  return loreOptions(item)[h % 3];
}

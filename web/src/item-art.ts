import type { Item } from "../shared/types";
/** Original pixel icons, shared verbatim by the dungeon and all item menus. */
export function itemArtKey(item: Pick<Item, "kind" | "name" | "element">) {
  const name = item.name.toLowerCase();
  if (item.kind === "weapon") {
    const shape = name.includes("broadsword")
      ? "broadsword"
      : name.includes("shield")
        ? "shield"
      : name.includes("axe")
        ? "axe"
        : name.includes("spear")
          ? "spear"
          : "sword";
    const material =
      ["fragile", "iron", "steel", "lucky", "magic", "obsidian"].find((m) =>
        name.startsWith(m + " "),
      ) || (name.includes("awathon") ? "relic" : "iron");
    return shape + ":" + material;
  }
  if (item.kind === "projectile")
    return name.includes("handcuffs")
      ? "handcuffs"
      : name.includes("missile")
      ? "missile"
      : name.includes("bomb")
        ? "bomb"
        : name.includes("boomerang")
          ? "boomerang"
        : name.includes("javelin")
          ? "javelin"
          : "knife";
  if (item.kind === "tome") return "staff-" + (item.element || "Mystery");
  if (item.kind === "candy") return "candy-" + item.name;
  if (item.kind === "double") return "double-" + item.name.split(" ")[0];
  if (item.kind === "gold" || item.kind === "key" || item.kind === "cursed-gold")
    return (item.kind === "cursed-gold" ? "gold" : item.kind) + "-" + item.name;
  if (item.kind === "reusable-key") return name.includes("door") ? "key-Rare Key" : "key-Standard Key";
  if (["mystery-potion", "reusable-heal", "super-potion", "poison-potion", "health-pot", "spiked-potion", "cursed-potion"].includes(item.kind)) return "heal";
  if (["mana-rock", "mana-shard", "mana-gem", "mana-diamond", "mana-pod", "health-drain"].includes(item.kind)) return "mana";
  if (["charm", "magic-scales", "infinite-bag", "invisibility", "stealth", "speedy-boots"].includes(item.kind)) return "armor";
  if (["stairfinder", "energy-magnet", "energy-generator", "item-magnet"].includes(item.kind)) return "boost";
  if (["mana-star", "magic-book", "cleanser", "bad-candy", "critical-star", "cursed-candy"].includes(item.kind)) return "candy-" + item.name;
  if (item.kind === "jewel" || item.kind === "crown") return item.kind + "-" + item.name;
  if (item.kind === "hard-candy") return "candy-Hard Candy";
  if (item.kind === "alchemy-book") return "skill-book";
  if (["alchemy-wand", "magic-wand"].includes(item.kind)) return "staff-Mystery";
  if (item.kind === "mana-channel") return "mana";
  if (item.kind === "energy-harness") return "boost";
  if (["magic-scabbard", "greedy-amulet", "gold-chalice"].includes(item.kind)) return item.kind;
  if (item.kind === "gentle-grip") return name.startsWith("really") ? "grip-rare" : "grip";
  if (["sharpening-stone", "anvil", "blade-shard", "skill-book"].includes(item.kind)) return item.kind;
  return item.kind;
}
export function itemCanvas(
  item: Pick<Item, "kind" | "name" | "element">,
  scale = 2,
) {
  const c = document.createElement("canvas");
  c.width = c.height = 32 * scale;
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false;
  const r = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const key = itemArtKey(item),
    [shape, material] = key.split(":");
  const metal: Record<string, string[]> = {
    fragile: ["#a99c83", "#d8c9a2", "#977755"],
    iron: ["#a4bdc9", "#e1e8dc", "#c49e62"],
    steel: ["#8dbdd6", "#effaff", "#c9cbd1"],
    lucky: ["#e2b75d", "#fff0ad", "#7fbd9a"],
    magic: ["#9e8dd6", "#eee2ff", "#d9be7f"],
    obsidian: ["#544769", "#b89ed0", "#b56887"],
    relic: ["#e9d5a0", "#ffffd7", "#e1a55b"],
  };
  const [steel, shine, gold] = metal[material] || [
    "#a4c5cf",
    "#f1f3d5",
    "#e4bd72",
  ];
  const dark = "#17202e",
    brown = material === "obsidian" ? "#57364e" : "#8e5b3e";
  const blade = (short = false) => {
    const length = short ? 12 : 19;
    for (let n = 0; n < length; n++) r(7 + n, 25 - n, 4, 4, dark);
    for (let n = 0; n < length; n++) r(8 + n, 25 - n, 2, 2, steel);
    for (let n = 0; n < length; n++) r(9 + n, 25 - n, 1, 1, shine);
    r(4, 26, 5, 3, brown);
    r(5, 25, 3, 1, gold);
    r(7, 22, 3, 7, gold);
    r(5, 24, 7, 2, gold);
  };
  if (key === "gold-chalice") {
    r(5, 5, 22, 4, dark); r(8, 9, 16, 13, dark); r(10, 10, 12, 11, gold);
    r(12, 21, 8, 5, gold); r(7, 26, 18, 3, dark); r(9, 26, 14, 2, shine);
    r(13, 12, 6, 5, "#f2dc8e");
  } else if (key === "greedy-amulet") {
    r(7, 4, 18, 4, gold); r(5, 8, 5, 12, gold); r(22, 8, 5, 12, gold);
    r(9, 17, 14, 12, dark); r(11, 19, 10, 8, "#d9af65");
    r(14, 21, 4, 4, "#7ab4a2");
  } else if (key === "magic-scabbard") {
    for (let n = 0; n < 19; n++) r(7 + n, 25 - n, 5, 5, dark);
    for (let n = 0; n < 19; n++) r(9 + n, 25 - n, 2, 3, "#896ac1");
    r(4, 24, 10, 4, gold); r(12, 16, 4, 5, "#9bdfd3");
  } else if (shape === "shield") {
    r(5, 4, 22, 18, dark); r(7, 6, 18, 17, steel);
    r(9, 8, 14, 17, gold); r(11, 8, 10, 15, steel);
    r(10, 22, 12, 6, dark); r(13, 23, 6, 4, steel);
    r(14, 9, 4, 13, shine); r(10, 14, 12, 3, gold);
  } else if (key === "handcuffs") {
    for (const x of [4, 20]) { r(x, 8, 9, 14, dark); r(x + 2, 10, 5, 10, steel); r(x + 3, 12, 3, 6, dark); }
    r(12, 14, 9, 3, steel); r(15, 12, 3, 7, gold);
  } else if (key.startsWith("jewel") || key.startsWith("crown")) {
    const gem = key.includes("Magic") ? "#b794dd" : key.includes("Luck") ? "#9bd09d" : "#e9b977";
    if (key.startsWith("crown")) { r(5, 14, 22, 13, dark); r(7, 16, 18, 9, gold); r(5, 7, 5, 10, gold); r(13, 4, 6, 13, gold); r(22, 7, 5, 10, gold); }
    else { r(10, 4, 12, 24, dark); r(12, 6, 8, 20, gold); }
    r(13, 15, 6, 6, gem); r(15, 16, 2, 3, shine);
  } else if (key === "anvil") {
    r(8, 5, 16, 5, dark); r(5, 9, 22, 7, steel); r(3, 11, 7, 4, shine);
    r(13, 15, 7, 10, dark); r(14, 16, 5, 8, steel);
    r(6, 24, 20, 5, dark); r(8, 25, 16, 3, gold);
  } else if (key === "blade-shard") {
    r(18, 3, 6, 6, shine); r(15, 9, 7, 9, steel); r(12, 17, 6, 7, steel);
    r(7, 23, 9, 4, gold); r(10, 25, 3, 5, brown);
    r(22, 8, 3, 3, "#86dfe8"); r(7, 13, 3, 3, "#86dfe8");
  } else if (key === "sharpening-stone") {
    r(5, 12, 22, 14, dark); r(7, 13, 18, 11, "#788b92");
    r(10, 14, 12, 3, shine); r(9, 20, 14, 2, gold);
    r(20, 5, 4, 6, steel); r(17, 10, 4, 6, shine);
  } else if (key === "skill-book") {
    r(6, 5, 21, 24, dark); r(8, 7, 17, 20, "#65508a");
    r(10, 8, 2, 19, gold); r(14, 11, 8, 2, shine); r(17, 9, 2, 7, shine);
    r(15, 20, 8, 2, gold); r(17, 23, 5, 2, gold);
  } else if (key.startsWith("grip")) {
    const glove = key === "grip-rare" ? "#bb92dc" : "#a7c69d";
    r(8, 9, 17, 16, dark); r(10, 10, 13, 14, glove);
    r(7, 3, 4, 13, glove); r(12, 2, 4, 12, glove);
    r(17, 3, 4, 12, glove); r(22, 6, 4, 12, glove);
    r(10, 22, 14, 7, gold); r(13, 24, 8, 3, brown);
  } else if (["heal", "mana", "antidote", "stat", "boost"].includes(key)) {
    const liquid =
      key === "heal"
        ? "#e67578"
        : key === "mana"
          ? "#6dbce4"
          : key === "antidote"
            ? "#83c87d"
            : key === "stat"
              ? "#e7bf65"
              : "#b595e5";
    r(12, 3, 8, 4, dark);
    r(13, 3, 6, 3, brown);
    r(14, 3, 4, 1, gold);
    r(12, 7, 8, 6, dark);
    r(14, 7, 4, 6, steel);
    r(9, 12, 14, 3, dark);
    r(6, 15, 20, 11, dark);
    r(9, 26, 14, 3, dark);
    r(8, 16, 16, 10, steel);
    r(10, 14, 12, 13, liquid);
    r(9, 17, 2, 7, shine);
    r(12, 15, 8, 1, "#fff0cf");
    r(19, 19, 3, 6, "#526776");
    r(10, 27, 11, 1, gold);
    if (key === "stat" || key === "boost") {
      r(15, 18, 2, 7, shine);
      r(12, 21, 8, 2, shine);
    }
  } else if (key === "boomerang") {
    r(5, 6, 7, 21, dark); r(9, 21, 17, 7, dark);
    r(7, 7, 4, 18, gold); r(11, 23, 14, 4, gold);
    r(8, 8, 2, 10, shine); r(18, 24, 5, 2, shine);
  } else if (shape === "sword" || shape === "broadsword" || key === "knife") {
    blade(key === "knife");
    if (shape === "broadsword")
      for (let n = 0; n < 16; n++) {
        r(7 + n, 23 - n, 3, 3, steel);
        r(8 + n, 23 - n, 1, 1, shine);
      }
    if (material === "obsidian")
      for (let n = 0; n < 5; n++) r(13 + n * 3, 23 - n * 3, 3, 1, gold);
    if (material === "fragile") {
      r(15, 17, 2, 2, dark);
      r(22, 12, 2, 2, dark);
    }
    if (material === "magic" || material === "relic") {
      r(18, 15, 3, 1, "#8ef0e5");
      r(19, 14, 1, 3, "#8ef0e5");
      r(4, 27, 3, 3, "#a3e5d8");
    }
    if (material === "lucky") {
      r(4, 26, 4, 4, gold);
      r(5, 27, 2, 2, "#86e0ae");
    }
  } else if (shape === "spear" || key === "javelin") {
    for (let n = 0; n < 22; n++) r(4 + n, 27 - n, 2, 2, brown);
    for (let n = 0; n < 8; n++) r(21 + n, 10 - n, 3, 3, dark);
    for (let n = 0; n < 8; n++) r(22 + n, 10 - n, 2, 2, steel);
    r(22, 9, 2, 2, shine);
    r(20, 11, 3, 2, gold);
    if (shape === "spear") {
      r(18, 11, 3, 3, gold);
      r(23, 14, 4, 2, gold);
      r(24, 16, 2, 4, brown);
    }
    if (material === "obsidian") {
      r(20, 6, 2, 4, steel);
      r(26, 10, 3, 2, gold);
    }
  } else if (shape === "axe") {
    for (let n = 0; n < 23; n++) r(4 + n, 27 - n, 3, 3, brown);
    r(17, 5, 10, 13, dark);
    r(13, 8, 15, 7, dark);
    r(17, 6, 9, 10, steel);
    r(14, 9, 12, 5, steel);
    r(14, 9, 2, 5, shine);
    r(17, 6, 2, 3, shine);
    r(20, 10, 4, 4, gold);
    if (material === "obsidian" || material === "relic") {
      r(19, 2, 7, 4, dark);
      r(20, 3, 5, 3, steel);
      r(10, 9, 4, 5, steel);
    }
    if (material === "magic") {
      r(17, 10, 2, 5, "#9fe6df");
      r(15, 12, 6, 1, "#9fe6df");
    }
    if (material === "lucky") {
      r(20, 11, 2, 2, "#87dfaa");
      r(6, 26, 3, 2, gold);
    }
  } else if (key.startsWith("staff-")) {
    r(14, 10, 4, 21, dark);
    r(15, 10, 2, 21, brown);
    r(15, 12, 1, 18, gold);
    const gem =
      item.element === "Fire"
        ? "#ed9770"
        : item.element === "Water"
          ? "#79bde6"
          : item.element === "Wind"
            ? "#8de0c6"
            : "#c3a2e8";
    r(11, 3, 10, 9, dark);
    r(9, 5, 14, 5, dark);
    r(12, 3, 8, 8, gold);
    r(10, 6, 12, 3, gold);
    r(13, 2, 6, 10, gem);
    r(14, 3, 2, 4, shine);
    r(12, 12, 8, 2, gold);
    if (item.element === "Fire") {
      r(10, 4, 2, 6, "#dc7055");
      r(18, 1, 3, 6, "#ee9e59");
      r(14, 0, 2, 4, "#ffe3a3");
    } else if (item.element === "Water") {
      r(8, 1, 2, 9, steel);
      r(22, 1, 2, 9, steel);
      r(10, 8, 12, 2, "#7ecde6");
    } else if (item.element === "Wind") {
      r(5, 5, 6, 2, "#9cdec9");
      r(7, 7, 6, 2, "#d6f4d5");
      r(21, 5, 6, 2, "#9cdec9");
      r(19, 7, 6, 2, "#d6f4d5");
    } else {
      r(9, 1, 3, 7, "#cbb3eb");
      r(10, 0, 7, 2, "#e8d4b9");
      r(11, 8, 7, 2, "#e8d4b9");
    }
  } else if (key === "rope") {
    // Three interlocking coils and a loose knotted end.
    for (const y of [8, 14, 20]) {
      r(5, y, 21, 3, dark);
      r(3, y + 3, 4, 4, dark);
      r(24, y + 3, 4, 4, dark);
      r(6, y + 6, 20, 3, dark);
      r(6, y + 1, 19, 2, gold);
      r(4, y + 3, 2, 4, brown);
      r(25, y + 3, 2, 4, gold);
      r(7, y + 6, 17, 2, brown);
    }
    r(18, 3, 3, 21, brown);
    r(19, 3, 1, 20, gold);
    r(18, 24, 5, 4, gold);
    r(21, 27, 3, 4, brown);
  } else if (key === "armor" || key === "hand") {
    r(7, 5, 18, 4, dark);
    r(3, 9, 26, 8, dark);
    r(7, 17, 18, 12, dark);
    r(8, 7, 16, 20, steel);
    r(4, 10, 5, 6, steel);
    r(23, 10, 5, 6, steel);
    r(10, 8, 2, 16, shine);
    r(14, 8, 5, 2, dark);
    r(8, 24, 16, 3, gold);
    r(19, 12, 3, 11, "#617a94");
    if (key === "hand") {
      r(12, 5, 12, 17, gold);
      r(9, 14, 4, 8, gold);
      r(13, 24, 9, 4, brown);
      r(14, 7, 1, 13, shine);
    }
  } else if (key === "shield") {
    r(5, 4, 22, 18, dark);
    r(8, 22, 16, 4, dark);
    r(12, 26, 8, 3, dark);
    r(7, 5, 18, 17, gold);
    r(10, 22, 12, 3, gold);
    r(14, 25, 4, 2, gold);
    r(10, 7, 12, 14, "#4679a0");
    r(15, 8, 2, 15, shine);
    r(11, 13, 10, 2, shine);
  } else if (key === "bomb" || key === "nuke" || key === "missile") {
    if (key === "missile") {
      r(12, 4, 8, 23, dark);
      r(14, 2, 4, 27, steel);
      r(15, 3, 1, 20, shine);
      r(11, 22, 3, 6, "#b85c69");
      r(18, 22, 3, 6, "#b85c69");
      r(14, 28, 4, 3, gold);
    } else {
      r(9, 10, 16, 16, dark);
      r(6, 14, 22, 9, dark);
      r(9, 12, 15, 13, "#526079");
      r(10, 13, 3, 5, steel);
      r(17, 7, 5, 4, gold);
      r(20, 4, 5, 3, brown);
      r(24, 2, 3, 3, "#f6c873");
      r(25, 1, 1, 1, shine);
      if (key === "nuke") {
        r(14, 17, 7, 6, gold);
        r(16, 15, 3, 10, gold);
        r(16, 19, 3, 3, dark);
      }
    }
  } else if (key === "vision" || key === "sight") {
    r(3, 11, 26, 12, dark);
    r(4, 9, 10, 16, brown);
    r(18, 9, 10, 16, brown);
    r(5, 13, 8, 8, steel);
    r(19, 13, 8, 8, steel);
    r(7, 15, 5, 5, key === "vision" ? "#a1db92" : "#78bed0");
    r(21, 15, 5, 5, "#78bed0");
    r(7, 14, 2, 2, shine);
    r(21, 14, 2, 2, shine);
    r(14, 14, 4, 4, gold);
  } else if (key === "bag") {
    r(9, 5, 14, 8, dark);
    r(11, 6, 10, 5, brown);
    r(6, 11, 21, 18, dark);
    r(7, 12, 19, 15, brown);
    r(8, 12, 17, 7, gold);
    r(9, 13, 15, 4, "#ba8954");
    r(14, 17, 5, 5, dark);
    r(15, 18, 3, 3, gold);
    r(9, 22, 2, 4, "#c79a64");
  } else if (key === "teleport") {
    for (let n = 0; n < 12; n++) {
      const w = n < 6 ? n + 1 : 12 - n;
      r(16 - w, 4 + n * 2, w * 2, 2, dark);
      r(17 - w, 4 + n * 2, Math.max(1, w * 2 - 2), 2, "#79d3cf");
    }
    r(14, 10, 2, 8, shine);
    r(17, 15, 2, 8, "#487eaa");
  } else if (key === "xp") {
    for (let n = 0; n < 13; n++) r(7 + n, 22 - n, 5, 5, dark);
    for (let n = 0; n < 13; n++)
      r(8 + n, 22 - n, 3, 3, n < 7 ? "#d77986" : shine);
    r(9, 22, 2, 1, "#f6bcbd");
  } else if (key.startsWith("candy-")) {
    const color =
      item.name === "Ultra Candy"
        ? "#c49bea"
        : item.name === "Rare Candy"
          ? "#8bcfe4"
          : "#e6a5a1";
    r(3, 11, 7, 10, dark);
    r(22, 11, 7, 10, dark);
    r(4, 12, 5, 8, color);
    r(23, 12, 5, 8, color);
    r(9, 8, 14, 17, dark);
    r(10, 9, 12, 14, color);
    r(12, 10, 3, 10, shine);
    r(17, 11, 2, 9, shine);
  } else if (key === "summon-stone") {
    r(8, 3, 16, 25, dark);
    r(10, 4, 12, 22, "#778d9d");
    r(11, 5, 4, 7, "#bacbd0");
    r(15, 9, 3, 14, "#b7e7cf");
    r(11, 15, 10, 3, "#b7e7cf");
    r(19, 20, 3, 6, "#3e5667");
  } else if (key === "gold-Pot of Gold") {
    r(12, 5, 4, 6, "#f6e598"); r(19, 4, 5, 7, "#e6b94f");
    r(9, 8, 15, 4, "#f8da77"); r(7, 11, 19, 4, dark);
    r(8, 12, 17, 2, "#f4d275");
    r(6, 15, 5, 7, dark); r(7, 16, 3, 4, "#b0794b");
    r(23, 15, 5, 7, dark); r(24, 16, 3, 4, "#b0794b");
    r(10, 14, 14, 14, dark); r(12, 16, 10, 10, "#855039");
    r(13, 17, 3, 8, "#c18a55"); r(12, 27, 10, 2, dark);
  } else if (key.startsWith("gold-")) {
    if (item.name !== "1 Gold Coin") {
      r(7, 25, 21, 5, dark);
      r(8, 26, 19, 1, "#f0d382");
      r(8, 27, 19, 2, "#9b6538");
      r(10, 29, 15, 1, "#dca754");
    }
    // Stepped round silhouette, shaded rim and a raised royal sun seal.
    r(12, 4, 8, 1, dark);
    r(9, 5, 14, 2, dark);
    r(7, 7, 18, 3, dark);
    r(6, 10, 20, 11, dark);
    r(7, 21, 18, 3, dark);
    r(9, 24, 14, 2, dark);
    r(12, 26, 8, 1, dark);
    r(10, 6, 12, 2, "#b68642");
    r(8, 8, 16, 3, "#b68642");
    r(7, 11, 18, 9, "#b68642");
    r(8, 20, 16, 3, "#9b6538");
    r(10, 23, 12, 2, "#9b6538");
    r(11, 7, 10, 2, "#fff0af");
    r(9, 9, 14, 3, "#f3d377");
    r(8, 12, 16, 8, "#eac66b");
    r(10, 20, 12, 3, "#eac66b");
    r(9, 11, 1, 9, "#fff0af");
    r(22, 12, 1, 8, "#bd8944");
    r(13, 12, 6, 7, "#a6743f");
    r(14, 11, 4, 9, "#a6743f");
    r(12, 14, 8, 3, "#a6743f");
    r(14, 12, 4, 6, "#f8df8b");
    r(15, 13, 2, 3, "#fff0af");
    r(13, 21, 6, 1, "#fff0af");
  } else if (key === "stair-key") {
    // Blue stair-shaped bow, visibly different from gold and purple chest keys.
    r(5, 3, 17, 14, dark);
    r(7, 5, 13, 10, "#84cadb");
    r(9, 7, 9, 6, dark);
    r(9, 11, 3, 2, "#d4f5e7");
    r(12, 9, 3, 4, "#d4f5e7");
    r(15, 7, 3, 6, "#d4f5e7");
    r(11, 16, 6, 14, dark);
    r(12, 16, 3, 12, "#84cadb");
    r(12, 17, 1, 10, "#d4f5e7");
    r(15, 22, 8, 3, "#84cadb");
    r(19, 24, 4, 4, "#84cadb");
    r(15, 27, 3, 2, "#84cadb");
  } else if (key.startsWith("key-")) {
    const color = item.name.startsWith("Rare") ? "#cf9bf2" : "#dfcb85";
    r(6, 4, 12, 12, dark);
    r(8, 5, 8, 9, color);
    r(10, 7, 4, 5, dark);
    r(14, 13, 4, 15, color);
    r(18, 21, 6, 3, color);
    r(18, 25, 5, 3, color);
  } else if (key === "seismic") {
    r(9, 3, 14, 23, dark);
    r(11, 4, 10, 21, "#a48767");
    r(13, 5, 6, 4, "#e9d5a2");
    r(14, 12, 4, 7, "#f6ba65");
    r(4, 14, 5, 2, "#f2d28b");
    r(24, 14, 5, 2, "#f2d28b");
    r(5, 22, 5, 3, "#ba805a");
    r(23, 22, 5, 3, "#ba805a");
  } else if (key === "immunity") {
    r(9, 5, 14, 22, dark);
    r(11, 7, 10, 17, "#c1e8b8");
    r(13, 3, 6, 5, "#d8c697");
    r(14, 11, 4, 11, "#457d62");
    r(11, 15, 10, 3, "#457d62");
    r(12, 8, 2, 5, "#f1f5d7");
  } else if (key.startsWith("double-")) {
    const colors: Record<string, string> = {
      Health: "#e5948c",
      Power: "#eab578",
      Speed: "#8edfc1",
      Luck: "#c7d377",
      Accuracy: "#bdd8ed",
      Magic: "#c7a4e5",
      Armor: "#b4c2d1",
    };
    r(5, 4, 22, 24, dark);
    r(7, 5, 18, 21, colors[key.slice(7)] || shine);
    r(10, 8, 10, 3, dark);
    r(18, 10, 3, 6, dark);
    r(11, 15, 9, 3, dark);
    r(9, 17, 3, 5, dark);
    r(9, 21, 13, 3, dark);
  } else {
    r(8, 6, 17, 22, dark);
    r(9, 7, 15, 19, "#c5c7b4");
    r(12, 10, 10, 2, "#7b8b89");
    r(11, 15, 9, 2, "#7b8b89");
    r(14, 20, 7, 2, "#7b8b89");
  }
  return c;
}
const icons = new Map<string, string>();
export function itemIcon(item: Pick<Item, "kind" | "name" | "element">) {
  const key = itemArtKey(item);
  let url = icons.get(key);
  if (!url) {
    url = itemCanvas(item).toDataURL();
    icons.set(key, url);
  }
  return url;
}

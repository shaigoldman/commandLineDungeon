/** Hand-drawn 32px motifs for items whose silhouettes matter during play. */
type Rect = (x: number, y: number, width: number, height: number, color: string) => void;
const ink = "#17202e", glint = "#fff2d2", brass = "#d6ae67";

export function drawSpecialItem(key: string, r: Rect): boolean {
  const flask = (liquid: string, mark: string, size = 0) => {
    const inset = size > 0 ? 0 : size < 0 ? 3 : 1;
    r(12, 3, 8, 5, ink); r(13, 4, 6, 3, brass);
    r(10 + inset, 8, 12 - inset * 2, 5, ink);
    r(7 + inset, 12, 18 - inset * 2, 15, ink);
    r(9 + inset, 13, 14 - inset * 2, 12, "#a6c7cc");
    r(10 + inset, 17, 12 - inset * 2, 8, liquid);
    r(10 + inset, 14, 2, 8, glint); r(11 + inset, 26, 10 - inset * 2, 2, brass);
    r(14, 18, 4, 6, mark);
  };
  const stone = (body: string, core: string) => {
    r(8, 6, 14, 3, ink); r(5, 9, 21, 13, ink); r(8, 22, 17, 6, ink);
    r(9, 7, 12, 3, body); r(7, 10, 18, 12, body); r(10, 22, 13, 4, body);
    r(9, 11, 5, 3, glint); r(13, 14, 7, 7, core); r(15, 12, 3, 12, core);
  };
  const book = (cover: string, rune: string) => {
    r(5, 4, 23, 25, ink); r(7, 6, 19, 21, cover);
    r(9, 7, 2, 19, brass); r(13, 10, 10, 2, rune);
    r(16, 12, 4, 10, rune); r(13, 16, 10, 2, rune);
    r(11, 25, 14, 2, glint);
  };
  const star = (color: string, center: string) => {
    r(14, 2, 4, 27, ink); r(3, 13, 26, 5, ink);
    r(8, 7, 17, 17, ink); r(15, 4, 2, 23, color);
    r(5, 15, 22, 2, color); r(11, 9, 11, 15, color);
    r(13, 12, 7, 8, center); r(15, 13, 2, 3, glint);
  };
  const boots = (color: string, wing = false) => {
    for (const x of [4, 18]) {
      r(x + 3, 5, 8, 16, ink); r(x + 4, 7, 6, 13, color);
      r(x, 19, 12, 8, ink); r(x + 1, 20, 10, 5, color);
      r(x + 2, 24, 11, 2, brass);
    }
    if (wing) { r(2, 8, 6, 3, glint); r(0, 12, 8, 2, glint); r(24, 7, 6, 3, glint); }
  };
  const magnet = (color: string, cargo: string) => {
    r(6, 5, 21, 20, ink); r(9, 7, 15, 16, color);
    r(13, 8, 8, 12, ink); r(5, 20, 8, 6, ink); r(21, 20, 8, 6, ink);
    r(7, 20, 5, 4, cargo); r(22, 20, 5, 4, cargo);
    r(13, 2, 5, 3, glint);
  };
  if (key.startsWith("heal-") || key === "mana-potion" || key.endsWith("potion") || key === "health-pot") {
    if (key.startsWith("heal-")) {
      const size = key.includes("Tiny") ? -1 : key.includes("Huge") || key.includes("Giant") ? 1 : 0;
      flask(size > 0 ? "#c94462" : "#dd6e74", "#ffe7a4", size);
      if (key.includes("Medium") || key.includes("Large")) r(18, 18, 3, 5, "#ffe7a4");
      if (key.includes("Large")) r(5, 9, 4, 6, "#f7c99b");
      if (key.includes("Huge") || key.includes("Giant")) { r(4, 18, 4, 5, brass); r(24, 18, 4, 5, brass); }
      if (key.includes("Giant")) { r(13, 7, 6, 3, glint); r(3, 8, 4, 4, "#f7c99b"); }
    } else if (key === "mana-potion") flask("#548ccf", "#b8e8ff");
    else if (key === "mystery-potion") { flask("#a46cc5", "#ffd97d"); r(18, 13, 4, 4, "#7cdbb1"); r(8, 20, 4, 4, "#ed99a1"); }
    else if (key === "super-potion") { flask("#dd687a", "#f7e5c2", 1); r(17, 17, 6, 8, "#6abde5"); r(21, 13, 2, 10, glint); }
    else if (key === "poison-potion") { flask("#74bb67", ink); r(12, 21, 8, 2, ink); r(12, 17, 2, 2, ink); r(18, 17, 2, 2, ink); }
    else if (key === "spiked-potion") { flask("#e58762", "#ffe9aa"); for (const x of [4, 24]) { r(x, 15, 5, 4, ink); r(x + 1, 16, 3, 2, brass); } }
    else if (key === "cursed-potion") { flask("#8c5ca8", "#d0b4e4"); r(12, 17, 8, 5, ink); r(13, 18, 2, 2, glint); r(17, 18, 2, 2, glint); }
    else if (key === "health-pot") { flask("#d87578", "#ffe5aa"); r(23, 5, 7, 7, ink); r(24, 6, 5, 5, brass); r(26, 7, 1, 3, glint); }
    else if (key === "reusable-tiny-potion" || key === "reusable-medium-potion") { flask("#db6474", "#ffe9ac", key.includes("medium") ? 1 : -1); r(10, 2, 12, 2, "#9edbd2"); r(12, 25, 8, 2, "#9edbd2"); }
    return true;
  }
  if (key === "mana-rock") { stone("#5589a9", "#ed8a91"); r(9, 23, 6, 3, "#a7d7e4"); return true; }
  if (key === "health-drain") { stone("#9d5d72", "#67b9d7"); r(4, 4, 6, 3, "#e5908d"); r(22, 24, 6, 3, "#80cee5"); return true; }
  if (key === "mana-shard" || key === "mana-gem" || key === "mana-diamond") {
    const body = key === "mana-diamond" ? "#b4e8f3" : key === "mana-gem" ? "#65a9d7" : "#4488b9";
    if (key === "mana-shard") { r(17, 2, 5, 27, ink); r(10, 9, 14, 19, ink); r(15, 5, 6, 21, body); r(11, 16, 14, 8, body); }
    else if (key === "mana-gem") { r(7, 7, 18, 19, ink); r(10, 4, 12, 24, body); r(5, 14, 22, 7, body); r(11, 8, 8, 3, glint); }
    else { r(14, 2, 5, 28, ink); r(3, 14, 26, 5, ink); r(9, 7, 15, 18, body); r(14, 5, 5, 22, glint); }
    r(13, 18, 4, 4, "#407abb"); return true;
  }
  if (key === "mana-pod" || key === "energy-harness" || key === "energy-generator") {
    if (key === "mana-pod") { stone("#5799a9", "#a9e7ed"); r(4, 23, 6, 5, "#759876"); r(23, 23, 6, 5, "#759876"); }
    else if (key === "energy-harness") { r(4, 10, 24, 13, ink); r(6, 12, 20, 9, brass); r(12, 4, 9, 24, ink); r(14, 6, 5, 20, "#71c5d0"); r(15, 12, 3, 8, glint); }
    else { r(5, 8, 22, 19, ink); r(7, 10, 18, 15, "#65879a"); r(12, 3, 8, 8, brass); r(14, 13, 4, 10, "#a1e5d3"); r(4, 27, 6, 3, "#a1e5d3"); r(22, 27, 6, 3, "#a1e5d3"); }
    return true;
  }
  if (key === "mana-channel") { r(4, 4, 8, 9, "#69b3d8"); r(9, 11, 14, 5, ink); r(11, 12, 11, 3, brass); r(19, 13, 5, 10, brass); r(18, 22, 11, 8, ink); r(20, 23, 7, 5, "#edc970"); return true; }
  if (key === "magic-scales") { r(14, 3, 5, 25, brass); r(4, 9, 25, 3, brass); r(6, 12, 2, 12, ink); r(24, 12, 2, 12, ink); r(2, 23, 11, 4, "#b07872"); r(20, 23, 11, 4, "#79badd"); r(11, 27, 12, 3, ink); return true; }
  if (key === "infinite-bag") { r(8, 3, 16, 8, ink); r(10, 6, 12, 8, brass); r(5, 12, 22, 18, ink); r(7, 14, 18, 14, "#795b92"); r(12, 17, 8, 8, "#4b345e"); r(15, 18, 2, 5, glint); r(8, 13, 16, 2, brass); return true; }
  if (key === "invisibility") { r(12, 2, 8, 7, ink); r(9, 7, 14, 13, "#7592b5"); r(6, 13, 20, 16, ink); r(8, 14, 16, 13, "#8fa7c4"); r(12, 20, 8, 7, "#5e7798"); r(15, 10, 3, 8, glint); return true; }
  if (key === "stealth") { boots("#5f788e"); return true; }
  if (key === "speedy-boots") { boots("#a5cfaa", true); return true; }
  if (key.startsWith("charm-")) { const colors: Record<string, string> = { Strength: "#d9827b", Luck: "#a8c97c", Health: "#e6a0a6", Speed: "#7bcdbd", Magic: "#ad8bce", Accuracy: "#87bddd", Armor: "#b9c9d2" }; const color = colors[key.slice(6)] || "#8ac6a8"; r(8, 3, 16, 4, brass); r(5, 6, 5, 12, brass); r(22, 6, 5, 12, brass); r(11, 14, 11, 14, ink); r(13, 16, 7, 9, color); r(15, 18, 3, 4, glint); return true; }
  if (key.startsWith("stat-") || key.startsWith("boost-")) { const colors: Record<string, string> = { Health: "#df828b", Power: "#e3a875", Attack: "#e3a875", Speed: "#79ccb8", Luck: "#b9d27c", Accuracy: "#82b9d9", Magic: "#ad91d5" }; const stat = Object.keys(colors).find((name) => key.includes(name)) || "Power"; const color = colors[stat]; if (key.startsWith("stat-")) { r(8, 5, 16, 23, ink); r(10, 7, 12, 19, color); r(13, 9, 6, 15, glint); r(7, 20, 18, 3, brass); } else { star(color, glint); r(14, 13, 4, 6, ink); } if (stat === "Speed") r(3, 7, 7, 2, color); if (stat === "Luck") r(23, 24, 5, 4, color); if (stat === "Accuracy") r(3, 21, 5, 3, color); if (stat === "Magic") r(25, 5, 4, 5, color); return true; }
  if (key === "bag-bigger" || key === "bag-huge") { const huge = key === "bag-huge"; r(9, 4, 14, 9, ink); r(11, 6, 10, 6, brass); r(huge ? 3 : 6, 12, huge ? 26 : 20, 18, ink); r(huge ? 5 : 8, 14, huge ? 22 : 16, 13, huge ? "#7b5776" : "#8e6348"); r(12, 18, 8, 7, brass); if (huge) { r(2, 17, 4, 7, brass); r(26, 17, 4, 7, brass); } return true; }
  if (key === "stairfinder" || key === "ultrastairfinder") { r(4, 22, 23, 6, ink); r(6, 23, 19, 4, brass); r(8, 18, 5, 5, "#8fc4c9"); r(13, 13, 5, 10, "#8fc4c9"); r(18, 8, 6, 15, "#8fc4c9"); r(22, 3, 5, 8, glint); if (key === "ultrastairfinder") { r(4, 4, 4, 4, "#ceade9"); r(26, 16, 4, 4, "#ceade9"); } return true; }
  if (key === "energy-magnet") { magnet("#83c7dc", "#98ead0"); return true; }
  if (key === "item-magnet") { magnet("#b591d2", brass); return true; }
  if (key === "mana-star" || key === "double-mana-star" || key === "critical-star") { star(key === "critical-star" ? "#e3aa64" : "#7cbadb", key === "critical-star" ? "#fff0ad" : "#d0f1f1"); if (key === "double-mana-star") { r(2, 3, 4, 5, "#8edee7"); r(26, 24, 4, 5, "#8edee7"); } return true; }
  if (key === "magic-book") { book("#665091", "#b9d9ee"); return true; }
  if (key === "alchemy-book") { book("#985f54", "#f3c97e"); r(20, 19, 5, 5, "#9ce5c3"); return true; }
  if (key === "cleanser") { r(6, 18, 20, 9, ink); r(8, 19, 16, 6, "#73bdce"); r(14, 5, 5, 17, glint); r(8, 11, 17, 4, glint); r(15, 2, 3, 22, "#a7e4d6"); return true; }
  if (key === "bad-candy" || key === "cursed-candy" || key === "hard-candy") { const color = key === "bad-candy" ? "#57735d" : key === "cursed-candy" ? "#8d64a6" : "#cf995f"; r(3, 12, 8, 9, ink); r(21, 12, 8, 9, ink); r(5, 14, 5, 5, color); r(23, 14, 5, 5, color); r(10, 7, 13, 19, ink); r(12, 9, 9, 15, color); if (key === "hard-candy") { r(14, 11, 5, 4, glint); r(12, 18, 8, 3, brass); } else { r(13, 14, 2, 3, glint); r(18, 14, 2, 3, glint); r(15, 20, 3, 3, ink); } return true; }
  if (key === "alchemy-wand" || key === "magic-wand") { for (let n = 0; n < 20; n++) r(6 + n, 27 - n, 3, 3, ink); for (let n = 0; n < 19; n++) r(7 + n, 27 - n, 2, 2, key === "alchemy-wand" ? "#e3a871" : "#85b7e1"); r(23, 3, 6, 6, key === "alchemy-wand" ? "#9adfb3" : "#bd9de6"); r(3, 21, 5, 5, brass); r(12, 4, 3, 3, glint); return true; }
  if (key === "reusable-key" || key === "reusable-door-key") { r(5, 4, 12, 13, ink); r(7, 6, 8, 9, key === "reusable-door-key" ? "#bd96d9" : "#8cc3b9"); r(9, 8, 4, 5, ink); r(14, 15, 5, 13, brass); r(19, 21, 8, 4, brass); r(19, 26, 5, 3, brass); r(4, 2, 4, 3, glint); if (key === "reusable-door-key") r(24, 5, 5, 6, "#bd96d9"); return true; }
  if (key === "really-greedy-amulet") { r(7, 4, 18, 4, brass); r(5, 8, 5, 13, brass); r(22, 8, 5, 13, brass); r(9, 17, 14, 12, ink); r(11, 19, 10, 8, "#9d5b77"); r(12, 21, 8, 5, "#e7b368"); r(15, 20, 2, 8, ink); return true; }
  if (key === "cursed-gold") { r(7, 8, 18, 17, ink); r(9, 9, 14, 15, "#8d6b9c"); r(11, 11, 10, 10, "#bea1cb"); r(13, 13, 6, 6, ink); r(15, 11, 2, 14, "#6e4f83"); r(4, 4, 5, 5, "#b48aca"); return true; }
  if (key === "gold-5 Gold Coins" || key === "gold-10 Gold Coins" || key === "gold-20 Gold Coins") {
    const stack = key.includes("20") ? 3 : key.includes("10") ? 2 : 1;
    for (let n = 0; n < stack; n++) { const x = 3 + n * 8, y = 21 - n * 6; r(x, y, 18, 8, ink); r(x + 2, y + 1, 14, 5, "#d3a44c"); r(x + 4, y + 2, 10, 2, "#f4df91"); }
    r(12, 4, 9, 2, glint); return true;
  }
  return false;
}

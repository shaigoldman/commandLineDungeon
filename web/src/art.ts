// Original 24 × 32 shaded map units, with retained monster silhouette patterns.
export const palette: Record<string, string> = {
  o: "#121c29",
  s: "#efc79b",
  h: "#543746",
  b: "#4588bf",
  B: "#a5d7e3",
  w: "#f5e8bf",
  g: "#65946a",
  G: "#b6c789",
  r: "#b35a61",
  R: "#f1a381",
  p: "#9371ad",
  y: "#d5af62",
  d: "#384452",
  c: "#7ecbd0",
};
export const patterns: Record<string, string[]> = {
  Gremlin: [
    "................", "..g..........g..", "..gg........gg..", "...gggggggggg...",
    "....gGGGGGGg....", "....GoGGoGGG....", ".....GGrrGG.....", "......GGGG......",
    "....ggGGGGgg....", "...gggGGGGggg...", "..g.gggggggg.g..", "....gg.dd.gg....",
    ".....dd..dd.....", "....ooo..ooo....", "................", "................",
  ],
  Shadow: [
    "................", "......dddd......", ".....dooodd.....", "....dooooood....",
    "....dooRoodd....", ".....doooood....", "...dddddddddd...", "..ddodddddddodd..",
    ".ddoodddddddoodd.", "...dddddddddd...", "....ddodddodd...", "....ddodddodd...",
    "...ddo.....odd..", "..ddd.......ddd.", "................", "................",
  ],
  Robot: [
    "................", "....dddddddd....", "....dBBBBBBd....", "....dBrrrBBd....",
    "....dBBBBBBd....", ".....ddyydd.....", "..dddBBBBBBddd..", "..dBddBBBBddBd..",
    "..dBddBBBBddBd..", "..dddBBBBBBddd..", ".....dBrrBd.....", ".....dBBBBd.....",
    "....ddd..ddd....", "....dBd..dBd....", "....ooo..ooo....", "................",
  ],
  "Dark Fairy": [
    "................", "..p..........p..", ".ppp........ppp.", "..ppp..hh..ppp..",
    "...pp.hsssh.pp...", "....pphsshpp....", "...ppp.sssp.pp...", "..ppp.pPPp.ppp..",
    ".pppp.pPPp.pppp.", "..ppp.pPPp.ppp..", "...pp.pPPp.pp...", ".....pPPp.......",
    "......dd........", ".....d..d.......", "................", "................",
  ],
  "Wild Villager": [
    "................", ".....hhh.h......", "....hhhghhh.....", ".....hsssh......",
    "......sss.......", "....rrggrr......", "...rrrgggrrr....", "...s.rrggr.s....",
    ".....rgggr......", ".....rgggr......", "....rrgggrr.....", ".....dd.dd......",
    "....ddd.ddd.....", "....ooo.ooo.....", "................", "................",
  ],
  Warrior: [
    "................",
    "......hhh.......",
    ".....hhhhh......",
    ".....hsssh......",
    "......sss.......",
    "....bbbbbb......",
    "...bbBbbbbb..w..",
    "...s.bbbbbb..w..",
    ".....byyyb...w..",
    ".....bbbbb...w..",
    ".....bbbbb..yw..",
    ".....dd.dd...s..",
    "....ddd.ddd.....",
    "....ooo.ooo.....",
    "................",
    "................",
  ],
  Knight: [
    "................",
    ".....ddddd......",
    "....dBBBBBd.....",
    "....dBoBoBd.....",
    ".....BsssB......",
    "...dBBBBBBBd....",
    "...BBdBBBdBB....",
    "...BBdBBBdBB.y..",
    "...BBdyyy dB.w..",
    "....ddBBBdd..w..",
    ".....BBBBB...w..",
    ".....dd.dd...w..",
    "....dBB.dBB.....",
    "....ooo.ooo.....",
    "................",
    "................",
  ],
  Scout: [
    "................",
    "......ggg.......",
    ".....ggggg......",
    ".....gsssg......",
    "......sss.......",
    "....gggggg......",
    "...ggGggggg.....",
    "...s.gggggg.....",
    ".....gyyyg......",
    ".....ggggg..w...",
    ".....ggggg..w...",
    ".....dd.dd..s...",
    "....ddd.ddd.....",
    "....ooo.ooo.....",
    "................",
    "................",
  ],
  Mage: [
    "................",
    ".......p........",
    "......ppp.......",
    ".....ppppp......",
    "....ppppppp.....",
    ".....hsssh......",
    "......sss....c..",
    ".....ppppp...y..",
    "....ppBpppp..y..",
    "....sppppps..y..",
    ".....pyyyp...y..",
    "....ppppppp..y..",
    "....ppppppp..y..",
    ".....oo.oo......",
    "................",
    "................",
  ],
  Zombie: [
    "................",
    "................",
    ".....hhhh.......",
    ".....hgggh......",
    ".....gogo.......",
    ".....gggg.......",
    "......gg........",
    "....rrrrrr......",
    "...grrrrrrg.....",
    "...g.rrrr.g.....",
    ".....rddr.......",
    ".....dd.dd......",
    ".....dd.dd......",
    "....ooo.ooo.....",
    "................",
    "................",
  ],
  Spider: [
    "................",
    "................",
    "................",
    "................",
    "..r..........r..",
    "...r...rr...r...",
    "....r.rrrr.r....",
    "..rrrrrrrrrrrr..",
    ".....rooor......",
    "..rrrrrrrrrrrr..",
    "...r.rrrrrr.r...",
    "..r...rrrr...r..",
    "................",
    "................",
    "................",
    "................",
  ],
  Snake: [
    "................",
    "................",
    "................",
    "........gggg....",
    ".......gGrrGg...",
    ".......gGooGg...",
    "........gGGg....",
    "........gGg.....",
    "........gGg.....",
    "...gg...gGg.....",
    "..gGGggggGg.....",
    "..gGGGGGGg......",
    "...gggggg.......",
    "................",
    "................",
    "................",
  ],
  Parasite: [
    "................",
    "................",
    "................",
    "......pppp......",
    ".....pRppRp.....",
    "....pppoopp.....",
    "....pppppppp....",
    "....pRppppRp....",
    ".....pppppp.....",
    "....p.pppp.p....",
    "...p..p..p..p...",
    ".....p....p.....",
    "................",
    "................",
    "................",
    "................",
  ],
  Golem: [
    "................",
    ".....ddddd......",
    "....dBBBBBd.....",
    "....dBrBrBd.....",
    ".....ddddd......",
    "..dddBBBBBddd...",
    "..dBBdBBBdBBd...",
    "..dBBdBBBdBBd...",
    "..dddBBBBBddd...",
    ".....ddddd......",
    "....dBBdBBd.....",
    "....dBBdBBd.....",
    "....ddd.ddd.....",
    "...dddd.dddd....",
    "................",
    "................",
  ],
  Dragon: [
    "................",
    "..r..........r..",
    ".rrr..rrr...rrr.",
    ".rRrrrRrRrrrrRr.",
    "..rRRrRrRrrRRr..",
    "...rRRRRRRRRr...",
    "....rRoRoRrr....",
    ".....rRRRrw.....",
    ".....rRRRw......",
    "....rRRRRrr.....",
    "...rRrRRrRRr....",
    "..rr.rRRr.rr....",
    "....rr..rr......",
    "...www..www.....",
    "................",
    "................",
  ],
  Chieftan: [
    "................",
    ".....y.y.y......",
    ".....yyyyy......",
    ".....hsssh......",
    "......sss.......",
    "....yyyyyyy.....",
    "...yyRyyyRyy....",
    "...s.yyyyy.s....",
    ".....yyyyy......",
    ".....yrrry......",
    ".....yyyyy......",
    ".....dd.dd......",
    "....ddd.ddd.....",
    "....ooo.ooo.....",
    "................",
    "................",
  ],
};
export function sprite(
  type: string,
  scale = 2,
  tribe = "Pallu",
  showWeapon = true,
) {
  type = type === "D" ? "Scout" : type === "Over9000" ? "Warrior" : type;
  const c = document.createElement("canvas");
  c.width = 24 * scale;
  c.height = 32 * scale;
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  const r = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const outline = "#182134",
    skin = type === "Knight" ? "#bb805b" : "#edbc90",
    shade = type === "Knight" ? "#86563f" : "#bd806a",
    light = type === "Knight" ? "#d9a477" : "#ffddb0";
  const colors: Record<string, string[]> = {
    Warrior: ["#244470", "#4275a0", "#83b8d0"],
    Knight: ["#48607e", "#89abc2", "#d5e6df"],
    Scout: ["#335c48", "#568565", "#9db778"],
    Mage: ["#4b386d", "#8268a2", "#c4a2cb"],
    Chieftan: ["#775335", "#bd9253", "#efcb86"],
  };
  const col = colors[type];
  if (col) {
    const [dark, mid, bright] = col;
    // Cape, layered pauldrons, boots, belt and polished trim.
    r(6, 14, 13, 13, outline);
    r(5, 17, 3, 11, dark);
    r(17, 17, 3, 11, dark);
    r(6, 18, 2, 8, mid);
    r(17, 20, 2, 6, mid);
    r(8, 25, 4, 6, outline);
    r(14, 25, 4, 6, outline);
    r(9, 25, 2, 3, "#6d594b");
    r(15, 25, 2, 3, "#6d594b");
    r(7, 30, 6, 2, "#18212b");
    r(14, 30, 6, 2, "#18212b");
    r(8, 30, 3, 1, "#576374");
    r(15, 30, 3, 1, "#576374");
    r(8, 14, 10, 13, dark);
    r(9, 15, 8, 10, mid);
    r(10, 15, 2, 9, bright);
    r(13, 17, 3, 7, dark);
    r(8, 24, 10, 2, "#5c4438");
    r(12, 24, 3, 2, "#e7c782");
    r(13, 24, 1, 1, "#fff0bd");
    r(5, 15, 4, 7, outline);
    r(5, 15, 4, 4, mid);
    r(5, 15, 3, 1, bright);
    r(6, 21, 2, 3, skin);
    r(7, 21, 1, 2, light);
    r(17, 15, 4, 7, outline);
    r(17, 15, 4, 4, mid);
    r(17, 15, 3, 1, bright);
    r(18, 21, 2, 3, shade);
    r(18, 21, 1, 2, skin);
    // Three-tone face, visible eyes, hair highlights and neck shadow.
    r(8, 4, 10, 9, outline);
    r(9, 5, 8, 7, shade);
    r(9, 5, 7, 6, skin);
    r(10, 7, 5, 3, light);
    r(10, 9, 1, 1, outline);
    r(14, 9, 1, 1, outline);
    r(12, 11, 2, 1, shade);
    r(11, 12, 4, 2, shade);
    r(11, 12, 3, 1, skin);
    if (type === "Mage") {
      // Indigo hair, broad violet brim, gold crescent and turquoise clasp:
      // the same identifying features as the original menu portrait.
      r(8, 8, 2, 8, "#393357");
      r(16, 8, 2, 9, "#555078");
      r(7, 7, 13, 2, dark);
      r(5, 7, 15, 2, outline);
      r(6, 6, 13, 2, dark);
      r(8, 3, 9, 4, mid);
      r(10, 1, 5, 3, mid);
      r(11, 0, 3, 2, bright);
      r(8, 6, 9, 1, "#d0ae67");
      r(11, 5, 2, 2, "#efd897");
      r(12, 4, 2, 2, "#8268a2");
      r(3, 7, 3, 2, dark);
      r(19, 6, 4, 2, mid);
      r(8, 9, 2, 6, "#393357");
      r(16, 9, 2, 6, "#555078");
      r(8, 26, 10, 3, dark);
      r(9, 26, 2, 2, bright);
      r(12, 16, 3, 2, "#dbb66f");
      r(13, 17, 1, 2, "#8cd6d6");
      if (showWeapon) {
        r(21, 6, 1, 25, "#4a3434");
        r(22, 6, 1, 25, "#c99d60");
        r(20, 5, 4, 5, "#534f71");
        r(21, 4, 2, 5, "#71c9cd");
        r(21, 5, 1, 2, "#e1fff0");
        r(20, 9, 4, 1, "#e8c77b");
      }
    } else if (type === "Knight") {
      // White swept hair, warm skin, silver armor and crimson mantle.
      r(5, 17, 3, 11, "#722b40");
      r(17, 17, 3, 11, "#a63e50");
      r(6, 15, 3, 4, "#c65460");
      r(17, 15, 3, 4, "#c65460");
      r(8, 3, 10, 3, "#c8d0c8");
      r(9, 2, 8, 2, "#eee5ce");
      r(8, 5, 3, 2, "#e5e0ce");
      r(15, 4, 3, 3, "#b7bbc0");
      r(7, 4, 4, 2, "#e5e0ce");
      r(10, 3, 5, 1, "#fff0d8");
      r(10, 9, 1, 1, "#a3c6e0");
      r(14, 9, 1, 1, "#a3c6e0");
      r(8, 15, 10, 2, "#d9bf77");
      r(10, 17, 6, 5, bright);
      r(11, 17, 1, 4, "#f6f1dc");
      r(16, 17, 2, 6, mid);
      r(2, 19, 6, 9, outline);
      r(3, 19, 4, 8, "#667e9c");
      r(3, 19, 4, 1, "#e6c26d");
      r(4, 21, 2, 4, "#d0aa63");
      r(4, 27, 2, 1, "#d0aa63");
      if (showWeapon) {
        r(21, 10, 1, 17, "#b2c9d0");
        r(22, 10, 1, 15, "#f0f4dc");
        r(20, 24, 4, 1, "#d9b36b");
      }
    } else {
      const hair =
        type === "Scout"
          ? "#8c4937"
          : type === "Chieftan"
            ? "#62524a"
            : "#57352e";
      r(8, 3, 10, 4, hair);
      r(7, 4, 3, 5, hair);
      r(16, 5, 2, 4, hair);
      r(10, 2, 6, 2, hair);
      r(10, 3, 5, 1, "#ab7351");
      r(9, 4, 3, 1, "#c48c5e");
      r(8, 6, 4, 1, hair);
      if (type === "Scout") {
        r(7, 7, 2, 3, skin);
        r(17, 7, 2, 3, skin);
        r(10, 9, 1, 1, "#76a65b");
        r(14, 9, 1, 1, "#76a65b");
        r(6, 21, 2, 3, "#e7dbb7");
        r(18, 21, 2, 3, "#e7dbb7");
        r(9, 17, 2, 7, "#876047");
        r(10, 18, 2, 3, "#b18a57");
        r(7, 13, 11, 3, "#274b3d");
        r(8, 14, 8, 1, "#94ac73");
        r(18, 5, 1, 14, "#694333");
        r(18, 4, 2, 3, "#e4d3a7");
        if (showWeapon) {
          r(20, 12, 1, 12, "#c99b63");
          r(21, 15, 1, 6, "#9c7752");
        }
        r(19, 8, 3, 9, "#5a4034");
        r(20, 5, 1, 7, "#e7d9b4");
        r(22, 6, 1, 7, "#d8cba7");
      } else {
        r(8, 14, 10, 3, "#368393");
        r(10, 16, 3, 4, "#427e90");
        if (type === "Warrior") {
          r(16, 15, 5, 4, "#8b9bac");
          r(17, 15, 3, 1, "#eef0d9");
          r(9, 17, 2, 7, "#9b7750");
          r(13, 15, 2, 2, "#d9b96e");
          r(16, 4, 3, 2, hair);
          r(18, 2, 2, 2, hair);
        }
        if (showWeapon) {
          r(18, 10, 1, 16, "#46546e");
          r(19, 9, 1, 16, "#e5e9d6");
          r(20, 9, 1, 14, "#99bfc5");
          r(17, 24, 5, 1, "#e9bf70");
          r(18, 25, 2, 3, "#714830");
        }
      }
      if (type === "Chieftan") {
        r(8, 3, 10, 2, "#e8c16b");
        r(8, 1, 2, 3, "#e8c16b");
        r(12, 0, 2, 4, "#e8c16b");
        r(16, 1, 2, 3, "#e8c16b");
        r(12, 3, 2, 1, "#e18773");
      }
    }
  } else {
    // Retain each monster's original silhouette, now with bevels, shadow pixels and eyes.
    const pattern = patterns[type] || patterns.Zombie;
    pattern.forEach((row, y) =>
      [...row].forEach((p, x) => {
        const color = palette[p];
        if (!color) return;
        const xx = x + 4,
          yy = y * 2 + 1;
        r(xx, yy, 1, 2, color);
        if (pattern[y - 1]?.[x] === ".") r(xx, yy, 1, 1, "#c1b89a");
        if (pattern[y + 1]?.[x] === ".") r(xx, yy + 1, 1, 1, outline);
      }),
    );
    if (type === "Zombie") {
      r(10, 10, 1, 1, "#ffce72");
      r(14, 10, 1, 1, "#ffce72");
      r(9, 20, 2, 2, "#7c424d");
      r(13, 25, 1, 2, "#a5956d");
    }
    if (type === "Spider") {
      r(9, 13, 7, 6, "#8d405b");
      r(10, 13, 3, 2, "#c9757c");
      for (const x of [10, 12, 14]) r(x, 18, 1, 1, "#ffce7e");
    }
    if (type === "Snake") {
      r(13, 9, 5, 2, "#c1c476");
      r(14, 10, 1, 1, "#f5b06b");
      r(17, 10, 1, 1, "#f5b06b");
      r(18, 13, 2, 1, "#be6a73");
    }
    if (type === "Dragon") {
      r(9, 14, 2, 1, "#ffe29c");
      r(14, 14, 2, 1, "#ffe29c");
      r(11, 18, 5, 2, "#edac79");
      r(12, 21, 4, 4, "#c69d76");
    }
  }
  if (type === "Chieftan") {
    const coat =
      tribe === "Awa" ? "#397f83" : tribe === "Vraskii" ? "#76558f" : "#a67a4e";
    r(4, 15, 5, 13, coat);
    r(17, 15, 5, 13, coat);
    r(6, 16, 2, 11, "#e6cc8e");
    r(19, 16, 1, 10, "#e6cc8e");
    r(6, 4, 13, 3, coat);
    r(8, 2, 9, 3, coat);
    r(5, 6, 3, 5, coat);
    r(17, 5, 3, 7, coat);
    r(9, 8, 3, 3, "#f8e0ad");
    r(14, 8, 3, 3, "#f8e0ad");
    r(10, 9, 1, 2, "#243347");
    r(15, 9, 1, 2, "#243347");
    r(9, 7, 3, 1, "#574c43");
    r(15, 6, 3, 1, "#574c43");
    r(11, 12, 5, 2, "#a6948b");
    r(12, 14, 4, 4, "#d3c5a7");
    r(13, 16, 2, 3, "#e5d7b8");
    r(2, 4, 2, 22, "#76563b");
    r(1, 3, 4, 3, "#e3c87c");
    r(1, 5, 4, 3, tribe === "Awa" ? "#8bd9d1" : "#d8a2c8");
    for (let i = 0; i < 3; i++) {
      r(8 + i * 4, 19, 2, 2, "#edd99c");
      r(9 + i * 4, 20, 1, 1, coat);
    }
    if (tribe === "Vraskii") {
      r(5, 0, 2, 5, "#c594b9");
      r(7, 1, 2, 4, "#b5cab6");
      r(9, 0, 2, 4, "#d4b96d");
    } else if (tribe === "Awa") {
      r(16, 2, 5, 2, "#b8e1d7");
      r(19, 4, 2, 3, "#e7d59d");
    } else {
      r(9, 3, 7, 1, "#e5bf71");
      r(12, 1, 2, 4, "#bd8d60");
    }
  }
  return c;
}
const portraitCache = new Map<string, string>();
export function portrait(type: string) {
  const existing = portraitCache.get(type);
  if (existing) return existing;
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#223646";
  ctx.fillRect(0, 0, 96, 96);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite(type, 1), 0, 0, 24, 32, 12, 0, 72, 96);
  const url = c.toDataURL();
  portraitCache.set(type, url);
  return url;
}

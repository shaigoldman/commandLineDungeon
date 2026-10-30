/** Original pixel art for Ashfall inhabitants and interactable objects. */
export function worldArt(kind: string, scale = 2) {
  const c = document.createElement("canvas");
  c.width = c.height = 32 * scale;
  const x = c.getContext("2d")!;
  x.scale(scale, scale);
  x.imageSmoothingEnabled = false;
  const r = (a: number, b: number, w: number, h: number, color: string) => {
    x.fillStyle = color;
    x.fillRect(a, b, w, h);
  };
  const dark = "#172532",
    gold = "#d9b563",
    light = "#fae2a6";
  if (kind === "Chest" || kind === "UltraChest") {
    r(4, 10, 24, 18, dark);
    r(5, 12, 22, 14, kind === "UltraChest" ? "#694779" : "#825b3c");
    r(6, 9, 20, 5, gold);
    r(7, 10, 18, 2, light);
    r(5, 17, 22, 2, gold);
    r(8, 11, 2, 15, gold);
    r(22, 11, 2, 15, gold);
    r(14, 16, 4, 6, dark);
    r(15, 16, 2, 3, light);
    if (kind === "UltraChest") {
      r(13, 4, 6, 4, "#b89bed");
      r(15, 2, 2, 8, "#f2d9ff");
    }
  } else if (kind === "SecretDoor") {
    r(5, 2, 22, 29, dark);
    r(7, 3, 18, 27, "#a59478");
    r(10, 5, 12, 25, "#3b4c56");
    for (let n = 0; n < 4; n++) {
      r(8, 5 + n * 6, 3, 1, gold);
      r(21, 5 + n * 6, 3, 1, gold);
    }
    r(15, 12, 3, 8, gold);
    r(16, 13, 1, 3, light);
  } else if (kind === "Ghost") {
    // An armored, hooded revenant: dark face, cold eye light and torn wisps.
    const ink = "#172739",
      shade = "#355565",
      mid = "#648e98",
      pale = "#a9d3d0",
      glow = "#ddfff0";
    const rows = [
      "              aaaa              ",
      "            aabbbbaa            ",
      "           abcccccbba           ",
      "          abccddcccba           ",
      "          accaaaaccba           ",
      "         abca    acbba          ",
      "         acca    aaccba         ",
      "        abca      acbba         ",
      "       aabca      acbbaa        ",
      "     aabbccaa    aaccbbaa       ",
      "    abccccbbbaaaabbbcccbba      ",
      "   abccbccccbbbbcccccbccba      ",
      "  abccbabbccccccccbbabbccba     ",
      " abccba abbbccccbbba abccba     ",
      " abcca  abbbccccbbba  accba     ",
      " abca   abbbccccbbba   acba     ",
      " aca    abbbcccccbbba   aca     ",
      " aa    abbbcccccccbbba   aa     ",
      "       abbccccccccccba          ",
      "      abbcccccccccccbba         ",
      "      abccccccccccccba          ",
      "     abccccccccccccccba         ",
      "     abcccbccccbccccba          ",
      "    abccbaabcccbaaccba          ",
      "    abcca  abccba accba         ",
      "    abca    accba  acba         ",
      "     aa     acba    aa          ",
      "            aba                ",
      "             a                 ",
    ];
    const palette: Record<string, string> = {
      a: ink,
      b: shade,
      c: mid,
      d: pale,
    };
    rows.forEach((row, y) =>
      [...row].forEach((v, x) => {
        if (palette[v]) r(x, y + 1, 1, 1, palette[v]);
      }),
    );
    r(11, 6, 2, 1, pale);
    r(18, 6, 2, 1, pale);
    r(12, 7, 2, 2, glow);
    r(17, 7, 2, 2, glow);
    r(14, 10, 3, 1, shade);
    r(8, 12, 3, 1, pale);
    r(21, 12, 3, 1, pale);
    r(11, 14, 2, 6, pale);
    r(13, 17, 1, 6, mid);
    r(19, 14, 1, 8, pale);
    r(14, 13, 4, 1, glow);
    r(15, 14, 2, 3, pale);
    r(15, 14, 1, 1, glow);
    r(7, 23, 1, 3, pale);
    r(17, 25, 1, 3, pale);
    r(3, 25, 1, 1, mid);
    r(27, 20, 1, 2, pale);
    r(25, 28, 2, 1, mid);
  } else if (kind === "Villager" || kind === "VillagerKing") {
    // Three-quarter travelling merchant, with layered cloak, satchel and boots.
    const king = kind === "VillagerKing";
    const ink = "#202c35",
      cloth = king ? "#973e57" : "#526d68",
      clothShade = king ? "#542c48" : "#304747",
      clothLight = king ? "#d56a70" : "#90a18a",
      skin = "#dba379",
      skinLight = "#f3c99a",
      leather = "#795339";
    r(10, 27, 6, 3, ink);
    r(19, 26, 6, 4, ink);
    r(11, 25, 4, 3, "#5b4840");
    r(20, 25, 3, 3, "#5b4840");
    r(10, 29, 7, 1, "#967050");
    r(19, 29, 7, 1, "#967050");
    r(9, 13, 14, 14, ink);
    r(7, 15, 18, 9, ink);
    r(10, 13, 12, 13, clothShade);
    r(9, 15, 6, 9, cloth);
    r(11, 12, 8, 3, clothLight);
    r(12, 14, 9, 10, cloth);
    r(13, 16, 2, 8, clothLight);
    r(16, 19, 1, 6, clothShade);
    r(19, 15, 3, 11, clothShade);
    r(10, 25, 11, 2, cloth);
    r(9, 16, 2, 6, clothLight);
    r(8, 20, 2, 5, ink);
    r(8, 21, 2, 3, skin);
    r(8, 21, 1, 2, skinLight);
    r(22, 17, 3, 7, clothShade);
    r(23, 22, 2, 3, skin);
    // Diagonal leather harness and full satchel with brass clasp.
    for (let n = 0; n < 10; n++)
      r(11 + Math.floor(n / 2), 14 + n, 2, 1, leather);
    r(19, 20, 7, 7, ink);
    r(20, 20, 5, 6, leather);
    r(20, 20, 5, 2, "#b98c56");
    r(21, 22, 3, 1, "#d6ac68");
    r(22, 23, 1, 1, light);
    r(24, 24, 1, 2, "#503b32");
    // Hair and face in profile, with brow, cheek and a short grey beard.
    r(11, 4, 10, 10, ink);
    r(12, 5, 8, 8, skin);
    r(13, 6, 7, 3, skinLight);
    r(20, 8, 2, 3, skin);
    r(12, 5, 3, 4, "#694b36");
    r(12, 9, 1, 3, "#a17755");
    r(17, 8, 3, 1, "#78533d");
    r(18, 9, 1, 1, ink);
    r(20, 10, 1, 1, skinLight);
    r(16, 12, 5, 2, "#bbbaa1");
    r(17, 14, 2, 1, "#d9d4b3");
    r(18, 12, 2, 1, "#694c3e");
    if (king) {
      r(10, 4, 12, 2, gold);
      r(10, 1, 2, 4, gold);
      r(15, 0, 2, 5, light);
      r(20, 1, 2, 4, gold);
      r(15, 4, 2, 1, "#e46b65");
      r(10, 14, 2, 11, gold);
      r(20, 15, 1, 5, gold);
      r(9, 15, 2, 2, light);
      r(18, 16, 2, 2, gold);
    } else {
      // Worn ochre cap and one feather, rather than a flat block hat.
      r(10, 3, 10, 3, "#71543c");
      r(12, 2, 7, 3, "#a88451");
      r(13, 2, 5, 1, "#d2b573");
      r(9, 6, 14, 1, "#382f2d");
      r(10, 5, 11, 1, "#bc955b");
      r(11, 1, 1, 3, "#b8c3a0");
      r(10, 0, 1, 2, "#e0dec0");
    }
  } else {
    const king = kind === "VillagerKing",
      emperor = kind === "Emperor";
    r(8, 11, 17, 17, dark);
    r(10, 13, 13, 13, emperor ? "#70416b" : king ? "#934858" : "#6b8876");
    r(12, 14, 3, 10, king ? gold : "#aabd96");
    r(9, 24, 6, 7, dark);
    r(19, 24, 6, 7, dark);
    r(7, 14, 4, 10, "#caa47a");
    r(24, 14, 3, 9, "#b48c6c");
    r(10, 4, 13, 10, dark);
    r(11, 5, 11, 8, "#ddb68b");
    r(12, 6, 8, 2, "#f2d7a7");
    r(12, 9, 2, 2, dark);
    r(19, 9, 2, 2, dark);
    r(16, 12, 3, 1, "#895b4b");
    if (king || emperor) {
      r(8, 4, 17, 3, gold);
      r(8, 0, 3, 5, gold);
      r(15, 0, 3, 5, light);
      r(22, 0, 3, 5, gold);
      r(15, 4, 3, 2, "#e27c70");
      r(9, 18, 3, 9, gold);
      r(22, 18, 3, 9, gold);
    } else {
      r(8, 3, 17, 4, "#856e54");
      r(11, 1, 11, 4, "#b8a17b");
      r(23, 18, 5, 8, "#a68d60");
      r(24, 19, 3, 2, light);
      r(17, 15, 3, 4, "#d8c48a");
    }
  }
  return c;
}

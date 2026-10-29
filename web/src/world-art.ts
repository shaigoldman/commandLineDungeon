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
    r(10, 2, 12, 3, dark);
    r(7, 5, 18, 18, dark);
    r(5, 13, 22, 12, "#8ebebf");
    r(9, 4, 14, 18, "#cee6da");
    r(7, 21, 5, 8, "#cee6da");
    r(15, 22, 4, 7, "#cee6da");
    r(23, 20, 3, 6, "#8ebebf");
    r(11, 10, 3, 5, dark);
    r(19, 10, 3, 5, dark);
    r(15, 18, 3, 4, "#637b87");
    r(10, 6, 9, 2, "#f1f4df");
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

const cache = new Map<string, string>();
export function spellIcon(name: string, element: string) {
  const key = name + element;
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const x = c.getContext("2d")!;
  const color =
    element === "Fire"
      ? "#ed9873"
      : element === "Water"
        ? "#8ecfe8"
        : element === "Wind"
          ? "#9edfc7"
          : "#c8a9e9";
  const r = (a: number, b: number, w: number, h: number, c = color) => {
    x.fillStyle = c;
    x.fillRect(a, b, w, h);
  };
  const line = (
    a: number,
    b: number,
    dx: number,
    dy: number,
    n: number,
    c = color,
  ) => {
    for (let i = 0; i < n; i++) r(a + dx * i, b + dy * i, 2, 2, c);
  };
  if (name === "Summon") {
    for (let j = 0; j < 3; j++) {
      r(4 + j * 2, 25 - j * 2, 24 - j * 4, 2);
      r(5 + j * 2, 9 + j * 2, 2, 14 - j * 4);
      r(25 - j * 2, 9 + j * 2, 2, 14 - j * 4);
    }
    r(12, 4, 8, 5, "#f1dcb1");
    r(10, 11, 12, 8, "#d1ead7");
  } else if (name === "Alchemize") {
    r(7, 6, 18, 21, "#8c6264");
    r(10, 4, 12, 3, "#efce77");
    r(10, 12, 12, 10, "#e9c264");
    r(14, 10, 4, 14, "#fff0b1");
    r(8, 15, 16, 3, "#fff0b1");
    r(3, 3, 3, 3, "#f4a16d");
    r(26, 24, 3, 3, "#f4a16d");
  } else if (name === "Teleport") {
    for (const cx of [9, 23]) {
      r(cx - 3, 4, 6, 2);
      r(cx - 5, 7, 2, 17);
      r(cx + 3, 7, 2, 17);
      r(cx - 3, 26, 6, 2);
    }
    line(10, 16, 1, 0, 12, "#f7e8b1");
    r(17, 13, 2, 8, "#f7e8b1");
  } else if (name === "Gust") {
    for (let j = 0; j < 3; j++) {
      r(4, 7 + j * 7, 19 - j * 3, 2);
      r(22 - j * 3, 5 + j * 7, 4, 2);
      r(25 - j * 3, 7 + j * 7, 2, 4);
    }
  } else if (name === "Healing Winds" || name === "Heal") {
    r(13, 5, 6, 22);
    r(5, 13, 22, 6);
    if (name === "Healing Winds") {
      line(3, 5, 2, 1, 5, "#e7efbc");
      line(22, 23, -2, 1, 5, "#e7efbc");
    }
  } else if (name === "Light") {
    r(10, 10, 12, 12);
    r(13, 12, 6, 8, "#fff4bd");
    for (const [a, b] of [
      [15, 2],
      [15, 26],
      [2, 15],
      [26, 15],
    ])
      r(a, b, 3, 4);
    line(5, 5, 1, 1, 3);
    line(24, 5, -1, 1, 3);
    line(5, 24, 1, -1, 3);
    line(24, 24, -1, -1, 3);
  } else if (name === "Burn") {
    r(8, 17, 17, 10);
    r(11, 10, 12, 12);
    r(16, 3, 4, 10);
    r(7, 12, 4, 9);
    r(13, 19, 7, 8, "#ffe0a1");
  } else if (name === "Annihilate") {
    line(3, 3, 1, 1, 24);
    line(27, 3, -1, 1, 24);
    r(13, 3, 6, 26);
    r(3, 13, 26, 6);
    r(12, 12, 8, 8, "#fff0bd");
  } else if (name === "Cleanse") {
    for (const a of [8, 22]) {
      r(a, 7, 2, 3);
      r(a - 2, 10, 6, 6);
      r(a - 3, 16, 8, 6);
      r(a - 1, 22, 4, 2);
    }
    r(14, 3, 3, 8, "#f5f3d7");
    r(12, 5, 7, 3, "#f5f3d7");
  } else if (name === "Grow") {
    r(14, 15, 4, 14, "#c4a16c");
    r(6, 10, 10, 7);
    r(16, 5, 11, 9);
    r(9, 7, 7, 5);
    r(19, 3, 5, 4);
    r(3, 28, 26, 2, "#e6d69b");
  } else {
    r(6, 6, 20, 20);
    r(9, 9, 14, 14, "#344254");
    r(13, 10, 6, 3);
    r(17, 12, 3, 6);
    r(13, 17, 5, 3);
    r(13, 23, 3, 3, "#f3df9f");
  }
  cache.set(key, c.toDataURL());
  return cache.get(key)!;
}

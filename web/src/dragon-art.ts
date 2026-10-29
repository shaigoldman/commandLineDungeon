/** Original two-tile, red serpentine dragon with gold whiskers and batlike wings. */
export function dragonArt(scale = 2) {
  const c = document.createElement("canvas");
  c.width = 48 * scale;
  c.height = 32 * scale;
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false;
  const r = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const ink = "#1e2333",
    red = "#ba4453",
    bright = "#ec7861",
    shade = "#762d43",
    gold = "#e4bb6b",
    cream = "#ffe5a3";
  // High swept wings, deliberately wider than the serpentine torso.
  for (let i = 0; i < 13; i++) {
    r(9 + i, 4 + Math.floor(i / 3), 2, 14 - Math.floor(i / 2), ink);
    r(10 + i, 5 + Math.floor(i / 3), 1, 10 - Math.floor(i / 2), shade);
  }
  for (let i = 0; i < 11; i++) {
    r(27 + i, 3 + Math.floor(i / 2), 2, 15 - Math.floor(i / 2), ink);
    r(28 + i, 4 + Math.floor(i / 2), 1, 11 - Math.floor(i / 2), red);
  }
  for (let i = 0; i < 9; i++) {
    r(11 + i, 5 + i, 2, 2, gold);
    r(28 + i, 5 + i, 2, 2, bright);
  }
  const points = [
    [3, 26],
    [8, 27],
    [13, 25],
    [17, 21],
    [20, 18],
    [23, 18],
    [26, 21],
    [30, 23],
    [34, 21],
    [36, 17],
    [36, 12],
    [38, 9],
  ];
  for (const [x, y] of points) {
    r(x - 3, y - 3, 8, 8, ink);
  }
  for (const [x, y] of points) {
    r(x - 2, y - 2, 6, 6, red);
    r(x - 1, y - 2, 4, 2, bright);
    r(x - 1, y + 2, 5, 1, gold);
    r(x + 2, y, 1, 2, shade);
  }
  // Tail flame and segmented dorsal mane.
  r(0, 21, 2, 7, gold);
  r(1, 24, 4, 4, bright);
  r(4, 27, 3, 3, red);
  for (const [x, y] of points.slice(2)) {
    r(x - 1, y - 5, 3, 3, gold);
    r(x, y - 6, 1, 2, cream);
  }
  // Raised head, horns, long snout and trailing whiskers.
  r(34, 5, 11, 9, ink);
  r(36, 5, 8, 7, red);
  r(39, 9, 8, 6, ink);
  r(40, 10, 7, 3, bright);
  r(43, 13, 4, 1, gold);
  r(37, 7, 3, 2, cream);
  r(39, 7, 1, 2, ink);
  r(43, 11, 2, 1, ink);
  r(34, 1, 2, 6, gold);
  r(35, 0, 3, 2, cream);
  r(41, 1, 2, 5, gold);
  r(42, 0, 3, 2, cream);
  for (let i = 0; i < 6; i++) {
    r(42 - i, 14 + Math.floor(i / 2), 2, 1, cream);
    r(44 - i, 16 + Math.floor(i / 2), 2, 1, gold);
  }
  // Grasping claws over the coils.
  for (const [x, y] of [
    [17, 23],
    [29, 25],
  ]) {
    r(x, y, 6, 2, ink);
    r(x + 1, y, 4, 1, gold);
    r(x + 4, y + 1, 1, 3, cream);
    r(x + 2, y + 1, 1, 3, gold);
  }
  return c;
}

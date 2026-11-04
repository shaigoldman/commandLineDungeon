import type { Trap } from "../shared/types";
type Rect = (x: number, y: number, width: number, height: number, color: number) => void;
type Stone = { base: number; trim: number; shadow: number };
/** Floor-level openings, drawn within one 48px tile and below actors and loot. */
export function drawFloorTrap(
  kind: Trap["kind"],
  r: Rect,
  stone: Stone = { base: 0x727f7a, trim: 0xa1ab94, shadow: 0x34464f },
) {
  const dark = 0x101b23, abyss = 0x04090f;
  // Chipped stone lip, vertical inner walls, and an unlit bottom establish depth.
  r(5, 10, 38, 29, dark);
  r(6, 10, 36, 3, stone.trim);
  r(5, 13, 4, 22, stone.base);
  r(39, 13, 4, 23, stone.shadow);
  r(8, 35, 32, 4, stone.base);
  r(9, 36, 29, 1, stone.trim);
  r(9, 13, 30, 22, abyss);
  r(9, 13, 30, 5, stone.shadow);
  r(9, 18, 4, 15, 0x1b2930);
  r(13, 18, 23, 3, 0x142028);
  r(36, 18, 3, 17, 0x0c151d);
  r(13, 21, 23, 14, abyss);
  // Gaps and chips keep the opening integrated with the surrounding masonry.
  r(8, 10, 3, 2, stone.base);
  r(29, 10, 2, 3, stone.shadow);
  r(5, 25, 3, 2, stone.shadow);
  r(33, 35, 4, 2, dark);

  if (kind === "trip") {
    // Half of a wooden trapdoor has fallen into the opening; the right side is dark.
    r(9, 14, 13, 19, 0x382d27);
    r(10, 15, 5, 16, 0x876b4b);
    r(16, 15, 5, 13, 0x74573e);
    r(11, 16, 1, 13, 0xb3976b);
    r(17, 16, 1, 9, 0x9e8059);
    r(10, 19, 11, 2, 0x4d4439);
    r(10, 28, 5, 3, 0x654c38);
    r(8, 17, 4, 3, 0x929487);
    r(8, 28, 4, 3, 0x737d79);
    r(21, 24, 4, 2, 0x624b36);
    r(24, 26, 3, 2, 0x42372d);
  } else if (kind === "rust") {
    // A corroded grate, with missing bars exposing the pit underneath.
    r(9, 14, 28, 3, 0x5d4c40);
    r(10, 17, 3, 15, 0x8d6a4c);
    r(17, 17, 3, 9, 0x946c4a);
    r(24, 17, 3, 5, 0x795943);
    r(31, 17, 3, 14, 0x735c49);
    r(11, 18, 1, 11, 0xb18c61);
    r(18, 18, 1, 5, 0xb18c61);
    r(10, 29, 10, 3, 0x5d4938);
    r(20, 30, 5, 2, 0x40382f);
    r(25, 22, 2, 2, 0xb78052);
  } else if (kind === "poison") {
    // Stagnant green seepage is visible deep below the stone lip.
    r(15, 29, 18, 4, 0x243e31);
    r(18, 28, 11, 3, 0x41684a);
    r(20, 28, 4, 1, 0x8aa36a);
    r(29, 26, 2, 2, 0x6a8f58);
    r(16, 24, 2, 2, 0x476b48);
    r(11, 16, 2, 7, 0x425441);
    r(33, 15, 3, 2, 0x52644a);
  } else if (kind === "curse") {
    // Small rune cuts in the inner wall; the center remains an open black hole.
    const rune = 0x887194;
    r(15, 15, 6, 1, rune); r(17, 15, 1, 4, rune);
    r(29, 15, 1, 4, rune); r(27, 17, 5, 1, rune);
    r(10, 23, 2, 5, 0x55415f);
    r(21, 31, 9, 1, 0x48344f); r(24, 29, 2, 4, 0x665071);
  } else if (kind === "sap") {
    // A faint drain spiral sunk into the bottom of the shaft.
    r(16, 27, 16, 2, 0x315b65);
    r(16, 29, 3, 3, 0x315b65);
    r(20, 31, 10, 1, 0x447d83);
    r(29, 28, 2, 3, 0x447d83);
    r(21, 27, 2, 2, 0x83b8ac);
    r(26, 24, 2, 2, 0x4b8a8b);
    r(12, 15, 2, 4, 0x3b6266);
  } else if (kind === "fairy") {
    // Overgrown edges and a few distant pink motes, rather than a standing fairy.
    r(5, 14, 3, 10, 0x4b6650);
    r(7, 22, 4, 2, 0x6e8061);
    r(34, 11, 5, 2, 0x6e8061);
    r(37, 13, 2, 5, 0x4b6650);
    r(18, 28, 2, 2, 0xb888a5);
    r(28, 24, 2, 2, 0x8d6889);
    r(24, 31, 1, 1, 0xe2b8ce);
  } else {
    // Splintered hatch edge, claw marks, and eyes well below floor level.
    r(9, 14, 9, 4, 0x71543c);
    r(10, 18, 4, 7, 0x584332);
    r(14, 18, 5, 2, 0x96744c);
    r(31, 14, 6, 5, 0x634a36);
    r(33, 19, 3, 4, 0x4b392d);
    r(21, 27, 2, 1, 0xc29c68); r(28, 27, 2, 1, 0xc29c68);
    for (const x of [22, 26, 30]) r(x, 11, 1, 4, 0x403c36);
  }
}

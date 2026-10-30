import { describe, it, expect, vi, afterEach } from "vitest";
import { itemCanvas } from "../src/item-art";
import { itemArtKey } from "../src/item-art";
import { makeItem, newGame } from "../shared/engine";
// Rasterize the production rectangle drawing commands to catch paint-order regressions.
function pixels(kind: string, name: string) {
  const out = Array<string>(32 * 32).fill("");
  const ctx = {
    fillStyle: "",
    imageSmoothingEnabled: false,
    scale() {},
    fillRect(x: number, y: number, w: number, h: number) {
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++)
          if (xx >= 0 && xx < 32 && yy >= 0 && yy < 32)
            out[yy * 32 + xx] = this.fillStyle;
    },
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => ctx }),
  });
  itemCanvas({ kind, name }, 1);
  return out;
}
afterEach(() => vi.unstubAllGlobals());
describe("visible item raster artwork", () => {
  it("gives trade relics and other common lookalikes distinct art", () => {
    const g = newGame("Art", "Scout", "Wind", 0, 6);
    const names = ["Mana Rock", "Health Drain", "Mana Shard", "Mana Gem", "Mana Diamond", "Mana Pod", "Mana Channel", "Health Pot", "Gold Chalice", "Mystery Potion", "Poison Potion", "Super Potion", "Stairfinder", "Ultrastairfinder", "Energy Magnet", "Item Magnet", "Energy Generator", "Alchemy Book", "Magic Book", "Magic Wand", "Alchemy Wand", "Stealth Shoes", "Speedy Boots", "Invisibility Cloak", "Infinite Bag", "1 Gold Coin", "5 Gold Coins", "10 Gold Coins", "20 Gold Coins", "Cursed Gold"];
    const icons = names.map((name) => { const item = makeItem(g, name); return { key: itemArtKey(item), pixels: pixels(item.kind, item.name).join(",") }; });
    expect(new Set(icons.map((icon) => icon.key)).size).toBe(names.length);
    expect(new Set(icons.map((icon) => icon.pixels)).size).toBe(names.length);
  });
  it("renders a continuous sword blade rather than a hilt and isolated tip", () => {
    const p = pixels("weapon", "Iron Sword");
    expect(
      p.filter((c) => ["#a4bdc9", "#e1e8dc"].includes(c)).length,
    ).toBeGreaterThan(40);
    for (const [x, y] of [
      [14, 20],
      [19, 15],
      [24, 10],
    ])
      expect(["#a4bdc9", "#e1e8dc"]).toContain(p[y * 32 + x]);
  });
  it("preserves filled spearheads and pill bodies after outlining", () => {
    expect(
      pixels("weapon", "Iron Spear").filter((c) =>
        ["#a4bdc9", "#e1e8dc"].includes(c),
      ).length,
    ).toBeGreaterThan(15);
    expect(
      pixels("xp", "EXP Pill").filter((c) => ["#d77986", "#f1f3d5"].includes(c))
        .length,
    ).toBeGreaterThan(35);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { itemDefinitions } from "../shared/catalog";
import { makeItem, newGame } from "../shared/engine";
import { itemArtKey, itemCanvas } from "../src/item-art";
import type { Item } from "../shared/types";
function raster(item: Pick<Item, "kind" | "name" | "element">) {
  const pixels = Array<string>(32 * 32).fill("");
  const context = {
    fillStyle: "", imageSmoothingEnabled: false, scale() {},
    fillRect(x: number, y: number, width: number, height: number) {
      for (let yy = y; yy < y + height; yy++) for (let xx = x; xx < x + width; xx++)
        if (xx >= 0 && xx < 32 && yy >= 0 && yy < 32) pixels[yy * 32 + xx] = this.fillStyle;
    },
  };
  vi.stubGlobal("document", { createElement: () => ({ width: 0, height: 0, getContext: () => context }) });
  itemCanvas(item, 1);
  return pixels;
}
afterEach(() => vi.unstubAllGlobals());
describe("complete item artwork", () => {
  it("gives every catalog item visible artwork instead of the generic document", () => {
    const g = newGame("Art audit", "Scout", "Wind", 0, 109);
    const fallback = raster({ kind: "unknown-art-audit", name: "Unknown" }).join(",");
    const all = new Map<string, string[]>();
    for (const [name] of itemDefinitions) {
      const item = makeItem(g, name), pixels = raster(item);
      expect(pixels.filter(Boolean).length, item.name + " must not be blank").toBeGreaterThan(25);
      expect(pixels.join(","), item.name + " must not use placeholder art").not.toBe(fallback);
      if (item.kind !== "decoy") { const key = pixels.join(","); all.set(key, [...(all.get(key) || []), item.name]); }
    }
    const duplicates = [...all.values()].filter(names => new Set(names).size > 1);
    expect(duplicates).toEqual([]);
  });
  it("distinguishes every expansion item, upgraded staff, and related variant", () => {
    const g = newGame("Art variants", "Mage", "Wind", 0, 23);
    const names = [
      ...itemDefinitions.slice(0, itemDefinitions.findIndex(d => d[0] === "Stair Key") + 1).map(d => d[0]).filter(n => n !== "Decoy"),
      "Mana Potion", "Wind Staff", "Water Staff", "Fire Staff", "Mystery Staff", "Iron Sword", "Throwing Knife", "Bomb", "Piece of Trash",
    ];
    const seen = new Map<string, string>();
    for (const name of names) {
      const item = makeItem(g, name), pixels = raster(item).join(",");
      expect(seen.get(pixels), `${name} duplicates ${seen.get(pixels)}`).toBeUndefined();
      seen.set(pixels, name);
    }
  });
  it("keeps decoys visually identical to the real item, including old saves", () => {
    const g = newGame("Disguises", "Mage", "Water", 0, 35);
    for (const name of ["Elemental Staff", "Onyx Staff", "Diamond Apple", "Ghost Boots", "Magic Scales", "Health Doubler", "Obsidian Sword"]) {
      const real = makeItem(g, name), decoy = { ...real, kind: "decoy" };
      expect(itemArtKey(decoy)).toBe(itemArtKey(real));
      expect(raster(decoy)).toEqual(raster(real));
    }
  });
});

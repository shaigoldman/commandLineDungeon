import { afterEach, describe, it, expect, vi } from "vitest";
import { heroCanvas } from "../src/hero-art";
import { sprite } from "../src/art";
import { spellIcon } from "../src/spell-art";
import { spells } from "../shared/catalog";
function canvas() {
  const pixels = Array<string>(32 * 40).fill("");
  const ctx = {
    fillStyle: "",
    imageSmoothingEnabled: false,
    scale() {},
    fillRect(x: number, y: number, w: number, h: number) {
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++)
          if (xx >= 0 && xx < 32 && yy >= 0 && yy < 40)
            pixels[yy * 32 + xx] = this.fillStyle;
    },
  };
  return {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toDataURL: () => JSON.stringify(pixels),
    pixels,
  };
}
function setup() {
  vi.stubGlobal("document", { createElement: () => canvas() });
}
afterEach(() => vi.unstubAllGlobals());
describe("original animated map art", () => {
  it("provides four distinct shaded hero identities with visible silhouettes", () => {
    setup();
    const urls = ["Warrior", "Knight", "Scout", "Mage"].map((type) => {
      const c = heroCanvas(type, "idle", 1) as unknown as ReturnType<
        typeof canvas
      >;
      expect(c.pixels.filter(Boolean).length).toBeGreaterThan(230);
      return c.toDataURL();
    });
    expect(new Set(urls).size).toBe(4);
  });
  it("gives every hero real walking and attack frames", () => {
    setup();
    for (const type of ["Warrior", "Knight", "Scout", "Mage"])
      expect(
        new Set(
          ["idle", "left-step", "right-step", "attack"].map((pose) =>
            heroCanvas(type, pose as "idle", 1).toDataURL(),
          ),
        ).size,
      ).toBe(4);
  });
  it("gives tribes distinct chieftains and every spell an original unique sprite", () => {
    setup();
    expect(
      new Set(
        ["Pallu", "Awa", "Vraskii"].map((tribe) =>
          sprite("Chieftan", 1, tribe).toDataURL(),
        ),
      ).size,
    ).toBe(3);
    expect(new Set(spells.map((s) => spellIcon(s.name, s.element))).size).toBe(
      spells.length,
    );
  });
});

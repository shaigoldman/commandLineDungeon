import { it, expect, vi, afterEach } from "vitest";
import { dragonArt } from "../src/dragon-art";
afterEach(() => vi.unstubAllGlobals());
it("renders a wide red serpentine dragon with visible tail, wings and head across two tiles", () => {
  const pixels = new Map<string, string>();
  const ctx = {
    fillStyle: "",
    imageSmoothingEnabled: false,
    scale() {},
    fillRect(x: number, y: number, w: number, h: number) {
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++)
          pixels.set(xx + "," + yy, this.fillStyle);
    },
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => ctx }),
  });
  const c = dragonArt(1);
  expect(c.width).toBe(48);
  expect(c.height).toBe(32);
  const red = [...pixels].filter(([, color]) =>
    ["#ba4453", "#ec7861", "#762d43"].includes(color),
  );
  expect(red.length).toBeGreaterThan(250);
  for (const [low, high] of [
    [0, 8],
    [9, 24],
    [27, 38],
    [39, 47],
  ])
    expect(
      [...pixels.keys()].filter((k) => {
        const x = Number(k.split(",")[0]);
        return x >= low && x <= high;
      }).length,
    ).toBeGreaterThan(15);
});

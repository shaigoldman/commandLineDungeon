import { writeFileSync, mkdirSync } from "node:fs";
import { patterns, sprite } from "../src/art";
// Record the same pixel rectangles used at runtime into a standalone SVG atlas.
// A tiny canvas adapter keeps the exporter independent of native canvas packages.
let offset = 0,
  pixels = "";
const context = {
  fillStyle: "",
  scale: () => {},
  fillRect(x: number, y: number, w: number, h: number) {
    pixels += `<rect x="${offset + x}" y="${y}" width="${w}" height="${h}" fill="${this.fillStyle}"/>`;
  },
};
Object.defineProperty(globalThis, "document", {
  value: {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  },
});
const names = Object.keys(patterns);
names.forEach((name, n) => {
  offset = n * 24;
  sprite(name, 1);
});
mkdirSync("public/assets", { recursive: true });
writeFileSync(
  "public/assets/sprites.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="${names.length * 48}" height="64" viewBox="0 0 ${names.length * 24} 32" shape-rendering="crispEdges"><title>Original detailed dungeon sprite atlas</title>${pixels}</svg>`,
);
writeFileSync(
  "public/assets/atlas.json",
  JSON.stringify(
    Object.fromEntries(
      names.map((n, i) => [n, { x: i * 24, y: 0, width: 24, height: 32 }]),
    ),
    null,
    2,
  ) + "\n",
);
console.log("Exported detailed 24×32 sprite atlas.");

import { writeFileSync, mkdirSync } from "node:fs";
import { patterns, palette } from "../src/art";
mkdirSync("public/assets", { recursive: true });
const names = Object.keys(patterns);
let pixels = "";
for (let n = 0; n < names.length; n++) {
  patterns[names[n]].forEach((row, y) =>
    [...row].forEach((p, x) => {
      if (palette[p])
        pixels += `<rect x="${n * 16 + x}" y="${y}" width="1" height="1" fill="${palette[p]}"/>`;
    }),
  );
}
writeFileSync(
  "public/assets/sprites.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="${names.length * 64}" height="64" viewBox="0 0 ${names.length * 16} 16" shape-rendering="crispEdges"><title>Original dungeon sprite atlas</title>${pixels}</svg>`,
);
writeFileSync(
  "public/assets/atlas.json",
  JSON.stringify(
    Object.fromEntries(
      names.map((n, i) => [n, { x: i * 16, y: 0, width: 16, height: 16 }]),
    ),
    null,
    2,
  ),
);
console.log("Exported original sprite atlas.");

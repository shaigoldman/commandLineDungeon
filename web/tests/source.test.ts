import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import manifest from "../docs/source-manifest.json";
it("preserves every original Python source byte", () => {
  for (const [name, sha] of Object.entries(manifest)) {
    expect(
      createHash("sha256")
        .update(readFileSync("../" + name))
        .digest("hex"),
      name,
    ).toBe(sha);
  }
});

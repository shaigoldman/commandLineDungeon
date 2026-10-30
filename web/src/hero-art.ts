/** Original tactical-RPG map units: shaped cloaks, four-tone faces and hand-authored poses. */
export type HeroPose = "idle" | "left-step" | "right-step" | "attack";
export function heroCanvas(type: string, pose: HeroPose = "idle", scale = 2) {
  type = type === "D" ? "Scout" : type === "Over9000" ? "Warrior" : type;
  const c = document.createElement("canvas");
  c.width = 24 * scale;
  c.height = 32 * scale;
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  const r = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const o = "#152031",
    skin = type === "Knight" ? "#b77d58" : "#eac197",
    skinLight = type === "Knight" ? "#d9aa7d" : "#ffdfae",
    skinShade = type === "Knight" ? "#865a46" : "#b97f6b";
  const pal: Record<string, string[]> = {
    Warrior: ["#223957", "#3b6793", "#86afc2", "#2f6975", "#634336"],
    Knight: ["#414e67", "#8aabbb", "#e0e9db", "#a33b53", "#ded6bd"],
    Scout: ["#243d35", "#4f7851", "#a6b875", "#34583f", "#934b36"],
    Mage: ["#362c51", "#75548c", "#b895bc", "#594372", "#363451"],
  };
  const [dark, mid, light, cape, hair] = pal[type] || pal.Warrior;
  const attacking = pose === "attack",
    walking = pose === "left-step" || pose === "right-step",
    step = pose === "left-step" ? -1 : pose === "right-step" ? 1 : 0;
  // Irregular silhouette and split cape read as cloth, rather than a solid rectangle.
  r(6, 13, 13, 4, o);
  r(5, 17, 15, 8, o);
  r(4, 23, 7, 5, o);
  r(15, 23, 6, 6, o);
  r(6, 15, 12, 9, cape);
  r(5, 21, 5, 6, cape);
  r(16, 20, 4, 7, cape);
  r(5, 27, 3, 1, cape);
  r(18, 27, 2, 2, cape);
  r(7, 16, 2, 8, light);
  r(7, 23, 1, 3, mid);
  r(17, 18, 2, 7, dark);
  r(18, 23, 1, 3, mid);
  r(10, 16, 6, 8, dark);
  // Boots and knee highlights use distinct step silhouettes.
  if (type === "Mage") {
    r(7, 24, 12, 5, o);
    r(8, 24, 10, 4, mid);
    r(9, 25, 2, 2, light);
    r(15, 25, 2, 2, dark);
    r(8 - step, 28, 5, 3, o);
    r(14 + step, 28, 5, 3, o);
    r(9 - step, 28, 2, 1, "#b69f85");
  } else {
    r(8, 23, 4, 5, o);
    r(14, 23, 4, 5, o);
    r(9, 24, 2, 3, type === "Knight" ? mid : "#766044");
    r(15, 24, 2, 3, type === "Knight" ? mid : "#766044");
    r(7 + (step < 0 ? -1 : 0), 28 + (step > 0 ? -1 : 0), 6, 3, o);
    r(14 + (step > 0 ? 1 : 0), 28 + (step < 0 ? -1 : 0), 6, 3, o);
    r(8 + (step < 0 ? -1 : 0), 28 + (step > 0 ? -1 : 0), 3, 1, "#697b87");
    r(15 + (step > 0 ? 1 : 0), 28 + (step < 0 ? -1 : 0), 3, 1, "#697b87");
  }
  // Sculpted torso, asymmetric shoulders, diagonal leather harness and clasp.
  r(8, 13, 10, 11, o);
  r(9, 14, 8, 9, mid);
  r(10, 15, 2, 6, light);
  r(14, 16, 3, 6, dark);
  r(9, 21, 8, 3, dark);
  r(5, 14, 5, 5, o);
  r(6, 14, 4, 3, type === "Scout" ? "#ded1af" : mid);
  r(6, 14, 3, 1, light);
  r(6, 18, 3, 4, o);
  r(7, 19, 2, 3, skin);
  r(7, 19, 1, 2, skinLight);
  const armX = attacking ? 19 : 17,
    armY = attacking ? 17 : 15;
  r(armX, armY, 4, 5, o);
  r(armX, armY, 3, 3, mid);
  r(armX, armY, 3, 1, light);
  r(armX + 1, armY + 4, 2, 3, skin);
  r(armX + 1, armY + 4, 1, 2, skinLight);
  r(8, 22, 10, 2, "#553f37");
  r(12, 22, 3, 2, "#d7b772");
  r(12, 22, 2, 1, "#f8e7af");
  for (let i = 0; i < 5; i++) r(9 + i, 15 + i, 2, 2, "#886143");
  r(11, 16, 1, 1, "#d6ae6c");
  if (type === "Knight") {
    r(9, 15, 7, 6, mid);
    r(10, 15, 3, 4, light);
    r(9, 20, 7, 1, "#e0bd73");
    r(6, 14, 4, 3, light);
    r(17, 14, 4, 3, light);
    r(15, 16, 2, 5, "#5c7693");
    r(8, 13, 11, 2, "#c5a263");
  }
  // Shadowed neck and an eight-pixel face with brows, nose, ear and glints.
  r(10, 10, 7, 5, o);
  r(11, 11, 5, 3, skinShade);
  r(8, 4, 10, 8, o);
  r(9, 5, 8, 7, skinShade);
  r(9, 5, 7, 6, skin);
  r(10, 6, 5, 4, skinLight);
  r(8, 7, 2, 3, skin);
  r(16, 7, 2, 3, skinShade);
  r(10, 8, 2, 1, "#50413c");
  r(14, 8, 2, 1, "#50413c");
  r(10, 9, 1, 1, type === "Scout" ? "#648248" : "#243748");
  r(14, 9, 1, 1, type === "Mage" ? "#8d6796" : "#243748");
  r(13, 9, 1, 2, skinShade);
  r(12, 12, 3, 1, skinShade);
  if (type === "Mage") {
    r(7, 8, 2, 8, hair);
    r(17, 7, 2, 10, hair);
    r(8, 11, 1, 5, "#64618a");
    r(17, 10, 1, 6, "#64618a");
    r(3, 6, 18, 3, o);
    r(4, 6, 18, 2, dark);
    r(7, 3, 12, 4, o);
    r(8, 3, 10, 3, mid);
    r(10, 0, 7, 4, o);
    r(11, 0, 5, 4, mid);
    r(12, 1, 2, 2, light);
    r(7, 6, 12, 1, "#b89562");
    r(11, 4, 3, 2, "#ecd080");
    r(12, 3, 2, 2, "#ecd080");
    r(13, 3, 1, 2, mid);
    r(12, 15, 3, 4, "#d8ba78");
    r(13, 16, 2, 2, "#7dd3d7");
    r(12, 24, 3, 1, "#d3b57d");
  } else {
    r(8, 3, 10, 4, hair);
    r(7, 4, 3, 4, hair);
    r(16, 4, 3, 5, hair);
    r(10, 1, 5, 3, hair);
    r(14, 2, 5, 2, hair);
    r(9, 2, 3, 2, hair);
    const hairLight =
      type === "Knight" ? "#fff0d5" : type === "Scout" ? "#c07e4d" : "#a67550";
    r(10, 3, 4, 1, hairLight);
    r(9, 4, 3, 1, hairLight);
    r(14, 3, 2, 1, hairLight);
    r(9, 6, 2, 1, hair);
    if (type === "Scout") {
      r(6, 7, 3, 2, skin);
      r(17, 7, 3, 2, skin);
      r(7, 13, 11, 3, cape);
      r(8, 13, 8, 1, "#a7b77b");
      r(17, 9, 3, 11, "#704636");
      r(19, 5, 1, 8, "#e1d5b3");
      r(21, 6, 1, 7, "#c7c2a3");
      r(9, 15, 2, 5, "#a57c4e");
    } else if (type === "Warrior") {
      r(7, 13, 12, 3, cape);
      r(8, 13, 9, 1, "#6dabb0");
      r(14, 14, 2, 2, "#dfbd71");
      r(17, 14, 4, 3, "#b6c9cf");
      r(18, 14, 2, 1, "#f1efda");
      r(16, 1, 3, 2, hair);
      r(18, 0, 2, 2, hair);
    } else {
      r(7, 13, 4, 4, cape);
      r(17, 13, 5, 5, cape);
      r(18, 14, 3, 1, "#d9787a");
      r(15, 14, 2, 2, "#e9c473");
      r(11, 3, 5, 1, "#e7d4b7");
    }
  }
  // A small cloth shift keeps the walking frames lively without redrawing identities.
  if (walking) {
    r(step < 0 ? 4 : 19, 25, 2, 3, cape);
    r(step < 0 ? 18 : 5, 26, 2, 2, o);
  }
  return c;
}

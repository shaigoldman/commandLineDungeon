import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Sprite, Texture } from "pixi.js";
import type { Game } from "../shared/types";
import { sprite, patterns } from "./art";
const TILE = 48;
const noise = (x: number, y: number, s = 0) =>
  Math.abs(Math.imul(x + 71 + s, 374761393) ^ Math.imul(y + 13, 668265263)) >>>
  0;
export function DungeonView({
  game,
  onMove,
}: {
  game: Game;
  onMove: (dx: number, dy: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    gameRef = useRef(game),
    moveRef = useRef(onMove);
  gameRef.current = game;
  moveRef.current = onMove;
  useEffect(() => {
    let disposed = false;
    let cols = window.innerWidth <= 700 ? 12 : 20;
    let rows = window.innerWidth <= 700 ? 8 : 10;
    const app = new Application();
    void app
      .init({
        width: TILE * cols,
        height: TILE * rows,
        background: "#121c28",
        antialias: false,
        resolution: 1,
      })
      .then(() => {
        if (disposed) {
          app.destroy(true);
          return;
        }
        host.current!.appendChild(app.canvas);
        app.canvas.setAttribute(
          "aria-label",
          "Dungeon map. Use arrow keys or directional buttons to move.",
        );
        const textures = Object.fromEntries(
          Object.keys(patterns).map((k) => [k, Texture.from(sprite(k, 2))]),
        );
        let last = -1,
          fxStart = -1000;
        let camera = { x: 0, y: 0 },
          target = { x: 0, y: 0 };
        let effect: Graphics, flame: Graphics;
        let units: { s: Sprite; x: number; y: number; phase: number }[] = [],
          torches: { x: number; y: number }[] = [];
        const render = () => {
          const g = gameRef.current;
          const nextCols = window.innerWidth <= 700 ? 12 : 20,
            nextRows = window.innerWidth <= 700 ? 8 : 10;
          const resized = cols !== nextCols || rows !== nextRows;
          if (last === g.revision && !resized) return;
          if (resized) {
            cols = nextCols;
            rows = nextRows;
            app.renderer.resize(cols * TILE, rows * TILE);
          }
          const previous = last;
          last = g.revision;
          if (
            previous >= 0 &&
            g.log
              .slice(-3)
              .some((l) => l.includes("damage") || l.includes("Critical"))
          ) {
            fxStart = performance.now();
            const a = g.monsters.find((m) => m.id === g.combat) || g.player;
            target = { x: a.x * TILE + 24, y: a.y * TILE + 12 };
          }
          camera = {
            x: Math.max(
              0,
              Math.min(30 - cols, g.player.x - Math.floor(cols / 2)),
            ),
            y: Math.max(
              0,
              Math.min(15 - rows, g.player.y - Math.floor(rows / 2)),
            ),
          };
          app.stage
            .removeChildren()
            .forEach((c) => c.destroy({ children: true }));
          const world = new Container();
          world.x = -camera.x * TILE;
          world.y = -camera.y * TILE;
          app.stage.addChild(world);
          const tiles = new Graphics();
          world.addChild(tiles);
          units = [];
          torches = [];
          const visible = (x: number, y: number) =>
            g.light[y]?.[x] ||
            (Math.abs(x - g.player.x) / 2) ** 2 + (y - g.player.y) ** 2 <
              g.sight ** 2;
          const rect = (
            x: number,
            y: number,
            w: number,
            h: number,
            c: number,
            alpha = 1,
          ) => tiles.rect(x, y, w, h).fill({ color: c, alpha });
          for (let y = camera.y; y < camera.y + rows; y++)
            for (let x = camera.x; x < camera.x + cols; x++) {
              const xx = x * TILE,
                yy = y * TILE,
                n = noise(x, y),
                wall = g.tiles[y][x];
              if (!visible(x, y)) {
                rect(xx, yy, TILE, TILE, 0x131e2a);
                for (let i = 0; i < 3; i++)
                  if ((n >>> (i * 3)) % 3 === 0)
                    rect(
                      xx + ((n >>> (i * 4)) % 22) * 2,
                      yy + ((n >>> (i * 5)) % 22) * 2,
                      2,
                      2,
                      0x1c2a35,
                    );
                continue;
              }
              if (wall) {
                rect(xx, yy, TILE, TILE, 0x202b37);
                for (let row = 0; row < 2; row++)
                  for (let col = -1; col < 2; col++) {
                    const left = Math.max(0, col * 32 + (row % 2) * 16),
                      right = Math.min(48, col * 32 + (row % 2) * 16 + 30);
                    if (right <= left) continue;
                    const top = yy + row * 15;
                    rect(
                      xx + left,
                      top,
                      right - left,
                      14,
                      row === 0 ? 0x637779 : 0x4f6269,
                    );
                    rect(
                      xx + left + 2,
                      top + 1,
                      Math.max(0, right - left - 3),
                      2,
                      row === 0 ? 0x91a099 : 0x758983,
                    );
                    rect(xx + left, top + 12, right - left, 2, 0x34464f);
                  }
                rect(xx, yy + 30, 48, 16, 0x354952);
                rect(xx + 2, yy + 31, 44, 2, 0x536b6c);
                rect(xx, yy + 44, 48, 4, 0x172b37);
                if (n % 3 === 0) {
                  rect(xx + 12, yy + 5, 2, 8, 0x40575c);
                  rect(xx + 14, yy + 11, 6, 2, 0x40575c);
                }
                if (n % 4 === 0) {
                  for (let j = 0; j < 6; j++)
                    rect(
                      xx + ((j * 7 + n) % 21) * 2,
                      yy + 32 + (j % 3) * 2,
                      4,
                      2,
                      j % 2 ? 0x6c8567 : 0x486c59,
                    );
                }
                if (g.tiles[y + 1]?.[x] === 0 && n % 7 === 0) {
                  torches.push({ x: xx + 22, y: yy + 26 });
                  rect(xx + 18, yy + 24, 10, 16, 0x182737);
                  rect(xx + 20, yy + 25, 6, 10, 0xa78a57);
                  rect(xx + 18, yy + 33, 10, 3, 0x4a3932);
                }
              } else {
                rect(xx, yy, 48, 48, g.floor % 3 === 1 ? 0x647b67 : 0x727f7a);
                for (let row = 0; row < 3; row++) {
                  const shift = ((row + y) % 2) * 12;
                  for (let col = -1; col < 3; col++) {
                    const left = Math.max(0, col * 24 + shift),
                      right = Math.min(48, col * 24 + shift + 23);
                    if (left >= right) continue;
                    const top = yy + row * 16,
                      c = [0x79877b, 0x718277, 0x849183, 0x6d7b73][
                        (n + row + col + 4) % 4
                      ];
                    rect(xx + left, top, right - left, 15, c);
                    rect(
                      xx + left + 1,
                      top + 1,
                      Math.max(1, right - left - 2),
                      1,
                      0xa1ab94,
                    );
                    rect(xx + left, top + 14, right - left, 1, 0x52655e);
                    rect(xx + left, top, 1, 14, 0x5d7167);
                  }
                }
                if (g.tiles[y - 1]?.[x] === 1) {
                  rect(xx, yy, 48, 7, 0x172e39, 0.35);
                  rect(xx, yy + 7, 48, 3, 0x233b42, 0.15);
                }
                if (n % 3 === 0) {
                  rect(xx + 8, yy + 20, 2, 5, 0x526b63);
                  rect(xx + 10, yy + 25, 6, 2, 0x526b63);
                  rect(xx + 14, yy + 27, 2, 5, 0x526b63);
                }
                if (n % 5 === 0) {
                  rect(xx + 30, yy + 34, 6, 2, 0x4b705c);
                  rect(xx + 34, yy + 32, 4, 2, 0x738d66);
                  rect(xx + 38, yy + 34, 4, 2, 0x4b705c);
                }
                if (n % 13 === 0) {
                  rect(xx + 10, yy + 33, 22, 5, 0x536d71);
                  rect(xx + 14, yy + 32, 12, 2, 0x8eafb0);
                  rect(xx + 22, yy + 34, 4, 1, 0xbac8b8);
                }
              }
            }
          if (visible(g.stairs.x, g.stairs.y)) {
            const x = g.stairs.x * TILE,
              y = g.stairs.y * TILE;
            rect(x + 3, y + 2, 42, 44, 0x203342);
            rect(x + 5, y + 2, 38, 2, 0xc4b17e);
            for (let n = 0; n < 6; n++) {
              rect(
                x + 7 + n * 2,
                y + 7 + n * 6,
                34 - n * 4,
                5,
                g.stairs.locked ? 0xa09572 : 0xaab7a0,
              );
              rect(x + 8 + n * 2, y + 7 + n * 6, 32 - n * 4, 1, 0xe2dbb2);
              rect(x + 7 + n * 2, y + 11 + n * 6, 34 - n * 4, 1, 0x5d7776);
            }
            if (g.stairs.locked) {
              rect(x + 20, y + 16, 9, 8, 0x614b37);
              rect(x + 22, y + 13, 5, 5, 0xd4b968);
              rect(x + 24, y + 19, 2, 3, 0x272e34);
            }
          }
          for (const p of g.pods)
            if (visible(p.x, p.y)) {
              const x = p.x * TILE,
                y = p.y * TILE,
                c = p.max ? 0xaf89ce : 0x74b9b2;
              rect(x + 12, y + 35, 25, 4, 0x354e50, 0.5);
              rect(x + 20, y + 8, 8, 3, 0xe1c68b);
              rect(x + 22, y + 11, 4, 4, 0x8b765b);
              rect(x + 17, y + 15, 14, 3, 0xd0dfcb);
              rect(x + 14, y + 18, 20, 15, 0x354654);
              rect(x + 16, y + 18, 16, 15, c);
              rect(x + 19, y + 17, 5, 13, 0xd8f1d7);
              rect(x + 17, y + 32, 14, 3, 0x5b827f);
              rect(x + 21, y + 35, 6, 1, 0x293e45);
            }
          for (const l of g.loot)
            if (visible(l.x, l.y)) {
              const x = l.x * TILE,
                y = l.y * TILE;
              rect(x + 8, y + 35, 32, 5, 0x344846, 0.6);
              rect(x + 9, y + 19, 30, 17, 0x392e32);
              rect(x + 10, y + 21, 28, 13, 0x875b40);
              rect(x + 10, y + 18, 28, 9, 0xb38550);
              rect(x + 12, y + 16, 24, 3, 0xd2a96b);
              rect(x + 12, y + 27, 24, 2, 0x54392e);
              rect(x + 13, y + 18, 3, 16, 0xe1bc74);
              rect(x + 32, y + 18, 3, 16, 0xe1bc74);
              rect(x + 22, y + 25, 6, 7, 0xe6c97b);
              rect(x + 24, y + 27, 2, 3, 0x534b45);
              rect(x + 17, y + 21, 12, 1, 0xe0b77a);
            }
          for (const a of [...g.monsters, g.player].sort((a, b) => a.y - b.y))
            if (visible(a.x, a.y)) {
              const x = a.x * TILE,
                y = a.y * TILE;
              const shadow = new Graphics()
                .ellipse(x + 24, y + 40, a.className === "Dragon" ? 23 : 15, 5)
                .fill({ color: 0x172b35, alpha: 0.45 });
              world.addChild(shadow);
              const s = new Sprite(textures[a.className] || textures.Warrior);
              s.x = x;
              s.y = y - 19;
              world.addChild(s);
              units.push({ s, x: s.x, y: s.y, phase: noise(a.x, a.y) % 10 });
              const mark = new Graphics();
              if (a.id === "player") {
                mark
                  .moveTo(x + 16, y + 45)
                  .lineTo(x + 32, y + 45)
                  .stroke({ color: 0x8cd6e6, width: 2 });
                mark
                  .moveTo(x + 12, y + 42)
                  .lineTo(x + 12, y + 46)
                  .lineTo(x + 16, y + 46)
                  .stroke({ color: 0xdde9be, width: 2 });
                mark
                  .moveTo(x + 36, y + 42)
                  .lineTo(x + 36, y + 46)
                  .lineTo(x + 32, y + 46)
                  .stroke({ color: 0xdde9be, width: 2 });
              } else if (a.boss) {
                mark
                  .rect(x + 20, y - 23, 8, 3)
                  .fill(0xe4c47c)
                  .rect(x + 19, y - 25, 2, 4)
                  .fill(0xe4c47c)
                  .rect(x + 27, y - 25, 2, 4)
                  .fill(0xe4c47c)
                  .rect(x + 23, y - 27, 2, 4)
                  .fill(0xf6dea4);
              }
              world.addChild(mark);
            }
          flame = new Graphics();
          effect = new Graphics();
          world.addChild(flame, effect);
        };
        app.ticker.add(() => {
          render();
          const now = performance.now();
          const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          for (const u of units) {
            u.s.y =
              u.y + (reduced ? 0 : Math.floor(Math.sin(now / 350 + u.phase)));
          }
          if (flame) {
            flame.clear();
            for (const t of torches) {
              const sway = reduced
                ? 0
                : Math.floor(Math.sin(now / 140 + t.x) * 2);
              flame
                .circle(t.x + 2, t.y - 3, 15)
                .fill({ color: 0xd9a15a, alpha: 0.13 })
                .rect(t.x - 3, t.y - 7, 10, 9)
                .fill(0xcc7347)
                .rect(t.x - 1 + sway, t.y - 12, 6, 12)
                .fill(0xf4ba65)
                .rect(t.x + sway, t.y - 8, 3, 7)
                .fill(0xffedb0);
            }
          }
          if (effect) {
            effect.clear();
            const t = (now - fxStart) / 500;
            if (t >= 0 && t < 1 && !reduced) {
              const x = target.x,
                y = target.y;
              for (let n = 0; n < 3; n++) {
                const offset = n * 3;
                effect
                  .moveTo(x - 20 + t * 22 - offset, y + 20 - t * 22)
                  .lineTo(x + 21 - offset, y - 20)
                  .stroke({
                    color: n === 0 ? 0xffffda : n === 1 ? 0xf3d083 : 0xb7e3df,
                    width: (4 - n) * (1 - t),
                    alpha: 1 - t,
                  });
              }
              for (let n = 0; n < 8; n++) {
                const angle = (n * Math.PI) / 4;
                effect
                  .rect(
                    Math.round(x + Math.cos(angle) * t * 38),
                    Math.round(y + Math.sin(angle) * t * 30),
                    4,
                    2,
                  )
                  .fill({ color: n % 2 ? 0xffdf98 : 0xc4e7db, alpha: 1 - t });
              }
            }
          }
        });
        app.canvas.addEventListener("pointerdown", (e) => {
          const r = app.canvas.getBoundingClientRect(),
            p = gameRef.current.player;
          const x =
              Math.floor(((e.clientX - r.left) / r.width) * cols) + camera.x,
            y = Math.floor(((e.clientY - r.top) / r.height) * rows) + camera.y,
            dx = x - p.x,
            dy = y - p.y;
          if (Math.abs(dx) > Math.abs(dy)) moveRef.current(Math.sign(dx), 0);
          else if (dy) moveRef.current(0, Math.sign(dy));
        });
      });
    return () => {
      disposed = true;
      if (app.renderer) app.destroy(true, { children: true, texture: true });
    };
  }, []);
  return <div className="map" ref={host} />;
}

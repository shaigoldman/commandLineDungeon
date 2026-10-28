import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Sprite, Texture } from "pixi.js";
import type { Game } from "../shared/types";
import { sprite, patterns } from "./art";
export function DungeonView({
  game,
  onMove,
}: {
  game: Game;
  onMove: (dx: number, dy: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    ref = useRef<Application | null>(null),
    gameRef = useRef(game),
    moveRef = useRef(onMove);
  gameRef.current = game;
  moveRef.current = onMove;
  useEffect(() => {
    let disposed = false;
    const app = new Application();
    void app
      .init({
        width: 960,
        height: 480,
        background: "#101923",
        antialias: false,
        resolution: 1,
      })
      .then(() => {
        if (disposed) {
          app.destroy(true);
          return;
        }
        ref.current = app;
        host.current!.appendChild(app.canvas);
        app.canvas.setAttribute(
          "aria-label",
          "Dungeon map. Use arrow keys or the directional buttons to move.",
        );
        const textures = Object.fromEntries(
          Object.keys(patterns).map((k) => [k, Texture.from(sprite(k, 2))]),
        );
        let last = -1;
        let fxStart = -1000;
        let fxTarget = { x: 0, y: 0 };
        let effect: Graphics | undefined;
        let actors = new Container();
        app.stage.addChild(actors);
        const render = () => {
          const g = gameRef.current;
          if (g.revision === last) return;
          last = g.revision;
          if (
            g.log
              .slice(-3)
              .some((l) => l.includes("damage") || l.includes("Critical"))
          ) {
            fxStart = performance.now();
            const target =
              g.monsters.find((m) => m.id === g.combat) || g.player;
            fxTarget = { x: target.x * 32 + 16, y: target.y * 32 + 13 };
          }
          app.stage
            .removeChildren()
            .forEach((c) => c.destroy({ children: true }));
          const tiles = new Graphics();
          app.stage.addChild(tiles);
          actors = new Container();
          app.stage.addChild(actors);
          const visible = (x: number, y: number) =>
            g.light[y]?.[x] ||
            (Math.abs(x - g.player.x) / 2) ** 2 + (y - g.player.y) ** 2 <
              g.sight ** 2;
          for (let y = 0; y < 15; y++)
            for (let x = 0; x < 30; x++) {
              const xx = x * 32,
                yy = y * 32;
              if (!visible(x, y)) {
                tiles.rect(xx, yy, 32, 32).fill(0x101923);
                if ((x * 17 + y * 7) % 13 === 0)
                  tiles.rect(xx + 10, yy + 12, 2, 2).fill(0x19232b);
                continue;
              }
              const wall = g.tiles[y][x];
              if (wall) {
                tiles
                  .rect(xx, yy, 32, 32)
                  .fill(0x283443)
                  .rect(xx + 1, yy + 1, 30, 23)
                  .fill(0x465565)
                  .rect(xx + 2, yy + 2, 28, 2)
                  .fill(0x637080)
                  .rect(xx + 1, yy + 24, 30, 7)
                  .fill(0x202c39)
                  .rect(xx + 15 + (y % 2 ? 8 : -6), yy + 3, 1, 20)
                  .fill(0x2b3948);
              } else {
                tiles
                  .rect(xx, yy, 32, 32)
                  .fill((x + y) % 2 ? 0x65716f : 0x6b7773)
                  .rect(xx, yy, 32, 1)
                  .fill(0x788580)
                  .rect(xx, yy, 1, 32)
                  .fill(0x53625f);
                if ((x * 7 + y * 3) % 9 === 0)
                  tiles.rect(xx + 6, yy + 22, 8, 2).fill(0x536761);
              }
            }
          if (visible(g.stairs.x, g.stairs.y)) {
            const x = g.stairs.x * 32,
              y = g.stairs.y * 32;
            tiles.rect(x + 3, y + 3, 26, 26).fill(0x243846);
            for (let n = 0; n < 4; n++)
              tiles
                .rect(x + 5, y + 6 + n * 5, 22 - n * 3, 3)
                .fill(g.stairs.locked ? 0xb69b60 : 0x9daca2);
          }
          for (const pod of g.pods)
            if (visible(pod.x, pod.y)) {
              tiles
                .circle(pod.x * 32 + 16, pod.y * 32 + 17, 8)
                .fill(pod.max ? 0xb292d4 : 0x6ebec0)
                .circle(pod.x * 32 + 14, pod.y * 32 + 14, 3)
                .fill(0xd7f1d9);
            }
          for (const l of g.loot)
            if (visible(l.x, l.y)) {
              const x = l.x * 32,
                y = l.y * 32;
              tiles
                .rect(x + 8, y + 12, 17, 13)
                .fill(0x483929)
                .rect(x + 8, y + 11, 17, 6)
                .fill(0xb58a50)
                .rect(x + 15, y + 15, 3, 6)
                .fill(0xf3cf78);
            }
          for (const a of [...g.monsters, g.player])
            if (visible(a.x, a.y)) {
              const s = new Sprite(textures[a.className] || textures.Warrior);
              s.x = a.x * 32;
              s.y = a.y * 32 - 3;
              actors.addChild(s);
              const mark = new Graphics();
              if (a.id === "player")
                mark.roundRect(s.x + 3, s.y + 28, 26, 4, 2).fill(0x84cef2);
              else if (a.boss)
                mark.rect(s.x + 6, s.y + 2, 20, 2).fill(0xe2b16a);
              actors.addChild(mark);
            }
          effect = new Graphics();
          app.stage.addChild(effect);
        };
        app.ticker.add(() => {
          render();
          if (effect) {
            effect.clear();
            const t = (performance.now() - fxStart) / 450;
            if (t >= 0 && t < 1) {
              const length = Math.floor(t * 24),
                x = fxTarget.x,
                y = fxTarget.y;
              effect
                .moveTo(x - 12 + length, y + 12 - length)
                .lineTo(x + 12, y - 12)
                .stroke({ color: 0xffedb7, width: 3 * (1 - t), alpha: 1 - t });
              for (let n = 0; n < 6; n++) {
                const angle = (n * Math.PI) / 3;
                effect
                  .rect(
                    Math.round(x + Math.cos(angle) * t * 25),
                    Math.round(y + Math.sin(angle) * t * 25),
                    3,
                    3,
                  )
                  .fill({ color: 0xe8bc75, alpha: 1 - t });
              }
            }
          }
          actors.y = Math.floor(Math.sin(app.ticker.lastTime / 300) * 1);
        });
        app.canvas.addEventListener("pointerdown", (e) => {
          const r = app.canvas.getBoundingClientRect(),
            g = gameRef.current;
          const x = Math.floor(((e.clientX - r.left) / r.width) * 30),
            y = Math.floor(((e.clientY - r.top) / r.height) * 15),
            dx = x - g.player.x,
            dy = y - g.player.y;
          if (Math.abs(dx) > Math.abs(dy)) moveRef.current(Math.sign(dx), 0);
          else if (dy) moveRef.current(0, Math.sign(dy));
        });
      });
    return () => {
      disposed = true;
      ref.current = null;
      if (app.renderer) app.destroy(true, { children: true, texture: true });
    };
  }, []);
  return <div className="map" ref={host} />;
}

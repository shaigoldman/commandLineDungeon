/** Reproducible headless playthroughs plus targeted game-state probes. No server/save data is touched. */
import {
  newGame,
  act,
  availableSpells,
  makeItem,
  makeMonster,
  generateFloor,
} from "../shared/engine";
import type { Game, Action } from "../shared/types";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
export function violations(g: Game): string[] {
  const errors: string[] = [];
  const p = g.player;
  const actors = [p, ...g.monsters];
  if (g.status === "playing" && p.hp <= 0)
    errors.push("living-player-without-health");
  if (p.stats.Health <= 0 || p.hp > p.stats.Health)
    errors.push("invalid-player-health-bounds");
  if (p.stats.Mana < 0 || p.stats.Mana > 10) errors.push("invalid-mana");
  if (g.monsters.some((m) => m.hp <= 0)) errors.push("unremoved-dead-monster");
  if (
    actors.some(
      (a) =>
        !Number.isInteger(a.x) ||
        !Number.isInteger(a.y) ||
        g.tiles[a.y]?.[a.x] !== 0,
    )
  )
    errors.push("invalid-actor-position");
  if (new Set(actors.map((a) => `${a.x},${a.y}`)).size !== actors.length)
    errors.push("overlapping-actors");
  if (
    actors.some(
      (a) =>
        !Number.isFinite(a.hp) ||
        Object.values(a.stats).some((n) => !Number.isFinite(n)),
    )
  )
    errors.push("nonfinite-stat");
  const owned = [
    ...g.inventory,
    ...p.weapons,
    ...g.monsters.flatMap((m) => m.weapons),
    ...g.loot.map((l) => l.item),
  ];
  if (new Set(owned.map((i) => i.id)).size !== owned.length)
    errors.push("duplicated-item-ownership");
  if (g.inventory.length + Number(p.weapons.length > 0) > g.capacity)
    errors.push("inventory-over-capacity");
  if (g.combat && !g.monsters.some((m) => m.id === g.combat))
    errors.push("dangling-combat");
  if (
    g.pendingLoot &&
    !g.loot.some(
      (l) => l.item.id === g.pendingLoot!.id && l.x === p.x && l.y === p.y,
    )
  )
    errors.push("stale-treasure-prompt");
  if (g.stairs.locked && g.keys === 0 && !g.monsters.some((m) => m.key))
    errors.push("locked-floor-without-key");
  if (
    owned.some(
      (i) => i.kind === "weapon" && (!Number.isFinite(i.uses) || i.uses! <= 0),
    )
  )
    errors.push("invalid-weapon-durability");
  return errors;
}
function direction(g: Game, tx: number, ty: number): Action | undefined {
  const queue: { x: number; y: number; first?: [number, number] }[] = [
      { x: g.player.x, y: g.player.y },
    ],
    seen = new Set<string>([`${g.player.x},${g.player.y}`]);
  for (let n = 0; n < queue.length; n++) {
    const c = queue[n];
    if (c.x === tx && c.y === ty)
      return c.first
        ? { type: "move", dx: c.first[0], dy: c.first[1] }
        : undefined;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = c.x + dx,
        y = c.y + dy,
        k = `${x},${y}`;
      if (g.tiles[y]?.[x] !== 0 || seen.has(k)) continue;
      seen.add(k);
      queue.push({ x, y, first: c.first || [dx, dy] });
    }
  }
}
export function simulate(
  seeds = 50,
  steps = 600,
  reportPath = "work/simulation-report.json",
  powered = false,
) {
  const report = {
    powered,
    seedsPerBuild: seeds,
    maxActionsPerGame: steps,
    games: 0,
    actions: 0,
    rejections: 0,
    rejectionReasons: {} as Record<string, number>,
    wins: 0,
    deaths: 0,
    capped: 0,
    coverage: {} as Record<string, number>,
    byBuild: {} as Record<
      string,
      {
        games: number;
        wins: number;
        deaths: number;
        capped: number;
        highestFloor: number;
      }
    >,
    findings: {} as Record<
      string,
      {
        count: number;
        first: {
          build: string;
          seed: number;
          step: number;
          action: Action;
          message?: string;
        };
      }
    >,
  };
  const finding = (
    kind: string,
    build: string,
    seed: number,
    step: number,
    g: Game,
    a: Action,
    message?: string,
  ) => {
    if (report.findings[kind]) {
      report.findings[kind].count++;
      return;
    }
    report.findings[kind] = {
      count: 1,
      first: { build, seed, step, action: a, message },
    };
    const file = resolve(dirname(reportPath), "repros", kind + ".json");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      JSON.stringify(
        { kind, build, seed, step, input: g, action: a, message },
        null,
        2,
      ),
    );
  };
  const builds = [
    ["Warrior", "Wind"],
    ["Knight", "Wind"],
    ["Scout", "Wind"],
    ["Mage", "Wind"],
    ["Mage", "Fire"],
    ["Mage", "Water"],
  ];
  for (const [cls, element] of builds)
    for (const difficulty of [0, 1]) {
      const build = `${cls}/${element}/${difficulty ? "Hard" : "Normal"}`,
        stats = (report.byBuild[build] = {
          games: 0,
          wins: 0,
          deaths: 0,
          capped: 0,
          highestFloor: 1,
        });
      for (let seed = 1; seed <= seeds; seed++) {
        report.games++;
        stats.games++;
        let g = newGame("Simulation", cls, element, difficulty, seed);
        if (powered) {
          g.floor = (seed - 1) % 9;
          generateFloor(g);
          Object.assign(g.player.stats, {
            Health: 5000,
            Power: 200,
            Armor: 5000,
            Accuracy: 200,
            Magic: 100,
          });
          g.player.hp = 5000;
          g.capacity = 40;
          g.inventory.push(
            ...[
              "Teleporter",
              "Nuke Shield",
              "Nuke",
              "Extra Hand",
              "Armor",
              "Speed Booster",
            ].map((name) => makeItem(g, name)),
          );
        }
        let botSeed = (seed * 43 + cls.length) >>> 0;
        const rng = () => {
          botSeed = (Math.imul(botSeed, 1664525) + 1013904223) >>> 0;
          return botSeed / 2 ** 32;
        };
        const visits = new Map<string, number>();
        const tried = new Set<string>();
        for (let step = 0; step < steps && g.status === "playing"; step++) {
          const p = g.player,
            m = g.monsters.find((m) => m.id === g.combat),
            spells = availableSpells(g);
          let a: Action | undefined;
          if (g.pendingLevels)
            a = { type: "level", stat: rng() < 0.65 ? "Power" : "Health" };
          else if (g.pendingLoot && !m) {
            const i = g.pendingLoot;
            if (
              g.inventory.length + Number(p.weapons.length > 0) < g.capacity ||
              i.auto
            )
              a = { type: "pickup" };
            else a = { type: "ignore" };
          } else if (m) {
            const potion = g.inventory.find((i) => i.kind === "heal");
            const rope = g.inventory.find((i) => i.kind === "rope");
            const heal = spells.find((s) => s.name === "Healing Winds");
            const damage = spells.find((s) =>
              ["Gust", "Burn", "Annihilate"].includes(s.name),
            );
            if (m.npc)
              a = m.npc.done
                ? { type: "leave" }
                : { type: "deal", id: g.inventory[0]?.id };
            else if (p.hp < p.stats.Health * 0.5 && potion)
              a = { type: "use", id: potion.id };
            else if (p.hp < p.stats.Health * 0.5 && heal)
              a = { type: "cast", spell: heal.name };
            else if (p.hp < m.stats.Power * 1.3 && rope)
              a = { type: "use", id: rope.id };
            else if (damage && m.hp > p.stats.Power)
              a = { type: "cast", spell: damage.name };
            else if (m.stats.Power - (p.stats.Armor || 0) > p.hp && rng() < 0.8)
              a = { type: "flee" };
            else a = { type: "attack" };
          } else {
            const potion = g.inventory.find((i) => i.kind === "heal");
            const mana = g.inventory.find((i) => i.kind === "mana");
            const support = g.inventory.find(
              (i) =>
                !tried.has(i.id) &&
                [
                  "armor",
                  "stat",
                  "boost",
                  "shield",
                  "hand",
                  "bag",
                  "sight",
                  "vision",
                  "xp",
                  "antidote",
                  ...(powered ? ["nuke"] : []),
                ].includes(i.kind),
            );
            const gear = g.inventory.find(
              (i) =>
                !tried.has(i.id) &&
                ((i.kind === "weapon" &&
                  (i.weight || 0) * 2 <= p.stats.Power &&
                  (i.attack || 0) >
                    (p.weapons.find((w) => w.kind === "weapon")?.attack ||
                      0)) ||
                  (i.kind === "tome" &&
                    !p.weapons.some((w) => w.kind === "tome"))),
            );
            if (potion && p.hp < p.stats.Health * 0.65)
              a = { type: "use", id: potion.id };
            else if (mana && p.stats.Mana <= 3)
              a = { type: "use", id: mana.id };
            else if (support) {
              tried.add(support.id);
              a = { type: "use", id: support.id };
            } else if (gear) {
              tried.add(gear.id);
              a = { type: "use", id: gear.id };
            } else if (
              p.x === g.stairs.x &&
              p.y === g.stairs.y &&
              (!g.stairs.locked || g.keys)
            )
              a = { type: "ascend" };
            else if (rng() < 0.03 && spells.length)
              a = {
                type: "cast",
                spell: spells[Math.floor(rng() * spells.length)].name,
              };
            else if (rng() < 0.01 && p.weapons.length)
              a = { type: "unequip", id: p.weapons[0].id };
            else if (rng() < 0.01 && g.inventory.length)
              a = { type: "drop", id: g.inventory[0].id };
            else {
              // Search the visible area first; map knowledge is used only to find a route to chosen tiles.
              const visible = (x: number, y: number) =>
                g.light[y]?.[x] ||
                (Math.abs(x - p.x) / 2) ** 2 + (y - p.y) ** 2 < g.sight ** 2;
              const target = g.monsters
                .filter(
                  (m) =>
                    visible(m.x, m.y) && !m.npc?.done && (m.key || !m.boss),
                )
                .sort(
                  (a, b) =>
                    a.stats.Power + a.hp * 0.3 - (b.stats.Power + b.hp * 0.3),
                )[0];
              const loot = g.loot
                .filter((l) => visible(l.x, l.y))
                .sort(
                  (a, b) =>
                    Math.abs(a.x - p.x) +
                    Math.abs(a.y - p.y) -
                    (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)),
                )[0];
              if (target && rng() < 0.45) a = direction(g, target.x, target.y);
              else if (loot && rng() < 0.5) a = direction(g, loot.x, loot.y);
              else if (p.level >= 4 && rng() < 0.4) {
                const key =
                  g.stairs.locked && !g.keys
                    ? g.monsters.find((m) => m.key)
                    : undefined;
                a = direction(g, key?.x ?? g.stairs.x, key?.y ?? g.stairs.y);
              }
              if (!a) {
                const options = [
                  [1, 0],
                  [-1, 0],
                  [0, 1],
                  [0, -1],
                ]
                  .filter(([dx, dy]) => g.tiles[p.y + dy]?.[p.x + dx] === 0)
                  .sort(
                    ([dx, dy], [xx, yy]) =>
                      (visits.get(`${g.floor},${p.x + dx},${p.y + dy}`) || 0) -
                      (visits.get(`${g.floor},${p.x + xx},${p.y + yy}`) || 0),
                  );
                const [dx, dy] =
                  options[Math.floor(rng() * Math.min(2, options.length))];
                a = { type: "move", dx, dy };
              }
            }
          }
          report.coverage[a.type] = (report.coverage[a.type] || 0) + 1;
          report.actions++;
          const input = g;
          try {
            g = act(g, a);
            stats.highestFloor = Math.max(stats.highestFloor, g.floor + 1);
            visits.set(
              `${g.floor},${g.player.x},${g.player.y}`,
              (visits.get(`${g.floor},${g.player.x},${g.player.y}`) || 0) + 1,
            );
            for (const kind of violations(g))
              finding(kind, build, seed, step, input, a);
            if (step % 31 === 0) g = JSON.parse(JSON.stringify(g));
          } catch (e) {
            report.rejections++;
            const message = (e as Error).message;
            report.rejectionReasons[message] =
              (report.rejectionReasons[message] || 0) + 1;
            if (/Cannot|undefined|No open tiles|not a function/i.test(message))
              finding(
                "unexpected-exception",
                build,
                seed,
                step,
                input,
                a,
                message,
              );
          }
        }
        if (g.status === "dead") {
          report.deaths++;
          stats.deaths++;
        } else if (g.status === "won") {
          report.wins++;
          stats.wins++;
        } else {
          report.capped++;
          stats.capped++;
        }
      }
    }
  // Deliberate edge probes supplement naturally occurring playthroughs.
  const probe = (
    kind: string,
    g: Game,
    a: Action,
    expected: (next: Game) => boolean,
    rejection?: RegExp,
  ) => {
    try {
      const next = act(g, a);
      if (!expected(next)) finding(kind, "targeted", 0, 0, g, a);
    } catch (e) {
      const message = (e as Error).message;
      if (!rejection?.test(message))
        finding(kind + "-exception", "targeted", 0, 0, g, a, message);
    }
  };
  let g = newGame("Probe", "Warrior", "Wind", 0, 7);
  probe(
    "unearned-level-bonus",
    g,
    { type: "level", stat: "Power" },
    (n) => n.player.stats.Power === g.player.stats.Power,
    /pending/i,
  );
  g = newGame("Probe", "Scout", "Wind", 0, 7);
  g.player.hp = 0.5;
  probe(
    "zero-health-after-rounding",
    g,
    { type: "wait" },
    (n) => n.status === "dead" || n.player.hp > 0,
  );
  g = newGame("Probe", "Knight", "Wind", 0, 7);
  g.floor = 1;
  generateFloor(g);
  g.player.effects["Nuke Shield"] = [1, 1];
  const nuke = makeItem(g, "Nuke");
  g.inventory.push(nuke);
  probe(
    "nuke-destroys-required-key",
    g,
    { type: "use", id: nuke.id },
    (n) => n.keys > 0 || n.monsters.some((m) => m.key),
  );
  g = newGame("Probe", "Warrior", "Wind", 0, 7);
  const wand = makeItem(g, "Magic Staff");
  g.player.weapons.push(wand, { ...wand, id: "second-wand" });
  while (g.inventory.length < 4)
    g.inventory.push(makeItem(g, "Tiny Health Potion"));
  probe(
    "unequip-overflows-bag",
    g,
    { type: "unequip", id: wand.id },
    (n) =>
      n.inventory.length + Number(n.player.weapons.length > 0) <= n.capacity,
    /full/i,
  );
  g = newGame("Probe", "Warrior", "Wind", 0, 7);
  const monster = g.monsters[0];
  monster.hp = 0.3;
  g.monsters = [monster];
  probe("rounded-monster-corpse", g, { type: "wait" }, (n) =>
    n.monsters.every((m) => m.hp > 0),
  );
  g = newGame("Probe", "Mage", "Wind", 0, 7);
  g.pendingLoot = g.loot[0].item;
  Object.assign(g.player, { x: g.loot[0].x, y: g.loot[0].y });
  probe(
    "teleport-retains-remote-loot",
    g,
    { type: "cast", spell: "Teleport" },
    (n) =>
      !n.pendingLoot ||
      n.loot.some(
        (l) =>
          l.item.id === n.pendingLoot!.id &&
          l.x === n.player.x &&
          l.y === n.player.y,
      ),
  );
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  return report;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const report = simulate(
    Number(process.env.SIM_SEEDS || 50),
    Number(process.env.SIM_STEPS || 600),
    process.env.SIM_REPORT || "work/simulation-report.json",
    process.env.SIM_POWERED === "1",
  );
  console.log(JSON.stringify(report, null, 2));
  if (Object.keys(report.findings).length) process.exitCode = 1;
}

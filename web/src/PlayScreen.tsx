import { itemIcon } from "./item-art";
import { dragonArt } from "./dragon-art";
import { itemLore, rarityInfo } from "../shared/item-lore";
import { MerchantPanel } from "./MerchantPanel";
import { worldArt } from "./world-art";
import React, { useEffect, useRef, useState } from "react";
import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { Action, Game, Item } from "../shared/types";
import {
  availableSpells,
  combatAttackStats,
  attackInitiative,
  incomingDamage,
  itemUseProblem,
  canUseFromFloor,
  floorEquipPlan,
  fleeChance,
  hitRate,
  capacityOf,
  manaCap,
  spellCost,
} from "../shared/engine";
import {
  adjacentEnemies,
  displayNumber as n,
  equipmentComparison,
  floorTheme,
  outgoingDamage,
  freshGameLog,
  criticalChance,
  chancePercent,
  combatBreakdown,
  retaliationRisk,
  swipeDirection,
} from "../shared/presentation";
import { describe, spells as spellDefinitions } from "../shared/catalog";
import { DungeonView } from "./DungeonView";
import { Portrait } from "./Portrait";
import { ItemIcon } from "./ItemIcon";
import { spellIcon } from "./spell-art";
import { sprite } from "./art";
import { isDeviceGame } from "./game-api";
import "./play.css";
type Props = {
  game: Game;
  busy: boolean;
  error: string;
  recovery: string;
  lastAction?: { type: string; revision: number };
  onAction: (a: Action) => Promise<Game | undefined>;
  onNew: () => void;
  clearError: () => void;
};
type Selection = { item: Item; ground?: boolean };
export function PlayScreen({
  game: g,
  busy,
  error,
  recovery,
  lastAction,
  onAction,
  onNew,
  clearError,
}: Props) {
  const p = g.player,
    enemy = g.monsters.find((m) => m.id === g.combat),
    danger = enemy ? incomingDamage(enemy, p) : undefined,
    spells =
      g.status === "playing" && !g.pendingLevels ? availableSpells(g) : [];
  const [panel, setPanel] = useState<
      "stats" | "enemy" | "save" | "help" | "npc" | "level" | null
    >(null),
    [selection, setSelection] = useState<Selection | null>(null),
    [overview, setOverview] = useState(false),
    [toast, setToast] = useState(""),
    [poisonFlash, setPoisonFlash] = useState(0),
    [curseFlash, setCurseFlash] = useState(0),
    [trade, setTrade] = useState("");
  const [swapPickup, setSwapPickup] = useState<Item | null>(null);
  const modal = useRef<HTMLDivElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const criticalTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [ignoreStairs, setIgnoreStairs] = useState(false);
  const atStairs = p.x === g.stairs.x && p.y === g.stairs.y;
  useEffect(() => setIgnoreStairs(false), [p.x, p.y, g.floor]);
  const context =
    (!ignoreStairs && atStairs) ||
    g.status !== "playing" ||
    !!g.pendingLevels ||
    !!g.pendingChest ||
    !!g.pendingDoor ||
    !!g.pendingLoot ||
    !!enemy;
  const canMove =
    g.status === "playing" &&
    !g.pendingLevels &&
    !enemy &&
    !busy &&
    !panel &&
    !selection &&
    !swapPickup;
  const canSwipeEncounter =
    !!enemy && !busy && !panel && !selection && !swapPickup &&
    !g.pendingLevels && g.status === "playing";
  const encounterExit: Action =
    g.encounter?.engaged || g.encounter?.origin === "enemy"
      ? { type: "flee" }
      : { type: "leave" };
  const lootPaused =
    !!g.pendingLoot && !enemy && !g.pendingLevels && g.status === "playing";
  const lootMovementHint =
    lootPaused && !panel && !selection && !busy
      ? "Swipe to leave this loot and move. Items stay on the floor."
      : undefined;
  const forecast = enemy ? outgoingDamage(p, enemy) : undefined;
  const risk = enemy ? retaliationRisk(p, enemy) : undefined;
  const staffInactive =
    p.weapons.some((i) => i.kind === "tome") && p.stats.Mana < 2;
  const [criticalNotice, setCriticalNotice] = useState("");
  const ownedElements = new Set(
    [...g.inventory, ...p.weapons]
      .filter((i) => i.kind === "tome")
      .map((i) => i.element),
  );
  const knownSpells = spellDefinitions.filter((s) =>
    ownedElements.has(s.element),
  );
  const equipped = p.weapons.map((i) => i.name).join(" + ") || "Unarmed";
  const gear = g.inventory.map((item) => ({ item, equipped: false }));
  const cards = [
    ...p.weapons.map((item) => ({ item, equipped: true })),
    ...gear.sort(
      (a, b) =>
        Number(!!itemUseProblem(g, a.item)) -
        Number(!!itemUseProblem(g, b.item)),
    ),
  ];
  const picked = selection?.item,
    isGear = !!picked && ["weapon", "tome"].includes(picked.kind),
    comparison =
      picked && isGear
        ? equipmentComparison(g, picked, !!selection?.ground)
        : undefined;
  const activeChest = g.chests?.find((c) => c.id === g.pendingChest);
  const activeDoor = g.secretDoors?.find((d) => d.id === g.pendingDoor);
  const inspectedLoot = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!g.pendingLoot) {
      inspectedLoot.current = undefined;
      return;
    }
    if (
      g.status === "playing" &&
      !g.pendingLevels &&
      inspectedLoot.current !== g.pendingLoot.id
    ) {
      inspectedLoot.current = g.pendingLoot.id;
      setSelection({ item: g.pendingLoot, ground: true });
    }
  }, [g.pendingLoot?.id, g.pendingLevels, g.status]);
  useEffect(() => {
    if (g.pendingLevels && g.status === "playing") setPanel("level");
  }, [g.pendingLevels, p.level, g.status]);
  function levelChoices() {
    return (
      <div className="level-choices">
        {[
          "Health",
          "Power",
          "Luck",
          "Magic",
          "EXP",
          "Accuracy + Speed",
          ...(p.className === "Knight" && p.level % 3 === 0 ? ["Armor"] : []),
        ].map((stat) => (
          <button
            key={stat}
            aria-label={stat + (stat === "EXP" ? " +20" : " +2")}
            onClick={() => void send({ type: "level", stat })}
          >
            <b>
              {stat}
              {stat === "EXP" ? " +20" : " +2"}
            </b>
            <small>
              {stat === "EXP"
                ? `${g.xp} → ${g.xp + 20} EXP`
                : stat === "Accuracy + Speed"
                  ? `${n(p.stats.Accuracy)} → ${n(p.stats.Accuracy + 2)} accuracy · ${n(p.stats.Speed)} → ${n(p.stats.Speed + 2)} speed`
                  : `${n(p.stats[stat] || 0)} → ${n((p.stats[stat] || 0) + 2)}`}
            </small>
          </button>
        ))}
      </div>
    );
  }
  function closeDetails() {
    setPanel(null);
    setSwapPickup(null);
    if ((selection?.ground && g.pendingLoot) || (swapPickup && g.pendingLoot))
      void send({ type: "ignore" });
    setSelection(null);
  }
  function pickUp() {
    const incoming =
      (selection?.ground ? selection.item : undefined) ||
      g.pendingLoot ||
      g.loot.find((l) => l.x === p.x && l.y === p.y)?.item;
    if (!incoming) return;
    if (
      !incoming.auto &&
      g.inventory.length + Number(p.weapons.length > 0) >= capacityOf(g)
    )
      setSwapPickup(incoming);
    else void send({ type: "pickup", id: incoming.id });
  }
  const lootPointer = useRef<{
    x: number;
    y: number;
    zone: boolean;
    outside: boolean;
  } | null>(null);
  const swipedLoot = useRef(false);
  function moveFromLoot(dx: number, dy: number) {
    if (
      busy ||
      panel ||
      swapPickup ||
      enemy ||
      g.pendingLevels ||
      g.status !== "playing"
    )
      return;
    setSelection(null);
    setIgnoreStairs(true);
    void send({ type: "move", dx, dy });
  }
  function swipeAwayFromEncounter() {
    setSelection(null);
    setPanel(null);
    void send(encounterExit);
  }
  const origin = g.encounter?.enemyId === enemy?.id ? g.encounter : undefined;
  function announce(message: string) {
    setToast(message.replace(/\b\d+\.\d{2,}\b/g, (v) => n(Number(v))));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6500);
  }
  useEffect(() => {
    document.body.classList.add("playing-game");
    return () => {
      document.body.classList.remove("playing-game");
      clearTimeout(toastTimer.current);
      clearTimeout(criticalTimer.current);
    };
  }, []);
  useEffect(() => {
    if (error) announce(error);
  }, [error]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "Escape") {
        closeDetails();
        return;
      }
      if (
        selection?.ground &&
        !panel &&
        !swapPickup &&
        !enemy &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const d = (
          {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
          } as Record<string, number[]>
        )[e.key];
        moveFromLoot(d[0], d[1]);
        return;
      }
      if (panel || selection || swapPickup) return;
      const dirs: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      if (
        (e.target as HTMLElement).closest(".inventory-ribbon,.magic-ribbon") &&
        dirs[e.key]
      )
        return;
      if (e.key.toLowerCase() === "i") {
        document
          .querySelector<HTMLButtonElement>(".inventory-ribbon .item-card")
          ?.focus();
        return;
      }
      if (e.key.toLowerCase() === "m") {
        document
          .querySelector<HTMLButtonElement>(".magic-ribbon .spell-card")
          ?.focus();
        return;
      }
      if (dirs[e.key] && lootMovementHint) {
        e.preventDefault();
        announce(lootMovementHint);
        return;
      }
      if (dirs[e.key] && canSwipeEncounter) {
        e.preventDefault();
        void send(encounterExit);
      } else if (dirs[e.key] && canMove) {
        e.preventDefault();
        void send({ type: "move", dx: dirs[e.key][0], dy: dirs[e.key][1] });
      } else if (
        e.key === " " &&
        canMove &&
        !(e.target as HTMLElement).closest("button")
      ) {
        e.preventDefault();
        void send({ type: "wait" });
      } else if (e.key.toLowerCase() === "v") setPanel("save");
      else if (e.key.toLowerCase() === "s") setPanel("stats");
      else if (e.key.toLowerCase() === "h") setPanel("help");
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [g, canMove, canSwipeEncounter, panel, selection, busy, lootMovementHint, swapPickup]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = NativeApp.addListener("backButton", () => {
      if (selection || swapPickup) closeDetails();
      else if (panel) setPanel(null);
      else setPanel("save");
    });
    return () => {
      void h.then((v) => v.remove());
    };
  }, [panel, selection, swapPickup]);
  useEffect(() => {
    if (!panel && !selection && !swapPickup) return;
    const old = document.activeElement as HTMLElement;
    const box = modal.current;
    box?.querySelector<HTMLElement>(".modal-close")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !box) return;
      const els = Array.from(
        box.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,textarea",
        ),
      ).filter((el) => el.getClientRects().length);
      const first = els[0],
        last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      if (old?.isConnected) old.focus();
    };
  }, [panel, !!selection, swapPickup]);
  async function send(a: Action) {
    if (busy) return;
    clearError();
    const before = g;
    const after = await onAction(a);
    if (!after) return;
    const opensLoot =
      after.status === "playing" &&
      !after.pendingLevels &&
      after.pendingLoot &&
      (after.pendingLoot.id !== before.pendingLoot?.id ||
        !!before.pendingLevels);
    const usedItem = (a.type === "use" || a.type === "use-floor") && selection?.item.id === a.id;
    const remaining = usedItem && (a.type === "use"
      ? after.inventory.find((item) => item.id === a.id)
      : after.loot.find((entry) => entry.item.id === a.id)?.item);
    setSelection(opensLoot ? { item: after.pendingLoot!, ground: true } : remaining && after.status === "playing" && !after.pendingLevels
      ? { item: remaining, ground: a.type === "use-floor" } : null);
    setSwapPickup(null);
    if (after.pendingLevels && after.status === "playing") setPanel("level");
    else if (
      a.type === "leave" ||
      a.type === "level" ||
      ["deal", "use", "cast", "throw-floor"].includes(a.type)
    )
      setPanel(null);
    const entries = freshGameLog(before, after);
    if (["buy", "quote", "sell"].includes(a.type)) {
      announce(after.marketNotice || "Trade complete.");
      return;
    }

    if (entries.some((line) => line.includes("Critical hit!"))) {
      const index = entries.findIndex((line) => line.includes("Critical hit!"));
      setCriticalNotice("CRITICAL HIT! " + (entries[index + 1] || ""));
      clearTimeout(criticalTimer.current);
      criticalTimer.current = setTimeout(() => setCriticalNotice(""), 4500);
    }
    const moved =
      after.player.x !== before.player.x || after.player.y !== before.player.y;
    if (before.player.effects.Curse && after.turn > before.turn && after.player.hp < before.player.hp)
      requestAnimationFrame(() => requestAnimationFrame(() => setCurseFlash(after.revision)));
    const curseNotice = entries.find((s) => s.startsWith("CURSED:"));
    if (curseNotice)
      announce(
        [entries.find((line) => line.includes(": “")), curseNotice]
          .filter(Boolean)
          .join(" "),
      );
    else if (a.type === "move" && moved && before.player.effects.Poison) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setPoisonFlash(after.revision)),
      );
      announce(
        `Poison: −${n(Math.trunc(before.player.effects.Poison[1]))} HP. ${after.player.effects.Poison?.[0] || 0} steps remaining.`,
      );
    } else if (after.status === "dead") announce("Your journey has ended.");
    else if (after.keys > before.keys)
      announce("Stair Key acquired · unlocks locked stairs only.");
    else if (after.pendingLevels) announce("Level up! Choose a bonus.");
    else if (entries.some((line) => line.includes("robot explodes")))
      announce(`Robot explosion! ${Math.max(0, before.player.hp - after.player.hp)} HP lost nearby.`);
    else if (
      after.combat &&
      !before.combat &&
      after.encounter?.origin === "enemy"
    )
      announce(
        `${after.monsters.find((m) => m.id === after.combat)?.name} approaches you!`,
      );
    else if (
      a.type === "move" &&
      moved &&
      after.pods.length < before.pods.length
    )
      announce(
        `Energy restored: +${n(Math.max(0, after.player.hp - before.player.hp))} HP · +${n(Math.max(0, after.player.stats.Mana - before.player.stats.Mana))} MP`,
      );
    else if (entries.some((line) => line.startsWith("Collected ")))
      announce(
        entries.filter((line) => line.startsWith("Collected ")).join(" "),
      );
    else if (a.type === "attack")
      announce(
        (after.encounter?.result || entries.slice(-3).join(" ")) +
          " " +
          entries
            .filter(
              (line) =>
                line.includes("broke!") || line.includes("is poisoned."),
            )
            .join(" "),
      );
    else if (a.type === "deal") {
      const changes = Object.keys(before.player.stats)
        .filter((k) => after.player.stats[k] !== before.player.stats[k])
        .map(
          (k) =>
            `${k} ${after.player.stats[k] > before.player.stats[k] ? "+" : ""}${n(after.player.stats[k] - before.player.stats[k])}`,
        );
      announce(
        `Bargain complete. ${after.player.hp > before.player.hp ? `+${n(after.player.hp - before.player.hp)} HP. ` : ""}${changes.join(" · ")}${after.pendingLoot ? ` Gift: ${after.pendingLoot.name}.` : ""}`,
      );
    } else if (a.type === "cast")
      announce(
        `Cast ${a.spell}.${a.spell === "Kindle" ? ` Enemy burns for ${after.monsters.find((m) => m.id === before.combat)?.burn?.[1] || 0} per move or attack.` : ""}${a.spell === "Unseal" && after.pendingLoot ? ` Chest opened: ${after.pendingLoot.name}.` : ""}${after.player.hp !== before.player.hp ? ` HP ${after.player.hp > before.player.hp ? "+" : ""}${n(after.player.hp - before.player.hp)}.` : ""}${before.combat && !after.combat ? " Encounter ended." : ""}${before.player.effects.Poison && !after.player.effects.Poison ? " Poison cleared." : ""}`,
      );
    else if (a.type !== "move" && a.type !== "wait" && a.type !== "talk")
      announce(after.log.slice(-2).join(" "));
    else if (a.type === "move" && !moved && !after.combat)
      announce("Stone wall. Swipe another direction.");
    return after;
  }
  const actButton = (label: string, a: Action, disabled = false, cls = "") => (
    <button
      className={cls}
      disabled={busy || disabled}
      onClick={() => void send(a)}
    >
      {label}
    </button>
  );
  const statList = (actor = p) => {
    const stats = combatAttackStats(actor);
    return (
      <>
        <h3>Combat adjustments</h3>
        <table className="stats-breakdown">
          <thead>
            <tr>
              <th>Stat</th>
              <th>Base</th>
              <th>Effects</th>
              <th>Gear</th>
              <th>Now</th>
            </tr>
          </thead>
          <tbody>
            {combatBreakdown(actor).map((row) => (
              <tr key={row.stat}>
                <th>{row.stat}</th>
                <td>{n(row.base)}</td>
                <td>
                  {row.effects > 0 ? "+" : ""}
                  {n(row.effects)}
                </td>
                <td className="gear-adjustment">
                  {row.gear > 0 ? "+" : ""}
                  {n(row.gear)}
                </td>
                <td>
                  <b>{n(row.now)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Crit chance: {chancePercent(criticalChance(stats.Luck))} · Basic
          attacks use{" "}
          {actor.weapons.some((w) => w.kind === "tome") && actor.stats.Mana >= 2
            ? "Magic"
            : "Power"}
          . Gear includes weight and attack-mode changes.
        </p>
        <h3>Base stats</h3>
        <dl className="full-stat-grid">
          {Object.entries({
            ...(actor === p
              ? {
                  Gold: n(p.gold || 0),
                  "Poison immunity": p.poisonImmune ? "Permanent" : "None",
                }
              : {}),
            HP: `${Math.ceil(actor.hp)}/${Math.ceil(actor.stats.Health)}`,
            Level: n(actor.level),
            ...Object.fromEntries(
              Object.entries(actor.stats).map(([k, v]) => [k, n(v)]),
            ),
          }).map(([label, value]) => (
            <React.Fragment key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      </>
    );
  };
  function equipmentDetails(item: Item) {
    return (
      <>
        <p>{describe(item).replace(/\b\d+\.\d{2,}\b/g, (v) => n(+v))}</p>
        <div className="weapon-facts">
          <span>Attack +{n(item.attack || 0)}</span>
          <span>Weight {n(item.weight || 0)}</span>
          <span>Luck +{n(item.luck || 0)}</span>
          <span>
            Power required {n((item.weight || 0) * 2)} / yours{" "}
            {n(p.stats.Power)}
          </span>
          <span>
            {item.kind === "tome"
              ? `${item.element} · 2 MP per basic attack`
              : `${n(item.uses || 0)} / ${n(item.maxUses || 0)} uses`}
          </span>
        </div>
      </>
    );
  }
  const groundPile = g.loot
    .filter((l) => l.x === p.x && l.y === p.y)
    .map((l) => l.item);
  const ground = g.pendingLoot || groundPile[0];
  return (
    <main
      className={
        "play-shell" +
        (p.effects.Poison ? " is-poisoned" : "") +
        (p.hp / p.stats.Health <= 0.1 ? " critical-hp" : "")
      }
    >
      <header className="play-header">
        <b>◈ DUNGEON</b>
        <span className="floor-name">
          {g.inSecret
            ? "Secret chamber"
            : `F${g.floor + 1} · ${floorTheme(g.floor).name}`}{" "}
        </span>
        <button onClick={() => setPanel("save")}>
          {isDeviceGame ? "Saved on phone" : "Saved journey"} ●
        </button>
        <button aria-label="How to play" onClick={() => setPanel("help")}>
          ?
        </button>
      </header>
      <section
        className={"actor-panels" + (enemy ? " has-enemy" : "")}
        aria-label="Player and enemy panels"
      >
        <section className="player-panel">
          <button
            className="player-expand"
            aria-label="Expand full player stats"
            onClick={() => setPanel("stats")}
          >
            <Portrait type={p.className} />
            <span>
              <strong>
                {p.name}{" "}
                <small>
                  Lv {p.level} {p.className}
                </small>
              </strong>
              <span className="gold-purse" aria-label={`${p.gold || 0} gold`}>
                <img
                  src={itemIcon({ kind: "gold", name: "1 Gold Coin" })}
                  alt=""
                />
                <b>{p.gold || 0}</b>
                <small>gold</small>
                {(g.keys > 0 || g.stairs.locked) && (
                  <span
                    className="stair-key-count"
                    title="Stair Keys unlock stairs only; Standard and Rare Keys open chests/doors."
                  >
                    <img
                      src={itemIcon({ kind: "stair-key", name: "Stair Key" })}
                      alt="Stair Key"
                    />
                    {g.keys} Stair {g.keys === 1 ? "Key" : "Keys"}
                  </span>
                )}
              </span>
              <span className="held-line">
                {p.weapons.slice(-2).map((i) => (
                  <ItemIcon key={i.id} item={i} />
                ))}
                <b>{equipped}</b>
              </span>
              {staffInactive && (
                <span className="mana-warning">
                  LOW MANA ·{" "}
                  {p.weapons.some((i) => i.kind === "weapon")
                    ? "Staff inactive · physical attack"
                    : "Staff inactive · UNARMED"}
                </span>
              )}
              <small className="weapon-uses">
                {p.weapons.length
                  ? p.weapons
                      .map((i) =>
                        i.kind === "tome"
                          ? `${i.element} · 2 MP/hit`
                          : `${i.uses}/${i.maxUses} uses`,
                      )
                      .join(" · ")
                  : "Unarmed · no weapon"}{" "}
                · Full stats ⌄
              </small>
              {p.effects.Curse && (
                <span className="curse-chip">
                  CURSE −{n(p.effects.Curse[1])} HP / turn ·{" "}
                  {p.effects.Curse[0]} turns
                </span>
              )}
              {p.effects.Poison && (
                <span className="poison-chip">
                  POISON −{n(Math.trunc(p.effects.Poison[1]))} HP / step ·{" "}
                  {p.effects.Poison[0]} steps
                </span>
              )}
              {p.effects["Critical Star"] && <span className="weapon-uses">★ Next landed hit: critical</span>}
              {p.effects["Speedy Boots"] && <span className="weapon-uses">✦ Next enemy attack: 99% dodge</span>}
            </span>
          </button>
          <div
            className={"hero-vitals" + (p.stats.Mana < 2 ? " low-mana" : "")}
          >
            <label>
              {p.hp / p.stats.Health <= 0.01
                ? "LAST BREATH · ≤1% HP"
                : p.hp / p.stats.Health <= 0.1
                  ? "CRITICAL · ≤10% HP"
                  : "HP"}{" "}
              <b>
                {Math.ceil(p.hp)}/{Math.ceil(p.stats.Health)}
              </b>
            </label>
            <meter
              className="hp-meter"
              min={0}
              max={p.stats.Health}
              value={p.hp}
            />
            <label>
              MP <b>{n(p.stats.Mana)}/{manaCap(p)}</b>
            </label>
            <meter min={0} max={manaCap(p)} value={p.stats.Mana} />
          </div>
        </section>
        {enemy && (
          <button
            className={
              "enemy-panel" +
              (origin?.origin === "enemy" ? " enemy-initiated" : "")
            }
            aria-label="Expand enemy stats"
            onClick={() => setPanel("enemy")}
          >
            {enemy.className === "Dragon" ? (
              <img
                className="dragon-hud"
                src={dragonArt().toDataURL()}
                alt="Red winged serpent dragon"
              />
            ) : enemy.merchant || enemy.className === "Ghost" ? (
              <img
                className="chief-hud"
                src={worldArt(enemy.className).toDataURL()}
                alt={enemy.className}
              />
            ) : enemy.npc ? (
              <img
                className="chief-hud"
                src={(enemy.npc!.tribe === "Emperor"
                  ? worldArt("Emperor")
                  : sprite("Chieftan", 2, enemy.npc!.tribe)
                ).toDataURL()}
                alt={
                  enemy.merchant ? "Villager" : enemy.npc!.tribe + " chieftain"
                }
              />
            ) : (
              <Portrait type={enemy.className} />
            )}
            <span>
              <strong>
                {enemy.name}{" "}
                <small>
                  Lv {enemy.level} ·{" "}
                  {origin?.engaged
                    ? "COMBAT"
                    : origin?.origin === "enemy"
                      ? "ENEMY APPROACHED"
                      : "INSPECTING"}
                </small>
              </strong>
              <span>
                HP {Math.ceil(enemy.hp)}/{Math.ceil(enemy.stats.Health)} · ATK{" "}
                {n(combatAttackStats(enemy).Attack)} · ARM{" "}
                {n(enemy.stats.Armor || 0)} · SPD {n(enemy.stats.Speed)} · CRIT {chancePercent(criticalChance(enemy.stats.Luck))}
                {enemy.burn ? ` · BURN ${enemy.burn[1]} × ${enemy.burn[0]}` : ""}
              </span>
              <meter min={0} max={enemy.stats.Health} value={enemy.hp} />
            </span>
          </button>
        )}
      </section>
      <section className="play-map" aria-label="Dungeon exploration">
        <DungeonView
          game={g}
          action={lastAction}
          overview={overview}
          movementEnabled={canMove || canSwipeEncounter}
          movementBlockedHint={
            lootMovementHint ||
            (activeChest
              ? "Chest found. Open it, or swipe to leave it and move."
              : activeDoor
                ? "Secret door found. Unlock it, or swipe to move away."
                : undefined)
          }
          onMove={(dx, dy) => {
            if (canMove) void send({ type: "move", dx, dy });
            else if (canSwipeEncounter) void send(encounterExit);
            else if (g.pendingLoot) moveFromLoot(dx, dy);
          }}
          onHint={announce}
        />
        <div className="map-corner-controls">
          <button
            onClick={() => setOverview((v) => !v)}
            aria-pressed={overview}
          >
            {overview ? "Follow hero" : "Overview"}
          </button>
          <button
            disabled={!canMove}
            onClick={() => void send({ type: "wait" })}
          >
            Wait
          </button>
        </div>
        {!context && !toast && g.turn < 3 && (
          <p className="swipe-hint">
            Swipe the dungeon to move · arrow keys also work
          </p>
        )}
        {lootMovementHint && !toast && (
          <p className="loot-movement-hint" role="status">
            ITEM FOUND
            <br />
            Swipe to leave the loot and move.
          </p>
        )}
        {(enemy?.npc || enemy?.merchant) && (
          <div className="chief-speech" aria-label="Chieftain speech bubble">
            <img
              alt={
                enemy.merchant ? "Villager" : enemy.npc!.tribe + " chieftain"
              }
              src={(enemy.merchant
                ? worldArt(enemy.className, 3)
                : enemy.npc!.tribe === "Emperor"
                  ? worldArt("Emperor", 3)
                  : sprite("Chieftan", 3, enemy.npc!.tribe)
              ).toDataURL()}
            />
            <div>
              <strong>
                {enemy.name} · {enemy.merchant ? "Villager" : enemy.npc!.tribe}
              </strong>
              <p>“{enemy.merchant?.line || enemy.npc!.line}”</p>
              <button onClick={() => setPanel("npc")}>Discuss trade</button>
            </div>
          </div>
        )}
        {criticalNotice && (
          <div className="critical-notice" role="alert">
            ✦ {criticalNotice}
          </div>
        )}
        {toast && (
          <div
            className={"play-toast" + (error ? " toast-error" : "")}
            role={error ? "alert" : "status"}
          >
            <span>{toast}</span>
            <button
              aria-label="Dismiss notice"
              onClick={() => {
                setToast("");
                clearError();
              }}
            >
              ×
            </button>
          </div>
        )}
        {!!poisonFlash && (
          <div
            key={poisonFlash}
            className="poison-flash"
            data-testid="poison-flash"
          />
        )}
        {!!curseFlash && (
          <div key={curseFlash} className="poison-flash curse-flash" data-testid="curse-flash" />
        )}
      </section>
      {context && (
        <section
          className="play-context"
          aria-hidden={!!selection || !!swapPickup || !!panel}
        >
          {g.status === "dead" ? (
            <>
              <strong>Your journey ends here · Score {n(g.score)}</strong>
              <button onClick={onNew}>Begin a new journey</button>
            </>
          ) : g.status === "won" ? (
            <>
              <strong>Ruthagor defeated · Score {n(g.score)}</strong>
              {actButton("Continue exploring", { type: "continue" })}
            </>
          ) : g.pendingLevels ? (
            <>
              <strong>Level {p.level} · choose a bonus</strong>
              <button onClick={() => setPanel("level")}>Review level up</button>
            </>
          ) : (
            <>
              {enemy && (
                <>
                  <div
                    className="damage-forecast"
                    aria-label="Your damage forecast"
                  >
                    <b>Your hit: {forecast?.normal} damage</b>
                    <span>
                      Crit {chancePercent(forecast?.critChance || 0)} ·{" "}
                      {forecast?.critical} damage · Hit{" "}
                      {chancePercent(forecast?.hit || 0)}
                      {staffInactive ? " · STAFF INACTIVE" : ""}
                    </span>
                  </div>
                  <div
                    className={
                      "turn-order" + (danger?.enemyFirst ? " enemy-first" : "")
                    }
                  >
                    <b>
                      First to act: {danger?.enemyFirst ? enemy.name : "You"}
                    </b>
                    <small>
                      {origin?.engaged ? "Next exchange" : "If you attack"}
                    </small>
                  </div>
                  {risk?.safeKill && (
                    <p className="safe-strike">
                      Guaranteed normal hit defeats this enemy before
                      retaliation.
                    </p>
                  )}
                  {risk?.warning && (
                    <p className="kill-warning">
                      ⚠ {risk.warning} · Enemy damage {danger?.normal} / crit{" "}
                      {danger?.critical}
                    </p>
                  )}
                  {enemy.className === "Robot" && (
                    <p className="kill-warning">⚠ Robot explosion: on death, everyone within 2 tiles takes {8 + Math.floor(enemy.level / 2)} damage.</p>
                  )}
                  <div className="context-actions">
                    {(enemy.npc || enemy.merchant) && (
                      <button
                        className="primary"
                        onClick={() => setPanel("npc")}
                      >
                        Talk / trade
                      </button>
                    )}
                    {actButton(
                      enemy.merchant
                        ? "Attack villager"
                        : enemy.npc
                          ? "Attack chief"
                          : "Attack",
                      { type: "attack" },
                      false,
                      enemy.npc || enemy.merchant ? "" : "primary",
                    )}
                    {actButton(
                      encounterExit.type === "flee" ? `Flee · ${Math.round(fleeChance(p, enemy) * 100)}% chance` : "Leave encounter",
                      encounterExit,
                    )}
                    <small className="encounter-swipe-hint">Swipe the dungeon or press an arrow key to {encounterExit.type === "flee" ? "attempt to flee" : "leave"}.</small>
                    {ground && (
                      <button
                        onClick={() =>
                          setSelection({ item: ground, ground: true })
                        }
                      >
                        Ground item
                      </button>
                    )}
                  </div>
                </>
              )}
              {!enemy && ground && !atStairs && (
                <div className="ground-prompt">
                  <ItemIcon item={ground} />
                  <span>
                    <strong>{ground.name}</strong>
                    <small>Movement paused · choose an action</small>
                  </span>
                  <button className="primary" onClick={pickUp}>
                    Pick up
                  </button>
                  <button
                    onClick={() => setSelection({ item: ground, ground: true })}
                  >
                    Inspect
                  </button>
                  <button
                    disabled={
                      ground.kind === "projectile"
                        ? adjacentEnemies(g).length === 0
                        : !["weapon", "tome"].includes(ground.kind) &&
                          (!canUseFromFloor(ground) ||
                            !!itemUseProblem(g, ground))
                    }
                    title={
                      itemUseProblem(g, ground) ||
                      (!canUseFromFloor(ground)
                        ? "Pick this item up first."
                        : ground.description)
                    }
                    onClick={() =>
                      ["weapon", "tome", "seismic", "projectile"].includes(
                        ground.kind,
                      )
                        ? setSelection({ item: ground, ground: true })
                        : void send({ type: "use-floor", id: ground.id })
                    }
                  >
                    Use
                  </button>
                  {actButton("Leave & resume", { type: "ignore" })}
                </div>
              )}
              {activeChest && (
                <div className="object-prompt">
                  <strong>
                    {activeChest.ultra ? "Ultrarare" : "Regular"} chest
                  </strong>
                  <small>
                    {activeChest.locked
                      ? "Requires a Standard or Rare Key"
                      : "Unlocked — no key needed"}
                  </small>
                  {actButton("Open chest", {
                    type: "open-chest",
                    id: activeChest.id,
                  })}
                  <small>Swipe the dungeon to leave this chest and move.</small>
                  {actButton("Leave chest", { type: "dismiss-object" })}
                </div>
              )}
              {activeDoor && (
                <div className="object-prompt">
                  <strong>Secret door</strong>
                  <small>A Rare Key opens the hidden chamber.</small>
                  {actButton("Unlock secret door", {
                    type: "unlock-door",
                    id: activeDoor.id,
                  })}
                  {actButton("Leave door", { type: "dismiss-object" })}
                </div>
              )}
              {!enemy && atStairs && (
                <div className="context-actions">
                  {ground && (
                    <small>
                      Loot is on the stairs. You can ascend and leave it behind.
                    </small>
                  )}
                  {g.stairs.locked && (
                    <small className="stair-lock-note">
                      {g.keys
                        ? "Uses 1 Stair Key to unlock these stairs."
                        : "Locked stairs · needs a Stair Key from this floor’s key carrier. Chest/door keys won’t fit."}
                    </small>
                  )}
                  {actButton("Ascend", { type: "ascend" }, false, "primary")}
                  {ground && (
                    <button
                      onClick={() =>
                        setSelection({ item: ground, ground: true })
                      }
                    >
                      Inspect floor loot
                    </button>
                  )}
                  <button onClick={() => setIgnoreStairs(true)}>
                    Keep exploring
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
      <section className="inventory-ribbon" aria-label="Inventory items">
        <span className="ribbon-label">
          BAG {g.inventory.length + Number(p.weapons.length > 0)}/{capacityOf(g) === Infinity ? "∞" : capacityOf(g)}
        </span>
        <div className="item-carousel">
          {groundPile.map((item, index) => (
            <button
              key={item.id}
              className="item-card ground-card"
              aria-label={
                "Ground: " +
                item.name +
                (groundPile.length > 1 ? " · " + (index + 1) : "")
              }
              onClick={() => setSelection({ item, ground: true })}
            >
              <ItemIcon item={item} />
              <strong>{item.name}</strong>
              <small>AT YOUR FEET</small>
              <em>Inspect ground item</em>
            </button>
          ))}
          {cards.length ? (
            cards.map(({ item, equipped: held }) => {
              const problem = held ? undefined : itemUseProblem(g, item);
              return (
                <button
                  key={item.id}
                  className={
                    "item-card" +
                    (held ? " is-equipped" : "") +
                    (problem ? " unavailable" : "")
                  }
                  aria-label={(held ? "Equipped: " : "Item: ") + item.name}
                  onClick={() => setSelection({ item })}
                >
                  <ItemIcon item={item} />
                  <strong>{item.name}</strong>
                  <small>
                    {held
                      ? "★ EQUIPPED"
                      : problem
                        ? "Unavailable now"
                        : ["weapon", "tome"].includes(item.kind)
                          ? "Compare / equip"
                          : "Usable now"}
                  </small>
                  <em>
                    {item.kind === "weapon"
                      ? `${item.uses}/${item.maxUses} uses`
                      : item.uses && item.maxUses
                        ? `${item.uses}/${item.maxUses} uses`
                      : item.kind === "tome"
                        ? item.element
                        : problem || "View / use"}
                  </em>
                  {!held &&
                    item.kind === "heal" &&
                    p.hp < p.stats.Health &&
                    (p.hp / p.stats.Health <= 0.4 ||
                      danger?.criticalLethal) && (
                      <span className="card-cue">HEAL READY</span>
                    )}
                  {!held &&
                    item.kind === "antidote" &&
                    (p.effects.Poison || p.effects.Curse) && (
                      <span className="card-cue">CURE READY</span>
                    )}
                  {!held &&
                    item.kind === "projectile" &&
                    enemy &&
                    (!enemy.npc || origin?.engaged) && (
                      <span className="card-cue throw-cue">THROW READY</span>
                    )}
                </button>
              );
            })
          ) : (
            <p>No carried items · explore for loot</p>
          )}
        </div>
      </section>
      {spells.length > 0 && (
        <section className="magic-ribbon" aria-label="Available magic">
          <span className="ribbon-label">MAGIC · {n(p.stats.Mana)} MP</span>
          <div className="spell-carousel">
            {spells.map((s) => (
              <button
                className="spell-card"
                key={s.name}
                disabled={busy || g.status !== "playing" || !!g.pendingLevels}
                aria-label={`Cast ${s.name} · ${spellCost(g, s)} MP`}
                onClick={() => void send({ type: "cast", spell: s.name })}
              >
                <img
                  src={spellIcon(s.name, s.element)}
                  alt={s.name + " spell sprite"}
                />
                <strong>{s.name}</strong>
                <small>{spellCost(g, s)} MP · Cast</small>
              </button>
            ))}
          </div>
        </section>
      )}
      {(panel || selection || swapPickup) && (
        <div
          className="play-backdrop"
          onPointerDown={(e) => {
            swipedLoot.current = false;
            if (
              !(selection?.ground || (enemy && (panel === "npc" || panel === "enemy"))) ||
              (panel && panel !== "npc" && panel !== "enemy") ||
              swapPickup ||
              !e.isPrimary ||
              (e.target as HTMLElement).closest("button,input,select")
            )
              return;
            lootPointer.current = {
              x: e.clientX,
              y: e.clientY,
              zone: !!(e.target as HTMLElement).closest(".loot-swipe-zone"),
              outside: !(e.target as HTMLElement).closest(".play-modal"),
            };
          }}
          onPointerCancel={() => {
            lootPointer.current = null;
          }}
          onPointerUp={(e) => {
            const start = lootPointer.current;
            lootPointer.current = null;
            if (!start) return;
            const direction = swipeDirection(
              e.clientX - start.x,
              e.clientY - start.y,
            );
            if (!direction) return;
            const box = modal.current;
            const scrolls = box && box.scrollHeight > box.clientHeight + 2;
            if (direction.dy && scrolls && !start.zone && !start.outside)
              return;
            swipedLoot.current = true;
            if (enemy) swipeAwayFromEncounter();
            else moveFromLoot(direction.dx, direction.dy);
          }}
          onClick={() => {
            if (!swipedLoot.current) closeDetails();
          }}
        >
          <div
            ref={modal}
            className="play-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              swapPickup
                ? "Bag is full"
                : selection
                  ? isGear
                    ? "Equipment comparison"
                    : "Item details"
                  : panel === "stats"
                    ? "Full player stats"
                    : panel === "enemy"
                      ? "Enemy stats"
                      : panel === "npc"
                        ? enemy?.merchant
                          ? "Villager market"
                          : "Chieftain dialogue"
                        : panel === "level"
                          ? "Level up"
                          : panel === "save"
                            ? "Saved journey"
                            : "How to play"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close details"
              onClick={() => {
                closeDetails();
              }}
            >
              ×
            </button>
            {error && (
              <p className="action-problem" role="alert">
                {error}
              </p>
            )}
            {swapPickup ? (
              <>
                <h2>Bag is full</h2>
                <p>
                  Choose an item to drop to keep {swapPickup.name}. You can
                  leave the newly found item instead.
                </p>
                <div className="swap-items">
                  {[
                    swapPickup,
                    ...g.inventory,
                    ...(p.weapons.length === 1 ? p.weapons : []),
                  ].map((item) => (
                    <button
                      key={item.id}
                      aria-label={
                        item.id === swapPickup.id
                          ? "Leave new item: " + item.name
                          : p.weapons.some((w) => w.id === item.id)
                            ? "Drop equipped: " + item.name
                            : "Drop: " + item.name
                      }
                      onClick={() =>
                        void send({
                          type: "pickup-swap",
                          id: item.id,
                          incomingId: swapPickup.id,
                        })
                      }
                    >
                      <ItemIcon item={item} />
                      {item.id === swapPickup.id
                        ? "Leave new item: "
                        : p.weapons.some((w) => w.id === item.id)
                          ? "Drop equipped: "
                          : "Drop: "}
                      {item.name}
                    </button>
                  ))}
                </div>
              </>
            ) : picked && selection ? (
              <>
                {selection.ground && (
                  <>
                    <div className="loot-swipe-zone">
                      {enemy
                        ? "Close inspection to return to the encounter"
                        : "Swipe here to leave loot & move · or use arrow keys"}
                    </div>
                    {atStairs && (
                      <button onClick={() => void send({ type: "ascend" })}>
                        Ascend · leave floor items
                      </button>
                    )}
                    {groundPile.length > 1 && (
                      <nav
                        className="ground-pile"
                        aria-label="Items at your feet"
                      >
                        {groundPile.map((item) => (
                          <button
                            key={item.id}
                            aria-label={"Inspect ground: " + item.name}
                            aria-pressed={picked.id === item.id}
                            onClick={() => setSelection({ item, ground: true })}
                          >
                            <ItemIcon item={item} />
                            <span>{item.name}</span>
                          </button>
                        ))}
                      </nav>
                    )}
                  </>
                )}
                <ItemIcon item={picked} large />
                <h2>{picked.name}</h2>
                <span
                  className={
                    "rarity-badge rarity-" + rarityInfo(picked.rarity).className
                  }
                >
                  {rarityInfo(picked.rarity).name}
                </span>
                <p className="item-lore">
                  <i>{itemLore(picked)}</i>
                </p>
                {picked.uses !== undefined &&
                  picked.kind === "summon-stone" && (
                    <p>
                      {picked.uses} / {picked.maxUses} uses left
                    </p>
                  )}
                {isGear && comparison ? (
                  <>
                    <p className="comparison-intro">
                      {comparison.alreadyEquipped
                        ? "★ Currently equipped"
                        : "Current → With this equipped"}
                    </p>
                    <div className="comparison-grid">
                      <b>Stat</b>
                      <b>Now</b>
                      <b>After</b>
                      <b>Change</b>
                      {comparison.rows.map((row) => (
                        <React.Fragment key={row.name}>
                          <span>{row.name}</span>
                          <span>{n(row.before)}</span>
                          <strong>{n(row.after)}</strong>
                          <em
                            className={
                              row.after > row.before
                                ? "better"
                                : row.after < row.before
                                  ? "worse"
                                  : ""
                            }
                          >
                            {row.after === row.before
                              ? "—"
                              : `${row.after > row.before ? "+" : ""}${n(row.after - row.before)}`}
                          </em>
                        </React.Fragment>
                      ))}
                    </div>
                    {equipmentDetails(picked)}
                    <p>
                      Basic attack uses {comparison.attackType}. Numbers are
                      rounded; combat keeps exact values.
                    </p>
                    {comparison.replaced && (
                      <p className="swap-explanation">
                        Replaces {comparison.replaced.name}.{" "}
                        {comparison.leaveOnFloor
                          ? "Bag full: old gear stays on this floor."
                          : "Old gear moves into your bag."}
                      </p>
                    )}
                    {comparison.problem && (
                      <p className="action-problem">{comparison.problem}</p>
                    )}
                    <div className="modal-actions">
                      {p.weapons.some((w) => w.id === picked.id)
                        ? actButton(
                            "Unequip",
                            { type: "unequip", id: picked.id },
                            g.inventory.length +
                              1 +
                              Number(p.weapons.length > 1) >
                              capacityOf(g),
                          )
                        : actButton(
                            selection.ground
                              ? comparison.leaveOnFloor
                                ? "Equip & leave old gear here"
                                : "Confirm equip from ground"
                              : "Confirm equip",
                            {
                              type: selection.ground ? "equip-floor" : "use",
                              id: picked.id,
                            } as Action,
                            !!comparison.problem,
                            "primary",
                          )}
                      {selection.ground && (
                        <button onClick={pickUp}>Pick up</button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p>{describe(picked)}</p>
                    {selection.ground ? (
                      <>
                        {picked.kind === "projectile" && (
                          <>
                            <p>
                              Throw directly from the floor at an adjacent
                              enemy.
                            </p>
                            {adjacentEnemies(g).map((m) => (
                              <React.Fragment key={m.id}>
                                {actButton(
                                  "Throw at " + m.name,
                                  {
                                    type: "throw-floor",
                                    id: picked.id,
                                    target: m.id,
                                  },
                                  false,
                                  "primary",
                                )}
                              </React.Fragment>
                            ))}
                            {!adjacentEnemies(g).length && (
                              <p className="action-problem">
                                No adjacent enemy to target. Pick it up for
                                later.
                              </p>
                            )}
                          </>
                        )}
                        {picked.kind === "mana-star" && availableSpells(g, { free: true }).map((s) =>
                          actButton(`Cast ${s.name} free`, { type: "use-floor", id: picked.id, spell: s.name }, false, "primary"))}
                        {picked.kind === "spiked-potion" && ["Health", "Power", "Luck", "Speed", "Magic", "Accuracy", "Armor"].map((stat) =>
                          actButton(`+5 ${stat} · pay half HP`, { type: "use-floor", id: picked.id, spell: stat }, false, "primary"))}
                        {!["mana-star", "spiked-potion"].includes(picked.kind) && canUseFromFloor(picked) &&
                          actButton(
                            picked.kind === "teleport"
                              ? "Use once & teleport"
                              : "Use from floor",
                            { type: "use-floor", id: picked.id },
                            !!itemUseProblem(g, picked),
                            "primary",
                          )}
                        <button onClick={pickUp}>
                          {picked.auto ? "Use now" : "Pick up"}
                        </button>
                      </>
                    ) : (
                      <>
                        {itemUseProblem(g, picked) && (
                          <p className="action-problem">
                            {itemUseProblem(g, picked)}
                          </p>
                        )}
                        {picked.kind === "mana-star" && availableSpells(g, { free: true }).map((s) =>
                          actButton(`Cast ${s.name} free`, { type: "use", id: picked.id, spell: s.name }, false, "primary"))}
                        {picked.kind === "spiked-potion" && ["Health", "Power", "Luck", "Speed", "Magic", "Accuracy", "Armor"].map((stat) =>
                          actButton(`+5 ${stat} · pay half HP`, { type: "use", id: picked.id, spell: stat }, false, "primary"))}
                        {!["mana-star", "spiked-potion"].includes(picked.kind) && actButton(
                          picked.kind === "projectile"
                            ? "Throw at " + (enemy?.name || "enemy")
                            : picked.kind === "teleport"
                              ? "Teleport to safety"
                              : picked.kind === "rope"
                                ? "Use rope & leave"
                                : "Use item",
                          { type: "use", id: picked.id },
                          !!itemUseProblem(g, picked),
                          "primary",
                        )}
                        {actButton("Drop", { type: "drop", id: picked.id })}
                      </>
                    )}
                  </>
                )}
                {selection.ground &&
                  actButton("Leave on floor", { type: "ignore" })}
              </>
            ) : panel === "level" ? (
              <>
                <h2>Level {p.level} · Choose a boost</h2>
                <p>Current stats and the change from each choice.</p>
                <div className="level-current-stats">
                  {[
                    "Health",
                    "Power",
                    "Luck",
                    "Accuracy",
                    "Speed",
                    "Magic",
                    "Armor",
                  ].map((stat) => (
                    <span key={stat}>
                      <small>{stat}</small>
                      <b>{n(p.stats[stat] || 0)}</b>
                    </span>
                  ))}
                </div>
                {levelChoices()}
                <details>
                  <summary>Full base and combat stats</summary>
                  {statList()}
                </details>
              </>
            ) : panel === "stats" ? (
              <>
                <h2>{p.name} · Full stats</h2>
                <p>
                  Lv {p.level} {p.className} · XP {n(g.xp)}/100 · Score{" "}
                  {n(g.score)} · Stair Keys {g.keys}
                </p>
                <p>
                  Stair Keys unlock stairs only and are tracked separately from
                  the Standard and Rare Keys in your bag.
                </p>
                {p.poisonImmune && (
                  <p>POISON IMMUNITY · permanent; curses still affect you.</p>
                )}
                {(g.chronicles || []).length > 0 && (
                  <details>
                    <summary>
                      Ashfall stories · {g.chronicles!.length} voices
                    </summary>
                    {g.chronicles!.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </details>
                )}
                <h3>Equipped</h3>
                {p.weapons.length ? (
                  p.weapons.map((i) => (
                    <div className="equipped-detail" key={i.id}>
                      <ItemIcon item={i} />
                      <span>
                        <b>{i.name}</b>
                        <small>
                          {i.kind === "tome"
                            ? `${i.element} · 2 MP/hit`
                            : `${i.uses}/${i.maxUses} uses`}
                        </small>
                      </span>
                      <button
                        onClick={() => {
                          setPanel(null);
                          setSelection({ item: i });
                        }}
                      >
                        Details
                      </button>
                    </div>
                  ))
                ) : (
                  <p>Unarmed</p>
                )}
                {statList()}
                {knownSpells.length > 0 && (
                  <>
                    <h3>Known magic</h3>
                    {knownSpells.map((s) => (
                      <p key={s.name}>
                        <b>{s.name}</b> · Magic {s.req} · {spellCost(g, s)} MP
                        <br />
                        {s.description}
                        <br />
                        <small>
                          {spells.some((v) => v.name === s.name)
                            ? "Ready to cast"
                            : g.pendingLevels
                              ? "Choose your level bonus first"
                              : p.stats.Magic < s.req
                                ? "Increase Magic to unlock"
                                : p.stats.Mana < spellCost(g, s)
                                  ? "Not enough mana"
                                  : s.when === "combat"
                                    ? "Requires an encounter"
                                    : "Use outside combat"}
                        </small>
                      </p>
                    ))}
                  </>
                )}
                <p>
                  Stats rounded to one decimal. Actual combat uses exact values.
                </p>
                {Object.entries(p.effects).filter(
                  ([label]) => label !== "Poison",
                ).length > 0 && (
                  <>
                    <h3>Active effects</h3>
                    <ul>
                      {Object.entries(p.effects)
                        .filter(([label]) => label !== "Poison")
                        .map(([label, value]) => (
                          <li key={label}>
                            {label}: {n(value[1])}
                            {label.includes("Booster") ? "%" : ""} · {value[0]}{" "}
                            {label === "Curse"
                              ? "world turns remaining · HP damage per turn; antidotes cure"
                              : "calculations remaining"}
                          </li>
                        ))}
                    </ul>
                  </>
                )}
                {p.effects.Poison && (
                  <p className="poison-chip">
                    Poison: −{n(Math.trunc(p.effects.Poison[1]))} HP each move
                    for {p.effects.Poison[0]} steps.
                  </p>
                )}
              </>
            ) : panel === "enemy" && enemy ? (
              <>
                <h2>{enemy.name} · Enemy stats</h2>
                {enemy.key && (
                  <p>
                    Carries a Stair Key · unlocks this floor’s locked stairs.
                  </p>
                )}
                {statList(enemy)}
                <p>
                  Enemy damage {danger?.normal} · Critical {danger?.critical} (
                  {chancePercent(criticalChance(combatAttackStats(enemy).Luck))}
                  ). Your hit chance {chancePercent(forecast?.hit || 0)}.
                </p>
                <p>
                  First to act: {danger?.enemyFirst ? enemy.name : "You"} · Your
                  initiative {n(attackInitiative(p))}, enemy{" "}
                  {n(enemy.stats.Speed)}.
                  <br />
                  {forecast?.hitsToKill === null
                    ? forecast &&
                      forecast.critical > 0 &&
                      forecast.critChance > 0
                      ? `${Math.ceil(enemy.hp / forecast.critical)} critical hits needed; normal hits deal no damage.`
                      : "Your basic attacks cannot damage this enemy."
                    : `${forecast?.hitsToKill} normal ${forecast?.hitsToKill === 1 ? "hit" : "hits"} to defeat this enemy.`}{" "}
                  {forecast &&
                    forecast.hitsToKill !== null &&
                    forecast.critChance > 0 &&
                    forecast.critical > forecast.normal &&
                    "Critical hits can shorten this."}
                </p>
              </>
            ) : panel === "npc" && enemy?.merchant ? (
              <MerchantPanel g={g} m={enemy} send={send} />
            ) : panel === "npc" && enemy?.npc ? (
              <>
                <img
                  className="chief-modal-art"
                  src={(enemy.npc!.tribe === "Emperor"
                    ? worldArt("Emperor", 4)
                    : sprite("Chieftan", 4, enemy.npc!.tribe)
                  ).toDataURL()}
                  alt={
                    enemy.merchant
                      ? "Villager"
                      : enemy.npc!.tribe + " chieftain"
                  }
                />
                <h2>{enemy.name}</h2>
                <p className="dialogue-tribe">{enemy.npc!.tribe} chieftain</p>
                <blockquote>{enemy.npc.line}</blockquote>
                {enemy.npc!.tribe === "Emperor" && (
                  <p className="action-problem">
                    {enemy.npc.deal === "Imperial Treasury"
                      ? "Pay 5 current HP → receive 100 gold"
                      : enemy.npc.deal === "Crown of Plenty"
                        ? "Pay 40 gold → receive a rare or ultrarare item"
                        : "Pay 10 maximum HP → permanently double Power and Magic"}
                  </p>
                )}
                <h3>
                  {enemy.npc.done
                    ? "No further bargains"
                    : "Bargain: " + enemy.npc.deal}
                </h3>
                {[
                  "Life",
                  "Death Wheel",
                  "All Items",
                  "Stat",
                  "Weapon",
                ].includes(enemy.npc.deal) && (
                  <p className="action-problem">
                    {enemy.npc.deal === "Life"
                      ? "This leaves you at 1 HP."
                      : enemy.npc.deal === "Death Wheel"
                        ? "This gamble can kill you."
                        : `This costs ${enemy.npc.deal.toLowerCase()}.`}
                  </p>
                )}
                {enemy.npc.deal === "Item of Choice" &&
                  g.inventory.length > 0 && (
                    <select
                      aria-label="Item to trade"
                      value={trade || g.inventory[0].id}
                      onChange={(e) => setTrade(e.target.value)}
                    >
                      {g.inventory.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  )}
                <div className="modal-actions">
                  {!enemy.npc.done &&
                    actButton(
                      "Accept deal: " + enemy.npc.deal,
                      { type: "deal", id: trade || g.inventory[0]?.id },
                      false,
                      "primary",
                    )}
                  {actButton("Leave peacefully", { type: "leave" })}
                </div>
              </>
            ) : panel === "save" ? (
              <>
                <h2>Saved after every action</h2>
                <p>
                  {isDeviceGame
                    ? "Progress is saved on this phone, including offline. This code works only on this installation. Uninstalling clears local saves."
                    : "Your journey is stored on the server. Keep this private recovery key to restore on another device."}
                </p>
                <textarea
                  readOnly
                  aria-label={
                    isDeviceGame
                      ? "Device journey code"
                      : "Private recovery key"
                  }
                  value={recovery}
                />
                <button
                  onClick={() =>
                    void navigator.clipboard
                      ?.writeText(recovery)
                      .then(() => announce("Code copied."))
                      .catch(() => announce("Select and copy the code."))
                  }
                >
                  Copy code
                </button>
                {isDeviceGame && (
                  <button onClick={() => void NativeApp.exitApp()}>
                    Close game
                  </button>
                )}
                <button onClick={onNew}>Start another journey</button>
              </>
            ) : (
              <>
                <h2>How to play</h2>
                <p>
                  Swipe the map once per tile, tap an adjacent tile, or use
                  arrow keys. Wait is in the map corner; Space also waits.
                </p>
                <p>
                  Tap your player panel to expand stats. Items scroll sideways
                  along the bottom; equipped gear is marked with a star. Tap
                  gear to compare attack, speed, hit chance, weight and
                  durability before confirming.
                </p>
                <p>
                  Magic appears only when spells are ready to cast. Tap a spell
                  card to cast. Attack exchanges blows; using items does not
                  spend a normal combat round. End encounter leaves safely.
                </p>
                <p>
                  Stair Keys come from a floor’s key carrier and unlock stairs
                  only. Standard Keys open chests; Rare Keys open chests or
                  secret doors.
                </p>
                <p>
                  Poison is shown in the top panel and damages you on successful
                  movement. Chieftains offer bargains; read the offer before
                  accepting.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

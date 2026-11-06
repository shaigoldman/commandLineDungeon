import { adventureStartLabel } from "./saved-adventures";
import { gauntletBonus, isCarriedPassive } from "../shared/passive-items";
import { rarityRank } from "../shared/rarity";
import { Chronicle, ChronicleFeed } from "./Chronicle";
import { itemIcon } from "./item-art";
import { deathStory } from "../shared/death-story";
import { itemOutcome, type ItemOutcome } from "../shared/item-outcome";
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
  spellMenu,
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
  experience,
  nextWeaponName,
  makeItem,
  armorOf,
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
import { describe, weaponSpecialEffect, spells as spellDefinitions } from "../shared/catalog";
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
  highScore?: number;
  lastAction?: { type: string; revision: number };
  onAction: (a: Action) => Promise<Game | undefined>;
  onNew: () => void;
  onSavedAdventures: () => void;
  clearError: () => void;
};
type Selection = { item: Item; ground?: boolean };
export function PlayScreen({
  game: g,
  busy,
  error,
  highScore = 0,
  lastAction,
  onAction,
  onNew,
  onSavedAdventures,
  clearError,
}: Props) {
  const bagOverflow = g.status === "playing" && !g.pendingLevels && g.inventory.length+Number(g.player.weapons.length>0)>capacityOf(g);
  const p = g.player,
    enemy = g.monsters.find((m) => m.id === g.combat),
    danger = enemy ? incomingDamage(enemy, p) : undefined,
    spells =
      g.status === "playing" && !g.pendingLevels ? spellMenu(g) : [];
  const [inspectedSpell, setInspectedSpell] = useState<(typeof spellDefinitions)[number] | null>(null);
  const [panel, setPanel] = useState<
      "stats" | "enemy" | "save" | "help" | "npc" | "level" | "chronicle" | null
    >(null),
    [selection, setSelection] = useState<Selection | null>(null),
    [overview, setOverview] = useState(false),
    [chronicleNotice, setChronicleNotice] = useState(""),
    [poisonFlash, setPoisonFlash] = useState(0),
    [curseFlash, setCurseFlash] = useState(0),
    [trapNotice, setTrapNotice] = useState<{ message: string; revision: number } | null>(null),
    [energyFullNotice, setEnergyFullNotice] = useState(0),
    [goldFlash, setGoldFlash] = useState<{ amount: number; revision: number } | null>(null),
    [itemResult, setItemResult] = useState<ItemOutcome | null>(null),
    [trade, setTrade] = useState("");
  const [swapPickup, setSwapPickup] = useState<Item | null>(null);
  const [boonNotice, setBoonNotice] = useState("");
  useEffect(() => setBoonNotice(""), [g.floor]);
  const modal = useRef<HTMLDivElement>(null);
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
    !inspectedSpell &&
    !swapPickup && !bagOverflow;
  const canSwipeEncounter = false;
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
  const [breakNotice, setBreakNotice] = useState("");
  const ownedElements = new Set(
    [...g.inventory, ...p.weapons]
      .filter((i) => i.kind === "tome")
      .map((i) => i.element),
  );
  const knownSpells = spellDefinitions.filter((s) =>
    ownedElements.has(s.element) || (ownedElements.has("Elemental") && ["Wind","Water","Fire","Mystery"].includes(s.element)),
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
    pickedGauntlet = picked ? gauntletBonus(p, picked) : undefined,
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
        <h3>You reached Level {p.level}!</h3>
        {g.levelBefore && <div className="level-gains">{Object.entries(g.levelBefore).filter(([stat])=>stat!=="Mana" && stat!=="ManaCapacity").map(([stat,before])=><p key={stat}>{stat}: {n(before)} → {n(p.stats[stat])} <b>+{n(p.stats[stat]-before)}</b></p>)}</div>}
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
    if (bagOverflow && !selection) return;
    setInspectedSpell(null);
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
    announce("Use the Flee or Leave encounter button.");
  }
  const origin = g.encounter?.enemyId === enemy?.id ? g.encounter : undefined;
  function announce(message: string) {
    setChronicleNotice(message.replace(/\b\d+\.\d{2,}\b/g, (v) => n(Number(v))));
  }
  useEffect(() => {
    document.body.classList.add("playing-game");
    return () => {
      document.body.classList.remove("playing-game");
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
      if (panel || selection || swapPickup || inspectedSpell || bagOverflow) return;
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
        announce("Choose a direction to move.");
      } else if (e.key.toLowerCase() === "v") setPanel("save");
      else if (e.key.toLowerCase() === "s") setPanel("stats");
      else if (e.key.toLowerCase() === "l") setPanel("chronicle");
      else if (e.key.toLowerCase() === "h") setPanel("help");
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [g, canMove, canSwipeEncounter, panel, selection, busy, lootMovementHint, swapPickup, inspectedSpell, bagOverflow]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = NativeApp.addListener("backButton", () => {
      if (bagOverflow) { if (selection) closeDetails(); return; }
      if (selection || swapPickup || inspectedSpell) closeDetails();
      else if (panel) setPanel(null);
      else setPanel("save");
    });
    return () => {
      void h.then((v) => v.remove());
    };
  }, [panel, selection, swapPickup, inspectedSpell, bagOverflow]);
  useEffect(() => {
    if (!panel && !selection && !swapPickup && !inspectedSpell && !bagOverflow) return;
    const old = document.activeElement as HTMLElement;
    const box = modal.current;
    box?.querySelector<HTMLElement>(".modal-close,button:not(:disabled)")?.focus();
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
  }, [panel, !!selection, swapPickup, inspectedSpell, bagOverflow]);
  async function send(a: Action) {
    if (busy) return;
    clearError();
    const before = g;
    const after = await onAction(a);
    if (!after) return;
    setChronicleNotice("");
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
    const consecutiveUse = remaining && (remaining.uses !== undefined || ["health-pot", "health-drain", "mana-rock", "energy-magnet", "mana-pot", "mana-stream"].includes(remaining.kind) || (remaining.kind === "stairfinder" && remaining.value < 0));
    setSelection(opensLoot ? { item: after.pendingLoot!, ground: true } : consecutiveUse && after.status === "playing" && !after.pendingLevels
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
    const boon = entries.find(line => line.startsWith("FLOOR BOON:"));
    if (boon) setBoonNotice(boon.replace("FLOOR BOON: ", ""));
    if (a.type === "use" || a.type === "use-floor") {
      const used = [...before.inventory, ...before.player.weapons, ...before.loot.map((loot) => loot.item)]
        .find((item) => item.id === a.id);
      if (used && !["weapon", "tome"].includes(used.kind)) {
        const result = itemOutcome(before, after, used, entries);
        setItemResult(result);
        setTimeout(() => setItemResult((current) => current?.revision === result.revision ? null : current), 2800);
      }
    }
    const trapMessages = entries.filter((line) => line.startsWith("TRAP:"));
    if (trapMessages.length) {
      const notice = { message: trapMessages.join(" "), revision: after.revision };
      setTrapNotice(notice);
      setTimeout(() => setTrapNotice((current) => current?.revision === notice.revision ? null : current), 3600);
    }
    if (entries.some((line) => /^(HEALTH|MANA) FULL:/.test(line))) {
      setEnergyFullNotice(after.revision);
      setTimeout(() => setEnergyFullNotice((current) => current === after.revision ? 0 : current), 1800);
    }
    const gainedGold = (after.player.gold || 0) - (before.player.gold || 0);
    if (gainedGold > 0) {
      setGoldFlash({ amount: gainedGold, revision: after.revision });
      setTimeout(() => setGoldFlash((current) => current?.revision === after.revision ? null : current), 2400);
    }
    if (entries.some((line) => line.includes("CRITICAL HIT!"))) {
      const index = entries.findIndex((line) => line.includes("CRITICAL HIT!"));
      setCriticalNotice("CRITICAL HIT! " + (entries[index + 1] || ""));
      clearTimeout(criticalTimer.current);
      criticalTimer.current = setTimeout(() => setCriticalNotice(""), 4500);
    }
    const broken = entries.find((line) => line.startsWith("WEAPON BROKE:"));
    if (broken) {
      setBreakNotice(broken);
      setTimeout(() => setBreakNotice((current) => current === broken ? "" : current), 5500);
    }
    const moved =
      after.player.x !== before.player.x || after.player.y !== before.player.y;
    if (before.player.effects.Curse && after.turn > before.turn && after.player.hp < before.player.hp)
      requestAnimationFrame(() => requestAnimationFrame(() => setCurseFlash(after.revision)));
    if (a.type === "move" && moved && before.player.effects.Poison)
      requestAnimationFrame(() => requestAnimationFrame(() => setPoisonFlash(after.revision)));
    if (entries.some(line => line.startsWith("CURSED:"))) setCurseFlash(after.revision);
    if (a.type === "move" && !moved && !after.combat) announce("Stone wall. Swipe another direction.");
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
        <p>Armor: {n(actor.stats.Armor || 0)} base + {n(armorOf(actor) - (actor.stats.Armor || 0))} shield = <b>{n(armorOf(actor))}</b></p>
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
  if (g.status === "dead") {
    const story = deathStory(g);
    return (
    <main className="death-scene"><DungeonView game={g} overview={overview} movementEnabled={false} onMove={()=>{}} onHint={()=>{}} />
    <section className="death-screen" data-testid="death-screen">
      <div className="death-screen-content">
        <span className="death-symbol" aria-hidden="true">☠</span>
        <p className="death-eyebrow">Your journey has ended</p>
        <h1>You Died</h1>
        <p className="death-hero">{p.name} · Level {p.level} · Floor {g.floor + 1}</p>
        <section className="death-cause" aria-label="How you died">
          <strong>{g.death?.critical ? "CRITICAL HIT — " : ""}{story.cause}</strong>
          <p>{story.context}</p>
          <em>“{story.flavor}”</em>
        </section>
        <div className="death-score"><span>Final score</span><strong>{n(g.score)}</strong></div><p>High score · {n(Math.max(highScore,g.score))}</p>
        <p>Run achievements</p>{(g.achievements || []).map(a=><p key={a.name}>🏆 {a.name} · +{a.points} points</p>)}
        <button className="death-restart" onClick={onNew}>Begin a new journey</button>
      </div>
    </section></main>
    );
  }
  return (
    <main
      className={
        "play-shell" +
        (p.effects.Poison ? " is-poisoned" : "") +
        (p.hp / p.stats.Health <= 0.1 ? " critical-hp" : "")
      }
    >
      <header className="play-header">
        {boonNotice && <aside className="boon-notice" role="status" aria-live="polite">
          <strong>Floor-clearing boon</strong><span>{boonNotice}</span>
          <button aria-label="Dismiss boon announcement" onClick={() => setBoonNotice("")}>×</button>
        </aside>}
        <b>◈ TEENY DUNGEON</b>
        <span className="floor-name">
          {g.inSecret
            ? "Secret chamber"
            : `F${g.floor + 1} · ${floorTheme(g.floor).name}`}{" "}
        </span>
        <button onClick={() => setPanel("save")}>
          {isDeviceGame ? "Saved on phone" : "Saved journey"} ●
        </button>
        {enemy && <button aria-label="Open journey chronicle" onClick={()=>setPanel("chronicle")}>Log</button>}
        <button aria-label="How to play" onClick={() => setPanel("help")}>
          ?
        </button>
      </header>
      <section
        className={"actor-panels has-secondary" + (enemy ? " has-enemy" : "")}
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
                  <b className="level-badge">LEVEL {p.level}</b> {p.className}
                </small>
              </strong>
              <span className="gold-purse" aria-label={`${p.gold || 0} gold`}>
                <img
                  src={itemIcon({ kind: "gold", name: "1 Gold Coin" })}
                  alt=""
                />
                <b>{p.gold || 0}</b>
                <small>gold</small>
                {goldFlash && <span key={goldFlash.revision} className="gold-gain" role="status">+{goldFlash.amount} gold</span>}
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
                          : i.armorBonus
                            ? `Shield +${i.armorBonus} armor · ${i.uses}/${i.maxUses} blocks`
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
            <label className="xp-label">EXP <b>{n(g.xp)}/100</b></label><progress className="xp-meter" max={100} value={g.xp} />
          </div>
        </section>
        {!enemy && <ChronicleFeed game={g} notice={chronicleNotice} isError={!!error} onRead={()=>setPanel("chronicle")} onDismiss={()=>{setChronicleNotice("");clearError();}} />}
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
                src={worldArt(enemy.className, 2, enemy.name).toDataURL()}
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
              <Portrait type={enemy.name.startsWith("Ergathon") ? "Ergathon" : enemy.className === "Dark Hero" ? enemy.heroClass || "Warrior" : enemy.className} className={enemy.className === "Dark Hero" ? "dark-hero-portrait"  : enemy.className === "Dragon" && !enemy.boss ? "green-dragon-portrait" : ""} />
            )}
            <span>
              <strong>
                {enemy.name}{" "}
                <small>
                  <b className="level-badge">LEVEL {enemy.level}</b> ·{" "}
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
              <small className="enemy-reward">Expected EXP +{experience(enemy.level,p.level)*((g.expDoubles || 0)>0 ? 2 : 1)} · Damage {danger?.normal} · Crit {danger?.critical}</small>
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

        </div>
        {enemy?.npc && !enemy.merchant && (
          <div className="chief-speech" aria-label="Chieftain speech bubble">
            <img
              alt={enemy.npc.tribe + " chieftain"}
              src={(enemy.npc.tribe === "Emperor"
                ? worldArt("Emperor",3)
                : sprite("Chieftan",3,enemy.npc.tribe)
              ).toDataURL()}
            />
            <div>
              <strong>{enemy.name} · {enemy.npc.tribe}</strong>
              <p>“{enemy.npc.line}”</p>
              <button onClick={() => setPanel("npc")}>Discuss trade</button>
            </div>
          </div>
        )}
        {criticalNotice && (
          <div className="critical-notice" role="alert">
            ✦ {criticalNotice}
          </div>
        )}
        {breakNotice && <div className="break-notice" role="alert">⚠ {breakNotice}</div>}
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
        {trapNotice && (
          <div key={trapNotice.revision} className="trap-alert" role="alert" data-testid="trap-alert">
            <div className="trap-alert-flash" aria-hidden="true" />
            <div className="trap-alert-card">
              <strong>⚠ TRAP!</strong>
              <span>{trapNotice.message.replace(/^TRAP:\s*/, "")}</span>
            </div>
          </div>
        )}
        {!!energyFullNotice && (
          <div key={energyFullNotice} className="energy-full-notice" role="status" data-testid="energy-full-notice">
            <strong>{[...g.log].reverse().find(line=>/^(HEALTH|MANA) FULL:/.test(line))?.split(":")[0] || "HEALTH FULL"}</strong>
            <span>No energy restored. This pod remains here for later.</span>
          </div>
        )}
        {itemResult && (
          <div key={itemResult.revision} className="item-result-notice" role="status" data-testid="item-result-notice">
            {itemResult.reward && <ItemIcon item={itemResult.reward} />}
            <span><strong>{itemResult.title}</strong><small>{itemResult.detail}</small></span>
          </div>
        )}
      </section>
      {context && (
        <section
          className="play-context"
          aria-hidden={!!selection || !!swapPickup || !!panel || bagOverflow}
        >
          {g.status === "won" ? (
            <>
              <strong>Ruthagor defeated · Score {n(g.score)}</strong>
              <span>The deeper dungeon awaits.</span>
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
                  {hitRate(p,enemy)<60 && <p className="kill-warning encounter-hit-warning">{hitRate(p,enemy)<40 ? "⚠ Very low" : "⚠ Low"} hit chance: {n(hitRate(p,enemy))}%</p>}
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
                    {enemy?.burn && <p className="kill-warning">🔥 BURNING · {n(enemy.burn[1])} damage per action · {enemy.burn[0]} turns</p>}
                    {enemy?.className==="Dark Hero" && <p className="speech-bubble">...</p>}
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
                    {activeChest.kind || (activeChest.ultra ? "Amethyst" : "Standard")} chest
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
          BAG {g.inventory.length + Number(p.weapons.length > 0)}/{capacityOf(g) === Infinity ? "∞" : capacityOf(g)} · {capacityOf(g) === Infinity ? "Unlimited slots" : g.inventory.length + Number(p.weapons.length > 0) >= capacityOf(g) ? "FULL — use or drop an item" : `${capacityOf(g)-g.inventory.length-Number(p.weapons.length>0)} slots free`}
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
              const passive = isCarriedPassive(item);
              const gauntlet = gauntletBonus(p, item);
              return (
                <button
                  key={item.id}
                  className={
                    "item-card" +
                    (held ? " is-equipped" : "") +
                    (problem && !passive ? " unavailable" : "") +
                    (gauntlet?.active ? " passive-active" : "")
                  }
                  aria-label={(held ? "Equipped: " : "Item: ") + item.name}
                  onClick={() => setSelection({ item })}
                >
                  <ItemIcon item={item} />
                  <strong>{item.name}</strong>
                  <small>
                    {held
                      ? "★ EQUIPPED"
                      : passive
                        ? gauntlet && !gauntlet.active ? "PASSIVE · INACTIVE" : "PASSIVE · ACTIVE"
                      : problem
                        ? "Unavailable now"
                        : ["weapon", "tome"].includes(item.kind)
                          ? "Compare / equip"
                          : "Usable now"}
                  </small>
                  <em>
                    {gauntlet
                      ? gauntlet.active ? gauntlet.label : `Needs ${gauntlet.requirement}`
                      : passive ? "Works while in your bag"
                      : item.kind === "weapon"
                      ? `${item.uses}/${item.maxUses} uses`
                      : item.uses && item.maxUses
                        ? `${item.uses}/${item.maxUses} uses`
                      : item.kind === "tome"
                        ? `${item.element}${item.value ? ` · +${item.value} Magic` : ""}`
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
                className={"spell-card" + (!availableSpells(g).some(v=>v.name===s.name) ? " unavailable" : "")}
                key={s.name}
                disabled={busy || g.status !== "playing" || !!g.pendingLevels}
                aria-label={`Cast ${s.name} · ${spellCost(g, s)} MP`}
                onClick={() => setInspectedSpell(s)}
              >
                <img
                  src={spellIcon(s.name, s.element)}
                  alt={s.name + " spell sprite"}
                />
                <strong>{s.name}</strong>
                <small>{spellCost(g, s)} MP · Inspect</small>
              </button>
            ))}
          </div>
        </section>
      )}
      {g.status === "won" && <div className="play-backdrop victory-backdrop"><section className="play-modal victory-screen" role="dialog" aria-label="Victory"><span className="death-symbol">♛</span><h1>Ruthagor defeated!</h1><p>You conquered floor {g.floor+1}.</p><p>Score <strong>{n(g.score)}</strong></p><p>Your story can continue. New enemies and treasures wait below.</p>{actButton(`Continue to floor ${g.floor+2} →`,{type:"continue"},false,"primary")}<button onClick={onNew}>Begin a new adventure</button></section></div>}
      {inspectedSpell && <div className="play-backdrop" onClick={()=>setInspectedSpell(null)}><section ref={modal} className="play-modal spell-inspection" role="dialog" aria-modal="true" aria-label={inspectedSpell.name} onClick={e=>e.stopPropagation()}>
        <button className="modal-close" aria-label="Close spell" onClick={()=>setInspectedSpell(null)}>×</button>
        <img width="64" src={spellIcon(inspectedSpell.name,inspectedSpell.element)} alt="" />
        <h2>{inspectedSpell.name}</h2><p>{inspectedSpell.description}</p>
        <p>{spellCost(g,inspectedSpell)} mana · Requires {inspectedSpell.req} Magic · You have {n(p.stats.Mana)} mana and {n(p.stats.Magic)} Magic</p>
        <button className="primary" disabled={busy || !availableSpells(g).some(s=>s.name===inspectedSpell.name)} onClick={()=>{void send({type:"cast",spell:inspectedSpell.name});setInspectedSpell(null);}}>Cast {inspectedSpell.name}</button>
      </section></div>}
      {(panel || selection || swapPickup || bagOverflow) && (
        <div
          className="play-backdrop"
          onPointerDown={(e) => {
            swipedLoot.current = false;
            if (
              bagOverflow || !(selection?.ground || (enemy && (panel === "npc" || panel === "enemy"))) ||
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
              bagOverflow && !selection ? "Bag over capacity" : swapPickup
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
                            : panel === "chronicle" ? "Journey chronicle" : "How to play"
            }
            onClick={(e) => e.stopPropagation()}
          >
            {!(bagOverflow && !selection) && <button
              className="modal-close"
              aria-label="Close details"
              onClick={() => {
                closeDetails();
              }}
            >
              ×
            </button>}
            {error && (
              <p className="action-problem" role="alert">
                {error}
              </p>
            )}
            {bagOverflow && !selection ? (
              <>
                <h2>Make room in your bag</h2>
                <p>Your new gear is equipped. Use or drop an item before continuing.</p>
                <p className="bag-overflow-count">BAG {g.inventory.length+Number(p.weapons.length>0)}/{capacityOf(g)} · {g.inventory.length+Number(p.weapons.length>0)-capacityOf(g)} over capacity</p>
                <div className="swap-use-items">{g.inventory.filter(item=>!isCarriedPassive(item) && !["weapon","tome"].includes(item.kind) && !itemUseProblem(g,item)).map(item=><button key={item.id} onClick={()=>setSelection({item,ground:false})}>Use {item.name}</button>)}</div>
                <div className="swap-items">{[...g.inventory,...p.weapons].map(item=><button key={item.id} aria-label={(p.weapons.some(w=>w.id===item.id)?"Drop equipped: ":"Drop: ")+item.name} onClick={()=>void send({type:"drop",id:item.id})}><ItemIcon item={item}/>{p.weapons.some(w=>w.id===item.id)?"Drop equipped: ":"Drop: "}{item.name}</button>)}</div>
              </>
            ) : swapPickup ? (
              <>
                <h2>Bag is full</h2>
                <p>
                  Use an item to free a slot, or choose one to drop to keep {swapPickup.name}. You can
                  leave the newly found item instead.
                </p>
                <div className="swap-use-items">{g.inventory.filter(item=>!itemUseProblem(g,item) && !["weapon","tome","anvil","spiked-potion","mixing-potion"].includes(item.kind)).map(item=><button key={item.id} onClick={()=>void send({type:"use",id:item.id})}>Use {item.name}</button>)}</div>
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
                {weaponSpecialEffect(picked) && <p className="passive-status" role="status"><b>{p.weapons.some(w=>w.id===picked.id) && p.hp<10 ? "ACTIVE" : "INACTIVE"}</b> · {weaponSpecialEffect(picked)}</p>}
                {!selection.ground && <div className="item-drop-action">{actButton("↓ Drop item on floor", {type:"drop",id:picked.id},busy)}</div>}
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
                        {comparison.requiresCleanup
                          ? "Old gear moves into your bag; choose an item to use or drop after equipping."
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
                              ? comparison.requiresCleanup
                                ? "Equip, then make bag space"
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
                    {isCarriedPassive(picked) && <p className="passive-status" role="status">
                      {selection.ground ? "Pick up to carry this passive item." : pickedGauntlet ?
                        pickedGauntlet.active ? `ACTIVE · ${pickedGauntlet.label}. Already included in your combat damage.` :
                        `INACTIVE · Requires ${pickedGauntlet.requirement}. Currently ${n(p.stats.Mana)} mana and ${n(p.hp)} HP.` :
                        "ACTIVE · Works automatically while carried."}
                    </p>}
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
                        {picked.kind === "mana-star" && availableSpells(g, { free: true }).sort((a,b)=>spellCost(g,a)-spellCost(g,b)).map((s) =>
                          actButton(`Cast ${s.name} free`, { type: "use-floor", id: picked.id, spell: s.name }, false, "primary"))}
                        {picked.kind === "mixing-potion" && ["Health","Power","Speed","Luck","Magic","Accuracy","Armor"].flatMap(lose=>["Health","Power","Speed","Luck","Magic","Accuracy","Armor"].filter(gain=>gain!==lose && (p.stats[lose] || 0)>=3).map(gain=>actButton(`${lose} −3 → ${gain} +3`,{type:"use",id:picked.id,spell:`${lose}:${gain}`})))}
                        {picked.kind === "spiked-potion" && ["Health", "Power", "Luck", "Speed", "Magic", "Accuracy", "Armor"].map((stat) =>
                          actButton(`+5 ${stat} · pay half HP`, { type: "use-floor", id: picked.id, spell: stat }, false, "primary"))}
                        {!picked.auto && !isCarriedPassive(picked) && !["mana-star", "spiked-potion", "mixing-potion"].includes(picked.kind) && canUseFromFloor(picked) &&
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
                        {!isCarriedPassive(picked) && itemUseProblem(g, picked) && (
                          <p className="action-problem">
                            {itemUseProblem(g, picked)}
                          </p>
                        )}
                        {picked.kind === "mana-star" && availableSpells(g, { free: true }).sort((a,b)=>spellCost(g,a)-spellCost(g,b)).map((s) =>
                          actButton(`Cast ${s.name} free`, { type: "use", id: picked.id, spell: s.name }, false, "primary"))}
                        {picked.kind === "mixing-potion" && ["Health","Power","Speed","Luck","Magic","Accuracy","Armor"].flatMap(lose=>["Health","Power","Speed","Luck","Magic","Accuracy","Armor"].filter(gain=>gain!==lose && (p.stats[lose] || 0)>=3).map(gain=>actButton(`${lose} −3 → ${gain} +3`,{type:"use",id:picked.id,spell:`${lose}:${gain}`})))}
                        {picked.kind === "spiked-potion" && ["Health", "Power", "Luck", "Speed", "Magic", "Accuracy", "Armor"].map((stat) =>
                          actButton(`+5 ${stat} · pay half HP`, { type: "use", id: picked.id, spell: stat }, false, "primary"))}
                        {picked.kind === "anvil" && [...g.inventory, ...p.weapons].filter((weapon) => nextWeaponName(weapon)).map((weapon) => {
                          const next = makeItem(structuredClone(g), nextWeaponName(weapon)!);
                          return <button key={weapon.id} className="upgrade-choice" disabled={busy || !!itemUseProblem(g, picked)} onClick={() => void send({ type: "use", id: picked.id, target: weapon.id })}>
                            <ItemIcon item={weapon} />
                            <span><b>Upgrade {weapon.name} → {next.name}</b><small>{p.weapons.some(w=>w.id===weapon.id) ? "★ Equipped · " : "In bag · "}Attack {weapon.attack} → {next.attack} · Weight {weapon.weight} → {next.weight} · Uses {weapon.uses}/{weapon.maxUses} → {next.maxUses}/{next.maxUses}</small></span>
                          </button>;
                        })}
                        {picked.kind === "blade-shard" && [...g.inventory,...p.weapons].filter((weapon) => weapon.kind === "weapon" && (weapon.uses || 0) < (weapon.maxUses || 0)).map((weapon) =>
                          <button key={weapon.id} className="upgrade-choice" disabled={busy || !!itemUseProblem(g, picked)} onClick={() => void send({ type: "use", id: picked.id, target: weapon.id })}>
                            <ItemIcon item={weapon} /><span><b>Restore {weapon.name}</b><small>{p.weapons.some(w=>w.id===weapon.id) ? "★ Equipped · " : "In bag · "}{weapon.uses}/{weapon.maxUses} → {weapon.maxUses}/{weapon.maxUses} uses</small></span>
                          </button>)}
                        {picked.kind === "magic-scabbard" && [...g.inventory, ...p.weapons].filter((item) => item.id !== picked.id && (item.uses || 0) > 0).map((item) =>
                          <button key={item.id} className="upgrade-choice" disabled={busy} onClick={() => void send({ type: "use", id: picked.id, target: item.id })}>
                            <ItemIcon item={item} /><span><b>Double {item.name}</b><small>{p.weapons.some(w=>w.id===item.id) ? "★ Equipped · " : "In bag · "}{item.uses} → {(item.uses || 0) * 2} uses · usual max {item.maxUses}</small></span>
                          </button>)}
                        {picked.kind === "alchemy-book" && g.inventory.filter((item) => item.id !== picked.id && rarityRank(item.rarity) < 3).map((item) =>
                          <button key={item.id} className="upgrade-choice" disabled={busy || !!itemUseProblem(g, picked)} onClick={() => void send({ type: "use", id: picked.id, target: item.id })}>
                            <ItemIcon item={item} /><span><b>Transmute {item.name}</b><small>5 gold · usually one rarity tier higher · small misfire chance</small></span>
                          </button>)}
                        {picked.kind === "magic-wand" && g.inventory.filter((item) => item.id !== picked.id).flatMap((item) => ["Fire", "Wind", "Water"].map((element) =>
                          <button key={item.id + element} className="upgrade-choice" disabled={busy || (item.kind === "infinite-bag" && g.inventory.length - 1 + Number(p.weapons.length > 0) > g.capacity)} onClick={() => void send({ type: "use", id: picked.id, target: item.id, spell: element })}>
                            <ItemIcon item={item} /><span><b>{item.name} → {element} Staff</b><small>Consumes Magic Wand</small></span>
                          </button>))}
                        {picked.kind === "energy-harness" && g.pods.filter((pod) => Math.abs(pod.x - p.x) + Math.abs(pod.y - p.y) === 1).map((pod) =>
                          <button key={`${pod.x},${pod.y}`} className="upgrade-choice" disabled={busy} onClick={() => void send({ type: "use", id: picked.id, target: `${pod.x},${pod.y}` })}>
                            <span><b>Convert adjacent {pod.max ? "large" : "small"} energy pod</b><small>At {pod.x},{pod.y} · item appears there</small></span>
                          </button>)}
                        {!isCarriedPassive(picked) && ! ["mana-star", "spiked-potion", "anvil", "blade-shard", "magic-scabbard", "alchemy-book", "magic-wand", "energy-harness"].includes(picked.kind) && actButton(
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
                        <button className="primary" onClick={closeDetails}>{isCarriedPassive(picked) ? "Close" : "Done using"}</button>
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
                  <b className="level-badge">LEVEL {p.level}</b> {p.className} · XP {n(g.xp)}/100 · Score{" "}
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
            ) : panel === "chronicle" ? (
              <Chronicle game={g} />
            ) : panel === "save" ? (
              <>
                <h2>Saved after every action</h2>
                <p>{isDeviceGame ? "Progress is saved on this phone, including offline." : "Progress is saved automatically. Your saved adventures are available in this browser."}</p>
                <p className="saved-adventure-current"><strong>{p.name}</strong><span>{adventureStartLabel(g.startedAt)}</span></p>
                <button onClick={onSavedAdventures}>Saved adventures</button>
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
                  arrow keys. Choose an action or a direction each turn.
                </p>
                <p>
                  Tap your player panel to expand stats. Items scroll sideways
                  along the bottom; equipped gear is marked with a star. Tap
                  gear to compare attack, speed, hit chance, weight and
                  durability before confirming.
                </p>
                <p>
                  Magic includes spells you are still growing into. Tap a spell
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

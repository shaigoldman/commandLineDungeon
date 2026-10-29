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
  hitRate,
} from "../shared/engine";
import {
  adjacentEnemies,
  displayNumber as n,
  equipmentComparison,
  floorTheme,
  outgoingDamage,
  freshGameLog,
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
      "stats" | "enemy" | "save" | "help" | "npc" | null
    >(null),
    [selection, setSelection] = useState<Selection | null>(null),
    [overview, setOverview] = useState(false),
    [toast, setToast] = useState(""),
    [poisonFlash, setPoisonFlash] = useState(0),
    [trade, setTrade] = useState("");
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
    !!g.pendingLoot ||
    !!enemy;
  const canMove = !context && !busy && !panel && !selection;
  const lootPaused =
    !!g.pendingLoot && !enemy && !g.pendingLevels && g.status === "playing";
  const lootMovementHint =
    lootPaused && !panel && !selection && !busy
      ? "Item at your feet. Inspect it, or choose Leave & resume to keep moving. The item stays here."
      : undefined;
  const forecast = enemy ? outgoingDamage(p, enemy) : undefined;
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
        setPanel(null);
        setSelection(null);
        return;
      }
      if (panel || selection) return;
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
      if (dirs[e.key] && canMove) {
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
  }, [g, canMove, panel, selection, busy, lootMovementHint]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = NativeApp.addListener("backButton", () => {
      if (selection) setSelection(null);
      else if (panel) setPanel(null);
      else setPanel("save");
    });
    return () => {
      void h.then((v) => v.remove());
    };
  }, [panel, selection]);
  useEffect(() => {
    if (!panel && !selection) return;
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
  }, [panel, !!selection]);
  async function send(a: Action) {
    if (busy) return;
    clearError();
    const before = g;
    const after = await onAction(a);
    if (!after) return;
    setSelection(null);
    if (["deal", "use", "cast", "throw-floor"].includes(a.type)) setPanel(null);
    const entries = freshGameLog(before, after);
    if (entries.some((line) => line.includes("Critical hit!"))) {
      const index = entries.findIndex((line) => line.includes("Critical hit!"));
      setCriticalNotice("CRITICAL HIT! " + (entries[index + 1] || ""));
      clearTimeout(criticalTimer.current);
      criticalTimer.current = setTimeout(() => setCriticalNotice(""), 4500);
    }
    const moved =
      after.player.x !== before.player.x || after.player.y !== before.player.y;
    if (a.type === "move" && moved && before.player.effects.Poison) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setPoisonFlash(after.revision)),
      );
      announce(
        `Poison: −${n(Math.trunc(before.player.effects.Poison[1]))} HP. ${after.player.effects.Poison?.[0] || 0} steps remaining.`,
      );
    } else if (after.status === "dead") announce("Your journey has ended.");
    else if (after.keys > before.keys) announce("Staircase key acquired!");
    else if (after.pendingLevels) announce("Level up! Choose a bonus.");
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
        `Cast ${a.spell}.${after.player.hp !== before.player.hp ? ` HP ${after.player.hp > before.player.hp ? "+" : ""}${n(after.player.hp - before.player.hp)}.` : ""}${before.combat && !after.combat ? " Encounter ended." : ""}${before.player.effects.Poison && !after.player.effects.Poison ? " Poison cleared." : ""}`,
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
      <dl className="full-stat-grid">
        {Object.entries({
          HP: `${Math.ceil(actor.hp)}/${Math.ceil(actor.stats.Health)}`,
          Level: n(actor.level),
          ...Object.fromEntries(
            Object.entries(actor.stats).map(([k, v]) => [k, n(v)]),
          ),
          Attack: n(stats.Attack),
          "Combat speed": n(stats.Speed),
          Initiative: n(actor === p ? attackInitiative(p) : actor.stats.Speed),
        }).map(([label, value]) => (
          <React.Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </React.Fragment>
        ))}
      </dl>
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
  const ground =
    g.pendingLoot || g.loot.find((l) => l.x === p.x && l.y === p.y)?.item;
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
          F{g.floor + 1} · {floorTheme(g.floor).name}
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
              {p.effects.Poison && (
                <span className="poison-chip">
                  POISON −{n(Math.trunc(p.effects.Poison[1]))} HP / step ·{" "}
                  {p.effects.Poison[0]} steps
                </span>
              )}
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
              MP <b>{n(p.stats.Mana)}/10</b>
            </label>
            <meter min={0} max={10} value={p.stats.Mana} />
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
            {enemy.npc ? (
              <img
                className="chief-hud"
                src={sprite("Chieftan", 2, enemy.npc.tribe).toDataURL()}
                alt={enemy.npc.tribe + " chieftain"}
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
                {n(enemy.stats.Armor || 0)} · SPD {n(enemy.stats.Speed)}
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
          movementEnabled={canMove}
          movementBlockedHint={lootMovementHint}
          onMove={(dx, dy) => {
            if (canMove) void send({ type: "move", dx, dy });
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
            ITEM FOUND · Movement paused
            <br />
            Choose an item action or Leave &amp; resume below.
          </p>
        )}
        {enemy?.npc && (
          <div className="chief-speech" aria-label="Chieftain speech bubble">
            <img
              alt={enemy.npc.tribe + " chieftain"}
              src={sprite("Chieftan", 3, enemy.npc.tribe).toDataURL()}
            />
            <div>
              <strong>
                {enemy.name} · {enemy.npc.tribe}
              </strong>
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
      </section>
      {context && (
        <section className="play-context">
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
              <div className="context-actions">
                {[
                  "Health",
                  "Power",
                  "Luck",
                  "Magic",
                  "EXP",
                  "Accuracy + Speed",
                  ...(p.className === "Knight" && p.level % 3 === 0
                    ? ["Armor"]
                    : []),
                ].map((stat) => (
                  <React.Fragment key={stat}>
                    {actButton(stat + (stat === "EXP" ? " +20" : " +2"), {
                      type: "level",
                      stat,
                    })}
                  </React.Fragment>
                ))}
              </div>
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
                      Crit {forecast?.critical} · Hit {n(forecast?.hit || 0)}%
                      {staffInactive ? " · STAFF INACTIVE" : ""}
                    </span>
                  </div>
                  <div
                    className={
                      "turn-order" + (danger?.enemyFirst ? " enemy-first" : "")
                    }
                  >
                    <b>1 · {danger?.enemyFirst ? enemy.name : "YOU"}</b>
                    <span>→</span>
                    <b>2 · {danger?.enemyFirst ? "YOU" : enemy.name}</b>
                    <small>on Attack · if alive</small>
                  </div>
                  {(danger?.lethal || danger?.criticalLethal) && (
                    <p className="kill-warning">
                      ⚠{" "}
                      {danger.lethal
                        ? "Next enemy hit can kill you"
                        : "A critical hit can kill you"}{" "}
                      · {danger.normal} / crit {danger.critical} damage
                    </p>
                  )}
                  <div className="context-actions">
                    {enemy.npc && (
                      <button
                        className="primary"
                        onClick={() => setPanel("npc")}
                      >
                        Talk / trade
                      </button>
                    )}
                    {actButton(
                      enemy.npc ? "Attack chief" : "Attack",
                      { type: "attack" },
                      false,
                      enemy.npc ? "" : "primary",
                    )}
                    {actButton(
                      origin?.engaged ? "End encounter" : "Close inspection",
                      { type: "leave" },
                    )}
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
              {!enemy && ground && (
                <div className="ground-prompt">
                  <ItemIcon item={ground} />
                  <span>
                    <strong>{ground.name}</strong>
                    <small>Movement paused · choose an action</small>
                  </span>
                  <button
                    className="primary"
                    onClick={() => setSelection({ item: ground, ground: true })}
                  >
                    {["weapon", "tome"].includes(ground.kind)
                      ? "Compare / equip"
                      : "Inspect / use"}
                  </button>
                  {actButton("Leave & resume", { type: "ignore" })}
                </div>
              )}
              {!enemy && !ground && atStairs && (
                <div className="context-actions">
                  {actButton("Ascend", { type: "ascend" }, false, "primary")}
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
          BAG {g.inventory.length + Number(p.weapons.length > 0)}/{g.capacity}
        </span>
        <div className="item-carousel">
          {!g.pendingLoot && ground && (
            <button
              className="item-card ground-card"
              aria-label={"Ground: " + ground.name}
              onClick={() => setSelection({ item: ground, ground: true })}
            >
              <ItemIcon item={ground} />
              <strong>{ground.name}</strong>
              <small>AT YOUR FEET</small>
              <em>Inspect ground item</em>
            </button>
          )}
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
                  {!held && item.kind === "antidote" && p.effects.Poison && (
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
                aria-label={`Cast ${s.name} · ${s.cost} MP`}
                onClick={() => void send({ type: "cast", spell: s.name })}
              >
                <img
                  src={spellIcon(s.name, s.element)}
                  alt={s.name + " spell sprite"}
                />
                <strong>{s.name}</strong>
                <small>{s.cost} MP · Cast</small>
              </button>
            ))}
          </div>
        </section>
      )}
      {(panel || selection) && (
        <div
          className="play-backdrop"
          onClick={() => {
            setPanel(null);
            setSelection(null);
          }}
        >
          <div
            ref={modal}
            className="play-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              selection
                ? isGear
                  ? "Equipment comparison"
                  : "Item details"
                : panel === "stats"
                  ? "Full player stats"
                  : panel === "enemy"
                    ? "Enemy stats"
                    : panel === "npc"
                      ? "Chieftain dialogue"
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
                setPanel(null);
                setSelection(null);
              }}
            >
              ×
            </button>
            {error && (
              <p className="action-problem" role="alert">
                {error}
              </p>
            )}
            {picked && selection ? (
              <>
                <ItemIcon item={picked} large />
                <h2>{picked.name}</h2>
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
                              g.capacity,
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
                      {selection.ground &&
                        actButton(
                          "Store in bag",
                          { type: "pickup" },
                          g.inventory.length + Number(p.weapons.length > 0) >=
                            g.capacity,
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
                        {canUseFromFloor(picked) &&
                          actButton(
                            picked.kind === "teleport"
                              ? "Use once & teleport"
                              : "Use from floor",
                            { type: "use-floor", id: picked.id },
                            !!itemUseProblem(g, picked),
                            "primary",
                          )}
                        {actButton(
                          picked.auto ? "Use now" : "Pick up",
                          { type: "pickup" },
                          !picked.auto &&
                            g.inventory.length + Number(p.weapons.length > 0) >=
                              g.capacity,
                        )}
                      </>
                    ) : (
                      <>
                        {itemUseProblem(g, picked) && (
                          <p className="action-problem">
                            {itemUseProblem(g, picked)}
                          </p>
                        )}
                        {actButton(
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
            ) : panel === "stats" ? (
              <>
                <h2>{p.name} · Full stats</h2>
                <p>
                  Lv {p.level} {p.className} · XP {n(g.xp)}/100 · Score{" "}
                  {n(g.score)} · Keys {g.keys}
                </p>
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
                        <b>{s.name}</b> · Magic {s.req} · {s.cost} MP
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
                                : p.stats.Mana < s.cost
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
                            calculations remaining
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
                {statList(enemy)}
                <p>
                  Enemy damage {danger?.normal} · Critical {danger?.critical}.
                  Your hit chance {n(Math.min(100, hitRate(p, enemy)))}%.
                </p>
                <p>
                  Initiative: you {n(attackInitiative(p))}, enemy{" "}
                  {n(enemy.stats.Speed)}. Higher acts first; ties go to you.
                </p>
              </>
            ) : panel === "npc" && enemy?.npc ? (
              <>
                <img
                  className="chief-modal-art"
                  src={sprite("Chieftan", 4, enemy.npc.tribe).toDataURL()}
                  alt={enemy.npc.tribe + " chieftain"}
                />
                <h2>{enemy.name}</h2>
                <p className="dialogue-tribe">{enemy.npc.tribe} chieftain</p>
                <blockquote>{enemy.npc.line}</blockquote>
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

import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import type { Game, Action } from "../shared/types";
import { classes, describe } from "../shared/catalog";
import {
  availableSpells,
  combatAttackStats,
  hitRate,
  fleeChance,
} from "../shared/engine";
import { DungeonView } from "./DungeonView";
import { Portrait } from "./Portrait";
import "./style.css";
function App() {
  const [highScore, setHighScore] = useState(0);
  const [game, setGame] = useState<Game>(),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [tab, setTab] = useState("journal"),
    [help, setHelp] = useState(false),
    [save, setSave] = useState(false),
    [name, setName] = useState(""),
    [cls, setCls] = useState("Warrior"),
    [element, setElement] = useState("Wind"),
    [difficulty, setDifficulty] = useState(0),
    [trade, setTrade] = useState(""),
    [recover, setRecover] = useState(""),
    [recovery, setRecovery] = useState(
      localStorage.getItem("dungeon-key") || "",
    );
  const lock = useRef(false),
    journal = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void fetch("/api/high-score")
      .then((r) => r.json())
      .then((d) => setHighScore(d.score))
      .catch(() => {});
  }, [game?.status]);
  async function api(path: string, body?: unknown, key?: string) {
    const r = await fetch("/api/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: "Bearer " + key } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json();
    if (data.game) setGame(data.game);
    if (!r.ok) throw Error(data.error || "Request failed");
    return data;
  }
  useEffect(() => {
    api("game", undefined, localStorage.getItem("dungeon-key") || undefined)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  async function act(a: Action) {
    if (!game || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await api(
        "action",
        { action: a, revision: game.revision },
        recovery || undefined,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).matches("input,select,textarea") ||
        help ||
        save
      )
        return;
      const k = e.key.toLowerCase();
      const dirs: Record<string, [number, number]> = {
        arrowup: [0, -1],
        arrowdown: [0, 1],
        arrowleft: [-1, 0],
        arrowright: [1, 0],
      };
      if (dirs[k]) {
        e.preventDefault();
        void act({ type: "move", dx: dirs[k][0], dy: dirs[k][1] });
      } else if (k === " ") {
        e.preventDefault();
        void act({ type: "wait" });
      } else if (k === "i") setTab("inventory");
      else if (k === "m") setTab("spells");
      else if (k === "s") setTab("stats");
      else if (k === "h") setHelp(true);
      else if (k === "v") setSave(true);
      else if (k === "enter" && game?.combat) void act({ type: "attack" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, help, save, recovery]);
  useEffect(() => {
    journal.current?.scrollTo({
      top: journal.current.scrollHeight,
      behavior: "smooth",
    });
  }, [game?.log.length, game?.revision, tab]);
  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api("games", {
        name: name || "Adventurer",
        className: cls,
        element,
        difficulty,
      });
      localStorage.setItem("dungeon-key", d.recoveryKey);
      setRecovery(d.recoveryKey);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }
  const button = (text: string, a: Action, kind = "") => (
    <button className={kind} disabled={busy} onClick={() => void act(a)}>
      {text}
    </button>
  );
  if (loading) return <main className="loading">Lighting the torches…</main>;
  if (!game)
    return (
      <div className="landing">
        <div className="landing-art">
          <div className="sigil">✦</div>
          <p className="eyebrow">A TURN-BASED DUNGEON RPG</p>
          <h1>
            COMMAND LINE
            <br />
            <em>DUNGEON</em>
          </h1>
          <p className="intro">
            Beneath the stone, a forgotten kingdom waits.
            <br />
            Choose your path. Challenge Ruthagor. Find the light.
          </p>
          <div className="runes">◆ ━━━━━━━ ◈ ━━━━━━━ ◆</div>
          <p className="small">
            The original Python adventure, reimagined in pixels.
          </p>
        </div>
        <form className="creation" onSubmit={start}>
          <p className="eyebrow">YOUR STORY BEGINS</p>
          <h2>A new adventurer</h2>
          <label>
            Your name
            <input
              maxLength={32}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adventurer"
            />
          </label>
          <label>Choose your calling</label>
          <div className="class-grid">
            {["Warrior", "Knight", "Scout", "Mage"].map((c) => (
              <button
                type="button"
                className={"class " + (c === cls ? "selected" : "")}
                onClick={() => setCls(c)}
                key={c}
              >
                <Portrait type={c} />
                <strong>{c}</strong>
                <small>
                  {c === "Warrior"
                    ? "Strength & resolve"
                    : c === "Knight"
                      ? "Armor & endurance"
                      : c === "Scout"
                        ? "Speed & fortune"
                        : "Magic & mystery"}
                </small>
              </button>
            ))}
          </div>
          <p className="class-stats">
            {Object.entries(classes[cls]).map(([s, n]) => (
              <span key={s}>
                {s} <b>{n}</b>
              </span>
            ))}
          </p>
          {cls === "Mage" && (
            <label>
              Staff affinity
              <select
                value={element}
                onChange={(e) => setElement(e.target.value)}
              >
                {["Wind", "Fire", "Water"].map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            >
              <option value={0}>Normal — the original adventure</option>
              <option value={1}>Hard — stronger monsters</option>
            </select>
          </label>
          <button disabled={busy} className="primary start">
            Enter the dungeon <span>→</span>
          </button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <details>
            <summary>Restore a saved journey</summary>
            <input
              aria-label="Recovery key"
              placeholder="Paste your recovery key"
              value={recover}
              onChange={(e) => setRecover(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                void api("game", undefined, recover)
                  .then(() => {
                    setRecovery(recover);
                    localStorage.setItem("dungeon-key", recover);
                  })
                  .catch((e) => setError(e.message));
              }}
            >
              Restore
            </button>
          </details>
        </form>
      </div>
    );
  const p = game.player,
    enemy = game.monsters.find((m) => m.id === game.combat),
    stats = combatAttackStats(p),
    cast = availableSpells(game);
  return (
    <div className="shell">
      <header>
        <a className="brand" href="/">
          ◈{" "}
          <span>
            COMMAND LINE <b>DUNGEON</b>
          </span>
        </a>
        <span className="chapter">THE RUTHAGOR CHRONICLES</span>
        <nav>
          <button onClick={() => setHelp(true)}>
            How to play <kbd>H</kbd>
          </button>
          <button onClick={() => setSave(true)}>
            Saved journey <span className="dot" />
          </button>
        </nav>
      </header>
      <main className="game-layout">
        <aside className="character panel">
          <div className="panel-caption">
            THE ADVENTURER <span>Ⅰ</span>
          </div>
          <div className="portrait">
            <Portrait type={p.className} />
          </div>
          <h2>{p.name}</h2>
          <p className="subtitle">
            Level {p.level} {p.className}
          </p>
          <div className="bar-label">
            HEALTH{" "}
            <b>
              {Math.floor(p.hp)} / {Math.floor(p.stats.Health)}
            </b>
          </div>
          <div className="bar hp">
            <i
              style={{
                width: Math.max(0, (p.hp / p.stats.Health) * 100) + "%",
              }}
            />
          </div>
          <div className="bar-label">
            MANA <b>{p.stats.Mana} / 10</b>
          </div>
          <div className="bar mana">
            <i style={{ width: p.stats.Mana * 10 + "%" }} />
          </div>
          <div className="bar-label">
            EXPERIENCE <b>{game.xp} / 100</b>
          </div>
          <div className="bar exp">
            <i style={{ width: Math.min(100, game.xp) + "%" }} />
          </div>
          <div className="stat-grid">
            {[
              ["Attack", stats.Attack],
              ["Defense", p.stats.Armor || 0],
              ["Speed", stats.Speed],
              ["Luck", stats.Luck],
              ["Accuracy", stats.Accuracy],
              ["Magic", p.stats.Magic],
            ].map(([s, n]) => (
              <div key={s}>
                <span>{s}</span>
                <b>{Math.floor(Number(n))}</b>
              </div>
            ))}
          </div>
          <div className="equipment-title">
            EQUIPMENT{" "}
            <span>
              {p.weapons.length} / {game.hands}
            </span>
          </div>
          {p.weapons.length ? (
            p.weapons.map((w) => (
              <div className="equipped" key={w.id}>
                <span>{w.kind === "tome" ? "✧" : "⚔"}</span>
                <div>
                  <b>{w.name}</b>
                  <small>
                    {w.kind === "tome"
                      ? "Magic staff"
                      : `${w.uses} / ${w.maxUses} uses`}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">Unarmed · fists at the ready</p>
          )}
          <div className="score">
            <span>JOURNEY SCORE</span>
            <b>{game.score.toLocaleString()}</b>
            <small className="muted">
              Best score: {Math.max(highScore, game.score).toLocaleString()}
            </small>
          </div>
          {p.effects.Poison && (
            <p className="error">
              Poison: {p.effects.Poison[1]} damage for {p.effects.Poison[0]}{" "}
              moves
            </p>
          )}
        </aside>
        <section className="adventure">
          <div className="floor-heading">
            <div>
              <p className="eyebrow">
                CHAPTER {String(game.floor + 1).padStart(2, "0")}{" "}
                <span> / {game.difficulty ? "HARD" : "NORMAL"}</span>
              </p>
              <h1>
                {game.floor % 3 === 2
                  ? "The Dragon’s Sanctum"
                  : game.floor % 3 === 1
                    ? "The Verdant Depths"
                    : "The Forgotten Halls"}
              </h1>
            </div>
            <div className="floor-badge">
              FLOOR <b>{String(game.floor + 1).padStart(2, "0")}</b>
            </div>
          </div>
          <div className="map-frame">
            <div className="map-toolbar">
              <span>
                <i className="dot" />{" "}
                {enemy ? "ENCOUNTER IN PROGRESS" : "EXPLORING THE DUNGEON"}
              </span>
              <span>
                TURN {String(game.turn).padStart(3, "0")} · {game.keys} KEYS
              </span>
            </div>
            <DungeonView
              game={game}
              onMove={(dx, dy) => void act({ type: "move", dx, dy })}
            />
            <div className="map-footer">
              <span>
                <i className="legend player" /> You{" "}
                <i className="legend monster" /> Enemy{" "}
                <i className="legend treasure" /> Loot{" "}
                <i className="legend pod" /> Energy pod
              </span>
              <span>Tap a direction on the map to move</span>
            </div>
          </div>
          <div className="under-map">
            <div className="objective">
              <span className="compass">◈</span>
              <div>
                <p className="eyebrow">CURRENT OBJECTIVE</p>
                <p>
                  {game.status === "won"
                    ? "Ruthagor is defeated. Your legend continues."
                    : game.stairs.locked
                      ? "Find the key carrier. Defeat the guardian. Reach the stairs."
                      : "Defeat the floor guardian and find the staircase."}
                </p>
              </div>
            </div>
            <div className="controls">
              <button
                aria-label="Move left"
                onClick={() => void act({ type: "move", dx: -1, dy: 0 })}
              >
                ←
              </button>
              <div>
                <button
                  aria-label="Move up"
                  onClick={() => void act({ type: "move", dx: 0, dy: -1 })}
                >
                  ↑
                </button>
                <button
                  aria-label="Move down"
                  onClick={() => void act({ type: "move", dx: 0, dy: 1 })}
                >
                  ↓
                </button>
              </div>
              <button
                aria-label="Move right"
                onClick={() => void act({ type: "move", dx: 1, dy: 0 })}
              >
                →
              </button>
              <button
                className="wait"
                onClick={() => void act({ type: "wait" })}
              >
                Wait<kbd>SPACE</kbd>
              </button>
            </div>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {game.status === "dead" ? (
            <div className="encounter">
              <h2>Your journey ends</h2>
              <p>
                You reached floor {game.floor + 1} with {game.score} points.
              </p>
              <button className="primary" onClick={() => setGame(undefined)}>
                Begin a new journey
              </button>
            </div>
          ) : game.status === "won" ? (
            <div className="encounter">
              <h2>Victory over Ruthagor</h2>
              <p>The dungeon is conquered. Will you venture beyond?</p>
              {button("Continue exploring", { type: "continue" }, "primary")}
            </div>
          ) : game.pendingLevels ? (
            <div className="encounter">
              <p className="eyebrow">LEVEL UP</p>
              <h2>Choose your next strength</h2>
              <div className="actions">
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
                ].map((s) => (
                  <React.Fragment key={s}>
                    {button(s + (s === "EXP" ? " +20" : " +2"), {
                      type: "level",
                      stat: s,
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : enemy ? (
            <div className="encounter">
              <Portrait className="enemy-portrait" type={enemy.className} />
              <div>
                <p className="eyebrow">
                  {enemy.boss
                    ? "FLOOR GUARDIAN"
                    : enemy.npc
                      ? "A STRANGER IN THE DEPTHS"
                      : "ENEMY ENCOUNTER"}{" "}
                  · LEVEL {enemy.level}
                </p>
                <h2>{enemy.name}</h2>
                <p>
                  HP {Math.floor(enemy.hp)} / {Math.floor(enemy.stats.Health)} ·
                  Attack {Math.floor(combatAttackStats(enemy).Attack)} · Hit{" "}
                  {Math.min(100, hitRate(p, enemy)).toFixed(0)}% · Escape{" "}
                  {(fleeChance(p, enemy) * 100).toFixed(0)}%
                </p>
                <div className="actions">
                  {button("⚔ Attack", { type: "attack" }, "primary")}
                  {p.weapons.length > 0 &&
                    button("Attack unarmed", { type: "attack", unarmed: true })}
                  {enemy.npc && (
                    <>
                      {button("Talk", { type: "talk" })}
                      {!enemy.npc.done &&
                        enemy.npc.deal === "Item of Choice" &&
                        game.inventory.length > 0 && (
                          <select
                            aria-label="Item to trade"
                            value={trade || game.inventory[0].id}
                            onChange={(e) => setTrade(e.target.value)}
                          >
                            {game.inventory.map((i) => (
                              <option value={i.id} key={i.id}>
                                {i.name}
                              </option>
                            ))}
                          </select>
                        )}
                      {!enemy.npc.done &&
                        button("Accept deal: " + enemy.npc.deal, {
                          type: "deal",
                          id: trade || game.inventory[0]?.id,
                        })}
                    </>
                  )}
                  {button("Flee", { type: "flee" })}
                  {button("End encounter", { type: "leave" })}
                </div>
              </div>
            </div>
          ) : game.pendingLoot ? (
            <div className="encounter">
              <div>
                <p className="eyebrow">DISCOVERED TREASURE</p>
                <h2>{game.pendingLoot.name}</h2>
                <p>{describe(game.pendingLoot)}</p>
                <div className="actions">
                  {button(
                    game.pendingLoot.auto ? "Use" : "Pick up",
                    { type: "pickup" },
                    "primary",
                  )}
                  {button("Leave it", { type: "ignore" })}
                </div>
              </div>
            </div>
          ) : p.x === game.stairs.x && p.y === game.stairs.y ? (
            <div className="encounter">
              <h2>A staircase awaits</h2>
              {button(
                game.stairs.locked
                  ? "Use key & ascend"
                  : "Ascend to the next floor",
                { type: "ascend" },
                "primary",
              )}
            </div>
          ) : null}
          <section className="journal panel">
            <div className="tabs">
              {["journal", "inventory", "spells", "stats"].map((t) => (
                <button
                  className={tab === t ? "active" : ""}
                  key={t}
                  onClick={() => setTab(t)}
                >
                  {t}
                  {t === "inventory" && <span>{game.inventory.length}</span>}
                </button>
              ))}
              <span className="autosave">
                {busy ? "Saving…" : "✓ Autosaved"}
              </span>
            </div>
            <div className="tab-content" ref={journal}>
              {tab === "journal" ? (
                game.log.map((l, i) => (
                  <div
                    className={
                      "log " + (i === game.log.length - 1 ? "latest" : "")
                    }
                    key={i}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <p>{l}</p>
                  </div>
                ))
              ) : tab === "inventory" ? (
                <>
                  <p className="muted">
                    Capacity{" "}
                    {game.inventory.length + Number(p.weapons.length > 0)} /{" "}
                    {game.capacity} · Items and spells do not spend a combat
                    round.
                  </p>
                  {game.inventory.map((i) => (
                    <div className="item" key={i.id}>
                      <div>
                        <b>{i.name}</b>
                        <small>{describe(i)}</small>
                      </div>
                      <div className="actions">
                        {button(
                          ["weapon", "tome"].includes(i.kind) ? "Equip" : "Use",
                          { type: "use", id: i.id },
                        )}
                        {button("Drop", { type: "drop", id: i.id })}
                      </div>
                    </div>
                  ))}
                  {p.weapons.map((i) => (
                    <div className="item" key={i.id}>
                      <div>
                        <b>{i.name} · Equipped</b>
                        <small>{describe(i)}</small>
                      </div>
                      {button("Unequip", { type: "unequip", id: i.id })}
                    </div>
                  ))}
                </>
              ) : tab === "spells" ? (
                <>
                  {cast.length ? (
                    cast.map((s) => (
                      <div className="item" key={s.name}>
                        <div>
                          <b>
                            {s.name} <em>{s.element}</em>
                          </b>
                          <small>{s.description}</small>
                        </div>
                        {button(`Cast · ${s.cost} MP`, {
                          type: "cast",
                          spell: s.name,
                        })}
                      </div>
                    ))
                  ) : (
                    <p className="empty">
                      No spells available. Find a staff, restore mana, or
                      increase Magic. Some spells require combat.
                    </p>
                  )}
                </>
              ) : (
                <div className="full-stats">
                  {Object.entries(p.stats).map(([s, n]) => (
                    <div key={s}>
                      <span>{s}</span>
                      <b>{Math.floor(n)}</b>
                    </div>
                  ))}
                  <div>
                    <span>Inventory capacity</span>
                    <b>{game.capacity}</b>
                  </div>
                  <div>
                    <span>Sight range</span>
                    <b>{game.sight}</b>
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>
      </main>
      <footer>
        <span>◈ An original adventure by Shai Goldman · Browser edition</span>
        <span>ARROWS move · ENTER attack · I inventory · M magic · V save</span>
      </footer>
      {(help || save) && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={help ? "How to play" : "Saved journey"}
          >
            <button
              className="close"
              onClick={() => {
                setHelp(false);
                setSave(false);
              }}
            >
              ✕
            </button>
            {help ? (
              <>
                <p className="eyebrow">DUNGEON FIELD GUIDE</p>
                <h2>Every step is a decision.</h2>
                <p>
                  Explore with arrow keys, the touch pad, or by tapping the map.
                  Walk into a monster to begin an encounter. Attack resolves one
                  exchange, with the faster fighter striking first.
                </p>
                <p>
                  Find treasure, energy pods, and equipment. Weapons need Power
                  equal to twice their weight and eventually break. Staff
                  attacks cost 2 mana; your mana maximum is 10.
                </p>
                <p>
                  Gain 100 EXP to level up. Find the staircase guardian on every
                  floor. The second floor also requires a key from a monster.
                  Defeat Ruthagor on floor three to win, then keep exploring.
                </p>
                <p>
                  Poison ticks when you move. Items and spells can be used
                  between attacks. You can end an encounter, just as in the
                  original game.
                </p>
                <p>
                  <kbd>SPACE</kbd> wait · <kbd>I</kbd> inventory · <kbd>M</kbd>{" "}
                  magic · <kbd>S</kbd> stats · <kbd>V</kbd> save
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow">YOUR JOURNEY IS SAFE</p>
                <h2>Saved after every action</h2>
                <p>
                  Your game is stored on the server. Keep this private recovery
                  key to continue on another device. Anyone holding it can
                  access this journey.
                </p>
                <textarea
                  aria-label="Private recovery key"
                  readOnly
                  value={recovery}
                />
                <button
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(recovery)
                      .then(() => setError("Recovery key copied."))
                      .catch(() => setError("Select and copy the key above."))
                  }
                >
                  Copy recovery key
                </button>
                <p className="muted">
                  Starting a new adventure keeps this save accessible with its
                  recovery key.
                </p>
                <button
                  onClick={() => {
                    setSave(false);
                    setGame(undefined);
                  }}
                >
                  Start another journey
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

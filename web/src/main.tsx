import React, { useEffect, useState, useRef } from "react";
import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { createRoot } from "react-dom/client";
import type { Game, Action } from "../shared/types";
import { classes, describe } from "../shared/catalog";
import {
  availableSpells,
  combatAttackStats,
  hitRate,
  fleeChance,
  incomingDamage,
  canUseFromFloor,
  itemUseProblem,
  attackInitiative,
} from "../shared/engine";
import { DungeonView } from "./DungeonView";
import { Portrait } from "./Portrait";
import { ItemIcon } from "./ItemIcon";
import "./style.css";
import "./mobile.css";
import { requestGame, isDeviceGame } from "./game-api";
function App() {
  const [highScore, setHighScore] = useState(0);
  const [compact, setCompact] = useState(
    window.matchMedia(
      "(max-width:700px), (max-height:500px) and (pointer:coarse)",
    ).matches,
  );
  const [mobilePanel, setMobilePanel] = useState(false);
  const [mobileHint, setMobileHint] = useState("");
  const [overview, setOverview] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: string;
    revision: number;
  }>();
  const drawer = useRef<HTMLElement>(null);
  function openPanel(next: string) {
    setTab(next);
    if (compact) setMobilePanel(true);
  }
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
    void requestGame("high-score")
      .then(({ data }) => setHighScore(data.score || 0))
      .catch(() => {});
  }, [game?.status]);
  useEffect(() => {
    const media = window.matchMedia(
      "(max-width:700px), (max-height:500px) and (pointer:coarse)",
    );
    const update = () => {
      setCompact(media.matches);
      if (!media.matches) setMobilePanel(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    document.body.classList.toggle("playing-compact", compact && !!game);
    if (compact && game) window.scrollTo(0, 0);
    return () => document.body.classList.remove("playing-compact");
  }, [compact, !!game]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener("backButton", () => {
      if (!game) {
        void NativeApp.exitApp();
        return;
      }
      if (help) setHelp(false);
      else if (save) setSave(false);
      else if (mobilePanel) setMobilePanel(false);
      else setSave(true);
    });
    return () => {
      void listener.then((h) => h.remove());
    };
  }, [help, save, mobilePanel, !!game]);
  useEffect(() => {
    if (!compact || !mobilePanel) return;
    const old = document.activeElement as HTMLElement;
    drawer.current?.querySelector<HTMLButtonElement>(".drawer-close")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const controls = Array.from(
        drawer.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),select,input,textarea,[tabindex="0"]',
        ) || [],
      ).filter((el) => el.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (!drawer.current?.contains(document.activeElement)) {
        e.preventDefault();
        first?.focus();
        return;
      }
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
  }, [compact, mobilePanel]);
  async function api(path: string, body?: unknown, key?: string) {
    const { ok, data } = await requestGame(path, body, key);
    if (data.game) setGame(data.game);
    if (!ok) throw Error(data.error || "Request failed");
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
      const outcome = await api(
        "action",
        { action: a, revision: game.revision },
        recovery || undefined,
      );
      const after = outcome.game;
      if (after) setLastAction({ type: a.type, revision: after.revision });
      if (a.type === "move" && after && !after.combat && !after.pendingLoot) {
        if (
          after.player.x === game.player.x &&
          after.player.y === game.player.y
        )
          setMobileHint("Stone wall. Try another direction.");
        else if (after.log.at(-1) === game.log.at(-1))
          setMobileHint(
            "Moved " +
              (a.dx === 1
                ? "east"
                : a.dx === -1
                  ? "west"
                  : a.dy === 1
                    ? "south"
                    : "north") +
              ".",
          );
        else setMobileHint("");
      } else if (a.type === "wait")
        setMobileHint("You wait a turn. Enemies may move.");
      else setMobileHint("");
      if (compact && ["use", "cast"].includes(a.type)) setMobilePanel(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobilePanel(false);
        setHelp(false);
        setSave(false);
        return;
      }
      if (
        (e.target as HTMLElement).matches("input,select,textarea") ||
        help ||
        save ||
        mobilePanel
      )
        return;
      const k = e.key.toLowerCase();
      if (
        ["enter", " "].includes(k) &&
        (e.target as HTMLElement).closest("button,a,summary")
      )
        return;
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
      } else if (k === "i") openPanel("inventory");
      else if (k === "m") openPanel("spells");
      else if (k === "s") openPanel("stats");
      else if (k === "h") setHelp(true);
      else if (k === "v") setSave(true);
      else if (k === "enter" && game?.combat && game.encounter?.engaged)
        void act({ type: "attack" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, help, save, recovery, compact, mobilePanel]);
  useEffect(() => {
    journal.current?.scrollTo({
      top: tab === "journal" ? journal.current.scrollHeight : 0,
      behavior: "instant",
    });
  }, [game?.log.length, game?.revision, tab, mobilePanel]);
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
      if (!d.recoveryKey) throw Error("The journey could not be created.");
      localStorage.setItem("dungeon-key", d.recoveryKey);
      setRecovery(d.recoveryKey);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }
  const button = (text: string, a: Action, kind = "", reason?: string) => (
    <button
      className={kind}
      title={reason}
      disabled={
        !!reason ||
        busy ||
        game?.status === "dead" ||
        (game?.status === "won" && a.type !== "continue") ||
        (!!game?.pendingLevels && a.type !== "level")
      }
      onClick={() => void act(a)}
    >
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
            {isDeviceGame
              ? "ANDROID TEST EDITION · Play offline. Saves stay on this phone."
              : "The original Python adventure, reimagined in pixels."}
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
            <summary>
              {isDeviceGame
                ? "Reopen a journey on this phone"
                : "Restore a saved journey"}
            </summary>
            <input
              aria-label={isDeviceGame ? "Device journey code" : "Recovery key"}
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
  const danger = enemy ? incomingDamage(enemy, p) : undefined;
  const healthRatio = p.hp / p.stats.Health;
  const healthWarning =
    p.hp > 0 && healthRatio <= 0.01
      ? "LAST BREATH · 1% HP or less"
      : p.hp > 0 && healthRatio <= 0.1
        ? "CRITICAL · 10% HP or less"
        : "";
  const encounter =
    enemy && game.encounter?.enemyId === enemy.id ? game.encounter : undefined;
  const combatItems = game.inventory.filter((i) =>
    [
      "heal",
      "mana",
      "antidote",
      "rope",
      "projectile",
      "armor",
      "boost",
      "xp",
    ].includes(i.kind),
  );
  const readyHeal = combatItems.find(
    (i) => i.kind === "heal" && !itemUseProblem(game, i),
  );
  const readyThrow = combatItems.find(
    (i) => i.kind === "projectile" && !itemUseProblem(game, i),
  );
  const healingRelevant =
    !!readyHeal &&
    (healthRatio <= 0.4 || !!danger?.lethal || !!danger?.criticalLethal);
  const itemCue = healingRelevant
    ? "Heal ready"
    : readyThrow
      ? "Throw ready"
      : "";
  const hasContext =
    game.status !== "playing" ||
    !!enemy ||
    !!game.pendingLoot ||
    !!game.pendingLevels;
  const canExplore = !hasContext && !busy && !mobilePanel && !help && !save;
  const potions = game.inventory
    .filter((i) => i.kind === "heal")
    .sort((a, b) => a.value - b.value);
  const quickPotion =
    potions.find((i) => i.value >= p.stats.Health - p.hp) || potions.at(-1);
  const latestMessage =
    error ||
    mobileHint ||
    (game.turn === 0 && !hasContext
      ? "Tap an outlined tile or use arrows. Red tiles start encounters."
      : game.log.at(-1)) ||
    "Find the guardian and the stairs.";
  return (
    <div
      className={
        "shell" +
        (compact ? " compact-game" : "") +
        (mobilePanel ? " panel-open" : "") +
        (hasContext ? " has-context" : "") +
        (healthWarning
          ? healthRatio <= 0.01
            ? " health-last-breath"
            : " health-critical"
          : "")
      }
    >
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
            {isDeviceGame ? "Saved on phone" : "Saved journey"}{" "}
            <span className="dot" />
          </button>
        </nav>
      </header>
      {compact && (
        <button
          className="mobile-hud"
          aria-label="Character details"
          aria-haspopup="dialog"
          onClick={() => openPanel("stats")}
        >
          <Portrait type={p.className} />
          <span className="hud-identity">
            <strong>{p.name}</strong>
            <small>
              {healthWarning ||
                `Lv ${p.level} ${p.className} · XP ${game.xp}/100`}
            </small>
            {p.effects.Poison && (
              <small className="poison-label">
                Poison {p.effects.Poison[1]} × {p.effects.Poison[0]} moves
              </small>
            )}
          </span>
          <span className="hud-vitals">
            <span className={p.hp / p.stats.Health < 0.4 ? "low-health" : ""}>
              HP{" "}
              <b>
                {Math.floor(p.hp)} / {Math.floor(p.stats.Health)}
              </b>
            </span>
            <span className="hud-meter hp">
              <i
                style={{
                  width: Math.max(0, (p.hp / p.stats.Health) * 100) + "%",
                }}
              />
            </span>
            <span>
              MP <b>{p.stats.Mana} / 10</b>
            </span>
            <span className="hud-meter mana">
              <i style={{ width: p.stats.Mana * 10 + "%" }} />
            </span>
          </span>
        </button>
      )}
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
            {healthWarning || "HEALTH"}{" "}
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
                {healthWarning ||
                  (enemy ? "ENCOUNTER IN PROGRESS" : "EXPLORING THE DUNGEON")}
              </span>
              <span>
                TURN {String(game.turn).padStart(3, "0")} · {game.keys} KEYS
              </span>
              <button
                className="map-zoom"
                aria-label={overview ? "Follow hero" : "Show floor overview"}
                aria-pressed={overview}
                onClick={() => {
                  setOverview((v) => !v);
                  setMobileHint(
                    overview
                      ? "Following your hero."
                      : "Floor overview. Areas outside your sight stay dark.",
                  );
                }}
              >
                {overview ? "Follow hero" : "Overview"}
              </button>
            </div>
            <DungeonView
              game={game}
              action={lastAction}
              overview={overview}
              onMove={(dx, dy) => {
                if (canExplore) void act({ type: "move", dx, dy });
              }}
              movementEnabled={canExplore}
              onHint={setMobileHint}
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
                disabled={!canExplore}
                onClick={() => void act({ type: "move", dx: -1, dy: 0 })}
              >
                ←
              </button>
              <div>
                <button
                  aria-label="Move up"
                  disabled={!canExplore}
                  onClick={() => void act({ type: "move", dx: 0, dy: -1 })}
                >
                  ↑
                </button>
                <button
                  aria-label="Move down"
                  disabled={!canExplore}
                  onClick={() => void act({ type: "move", dx: 0, dy: 1 })}
                >
                  ↓
                </button>
              </div>
              <button
                aria-label="Move right"
                disabled={!canExplore}
                onClick={() => void act({ type: "move", dx: 1, dy: 0 })}
              >
                →
              </button>
              <button
                className="wait"
                disabled={!canExplore}
                onClick={() => void act({ type: "wait" })}
              >
                Wait<kbd>SPACE</kbd>
              </button>
              {compact && (
                <button
                  className="quick-heal"
                  aria-label="Use healing potion"
                  disabled={
                    busy ||
                    !quickPotion ||
                    p.hp >= p.stats.Health ||
                    !!game.pendingLevels ||
                    game.status !== "playing"
                  }
                  onClick={() => {
                    if (quickPotion)
                      void act({ type: "use", id: quickPotion.id });
                  }}
                >
                  Heal
                  <small>
                    {potions.length
                      ? `${potions.length} potion${potions.length === 1 ? "" : "s"}`
                      : "No potions"}
                  </small>
                </button>
              )}
            </div>
          </div>
          {compact && (
            <div
              className={"mobile-message" + (error ? " is-error" : "")}
              role={error ? "alert" : "status"}
            >
              <span>{latestMessage}</span>
              <button
                onClick={() => openPanel("journal")}
                aria-label="Open adventure log"
              >
                Log ›
              </button>
            </div>
          )}
          {error && (
            <p className="error desktop-error" role="alert">
              {error}
            </p>
          )}
          {game.status === "dead" ? (
            <div className="encounter game-end">
              <h2>Your journey ends</h2>
              <p>
                You reached floor {game.floor + 1} with {game.score} points.
              </p>
              <button className="primary" onClick={() => setGame(undefined)}>
                Begin a new journey
              </button>
            </div>
          ) : game.status === "won" ? (
            <div className="encounter game-end">
              <h2>Victory over Ruthagor</h2>
              <p>The dungeon is conquered. Will you venture beyond?</p>
              {button("Continue exploring", { type: "continue" }, "primary")}
            </div>
          ) : game.pendingLevels ? (
            <div className="encounter level-up">
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
            <div className="encounter combat-panel">
              <Portrait className="enemy-portrait" type={enemy.className} />
              <div>
                <p
                  className={
                    "encounter-notice " +
                    (encounter?.origin === "enemy" ? "enemy-initiated" : "")
                  }
                  role={encounter?.origin === "enemy" ? "alert" : "status"}
                >
                  {encounter?.origin === "enemy"
                    ? encounter.engaged
                      ? "COMBAT · ENEMY INITIATED"
                      : `⚠ ${enemy.name} approached you!`
                    : encounter?.engaged
                      ? "COMBAT IN PROGRESS"
                      : encounter?.origin === "inspection"
                        ? "INSPECTING ENEMY · NO ATTACK YET"
                        : "ENCOUNTER RESUMED"}
                  <span>
                    {encounter?.engaged
                      ? encounter.result || "Choose your next action."
                      : encounter?.origin === "enemy"
                        ? "Enemy initiated this encounter. No blow exchanged yet."
                        : "Checking stats does not attack. Choose Attack to exchange blows."}
                  </span>
                </p>
                <div className="encounter-heading">
                  <h2>
                    {enemy.name}{" "}
                    <small>
                      Lv {enemy.level} · HP {Math.floor(enemy.hp)}/
                      {Math.floor(enemy.stats.Health)}
                    </small>
                  </h2>
                  <button onClick={() => openPanel("enemy-stats")}>
                    Enemy stats
                  </button>
                </div>
                <div
                  className={
                    "attack-order " +
                    (danger?.enemyFirst ? "enemy-first" : "you-first")
                  }
                  role="status"
                  aria-label={`Attack order: ${danger?.enemyFirst ? enemy.name + " first, then you" : "You first, then " + enemy.name}`}
                >
                  <small>ON ATTACK</small>
                  <b>1 · {danger?.enemyFirst ? enemy.name : "YOU"}</b>
                  <span>→</span>
                  <b>2 · {danger?.enemyFirst ? "YOU" : enemy.name}</b>
                </div>
                <p className="combat-forecast">
                  Your hit chance {Math.min(100, hitRate(p, enemy)).toFixed(0)}%
                  · Enemy hit {danger?.normal} HP
                </p>
                {danger && (danger.lethal || danger.criticalLethal) && (
                  <p className="lethal-warning" role="alert">
                    ⚠{" "}
                    {danger.lethal
                      ? "NEXT HIT CAN KILL YOU"
                      : "A CRITICAL HIT CAN KILL YOU"}
                    <span>
                      Enemy hit: {danger.normal} HP
                      {danger.critical !== danger.normal
                        ? ` · Critical: ${danger.critical} HP`
                        : ""}{" "}
                      · You: {Math.ceil(p.hp)} HP.
                      {danger.enemyFirst
                        ? " Enemy first."
                        : " Retaliates if alive."}{" "}
                      Heal or flee.
                    </span>
                  </p>
                )}
                <div className="actions">
                  {button(
                    enemy.npc ? "Fight" : "Attack",
                    { type: "attack" },
                    "primary",
                  )}
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
                  {button(
                    `Flee · ${(fleeChance(p, enemy) * 100).toFixed(0)}%`,
                    { type: "flee" },
                  )}
                  <button
                    disabled={busy}
                    className={
                      "combat-items-button " +
                      (healingRelevant
                        ? "heal-ready"
                        : readyThrow
                          ? "throw-ready"
                          : "")
                    }
                    aria-label={`Items (${combatItems.length})`}
                    aria-describedby={itemCue ? "combat-item-cue" : undefined}
                    title={
                      healingRelevant
                        ? "A healing potion is ready. Open Items to restore health without spending a combat round."
                        : readyThrow
                          ? "A throwing item is ready to use against this enemy."
                          : "View combat items and availability"
                    }
                    onClick={() => openPanel("combat-items")}
                  >
                    Items ({combatItems.length})
                    {itemCue && <small id="combat-item-cue">{itemCue}</small>}
                  </button>
                  {button(
                    encounter?.engaged || encounter?.origin === "enemy"
                      ? "End encounter"
                      : "Close inspection",
                    { type: "leave" },
                  )}
                  <details className="combat-more">
                    <summary>More options</summary>
                    {p.weapons.length > 0 &&
                      button("Attack unarmed", {
                        type: "attack",
                        unarmed: true,
                      })}
                    <p>
                      End encounter is safe, as in the original game. Flee can
                      fail and provoke a hit.
                    </p>
                  </details>
                </div>
                <p className="combat-item-preview">
                  Combat items:{" "}
                  {combatItems.length
                    ? [...new Set(combatItems.map((i) => i.name))].join(" · ")
                    : "None in your bag"}
                </p>
              </div>
            </div>
          ) : game.pendingLoot ? (
            <div className="encounter treasure">
              <div>
                <p className="eyebrow">DISCOVERED TREASURE</p>
                <h2>{game.pendingLoot.name}</h2>
                <ItemIcon item={game.pendingLoot} large />
                <p>{describe(game.pendingLoot)}</p>
                {canUseFromFloor(game.pendingLoot) &&
                  itemUseProblem(game, game.pendingLoot) && (
                    <p className="item-restriction">
                      {itemUseProblem(game, game.pendingLoot)}
                    </p>
                  )}
                {game.pendingLoot.kind === "projectile" && (
                  <p>
                    Pick up this throwing weapon to use it against an enemy.
                  </p>
                )}
                {game.pendingLoot.kind === "weapon" && (
                  <p
                    className={
                      itemUseProblem(game, game.pendingLoot)
                        ? "item-restriction"
                        : "muted"
                    }
                  >
                    Pick up to carry.{" "}
                    {itemUseProblem(game, game.pendingLoot) ||
                      "Equip it from your bag."}
                  </p>
                )}
                <div className="actions">
                  <button
                    className="primary"
                    disabled={
                      busy ||
                      (!game.pendingLoot.auto &&
                        game.inventory.length + Number(p.weapons.length > 0) >=
                          game.capacity)
                    }
                    onClick={() => void act({ type: "pickup" })}
                  >
                    {game.pendingLoot.auto ? "Use now" : "Take item"}
                  </button>
                  {!game.pendingLoot.auto &&
                    canUseFromFloor(game.pendingLoot) &&
                    button(
                      "Use from floor",
                      { type: "use-floor" },
                      "",
                      itemUseProblem(game, game.pendingLoot),
                    )}
                  {!game.pendingLoot.auto &&
                    game.inventory.length + Number(p.weapons.length > 0) >=
                      game.capacity && (
                      <button onClick={() => openPanel("inventory")}>
                        Bag full · Manage items
                      </button>
                    )}
                  {button("Leave it", { type: "ignore" })}
                </div>
              </div>
            </div>
          ) : p.x === game.stairs.x && p.y === game.stairs.y ? (
            <div className="encounter stairs-prompt">
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
          {compact && mobilePanel && (
            <button
              className="drawer-backdrop"
              aria-label="Close panel"
              onClick={() => setMobilePanel(false)}
            />
          )}
          <section
            ref={drawer}
            className="journal panel"
            role={compact && mobilePanel ? "dialog" : undefined}
            aria-modal={compact && mobilePanel ? true : undefined}
            aria-label={
              tab === "combat-items"
                ? "Combat items"
                : tab === "enemy-stats"
                  ? "Enemy stats"
                  : tab === "stats"
                    ? "Character"
                    : tab === "journal"
                      ? "Adventure log"
                      : tab === "spells"
                        ? "Magic"
                        : "Inventory"
            }
          >
            <div className="tabs">
              {["journal", "inventory", "spells", "stats"].map((t) => (
                <button
                  className={tab === t ? "active" : ""}
                  key={t}
                  onClick={() => openPanel(t)}
                >
                  {t}
                  {t === "inventory" && <span>{game.inventory.length}</span>}
                </button>
              ))}
              {compact && (
                <button
                  className="drawer-close"
                  aria-label="Return to dungeon"
                  onClick={() => setMobilePanel(false)}
                >
                  ×
                </button>
              )}
              <span className="autosave">
                {busy ? "Saving…" : "✓ Autosaved"}
              </span>
            </div>
            <div className="tab-content" ref={journal}>
              {tab === "enemy-stats" ? (
                enemy ? (
                  <>
                    <h2>{enemy.name} · Enemy stats</h2>
                    <p className="initiative-explanation">
                      Attack order uses your base Speed minus equipped weapon
                      weight ÷ 4, compared with enemy Speed. You:{" "}
                      {attackInitiative(p)} · Enemy: {enemy.stats.Speed}. Ties
                      go to you. A defeated opponent cannot retaliate. Items and
                      spells do not trigger a normal exchange.
                    </p>
                    <p>
                      Inspecting is safe: no attack, turn, mana or item is
                      spent.
                    </p>
                    <dl className="enemy-stat-list">
                      {Object.entries({
                        HP: `${enemy.hp}/${enemy.stats.Health}`,
                        Attack: combatAttackStats(enemy).Attack,
                        ...enemy.stats,
                      }).map(([name, value]) => (
                        <React.Fragment key={name}>
                          <dt>{name}</dt>
                          <dd>{value}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                    <p>
                      Your hit chance:{" "}
                      {Math.min(100, hitRate(p, enemy)).toFixed(0)}%. Enemy hit
                      chance: {Math.min(100, hitRate(enemy, p)).toFixed(0)}%.
                      Escape: {(fleeChance(p, enemy) * 100).toFixed(0)}%.
                    </p>
                    <p>
                      Attack exchanges blows; items and spells do not spend a
                      combat round. End encounter closes safely. Flee can fail
                      and trigger an enemy strike.
                    </p>
                  </>
                ) : (
                  <p>No enemy is selected.</p>
                )
              ) : tab === "combat-items" ? (
                <>
                  <h2>Combat items</h2>
                  <p>
                    Choose an item to use it now. This spends the item, not a
                    combat round. Throwing weapons target{" "}
                    {enemy?.name || "the current enemy"}.
                  </p>
                  {!combatItems.length && (
                    <p>
                      No combat consumables in your bag. Check Magic for
                      available spells.
                    </p>
                  )}
                  {combatItems.map((i) => (
                    <div className="item" key={i.id}>
                      <ItemIcon item={i} />
                      <div>
                        <b>{i.name}</b>
                        <small
                          className={
                            "availability-badge " +
                            (itemUseProblem(game, i) ? "unavailable" : "ready")
                          }
                        >
                          {itemUseProblem(game, i)
                            ? "UNAVAILABLE NOW"
                            : "USABLE NOW"}
                        </small>
                        <small>{describe(i)}</small>
                        {itemUseProblem(game, i) && (
                          <small className="item-restriction">
                            {itemUseProblem(game, i)}
                          </small>
                        )}
                      </div>
                      {button(
                        i.kind === "projectile"
                          ? "Throw"
                          : i.kind === "heal"
                            ? "Drink potion"
                            : i.kind === "mana"
                              ? "Restore mana"
                              : i.kind === "rope"
                                ? "Escape with rope"
                                : "Use item",
                        { type: "use", id: i.id },
                        "",
                        itemUseProblem(game, i),
                      )}
                    </div>
                  ))}
                  {p.weapons.length > 0 && (
                    <>
                      <h3>Other combat actions</h3>
                      <p>
                        Attack unarmed exchanges blows and spends a combat
                        round.
                      </p>
                      {button("Attack unarmed", {
                        type: "attack",
                        unarmed: true,
                      })}
                    </>
                  )}
                </>
              ) : tab === "journal" ? (
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
                  {[
                    {
                      label: "Ready now",
                      items: game.inventory.filter(
                        (i) => !itemUseProblem(game, i),
                      ),
                    },
                    {
                      label: "Unavailable now",
                      items: game.inventory.filter(
                        (i) => !!itemUseProblem(game, i),
                      ),
                    },
                  ].map(({ label, items }) => (
                    <section className="inventory-group" key={label}>
                      <h3>
                        {label} · {items.length}
                      </h3>
                      {items.map((i) => (
                        <div className="item" key={i.id}>
                          <ItemIcon item={i} />
                          <div>
                            <b>{i.name}</b>
                            <small
                              className={
                                "availability-badge " +
                                (itemUseProblem(game, i)
                                  ? "unavailable"
                                  : "ready")
                              }
                            >
                              {itemUseProblem(game, i)
                                ? "UNAVAILABLE NOW"
                                : ["weapon", "tome"].includes(i.kind)
                                  ? "READY TO EQUIP"
                                  : "USABLE NOW"}
                            </small>
                            <small>{describe(i)}</small>
                            {itemUseProblem(game, i) && (
                              <small className="item-restriction">
                                {itemUseProblem(game, i)}
                              </small>
                            )}
                          </div>
                          <div className="actions">
                            {button(
                              ["weapon", "tome"].includes(i.kind)
                                ? "Equip"
                                : "Use",
                              { type: "use", id: i.id },
                              "",
                              itemUseProblem(game, i),
                            )}
                            {button("Drop", { type: "drop", id: i.id })}
                          </div>
                        </div>
                      ))}
                    </section>
                  ))}
                  {p.weapons.map((i) => (
                    <div className="item" key={i.id}>
                      <ItemIcon item={i} />
                      <div>
                        <b>{i.name} · Equipped</b>
                        <small>{describe(i)}</small>
                        {itemUseProblem(game, i) && (
                          <small className="item-restriction">
                            {itemUseProblem(game, i)}
                          </small>
                        )}
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
                  <div>
                    <span>Hero</span>
                    <b>{p.name}</b>
                  </div>
                  <div>
                    <span>Class · Level</span>
                    <b>
                      {p.className} · {p.level}
                    </b>
                  </div>
                  <div>
                    <span>Current HP</span>
                    <b>
                      {Math.floor(p.hp)} / {Math.floor(p.stats.Health)}
                    </b>
                  </div>
                  <div>
                    <span>Score · Keys</span>
                    <b>
                      {game.score} · {game.keys}
                    </b>
                  </div>
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
      {compact && (
        <nav className="mobile-nav" aria-label="Game panels">
          {[
            ["inventory", "Bag", "▣"],
            ["spells", "Magic", "✧"],
            ["journal", "Log", "≡"],
            ["stats", "Hero", "♙"],
          ].map(([t, label, icon]) => (
            <button
              key={t}
              aria-label={
                t === "spells" ? "Spells" : t === "stats" ? "Character" : label
              }
              aria-expanded={mobilePanel && tab === t}
              className={mobilePanel && tab === t ? "active" : ""}
              onClick={() => {
                if (mobilePanel && tab === t) setMobilePanel(false);
                else openPanel(t);
              }}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
              {t === "inventory" && <small>{game.inventory.length}</small>}
            </button>
          ))}
        </nav>
      )}
      <footer>
        <span>
          ◈ An original adventure by Shai Goldman ·{" "}
          {isDeviceGame ? "Android test edition · Offline" : "Browser edition"}
        </span>
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
                  Explore with arrow keys, the touch pad, or by tapping an
                  outlined neighboring tile. Red outlines start encounters. Walk
                  into a monster to begin an encounter. Attack resolves one
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
                  {isDeviceGame
                    ? "This Android test build works offline. Progress is saved on this phone. Device journey codes only reopen games on this installation; they do not transfer saves to another phone. Uninstalling the app clears these saves."
                    : "Your game is stored on the server. Keep this private recovery key to continue on another device. Anyone holding it can access this journey."}
                </p>
                <textarea
                  aria-label={
                    isDeviceGame
                      ? "Device journey code"
                      : "Private recovery key"
                  }
                  readOnly
                  value={recovery}
                />
                <button
                  onClick={() =>
                    void Promise.resolve()
                      .then(() => {
                        if (!navigator.clipboard)
                          throw Error("Clipboard unavailable");
                        return navigator.clipboard.writeText(recovery);
                      })
                      .then(() =>
                        setError(
                          isDeviceGame
                            ? "Device journey code copied."
                            : "Recovery key copied.",
                        ),
                      )
                      .catch(() => setError("Select and copy the key above."))
                  }
                >
                  {isDeviceGame
                    ? "Copy device journey code"
                    : "Copy recovery key"}
                </button>
                <p className="muted">
                  Starting a new adventure keeps this save accessible with its
                  recovery key.
                </p>
                {compact && (
                  <button
                    className="primary"
                    onClick={() => {
                      setHelp(false);
                      setSave(false);
                    }}
                  >
                    Continue playing
                  </button>
                )}
                {Capacitor.isNativePlatform() && (
                  <button
                    disabled={busy}
                    onClick={() => void NativeApp.exitApp()}
                  >
                    Close game
                  </button>
                )}
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

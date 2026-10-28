import "./style.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { Game, Action } from "../shared/types";
import { classes } from "../shared/catalog";
import { Portrait } from "./Portrait";
import { PlayScreen } from "./PlayScreen";
import { requestGame, isDeviceGame } from "./game-api";
function App() {
  const [game, setGame] = useState<Game>(),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [highScore, setHighScore] = useState(0),
    [name, setName] = useState(""),
    [cls, setCls] = useState("Warrior"),
    [element, setElement] = useState("Wind"),
    [difficulty, setDifficulty] = useState(0),
    [recover, setRecover] = useState(""),
    [recovery, setRecovery] = useState(
      localStorage.getItem("dungeon-key") || "",
    ),
    [lastAction, setLastAction] = useState<{
      type: string;
      revision: number;
    }>();
  const lock = useRef(false);
  async function api(path: string, body?: unknown, key?: string) {
    const { ok, data } = await requestGame(path, body, key);
    if (data.game) setGame(data.game);
    if (!ok) throw Error(data.error || "Request failed");
    return data;
  }
  useEffect(() => {
    void api(
      "game",
      undefined,
      localStorage.getItem("dungeon-key") || undefined,
    )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    void requestGame("high-score")
      .then((r) => setHighScore(r.data.score || 0))
      .catch(() => {});
  }, [game?.status]);
  useEffect(() => {
    if (game || !Capacitor.isNativePlatform()) return;
    const h = NativeApp.addListener("backButton", () => {
      void NativeApp.exitApp();
    });
    return () => {
      void h.then((v) => v.remove());
    };
  }, [!!game]);
  async function act(action: Action) {
    if (!game || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api(
        "action",
        { action, revision: game.revision },
        recovery || undefined,
      );
      if (result.game)
        setLastAction({ type: action.type, revision: result.game.revision });
      return result.game;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
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
      if (!d.recoveryKey) throw Error("Journey could not be created");
      localStorage.setItem("dungeon-key", d.recoveryKey);
      setRecovery(d.recoveryKey);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
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
  return (
    <PlayScreen
      game={game}
      busy={busy}
      error={error}
      recovery={recovery}
      lastAction={lastAction}
      onAction={act}
      clearError={() => setError("")}
      onNew={() => {
        setGame(undefined);
        localStorage.removeItem("dungeon-key");
        setError("");
      }}
    />
  );
}
createRoot(document.getElementById("root")!).render(<App />);

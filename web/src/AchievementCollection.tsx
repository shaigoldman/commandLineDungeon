import React, { useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS } from "../shared/achievements";
import { isDeviceGame, requestGame } from "./game-api";

export function AchievementCollection({ onClose }: { onClose: () => void }) {
  const [earned, setEarned] = useState<string[]>();
  const [error, setError] = useState("");
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    void requestGame("achievements").then(r => {
      if (!r.ok) throw Error(r.data.error || "Could not load achievements.");
      setEarned(r.data.achievements || []);
    }).catch(e => setError((e as Error).message));
    return () => { document.removeEventListener("keydown", key); previous?.focus(); };
  }, [onClose]);
  return <div className="collection-backdrop">
    <section className="achievement-collection" role="dialog" aria-modal="true" aria-labelledby="collection-title">
      <button ref={close} type="button" className="collection-close" onClick={onClose} aria-label="Close achievements">✕</button>
      <p className="eyebrow">YOUR LEGACY</p>
      <h2 id="collection-title">Achievements</h2>
      {earned && <p>{ACHIEVEMENTS.filter(a => earned.includes(a.name)).length} of {ACHIEVEMENTS.length} earned</p>}
      <p className="collection-note">{isDeviceGame ? "Saved on this device." : "Saved in this browser."} Export a backup to keep your collection when changing devices.</p>
      {error && <p role="alert">{error}</p>}
      {!earned && !error && <p>Loading achievements…</p>}
      <ul>{earned && ACHIEVEMENTS.map(a => <li key={a.name} className={earned.includes(a.name) ? "earned" : "locked"}>
        <span aria-hidden="true">{earned.includes(a.name) ? "🏆" : "◇"}</span>
        <div><strong>{a.name}</strong><p>{a.description}</p></div>
        <small>{earned.includes(a.name) ? "Earned" : "Not yet earned"}</small>
      </li>)}</ul>
    </section>
  </div>;
}

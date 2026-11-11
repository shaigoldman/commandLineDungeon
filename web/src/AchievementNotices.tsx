import { useEffect, useRef, useState } from "react";
import type { Game } from "../shared/types";

type Achievement = NonNullable<Game["achievements"]>[number];

export function AchievementNotices({ achievements = [] }: { achievements?: Achievement[] }) {
  // Saved achievements are the baseline; only newly earned awards are announced.
  const seen = useRef(new Set(achievements.map(a => a.name)));
  const [queue, setQueue] = useState<Achievement[]>([]);
  useEffect(() => {
    const earned = achievements.filter(a => !seen.current.has(a.name));
    for (const achievement of earned) seen.current.add(achievement.name);
    if (earned.length) setQueue(current => [...current, ...earned]);
  }, [achievements]);
  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setQueue(items => items.slice(1)), 6000);
    return () => clearTimeout(timer);
  }, [current]);
  return <aside className="achievement-notices" role="status" aria-live="polite" aria-atomic="true">
    {current && <div className="achievement-notice">
      <span aria-hidden="true">🏆</span>
      <div><strong>Achievement unlocked</strong><span>{current.name} · +{current.points} points</span></div>
      <button aria-label="Dismiss achievement announcement" onClick={() => setQueue(items => items.slice(1))}>×</button>
    </div>}
  </aside>;
}

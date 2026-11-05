import React, { useState } from "react";
import type { Game } from "../shared/types";
import { history } from "../shared/expansion";
import { monsterBase } from "../shared/catalog";

export function chronicleTokens(text: string, names: string[]) {
  const escaped = [...new Set(names.filter(Boolean))].sort((a,b) => b.length-a.length)
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp("(" + escaped.join("|") + "|\\b(?:poison(?:ed)?|burn(?:ing)?|curse[ds]?|critical(?: hit)?|miss(?:ed)?|damage|HP|health|mana|MP|EXP|Strength|Power|Armor|Speed|Accuracy|Luck|Magic|level(?: up)?|gold|\\d+(?:%|\\b))\\b)", "gi");
  return text.split(pattern).filter(Boolean).map(value => {
    const lower = value.toLowerCase();
    const kind = names.some(name => name.toLowerCase() === lower) ? "name"
      : /poison|burn|curs/.test(lower) ? "status" : /damage|critical|miss/.test(lower) ? "combat"
      : /^(hp|health)$/.test(lower) ? "hp" : /^(mana|mp|magic)$/.test(lower) ? "mana"
      : /exp|level|gold/.test(lower) ? "reward" : /^(strength|power|armor|speed|accuracy|luck|\d)/i.test(value) ? "stat" : "";
    return { value, kind };
  });
}
export function Chronicle({ game: g }: { game: Game }) {
  const [filter, setFilter] = useState("All");
  const names = [g.player.name, ...Object.keys(monsterBase), ...g.monsters.map(m => m.name), ...history.map(([name]) => name)];
  const entries = g.log.map((text, index) => ({ text, serial: (g.logSerial ?? g.log.length) - g.log.length + index + 1 }))
    .filter(({text}) => filter === "All" || (filter === "Combat" ? /attack|damage|miss|critical|flee|escaped|defeat/i : filter === "Conditions" ? /poison|burn|curs|heal|HP|mana/i : /found|gold|pick|loot|equipp|level|EXP|gift|bought|sold/i).test(text)).reverse();
  return <section className="chronicle">
    <p className="chronicle-kicker">The chronicle of {g.player.name}</p>
    <h2>Ink beneath the dungeon</h2>
    <p className="chronicle-subtitle">Floor {g.floor+1} · Turn {g.turn} · Newest entries first · Last 100 events</p>
    <nav className="chronicle-filters" aria-label="Filter chronicle">
      {["All", "Combat", "Conditions", "Discoveries"].map(label => <button key={label} aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</button>)}
    </nav>
    <ol className="chronicle-entries" aria-label="Journey log">
      {entries.map(({text,serial}) => <li key={serial}><span className="chronicle-number">{serial}</span><p>{chronicleTokens(text,names).map(({value,kind},index) => kind ? <strong key={index} className={"chronicle-"+kind}>{value}</strong> : <React.Fragment key={index}>{value}</React.Fragment>)}</p></li>)}
    </ol>
    {!entries.length && <p>No entries in this chapter yet.</p>}
    {!!g.chronicles?.length && <details><summary>Voices of Ashfall · {g.chronicles.length}</summary>{g.chronicles.map((story,index) => <p key={index}>{story}</p>)}</details>}
  </section>;
}

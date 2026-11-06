import type { Game, SavedAdventure } from "../shared/types";
export const SAVED_ADVENTURES_KEY = "teeny-dungeon.adventures.v1";
type SaveIndexStorage = Pick<Storage,"getItem"|"setItem">;

/** Only this browser's known saves; the server never exposes a public player list. */
export function readSavedAdventures(storage: SaveIndexStorage = localStorage): SavedAdventure[] {
  const raw=storage.getItem(SAVED_ADVENTURES_KEY);
  if (!raw) return [];
  let value: unknown;
  try { value=JSON.parse(raw); } catch { throw Error("Saved adventures could not be read. Your adventures have not been changed."); }
  if (!Array.isArray(value) || value.some(row=>!row || typeof row.id!=="string" || !/^[a-f0-9]{64}$/.test(row.id) || typeof row.heroName!=="string" || (row.startedAt!==undefined && typeof row.startedAt!=="string")))
    throw Error("Saved adventures could not be read. Your adventures have not been changed.");
  return (value as SavedAdventure[]).sort((a,b)=>(Date.parse(b.startedAt || "") || 0)-(Date.parse(a.startedAt || "") || 0));
}
export function rememberAdventure(id:string,game:Game,storage:SaveIndexStorage=localStorage) {
  const entries=readSavedAdventures(storage);
  const startedAt=game.startedAt && Number.isFinite(Date.parse(game.startedAt)) ? game.startedAt : undefined;
  const entry:SavedAdventure={id,heroName:game.player.name || "Adventurer",...(startedAt?{startedAt}:{})};
  if (JSON.stringify(entries.find(row=>row.id===id))===JSON.stringify(entry)) return;
  storage.setItem(SAVED_ADVENTURES_KEY,JSON.stringify([...entries.filter(row=>row.id!==id),entry]));
}
export function adventureStartLabel(startedAt?:string) {
  return startedAt && Number.isFinite(Date.parse(startedAt))
    ? "Started "+new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(startedAt))
    : "Start date unavailable (older adventure)";
}

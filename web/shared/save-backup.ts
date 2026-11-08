import type { Game } from "./types";

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const number = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const strings = (v: unknown) => Array.isArray(v) && v.every(x => typeof x === "string");
const numbers = (v: unknown) => object(v) && Object.values(v).every(number);
const tuple = (v: unknown) => Array.isArray(v) && v.length === 2 && v.every(number);
const optional = (v: Record<string, any>, keys: string[], check: (x: unknown) => boolean) => keys.every(k => v[k] === undefined || check(v[k]));
const items = (v: unknown): boolean => Array.isArray(v) && v.every(item);
const position = (v: unknown) => object(v) && Number.isInteger(v.x) && Number.isInteger(v.y);
function item(v: unknown): boolean {
  return object(v) && optional(v, ["duration","attack","weight","luck","uses","maxUses","armorBonus"], number)
    && optional(v, ["stat","element"], x => typeof x === "string") && optional(v, ["poison"], tuple)
    && ["id", "name", "kind", "description"].every(k => typeof v[k] === "string") && number(v.value)
    && (number(v.rarity) || ["common", "uncommon", "rare", "ultrarare", "legendary"].includes(v.rarity));
}
function actor(v: unknown): boolean {
  return object(v) && position(v) && ["id", "name", "className"].every(k => typeof v[k] === "string")
    && number(v.hp) && number(v.level) && numbers(v.stats)
    && optional(v, ["maxMana","gold","attackBonus","curseChance"], number)
    && optional(v, ["poison","burn"], tuple) && optional(v, ["passiveStats"], numbers)
    && ["Health", "Power", "Magic", "Speed", "Accuracy", "Luck"].every(k => number(v.stats[k]))
    && object(v.effects) && Object.values(v.effects).every(tuple) && items(v.weapons)
    && (v.inventory === undefined || items(v.inventory))
    && (v.merchant === undefined || (object(v.merchant) && Array.isArray(v.merchant.stock)
      && v.merchant.stock.every((s: unknown) => object(s) && item(s.item) && number(s.price))
      && object(v.merchant.buyPrices) && Object.values(v.merchant.buyPrices).every(x => x===null || number(x))
      && strings(v.merchant.dislikes) && ["line","refusal"].every(k => typeof v.merchant[k] === "string")
      && number(v.merchant.taste) && number(v.merchant.premium)))
    && (v.npc === undefined || (object(v.npc) && typeof v.npc.tribe === "string" && typeof v.npc.line === "string"));
}
function game(v: unknown): v is Game {
  if (!object(v) || v.version !== 1 || !actor(v.player)) return false;
  if (!["seed", "floor", "difficulty", "keys", "hands", "capacity", "sight", "xp", "score", "turn", "pendingLevels", "revision"].every(k => number(v[k]))) return false;
  if (!["playing", "dead", "won"].includes(v.status) || !strings(v.log) || !items(v.inventory)) return false;
  if (!Array.isArray(v.tiles) || !v.tiles.length || v.tiles.length > 500 || !Array.isArray(v.tiles[0]) || !v.tiles[0].length || v.tiles[0].length > 500) return false;
  const width = v.tiles[0].length;
  if (!v.tiles.every((row: unknown) => Array.isArray(row) && row.length === width && row.every(number))) return false;
  if (!Array.isArray(v.light) || v.light.length !== v.tiles.length || !v.light.every((row: unknown) => Array.isArray(row) && row.length === width && row.every(x => typeof x === "boolean"))) return false;
  if (v.player.x < 0 || v.player.x >= width || v.player.y < 0 || v.player.y >= v.tiles.length) return false;
  if (!Array.isArray(v.monsters) || !v.monsters.every(actor) || !position(v.stairs)) return false;
  if (!Array.isArray(v.loot) || !v.loot.every((x: unknown) => position(x) && object(x) && item(x.item))) return false;
  if (!Array.isArray(v.pods) || !v.pods.every(position)) return false;
  if (v.pendingLoot !== undefined && !item(v.pendingLoot)) return false;
  if (v.chronicles !== undefined && !strings(v.chronicles)) return false;
  if (v.chests !== undefined && (!Array.isArray(v.chests) || !v.chests.every((x: unknown) => position(x) && object(x) && typeof x.id === "string" && item(x.reward)))) return false;
  for (const key of ["secretDoors", "traps", "haunting"]) if (v[key] !== undefined && (!Array.isArray(v[key]) || !v[key].every(position))) return false;
  return v.startedAt === undefined || (typeof v.startedAt === "string" && Number.isFinite(Date.parse(v.startedAt)));
}
export function encodeBackup(games: Game[], highScore: number) {
  return JSON.stringify({ format: "teeny-dungeon-save", version: 1, exportedAt: new Date().toISOString(), games, highScore });
}
export function decodeBackup(text: string): { games: Game[]; highScore: number } {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw Error("This backup is too large (maximum 10 MB).");
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw Error("Choose a valid Teeny Dungeon save backup (.json)."); }
  if (!object(value) || value.format !== "teeny-dungeon-save" || value.version !== 1 || !Array.isArray(value.games)
    || !value.games.every(game) || !number(value.highScore) || value.highScore < 0)
    throw Error("This backup is invalid or from an unsupported version. Existing adventures have not been changed.");
  return { games: value.games, highScore: value.highScore };
}

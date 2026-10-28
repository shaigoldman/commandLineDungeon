export type Stats = Record<string, number>;
export type Effects = Record<string, [number, number]>;
export interface Item {
  id: string;
  name: string;
  kind: string;
  rarity: number;
  value: number;
  stat?: string;
  duration?: number;
  attack?: number;
  weight?: number;
  luck?: number;
  uses?: number;
  maxUses?: number;
  element?: string;
  auto?: boolean;
  description: string;
}
export interface Actor {
  id: string;
  name: string;
  className: string;
  stats: Stats;
  hp: number;
  effects: Effects;
  weapons: Item[];
  x: number;
  y: number;
  level: number;
  poison?: [number, number];
  drain?: boolean;
  boss?: boolean;
  key?: boolean;
  npc?: {
    tribe: string;
    deal: string;
    done: boolean;
    line: string;
    acceptsNoWeapon?: boolean;
  };
}
export interface Game {
  version: 1;
  seed: number;
  floor: number;
  difficulty: number;
  tiles: number[][];
  light: boolean[][];
  player: Actor;
  monsters: Actor[];
  loot: { x: number; y: number; item: Item }[];
  pods: { x: number; y: number; max: boolean }[];
  stairs: { x: number; y: number; locked: boolean };
  inventory: Item[];
  keys: number;
  hands: number;
  capacity: number;
  sight: number;
  xp: number;
  score: number;
  turn: number;
  combat?: string;
  encounter?: {
    enemyId: string;
    origin: "inspection" | "enemy" | "resumed";
    engaged: boolean;
    exchanges: number;
    result?: string;
  };
  pendingLoot?: Item;
  pendingLevels: number;
  status: "playing" | "dead" | "won";
  log: string[];
  revision: number;
}
export type Action =
  | { type: "move"; dx: number; dy: number }
  | {
      type:
        | "flee"
        | "leave"
        | "wait"
        | "ascend"
        | "continue"
        | "pickup"
        | "use-floor"
        | "ignore"
        | "talk";
    }
  | { type: "attack"; unarmed?: boolean }
  | { type: "use" | "drop" | "unequip"; id: string }
  | { type: "deal"; id?: string }
  | { type: "cast"; spell: string }
  | { type: "level"; stat: string };

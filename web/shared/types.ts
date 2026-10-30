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
  armorBonus?: number;
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
  poisonSource?: string;
  curseSource?: string;
  poisonImmune?: boolean;
  gold?: number;
  curseChance?: number;
  burn?: [number, number];
  maxMana?: number;
  magicScale?: boolean;
  sharpening?: boolean;
  skillBook?: boolean;
  passiveStats?: Stats;
  spawnTurn?: number;
  merchant?: Merchant;
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
export interface Merchant {
  stock: { item: Item; price: number }[];
  buyPrices: Record<string, number | null>;
  dislikes: string[];
  taste: number;
  wanted?: string;
  premium: number;
  line: string;
  refusal: string;
  king?: boolean;
}
export interface Chest {
  id: string;
  x: number;
  y: number;
  locked: boolean;
  ultra: boolean;
  opened: boolean;
  reward: Item;
}
export interface SecretDoor {
  id: string;
  x: number;
  y: number;
  unlocked: boolean;
  outcome: string;
  roomMade?: boolean;
}
export interface Trap {
  id: string;
  x: number;
  y: number;
  kind: "poison" | "curse" | "rust" | "trip" | "fairy" | "sap" | "monster";
  revealed: boolean;
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
  death?: { source: string; attacker?: string; damage: number; floor: number; turn: number };
  log: string[];
  logSerial?: number;
  chests?: Chest[];
  secretDoors?: SecretDoor[];
  traps?: Trap[];
  expDoubles?: number;
  pendingChest?: string;
  pendingDoor?: string;
  haunting?: { x: number; y: number; due: number; name: string }[];
  inSecret?: string;
  stealthSteps?: number;
  chronicles?: string[];
  marketNotice?: string;
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
        | "ignore"
        | "talk";
    }
  | { type: "use-floor" | "equip-floor"; id?: string; spell?: string }
  | { type: "pickup"; id?: string }
  | { type: "pickup-swap"; id: string; incomingId?: string }
  | { type: "throw-floor"; id: string; target: string }
  | { type: "attack"; unarmed?: boolean }
  | { type: "use" | "drop" | "unequip"; id: string; spell?: string; target?: string }
  | { type: "deal"; id?: string }
  | { type: "cast"; spell: string }
  | { type: "level"; stat: string }
  | {
      type: "buy" | "quote" | "sell" | "open-chest" | "unlock-door";
      id: string;
    }
  | { type: "dismiss-object" };

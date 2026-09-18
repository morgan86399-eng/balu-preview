export type Weapon =
  | "sword"
  | "spear"
  | "bow"
  | "fan"
  | "fire"
  | "staff"
  | "dark";

export type PathAction =
  | "challenge"
  | "inquire"
  | "allure"
  | "purchase"
  | "guide"
  | "hire"
  | "provoke"
  | "duel";

export type JobId =
  | "saint"
  | "dragon"
  | "tiger"
  | "scholar"
  | "hegemon"
  | "flame"
  | "archer"
  | "dancer";

export type MapId = "xinyue" | "inn" | "road" | "camp" | "yunzhen" | "field" | "merge" | "zhuolu" | "zgate" | "wolong" | "nfield" | "taoyuan" | "tgarden" | "xuchang" | "xroad";

export type ChronicleId = "ch1" | "zhaoyun2" | "confluence" | "zhangfei3" | "zhuge4" | "liubei5" | "caocao6";

export type Dir = "up" | "down" | "left" | "right";

export type Screen =
  | "title"
  | "select"
  | "chronicleConfirm"
  | "confluenceConfirm"
  | "zhangfeiConfirm"
  | "zhugeConfirm"
  | "liubeiConfirm"
  | "caocaoConfirm"
  | "fourRoads"
  | "fiveRoads"
  | "saveSlots"
  | "worldMap"
  | "settings"
  | "partySelect"
  | "world"
  | "battle"
  | "gameover";

export interface Skill {
  id: string;
  name: string;
  sp: number;
  weapon: Weapon;
  hits: number;
  power: number;
  aoe?: boolean;
  effect?: "heal" | "bpAlly" | "reveal" | "debuffAtk" | "burn" | "cover";
  /** True when this skill is listed under the 支援 submenu. */
  support?: boolean;
  /** True for once-per-battle 潛能. */
  potential?: boolean;
}

export interface HeroDef {
  id: string;
  name: string;
  title: string;
  job: JobId;
  jobName: string;
  pathAction: PathAction;
  pathActionName: string;
  opening: string;
  bio: string;
  portrait: string;
  color: string;
  maxHp: number;
  maxSp: number;
  atk: number;
  def: number;
  spd: number;
  weaknesses: Weapon[];
  skills: Skill[];
  /** At least one support skill for the 支援 command. */
  supportSkill: Skill;
}

export interface EnemyDef {
  id: string;
  name: string;
  portrait: string;
  maxHp: number;
  maxSp: number;
  atk: number;
  def: number;
  spd: number;
  shields: number;
  weaknesses: Weapon[];
  skills: Skill[];
  gold: number;
  exp: number;
}

export interface Fighter {
  uid: string;
  defId: string;
  name: string;
  portrait: string;
  color: string;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  bp: number;
  atk: number;
  def: number;
  spd: number;
  shields: number;
  maxShields: number;
  broken: boolean;
  defending: boolean;
  revealed: boolean;
  atkDebuff: number;
  burn: number;
  weaknesses: Weapon[];
  skills: Skill[];
  isPlayer: boolean;
  /** Once-per-battle 潛能 used. */
  potentialUsed: boolean;
}

export type BattleEvent =
  | { type: "text"; text: string }
  | { type: "hit"; targetId: string; damage: number; weak: boolean; breakWindow?: boolean; huge?: boolean }
  | { type: "shield"; targetId: string; left: number }
  | { type: "break"; targetId: string }
  | { type: "heal"; targetId: string; amount: number }
  | { type: "bp"; targetId: string; bp: number }
  | { type: "burn"; targetId: string; amount: number }
  | { type: "dead"; targetId: string }
  | { type: "win" }
  | { type: "lose" }
  | { type: "turn"; actorId: string }
  | { type: "phase2"; targetId: string }
  | { type: "potential"; name: string; actorId: string };

export interface BattleState {
  fighters: Fighter[];
  order: string[];
  turn: number;
  ended: "win" | "lose" | null;
  kind: "skirmish" | "gate" | "boss" | "miniboss";
  /** Boss only: 1 = normal, 2 = after first shield break. */
  bossPhase?: 1 | 2;
}

export interface TownNpc {
  id: string;
  name: string;
  x: number;
  y: number;
  talk: string[];
  pathHint: PathAction;
  nightOnly?: boolean;
  dayOnly?: boolean;
  requireFlag?: string;
  hideFlag?: string;
}

export interface Warp {
  x: number;
  y: number;
  to: MapId;
  tx: number;
  ty: number;
  requireFlag?: string;
  prompt: string;
}

export interface MapView {
  northY: number;
  southY: number;
  northHalf: number;
  southHalf: number;
  centerX: number;
}

export interface MapDef {
  id: MapId;
  name: string;
  bg: string;
  lighting: "dusk" | "night" | "fire" | "noon" | "warm";
  tiles: string[];
  npcs: TownNpc[];
  warps: Warp[];
  view: MapView;
  encounter?: { steps: number; packs: string[][]; softOnly?: boolean };
}

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  kind: "heal" | "healAll" | "oil" | "key" | "weapon" | "armor";
  power: number;
  /** Flat attack bonus when equipped (weapon/armor). */
  atkBonus?: number;
  /** Flat defense bonus when equipped. */
  defBonus?: number;
  slot?: "weapon" | "armor";
}

export interface EquipSlots {
  weapon?: string;
  armor?: string;
}

export interface DialogueLine {
  speaker: string;
  portrait?: string;
  text: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
}

export interface HeroVitals {
  hp: number;
  sp: number;
}

export interface GameSave {
  version: 2;
  heroId: string;
  party: string[];
  mapId: MapId;
  x: number;
  y: number;
  facing: Dir;
  flags: Record<string, boolean>;
  gold: number;
  items: Record<string, number>;
  inquired: string[];
  weaknessLog: Record<string, Weapon[]>;
  journal: string[];
  /** Short clue lines unlocked by successful inquire/allure. */
  clues: string[];
  hour: number;
  level: number;
  exp: number;
  vitals: Record<string, HeroVitals>;
  steps: number;
  chapter: number;
  /** Active short chronicle / 列傳線. */
  chronicleId: ChronicleId;
  /** Equipped weapon/armor item ids. */
  equip: EquipSlots;
  /** Field/road encounter meter fill (0..encounterMax). Town does not rise. */
  encounterFill: number;
  /** Path action success counts (探聽／挑戰／威嚇…). */
  pathMastery?: Partial<Record<PathAction, number>>;
}

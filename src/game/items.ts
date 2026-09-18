import type { ItemDef } from "./types.ts";

export const ITEMS: ItemDef[] = [
  {
    id: "herb",
    name: "草藥",
    desc: "回復一名同伴的傷勢。",
    price: 20,
    kind: "heal",
    power: 48,
  },
  {
    id: "salve",
    name: "金創藥",
    desc: "整隊傷勢都緩一緩。",
    price: 55,
    kind: "healAll",
    power: 32,
  },
  {
    id: "oil",
    name: "火油",
    desc: "對一名敵人潑火。怕火的盾會被削開。",
    price: 35,
    kind: "oil",
    power: 38,
  },
  {
    id: "iron-spear",
    name: "精鐵槍",
    desc: "可裝備的槍。攻擊略升。",
    price: 60,
    kind: "weapon",
    power: 0,
    slot: "weapon",
    atkBonus: 4,
  },
  {
    id: "leather-armor",
    name: "皮甲",
    desc: "可裝備的輕甲。防禦略升。",
    price: 50,
    kind: "armor",
    power: 0,
    slot: "armor",
    defBonus: 3,
  },
];

export function itemById(id: string): ItemDef | undefined {
  return ITEMS.find((x) => x.id === id);
}

export const LEVEL_CURVE = [0, 40, 90, 160, 250, 360];

export function expToNext(level: number): number {
  return LEVEL_CURVE[level] ?? 9999;
}

export function statScale(base: number, level: number): number {
  return Math.round(base * (1 + (level - 1) * 0.08));
}


export function equipBonuses(equip: { weapon?: string; armor?: string } | undefined): { atk: number; def: number } {
  let atk = 0;
  let def = 0;
  if (!equip) return { atk, def };
  for (const id of [equip.weapon, equip.armor]) {
    if (!id) continue;
    const it = itemById(id);
    if (!it) continue;
    atk += it.atkBonus ?? 0;
    def += it.defBonus ?? 0;
  }
  return { atk, def };
}

export function isEquippable(id: string): boolean {
  const it = itemById(id);
  return Boolean(it && (it.kind === "weapon" || it.kind === "armor") && it.slot);
}

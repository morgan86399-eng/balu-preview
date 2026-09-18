import type { Dir, GameSave, MapDef, TownNpc } from "./types.ts";
import { blockedTile, tileAt } from "./maps.ts";

export const DELTA: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export const DIRS: Dir[] = ["up", "down", "left", "right"];

export function tileToPercent(map: MapDef, x: number, y: number): { left: number; top: number; scale: number } {
  const rows = map.tiles.length;
  const cols = map.tiles[0]?.length ?? 1;
  const v = map.view;
  const ty = rows <= 1 ? 0.5 : y / (rows - 1);
  const tx = cols <= 1 ? 0.5 : x / (cols - 1);
  const half = v.northHalf + ty * (v.southHalf - v.northHalf);
  const top = v.northY + ty * (v.southY - v.northY);
  const left = v.centerX + (tx - 0.5) * 2 * half;
  const scale = 0.4 + 0.42 * ty;
  return { left: left * 100, top: top * 100, scale };
}

export function placeName(map: MapDef, x: number, y: number, npcs: TownNpc[]): string {
  const ch = tileAt(map, x, y);
  const nextToWell = DIRS.some((dir) => {
    const [dx, dy] = DELTA[dir];
    return tileAt(map, x + dx, y + dy) === "w";
  });
  if (ch === "w" || nextToWell) return "井邊";
  if (ch === "G") {
    if (map.id === "xinyue") return "城門";
    if (map.id === "yunzhen" || map.id === "zhuolu" || map.id === "wolong") return "驛門";
    if (map.id === "road" || map.id === "field" || map.id === "merge" || map.id === "zgate" || map.id === "nfield") return "回城路口";
    return "營門";
  }
  if (ch === "I" || ch === "D") return "客棧門口";
  if (ch === "C") return "北營入口";
  if (ch === "B") {
    if (map.id === "field") return "小帥旗下";
    if (map.id === "merge") return "殘黨旗下";
    if (map.id === "zgate") return "鎮口旗下";
    if (map.id === "nfield") return "偽軍師旗下";
    if (map.id === "tgarden") return "鄉霸旗下";
    if (map.id === "xroad") return "探馬旗下";
    return "渠帥大帳";
  }
  if (ch === "F") return "營火邊";
  if (ch === "P") return "俘虜處";
  const near = npcs.find((n) => Math.abs(n.x - x) + Math.abs(n.y - y) <= 1);
  if (near) return `靠近${near.name}`;
  return "石板路";
}

export function objectiveFor(save: GameSave): string {
  if (save.chronicleId === "confluence") {
    if (save.flags.confluenceClear) return "匯合篇序章已寫完。";
    if (!save.flags.nightTalkDone) return "北上擊敗合流小頭目。營火可夜話。";
    return "北上擊敗黃巾渠帥殘黨。";
  }
  if (save.chronicleId === "zhaoyun2") {
    if (save.flags.ch2Clear) return "趙雲列傳初章已寫完。";
    if (save.mapId === "field") return "北上擊敗黃巾小帥。";
    return "出驛門，前往常山平野。";
  }
  if (save.chronicleId === "zhangfei3") {
    if (save.flags.ch3Clear) return "張飛列傳初章已寫完。";
    if (save.mapId === "zgate") return "北上擊敗黃巾鎮口頭目。";
    return "出驛門，前往鎮口。";
  }
  if (save.chronicleId === "zhuge4") {
    if (save.flags.ch4Clear) return "諸葛亮列傳初章已寫完。";
    if (!save.flags.ch4Inquired) return "先探聽村老或書生，問清陣眼。";
    if (save.mapId === "nfield") return "北上以計擊敗黃巾偽軍師。";
    return "出岡門，前往新野郊野。";
  }
  if (save.chronicleId === "liubei5") {
    if (save.flags.ch5Clear) return "劉備列傳初章已寫完。";
    if (save.mapId === "tgarden") return "北上擊敗黃巾鄉霸。";
    return "出園門，前往桃園外。";
  }
  if (save.chronicleId === "caocao6") {
    if (save.flags.ch6Clear) return "曹操列傳初章已寫完。";
    if (save.mapId === "xroad") return "北上擊敗黃巾探馬頭目。";
    return "出郊門，前往許昌官道。";
  }
  if (save.flags.bossDown) return "第一章已寫完。";
  const withThird = save.party.length >= 3 || save.flags.thirdJoined;
  const withCompanion = save.party.length > 1 || save.flags.companionJoined;
  if (save.mapId === "camp") {
    if (withThird) return "三人並肩，共破北營。";
    return withCompanion ? "與同伴共破北營。" : "擊敗黃巾渠帥。";
  }
  if (save.flags.cleared) {
    if (withThird) return "三人並肩，北上攻營。";
    return withCompanion ? "與同伴共破北營。" : "北上攻入黃巾營寨。";
  }
  if (withThird) return "三人並肩，共破城門。";
  if (withCompanion) {
    return save.flags.companionJoined && !save.flags.thirdJoined
      ? "新野街上尋過路旅人，請第三人同行。"
      : "與同伴共破城門。";
  }
  if (save.inquired.length) return "依探得弱點削盾，突破城門。";
  return "靠近人使用路徑行動。";
}

export function walkPads(
  map: MapDef,
  x: number,
  y: number,
  npcs: TownNpc[],
): { dir: Dir; x: number; y: number; left: number; top: number; scale: number }[] {
  const occupied = new Set(npcs.map((n) => `${n.x},${n.y}`));
  const out = [];
  for (const dir of DIRS) {
    const [dx, dy] = DELTA[dir];
    const nx = x + dx;
    const ny = y + dy;
    if (blockedTile(tileAt(map, nx, ny))) continue;
    if (occupied.has(`${nx},${ny}`)) continue;
    out.push({ dir, x: nx, y: ny, ...tileToPercent(map, nx, ny) });
  }
  return out;
}

export function clampToMap(map: MapDef, x: number, y: number): { x: number; y: number } {
  const rows = map.tiles.length;
  const cols = map.tiles[0]?.length ?? 1;
  let nx = Math.max(0, Math.min(cols - 1, x));
  let ny = Math.max(0, Math.min(rows - 1, y));
  if (!blockedTile(tileAt(map, nx, ny))) return { x: nx, y: ny };
  for (let yy = 0; yy < rows; yy++) {
    for (let xx = 0; xx < cols; xx++) {
      if (!blockedTile(tileAt(map, xx, yy))) return { x: xx, y: yy };
    }
  }
  return { x: nx, y: ny };
}

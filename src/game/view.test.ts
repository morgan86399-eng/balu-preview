import { MAPS, START, blockedTile, tileAt } from "./maps.ts";
import { clampToMap, objectiveFor, placeName, tileToPercent, walkPads } from "./view.ts";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
  console.log("ok", msg);
}

const town = MAPS.xinyue;
const start = tileToPercent(town, START.x, START.y);
const gate = tileToPercent(town, 6, 1);
const well = tileToPercent(town, 6, 8);
assert(start.top > well.top, "起點在畫面下方、井的前面");
assert(well.top > gate.top, "井在城門前面");
assert(start.scale > gate.scale, "近處人物比較大");
assert(placeName(town, START.x, START.y, []) === "石板路" || placeName(town, 6, 9, []).includes("井"), "井南有地名");
assert(placeName(town, 6, 9, []) === "井邊", "站在井南顯示井邊");
assert(!blockedTile(tileAt(town, START.x, START.y)), "起點可站");
assert(walkPads(town, START.x, START.y, []).some((p) => p.dir === "up"), "起點可往畫面上方移動");
assert(objectiveFor({ flags: {}, inquired: [], mapId: "xinyue", party: ["guanyu"] } as never).includes("路徑行動"), "開場目標提到路徑行動");
assert(objectiveFor({ flags: { companionJoined: true }, inquired: [], mapId: "xinyue", party: ["guanyu", "zhangfei"] } as never).includes("旅人") || objectiveFor({ flags: { companionJoined: true }, inquired: [], mapId: "xinyue", party: ["guanyu", "zhangfei"] } as never).includes("同伴"), "同行後目標更新");
assert(objectiveFor({ flags: { companionJoined: true, thirdJoined: true }, inquired: ["elder"], mapId: "xinyue", party: ["guanyu", "zhangfei", "zhaoyun"] } as never).includes("三人"), "第三人目標更新");
const clamped = clampToMap(town, 99, 99);
assert(!blockedTile(tileAt(town, clamped.x, clamped.y)), "越界會拉回可站格");
console.log("view tests passed");

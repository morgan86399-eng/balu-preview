import { MAPS } from "./maps.ts";
import { performPathAction, previewPathAction, talkLinesFor } from "./pathAction.ts";
import { objectiveFor } from "./view.ts";

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error("FAIL", msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
}

let passed = 0;
function ok(msg: string) {
  passed += 1;
  console.log("ok", msg);
}

const elder = MAPS.xinyue.npcs.find((n) => n.id === "elder")!;
const vendor = MAPS.xinyue.npcs.find((n) => n.id === "vendor")!;
const wayfarer = MAPS.xinyue.npcs.find((n) => n.id === "wayfarer")!;
const drinker = MAPS.xinyue.npcs.find((n) => n.id === "drinker")!;

{
  // drinker hint is challenge — inquire is unmatched for 關羽
  const r = performPathAction("guanyu", drinker, "inquire", {}, 80, ["guanyu"]);
  assert(!r.ok, "非習性探聽應失敗");
  assert(r.failBanner === "被看穿了", "失敗橫幅：被看穿了");
  ok("探聽失敗橫幅");
}

{
  const r = performPathAction("zhuge", elder, "inquire", {}, 80, ["zhuge"]);
  assert(r.ok, "諸葛亮探聽應成功");
  assert(Boolean(r.clue), "成功應有線索");
  assert(Boolean(r.revealWeak?.length), "應揭露弱點");
  assert(r.recruitTemp && r.companionId === "zhouyu", "探聽可招募第二同伴");
  ok("探聽成功有線索與同伴");
}

{
  const r = performPathAction("caocao", vendor, "purchase", {}, 80, ["caocao"]);
  assert(r.ok, "徵購應成功");
  assert(r.lootPopup?.includes("獲得"), "應有獲得彈窗文案");
  assert(r.itemDelta?.herb === 1, "草藥入包");
  ok("購買獲得彈窗");
}

{
  const r = performPathAction("caocao", vendor, "purchase", {}, 5, ["caocao"]);
  assert(!r.ok, "錢不夠應失敗");
  assert(r.failBanner === "對方不肯", "失敗橫幅：對方不肯");
  ok("購買失敗橫幅");
}

{
  const r = performPathAction("guanyu", drinker, "challenge", {}, 80, ["guanyu"]);
  assert(r.ok && r.startBattle?.length, "挑戰應開戰");
  assert(Boolean(r.preBattleName && r.preBattleThreat), "應有開戰前文案");
  ok("挑戰開戰前面板資料");
}

{
  const r = performPathAction("guanyu", elder, "challenge", {}, 80, ["guanyu"]);
  assert(!r.ok && r.failBanner === "對方不肯", "和平對象即使專精也拒戰");
  ok("和平對象拒戰");
}

{
  const r = performPathAction(
    "zhaoyun",
    elder,
    "duel",
    {},
    80,
    ["zhaoyun"],
  );
  assert(!r.ok && r.failBanner === "對方不肯", "非戰鬥對象決鬥應拒");
  ok("決鬥失敗橫幅");
}

{
  const r = performPathAction(
    "guanyu",
    wayfarer,
    "hire",
    { companionJoined: true },
    80,
    ["guanyu", "zhangfei"],
  );
  assert(r.ok && r.thirdRecruit && r.companionId === "zhaoyun", "旅人延聘第三人");
  assert(r.flag === "thirdJoined", "第三人旗標");
  ok("第三人旅人入隊");
}

{
  const r = performPathAction("guanyu", wayfarer, "hire", {}, 80, ["guanyu"]);
  assert(!r.ok && r.failBanner === "對方不肯", "無第二同伴時旅人拒");
  ok("旅人需先有同伴");
}

{
  const talk0 = talkLinesFor(elder, []);
  const talk1 = talkLinesFor(elder, ["elder"]);
  assert(talk0[0] !== talk1[0] || talk1.length > 0, "探聽後對話應解鎖新內容");
  assert(talk1[0].includes("柴堆") || talk1[0].includes("弱點"), "新對話可讀");
  ok("探聽解鎖新對話");
}

{
  const inn = MAPS.inn.npcs.find((n) => n.id === "innkeeper")!;
  const r = performPathAction("caocao", inn, "purchase", {}, 80, ["caocao"]);
  assert(r.ok && r.overnight, "投宿應觸發過夜演出");
  ok("客棧過夜旗");
}

{
  const inn = MAPS.inn.npcs.find((n) => n.id === "innkeeper")!;
  const r = performPathAction("guanyu", inn, "purchase", {}, 0, ["guanyu"]);
  assert(r.ok && r.overnight, "零錢亦可免費投宿");
  assert((r.goldDelta ?? 0) === 0, "投宿不扣錢");
  const prev = previewPathAction("guanyu", inn, "purchase", {}, 0);
  assert(prev.name.includes("投宿"), "預覽名稱應為投宿");
  assert(prev.condition.includes("免費"), "預覽應標免費");
  ok("客棧免費過夜");
}

{
  const obj = objectiveFor({
    flags: { companionJoined: true },
    inquired: ["elder"],
    mapId: "xinyue",
    party: ["guanyu", "zhangfei"],
  } as never);
  assert(obj.includes("旅人") || obj.includes("第三"), `同行後目標應指向旅人：${obj}`);
  const obj3 = objectiveFor({
    flags: { companionJoined: true, thirdJoined: true },
    inquired: ["elder"],
    mapId: "xinyue",
    party: ["guanyu", "zhangfei", "zhaoyun"],
  } as never);
  assert(obj3.includes("三人"), `第三人後目標：${obj3}`);
  ok("目標橫幅第三人更新");
}

{
  const prev = previewPathAction("zhuge", elder, "inquire", {}, 80);
  assert(prev.result.includes("弱點") || prev.result.includes("同行"), "預覽可讀");
  ok("路徑預覽");
}

console.log(`\n${passed} pathAction tests passed`);
if (process.exitCode) process.exit(1);

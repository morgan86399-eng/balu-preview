import { readFileSync } from "node:fs";
import {
  emptyProgress,
  sixRoadsUnlocked,
  sevenRoadsUnlocked,
  sevenRoadsLockHint,
  sunshangxiangStatus,
  zhouyuStatus,
  patchProgress,
  writeProgress,
} from "./progress.ts";
import {
  CHRONICLES,
  newSunshangxiangSave,
  SUNSHANGXIANG_CHRONICLE_ID,
  sunshangxiangOpening,
} from "./chronicles.ts";
import {
  MAPS,
  BOWYARD_MINIBOSS_COORDS,
  isBowyardMinibossTile,
  bowyardSoftEncountersSuppressed,
  tileAt,
} from "./maps.ts";
import { ENEMIES, HEROES, JOURNAL } from "./data.ts";
import { createBattle } from "./combat.ts";
import { objectiveFor } from "./view.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

{
  const mem = new Map<string, string>();
  const g = globalThis as unknown as { localStorage?: Storage };
  g.localStorage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => {
      mem.set(k, v);
    },
    removeItem: (k) => {
      mem.delete(k);
    },
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  };
}

writeProgress(emptyProgress());
assert(sunshangxiangStatus() === "未開", "ssx idle");
assert(!sevenRoadsUnlocked(), "seven locked");
assert(
  sevenRoadsLockHint().includes("周瑜列傳") || sevenRoadsLockHint().includes("關羽"),
  "seven hint",
);

assert(CHRONICLES.sunshangxiang8.clearTitle === "孫尚香列傳・初章既竟", "clear title");
assert(SUNSHANGXIANG_CHRONICLE_ID === "sunshangxiang8", "id");
assert(MAPS.waterfort && MAPS.bowyard, "maps");
assert(MAPS.waterfort.name === "江東水寨", "waterfort name");
assert(MAPS.bowyard.name === "江東弓場", "bowyard name");
assert(isBowyardMinibossTile(7, 1), "boss tile");

const save = newSunshangxiangSave();
assert(save.chronicleId === "sunshangxiang8", "save chronicle");
assert(save.heroId === "sunshangxiang", "hero");
assert(save.party.includes("zhaoyun"), "partner");
assert(save.mapId === "waterfort" || save.mapId === "bowyard", "save map");
assert(sunshangxiangOpening().length >= 3, "opening");
const obj = objectiveFor(save);
assert(
  obj.includes("弓") || obj.includes("水寨") || obj.includes("帶領") || obj.includes("箭"),
  "objective",
);

for (const c of BOWYARD_MINIBOSS_COORDS) {
  assert(tileAt(MAPS.bowyard, c.x, c.y) === "B", `B at (${c.x},${c.y})`);
  assert(isBowyardMinibossTile(c.x, c.y), `zone (${c.x},${c.y})`);
}
const chief = MAPS.bowyard.npcs.find((n) => n.id === "ssx-bowchief");
assert(chief && chief.hideFlag === "ch8Clear", "bowchief npc");
assert(bowyardSoftEncountersSuppressed({}) === true, "soft suppressed");
assert(bowyardSoftEncountersSuppressed({ ch8Clear: true }) === false, "soft after clear");

assert(ENEMIES.bowchief?.name === "水寨弓頭目", "bowchief");
const battle = createBattle(["sunshangxiang", "zhaoyun"], ["yellow", "bowchief"], "miniboss", 1, {});
assert(battle.kind === "miniboss", "miniboss kind");
assert(battle.fighters.some((f) => f.defId === "bowchief"), "bowchief in battle");

assert(JOURNAL["ch8-start"], "ch8 journal start");
assert(JOURNAL["ch8-clear"], "ch8 journal clear");
assert(JOURNAL["ch8-clear"].title === "孫尚香列傳・初章既竟", "journal clear title");

patchProgress({
  ch1Clear: true,
  ch2Clear: true,
  ch3Clear: true,
  ch4Clear: true,
  ch5Clear: true,
  ch6Clear: true,
});
assert(sixRoadsUnlocked(), "six unlocked without zhouyu");
assert(!sevenRoadsUnlocked(), "seven still locked without zhouyu");
assert(sevenRoadsLockHint().includes("周瑜列傳"), "seven missing zhouyu");

patchProgress({ ch7Clear: true, ch7Started: true });
assert(zhouyuStatus() === "初章既竟", "zhouyu done");
assert(sevenRoadsUnlocked(), "seven unlocked");
assert(sevenRoadsLockHint() === "", "no seven hint");

console.log("ok progress sunshangxiang + seven roads");
console.log("ok sunshangxiang save + maps");

{
  const title = readFileSync("src/components/TitleScreen.tsx", "utf8");
  for (const s of [
    "孫尚香短線測試",
    "七路總覽灰態測試",
    "七路既竟面板測試",
    "七路初章既竟",
    "七路總覽",
    "六路既竟面板測試",
    "六路總覽灰態測試",
    "周瑜短線測試",
  ]) {
    assert(title.includes(s), `title missing ${s}`);
  }
  assert(title.includes("孫尚香列傳"), "8th progress line");
  const app = readFileSync("src/App.tsx", "utf8");
  assert(app.includes("孫尚香列傳・初章既竟") || CHRONICLES.sunshangxiang8.clearTitle === "孫尚香列傳・初章既竟", "ssx clear in app/data");
  assert(app.includes("bowchief"), "bowchief battle");
  const lb = HEROES.find((h) => h.id === "liubei");
  const gy = HEROES.find((h) => h.id === "guanyu");
  assert(lb?.portrait === "./art/portrait-liubei.png", "liubei path");
  assert(gy?.portrait === "./art/portrait-guanyu.png", "guanyu path");
  assert(lb!.portrait !== gy!.portrait, "liubei !== guanyu path");
  console.log("ok", "n12 title QA strings + seven roads + portraits");
}

console.log("n12 tests passed");

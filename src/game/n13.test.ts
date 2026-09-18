import { readFileSync } from "node:fs";
import {
  emptyProgress,
  sevenRoadsUnlocked,
  eightRoadsUnlocked,
  eightRoadsLockHint,
  diaochanStatus,
  sunshangxiangStatus,
  patchProgress,
  writeProgress,
} from "./progress.ts";
import {
  CHRONICLES,
  newDiaochanSave,
  DIAOCHAN_CHRONICLE_ID,
  diaochanOpening,
} from "./chronicles.ts";
import {
  MAPS,
  MOONCOURT_MINIBOSS_COORDS,
  isMooncourtMinibossTile,
  mooncourtSoftEncountersSuppressed,
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
assert(diaochanStatus() === "未開", "dc idle");
assert(!eightRoadsUnlocked(), "eight locked");
assert(
  eightRoadsLockHint().includes("孫尚香列傳") || eightRoadsLockHint().includes("關羽"),
  "eight hint",
);

assert(CHRONICLES.diaochan9.clearTitle === "貂蟬列傳・初章既竟", "clear title");
assert(DIAOCHAN_CHRONICLE_ID === "diaochan9", "id");
assert(MAPS.fengyi && MAPS.mooncourt, "maps");
assert(MAPS.fengyi.name === "鳳儀亭", "fengyi name");
assert(MAPS.mooncourt.name === "月下庭院", "mooncourt name");
assert(isMooncourtMinibossTile(7, 1), "boss tile");

const save = newDiaochanSave();
assert(save.chronicleId === "diaochan9", "save chronicle");
assert(save.heroId === "diaochan", "hero");
assert(save.party.includes("caocao"), "partner");
assert(save.mapId === "fengyi" || save.mapId === "mooncourt", "save map");
assert(diaochanOpening().length >= 3, "opening");
const obj = objectiveFor(save);
assert(
  obj.includes("勸") || obj.includes("舞") || obj.includes("鳳儀") || obj.includes("庭院"),
  "objective",
);

for (const c of MOONCOURT_MINIBOSS_COORDS) {
  assert(tileAt(MAPS.mooncourt, c.x, c.y) === "B", `B at (${c.x},${c.y})`);
  assert(isMooncourtMinibossTile(c.x, c.y), `zone (${c.x},${c.y})`);
}
const chief = MAPS.mooncourt.npcs.find((n) => n.id === "dc-moonchief");
assert(chief && chief.hideFlag === "ch9Clear", "moonchief npc");
assert(mooncourtSoftEncountersSuppressed({}) === true, "soft suppressed");
assert(mooncourtSoftEncountersSuppressed({ ch9Clear: true }) === false, "soft after clear");

assert(ENEMIES.moonchief?.name === "庭院悍衛", "moonchief");
const battle = createBattle(["diaochan", "caocao"], ["yellow", "moonchief"], "miniboss", 1, {});
assert(battle.kind === "miniboss", "miniboss kind");
assert(battle.fighters.some((f) => f.defId === "moonchief"), "moonchief in battle");

assert(JOURNAL["ch9-start"], "ch9 journal start");
assert(JOURNAL["ch9-clear"], "ch9 journal clear");
assert(JOURNAL["ch9-clear"].title === "貂蟬列傳・初章既竟", "journal clear title");

patchProgress({
  ch1Clear: true,
  ch2Clear: true,
  ch3Clear: true,
  ch4Clear: true,
  ch5Clear: true,
  ch6Clear: true,
  ch7Clear: true,
});
assert(sevenRoadsUnlocked(), "seven unlocked without sunshangxiang");
assert(!eightRoadsUnlocked(), "eight still locked without sunshangxiang");
assert(eightRoadsLockHint().includes("孫尚香列傳"), "eight missing sunshangxiang");

patchProgress({ ch8Clear: true, ch8Started: true });
assert(sunshangxiangStatus() === "初章既竟", "ssx done");
assert(eightRoadsUnlocked(), "eight unlocked");
assert(eightRoadsLockHint() === "", "no eight hint");
assert(!diaochanStatus() || diaochanStatus() === "未開", "diaochan not required for eight");

console.log("ok progress diaochan + eight roads");
console.log("ok diaochan save + maps");

{
  const title = readFileSync("src/components/TitleScreen.tsx", "utf8");
  for (const s of [
    "貂蟬短線測試",
    "八路總覽灰態測試",
    "八路既竟面板測試",
    "八路初章既竟",
    "八路總覽",
    "七路既竟面板測試",
    "七路總覽灰態測試",
    "六路既竟面板測試",
    "孫尚香短線測試",
    "周瑜短線測試",
  ]) {
    assert(title.includes(s), `title missing ${s}`);
  }
  assert(title.includes("貂蟬列傳"), "9th progress line");
  assert(title.includes("第九線") || title.includes("外傳"), "ninth-line aside");
  const app = readFileSync("src/App.tsx", "utf8");
  assert(
    app.includes("貂蟬列傳・初章既竟") || CHRONICLES.diaochan9.clearTitle === "貂蟬列傳・初章既竟",
    "dc clear in app/data",
  );
  assert(app.includes("moonchief"), "moonchief battle");
  const lb = HEROES.find((h) => h.id === "liubei");
  const gy = HEROES.find((h) => h.id === "guanyu");
  assert(lb?.portrait === "./art/portrait-liubei.png", "liubei path");
  assert(gy?.portrait === "./art/portrait-guanyu.png", "guanyu path");
  assert(lb!.portrait !== gy!.portrait, "liubei !== guanyu path");
  console.log("ok", "n13 title QA strings + eight roads + portraits");
}

console.log("n13 tests passed");

import { readFileSync, statSync } from "node:fs";
import {
  emptyProgress,
  sixRoadsUnlocked,
  sixRoadsLockHint,
  zhouyuStatus,
  patchProgress,
  writeProgress,
} from "./progress.ts";
import { CHRONICLES, newZhouyuSave, ZHOUYU_CHRONICLE_ID } from "./chronicles.ts";
import { MAPS, isJshoreMinibossTile } from "./maps.ts";
import { HEROES } from "./data.ts";

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
assert(zhouyuStatus() === "未開", "zhouyu idle");
assert(!sixRoadsUnlocked(), "six locked");
assert(sixRoadsLockHint().includes("曹操列傳") || sixRoadsLockHint().includes("關羽"), "six hint");

assert(CHRONICLES.zhouyu7.clearTitle === "周瑜列傳・初章既竟", "clear title");
assert(ZHOUYU_CHRONICLE_ID === "zhouyu7", "id");
assert(MAPS.chaisang && MAPS.jshore, "maps");
assert(isJshoreMinibossTile(7, 1), "boss tile");

const save = newZhouyuSave();
assert(save.chronicleId === "zhouyu7", "save chronicle");
assert(save.mapId === "chaisang" || save.mapId === "jshore", "save map");

patchProgress({
  ch1Clear: true,
  ch2Clear: true,
  ch3Clear: true,
  ch4Clear: true,
  ch5Clear: true,
  ch6Clear: true,
});
assert(sixRoadsUnlocked(), "six unlocked");
assert(sixRoadsLockHint() === "", "no hint");

console.log("ok progress zhouyu + six roads");
console.log("ok zhouyu save + maps");

{
  const title = readFileSync("src/components/TitleScreen.tsx", "utf8");
  for (const s of [
    "周瑜短線測試",
    "六路總覽灰態測試",
    "六路既竟面板測試",
    "六路初章既竟",
    "六路總覽",
  ]) {
    assert(title.includes(s), `title missing ${s}`);
  }
  const lb = HEROES.find((h) => h.id === "liubei");
  const gy = HEROES.find((h) => h.id === "guanyu");
  assert(lb?.portrait === "./art/portrait-liubei.png", "liubei path");
  assert(gy?.portrait === "./art/portrait-guanyu.png", "guanyu path");
  assert(lb!.portrait !== gy!.portrait, "liubei !== guanyu path");
  const lbBytes = statSync("public/art/portrait-liubei.png").size;
  const gyBytes = statSync("public/art/portrait-guanyu.png").size;
  assert(lbBytes !== 1659891, "not the labeled landscape");
  assert(lbBytes === 556706, "designer yellow/red hq bytes");
  assert(lbBytes !== gyBytes, "liubei/guanyu file sizes differ");
  console.log("ok", "n11 title QA strings + distinct portraits", lbBytes, gyBytes);
}

console.log("n11 tests passed");

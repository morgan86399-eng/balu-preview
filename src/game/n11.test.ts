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

assert(CHRONICLES.zhouyu7.clearTitle.includes("周瑜"), "clear title");
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
console.log("n11 tests passed");

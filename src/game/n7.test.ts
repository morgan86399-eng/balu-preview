import {
  CHRONICLES,
  ZHANGFEI_CHRONICLE_ID,
  newZhangFeiSave,
} from "./chronicles.ts";
import { ENEMIES } from "./data.ts";
import { createBattle } from "./combat.ts";
import {
  MAPS,
  ZGATE_MINIBOSS_COORDS,
  isZgateMinibossTile,
  tileAt,
} from "./maps.ts";
import {
  emptyProgress,
  guanyuStatus,
  qaGreyMapProgress,
  worldMapUnlocked,
  worldNodeLockHint,
  worldNodeUnlocked,
  zhangfeiStatus,
  zhaoyunStatus,
} from "./progress.ts";
import { SLOT_COUNT, listSlots, writeSlot, loadSlot, clearSlot, setActiveSlot } from "./save.ts";
import { objectiveFor } from "./view.ts";

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error("FAIL", msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
}

{
  const p = emptyProgress();
  assert(zhangfeiStatus(p) === "未開", "zf idle");
  assert(zhangfeiStatus({ ...p, ch3Started: true }) === "進行中", "zf active");
  assert(zhangfeiStatus({ ...p, ch3Started: true, ch3Clear: true }) === "初章既竟", "zf done");
  assert(!worldMapUnlocked(p), "map locked");
  assert(worldMapUnlocked({ ...p, ch1Clear: true }), "map after ch1");
  assert(worldMapUnlocked({ ...p, confluenceClear: true }), "map after confluence");
  assert(worldNodeUnlocked("xinyue", { ...p, ch1Clear: true }), "node xinyue");
  assert(!worldNodeUnlocked("xinyue", { ...p, ch1Started: true }), "xinyue needs clear not start");
  assert(!worldNodeUnlocked("changshan", { ...p, ch1Clear: true }), "changshan locked");
  assert(!worldNodeUnlocked("changshan", { ...p, ch2Started: true }), "changshan needs clear");
  assert(worldNodeUnlocked("changshan", { ...p, ch2Clear: true }), "changshan open");
  assert(!worldNodeUnlocked("merge", { ...p, ch1Clear: true, ch2Clear: true }), "merge needs confluence");
  assert(worldNodeUnlocked("merge", { ...p, confluenceClear: true }), "merge open");
  assert(worldNodeLockHint("changshan", p).includes("趙雲"), "hint changshan");
  const grey = qaGreyMapProgress();
  assert(worldMapUnlocked(grey), "qa grey map unlocked");
  assert(worldNodeUnlocked("xinyue", grey), "qa grey xinyue open");
  assert(!worldNodeUnlocked("changshan", grey), "qa grey changshan locked");
  assert(!worldNodeUnlocked("merge", grey), "qa grey merge locked");
  assert(guanyuStatus({ ...p, ch1Clear: true }) === "初章既竟", "gy");
  assert(zhaoyunStatus(p) === "未開", "zy");
  console.log("ok", "progress + world nodes");
}

{
  assert(SLOT_COUNT === 3, "3 slots");
  // Isolate slots for test (node has no localStorage by default in tsx? — mock)
  const mem = new Map<string, string>();
  const g = globalThis as unknown as {
    localStorage?: Storage;
  };
  g.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  };
  for (let i = 0; i < SLOT_COUNT; i++) clearSlot(i);
  const slots0 = listSlots();
  assert(slots0.length === 3, "list 3");
  assert(slots0.every((s) => s.empty && s.summary === "空" && s.timestamp === "空"), "all empty");
  const s = newZhangFeiSave();
  writeSlot(1, s);
  setActiveSlot(1);
  const loaded = loadSlot(1);
  assert(loaded?.chronicleId === "zhangfei3", "load slot1");
  const slots1 = listSlots();
  assert(!slots1[1]!.empty, "slot1 occupied");
  assert(slots1[1]!.summary.includes("張飛"), "summary zhangfei");
  assert(slots1[1]!.timestamp !== "空", "timestamp set");
  assert(slots1[0]!.empty, "slot0 still empty");
  console.log("ok", "save slots");
}

{
  const def = CHRONICLES.zhangfei3;
  assert(def.id === ZHANGFEI_CHRONICLE_ID, "zf id");
  assert(def.clearTitle === "張飛列傳・初章既竟", "clear title");
  assert(def.startMap === "zhuolu", "start zhuolu");
  const s = newZhangFeiSave();
  assert(s.heroId === "zhangfei", "hero");
  assert(s.party.includes("guanyu"), "partner");
  assert(objectiveFor(s).includes("鎮口") || objectiveFor(s).includes("驛"), "objective");
  console.log("ok", "zhangfei save");
}

{
  assert(MAPS.zhuolu?.name === "涿郡驛", "zhuolu name");
  assert(MAPS.zgate?.name === "鎮口", "zgate name");
  for (const c of ZGATE_MINIBOSS_COORDS) {
    assert(tileAt(MAPS.zgate, c.x, c.y) === "B", `B at (${c.x},${c.y})`);
    assert(isZgateMinibossTile(c.x, c.y), `zone (${c.x},${c.y})`);
  }
  const chief = MAPS.zgate.npcs.find((n) => n.id === "zf-gatechief");
  assert(chief && chief.hideFlag === "ch3Clear", "chief npc");
  console.log("ok", "zgate map zone");
}

{
  assert(ENEMIES.gatechief?.name === "黃巾鎮口頭目", "gatechief enemy");
  const b = createBattle(["zhangfei", "guanyu"], ["yellow", "gatechief"], "miniboss", 1, {
    weapon: "iron-spear",
  });
  assert(b.kind === "miniboss", "miniboss kind");
  assert(b.fighters.some((f) => f.defId === "gatechief"), "gatechief in battle");
  console.log("ok", "gatechief battle");
}

console.log("n7 tests passed");

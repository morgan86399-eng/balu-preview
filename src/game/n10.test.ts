import {
  CHRONICLES,
  CAOCAO_CHRONICLE_ID,
  caocaoOpening,
  newCaocaoSave,
} from "./chronicles.ts";
import { ENEMIES, HEROES, JOURNAL } from "./data.ts";
import { createBattle } from "./combat.ts";
import {
  MAPS,
  XROAD_MINIBOSS_COORDS,
  isXroadMinibossTile,
  xroadSoftEncountersSuppressed,
  tileAt,
} from "./maps.ts";
import {
  emptyProgress,
  fiveRoadsLockHint,
  fiveRoadsUnlocked,
  caocaoStatus,
  fourRoadsUnlocked,
  patchProgress,
} from "./progress.ts";
import { objectiveFor } from "./view.ts";

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error("FAIL", msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
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

  const p = emptyProgress();
  assert(caocaoStatus(p) === "未開", "cc idle");
  assert(caocaoStatus({ ...p, ch6Started: true }) === "進行中", "cc active");
  assert(caocaoStatus({ ...p, ch6Started: true, ch6Clear: true }) === "初章既竟", "cc done");
  assert(!fiveRoadsUnlocked(p), "five locked");
  assert(fiveRoadsLockHint(p).includes("關羽"), "hint missing guanyu");
  assert(fiveRoadsLockHint(p).includes("劉備"), "hint missing liubei");
  const all = {
    ...p,
    ch1Clear: true,
    ch2Clear: true,
    ch3Clear: true,
    ch4Clear: true,
    ch5Clear: true,
  };
  assert(fiveRoadsUnlocked(all), "five unlocked");
  assert(fiveRoadsLockHint(all) === "", "hint empty");
  assert(fiveRoadsUnlocked({ ...all, ch6Clear: false }), "five ignores caocao");
  console.log("ok", "progress caocao + five roads");
}

{
  assert(CAOCAO_CHRONICLE_ID === "caocao6", "id");
  const def = CHRONICLES.caocao6;
  assert(def.clearTitle === "曹操列傳・初章既竟", "clear title");
  assert(def.startMap === "xuchang", "start xuchang");
  const s = newCaocaoSave();
  assert(s.heroId === "caocao", "hero");
  assert(s.party.includes("zhuge"), "partner");
  assert(s.chronicleId === "caocao6", "chronicle");
  assert(HEROES.some((h) => h.id === "caocao"), "hero def");
  assert(caocaoOpening().length >= 3, "opening lines");
  const obj = objectiveFor(s);
  assert(obj.includes("官道") || obj.includes("探馬") || obj.includes("郊"), "objective");
  console.log("ok", "caocao save");
}

{
  assert(MAPS.xuchang?.name === "許昌郊", "xuchang name");
  assert(MAPS.xroad?.name === "許昌官道", "xroad name");
  for (const c of XROAD_MINIBOSS_COORDS) {
    assert(tileAt(MAPS.xroad, c.x, c.y) === "B", `B at (${c.x},${c.y})`);
    assert(isXroadMinibossTile(c.x, c.y), `zone (${c.x},${c.y})`);
  }
  const chief = MAPS.xroad.npcs.find((n) => n.id === "cc-enforcer");
  assert(chief && chief.hideFlag === "ch6Clear", "enforcer npc");
  assert(xroadSoftEncountersSuppressed({}) === true, "soft suppressed");
  assert(xroadSoftEncountersSuppressed({ ch6Clear: true }) === false, "soft after clear");
  console.log("ok", "xroad map zone");
}

{
  assert(ENEMIES.enforcer?.name === "黃巾探馬頭目", "enforcer");
  const b = createBattle(["caocao", "zhuge"], ["yellow", "enforcer"], "miniboss", 1, {});
  assert(b.kind === "miniboss", "miniboss kind");
  assert(b.fighters.some((f) => f.defId === "enforcer"), "enforcer in battle");
  console.log("ok", "enforcer battle");
}

{
  assert(JOURNAL["ch6-start"], "ch6 journal start");
  assert(JOURNAL["ch6-clear"], "ch6 journal clear");
  console.log("ok", "journal");
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
  patchProgress({
    ch1Started: true,
    ch1Clear: true,
    ch2Started: true,
    ch2Clear: true,
    ch3Started: true,
    ch3Clear: true,
    ch4Started: true,
    ch4Clear: true,
    ch5Started: true,
    ch5Clear: true,
  });
  assert(fiveRoadsUnlocked(), "patched five unlock");
  assert(fourRoadsUnlocked(), "four still unlocks");
  console.log("ok", "patch five roads");
}

{
  const hint = fiveRoadsLockHint(emptyProgress());
  assert(hint.includes("未解鎖"), "grey lock hint prefix");
  assert(hint.includes("劉備"), "grey hint lists 劉備");
  assert(fiveRoadsUnlocked(emptyProgress()) === false, "empty not unlocked");
  console.log("ok", "five-roads grey hint");
}

{
  const KEY = "ba-lu-tips-seen-v1";
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
  assert(localStorage.getItem(KEY) == null, "tips unseen");
  localStorage.setItem(KEY, "1");
  assert(localStorage.getItem(KEY) === "1", "tips seen flag");
  console.log("ok", "tips flag");
}

console.log("n10 tests passed");

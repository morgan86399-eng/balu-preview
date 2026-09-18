import {
  CHRONICLES,
  LIUBEI_CHRONICLE_ID,
  liubeiOpening,
  newLiubeiSave,
} from "./chronicles.ts";
import { ENEMIES, HEROES, JOURNAL } from "./data.ts";
import { createBattle } from "./combat.ts";
import {
  MAPS,
  TGARDEN_MINIBOSS_COORDS,
  isTgardenMinibossTile,
  tgardenSoftEncountersSuppressed,
  tileAt,
} from "./maps.ts";
import {
  emptyProgress,
  fourRoadsLockHint,
  fourRoadsUnlocked,
  liubeiStatus,
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
  assert(liubeiStatus(p) === "未開", "lb idle");
  assert(liubeiStatus({ ...p, ch5Started: true }) === "進行中", "lb active");
  assert(liubeiStatus({ ...p, ch5Started: true, ch5Clear: true }) === "初章既竟", "lb done");
  assert(!fourRoadsUnlocked(p), "four locked");
  assert(fourRoadsLockHint(p).includes("關羽"), "hint missing guanyu");
  const all = { ...p, ch1Clear: true, ch2Clear: true, ch3Clear: true, ch4Clear: true };
  assert(fourRoadsUnlocked(all), "four unlocked");
  assert(fourRoadsLockHint(all) === "", "hint empty");
  console.log("ok", "progress liubei + four roads");
}

{
  assert(LIUBEI_CHRONICLE_ID === "liubei5", "id");
  const def = CHRONICLES.liubei5;
  assert(def.clearTitle === "劉備列傳・初章既竟", "clear title");
  assert(def.startMap === "taoyuan", "start taoyuan");
  const s = newLiubeiSave();
  assert(s.heroId === "liubei", "hero");
  assert(s.party.includes("guanyu"), "partner");
  assert(s.chronicleId === "liubei5", "chronicle");
  assert(HEROES.some((h) => h.id === "liubei"), "hero def");
  assert(liubeiOpening().length >= 3, "opening lines");
  const obj = objectiveFor(s);
  assert(obj.includes("園") || obj.includes("鄉霸"), "objective");
  console.log("ok", "liubei save");
}

{
  assert(MAPS.taoyuan?.name === "桃園", "taoyuan name");
  assert(MAPS.tgarden?.name === "桃園外", "tgarden name");
  for (const c of TGARDEN_MINIBOSS_COORDS) {
    assert(tileAt(MAPS.tgarden, c.x, c.y) === "B", `B at (${c.x},${c.y})`);
    assert(isTgardenMinibossTile(c.x, c.y), `zone (${c.x},${c.y})`);
  }
  const chief = MAPS.tgarden.npcs.find((n) => n.id === "lb-tyrant");
  assert(chief && chief.hideFlag === "ch5Clear", "tyrant npc");
  assert(tgardenSoftEncountersSuppressed({}) === true, "soft suppressed");
  assert(tgardenSoftEncountersSuppressed({ ch5Clear: true }) === false, "soft after clear");
  console.log("ok", "tgarden map zone");
}

{
  assert(ENEMIES.tyrant?.name === "黃巾鄉霸", "tyrant");
  assert(ENEMIES.outlaw?.name === "黃巾懸賞賊", "outlaw");
  const b = createBattle(["liubei", "guanyu"], ["yellow", "tyrant"], "miniboss", 1, {});
  assert(b.kind === "miniboss", "miniboss kind");
  assert(b.fighters.some((f) => f.defId === "tyrant"), "tyrant in battle");
  console.log("ok", "tyrant battle");
}

{
  const board = MAPS.xinyue.npcs.find((n) => n.id === "bounty-board");
  assert(board, "bounty board in xinyue");
  const outlaw = MAPS.road.npcs.find((n) => n.id === "bounty-outlaw");
  assert(outlaw && outlaw.requireFlag === "bountyAccepted", "outlaw requires accept");
  assert(outlaw.hideFlag === "bountyTargetDown", "outlaw hides after down");
  assert(JOURNAL["bounty-start"], "bounty journal");
  assert(JOURNAL["ch5-start"], "ch5 journal");
  console.log("ok", "bounty board + journal");
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
  });
  assert(fourRoadsUnlocked(), "patched four unlock");
  console.log("ok", "patch four roads");
}


{
  const hint = fourRoadsLockHint(emptyProgress());
  assert(hint.includes("未解鎖"), "grey lock hint prefix");
  assert(hint.includes("關羽"), "grey hint lists 關羽");
  assert(fourRoadsUnlocked(emptyProgress()) === false, "empty not unlocked");
  console.log("ok", "four-roads grey hint");
}

console.log("n9 tests passed");

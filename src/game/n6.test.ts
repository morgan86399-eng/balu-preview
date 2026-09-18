import {
  CHRONICLES,
  CONFLUENCE_ID,
  newConfluenceSave,
  nightTalkLines,
} from "./chronicles.ts";
import { ENEMIES } from "./data.ts";
import { createBattle } from "./combat.ts";
import {
  MERGE_MINIBOSS_COORDS,
  isMergeMinibossTile,
  MAPS,
  tileAt,
} from "./maps.ts";
import {
  confluenceLockHint,
  confluenceUnlocked,
  emptyProgress,
  guanyuStatus,
  lineStatus,
  zhaoyunStatus,
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
  assert(lineStatus(false, false) === "未開", "未開");
  assert(lineStatus(true, false) === "進行中", "進行中");
  assert(lineStatus(true, true) === "初章既竟", "初章既竟");
  const p = emptyProgress();
  assert(guanyuStatus(p) === "未開", "gy idle");
  assert(zhaoyunStatus(p) === "未開", "zy idle");
  assert(!confluenceUnlocked(p), "locked");
  assert(confluenceLockHint(p).includes("關羽"), "hint guanyu");
  assert(confluenceLockHint({ ...p, ch1Clear: true }).includes("趙雲"), "hint zhaoyun");
  assert(confluenceUnlocked({ ...p, ch1Clear: true, ch2Clear: true }), "unlocked both");
  console.log("ok", "progress statuses");
}

{
  const def = CHRONICLES.confluence;
  assert(def.id === CONFLUENCE_ID, "confluence id");
  assert(def.clearTitle === "八路匯合・序章既竟", "clear title");
  assert(def.startMap === "merge", "start merge");
  assert(def.partnerId === "zhaoyun", "partner zhaoyun");
  const s = newConfluenceSave();
  assert(s.chronicleId === "confluence", "save chronicle");
  assert(s.mapId === "merge", "save map");
  assert(s.party.includes("guanyu") && s.party.includes("zhaoyun"), "both party");
  assert(objectiveFor(s).includes("殘黨") || objectiveFor(s).includes("夜話"), "objective");
  console.log("ok", "confluence save");
}

{
  assert(MAPS.merge?.name === "合流官道", "merge map name");
  assert(MAPS.merge.encounter?.softOnly === true, "merge soft encounter");
  for (const c of MERGE_MINIBOSS_COORDS) {
    assert(tileAt(MAPS.merge, c.x, c.y) === "B", `B at (${c.x},${c.y})`);
    assert(isMergeMinibossTile(c.x, c.y), `zone (${c.x},${c.y})`);
  }
  const rem = MAPS.merge.npcs.find((n) => n.id === "merge-remnant");
  assert(rem && rem.hideFlag === "confluenceClear", "remnant npc");
  const fire = MAPS.merge.npcs.find((n) => n.id === "merge-campfire");
  assert(fire && fire.name === "營火", "campfire npc");
  console.log("ok", "merge map zone");
}

{
  assert(ENEMIES.remnant?.name === "黃巾渠帥殘黨", "remnant enemy");
  const b = createBattle(["guanyu", "zhaoyun"], ["yellow", "remnant"], "miniboss", 2, {
    weapon: "iron-spear",
  });
  assert(b.kind === "miniboss", "miniboss kind");
  assert(b.fighters.some((f) => f.defId === "remnant"), "remnant in battle");
  console.log("ok", "remnant battle");
}

{
  const lines = nightTalkLines();
  assert(lines.length >= 4, "≥4 night lines");
  const g = lines.filter((l) => l.speaker === "關羽").length;
  const z = lines.filter((l) => l.speaker === "趙雲").length;
  assert(g >= 2 && z >= 2, "each ≥2 lines");
  console.log("ok", "night talk lines");
}

console.log("n6 tests passed");

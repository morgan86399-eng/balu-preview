import {
  CHRONICLES,
  ZHUGE_CHRONICLE_ID,
  newZhugeSave,
} from "./chronicles.ts";
import { ENEMIES } from "./data.ts";
import { createBattle } from "./combat.ts";
import {
  MAPS,
  NFIELD_MINIBOSS_COORDS,
  isNfieldMinibossTile,
  nfieldSoftEncountersSuppressed,
  tileAt,
} from "./maps.ts";
import {
  clearedTravelerCount,
  emptyProgress,
  maxPartySize,
  partyOfFourUnlocked,
  zhugeStatus,
} from "./progress.ts";
import {
  MASTERY_THRESHOLDS,
  emptyMastery,
  masteryHint,
  masteryStars,
  masteryStarsText,
  recordPathSuccess,
} from "./pathMastery.ts";
import { defaultSettings, loadSettings, patchSettings } from "./settings.ts";
import { setPartyMembers } from "./save.ts";
import { objectiveFor } from "./view.ts";
import { previewPathAction, performPathAction } from "./pathAction.ts";

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

  let m = emptyMastery();
  assert(masteryStars(m, "inquire") === 0, "0 stars");
  for (let i = 0; i < MASTERY_THRESHOLDS[0]; i++) m = recordPathSuccess(m, "inquire");
  assert(masteryStars(m, "inquire") === 1, "1 star");
  assert(masteryStarsText(1) === "★", "star glyph");
  assert(masteryHint(m, "inquire")?.includes("較易成功"), "hint");
  for (let i = m.inquire!; i < MASTERY_THRESHOLDS[2]; i++) m = recordPathSuccess(m, "inquire");
  assert(masteryStars(m, "inquire") === 3, "3 stars");
  assert(masteryStarsText(3) === "★★★", "3 glyphs");

  const npc = MAPS.wolong.npcs[0]!;
  const preview = previewPathAction("zhuge", npc, "inquire", {}, 90, masteryHint(m, "inquire"), 3);
  assert(preview.masteryStars === 3, "preview stars");
  assert(preview.condition.includes("較易成功"), "preview cond");
  console.log("ok", "path mastery");
}

{
  const mem = new Map<string, string>();
  const g = globalThis as unknown as { localStorage?: Storage };
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
  const d = defaultSettings();
  assert(d.music && d.sfx, "defaults on");
  patchSettings({ music: false, sfx: false });
  const s = loadSettings();
  assert(!s.music && !s.sfx, "patched mute");
  console.log("ok", "settings");
}

{
  const p = emptyProgress();
  assert(zhugeStatus(p) === "未開", "zg idle");
  assert(zhugeStatus({ ...p, ch4Started: true }) === "進行中", "zg active");
  assert(zhugeStatus({ ...p, ch4Started: true, ch4Clear: true }) === "初章既竟", "zg done");
  assert(clearedTravelerCount(p) === 0, "0 cleared");
  assert(maxPartySize(p) === 3, "max 3");
  assert(!partyOfFourUnlocked(p), "no party4");
  const three = { ...p, ch1Clear: true, ch2Clear: true, ch3Clear: true };
  assert(clearedTravelerCount(three) === 3, "3 cleared");
  assert(maxPartySize(three) === 4, "max 4");
  assert(partyOfFourUnlocked(three), "party4 ok");
  console.log("ok", "progress + party4");
}

{
  const def = CHRONICLES.zhuge4;
  assert(def.id === ZHUGE_CHRONICLE_ID, "zg id");
  assert(def.clearTitle === "諸葛亮列傳・初章既竟", "clear title");
  assert(def.startMap === "wolong", "start wolong");
  const s = newZhugeSave();
  assert(s.heroId === "zhuge", "hero");
  assert(s.party.includes("zhouyu"), "partner");
  assert(s.flags.ch4Inquired === true, "ch4Inquired seeded");
  // With inquired seeded, objective points to 郊野 / 出岡.
  assert(objectiveFor(s).includes("郊野") || objectiveFor(s).includes("岡"), "objective after inquire seed");
  // Soft encounters suppressed on nfield until ch4Clear (see App move()).
  assert(nfieldSoftEncountersSuppressed(s.flags) === true, "nfield soft suppressed pre-clear");
  assert(nfieldSoftEncountersSuppressed({ ch4Clear: true }) === false, "nfield soft after clear");
  console.log("ok", "zhuge save");
}

{
  assert(MAPS.wolong?.name === "臥龍岡", "wolong name");
  assert(MAPS.nfield?.name === "新野郊野", "nfield name");
  for (const c of NFIELD_MINIBOSS_COORDS) {
    assert(tileAt(MAPS.nfield, c.x, c.y) === "B", `B at (${c.x},${c.y})`);
    assert(isNfieldMinibossTile(c.x, c.y), `zone (${c.x},${c.y})`);
  }
  const chief = MAPS.nfield.npcs.find((n) => n.id === "zg-schemer");
  assert(chief && chief.hideFlag === "ch4Clear", "schemer npc");
  console.log("ok", "nfield map zone");
}

{
  assert(ENEMIES.schemer?.name === "黃巾偽軍師", "schemer enemy");
  const b = createBattle(["zhuge", "zhouyu"], ["yellow", "schemer"], "miniboss", 1, {
    weapon: "iron-spear",
  });
  assert(b.kind === "miniboss", "miniboss kind");
  assert(b.fighters.some((f) => f.defId === "schemer"), "schemer in battle");
  const four = createBattle(
    ["zhuge", "zhouyu", "guanyu", "zhaoyun"],
    ["yellow"],
    "skirmish",
    1,
  );
  assert(four.fighters.filter((f) => f.isPlayer).length === 4, "4 party fighters");
  assert(four.order.length >= 4, "order has 4+");
  console.log("ok", "schemer + party4 battle");
}

{
  const mem = new Map<string, string>();
  const g = globalThis as unknown as { localStorage?: Storage };
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
  // Seed meta for party4
  mem.set(
    "ba-lu-liezhuan-progress-v1",
    JSON.stringify({
      version: 1,
      ch1Clear: true,
      ch2Clear: true,
      ch3Clear: true,
      ch4Clear: false,
      ch1Started: true,
      ch2Started: true,
      ch3Started: true,
      ch4Started: false,
      confluenceClear: false,
    }),
  );
  const s = newZhugeSave();
  const next = setPartyMembers(s, ["zhuge", "zhouyu", "guanyu", "zhaoyun"]);
  assert(next.party.length === 4, "setParty 4");
  assert(next.party[0] === "zhuge", "lead");
  console.log("ok", "setPartyMembers");
}

{
  const npc = MAPS.wolong.npcs.find((n) => n.id === "zg-elder")!;
  const r = performPathAction("zhuge", npc, "inquire", {}, 90, ["zhuge", "zhouyu"]);
  assert(r.ok, "inquire ok");
  assert(r.flag === "ch4Inquired", "ch4Inquired flag");
  assert(r.clue || r.lines.length > 1, "consequence lines");
  console.log("ok", "zhuge inquire consequence");
}

console.log("n8 tests passed");

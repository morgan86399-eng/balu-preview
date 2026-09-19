import { readFileSync, statSync } from "node:fs";
import {
  emptyProgress,
  eightRoadsUnlocked,
  allNineUnlocked,
  allNineLockHint,
  diaochanStatus,
  patchProgress,
  writeProgress,
} from "./progress.ts";
import { ENEMIES, HEROES } from "./data.ts";

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
assert(!allNineUnlocked(), "all-nine locked at start");
assert(allNineLockHint().includes("貂蟬列傳"), "hint lists 貂蟬");
assert(allNineLockHint().includes("關羽列傳"), "hint lists 關羽");

patchProgress({
  ch1Clear: true,
  ch2Clear: true,
  ch3Clear: true,
  ch4Clear: true,
  ch5Clear: true,
  ch6Clear: true,
  ch7Clear: true,
  ch8Clear: true,
});
assert(eightRoadsUnlocked(), "eight unlocked without 貂蟬");
assert(!allNineUnlocked(), "all-nine still locked without 貂蟬");
assert(allNineLockHint() === "未解鎖・缺：貂蟬列傳", "only 貂蟬 missing");
assert(diaochanStatus() === "未開", "貂蟬 still idle");

patchProgress({ ch9Clear: true, ch9Started: true });
assert(allNineUnlocked(), "all-nine unlocks with 貂蟬");
assert(allNineLockHint() === "", "no all-nine hint");

const heroPortraits = new Set(HEROES.map((h) => h.portrait));
const expectedEnemy = {
  yellow: "./art/portrait-yellowturban.png",
  archer: "./art/portrait-yellowturban.png",
  bandit: "./art/portrait-bandit.png",
  officer: "./art/portrait-officer.png",
  boss: "./art/portrait-boss.png",
} as const;
for (const [id, path] of Object.entries(expectedEnemy)) {
  assert(ENEMIES[id]?.portrait === path, `${id} portrait`);
  assert(!heroPortraits.has(ENEMIES[id].portrait), `${id} not a hero face`);
}
for (const e of Object.values(ENEMIES)) {
  assert(!heroPortraits.has(e.portrait), `${e.id} must not reuse a hero portrait`);
  assert(
    e.portrait.includes("yellowturban") ||
      e.portrait.includes("bandit") ||
      e.portrait.includes("officer") ||
      e.portrait.includes("boss"),
    `${e.id} uses one of the four enemy portraits`,
  );
}

{
  const world = readFileSync("src/components/WorldView.tsx", "utf8");
  assert(world.includes('npc.id === "lookout"') && world.includes('portrait-officer.png'), "lookout officer");
  assert(world.includes("dc-moonchief") && world.includes("portrait-officer.png"), "moonchief officer");
  assert(world.includes("zf-gatechief") && world.includes("portrait-bandit.png"), "gatechief bandit");
  assert(!/zf-gatechief.*portrait-zhangfei/.test(world.replace(/\n/g, " ")), "gatechief not Zhang Fei");
  assert(world.includes("yz-lieutenant") && world.includes("portrait-bandit.png"), "lieutenant bandit");
  assert(world.includes("merge-remnant") && world.includes("portrait-boss.png"), "remnant boss");
  assert(world.includes("bounty-outlaw") && world.includes("portrait-bandit.png"), "outlaw bandit");
  assert(world.includes('return "./art/portrait-yellowturban.png"'), "default yellowturban");
}

{
  const title = readFileSync("src/components/TitleScreen.tsx", "utf8");
  for (const s of [
    "全員既竟面板測試",
    "全員總覽灰態測試",
    "全員初章既竟",
    "全員初章",
    "八路既竟面板測試",
    "八路初章既竟",
    "貂蟬短線測試",
  ]) {
    assert(title.includes(s), `title missing ${s}`);
  }
  assert(title.includes("月下勸開悍衛"), "diaochan blurb");
  assert((title.match(/全員初章既竟/g) ?? []).length >= 2, "title string in panel + comment");

  const app = readFileSync("src/App.tsx", "utf8");
  assert(app.includes("AllNinePanel"), "app wires AllNinePanel");
  assert(app.includes('setScreen("allNine")'), "app opens allNine");
  assert(!/setBattleBg\(\s*["']\.\/art\/bg-road\.png["']\s*\)/.test(app), "battles do not use bg-road");
  assert(app.includes('setBattleBg("./art/bg-battle.png")'), "battles use bg-battle");

  const maps = readFileSync("src/game/maps.ts", "utf8");
  assert(maps.includes('bg: "./art/bg-road.png"'), "exploration still uses bg-road");

  const pngMagic = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const files = [
    "public/art/portrait-yellowturban.png",
    "public/art/portrait-bandit.png",
    "public/art/portrait-officer.png",
    "public/art/portrait-boss.png",
    "public/art/bg-road.png",
  ] as const;
  const sizes = new Set<number>();
  for (const path of files) {
    const buf = readFileSync(path);
    assert(buf.subarray(0, 8).equals(pngMagic), `${path} png magic`);
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    const colorType = buf[25];
    const bytes = statSync(path).size;
    sizes.add(bytes);
    if (path.includes("portrait-")) {
      assert(w === 540 && h === 720, `${path} 540x720 not ${w}x${h}`);
      assert(colorType === 2, `${path} rgb color type ${colorType}`);
      assert(bytes !== 1711968 && bytes !== 1692163 && bytes !== 1558968 && bytes !== 1565056, `${path} not old labeled card`);
    } else {
      assert(w === 1280 && h === 720, `${path} 1280x720 not ${w}x${h}`);
    }
  }
  assert(sizes.size === files.length, "five art files have distinct sizes");
  const roadBytes = statSync("public/art/bg-road.png").size;
  const battleBytes = statSync("public/art/bg-battle.png").size;
  assert(roadBytes !== battleBytes, "bg-road !== bg-battle bytes");
  assert(roadBytes === 786432, `bg-road designer file ${roadBytes}`);

  console.log("ok n14 art + all-nine unlock", roadBytes, battleBytes);
}

console.log("n14 tests passed");

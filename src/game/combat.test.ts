import { createBattle, currentActor, isStrongIntent, pickEnemyCommand, resolveCommand } from "./combat.ts";
import { battleLoot } from "./combat.ts";

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error("FAIL", msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
}

let passed = 0;
function ok(msg: string) {
  passed += 1;
  console.log("ok", msg);
}

{
  const b = createBattle(["guanyu"], ["yellow"]);
  const actor = currentActor(b);
  assert(actor?.defId === "guanyu", "關羽速度應先出手");
  assert(actor?.bp === 1, "回合開始應得到 1 格蓄力");
  ok("開場蓄力");
}

{
  const b = createBattle(["guanyu"], ["yellow"]);
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  const before = enemy.shields;
  const { state, events } = resolveCommand(b, {
    kind: "attack",
    boost: 0,
    targetId: enemy.uid,
  });
  const after = state.fighters.find((f) => f.uid === enemy.uid)!;
  assert(events.some((e) => e.type === "hit"), "攻擊要有命中事件");
  assert(after.hp < enemy.hp, "敵人血量要下降");
  assert(after.shields === before - 1, "刀是黃巾弱點，盾應減 1");
  ok("弱點削盾");
}

{
  const b = createBattle(["zhaoyun"], ["bandit"]);
  const actor = currentActor(b)!;
  actor.bp = 3;
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  enemy.shields = 3;
  enemy.maxShields = 3;
  const { state, events } = resolveCommand(b, {
    kind: "skill",
    skillId: "seven",
    boost: 3,
    targetId: enemy.uid,
  });
  const after = state.fighters.find((f) => f.uid === enemy.uid)!;
  const hits = events.filter((e) => e.type === "hit").length;
  assert(hits === 7, `七進七出+3蓄力應 7 下，實際 ${hits}`);
  assert(after.broken || after.shields === 0, "多段弱點應破盾");
  assert(events.some((e) => e.type === "break"), "要有破盾事件");
  ok("蓄力多段破盾");
}

{
  const b = createBattle(["diaochan"], ["yellow"]);
  const actor = currentActor(b)!;
  actor.hp = 20;
  const { state, events } = resolveCommand(b, { kind: "skill", skillId: "dance", boost: 0 });
  const after = state.fighters.find((f) => f.uid === actor.uid)!;
  assert(after.hp > 20, "鼓舞要回血");
  assert(events.some((e) => e.type === "heal"), "要有治療事件");
  ok("鼓舞回血");
}

{
  const b = createBattle(["guanyu"], ["yellow", "yellow"]);
  for (const f of b.fighters) {
    if (!f.isPlayer) f.hp = 1;
  }
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  const { state } = resolveCommand(b, {
    kind: "skill",
    skillId: "dragon-slash",
    boost: 0,
    targetId: enemy.uid,
  });
  const still = state.fighters.filter((f) => !f.isPlayer && f.hp > 0);
  assert(still.length <= 1, "單攻不該一次清掉兩個");
  ok("單攻不誤傷全體");
}

{
  const b = createBattle(["zhangfei"], ["yellow", "yellow"]);
  const { events } = resolveCommand(b, { kind: "skill", skillId: "roar", boost: 0 });
  const hits = events.filter((e) => e.type === "hit").length;
  assert(hits >= 2, "喝退應打到全體");
  ok("範圍技");
}

{
  const b = createBattle(["zhuge"], ["bandit"]);
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  const { state } = resolveCommand(b, {
    kind: "skill",
    skillId: "fire-plan",
    boost: 0,
    targetId: enemy.uid,
  });
  const after = state.fighters.find((f) => f.uid === enemy.uid)!;
  assert(after.burn > 0, "火計應點燃");
  ok("燃燒");
}

{
  const b = createBattle(["guanyu"], ["yellow"]);
  const actor = currentActor(b)!;
  actor.bp = 2;
  const { state } = resolveCommand(b, { kind: "defend", boost: 0 });
  const after = state.fighters.find((f) => f.uid === actor.uid)!;
  assert(after.bp >= 2, "防禦應保住並再得蓄力");
  ok("防禦蓄力");
}

{
  const loot = battleLoot(["yellow", "boss"]);
  assert(loot.gold === 12 + 80, "戰利品金錢");
  assert(loot.exp === 18 + 120, "戰利品閱歷");
  ok("戰利品");
}

{
  const b = createBattle(["caocao"], ["officer"]);
  const e = currentActor(b);
  if (e && !e.isPlayer) {
    const cmd = pickEnemyCommand(b);
    const { state } = resolveCommand(b, cmd);
    assert(state.fighters.some((f) => f.isPlayer), "敵方出手後玩家仍在");
  }
  ok("敵方指令可結算");
}


{
  const b = createBattle(["guanyu"], ["yellow"]);
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  assert(!enemy.revealed, "敵人開場弱點應未公開");
  const { state } = resolveCommand(b, {
    kind: "attack",
    boost: 0,
    targetId: enemy.uid,
  });
  const after = state.fighters.find((f) => f.uid === enemy.uid)!;
  assert(after.revealed, "打中弱點後應標記弱點");
  ok("弱點標記");
}


{
  const b = createBattle(["guanyu"], ["yellow"]);
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  enemy.shields = 0;
  enemy.broken = true;
  const { events } = resolveCommand(b, {
    kind: "attack",
    boost: 0,
    targetId: enemy.uid,
  });
  const hit = events.find((e) => e.type === "hit");
  assert(hit && hit.type === "hit" && hit.breakWindow, "崩解中命中應標記 breakWindow");
  assert(events.some((e) => e.type === "text" && e.text === "崩解中！"), "應提示崩解中");
  const dmgBroken = hit && hit.type === "hit" ? hit.damage : 0;
  const b2 = createBattle(["guanyu"], ["yellow"]);
  const e2 = b2.fighters.find((f) => !f.isPlayer)!;
  e2.broken = false;
  const { events: ev2 } = resolveCommand(b2, { kind: "attack", boost: 0, targetId: e2.uid });
  const hit2 = ev2.find((e) => e.type === "hit");
  const dmgNormal = hit2 && hit2.type === "hit" ? hit2.damage : 0;
  assert(dmgBroken > dmgNormal, `崩解傷害應更高 ${dmgBroken} vs ${dmgNormal}`);
  ok("崩解窗口倍率");
}

{
  const b = createBattle(["guanyu", "zhangfei"], ["bandit"]);
  const players = b.fighters.filter((f) => f.isPlayer);
  assert(players.length === 2, "雙人隊伍應有兩名我方");
  assert(players.every((p) => b.order.includes(p.uid)), "兩人都在出手順序");
  ok("雙人出手順序");
}

{
  const b = createBattle(["guanyu"], ["bandit"]);
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  enemy.bp = 0;
  enemy.sp = 6;
  assert(isStrongIntent(b, enemy), "山賊有氣力時蓄勢應亮");
  enemy.sp = 0;
  enemy.bp = 0;
  assert(!isStrongIntent(b, enemy), "無蓄力無強技不應亮蓄勢");
  enemy.bp = 2;
  assert(isStrongIntent(b, enemy), "蓄力≥2應亮蓄勢");
  ok("敵方蓄勢預告");
}

{
  const b = createBattle(["guanyu"], ["bandit"]);
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  enemy.shields = 1;
  enemy.maxShields = 1;
  enemy.hp = 400;
  enemy.maxHp = 400;
  enemy.weaknesses = ["sword"];
  const actor = currentActor(b)!;
  actor.bp = 3;
  const { events } = resolveCommand(b, {
    kind: "attack",
    boost: 2,
    targetId: enemy.uid,
  });
  assert(events.some((e) => e.type === "break"), "蓄力應破盾");
  const hits = events.filter((e) => e.type === "hit");
  assert(hits.length === 3, `蓄力2應3段，實際 ${hits.length}`);
  const afterBreak = hits.filter((e) => e.type === "hit" && e.breakWindow);
  assert(afterBreak.length >= 1, "破盾後段應進入崩解窗口");
  ok("蓄力打進崩解窗口");
}

{
  const b = createBattle(["guanyu", "zhangfei", "zhaoyun"], ["bandit"]);
  const players = b.fighters.filter((f) => f.isPlayer);
  assert(players.length === 3, "三人隊伍應有三名我方");
  assert(players.every((p) => b.order.includes(p.uid)), "三人都在出手順序");
  ok("三人出手順序");
}

{
  const b = createBattle(["guanyu"], ["yellow"]);
  const actor = currentActor(b)!;
  actor.sp = 20;
  const ally = actor;
  const before = ally.hp;
  // damage first
  ally.hp = Math.max(10, before - 40);
  const { state, events } = resolveCommand(b, {
    kind: "support",
    skillId: "sup-cover",
    boost: 0,
    targetId: ally.uid,
  });
  const after = state.fighters.find((f) => f.uid === ally.uid)!;
  assert(after.defending, "義護應進入援護守勢");
  assert(events.some((e) => e.type === "text" && e.text.includes("支援")), "支援應有提示");
  ok("支援援護");
}

{
  const b = createBattle(["zhuge"], ["bandit"]);
  const actor = currentActor(b)!;
  actor.sp = 20;
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  assert(!enemy.revealed, "開場未看破");
  const { state } = resolveCommand(b, {
    kind: "support",
    skillId: "sup-reveal",
    boost: 0,
    targetId: enemy.uid,
  });
  const after = state.fighters.find((f) => f.uid === enemy.uid)!;
  assert(after.revealed, "支援看破應揭露弱點");
  ok("支援看破");
}

{
  const b = createBattle(["zhaoyun"], ["yellow"]);
  const actor = currentActor(b)!;
  actor.sp = 20;
  actor.hp = 30;
  const { state, events } = resolveCommand(b, {
    kind: "support",
    skillId: "sup-heal",
    boost: 0,
  });
  const after = state.fighters.find((f) => f.uid === actor.uid)!;
  assert(after.hp > 30, "支援小回血");
  assert(events.some((e) => e.type === "heal"), "支援治療事件");
  ok("支援回血");
}


{
  const b = createBattle(["guanyu"], ["boss"], "boss");
  assert(b.bossPhase === 1, "渠帥戰開場應為一階段");
  const boss = b.fighters.find((f) => f.defId === "boss")!;
  boss.shields = 1;
  boss.maxShields = 5;
  boss.weaknesses = ["sword"];
  boss.hp = 180;
  const atk0 = boss.atk;
  const { state, events } = resolveCommand(b, {
    kind: "attack",
    boost: 0,
    targetId: boss.uid,
  });
  const after = state.fighters.find((f) => f.defId === "boss")!;
  assert(events.some((e) => e.type === "break"), "首破應崩解");
  assert(events.some((e) => e.type === "phase2"), "首破應進二階段");
  assert(state.bossPhase === 2, "bossPhase 應為 2");
  assert(after.atk > atk0, "二階段攻擊應提升");
  ok("渠帥首破進二階段");
}

{
  // After phase-2 first break, when boss recovers from broken, shields refill to max.
  const b = createBattle(["guanyu"], ["boss"], "boss");
  b.bossPhase = 2;
  const boss = b.fighters.find((f) => f.defId === "boss")!;
  boss.maxShields = 5;
  boss.shields = 0;
  boss.broken = true;
  let cur = b;
  let sawFull = false;
  for (let i = 0; i < 10 && !cur.ended; i++) {
    const a = currentActor(cur);
    if (!a) break;
    if (a.isPlayer) {
      cur = resolveCommand(cur, { kind: "defend", boost: 0 }).state;
    } else {
      cur = resolveCommand(cur, pickEnemyCommand(cur)).state;
    }
    const b2 = cur.fighters.find((f) => f.defId === "boss")!;
    if (!b2.broken && b2.shields === b2.maxShields) {
      sawFull = true;
      break;
    }
  }
  assert(sawFull, "二階段崩解結束後應回滿盾");
  ok("二階段回盾滿值");
}

{
  const b = createBattle(["guanyu"], ["yellow"]);
  const actor = currentActor(b)!;
  assert(!actor.potentialUsed, "開場潛能可用");
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  enemy.broken = true;
  enemy.shields = 0;
  enemy.hp = 400;
  const { state, events } = resolveCommand(b, {
    kind: "potential",
    boost: 0,
    targetId: enemy.uid,
  });
  const after = state.fighters.find((f) => f.uid === actor.uid)!;
  assert(after.potentialUsed, "潛能用後應鎖定");
  assert(events.some((e) => e.type === "potential"), "應有潛能演出事件");
  const hits = events.filter((e) => e.type === "hit");
  assert(hits.length >= 4, `崩解中潛能應多段，實際 ${hits.length}`);
  assert(
    hits.every((e) => e.type === "hit" && e.huge),
    "潛能傷害應標 huge",
  );
  ok("潛能一次與崩解強化");
}

{
  const b = createBattle(["guanyu"], ["yellow"]);
  const enemy = b.fighters.find((f) => !f.isPlayer)!;
  enemy.broken = false;
  enemy.hp = 400;
  const { events } = resolveCommand(b, {
    kind: "potential",
    boost: 0,
    targetId: enemy.uid,
  });
  const hits = events.filter((e) => e.type === "hit");
  assert(hits.length === 2, `未崩解潛能應 2 段，實際 ${hits.length}`);
  ok("潛能未崩解較弱");
}

{
  const b = createBattle(["guanyu"], ["boss"], "boss");
  b.bossPhase = 2;
  const boss = b.fighters.find((f) => f.defId === "boss")!;
  boss.bp = 1;
  boss.sp = 20;
  assert(isStrongIntent(b, boss), "二階段渠帥蓄勢應更頻");
  ok("二階段蓄勢");
}

{
  const b = createBattle(["guanyu"], ["boss"], "boss");
  assert(b.bossPhase === 1, "開場一階段");
  const boss = b.fighters.find((f) => f.defId === "boss")!;
  assert(boss.maxShields === 3, `一階段盾應為 3，實際 ${boss.maxShields}`);
  assert(boss.atk === 14, `一階段攻應為 14，實際 ${boss.atk}`);
  boss.bp = 3;
  boss.sp = 0;
  const bi = b.order.indexOf(boss.uid);
  const b2 = { ...b, turn: bi };
  const cmd2 = pickEnemyCommand(b2);
  assert((cmd2.boost ?? 0) <= 1, `一階段渠帥 boost 最多 1，實際 ${cmd2.boost}`);
  ok("一階段難度調降");
}


console.log(`\n${passed} passed`);
if (process.exitCode) process.exit(1);

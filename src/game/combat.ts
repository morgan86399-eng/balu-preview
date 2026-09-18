import { ENEMIES, heroById } from "./data.ts";
import { equipBonuses, itemById, statScale } from "./items.ts";
import type {
  BattleEvent,
  BattleState,
  EquipSlots,
  Fighter,
  Skill,
  Weapon,
} from "./types.ts";

function clone<T>(v: T): T {
  return structuredClone(v);
}

function uid(prefix: string, i: number): string {
  return `${prefix}-${i}`;
}

export function fighterFromHero(
  heroId: string,
  index: number,
  level = 1,
  equip?: EquipSlots,
): Fighter {
  const h = heroById(heroId);
  const maxHp = statScale(h.maxHp, level);
  const maxSp = statScale(h.maxSp, level);
  const bonus = equipBonuses(equip);
  return {
    uid: uid("p", index),
    defId: h.id,
    name: h.name,
    portrait: h.portrait,
    color: h.color,
    hp: maxHp,
    maxHp,
    sp: maxSp,
    maxSp,
    bp: 0,
    atk: statScale(h.atk, level) + bonus.atk,
    def: statScale(h.def, level) + bonus.def,
    spd: h.spd + Math.floor((level - 1) / 2),
    shields: 0,
    maxShields: 0,
    broken: false,
    defending: false,
    revealed: true,
    atkDebuff: 0,
    burn: 0,
    weaknesses: h.weaknesses,
    skills: [...h.skills, h.supportSkill],
    isPlayer: true,
    potentialUsed: false,
  };
}

export function fighterFromEnemy(enemyId: string, index: number): Fighter {
  const e = ENEMIES[enemyId];
  if (!e) throw new Error(`unknown enemy ${enemyId}`);
  return {
    uid: uid("e", index),
    defId: e.id,
    name: e.name,
    portrait: e.portrait,
    color: "#6b4a3a",
    hp: e.maxHp,
    maxHp: e.maxHp,
    sp: e.maxSp,
    maxSp: e.maxSp,
    bp: 0,
    atk: e.atk,
    def: e.def,
    spd: e.spd,
    shields: e.shields,
    maxShields: e.shields,
    broken: false,
    defending: false,
    revealed: false,
    atkDebuff: 0,
    burn: 0,
    weaknesses: e.weaknesses,
    skills: e.skills,
    isPlayer: false,
    potentialUsed: false,
  };
}

export function createBattle(
  party: string[],
  enemyIds: string[],
  kind: BattleState["kind"] = "skirmish",
  level = 1,
  equip?: EquipSlots,
): BattleState {
  const fighters = [
    ...party.map((id, i) => fighterFromHero(id, i, level, equip)),
    ...enemyIds.map((id, i) => fighterFromEnemy(id, i)),
  ];
  const order = [...fighters]
    .sort((a, b) => b.spd - a.spd || a.uid.localeCompare(b.uid))
    .map((f) => f.uid);
  return beginTurn({
    fighters,
    order,
    turn: 0,
    ended: null,
    kind,
    bossPhase: kind === "boss" ? 1 : undefined,
  });
}

export function applyVitals(
  battle: BattleState,
  vitals: Record<string, { hp: number; sp: number }>,
): BattleState {
  const next = clone(battle);
  for (const f of next.fighters) {
    if (!f.isPlayer) continue;
    const v = vitals[f.defId];
    if (!v) continue;
    f.hp = Math.max(1, Math.min(f.maxHp, v.hp));
    f.sp = Math.max(0, Math.min(f.maxSp, v.sp));
  }
  return next;
}

export function currentActor(b: BattleState): Fighter | undefined {
  const id = b.order[b.turn % b.order.length];
  return b.fighters.find((f) => f.uid === id);
}

function alive(f: Fighter): boolean {
  return f.hp > 0;
}

export function allies(b: BattleState, actor: Fighter): Fighter[] {
  return b.fighters.filter((f) => f.isPlayer === actor.isPlayer && alive(f));
}

export function foes(b: BattleState, actor: Fighter): Fighter[] {
  return b.fighters.filter((f) => f.isPlayer !== actor.isPlayer && alive(f));
}

function tickBurn(actor: Fighter, events: BattleEvent[]): void {
  if (actor.burn <= 0 || !alive(actor)) return;
  const amount = 6 + actor.burn * 2;
  actor.hp = Math.max(0, actor.hp - amount);
  actor.burn -= 1;
  events.push({ type: "burn", targetId: actor.uid, amount });
  events.push({ type: "text", text: `${actor.name} 被餘火灼傷 ${amount}。` });
  if (actor.hp <= 0) {
    events.push({ type: "dead", targetId: actor.uid });
  }
}

function beginTurn(b: BattleState): BattleState {
  const next = clone(b);
  const events: BattleEvent[] = [];
  for (let guard = 0; guard < next.order.length + 2; guard++) {
    const actor = currentActor(next);
    if (!actor || !alive(actor)) {
      next.turn += 1;
      continue;
    }
    tickBurn(actor, events);
    if (!alive(actor)) {
      next.turn += 1;
      continue;
    }
    if (actor.broken) {
      actor.broken = false;
      if (next.bossPhase === 2 && actor.defId === "boss") {
        actor.shields = Math.max(1, actor.maxShields);
      } else {
        actor.shields = Math.max(1, Math.ceil(actor.maxShields / 2));
      }
      next.turn += 1;
      continue;
    }
    actor.defending = false;
    actor.bp = Math.min(3, actor.bp + 1);
    if (actor.atkDebuff > 0) actor.atkDebuff -= 1;
    return next;
  }
  return next;
}

function damageOf(actor: Fighter, target: Fighter, skill: Skill, boost: number): number {
  const atk = Math.max(1, actor.atk - actor.atkDebuff * 4);
  const def = target.defending ? target.def * 2 : target.def;
  const breakBonus = target.broken ? 1.75 : 1;
  const boostBonus = 1 + boost * 0.22;
  const raw = (atk * skill.power - def * 0.35) * breakBonus * boostBonus;
  return Math.max(1, Math.round(raw));
}

function applyHit(
  battle: BattleState,
  actor: Fighter,
  target: Fighter,
  skill: Skill,
  boost: number,
  events: BattleEvent[],
  opts?: { announceBreakWindow?: boolean; huge?: boolean },
): void {
  const wasBroken = target.broken;
  const weak = target.weaknesses.includes(skill.weapon);
  const dmg = damageOf(actor, target, skill, boost);
  target.hp = Math.max(0, target.hp - dmg);
  if (weak && !target.isPlayer) target.revealed = true;
  events.push({
    type: "hit",
    targetId: target.uid,
    damage: dmg,
    weak,
    breakWindow: wasBroken,
    huge: opts?.huge,
  });
  if (wasBroken && opts?.announceBreakWindow) {
    events.push({ type: "text", text: "崩解中！" });
  }

  if (!target.isPlayer && target.maxShields > 0 && !target.broken && weak) {
    target.shields = Math.max(0, target.shields - 1);
    events.push({ type: "shield", targetId: target.uid, left: target.shields });
    if (target.shields === 0) {
      target.broken = true;
      events.push({ type: "break", targetId: target.uid });
      events.push({ type: "text", text: `${target.name} 的防禦崩解！` });
      // Primary: first shield break on chapter boss.
      enterBossPhase2(battle, target, events, "破盾");
    }
  }

  // Backup: HP ≤ half still in phase 1 (so non-weak burst can't skip the FX).
  if (
    target.defId === "boss" &&
    battle.kind === "boss" &&
    (battle.bossPhase ?? 1) === 1 &&
    target.hp > 0 &&
    target.hp <= target.maxHp * 0.5
  ) {
    enterBossPhase2(battle, target, events, "半血");
  }

  if (target.hp <= 0) {
    // Last-chance: dying in phase 1 still plays 狂怒 before death/win.
    if (target.defId === "boss" && battle.kind === "boss" && (battle.bossPhase ?? 1) === 1) {
      enterBossPhase2(battle, target, events, "絕命");
    }
    events.push({ type: "dead", targetId: target.uid });
    events.push({ type: "text", text: `${target.name} 倒下了。` });
  }
}

/** Emit phase-2 once. Safe to call from break / half-HP / lethal. */
function enterBossPhase2(
  battle: BattleState,
  target: Fighter,
  events: BattleEvent[],
  reason: string,
): void {
  if (!(target.defId === "boss" && battle.kind === "boss" && (battle.bossPhase ?? 1) === 1)) return;
  battle.bossPhase = 2;
  target.atk += 5;
  target.bp = Math.min(3, target.bp + 1);
  // Refill a bit of shield so phase 2 is visible if they somehow one-shot past break.
  if (target.hp > 0 && target.maxShields > 0) {
    target.shields = Math.max(target.shields, Math.ceil(target.maxShields / 2));
    target.broken = false;
  }
  events.push({ type: "phase2", targetId: target.uid });
  events.push({ type: "text", text: "渠帥狂怒！" });
  void reason;
}

/** Display name for once-per-battle 潛能. */
export function potentialName(actor: Fighter): string {
  const map: Record<string, string> = {
    guanyu: "潛能・青龍一閃",
    zhaoyun: "潛能・龍膽七進",
    zhangfei: "潛能・虓虎怒喝",
    zhuge: "潛能・臥龍奇計",
    caocao: "潛能・奸雄令",
    zhouyu: "潛能・火攻一曲",
    sunshangxiang: "潛能・錦衣亂箭",
    diaochan: "潛能・閉月傾城",
  };
  return map[actor.defId] ?? `潛能・${actor.name}`;
}

export function buildPotentialSkill(actor: Fighter, inBreak: boolean): Skill {
  const weapon = actor.skills.find((s) => !s.support)?.weapon ?? "sword";
  return {
    id: "potential",
    name: potentialName(actor),
    sp: 0,
    weapon,
    hits: inBreak ? 4 : 2,
    power: inBreak ? 1.9 : 1.05,
    potential: true,
  };
}

function applyEffect(
  battle: BattleState,
  actor: Fighter,
  target: Fighter,
  skill: Skill,
  events: BattleEvent[],
): void {
  if (skill.effect === "heal") {
    const amount = skill.support ? 18 + Math.floor(actor.atk * 0.5) : 28 + actor.atk;
    const receivers = skill.aoe ? allies(battle, actor) : [target.hp > 0 ? target : actor];
    for (const r of receivers) {
      const before = r.hp;
      r.hp = Math.min(r.maxHp, r.hp + amount);
      events.push({ type: "heal", targetId: r.uid, amount: r.hp - before });
    }
    return;
  }
  if (skill.effect === "bpAlly") {
    for (const r of allies(battle, actor)) {
      r.bp = Math.min(3, r.bp + 1);
      events.push({ type: "bp", targetId: r.uid, bp: r.bp });
    }
    events.push({ type: "text", text: `${actor.name} 為同伴添了一格蓄力。` });
    return;
  }
  if (skill.effect === "reveal") {
    target.revealed = true;
    events.push({ type: "text", text: `${target.name} 的弱點被看破了。` });
    return;
  }
  if (skill.effect === "debuffAtk") {
    target.atkDebuff = Math.max(target.atkDebuff, 2);
    events.push({ type: "text", text: `${target.name} 的攻勢被擾亂了。` });
  }
  if (skill.effect === "burn") {
    target.burn = Math.max(target.burn, 2);
    events.push({ type: "text", text: `${target.name} 衣甲帶上了火。` });
  }
  if (skill.effect === "cover") {
    const receivers = skill.aoe ? allies(battle, actor) : [target.hp > 0 ? target : actor];
    for (const r of receivers) {
      if (!alive(r)) continue;
      r.defending = true;
      events.push({ type: "text", text: `${r.name} 進入援護守勢。` });
    }
  }
}

function finish(battle: BattleState, events: BattleEvent[]): BattleState {
  const playersAlive = battle.fighters.some((f) => f.isPlayer && alive(f));
  const enemiesAlive = battle.fighters.some((f) => !f.isPlayer && alive(f));
  if (!enemiesAlive) {
    battle.ended = "win";
    events.push({ type: "win" });
    return battle;
  }
  if (!playersAlive) {
    battle.ended = "lose";
    events.push({ type: "lose" });
    return battle;
  }
  battle.turn += 1;
  const after = beginTurn(battle);
  const now = currentActor(after);
  if (now) events.push({ type: "turn", actorId: now.uid });
  return after;
}

export interface Command {
  kind: "attack" | "skill" | "defend" | "item" | "support" | "potential";
  skillId?: string;
  itemId?: string;
  boost: number;
  targetId?: string;
}

export function resolveCommand(
  prev: BattleState,
  command: Command,
): { state: BattleState; events: BattleEvent[] } {
  const battle = clone(prev);
  const events: BattleEvent[] = [];
  if (battle.ended) return { state: battle, events };

  const actor = currentActor(battle);
  if (!actor || !alive(actor)) {
    return { state: finish(battle, events), events };
  }

  const boost = Math.max(0, Math.min(actor.bp, command.boost | 0));
  actor.bp -= boost;

  if (command.kind === "defend") {
    actor.defending = true;
    actor.bp = Math.min(3, actor.bp + 1);
    events.push({ type: "text", text: `${actor.name} 進入守勢，並保住蓄力。` });
    events.push({ type: "bp", targetId: actor.uid, bp: actor.bp });
    return { state: finish(battle, events), events };
  }

  if (command.kind === "item") {
    const item = itemById(command.itemId ?? "herb");
    if (!item) {
      actor.bp = Math.min(3, actor.bp + boost);
      events.push({ type: "text", text: "沒有這種物件。" });
      return { state: battle, events };
    }
    if (item.kind === "heal") {
      const target =
        battle.fighters.find((f) => f.uid === command.targetId && f.isPlayer) ?? actor;
      const before = target.hp;
      target.hp = Math.min(target.maxHp, target.hp + item.power);
      events.push({ type: "heal", targetId: target.uid, amount: target.hp - before });
      events.push({ type: "text", text: `${actor.name} 使用${item.name}。` });
    } else if (item.kind === "healAll") {
      for (const r of allies(battle, actor)) {
        const before = r.hp;
        r.hp = Math.min(r.maxHp, r.hp + item.power);
        events.push({ type: "heal", targetId: r.uid, amount: r.hp - before });
      }
      events.push({ type: "text", text: `${actor.name} 把${item.name}分給全隊。` });
    } else if (item.kind === "oil") {
      const skill: Skill = {
        id: "oil",
        name: "火油",
        sp: 0,
        weapon: "fire",
        hits: 1,
        power: item.power / 18,
        effect: "burn",
      };
      const possible = foes(battle, actor);
      const chosen = possible.find((f) => f.uid === command.targetId) ?? possible[0];
      if (chosen) {
        applyEffect(battle, actor, chosen, skill, events);
        applyHit(battle, actor, chosen, skill, boost, events);
      }
      events.push({ type: "text", text: `${actor.name} 潑出火油。` });
    }
    return { state: finish(battle, events), events };
  }

  if (command.kind === "support") {
    const skill =
      actor.skills.find((s) => s.id === command.skillId && s.support) ??
      actor.skills.find((s) => s.support);
    if (!skill) {
      events.push({ type: "text", text: `${actor.name} 沒有可用的支援。` });
      actor.bp = Math.min(3, actor.bp + boost);
      return { state: battle, events };
    }
    if (skill.sp > 0 && actor.sp < skill.sp) {
      events.push({ type: "text", text: `${actor.name} 氣力不足。` });
      actor.bp = Math.min(3, actor.bp + boost);
      return { state: battle, events };
    }
    if (skill.sp > 0) actor.sp -= skill.sp;
    events.push({ type: "text", text: `${actor.name} 使出支援・${skill.name}！` });
    if (skill.effect === "heal" || skill.effect === "bpAlly" || skill.effect === "cover") {
      const allyTarget =
        battle.fighters.find((f) => f.uid === command.targetId && f.isPlayer && alive(f)) ?? actor;
      applyEffect(battle, actor, allyTarget, skill, events);
      return { state: finish(battle, events), events };
    }
    if (skill.effect === "reveal") {
      const possible = foes(battle, actor);
      const chosen = possible.find((f) => f.uid === command.targetId) ?? possible[0];
      if (chosen) applyEffect(battle, actor, chosen, skill, events);
      else events.push({ type: "text", text: "沒有可看破的目標。" });
      return { state: finish(battle, events), events };
    }
    return { state: finish(battle, events), events };
  }

  if (command.kind === "potential") {
    if (actor.potentialUsed) {
      events.push({ type: "text", text: `${actor.name} 的潛能已用過。` });
      actor.bp = Math.min(3, actor.bp + boost);
      return { state: battle, events };
    }
    const livingFoes = foes(battle, actor);
    const inBreak = livingFoes.some((f) => f.broken);
    const skill = buildPotentialSkill(actor, inBreak);
    actor.potentialUsed = true;
    events.push({ type: "potential", name: skill.name, actorId: actor.uid });
    events.push({
      type: "text",
      text: inBreak
        ? `${actor.name} 於崩解窗口使出${skill.name}！`
        : `${actor.name} 使出${skill.name}！`,
    });
    const chosen =
      livingFoes.find((f) => f.uid === command.targetId) ?? livingFoes[0];
    if (!chosen) {
      events.push({ type: "text", text: "沒有可攻擊的目標。" });
      return { state: finish(battle, events), events };
    }
    const hits = skill.hits + boost;
    let announcedBreakWindow = false;
    for (let i = 0; i < hits; i++) {
      if (!alive(chosen)) break;
      const announce = Boolean(chosen.broken) && !announcedBreakWindow;
      if (announce) announcedBreakWindow = true;
      applyHit(battle, actor, chosen, skill, boost, events, {
        announceBreakWindow: announce,
        huge: true,
      });
    }
    return { state: finish(battle, events), events };
  }

  const skill: Skill =
    command.kind === "skill"
      ? actor.skills.find((s) => s.id === command.skillId) ?? {
          id: "basic",
          name: "普通攻擊",
          sp: 0,
          weapon: actor.skills[0]?.weapon ?? "sword",
          hits: 1,
          power: 1,
        }
      : {
          id: "basic",
          name: "普通攻擊",
          sp: 0,
          weapon: actor.skills[0]?.weapon ?? "sword",
          hits: 1,
          power: 1,
        };

  if (skill.sp > 0) {
    if (actor.sp < skill.sp) {
      events.push({ type: "text", text: `${actor.name} 氣力不足。` });
      actor.bp = Math.min(3, actor.bp + boost);
      return { state: battle, events };
    }
    actor.sp -= skill.sp;
  }

  if (skill.effect === "heal" || skill.effect === "bpAlly" || skill.effect === "cover") {
    applyEffect(battle, actor, actor, skill, events);
    events.push({ type: "text", text: `${actor.name} 使出${skill.name}！` });
    return { state: finish(battle, events), events };
  }

  const possible = foes(battle, actor);
  let targets: Fighter[] = [];
  if (skill.aoe) targets = possible;
  else {
    const chosen = possible.find((f) => f.uid === command.targetId) ?? possible[0];
    if (chosen) targets = [chosen];
  }

  if (targets.length === 0) {
    events.push({ type: "text", text: "沒有可攻擊的目標。" });
    return { state: finish(battle, events), events };
  }

  const hits = skill.hits + boost;
  events.push({
    type: "text",
    text:
      boost > 0
        ? `${actor.name} 蓄力 ${boost}，使出${skill.name}！`
        : `${actor.name} 使出${skill.name}！`,
  });

  for (const t of targets) applyEffect(battle, actor, t, skill, events);
  let announcedBreakWindow = false;
  const huge = Boolean(skill.potential);
  for (let i = 0; i < hits; i++) {
    for (const t of targets) {
      if (!alive(t)) continue;
      const announce = Boolean(t.broken) && !announcedBreakWindow;
      if (announce) announcedBreakWindow = true;
      applyHit(battle, actor, t, skill, boost, events, {
        announceBreakWindow: announce,
        huge,
      });
    }
  }

  return { state: finish(battle, events), events };
}

export function pickEnemyCommand(b: BattleState): Command {
  const actor = currentActor(b);
  if (!actor) return { kind: "defend", boost: 0 };
  return previewEnemyCommand(b, actor);
}


/** True when this fighter's next action would be a strong skill / boosted blow. */
export function isStrongIntent(b: BattleState, actor: Fighter): boolean {
  if (!alive(actor) || actor.isPlayer || actor.broken) return false;
  // Phase 2 boss telegraphs more often (狂怒).
  if (b.bossPhase === 2 && actor.defId === "boss") {
    if (actor.bp >= 1) return true;
    const paid = actor.skills.find((s) => s.sp > 0 && actor.sp >= s.sp);
    return Boolean(paid);
  }
  // Phase 1 boss: fewer lethal windup marks (only when bp is full).
  if ((b.bossPhase ?? 1) === 1 && actor.defId === "boss") {
    return actor.bp >= 3;
  }
  if (actor.hp < actor.maxHp * 0.28 && actor.bp > 0) return false;
  const skill =
    actor.skills.find((s) => s.sp > 0 && actor.sp >= s.sp) ?? actor.skills[0];
  const boost = actor.bp >= 2 ? Math.min(actor.bp, 2) : 0;
  if (!skill) return boost >= 2;
  const strongSkill =
    skill.power >= 1.15 || skill.hits >= 2 || Boolean(skill.aoe);
  const usingPaid = Boolean(skill.sp > 0 && actor.sp >= skill.sp && strongSkill);
  return usingPaid || boost >= 2;
}

export function previewEnemyCommand(b: BattleState, actor: Fighter): Command {
  const living = foes(b, actor);
  const target = living.slice().sort((a, c) => a.hp - c.hp)[0];
  const skill = actor.skills.find((s) => s.sp > 0 && actor.sp >= s.sp) ?? actor.skills[0];
  const phase2 = b.bossPhase === 2 && actor.defId === "boss";
  // Phase 1: at most +1 boost (slower multi-hit / less lethal windups).
  // Phase 2: can boost harder once shield break is seen.
  const boost = phase2
    ? Math.min(actor.bp, actor.bp >= 1 ? Math.max(1, Math.min(actor.bp, 2)) : 0)
    : actor.defId === "boss"
      ? actor.bp >= 2
        ? 1
        : 0
      : actor.bp >= 2
        ? Math.min(actor.bp, 2)
        : 0;
  if (!phase2 && actor.hp < actor.maxHp * 0.28 && actor.bp > 0) {
    return { kind: "defend", boost: 0 };
  }
  if (skill && skill.sp > 0 && actor.sp >= skill.sp) {
    return { kind: "skill", skillId: skill.id, boost, targetId: target?.uid };
  }
  return { kind: "attack", boost, targetId: target?.uid };
}

export function weaknessOf(f: Fighter, weapon: Weapon): boolean {
  return f.weaknesses.includes(weapon);
}

export function battleLoot(enemyIds: string[]): { gold: number; exp: number } {
  let gold = 0;
  let exp = 0;
  for (const id of enemyIds) {
    const e = ENEMIES[id];
    if (!e) continue;
    gold += e.gold;
    exp += e.exp;
  }
  return { gold, exp };
}

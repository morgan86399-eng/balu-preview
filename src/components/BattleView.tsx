import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, useGSAP } from "../motion.ts";
import {
  currentActor,
  isStrongIntent,
  pickEnemyCommand,
  potentialName,
  resolveCommand,
  type Command,
} from "../game/combat.ts";
import { ITEMS } from "../game/items.ts";
import { WEAPON_LABEL } from "../game/data.ts";
import { sfx } from "../game/audio.ts";
import type { BattleEvent, BattleState, Fighter, Weapon } from "../game/types.ts";
import Dust from "./Dust.tsx";
import { MysteryIcon, ShieldIcon, WeaponIcon } from "./Icon.tsx";

type UiMode = "cmd" | "skill" | "item" | "support" | "boost" | "target";

function Bar({ value, max, kind }: { value: number; max: number; kind?: "sp" }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <div className={`bar${kind === "sp" ? " sp" : ""}`}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

function WeakPips({ f }: { f: Fighter }) {
  if (f.isPlayer) {
    const w = f.skills[0]?.weapon;
    return (
      <div className="weak-row" aria-label="武器">
        {w ? (
          <span className="weak-pip known" title={WEAPON_LABEL[w]}>
            <WeaponIcon weapon={w} size={16} />
            <span className="sr-only">{WEAPON_LABEL[w]}</span>
          </span>
        ) : (
          <span className="weak-pip known">—</span>
        )}
      </div>
    );
  }
  return (
    <div className="weak-row" aria-label="弱點">
      {f.revealed
        ? f.weaknesses.map((w: Weapon) => (
            <span key={w} className="weak-pip known" title={WEAPON_LABEL[w]}>
              <WeaponIcon weapon={w} size={16} />
              <span className="sr-only">{WEAPON_LABEL[w]}</span>
            </span>
          ))
        : f.weaknesses.map((_, i) => (
            <span key={i} className="weak-pip mystery" title="未揭露">
              <MysteryIcon size={16} />
              <span className="sr-only">？</span>
            </span>
          ))}
    </div>
  );
}

function ShieldRow({ f }: { f: Fighter }) {
  if (f.isPlayer || f.maxShields <= 0) return null;
  if (f.broken || f.shields <= 0) {
    return (
      <div className="shields broken-state" aria-label="崩解">
        <span className="break-tag">崩解</span>
      </div>
    );
  }
  return (
    <div className="shields" aria-label={`盾 ${f.shields}/${f.maxShields}`}>
      {Array.from({ length: f.maxShields }, (_, i) => (
        <ShieldIcon key={i} filled={i < f.shields} />
      ))}
    </div>
  );
}

function BattlerCard({
  f,
  hit,
  hitGold,
  striking,
  shaking,
  windup,
  shatterStamp,
  rage,
  selected,
  onPick,
}: {
  f: Fighter;
  hit?: boolean;
  hitGold?: boolean;
  striking?: boolean;
  shaking?: boolean;
  windup?: boolean;
  shatterStamp?: boolean;
  rage?: boolean;
  selected?: boolean;
  onPick?: () => void;
}) {
  const inner = (
    <>
      {/* Telegraph bang: enemy-card top-center ONLY — continuous pulse while active */}
      {windup && !f.isPlayer && f.hp > 0 && !f.broken && (
        <span
          className="windup-mark"
          data-telegraph="enemy"
          title={`${f.name}蓄勢`}
          aria-label={`${f.name}蓄勢`}
        >
          ！
        </span>
      )}
      <div className="battler-art">
        <img src={f.portrait} alt={f.name} width={140} height={186} />
        {hit && <i className={`hit-flash${hitGold ? " gold" : ""}`} aria-hidden="true" />}
        {shatterStamp && f.hp > 0 && (
          <span className="shatter-stamp" data-fx="shield-break-stamp">
            盾崩解！
          </span>
        )}
        {f.broken && f.hp > 0 && <span className="break-stamp">崩解</span>}
      </div>
      <div className="name-tag">{f.name}</div>
      <Bar value={f.hp} max={f.maxHp} />
      {f.isPlayer && <Bar value={f.sp} max={f.maxSp} kind="sp" />}
      <ShieldRow f={f} />
      <WeakPips f={f} />
    </>
  );
  const cls = `battler${f.isPlayer ? " ally" : " foe"}${hit ? " hit" : ""}${hitGold ? " hit-gold" : ""}${striking ? " strike" : ""}${shaking ? " shake" : ""}${f.broken ? " broken" : ""}${rage ? " rage" : ""}${f.hp <= 0 ? " dead" : ""}`;
  if (onPick) {
    return (
      <button
        type="button"
        className={cls}
        data-side={f.isPlayer ? "ally" : "enemy"}
        onClick={onPick}
        style={{ outline: selected ? "2px solid var(--gold)" : undefined }}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className={cls} data-side={f.isPlayer ? "ally" : "enemy"}>
      {inner}
    </div>
  );
}

export default function BattleView({
  battle,
  items,
  bg,
  onChange,
  onWin,
  onLose,
  consumeItem,
}: {
  battle: BattleState;
  items: Record<string, number>;
  bg: string;
  onChange: (next: BattleState, events: BattleEvent[]) => void;
  onWin: (finished: BattleState) => void;
  onLose: () => void;
  consumeItem: (id: string) => boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const floaterSeq = useRef(0);
  const breakFxLock = useRef(false);
  const prevShields = useRef<Record<string, number>>({});
  const [log, setLog] = useState("雙方列陣。削盾、蓄力、打弱點。");
  const [hitId, setHitId] = useState<string | null>(null);
  const [strikeId, setStrikeId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [breakBanner, setBreakBanner] = useState<string | null>(null);
  const [phase2Banner, setPhase2Banner] = useState(false);
  const [phase2Flash, setPhase2Flash] = useState(false);
  const [potentialBanner, setPotentialBanner] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [shatterStampId, setShatterStampId] = useState<string | null>(null);
  const [breakVignette, setBreakVignette] = useState(false);
  const [goldHit, setGoldHit] = useState(false);
  const [supportFlashId, setSupportFlashId] = useState<string | null>(null);
  const [floaters, setFloaters] = useState<
    {
      key: string;
      id: string;
      n: number;
      weak: boolean;
      heal?: boolean;
      breakWindow?: boolean;
      seg: number;
      multi?: boolean;
      huge?: boolean;
    }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<UiMode>("cmd");
  const [cmdFocus, setCmdFocus] = useState<"attack" | "skill" | "defend" | "item" | "support" | "potential">("attack");
  const [draft, setDraft] = useState<Command>({ kind: "attack", boost: 0 });
  const actor = currentActor(battle);
  const enemies = battle.fighters.filter((f) => !f.isPlayer);
  const players = battle.fighters.filter((f) => f.isPlayer);

  function pushFloater(
    id: string,
    n: number,
    weak: boolean,
    heal = false,
    breakWindow = false,
    seg = 0,
    lifeMs = 2100,
    multi = false,
    huge = false,
  ) {
    // Monotonic unique keys — never reuse, never remount siblings.
    const key = `f-${++floaterSeq.current}-${id}-s${seg}`;
    setFloaters((prev) => [...prev, { key, id, n, weak, heal, breakWindow, seg, multi, huge }]);
    window.setTimeout(() => {
      setFloaters((prev) => prev.filter((x) => x.key !== key));
    }, lifeMs);
  }

  function triggerBreakFx(targetId: string) {
    if (breakFxLock.current) return;
    breakFxLock.current = true;
    setFlash(true);
    setBreakBanner("盾崩解！");
    setShakeId(targetId);
    setShatterStampId(targetId);
    setBreakVignette(true);
    sfx.brk();
    // White flash: hold ≥1.2s then fade (CSS total ~1.9s).
    window.setTimeout(() => setFlash(false), 1900);
    // Edge vignette survives mid-window screenshots.
    window.setTimeout(() => setBreakVignette(false), 2000);
    // Banner 「盾崩解！」≥3s, then gold 「崩解中！」; stamp ≥3s.
    window.setTimeout(() => {
      setBreakBanner((cur) => (cur === "盾崩解！" ? "崩解中！" : cur));
      setShakeId(null);
      setShatterStampId(null);
      breakFxLock.current = false;
    }, 3000);
  }

  function playEvents(events: BattleEvent[], final: BattleState, actorId?: string, boost = 0) {
    setBusy(true);
    if (actorId) {
      setStrikeId(actorId);
      window.setTimeout(() => setStrikeId(null), 320);
    }
    const hitEvents = events.filter((ev): ev is Extract<BattleEvent, { type: "hit" }> => ev.type === "hit");
    // boost≥2: spawn ALL segment numbers immediately as a vertical stack (screenshot-safe).
    const stackAll = boost >= 2 && hitEvents.length >= 2;
    let stackSpawned = false;
    let i = 0;
    let hitSeg = 0;
    let breakFxFired = false;
    const step = () => {
      const e = events[i];
      if (!e) {
        setBusy(false);
        setHitId(null);
        setStrikeId(null);
        setGoldHit(false);
        if (events.some((x) => x.type === "win")) onWin(final);
        if (events.some((x) => x.type === "lose")) onLose();
        return;
      }
      if (e.type === "text") setLog(e.text);
      if (e.type === "hit") {
        hitSeg += 1;
        const inBreak = Boolean(e.breakWindow);
        setGoldHit(inBreak);
        // Remount ONLY the hit flash overlay — floater keys stay stable.
        setHitId(null);
        window.requestAnimationFrame(() => {
          setHitId(e.targetId);
        });
        if (stackAll) {
          if (!stackSpawned) {
            stackSpawned = true;
            hitEvents.forEach((h, idx) => {
              pushFloater(
                h.targetId,
                h.damage,
                h.weak,
                false,
                Boolean(h.breakWindow),
                idx + 1,
                2600,
                true,
              );
            });
          }
        } else {
          // Normal / single-boost hits: thick floater ≥2s; 潛能 huge ≥2.8s.
          const life = e.huge ? 2800 : 2100;
          pushFloater(e.targetId, e.damage, e.weak, false, inBreak, hitSeg, life, false, Boolean(e.huge));
        }
        if (e.weak) sfx.weak();
        else sfx.hit();
        if (inBreak) {
          setBreakBanner((cur) => (cur === "盾崩解！" ? cur : "崩解中！"));
        }
      }
      // Deterministic break FX: break event, or shield left===0 backup.
      if (e.type === "break" && !breakFxFired) {
        breakFxFired = true;
        triggerBreakFx(e.targetId);
      }
      if (e.type === "shield" && e.left === 0 && !breakFxFired) {
        breakFxFired = true;
        triggerBreakFx(e.targetId);
      }
      if (e.type === "text" && e.text === "崩解中！") {
        setBreakBanner((cur) => (cur === "盾崩解！" ? cur : "崩解中！"));
      }
      if (e.type === "phase2") {
        setPhase2Banner(true);
        setPhase2Flash(true);
        // 「渠帥狂怒！」 fullscreen hold — mid-frame must be catchable.
        window.setTimeout(() => setPhase2Flash(false), 3400);
        window.setTimeout(() => setPhase2Banner(false), 3400);
      }
      if (e.type === "potential") {
        setPotentialBanner(e.name);
        // Skill-name banner must survive mid-frame screenshots (≥3.2s, fixed overlay).
        window.setTimeout(() => setPotentialBanner(null), 3200);
      }
      if (e.type === "heal") {
        sfx.heal();
        if ("amount" in e) pushFloater(e.targetId, e.amount, false, true, false, 0, 2100, false);
        setSupportFlashId(e.targetId);
        window.setTimeout(() => setSupportFlashId(null), 700);
      }
      if (e.type === "text" && (e.text.includes("支援") || e.text.includes("援護守勢") || e.text.includes("弱點被看破"))) {
        const aid = actor?.uid;
        if (aid) {
          setSupportFlashId(aid);
          window.setTimeout(() => setSupportFlashId(null), 700);
        }
      }
      if (e.type === "win") {
        setLog("勝。");
        sfx.win();
      }
      if (e.type === "lose") {
        setLog("隊伍全倒。");
        sfx.lose();
      }
      i += 1;
      let delay = 280;
      if (e.type === "hit") {
        // Stack already visible; keep a short beat for flash remount only.
        delay = stackAll ? 160 : e.huge ? 260 : 220;
      } else if (e.type === "break" || (e.type === "shield" && e.left === 0)) {
        delay = 750;
      } else if (e.type === "phase2") {
        delay = 2800; // hold rage frame before continuing hits/win
      } else if (e.type === "potential") {
        delay = 2000; // hold on skill-name frame before hit spam
      }
      setTimeout(step, delay);
    };
    step();
  }

  // Force shatter FX from any enemy shield→0 / newly-broken transition
  // (covers cases where break events are easy to miss vs state update).
  useEffect(() => {
    for (const f of enemies) {
      const prev = prevShields.current[f.uid];
      const now = f.shields;
      const newlyBroken =
        prev !== undefined && ((prev > 0 && now <= 0) || (!!f.broken && prev > 0 && f.hp > 0));
      if (newlyBroken) {
        triggerBreakFx(f.uid);
      }
      prevShields.current[f.uid] = now;
    }
    // Seed unknowns without firing.
    for (const f of enemies) {
      if (prevShields.current[f.uid] === undefined) {
        prevShields.current[f.uid] = f.shields;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.fighters]);

  // Clear window banner once no living enemy is broken.
  useEffect(() => {
    const anyBroken = enemies.some((f) => f.broken && f.hp > 0);
    if (!anyBroken && breakBanner === "崩解中！") setBreakBanner(null);
  }, [enemies, breakBanner]);

  function act(cmd: Command) {

    if (busy || battle.ended) return;
    // Show 潛能 skill-name overlay immediately so mid-frame screenshots catch it
    // before hits replace the view / button flips to「已用」.
    if (cmd.kind === "potential" && actor) {
      setPotentialBanner(potentialName(actor));
      window.setTimeout(() => setPotentialBanner(null), 3200);
    }
    const { state, events } = resolveCommand(battle, cmd);
    onChange(state, events);
    setMode("cmd");
    setCmdFocus("attack");
    setDraft({ kind: "attack", boost: 0 });
    playEvents(events, state, actor?.uid, cmd.boost ?? 0);
  }

  useEffect(() => {
    if (busy || battle.ended) return;
    if (!actor || actor.isPlayer) return;
    const t = setTimeout(() => act(pickEnemyCommand(battle)), 520);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.turn, busy, battle.ended]);

  const aoe = useMemo(() => {
    if (draft.kind !== "skill" || !actor) return false;
    return actor.skills.find((s) => s.id === draft.skillId)?.aoe ?? false;
  }, [draft, actor]);

  const needsTarget = useMemo(() => {
    if (draft.kind === "defend") return false;
    if (draft.kind === "potential") return true;
    if (draft.kind === "item") {
      const it = ITEMS.find((x) => x.id === draft.itemId);
      return it?.kind === "oil";
    }
    if (draft.kind === "support" && actor) {
      const s = actor.skills.find((x) => x.id === draft.skillId);
      if (s?.effect === "reveal") return true;
      if (s?.effect === "cover") return players.filter((f) => f.hp > 0).length > 1;
      return false;
    }
    if (draft.kind === "skill" && actor) {
      const s = actor.skills.find((x) => x.id === draft.skillId);
      if (s?.effect === "heal" || s?.effect === "bpAlly" || s?.effect === "cover") return false;
      if (s?.aoe) return false;
    }
    return true;
  }, [draft, actor, players]);

  function enterBoost(next: Command) {
    setDraft({ ...next, boost: Math.min(next.boost ?? 0, actor?.bp ?? 0) });
    setMode("boost");
  }

  function commitItemIfNeeded(cmd: Command): Command | null {
    if (cmd.kind !== "item" || !cmd.itemId) return cmd;
    if (!consumeItem(cmd.itemId)) return null;
    return cmd;
  }

  function confirmBoost() {
    if (needsTarget || aoe) {
      setMode("target");
      return;
    }
    const cmd = commitItemIfNeeded(draft);
    if (!cmd) return;
    act(cmd);
  }

  function confirmTarget(targetId?: string) {
    const next = { ...draft, targetId };
    const cmd = commitItemIfNeeded(next);
    if (!cmd) return;
    act(cmd);
  }

  const ownedItems = ITEMS.filter((it) => (items[it.id] ?? 0) > 0);
  const hitPreview = useMemo(() => {
    if (!actor) return 1;
    if (draft.kind === "potential") {
      const inBreak = enemies.some((f) => f.broken && f.hp > 0);
      return (inBreak ? 4 : 2) + draft.boost;
    }
    if (draft.kind === "skill") {
      const s = actor.skills.find((x) => x.id === draft.skillId);
      return (s?.hits ?? 1) + draft.boost;
    }
    if (draft.kind === "attack") return 1 + draft.boost;
    return 1;
  }, [actor, draft, enemies]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".cmd", { y: 24, autoAlpha: 0, duration: 0.45, ease: "power3.out" });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const orderNow = actor?.uid;

  return (
    <section ref={root} className="battle">
      <div className="bg-plate" style={{ backgroundImage: `url(${bg})` }} />
      <Dust />
      {flash && <div className="flash-break white" aria-hidden="true" data-fx="white-flash" />}
      {breakVignette && (
        <div className="break-vignette" aria-hidden="true" data-fx="break-vignette" />
      )}
      {(() => {
        // Only banner state drives copy — do NOT use anyBroken alone, or
        // parent onChange(broken) flashes 「崩解中！」 before 「盾崩解！」.
        const shatter = breakBanner === "盾崩解！";
        const windowBan = !shatter && breakBanner === "崩解中！";
        if (!shatter && !windowBan) return null;
        const label = shatter ? "盾崩解！" : "崩解中！";
        return (
          <div
            className={`break-banner${shatter ? " shatter" : " window"}${flash ? " with-flash" : ""}`}
            role="status"
            data-fx={shatter ? "shield-break" : "break-window"}
          >
            {label}
          </div>
        );
      })()}
      {phase2Banner && (
        <div className="phase2-veil" role="status" data-fx="phase2" aria-live="assertive" data-phase2="渠帥狂怒">
          <div className="phase2-banner">
            <div className="phase2-banner-kicker">二階段</div>
            <div className="phase2-banner-title">渠帥狂怒！</div>
          </div>
        </div>
      )}
      {phase2Flash && <div className="phase2-edge" aria-hidden="true" data-fx="phase2-edge" />}
      {potentialBanner && (
        <div className="potential-veil" role="status" data-fx="potential" aria-live="assertive" data-potential-banner={potentialBanner}>
          <div className="potential-banner">
            <div className="potential-banner-kicker">潛能一擊</div>
            <div className="potential-banner-title">{potentialBanner}</div>
          </div>
        </div>
      )}
      <div className="order-rail gold-frame" aria-label="出手順序">
        {battle.order.map((id, i) => {
          const f = battle.fighters.find((x) => x.uid === id);
          if (!f) return null;
          const now = orderNow === id && i === battle.turn % battle.order.length;
          // No bang on order rail (avoids looking like ally 張飛) — bang only on enemy cards.
          const foeWindup = Boolean(!f.isPlayer && f.hp > 0 && !f.broken && isStrongIntent(battle, f));
          return (
            <div
              key={`${id}-${i}`}
              className={`ord${now ? " now" : ""}${f.hp <= 0 ? " dead" : ""}${foeWindup ? " windup" : ""}${f.isPlayer ? " ally" : " foe"}`}
              title={foeWindup ? `${f.name}（蓄勢）` : f.name}
              data-fighter={f.defId}
              data-side={f.isPlayer ? "ally" : "enemy"}
            >
              <img src={f.portrait} alt={f.name} width={44} height={44} />
              {now && <span className="ord-now-mark" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      <div className="battle-field">
        <div className="side">
          {players.map((f) => (
            <div key={f.uid} style={{ position: "relative" }}>
              <BattlerCard
                f={f}
                hit={hitId === f.uid}
                hitGold={hitId === f.uid && goldHit}
                striking={strikeId === f.uid}
              />
              {supportFlashId === f.uid && <i className="support-flash" aria-hidden="true" />}
              {floaters
                .filter((d) => d.id === f.uid)
                .map((d) => (
                  <div
                    key={d.key}
                    className={`dmg${d.heal ? " heal" : ""}${d.weak ? " weak" : ""}`}
                    style={{ animationDelay: "0ms", ["--seg" as string]: d.seg }}
                  >
                    {d.heal ? `+${d.n}` : d.n}
                  </div>
                ))}
            </div>
          ))}
        </div>
        <div className="side enemies">
          {enemies.map((f) => (
            <div key={f.uid} style={{ position: "relative" }}>
              <BattlerCard
                f={f}
                hit={hitId === f.uid}
                hitGold={hitId === f.uid && goldHit}
                striking={strikeId === f.uid}
                shaking={shakeId === f.uid}
                shatterStamp={shatterStampId === f.uid}
                windup={!f.isPlayer && f.hp > 0 && !f.broken && isStrongIntent(battle, f)}
                rage={phase2Flash && f.defId === "boss"}
                selected={mode === "target" && draft.targetId === f.uid}
                onPick={
                  mode === "target" && !aoe && f.hp > 0
                    ? () => confirmTarget(f.uid)
                    : undefined
                }
              />
              {floaters
                .filter((d) => d.id === f.uid)
                .map((d) => {
                  const i = Math.max(0, d.seg - 1);
                  // Vertical stack for boost≥2 multi; slight zigzag keeps segments distinct.
                  const x = d.multi ? ((i % 2) * 2 - 1) * 10 : (i % 3) * 36 - 36;
                  const y = d.multi ? 2 + i * 30 : 4 + (i % 5) * 22;
                  return (
                    <div
                      key={d.key}
                      className={`dmg${d.multi ? " multi" : ""}${d.weak ? " weak" : ""}${d.breakWindow ? " break-win" : ""}${d.huge ? " huge" : ""}`}
                      style={{
                        top: `${y}%`,
                        left: `calc(50% + ${x}px)`,
                        animationDelay: "0ms",
                        ["--seg" as string]: d.seg,
                      }}
                    >
                      {d.n}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
      <div className="cmd gold-frame">
        <div className="cmd-meta">
          <div className="turn-log">{log}</div>
          {actor && (
            <div className="bp-orbs" aria-label="蓄力">
              <span className="bp-label">
                {actor.name} · 蓄力 {actor.bp}/3
                {mode === "boost" || mode === "target" ? ` · 將打 ${hitPreview} 段` : ""}
              </span>
            </div>
          )}
        </div>
        <div className="cmd-panel">
          {actor?.isPlayer && !busy && !battle.ended && mode === "cmd" && (
            <div className="cmd-bar" role="group" aria-label="指令">
              <button
                type="button"
                className={`btn cmd-btn${cmdFocus === "attack" ? " selected" : ""}`}
                onClick={() => {
                  setCmdFocus("attack");
                  enterBoost({ kind: "attack", boost: 0 });
                }}
              >
                攻擊
              </button>
              <button
                type="button"
                className={`btn cmd-btn${cmdFocus === "skill" ? " selected" : ""}`}
                onClick={() => {
                  setCmdFocus("skill");
                  setMode("skill");
                }}
              >
                戰技
              </button>
              <button
                type="button"
                className={`btn cmd-btn${cmdFocus === "defend" ? " selected" : ""}`}
                onClick={() => {
                  setCmdFocus("defend");
                  act({ kind: "defend", boost: 0 });
                }}
              >
                防禦
              </button>
              <button
                type="button"
                className={`btn cmd-btn${cmdFocus === "item" ? " selected" : ""}`}
                onClick={() => {
                  setCmdFocus("item");
                  setMode("item");
                }}
              >
                物件
              </button>
              <button
                type="button"
                className={`btn cmd-btn${cmdFocus === "support" ? " selected" : ""}`}
                onClick={() => {
                  setCmdFocus("support");
                  setMode("support");
                }}
              >
                支援
              </button>
              <button
                type="button"
                className={`btn cmd-btn potential-btn${cmdFocus === "potential" ? " selected" : ""}${actor.potentialUsed ? " used" : " ready"}`}
                disabled={actor.potentialUsed}
                title={actor.potentialUsed ? "本場已使用" : potentialName(actor)}
                data-qa="potential"
                onClick={() => {
                  if (actor.potentialUsed) return;
                  setCmdFocus("potential");
                  enterBoost({ kind: "potential", boost: 0 });
                }}
              >
                {actor.potentialUsed ? "潛能（已用）" : "潛能・可放"}
              </button>
            </div>
          )}
          {mode === "skill" && actor && (
            <div className="list-btns">
              {actor.skills.filter((s) => !s.support).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="btn"
                  disabled={actor.sp < s.sp}
                  onClick={() => enterBoost({ kind: "skill", skillId: s.id, boost: 0 })}
                >
                  <WeaponIcon weapon={s.weapon} size={16} />
                  <span>
                    {s.name} · 氣 {s.sp} · ×{s.hits}
                  </span>
                </button>
              ))}
              <button type="button" className="btn" onClick={() => setMode("cmd")}>
                返回
              </button>
            </div>
          )}
          {mode === "support" && actor && (
            <div className="list-btns">
              {actor.skills.filter((s) => s.support).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="btn"
                  disabled={actor.sp < s.sp}
                  onClick={() => {
                    const cmd: Command = { kind: "support", skillId: s.id, boost: 0 };
                    setDraft(cmd);
                    if (s.effect === "reveal") {
                      setMode("target");
                      return;
                    }
                    if (s.effect === "cover" && players.filter((f) => f.hp > 0).length > 1) {
                      setMode("target");
                      return;
                    }
                    act(cmd);
                  }}
                >
                  <span>
                    {s.name} · 氣 {s.sp}
                    {s.effect === "heal" ? " · 小回血" : s.effect === "reveal" ? " · 看破" : " · 援護"}
                  </span>
                </button>
              ))}
              <button type="button" className="btn" onClick={() => setMode("cmd")}>
                返回
              </button>
            </div>
          )}
          {mode === "item" && (
            <div className="list-btns">
              {ownedItems.length === 0 && <div className="weak-row">沒有可用物件。</div>}
              {ownedItems.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (it.kind === "oil") {
                      enterBoost({ kind: "item", itemId: it.id, boost: 0 });
                      return;
                    }
                    if (!consumeItem(it.id)) return;
                    act({ kind: "item", itemId: it.id, boost: 0, targetId: actor?.uid });
                  }}
                >
                  {it.name} ×{items[it.id]} · {it.desc}
                </button>
              ))}
              <button type="button" className="btn" onClick={() => setMode("cmd")}>
                返回
              </button>
            </div>
          )}
          {mode === "boost" && actor && (
            <div className="boost-panel">
              <div className="weak-row">選擇蓄力層數（0–{actor.bp}）。多段攻擊會分段出手。</div>
              <div className="bp-orbs pick-row">
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`orb${n <= actor.bp ? " filled" : ""}${draft.boost === n ? " pick" : ""}`}
                    disabled={n > actor.bp}
                    onClick={() => setDraft((d) => ({ ...d, boost: n }))}
                    aria-label={`蓄力 ${n}`}
                    aria-pressed={draft.boost === n}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="btn-row boost-actions">
                <button type="button" className="btn btn-primary" onClick={confirmBoost}>
                  {needsTarget || aoe ? "選定目標" : "使出"}（{hitPreview} 段）
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setMode(
                      draft.kind === "skill"
                        ? "skill"
                        : draft.kind === "item"
                          ? "item"
                          : "cmd",
                    );
                  }}
                >
                  返回
                </button>
              </div>
            </div>
          )}
          {mode === "target" && (
            <div className="list-btns">
              <div className="weak-row">
                {draft.kind === "support" && draft.skillId && actor?.skills.find((s) => s.id === draft.skillId)?.effect === "cover"
                  ? "點選同伴進行援護。"
                  : draft.kind === "support"
                    ? "點選敵人看破弱點。"
                    : aoe
                      ? "此技打全體，確認即出招。"
                      : "點選對面的人作為目標。"}
              </div>
              {draft.kind === "support" &&
                actor?.skills.find((s) => s.id === draft.skillId)?.effect === "cover" &&
                players
                  .filter((f) => f.hp > 0)
                  .map((f) => (
                    <button key={f.uid} type="button" className="btn" onClick={() => confirmTarget(f.uid)}>
                      援護 {f.name}
                    </button>
                  ))}
              {aoe && draft.kind !== "support" && (
                <button type="button" className="btn btn-primary" onClick={() => confirmTarget()}>
                  使出（{hitPreview} 段）
                </button>
              )}
              <button
                type="button"
                className="btn"
                onClick={() => setMode(draft.kind === "support" ? "support" : "boost")}
              >
                返回
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

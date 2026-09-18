import { useEffect, useState } from "react";
import { heroById, PATH_LABEL } from "../game/data.ts";
import { blockedTile, isNight } from "../game/maps.ts";
import { objectiveFor, placeName, tileToPercent, walkPads } from "../game/view.ts";
import type { Dir, GameSave, MapDef, TownNpc } from "../game/types.ts";
import Dust from "./Dust.tsx";
import { Chevron } from "./Icon.tsx";


const TOWN_MAPS = new Set(["xinyue", "inn", "yunzhen", "merge", "zhuolu"]);

const CHATTER: Record<string, string[]> = {
  guanyu: ["義氣在前。", "先削盾。"],
  zhaoyun: ["白馬已備。", "護主為先。"],
  zhangfei: ["這酒太淡！", "誰敢攔路？"],
  zhuge: ["風向不穩。", "弱點先記。"],
  caocao: ["路要收進袖裡。", "先保住點。"],
  zhouyu: ["音律差一拍。", "火候未到。"],
  sunshangxiang: ["箭程剛好。", "我看背後。"],
  diaochan: ["燈下有話。", "先勸再開。"],
};

function visibleNpcs(map: MapDef, save: GameSave): TownNpc[] {
  const night = isNight(save.hour);
  return map.npcs.filter((n) => {
    if (n.hideFlag && save.flags[n.hideFlag]) return false;
    if (n.requireFlag && !save.flags[n.requireFlag]) return false;
    if (n.nightOnly && !night) return false;
    if (n.dayOnly && night) return false;
    return true;
  });
}

export default function WorldView({
  map,
  save,
  interactHint,
  onMove,
  onInteract,
  onMenu,
  uiBlocked = false,
  onQuickField,
  onQuickBlacksmith,
  onChallengeMiniboss,
  onChallengeRemnant,
  onNightTalk,
  onQuickZgate,
  onChallengeGatechief,
  onQuickNfield,
  onChallengeSchemer,
  onQuickTgarden,
  onChallengeTyrant,
  onQuickXroad,
  onChallengeEnforcer,
}: {
  map: MapDef;
  save: GameSave;
  interactHint: string;
  onMove: (dir: Dir) => void;
  onInteract: () => void;
  onMenu: () => void;
  /** Hide step-pads / dim controls while dialogue or overlays block world input. */
  uiBlocked?: boolean;
  onQuickField?: () => void;
  onQuickBlacksmith?: () => void;
  onChallengeMiniboss?: () => void;
  onChallengeRemnant?: () => void;
  onNightTalk?: () => void;
  onQuickZgate?: () => void;
  onChallengeGatechief?: () => void;
  onQuickNfield?: () => void;
  onChallengeSchemer?: () => void;
  onQuickTgarden?: () => void;
  onChallengeTyrant?: () => void;
  onQuickXroad?: () => void;
  onChallengeEnforcer?: () => void;
}) {
  const hero = heroById(save.heroId);
  const npcs = visibleNpcs(map, save);
  const here = tileToPercent(map, save.x, save.y);
  const pads = walkPads(map, save.x, save.y, npcs);
  const night = isNight(save.hour);
  const loc = placeName(map, save.x, save.y, npcs);
  const goal = objectiveFor(save);
  const cols = map.tiles[0]?.length ?? 0;
  const facingNpc = npcs.find((n) => {
    const dx = Math.abs(n.x - save.x);
    const dy = Math.abs(n.y - save.y);
    return dx + dy === 1;
  });
  const tod = night ? "夜" : "晝";
  const enc = map.encounter;
  const encMax = enc?.steps ?? 0;
  const encFill = Math.min(save.encounterFill ?? 0, encMax || 1);
  const encPct = encMax > 0 ? Math.round((encFill / encMax) * 100) : 0;
  const encFull = encMax > 0 && encFill >= encMax;

  const [chatter, setChatter] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => {
    if (!TOWN_MAPS.has(save.mapId)) {
      setChatter(null);
      return;
    }
    const companions = save.party.filter((id) => id !== save.heroId);
    if (!companions.length) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const id = companions[Math.floor(Math.random() * companions.length)]!;
      const lines = CHATTER[id] ?? ["……"];
      const text = lines[Math.floor(Math.random() * lines.length)]!;
      setChatter({ id, text });
      window.setTimeout(() => {
        if (!cancelled) setChatter(null);
      }, 2400);
    };
    const first = window.setTimeout(tick, 1800);
    const iv = window.setInterval(tick, 9000);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(iv);
    };
  }, [save.mapId, save.party, save.heroId]);

  function go(dir: Dir) {
    // Keep focus off HUD buttons so Enter/Space never re-fire 列傳.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onMove(dir);
  }

  return (
    <section className={`world${uiBlocked ? " ui-blocked" : ""}`}>
      <div className="bg-plate" style={{ backgroundImage: `url(${map.bg})` }} />
      <div className="hd2d-layers" aria-hidden="true">
        <div className="hd2d-sky" />
        <div className={`hd2d-mid tone-${map.lighting}`} />
        <div className="hd2d-ground" />
        <div className="hd2d-haze" />
      </div>
      <div
        className="light-veil"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          background:
            map.lighting === "fire"
              ? "rgba(90,28,8,0.22)"
              : night || map.lighting === "night"
                ? "rgba(12,22,48,0.38)"
                : map.lighting === "warm"
                  ? "rgba(90,50,16,0.16)"
                  : "transparent",
        }}
      />
      <Dust />

      {!uiBlocked &&
        pads.map((p) => (
          <button
            key={p.dir}
            type="button"
            className="step-pad"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
            aria-label={`往${p.dir === "up" ? "城門方向" : p.dir === "down" ? "井的方向" : p.dir === "left" ? "左側" : "右側"}`}
            onPointerDown={(e) => {
              e.preventDefault();
              go(p.dir);
            }}
          />
        ))}

      {npcs.map((n) => {
        const pos = tileToPercent(map, n.x, n.y);
        const near = Math.abs(n.x - save.x) + Math.abs(n.y - save.y) === 1;
        const clue = save.inquired.includes(n.id);
        return (
          <button
            key={n.id}
            type="button"
            className={`actor npc${near ? " near" : ""}${clue ? " clue-mark" : ""}`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              zIndex: 14 + n.y,
              transform: `translate(-50%, -100%) scale(${pos.scale})`,
            }}
            onClick={() => {
              if (near) onInteract();
            }}
          >
            {near && <em>{n.name}</em>}
            {/* Path-action prompt only when adjacent — never at distance. */}
            {near && <span className="path-badge">{PATH_LABEL[hero.pathAction]}</span>}
            <img src={npcPortrait(n)} alt={n.name} width={72} height={96} />
            <i className="foot-ring" />
          </button>
        );
      })}

      {(() => {
        const companions = save.party.filter((id) => id !== save.heroId).map((id) => heroById(id));
        const side = save.facing === "left" ? 1 : -1;
        // Spread companions so three actors never stack into one blob.
        const offsets = [
          { dx: side * Math.max(8, 11 * here.scale), dy: -2.2 * here.scale, scale: 0.82 },
          { dx: -side * Math.max(9, 12 * here.scale), dy: -1.2 * here.scale, scale: 0.78 },
          { dx: side * Math.max(5, 7 * here.scale), dy: 1.4 * here.scale, scale: 0.74 },
        ];
        return (
          <>
            {companions.map((companion, i) => {
              const off = offsets[i] ?? offsets[offsets.length - 1]!;
              return (
                <div
                  key={companion.id}
                  className={`actor companion slot-${i + 1}`}
                  style={{
                    left: `${here.left + off.dx}%`,
                    top: `${here.top + off.dy}%`,
                    zIndex: 28 - i,
                    transform: `translate(-50%, -100%) scale(${here.scale * off.scale})`,
                  }}
                >
                  <em>{companion.name}</em>
                  {chatter?.id === companion.id && (
                    <span className="chatter-bubble" role="status" data-chatter={chatter.text}>
                      {chatter.text}
                    </span>
                  )}
                  <img src={companion.portrait} alt={companion.name} width={80} height={106} />
                  <i className="foot-ring" />
                </div>
              );
            })}
            <div
              className={`actor player facing-${save.facing}`}
              style={{
                left: `${here.left}%`,
                top: `${here.top}%`,
                zIndex: 30,
                transform: `translate(-50%, -100%) scale(${here.scale})`,
              }}
            >
              <em>{hero.name}（你）</em>
              <img src={hero.portrait} alt={hero.name} width={96} height={128} />
              <i className="foot-ring you" />
              <span className="face-arrow" aria-hidden="true">
                <Chevron dir={save.facing} />
              </span>
            </div>
          </>
        );
      })()}

      <div className="vignette" />

      <div className="hud-top">
        <div className="gold-frame chip hud-place">
          <b>
            {map.name} · {loc}
          </b>
          <div>
            {tod} {String(save.hour).padStart(2, "0")} 時
          </div>
        </div>
        <div className="gold-frame chip hud-party">
          <b>
            {save.party.map((id) => heroById(id).name).join("・")} · Lv{save.level}
          </b>
          <div>
            金錢 {save.gold}
          </div>
        </div>
      </div>

      <div className="objective gold-frame" role="status">
        <span className="obj-label">篇章目標</span>
        <span className="obj-text">{goal}</span>
        {facingNpc && (
          <span className="obj-path">
            {" "}
            {facingNpc.id === "innkeeper"
              ? " · 可投宿一夜：掌櫃（免費）"
              : facingNpc.id === "merge-campfire"
                ? " · 可圍爐夜話：營火"
                : ` · 可${PATH_LABEL[hero.pathAction]}：${facingNpc.name}`}
          </span>
        )}
      </div>

      <div className="minimap gold-frame" aria-label="地圖">
        <div className="mini-grid" style={{ gridTemplateColumns: `repeat(${cols}, 7px)` }}>
          {map.tiles.map((row, y) =>
            row.split("").map((ch, x) => {
              const npcHere = npcs.some((n) => n.x === x && n.y === y);
              const you = save.x === x && save.y === y;
              const kind = you ? "you" : npcHere ? "npc" : blockedTile(ch) ? "wall" : ch === "G" || ch === "I" || ch === "C" ? "mark" : "path";
              return <i key={`${x}-${y}`} className={`mini ${kind}`} />;
            }),
          )}
        </div>
        <div className="mini-legend">黃點是你 · 白點是人</div>
      </div>

      {enc && encMax > 0 && (
        <div
          className={`encounter-meter gold-frame${encFull ? " full" : ""}`}
          role="status"
          aria-label="遭遇量表"
          data-encounter-fill={encFill}
          data-encounter-max={encMax}
          data-encounter-pct={encPct}
        >
          <div className="encounter-meter-label">
            <span>遭遇</span>
            <span className="enc-val">
              {encFill}/{encMax}
            </span>
          </div>
          <div className="encounter-meter-track">
            <div className="encounter-meter-fill" style={{ width: `${encPct}%` }} />
          </div>
        </div>
      )}

      <div className="controls">
        <div className="dpad" role="group" aria-label="移動">
          <button type="button" className="btn u" tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); go("up"); }} aria-label="上">
            <Chevron dir="up" />
          </button>
          <button type="button" className="btn l" tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); go("left"); }} aria-label="左">
            <Chevron dir="left" />
          </button>
          <button type="button" className="btn r" tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); go("right"); }} aria-label="右">
            <Chevron dir="right" />
          </button>
          <button type="button" className="btn d" tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); go("down"); }} aria-label="下">
            <Chevron dir="down" />
          </button>
        </div>
        <div className="side-actions">
          {save.mapId === "yunzhen" && onQuickField && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="exit-field"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onQuickField();
              }}
            >
              出驛・平野
            </button>
          )}
          {save.mapId === "yunzhen" && onQuickBlacksmith && (
            <button
              type="button"
              className="btn quick-travel"
              data-qa="goto-blacksmith"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onQuickBlacksmith();
              }}
            >
              找鐵匠
            </button>
          )}
          {save.mapId === "field" && !save.flags.ch2Clear && onChallengeMiniboss && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="challenge-lieutenant"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onChallengeMiniboss();
              }}
            >
              挑戰黃巾小帥
            </button>
          )}
          {save.mapId === "merge" && !save.flags.confluenceClear && onChallengeRemnant && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="challenge-remnant"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onChallengeRemnant();
              }}
            >
              挑戰渠帥殘黨
            </button>
          )}

          {save.mapId === "zhuolu" && onQuickZgate && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="exit-zgate"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onQuickZgate();
              }}
            >
              出驛・鎮口
            </button>
          )}
          {save.mapId === "zgate" && !save.flags.ch3Clear && onChallengeGatechief && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="challenge-gatechief"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onChallengeGatechief();
              }}
            >
              挑戰鎮口頭目
            </button>
          )}
          {save.mapId === "wolong" && onQuickNfield && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="exit-nfield"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onQuickNfield();
              }}
            >
              出岡・郊野
            </button>
          )}
          {save.mapId === "nfield" && !save.flags.ch4Clear && onChallengeSchemer && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="challenge-schemer"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onChallengeSchemer();
              }}
            >
              挑戰偽軍師
            </button>
          )}
          {save.mapId === "taoyuan" && !save.flags.ch5Clear && onQuickTgarden && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="quick-tgarden"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onQuickTgarden();
              }}
            >
              出園・園外
            </button>
          )}
          {save.mapId === "tgarden" && !save.flags.ch5Clear && onChallengeTyrant && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="challenge-tyrant"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onChallengeTyrant();
              }}
            >
              挑戰鄉霸
            </button>
          )}
          {save.mapId === "xuchang" && !save.flags.ch6Clear && onQuickXroad && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="quick-xroad"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onQuickXroad();
              }}
            >
              出郊・官道
            </button>
          )}
          {save.mapId === "xroad" && !save.flags.ch6Clear && onChallengeEnforcer && (
            <button
              type="button"
              className="btn btn-primary quick-travel"
              data-qa="challenge-enforcer"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onChallengeEnforcer();
              }}
            >
              挑戰探馬頭目
            </button>
          )}
          {save.mapId === "merge" && !save.flags.nightTalkDone && onNightTalk && (
            <button
              type="button"
              className="btn quick-travel"
              data-qa="night-talk-side"
              disabled={uiBlocked}
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                onNightTalk();
              }}
            >
              圍爐夜話
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onInteract} disabled={uiBlocked}>
            {interactHint || "交談"}
          </button>
          <button
            type="button"
            className="btn"
            disabled={uiBlocked}
            onClick={() => {
              if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
              onMenu();
            }}
          >
            列傳
          </button>
        </div>
      </div>
    </section>
  );
}

export function npcPortrait(npc: TownNpc): string {
  if (npc.id === "singer" || npc.id === "captive") return "./art/portrait-diaochan.png";
  if (npc.id === "lookout") return "./art/portrait-officer.png";
  if (npc.id === "vendor" || npc.id === "innkeeper" || npc.id === "yz-vendor") return "./art/portrait-caocao.png";
  if (npc.id === "elder" || npc.id === "bard" || npc.id === "yz-elder" || npc.id === "zg-elder" || npc.id === "zg-scholar") return "./art/portrait-zhuge.png";
  if (npc.id === "drinker" || npc.id === "zf-drinker" || npc.id === "zf-gatechief") return "./art/portrait-zhangfei.png";
  if (npc.id === "wayfarer" || npc.id === "yz-scout" || npc.id === "zg-scout" || npc.id === "zf-scout") return "./art/portrait-zhaoyun.png";
  if (npc.id === "yz-wounded" || npc.id === "zg-wounded" || npc.id === "zf-wounded") return "./art/portrait-officer.png";
  if (npc.id === "yz-lieutenant") return "./art/portrait-bandit.png";
  if (npc.id === "merge-remnant" || npc.id === "zg-schemer") return "./art/portrait-boss.png";
  if (npc.id === "merge-campfire") return "./art/portrait-zhouyu.png";
  if (npc.id === "merge-scout") return "./art/portrait-zhaoyun.png";
  if (npc.id === "zf-elder") return "./art/portrait-caocao.png";
  return "./art/portrait-yellowturban.png";
}

export { visibleNpcs };

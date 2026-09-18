import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CHRONICLES,
  CONFLUENCE_ID,
  SECOND_CHRONICLE_ID,
  ZHANGFEI_CHRONICLE_ID,
  ZHUGE_CHRONICLE_ID,
  LIUBEI_CHRONICLE_ID,
  CAOCAO_CHRONICLE_ID,
} from "../game/chronicles.ts";
import { HEROES, heroById } from "../game/data.ts";
import {
  confluenceLockHint,
  confluenceUnlocked,
  guanyuStatus,
  loadProgress,
  maxPartySize,
  partyOfFourUnlocked,
  patchProgress,
  unlockedTravelerIds,
  worldMapUnlocked,
  worldNodeLockHint,
  worldNodeUnlocked,
  zhangfeiStatus,
  zhaoyunStatus,
  zhugeStatus,
  liubeiStatus,
  caocaoStatus,
  emptyProgress,
  fourRoadsUnlocked,
  fourRoadsLockHint,
  fiveRoadsUnlocked,
  fiveRoadsLockHint,
  type LineStatus,
  type MetaProgress,
  type WorldNodeId,
} from "../game/progress.ts";
import { loadSettings, patchSettings, type GameSettings } from "../game/settings.ts";
import { qaMaxMastery } from "../game/pathMastery.ts";
import {
  getActiveSlot,
  listSlots,
  setActiveSlot,
  slotIsOccupied,
  writeSlot,
  type SlotInfo,
} from "../game/save.ts";
import type { ChronicleId, GameSave } from "../game/types.ts";
import { gsap, useGSAP } from "../motion.ts";
import Dust from "./Dust.tsx";

function statusClass(s: LineStatus): string {
  if (s === "初章既竟") return "done";
  if (s === "進行中") return "active";
  return "idle";
}

export default function TitleScreen({
  hasSave,
  onNew,
  onContinue,
  onSecondChronicle,
  onConfluence,
  onZhangFei,
  onZhuge,
  onLiubei,
  onCaocao,
  onOpenFourRoads,
  onOpenFiveRoads,
  onBountyQa,
  onOpenSaveSlots,
  onOpenWorldMap,
  onOpenWorldMapGrey,
  onOpenSettings,
}: {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
  onSecondChronicle: () => void;
  onConfluence: () => void;
  onZhangFei: () => void;
  onZhuge: () => void;
  onLiubei: () => void;
  onCaocao: () => void;
  onOpenFourRoads: () => void;
  onOpenFiveRoads: () => void;
  onBountyQa: () => void;
  onOpenSaveSlots: () => void;
  onOpenWorldMap: () => void;
  onOpenWorldMapGrey: () => void;
  onOpenSettings: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const [, bump] = useState(0);
  const progress = loadProgress();
  const gy = guanyuStatus(progress);
  const zy = zhaoyunStatus(progress);
  const zf = zhangfeiStatus(progress);
  const zg = zhugeStatus(progress);
  const lb = liubeiStatus(progress);
  const cc = caocaoStatus(progress);
  const [fourGreyQa, setFourGreyQa] = useState(false);
  const [fiveGreyQa, setFiveGreyQa] = useState(false);
  const fourOk = fourGreyQa ? false : fourRoadsUnlocked(progress);
  const fourHint = fourGreyQa
    ? fourRoadsLockHint(emptyProgress())
    : fourRoadsLockHint(progress);
  const fiveOk = fiveGreyQa ? false : fiveRoadsUnlocked(progress);
  const fiveHint = fiveGreyQa
    ? fiveRoadsLockHint(emptyProgress())
    : fiveRoadsLockHint(progress);
  const unlocked = confluenceUnlocked(progress);
  const lockHint = confluenceLockHint(progress);
  const mapOk = worldMapUnlocked(progress);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".title-enter", {
          autoAlpha: 0,
          y: 28,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <section ref={root} className="screen title-wrap">
      <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-title.png)" }} />
      <Dust />
      <div className="vignette" />
      <h1 className="title-enter" id="game-hero">
        八路列傳
      </h1>
      <p className="title-enter">八位英雄，八條列傳。在新野城裡移動、探聽、蓄力、削盾，把第一章寫完。</p>

      <div className="title-progress gold-frame title-enter" data-qa="title-progress" role="status">
        <div className="title-progress-row">
          <span className="tp-name">關羽列傳</span>
          <span className={`tp-status ${statusClass(gy)}`} data-status={gy}>
            {gy}
          </span>
        </div>
        <div className="title-progress-row">
          <span className="tp-name">趙雲列傳</span>
          <span className={`tp-status ${statusClass(zy)}`} data-status={zy}>
            {zy}
          </span>
        </div>
        <div className="title-progress-row">
          <span className="tp-name">張飛列傳</span>
          <span className={`tp-status ${statusClass(zf)}`} data-status={zf} data-qa="zf-status">
            {zf}
          </span>
        </div>
        <div
          className="title-progress-row zhuge"
          data-line="zhuge"
          data-qa="zg-progress-row"
        >
          <span className="tp-name">諸葛亮列傳</span>
          <span className={`tp-status ${statusClass(zg)}`} data-status={zg} data-qa="zg-status">
            {zg}
          </span>
        </div>
        <div
          className="title-progress-row liubei"
          data-line="liubei"
          data-qa="lb-progress-row"
        >
          <span className="tp-name">劉備列傳</span>
          <span className={`tp-status ${statusClass(lb)}`} data-status={lb} data-qa="lb-status">
            {lb}
          </span>
        </div>
        <div
          className="title-progress-row caocao"
          data-line="caocao"
          data-qa="cc-progress-row"
        >
          <span className="tp-name">曹操列傳</span>
          <span className={`tp-status ${statusClass(cc)}`} data-status={cc} data-qa="cc-status">
            {cc}
          </span>
        </div>
      </div>

      <div className="btn-row title-enter">
        <button type="button" className="btn btn-primary" onClick={onNew}>
          開啟列傳
        </button>
        <button type="button" className="btn" disabled={!hasSave} onClick={onContinue}>
          繼續
        </button>
      </div>
      <div className="btn-row title-enter" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn"
          data-qa="save-slots-entry"
          onClick={onOpenSaveSlots}
        >
          讀取／存檔
        </button>
        <button
          type="button"
          className={`btn${mapOk ? "" : " locked"}`}
          data-qa="world-map-entry"
          disabled={!mapOk}
          title={mapOk ? "天下圖" : "關羽初章既竟後可開"}
          onClick={() => {
            if (!mapOk) return;
            onOpenWorldMap();
          }}
        >
          天下圖
        </button>
        <button
          type="button"
          className="btn"
          data-qa="settings-entry"
          onClick={onOpenSettings}
        >
          設定
        </button>
        <button
          type="button"
          className={`btn${fourOk ? "" : " locked"}`}
          data-qa="four-roads-entry"
          disabled={!fourOk}
          title={fourOk ? "四路總覽" : fourHint}
          onClick={() => {
            if (!fourOk) return;
            setFourGreyQa(false);
            onOpenFourRoads();
          }}
        >
          四路總覽
        </button>
        <button
          type="button"
          className={`btn${fiveOk ? "" : " locked"}`}
          data-qa="five-roads-entry"
          disabled={!fiveOk}
          title={fiveOk ? "五路總覽" : fiveHint}
          onClick={() => {
            if (!fiveOk) return;
            setFiveGreyQa(false);
            onOpenFiveRoads();
          }}
        >
          五路總覽
        </button>
      </div>
      {!fourOk && (
        <p
          className={`title-lock-hint title-enter four-roads-lock-hint${fourGreyQa ? " qa-grey" : ""}`}
          data-qa="four-roads-lock-hint"
          data-grey-qa={fourGreyQa ? "1" : "0"}
        >
          {fourGreyQa ? "【灰態測試】" : ""}
          {fourHint}
        </p>
      )}
      {!fiveOk && (
        <p
          className={`title-lock-hint title-enter five-roads-lock-hint${fiveGreyQa ? " qa-grey" : ""}`}
          data-qa="five-roads-lock-hint"
          data-grey-qa={fiveGreyQa ? "1" : "0"}
        >
          {fiveGreyQa ? "【灰態測試】" : ""}
          {fiveHint}
        </p>
      )}
      <div className="btn-row title-enter" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn title-second-btn"
          data-qa="second-chronicle"
          onClick={onSecondChronicle}
        >
          趙雲列傳
        </button>
        <button
          type="button"
          className="btn"
          data-qa="zhangfei-chronicle"
          onClick={onZhangFei}
        >
          張飛列傳
        </button>
        <button
          type="button"
          className="btn"
          data-qa="zhuge-chronicle"
          onClick={onZhuge}
        >
          諸葛亮列傳
        </button>
        <button
          type="button"
          className="btn"
          data-qa="liubei-chronicle"
          onClick={onLiubei}
        >
          劉備列傳
        </button>
        <button
          type="button"
          className="btn"
          data-qa="caocao-chronicle"
          onClick={onCaocao}
        >
          曹操列傳
        </button>
        <button
          type="button"
          className={`btn title-confluence-btn${unlocked ? "" : " locked"}`}
          data-qa="confluence-entry"
          disabled={!unlocked}
          title={unlocked ? "匯合篇" : lockHint}
          onClick={() => {
            if (!unlocked) return;
            onConfluence();
          }}
        >
          匯合篇
        </button>
      </div>
      {!unlocked && (
        <>
          <p className="title-lock-hint title-enter" data-qa="confluence-lock-hint">
            {lockHint}
          </p>
          <button
            type="button"
            className="btn title-qa-unlock title-enter"
            data-qa="qa-unlock-both"
            onClick={() => {
              patchProgress({
                ch1Started: true,
                ch1Clear: true,
                ch2Started: true,
                ch2Clear: true,
              });
              bump((n) => n + 1);
            }}
          >
            雙線既竟測試開局
          </button>
        </>
      )}
      {!mapOk && (
        <button
          type="button"
          className="btn title-qa-unlock title-enter"
          data-qa="qa-unlock-world"
          onClick={() => {
            // Only 關羽既竟 → map open with 常山／合流 grey
            patchProgress({ ch1Started: true, ch1Clear: true });
            bump((n) => n + 1);
          }}
        >
          天下圖測試開局
        </button>
      )}
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-world-map-grey"
        onClick={() => {
          onOpenWorldMapGrey();
        }}
      >
        天下圖灰態測試
      </button>
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-start-zhangfei"
        onClick={() => {
          patchProgress({ ch3Started: true });
          bump((n) => n + 1);
          onZhangFei();
        }}
      >
        張飛短線測試
      </button>
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-start-zhuge"
        onClick={() => {
          patchProgress({ ch4Started: true });
          bump((n) => n + 1);
          onZhuge();
        }}
      >
        諸葛短線測試
      </button>
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-start-liubei"
        onClick={() => {
          patchProgress({ ch5Started: true });
          bump((n) => n + 1);
          onLiubei();
        }}
      >
        劉備短線測試
      </button>
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-start-caocao"
        onClick={() => {
          patchProgress({ ch6Started: true });
          bump((n) => n + 1);
          onCaocao();
        }}
      >
        曹操短線測試
      </button>
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-start-bounty"
        onClick={() => {
          onBountyQa();
        }}
      >
        懸賞測試
      </button>
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-four-roads-grey"
        onClick={() => {
          setFourGreyQa(true);
          bump((n) => n + 1);
        }}
      >
        四路總覽灰態測試
      </button>
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-five-roads-grey"
        onClick={() => {
          setFiveGreyQa(true);
          bump((n) => n + 1);
        }}
      >
        五路總覽灰態測試
      </button>
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-mastery-stars"
        onClick={() => {
          qaMaxMastery("inquire");
          qaMaxMastery("challenge");
          qaMaxMastery("provoke");
          qaMaxMastery("purchase");
          bump((n) => n + 1);
        }}
      >
        路徑熟練★測試
      </button>
      <button
        type="button"
        className="btn title-qa-unlock title-enter"
        data-qa="qa-party4"
        onClick={() => {
          patchProgress({
            ch1Started: true,
            ch1Clear: true,
            ch2Started: true,
            ch2Clear: true,
            ch3Started: true,
            ch3Clear: true,
          });
          bump((n) => n + 1);
        }}
      >
        四人編隊解鎖測試
      </button>
    </section>
  );
}

/** Three save-slot panel — load / save / overwrite confirm + gold feedback. */
export function SaveSlotsPanel({
  currentSave,
  onBack,
  onLoaded,
}: {
  currentSave: GameSave | null;
  onBack: () => void;
  onLoaded: (save: GameSave) => void;
}) {
  const [, bump] = useState(0);
  const slots = listSlots();
  const active = getActiveSlot();
  const [confirmOverwrite, setConfirmOverwrite] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackReady, setFeedbackReady] = useState(false);
  const pendingAfter = useRef<(() => void) | null>(null);
  const readyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (readyTimer.current != null) window.clearTimeout(readyTimer.current);
    };
  }, []);

  /** Fullscreen gold 「已存檔／已讀取」 — portal + ready gate (已讀取 ≥3.5s for screenshot). */
  function showFeedback(msg: string, after?: () => void) {
    if (readyTimer.current != null) window.clearTimeout(readyTimer.current);
    pendingAfter.current = after ?? null;
    setFeedback(msg);
    setFeedbackReady(false);
    const holdMs = msg === "已讀取" ? 3500 : 2000;
    readyTimer.current = window.setTimeout(() => {
      setFeedbackReady(true);
      readyTimer.current = null;
    }, holdMs);
  }

  function dismissFeedback() {
    if (!feedbackReady) return;
    const after = pendingAfter.current;
    pendingAfter.current = null;
    setFeedback(null);
    setFeedbackReady(false);
    after?.();
  }

  function doSave(index: number) {
    if (!currentSave) {
      showFeedback("無進行中存檔可寫");
      return;
    }
    writeSlot(index, currentSave);
    setConfirmOverwrite(null);
    bump((n) => n + 1);
    showFeedback("已存檔");
  }

  function requestSave(index: number) {
    if (!currentSave) {
      showFeedback("請先開始或讀取一局再存");
      return;
    }
    if (slotIsOccupied(index)) {
      setConfirmOverwrite(index);
      return;
    }
    doSave(index);
  }

  function doLoad(slot: SlotInfo) {
    if (slot.empty || !slot.save) return;
    setActiveSlot(slot.index);
    const loaded = slot.save;
    // Hold gold 「已讀取」 ≥2s before entering world — screenshot-safe.
    showFeedback("已讀取", () => onLoaded(loaded));
  }

  return (
    <section className="screen select-stage" data-qa="save-slots-panel">
      <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-title.png)", opacity: 0.45 }} />
      <div className="select-inner">
        <div className="sheet gold-frame save-slots-sheet" style={{ margin: "24px auto", maxWidth: 480 }}>
          <h1 style={{ marginTop: 0 }}>讀取／存檔</h1>
          <p className="save-slots-hint">三個存檔槽。寫入非空槽需二次確認。</p>
          <div className="save-slots-list">
            {slots.map((slot) => (
              <div
                key={slot.index}
                className={`save-slot-card gold-frame${slot.empty ? " empty" : ""}${active === slot.index ? " active" : ""}`}
                data-qa={`save-slot-${slot.index}`}
                data-empty={slot.empty ? "1" : "0"}
              >
                <div className="save-slot-head">
                  <b>{slot.name}</b>
                  {active === slot.index && <span className="save-slot-active-tag">使用中</span>}
                </div>
                <div className="save-slot-summary">{slot.empty ? "空" : slot.summary}</div>
                <div className="save-slot-time">{slot.empty ? "空" : slot.timestamp}</div>
                <div className="btn-row save-slot-actions">
                  <button
                    type="button"
                    className="btn"
                    disabled={slot.empty || Boolean(feedback)}
                    data-qa={`load-slot-${slot.index}`}
                    onClick={() => doLoad(slot)}
                  >
                    讀取
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={Boolean(feedback)}
                    data-qa={`save-slot-btn-${slot.index}`}
                    onClick={() => requestSave(slot.index)}
                  >
                    存檔
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn" disabled={Boolean(feedback)} onClick={onBack}>
              返回
            </button>
          </div>
        </div>
      </div>

      {confirmOverwrite != null && !feedback && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="覆蓋確認" data-qa="overwrite-confirm">
          <div className="sheet gold-frame">
            <h2>覆蓋存檔？</h2>
            <p>存檔{["一", "二", "三"][confirmOverwrite]}已有資料，確定覆寫？</p>
            <div className="list-btns">
              <button type="button" className="btn" onClick={() => setConfirmOverwrite(null)}>
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-qa="overwrite-yes"
                onClick={() => doSave(confirmOverwrite)}
              >
                確定覆蓋
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback &&
        createPortal(
          <div
            className="overnight-veil save-feedback-veil"
            role="status"
            aria-live="polite"
            data-qa="save-feedback"
            data-feedback={feedback}
            data-ready={feedbackReady ? "1" : "0"}
          >
            <div className="overnight-popup" aria-label={feedback}>
              <div className="overnight-popup-kicker">存檔槽</div>
              <div className="overnight-popup-title">{feedback}</div>
              <div className="overnight-popup-sub">
                {feedback === "已讀取" ? "讀取完成・可繼續列傳・請截圖後按確定" : "資料已寫入本地"}
              </div>
              <p className="save-feedback-hold-hint" aria-hidden={feedbackReady}>
                {feedbackReady ? "可按確定" : "……請稍候"}
              </p>
              <button
                type="button"
                className="btn btn-primary save-feedback-ok"
                data-qa="save-feedback-ok"
                disabled={!feedbackReady}
                onClick={dismissFeedback}
              >
                確定
              </button>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

const WORLD_NODES: { id: WorldNodeId; name: string; blurb: string; x: string; y: string }[] = [
  { id: "xinyue", name: "新野", blurb: "關羽列傳", x: "18%", y: "58%" },
  { id: "changshan", name: "常山驛", blurb: "趙雲列傳", x: "42%", y: "32%" },
  { id: "merge", name: "合流", blurb: "匯合篇", x: "68%", y: "48%" },
  { id: "wolong", name: "臥龍岡", blurb: "諸葛亮列傳", x: "88%", y: "28%" },
];

/** 天下圖 — nodes unlock by meta progress (progressive; grey = locked). */
export function WorldMapPanel({
  onBack,
  onTravel,
  previewProgress,
}: {
  onBack: () => void;
  onTravel: (node: WorldNodeId) => void;
  /** Optional override (QA grey capture — only 新野 unlocked). */
  previewProgress?: MetaProgress | null;
}) {
  const progress = previewProgress ?? loadProgress();
  const qaGrey = Boolean(previewProgress);
  return (
    <section
      className="screen select-stage"
      data-qa="world-map-panel"
      data-qa-grey={qaGrey ? "1" : "0"}
    >
      <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-title.png)", opacity: 0.4 }} />
      <div className="select-inner">
        <div className="sheet gold-frame world-map-sheet" style={{ margin: "24px auto", maxWidth: 520 }}>
          <h1 style={{ marginTop: 0 }}>天下圖</h1>
          <p className="world-map-hint">
            點已解鎖節點前往對應列傳／場景。灰態為未解鎖。
            {qaGrey ? "（灰態測試：僅新野解鎖）" : ""}
          </p>
          <div className="world-map-canvas" data-qa="world-map-canvas">
            <div className="world-map-path" aria-hidden="true" />
            {WORLD_NODES.map((n) => {
              const open = worldNodeUnlocked(n.id, progress);
              const hint = open ? n.blurb : worldNodeLockHint(n.id, progress);
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`world-node${open ? " unlocked" : " locked"}`}
                  style={{ left: n.x, top: n.y }}
                  data-qa={`world-node-${n.id}`}
                  data-unlocked={open ? "1" : "0"}
                  disabled={!open}
                  title={open ? n.name : `${n.name}・${hint}`}
                  onClick={() => {
                    if (!open) return;
                    onTravel(n.id);
                  }}
                >
                  <span className="world-node-dot" />
                  <span className="world-node-label">{n.name}</span>
                  <span className="world-node-blurb">{hint}</span>
                </button>
              );
            })}
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn" onClick={onBack}>
              返回
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ChronicleConfirm({
  chronicleId = SECOND_CHRONICLE_ID,
  onConfirm,
  onBack,
}: {
  chronicleId?: ChronicleId;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const def = CHRONICLES[chronicleId] ?? CHRONICLES[SECOND_CHRONICLE_ID];
  const hero = heroById(def.heroId);
  const partner = def.partnerId ? heroById(def.partnerId) : null;
  const isConfluence = chronicleId === CONFLUENCE_ID;
  const isZhangFei = chronicleId === ZHANGFEI_CHRONICLE_ID;
  const isZhuge = chronicleId === ZHUGE_CHRONICLE_ID;
  const isLiubei = chronicleId === LIUBEI_CHRONICLE_ID;
  const isCaocao = chronicleId === CAOCAO_CHRONICLE_ID;
  const qa = isConfluence
    ? "confluence-confirm"
    : isZhangFei
      ? "zhangfei-confirm"
      : isZhuge
        ? "zhuge-confirm"
        : isLiubei
          ? "liubei-confirm"
          : isCaocao
            ? "caocao-confirm"
            : "chronicle-confirm";
  const departQa = isConfluence
    ? "confluence-depart"
    : isZhangFei
      ? "zhangfei-depart"
      : isZhuge
        ? "zhuge-depart"
        : isLiubei
          ? "liubei-depart"
          : isCaocao
            ? "caocao-depart"
            : "chronicle-depart";
  return (
    <section className="screen select-stage" data-qa={qa}>
      <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-title.png)", opacity: 0.45 }} />
      <div className="select-inner">
        <div className="sheet gold-frame chronicle-confirm-sheet" style={{ margin: "24px auto", maxWidth: 440 }}>
          <h1 style={{ marginTop: 0 }}>{def.title}</h1>
          <div className={`chronicle-portraits${partner ? " duo" : ""}`}>
            <img
              className="chronicle-confirm-portrait"
              src={hero.portrait}
              alt={hero.name}
              width={120}
              height={160}
            />
            {partner && (
              <img
                className="chronicle-confirm-portrait"
                src={partner.portrait}
                alt={partner.name}
                width={120}
                height={160}
              />
            )}
          </div>
          <b style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--gold)" }}>
            {partner ? `${hero.name}・${partner.name}` : `${hero.name} · ${hero.title}`}
          </b>
          <p className="chronicle-confirm-summary">{def.summary}</p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={onBack}>
              返回
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-qa={departQa}
              onClick={onConfirm}
            >
              動身
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CharacterSelect({
  picked,
  onPick,
  onStart,
  onBack,
}: {
  picked: string | null;
  onPick: (id: string) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const hero = HEROES.find((h) => h.id === picked);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-card", {
          autoAlpha: 0,
          y: 16,
          duration: 0.45,
          stagger: 0.04,
          ease: "power2.out",
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <section ref={root} className="screen select-stage">
      <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-title.png)", opacity: 0.45 }} />
      <div className="select-inner">
        <h1>選擇開局英雄</h1>
        <p>每位英雄有自己的路徑行動與戰技。第一章都會到新野。</p>
        <div className="select-grid">
          {HEROES.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`hero-card${picked === h.id ? " on" : ""}`}
              onClick={() => onPick(h.id)}
              aria-pressed={picked === h.id}
            >
              <img src={h.portrait} alt={h.name} width={240} height={320} />
              <figcaption>
                <strong>{h.name}</strong>
                <span>
                  {h.title} · {h.jobName} · {h.pathActionName}
                </span>
              </figcaption>
            </button>
          ))}
        </div>
        {hero && (
          <div className="gold-frame chip" style={{ marginTop: 12 }}>
            <b>
              {hero.name} · {hero.pathActionName}
            </b>
            <div style={{ marginTop: 6, lineHeight: 1.55 }}>{hero.bio}</div>
            <div style={{ marginTop: 6, color: "var(--muted)" }}>{hero.opening}</div>
          </div>
        )}
        <div className="btn-row" style={{ marginTop: 12, paddingBottom: 24 }}>
          <button type="button" className="btn" onClick={onBack}>
            返回
          </button>
          <button type="button" className="btn btn-primary" disabled={!picked} onClick={onStart}>
            動身
          </button>
        </div>
      </div>
    </section>
  );
}

/** Settings — music/SFX mute flags + gold 「已套用」 ≥1.5s. */
export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [feedback, setFeedback] = useState(false);
  const [feedbackReady, setFeedbackReady] = useState(false);
  const readyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (readyTimer.current != null) window.clearTimeout(readyTimer.current);
    };
  }, []);

  function apply() {
    writeAndShow(settings);
  }

  function writeAndShow(next: GameSettings) {
    patchSettings(next);
    setSettings(next);
    if (readyTimer.current != null) window.clearTimeout(readyTimer.current);
    setFeedback(true);
    setFeedbackReady(false);
    readyTimer.current = window.setTimeout(() => {
      setFeedbackReady(true);
      readyTimer.current = null;
    }, 1600);
  }

  function toggle(key: "music" | "sfx") {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
  }

  return (
    <section className="screen select-stage" data-qa="settings-panel">
      <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-title.png)", opacity: 0.45 }} />
      <div className="select-inner">
        <div className="sheet gold-frame settings-sheet" style={{ margin: "24px auto", maxWidth: 420 }}>
          <h1 style={{ marginTop: 0 }}>設定</h1>
          <p className="settings-hint">音樂／音效開關（無素材時亦以旗標切換按鈕狀態）。</p>
          <div className="settings-rows">
            <div className="settings-row gold-frame chip">
              <span>音樂</span>
              <button
                type="button"
                className={`btn${settings.music ? " btn-primary" : ""}`}
                data-qa="settings-music"
                data-on={settings.music ? "1" : "0"}
                onClick={() => toggle("music")}
              >
                {settings.music ? "開" : "關"}
              </button>
            </div>
            <div className="settings-row gold-frame chip">
              <span>音效</span>
              <button
                type="button"
                className={`btn${settings.sfx ? " btn-primary" : ""}`}
                data-qa="settings-sfx"
                data-on={settings.sfx ? "1" : "0"}
                onClick={() => toggle("sfx")}
              >
                {settings.sfx ? "開" : "關"}
              </button>
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button type="button" className="btn" disabled={feedback} onClick={onBack}>
              返回
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-qa="settings-apply"
              disabled={feedback}
              onClick={apply}
            >
              套用
            </button>
          </div>
        </div>
      </div>

      {feedback &&
        createPortal(
          <div
            className="overnight-veil save-feedback-veil"
            role="status"
            aria-live="polite"
            data-qa="settings-applied"
            data-ready={feedbackReady ? "1" : "0"}
          >
            <div className="overnight-popup" aria-label="已套用">
              <div className="overnight-popup-kicker">設定</div>
              <div className="overnight-popup-title">已套用</div>
              <div className="overnight-popup-sub">
                音樂 {settings.music ? "開" : "關"} · 音效 {settings.sfx ? "開" : "關"}
              </div>
              <p className="save-feedback-hold-hint" aria-hidden={feedbackReady}>
                {feedbackReady ? "可按確定" : "……請稍候"}
              </p>
              <button
                type="button"
                className="btn btn-primary save-feedback-ok"
                data-qa="settings-applied-ok"
                disabled={!feedbackReady}
                onClick={() => {
                  if (!feedbackReady) return;
                  setFeedback(false);
                  setFeedbackReady(false);
                }}
              >
                確定
              </button>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

/** Party of 4 select — dark gold frame; selected highlight; locked grey. */
export function PartySelectPanel({
  currentParty,
  heroId,
  onConfirm,
  onBack,
}: {
  currentParty: string[];
  heroId: string;
  onConfirm: (party: string[]) => void;
  onBack: () => void;
}) {
  const progress = loadProgress();
  const unlocked = new Set(unlockedTravelerIds(progress));
  // Ensure current party members and hero are selectable
  unlocked.add(heroId);
  for (const id of currentParty) unlocked.add(id);
  const cap = maxPartySize(progress);
  const fourOk = partyOfFourUnlocked(progress);
  const [picked, setPicked] = useState<string[]>(() => {
    const base = currentParty.length ? [...currentParty] : [heroId];
    if (!base.includes(heroId)) base.unshift(heroId);
    return base.slice(0, cap);
  });

  function toggle(id: string) {
    if (!unlocked.has(id)) return;
    if (id === heroId) return; // lead locked in
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= cap) return prev;
      return [...prev, id];
    });
  }

  return (
    <section className="screen select-stage" data-qa="party-select-panel">
      <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-title.png)", opacity: 0.4 }} />
      <div className="select-inner">
        <div className="sheet gold-frame party-select-sheet" style={{ margin: "24px auto", maxWidth: 520 }}>
          <h1 style={{ marginTop: 0 }}>編隊</h1>
          <p className="party-select-hint">
            {fourOk
              ? `已既竟旅人 ≥3，最多 ${cap} 人同行。出手順序最多四人。`
              : `目前最多 ${cap} 人。既竟三線後可編成四人。`}
          </p>
          <div className="party-select-grid" data-qa="party-select-grid">
            {HEROES.map((h) => {
              const open = unlocked.has(h.id);
              const on = picked.includes(h.id);
              const lead = h.id === heroId;
              return (
                <button
                  key={h.id}
                  type="button"
                  className={`party-card gold-frame${on ? " selected" : ""}${open ? "" : " locked"}${lead ? " lead" : ""}`}
                  data-qa={`party-card-${h.id}`}
                  data-unlocked={open ? "1" : "0"}
                  data-selected={on ? "1" : "0"}
                  disabled={!open}
                  onClick={() => toggle(h.id)}
                  title={open ? h.name : "未解鎖"}
                >
                  <img src={h.portrait} alt={h.name} width={72} height={96} />
                  <span className="party-card-name">{h.name}</span>
                  <span className="party-card-job">{h.jobName}</span>
                  {lead && <span className="party-card-lead">主</span>}
                  {on && !lead && <span className="party-card-check">✓</span>}
                </button>
              );
            })}
          </div>
          <div className="party-select-current gold-frame chip" data-qa="party-select-current">
            出手順序：{picked.map((id) => heroById(id).name).join("・")}（{picked.length}/{cap}）
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn" onClick={onBack}>
              返回
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-qa="party-select-confirm"
              onClick={() => onConfirm(picked.slice(0, cap))}
            >
              確定編隊
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 四路總覽 — unlocked when 關趙張諸 all 初章既竟; holds 「四路初章既竟」 ≥2.5s. */
export function FourRoadsPanel({ onBack }: { onBack: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 2500);
    return () => window.clearTimeout(t);
  }, []);
  const rows = [
    { name: "關羽", blurb: "義氣破北營，青龍刀定新野。" },
    { name: "趙雲", blurb: "白馬銀槍，護民於常山平野。" },
    { name: "張飛", blurb: "燕人虎威，喝退鎮口黃巾。" },
    { name: "諸葛亮", blurb: "臥龍出山，以計破偽軍師。" },
  ];
  return (
    <section className="screen select-stage" data-qa="four-roads-panel">
      <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-title.png)", opacity: 0.4 }} />
      <div className="select-inner">
        <div className="sheet gold-frame four-roads-sheet" style={{ margin: "24px auto", maxWidth: 480 }}>
          <h1 className="four-roads-title" data-qa="four-roads-title" style={{ marginTop: 0, color: "var(--gold)" }}>
            四路初章既竟
          </h1>
          <p className="four-roads-hold-hint" aria-hidden={ready}>
            {ready ? "" : "……"}
          </p>
          <ul className="four-roads-list" data-qa="four-roads-list">
            {rows.map((r) => (
              <li key={r.name} className="four-roads-row gold-frame chip">
                <b>{r.name}</b>
                <span>{r.blurb}</span>
              </li>
            ))}
          </ul>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button
              type="button"
              className="btn btn-primary"
              data-qa="four-roads-close"
              disabled={!ready}
              onClick={() => {
                if (!ready) return;
                onBack();
              }}
            >
              返回標題
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 五路總覽 — unlocked when 關趙張諸劉 all 初章既竟; holds 「五路初章既竟」 ≥2.5s. */
export function FiveRoadsPanel({ onBack }: { onBack: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 2500);
    return () => window.clearTimeout(t);
  }, []);
  const rows = [
    { name: "關羽", blurb: "義氣破北營，青龍刀定新野。" },
    { name: "趙雲", blurb: "白馬銀槍，護民於常山平野。" },
    { name: "張飛", blurb: "燕人虎威，喝退鎮口黃巾。" },
    { name: "諸葛亮", blurb: "臥龍出山，以計破偽軍師。" },
    { name: "劉備", blurb: "桃園之誓，拔鄉霸而安民。" },
  ];
  return (
    <section className="screen select-stage" data-qa="five-roads-panel">
      <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-title.png)", opacity: 0.4 }} />
      <div className="select-inner">
        <div className="sheet gold-frame five-roads-sheet" style={{ margin: "24px auto", maxWidth: 480 }}>
          <h1 className="five-roads-title" data-qa="five-roads-title" style={{ marginTop: 0, color: "var(--gold)" }}>
            五路初章既竟
          </h1>
          <p className="five-roads-hold-hint" aria-hidden={ready}>
            {ready ? "" : "……"}
          </p>
          <ul className="five-roads-list" data-qa="five-roads-list">
            {rows.map((r) => (
              <li key={r.name} className="five-roads-row gold-frame chip">
                <b>{r.name}</b>
                <span>{r.blurb}</span>
              </li>
            ))}
          </ul>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button
              type="button"
              className="btn btn-primary"
              data-qa="five-roads-close"
              disabled={!ready}
              onClick={() => {
                if (!ready) return;
                onBack();
              }}
            >
              返回標題
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

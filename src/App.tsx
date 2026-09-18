import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BattleView from "./components/BattleView.tsx";
import DialogueBox from "./components/DialogueBox.tsx";
import MenuOverlay from "./components/MenuOverlay.tsx";
import TitleScreen, {
  CharacterSelect,
  ChronicleConfirm,
  FourRoadsPanel,
  FiveRoadsPanel,
  PartySelectPanel,
  SaveSlotsPanel,
  SettingsPanel,
  WorldMapPanel,
} from "./components/TitleScreen.tsx";
import WorldView, { npcPortrait, visibleNpcs } from "./components/WorldView.tsx";
import { sfx, unlockAudio } from "./game/audio.ts";
import { addClue, addJournal, loadSave, newSave, recruitCompanion, recruitThird, restParty, setPartyMembers, vitalsFor, writeSave } from "./game/save.ts";
import {
  applyVitals,
  battleLoot,
  createBattle,
} from "./game/combat.ts";
import {
  bossIntro,
  childRescueLines,
  endingFor,
  gateClearLines,
  openingFor,
  recruitLines,
  thirdRecruitLines,
} from "./game/chapters.ts";
import {
  CHRONICLES,
  CONFLUENCE_ID,
  ZHANGFEI_CHRONICLE_ID,
  ZHUGE_CHRONICLE_ID,
  LIUBEI_CHRONICLE_ID,
  CAOCAO_CHRONICLE_ID,
  confluenceOpening,
  newConfluenceSave,
  newSecondChronicleSave,
  newZhangFeiSave,
  newZhugeSave,
  newLiubeiSave,
  nightTalkLines,
  secondChronicleOpening,
  zhangfeiOpening,
  zhugeOpening,
  liubeiOpening,
  caocaoOpening,
  newCaocaoSave,
} from "./game/chronicles.ts";
import {
  confluenceUnlocked,
  patchProgress,
  qaGreyMapProgress,
  syncProgressFromSave,
  worldMapUnlocked,
  type MetaProgress,
  type WorldNodeId,
} from "./game/progress.ts";
import {
  effectiveMastery,
  masteryHint,
  masteryStars,
  masteryStarsText,
  recordPathSuccess,
} from "./game/pathMastery.ts";
import { PARTNER, PATH_LABEL, heroById } from "./game/data.ts";
import { ITEMS, expToNext, itemById, isEquippable } from "./game/items.ts";
import { DELTA } from "./game/view.ts";
import { blockedTile, isFieldMinibossTile, isMergeMinibossTile, isNfieldMinibossTile, isTgardenMinibossTile, isXroadMinibossTile, isZgateMinibossTile, mapById, tileAt } from "./game/maps.ts";
import { logWeaknesses, performPathAction, previewPathAction, talkLinesFor } from "./game/pathAction.ts";
import type { BattleState, DialogueLine, Dir, GameSave, MapId, PathAction, Screen, TownNpc } from "./game/types.ts";

function persist(s: GameSave): GameSave {
  writeSave(s);
  return s;
}

function gainExp(save: GameSave, exp: number, gold: number): GameSave {
  const next = structuredClone(save);
  next.gold += gold;
  next.exp += exp;
  while (next.level < 5 && next.exp >= expToNext(next.level)) {
    next.exp -= expToNext(next.level);
    next.level += 1;
  }
  return next;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [save, setSave] = useState<GameSave | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [lines, setLines] = useState<DialogueLine[]>([]);
  const [lineAt, setLineAt] = useState(0);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [battleBg, setBattleBg] = useState("./art/bg-battle.png");
  const [pendingEnemies, setPendingEnemies] = useState<string[]>([]);
  const [pendingKind, setPendingKind] = useState<BattleState["kind"]>("skirmish");
  const [menu, setMenu] = useState(false);
  const [pathNpc, setPathNpc] = useState<TownNpc | null>(null);
  const [pathConfirm, setPathConfirm] = useState<keyof typeof PATH_LABEL | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [battleFx, setBattleFx] = useState<"in" | "out" | null>(null);
  const [lootPopup, setLootPopup] = useState<string | null>(null);
  const [failBanner, setFailBanner] = useState<string | null>(null);
  const [overnight, setOvernight] = useState(false);
  const [restHeals, setRestHeals] = useState<{ name: string; hp: number; sp: number }[] | null>(null);
  const [chapterClear, setChapterClear] = useState<{
    title: string;
    names: string[];
    offerSecond?: boolean;
    offerConfluence?: boolean;
  } | null>(null);
  const [nightTalk, setNightTalk] = useState<DialogueLine[] | null>(null);
  const [nightTalkAt, setNightTalkAt] = useState(0);
  const [nightDeep, setNightDeep] = useState(false);
  /** Buttons stay locked ≥2.5s so 「北營既破」 is screenshot-safe. */
  const [chapterClearReady, setChapterClearReady] = useState(false);
  /** Bounty board: accept confirm / turn-in complete veil. */
  const [bountyPanel, setBountyPanel] = useState<"accept" | "complete" | null>(null);
  const [bountyReady, setBountyReady] = useState(false);
  /** QA / preview progress for 天下圖 grey capture (does not write meta). */
  const [worldMapPreview, setWorldMapPreview] = useState<MetaProgress | null>(null);
  const [travelBanner, setTravelBanner] = useState(false);
  const [tipPage, setTipPage] = useState<number | null>(null);
  const travelFromRef = useRef<WorldNodeId | null>(null);
  const [pendingEnding, setPendingEnding] = useState<DialogueLine[] | null>(null);
  const [preBattle, setPreBattle] = useState<{ name: string; threat: string } | null>(null);
  const [pendingPreBattle, setPendingPreBattle] = useState<{ name: string; threat: string } | null>(null);

  const hasSave = useMemo(() => Boolean(loadSave()), [screen]);
  const map = save ? mapById(save.mapId) : null;
  const line = lines[lineAt];

  function say(next: DialogueLine[]) {
    setLines(next);
    setLineAt(0);
  }

  const lootTimerRef = useRef<number | null>(null);
  const failTimerRef = useRef<number | null>(null);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  }

  /** Failure banner ≥2s, huge UI — must survive static screenshots (not log-only). */
  function showFail(msg: string) {
    if (failTimerRef.current != null) window.clearTimeout(failTimerRef.current);
    setFailBanner(msg);
    failTimerRef.current = window.setTimeout(() => {
      setFailBanner(null);
      failTimerRef.current = null;
    }, 2200);
  }

  /** Gold loot popup ≥2.5s, center / topmost — must survive static screenshots. */
  function showLoot(msg: string) {
    if (lootTimerRef.current != null) window.clearTimeout(lootTimerRef.current);
    setLootPopup(msg);
    lootTimerRef.current = window.setTimeout(() => {
      setLootPopup(null);
      lootTimerRef.current = null;
    }, 2600);
  }

  function showOvernight(heals?: { name: string; hp: number; sp: number }[], then?: () => void) {
    setOvernight(true);
    // Center gold 「一夜過去」 must read like loot popup — hold ≥3s for mid-frame shots.
    window.setTimeout(() => {
      setOvernight(false);
      if (heals && heals.length) {
        setRestHeals(heals);
        window.setTimeout(() => setRestHeals(null), 2200);
      }
      then?.();
    }, 3200);
  }


  function beginNightTalk() {
    setNightTalk(nightTalkLines());
    setNightTalkAt(0);
  }

  function finishNightTalk(s: GameSave) {
    let next = structuredClone(s);
    // Small heal toward full vitals (not only log).
    for (const id of next.party) {
      const full = vitalsFor(id, next.level);
      const cur = next.vitals[id] ?? { hp: 0, sp: 0 };
      next.vitals[id] = {
        hp: Math.min(full.hp, cur.hp + Math.max(12, Math.floor(full.hp * 0.25))),
        sp: Math.min(full.sp, cur.sp + Math.max(4, Math.floor(full.sp * 0.25))),
      };
    }
    next.flags.nightTalkDone = true;
    next = addJournal(next, "night-talk");
    next.hour = (next.hour + 2) % 24;
    setSave(persist(next));
    setNightTalk(null);
    setNightTalkAt(0);
    setNightDeep(true);
    window.setTimeout(() => setNightDeep(false), 1800);
    flash("氣力稍復");
  }

  function advanceNightTalk() {
    if (!nightTalk || !save) return;
    if (nightTalkAt < nightTalk.length - 1) {
      setNightTalkAt((n) => n + 1);
      sfx.talk();
      return;
    }
    finishNightTalk(save);
  }

  function startBattle(s: GameSave, enemies: string[], kind: BattleState["kind"], bg: string) {
    let b = createBattle(s.party, enemies, kind, s.level, s.equip);
    b = applyVitals(b, s.vitals);
    for (const f of b.fighters) {
      if (!f.isPlayer && s.weaknessLog[f.defId]) f.revealed = true;
    }
    // Clear encounter meter when battle actually begins.
    if ((s.encounterFill ?? 0) > 0) {
      const cleared = persist({ ...s, encounterFill: 0 });
      setSave(cleared);
      s = cleared;
    }
    setPendingEnemies(enemies);
    setPendingKind(kind);
    setBattleBg(bg);
    setBattleFx("in");
    window.setTimeout(() => {
      setBattle(b);
      setScreen("battle");
      setBattleFx(null);
    }, 280);
  }

  /** Intro + pending miniboss + preBattle for 黃巾小帥 (button / B zone / NPC). */
  function startFieldMiniboss(at: GameSave) {
    if (at.flags.ch2Clear || at.mapId !== "field") return;
    say([
      {
        speaker: "黃巾小帥",
        portrait: "./art/portrait-bandit.png",
        text: "常山道從今日起歸我。白馬？拿來餵馬。",
      },
      {
        speaker: heroById(at.heroId).name,
        portrait: heroById(at.heroId).portrait,
        text: "百姓的路，不能交給你。",
      },
    ]);
    setPendingEnemies(["yellow", "lieutenant"]);
    setPendingKind("miniboss");
    setBattleBg("./art/bg-road.png");
    setPendingPreBattle({
      name: "黃巾小帥",
      threat: "小帥橫刀：想過平野，先過我這關。",
    });
  }


  /** Intro + pending miniboss for 黃巾渠帥殘黨 (confluence). */
  function startMergeMiniboss(at: GameSave) {
    if (at.flags.confluenceClear || at.mapId !== "merge") return;
    say([
      {
        speaker: "黃巾渠帥殘黨",
        portrait: "./art/portrait-boss.png",
        text: "新野與常山都滅不了你們？那就在這裡決。",
      },
      {
        speaker: heroById(at.heroId).name,
        portrait: heroById(at.heroId).portrait,
        text: "殘旗也要拔乾淨。",
      },
    ]);
    setPendingEnemies(["yellow", "remnant"]);
    setPendingKind("miniboss");
    setBattleBg("./art/bg-road.png");
    setPendingPreBattle({
      name: "黃巾渠帥殘黨",
      threat: "殘黨橫刀：合流官道，從今日起歸我。",
    });
  }

  /** Intro + pending miniboss for 黃巾鎮口頭目 (Zhang Fei). */
  function startZgateMiniboss(at: GameSave) {
    if (at.flags.ch3Clear || at.mapId !== "zgate") return;
    say([
      {
        speaker: "黃巾鎮口頭目",
        portrait: "./art/portrait-bandit.png",
        text: "鎮口從今日起歸我。燕人？嗓門再大也過不了這關。",
      },
      {
        speaker: heroById(at.heroId).name,
        portrait: heroById(at.heroId).portrait,
        text: "燕人張飛在此！誰敢攔路？",
      },
    ]);
    setPendingEnemies(["yellow", "gatechief"]);
    setPendingKind("miniboss");
    setBattleBg("./art/bg-road.png");
    setPendingPreBattle({
      name: "黃巾鎮口頭目",
      threat: "頭目橫刀：想過鎮口，先過我這關。",
    });
  }

  /** Intro + pending miniboss for 黃巾偽軍師 (Zhuge). Requires prior inquire. */
  function startNfieldMiniboss(at: GameSave) {
    if (at.flags.ch4Clear || at.mapId !== "nfield") return;
    if (!at.flags.ch4Inquired) {
      say([
        {
          speaker: "系統",
          text: "陣眼未明。先回臥龍岡探聽村老或書生，再來以計定勝負。",
        },
      ]);
      return;
    }
    say([
      {
        speaker: "黃巾偽軍師",
        portrait: "./art/portrait-boss.png",
        text: "臥龍？不過一介山野。陣眼已成，今日定叫你空手而歸。",
      },
      {
        speaker: heroById(at.heroId).name,
        portrait: heroById(at.heroId).portrait,
        text: "虛實已問清。火計落點，就在這一刻。",
      },
    ]);
    setPendingEnemies(["yellow", "schemer"]);
    setPendingKind("miniboss");
    setBattleBg("./art/bg-road.png");
    setPendingPreBattle({
      name: "黃巾偽軍師",
      threat: "偽軍師搖扇：計定勝負——看誰先破誰的陣。",
    });
  }

  
  /** Intro + pending miniboss for 黃巾鄉霸 (Liu Bei). */
  function startTgardenMiniboss(at: GameSave) {
    if (at.flags.ch5Clear || at.mapId !== "tgarden") return;
    say([
      {
        speaker: "黃巾鄉霸",
        portrait: "./art/portrait-bandit.png",
        text: "桃園的地，從今日起歸我。仁義？拿來餵馬。",
      },
      {
        speaker: heroById(at.heroId).name,
        portrait: heroById(at.heroId).portrait,
        text: "鄉里不可欺。今日便拔了你的旗。",
      },
    ]);
    setPendingEnemies(["yellow", "tyrant"]);
    setPendingKind("miniboss");
    setBattleBg("./art/bg-road.png");
    setPendingPreBattle({
      name: "黃巾鄉霸",
      threat: "鄉霸橫刀：想過桃園外，先過我這關。",
    });
  }

  function startXroadMiniboss(at: GameSave) {
    if (at.flags.ch6Clear || at.mapId !== "xroad") return;
    say([
      {
        speaker: "黃巾探馬頭目",
        portrait: "./art/portrait-bandit.png",
        text: "許昌官道的風聲，從今日起歸我。曹操？不過一丘之貉。",
      },
      {
        speaker: heroById(at.heroId).name,
        portrait: heroById(at.heroId).portrait,
        text: "官道之權，豈容爾輩探聽。今日收了你的旗。",
      },
    ]);
    setPendingEnemies(["yellow", "enforcer"]);
    setPendingKind("miniboss");
    setBattleBg("./art/bg-road.png");
    setPendingPreBattle({
      name: "黃巾探馬頭目",
      threat: "頭目橫刀：想過官道，先過我這關。",
    });
  }


  function startBountyOutlaw(at: GameSave) {
    if (!at.flags.bountyAccepted || at.flags.bountyTargetDown || at.flags.bountyDone) return;
    say([
      {
        speaker: "黃巾懸賞賊",
        portrait: "./art/portrait-bandit.png",
        text: "懸賞板上寫我？來拿賞的，先留下命。",
      },
      {
        speaker: heroById(at.heroId).name,
        portrait: heroById(at.heroId).portrait,
        text: "惡名在外，今日便清了。",
      },
    ]);
    setPendingEnemies(["yellow", "outlaw"]);
    setPendingKind("skirmish");
    setBattleBg("./art/bg-road.png");
    setPendingPreBattle({
      name: "黃巾懸賞賊",
      threat: "懸賞賊橫刀：賞銀是我的，命是你的。",
    });
  }


  const TIPS = [
    { title: "移動", body: "點地圖格子或方向鍵移動。靠近人物後可交談或發動路徑行動。" },
    { title: "路徑行動", body: "每位英雄有獨特路徑行動（探聽／威壓／徵購等），成功可問出弱點或改變局面。" },
    { title: "戰鬥削盾", body: "先攻擊敵方弱點削盾。盾盡後傷害暴增——別硬砍滿盾敵人。" },
  ] as const;

  function tipsSeen(): boolean {
    try {
      return typeof localStorage !== "undefined" && localStorage.getItem("ba-lu-tips-seen-v1") === "1";
    } catch {
      return false;
    }
  }

  function markTipsSeen() {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem("ba-lu-tips-seen-v1", "1");
    } catch {
      /* ignore */
    }
  }

  function maybeShowTips() {
    if (tipsSeen()) return;
    setTipPage(0);
  }

  function mapIdToWorldNode(mapId: string): WorldNodeId | null {
    if (mapId === "xinyue" || mapId === "inn" || mapId === "road" || mapId === "camp") return "xinyue";
    if (mapId === "yunzhen" || mapId === "field") return "changshan";
    if (mapId === "merge") return "merge";
    if (mapId === "wolong" || mapId === "nfield") return "wolong";
    return null;
  }

  function travelWithBanner(node: WorldNodeId, go: () => void) {
    const from = save ? mapIdToWorldNode(save.mapId) : travelFromRef.current;
    const cross = from !== node;
    travelFromRef.current = node;
    if (!cross) {
      go();
      return;
    }
    setTravelBanner(true);
    window.setTimeout(() => {
      setTravelBanner(false);
      go();
    }, 1200);
  }


function afterWin(prev: GameSave, finished: BattleState): GameSave {
    let next = structuredClone(prev);
    const loot = battleLoot(pendingEnemies);
    next = gainExp(next, loot.exp, loot.gold);
    for (const f of finished.fighters) {
      if (f.isPlayer) next.vitals[f.defId] = { hp: Math.max(1, f.hp), sp: f.sp };
    }
    // Soft encounter / gate loot: chance to drop leather armor once.
    if (
      (pendingKind === "skirmish" || pendingKind === "gate" || pendingKind === "miniboss") &&
      !next.flags.gotLeather &&
      (pendingEnemies.includes("bandit") ||
        pendingEnemies.includes("lieutenant") ||
        pendingEnemies.includes("officer") ||
        Math.random() < 0.35)
    ) {
      next.items["leather-armor"] = (next.items["leather-armor"] ?? 0) + 1;
      next.flags.gotLeather = true;
      showLoot("獲得 皮甲");
    }
    if (pendingEnemies.includes("outlaw") && next.flags.bountyAccepted && !next.flags.bountyDone) {
      next.flags.bountyTargetDown = true;
      next = addJournal(next, "bounty-hunt");
      flash("懸賞目標已除・回懸賞板交還");
    }
    if (pendingKind === "gate") {
      next.flags.cleared = true;
      next = addJournal(next, "gate");
      say(gateClearLines(next.heroId));
    } else if (pendingKind === "miniboss") {
      if (next.chronicleId === "liubei5" || pendingEnemies.includes("tyrant")) {
        next.flags.ch5Clear = true;
        next = addJournal(next, "ch5-clear");
        patchProgress({ ch5Clear: true, ch5Started: true });
        const clearTitle = CHRONICLES.liubei5.clearTitle;
        setPendingEnding([
          {
            speaker: heroById(next.heroId).name,
            portrait: heroById(next.heroId).portrait,
            text: "鄉霸的旗倒了。桃園外，百姓可再安一分。",
          },
          { speaker: "系統", text: "劉備列傳初章結束。仍可在桃園與園外活動。" },
        ]);
        setChapterClearReady(false);
        setChapterClear({
          title: clearTitle,
          names: next.party.map((id) => heroById(id).name),
        });
        window.setTimeout(() => setChapterClearReady(true), 2500);
      } else if (next.chronicleId === "caocao6" || pendingEnemies.includes("enforcer")) {
        next.flags.ch6Clear = true;
        next = addJournal(next, "ch6-clear");
        patchProgress({ ch6Clear: true, ch6Started: true });
        const clearTitle = CHRONICLES.caocao6.clearTitle;
        setPendingEnding([
          {
            speaker: heroById(next.heroId).name,
            portrait: heroById(next.heroId).portrait,
            text: "探馬的旗倒了。許昌官道的風聲，暫入袖中。",
          },
          { speaker: "系統", text: "曹操列傳初章結束。仍可在許昌郊與官道活動。" },
        ]);
        setChapterClearReady(false);
        setChapterClear({
          title: clearTitle,
          names: next.party.map((id) => heroById(id).name),
        });
        window.setTimeout(() => setChapterClearReady(true), 2500);
      } else if (next.chronicleId === "zhuge4" || pendingEnemies.includes("schemer")) {
        next.flags.ch4Clear = true;
        next = addJournal(next, "ch4-clear");
        patchProgress({ ch4Clear: true, ch4Started: true });
        const clearTitle = CHRONICLES.zhuge4.clearTitle;
        setPendingEnding([
          {
            speaker: heroById(next.heroId).name,
            portrait: heroById(next.heroId).portrait,
            text: "偽軍師的旗倒了。計定勝負——這一章，先記在列傳裡。",
          },
          { speaker: "系統", text: "諸葛亮列傳初章結束。仍可在臥龍岡與郊野活動。" },
        ]);
        setChapterClearReady(false);
        setChapterClear({
          title: clearTitle,
          names: next.party.map((id) => heroById(id).name),
        });
        window.setTimeout(() => setChapterClearReady(true), 2500);
      } else if (next.chronicleId === "zhangfei3" || pendingEnemies.includes("gatechief")) {
        next.flags.ch3Clear = true;
        next = addJournal(next, "ch3-clear");
        patchProgress({ ch3Clear: true, ch3Started: true });
        const clearTitle = CHRONICLES.zhangfei3.clearTitle;
        setPendingEnding([
          {
            speaker: heroById(next.heroId).name,
            portrait: heroById(next.heroId).portrait,
            text: "鎮口的黃旗倒了。這嗓門，夠他們聽一夜。",
          },
          { speaker: "系統", text: "張飛列傳初章結束。仍可在驛站與鎮口活動。" },
        ]);
        setChapterClearReady(false);
        setChapterClear({
          title: clearTitle,
          names: next.party.map((id) => heroById(id).name),
        });
        window.setTimeout(() => setChapterClearReady(true), 2500);
      } else if (next.chronicleId === "confluence" || pendingEnemies.includes("remnant")) {
        next.flags.confluenceClear = true;
        next = addJournal(next, "confluence-clear");
        patchProgress({ confluenceClear: true });
        setPendingEnding([
          {
            speaker: heroById("guanyu").name,
            portrait: heroById("guanyu").portrait,
            text: "殘旗倒了。關某與子龍，總算走到同一條路上。",
          },
          {
            speaker: heroById("zhaoyun").name,
            portrait: heroById("zhaoyun").portrait,
            text: "前路還長。這一夜，先記在列傳裡。",
          },
          { speaker: "系統", text: "匯合篇序章結束。可回標題，或在營火邊夜話。" },
        ]);
        setChapterClearReady(false);
        setChapterClear({
          title: "八路匯合・序章既竟",
          names: ["關羽", "趙雲"],
        });
        window.setTimeout(() => setChapterClearReady(true), 2500);
      } else {
        next.flags.ch2Clear = true;
        next = addJournal(next, "ch2-clear");
        patchProgress({ ch2Clear: true, ch2Started: true });
        const clearTitle = CHRONICLES[next.chronicleId ?? "zhaoyun2"]?.clearTitle ?? "趙雲列傳・初章既竟";
        setPendingEnding([
          {
            speaker: heroById(next.heroId).name,
            portrait: heroById(next.heroId).portrait,
            text: "平野的黃旗倒了。常山驛的燈，今夜可以再亮一寸。",
          },
          { speaker: "系統", text: "第二列傳初章結束。仍可在驛站與平野活動。" },
        ]);
        setChapterClearReady(false);
        const both = confluenceUnlocked();
        setChapterClear({
          title: clearTitle,
          names: next.party.map((id) => heroById(id).name),
          offerConfluence: both,
        });
        window.setTimeout(() => setChapterClearReady(true), 2500);
      }
    } else if (pendingKind === "boss") {
      next.flags.bossDown = true;
      next = addJournal(next, "boss");
      const partner = PARTNER[next.heroId];
      let endingLines = endingFor(next.heroId);
      if (partner && !next.party.includes(partner)) {
        next.party = [...next.party, partner];
        const h = heroById(partner);
        next.vitals[partner] = {
          hp: h.maxHp,
          sp: h.maxSp,
        };
        endingLines = [...recruitLines(next.heroId, partner), ...endingLines];
      }
      next.chapter = 2;
      setPendingEnding(endingLines);
      setChapterClearReady(false);
      patchProgress({ ch1Clear: true, ch1Started: true });
      setChapterClear({
        title: "北營既破",
        names: next.party.map((id) => heroById(id).name),
        offerSecond: true,
        offerConfluence: confluenceUnlocked(),
      });
      window.setTimeout(() => setChapterClearReady(true), 2500);
    } else if (pendingEnemies.includes("officer")) {
      next.flags.officerDown = true;
    }
    if (pendingEnemies.length && next.mapId === "road") next.flags.roadScouted = true;
    return persist(next);
  }

  const interactTarget = useCallback((s: GameSave): { npc?: TownNpc } => {
    const m = mapById(s.mapId);
    const [dx, dy] = DELTA[s.facing];
    const fx = s.x + dx;
    const fy = s.y + dy;
    const npcs = visibleNpcs(m, s);
    const npc =
      npcs.find((n) => n.x === fx && n.y === fy) ??
      npcs.find((n) => Math.abs(n.x - s.x) + Math.abs(n.y - s.y) === 1);
    return { npc };
  }, []);

  function move(dir: Dir) {
    if (!save || line || menu || pathNpc || overnight || chapterClear || nightTalk || nightDeep || screen !== "world") return;
    const m = mapById(save.mapId);
    const [dx, dy] = DELTA[dir];
    const x = save.x + dx;
    const y = save.y + dy;
    const ch = tileAt(m, x, y);
    if (blockedTile(ch)) {
      setSave({ ...save, facing: dir });
      return;
    }
    const npcs = visibleNpcs(m, save);
    const bump = npcs.find((n) => n.x === x && n.y === y);
    if (bump) {
      setSave({ ...save, facing: dir });
      if (save.mapId === "field" && bump.id === "yz-lieutenant" && !save.flags.ch2Clear) {
        startFieldMiniboss(save);
      }
      if (save.mapId === "merge" && bump.id === "merge-remnant" && !save.flags.confluenceClear) {
        startMergeMiniboss(save);
      }
      if (save.mapId === "zgate" && bump.id === "zf-gatechief" && !save.flags.ch3Clear) {
        startZgateMiniboss(save);
      }
      if (save.mapId === "nfield" && bump.id === "zg-schemer" && !save.flags.ch4Clear) {
        startNfieldMiniboss(save);
      }
      if (save.mapId === "tgarden" && bump.id === "lb-tyrant" && !save.flags.ch5Clear) {
        startTgardenMiniboss(save);
      }
      if (save.mapId === "xroad" && bump.id === "cc-enforcer" && !save.flags.ch6Clear) {
        startXroadMiniboss(save);
      }
      if (save.mapId === "road" && bump.id === "bounty-outlaw") {
        startBountyOutlaw(save);
      }
      return;
    }
    sfx.step();
    let next: GameSave = { ...save, x, y, facing: dir, steps: save.steps + 1 };
    if (save.mapId === "xinyue" && ch === "G" && !next.flags.cleared) {
      setSave(next);
      say([
        { speaker: "山賊頭目", portrait: "./art/portrait-bandit.png", text: "這城門從今夜起歸我們看。想過去，先留下錢與命。" },
        { speaker: heroById(next.heroId).name, portrait: heroById(next.heroId).portrait, text: "城門是給活人過的。" },
      ]);
      setPendingEnemies(["yellow", "bandit"]);
      setPendingKind("gate");
      setBattleBg("./art/bg-battle.png");
      setPendingPreBattle({
        name: "黃巾卒・山賊頭目",
        threat: "山賊頭目橫刀：想過城門，先留下錢與命。",
      });
      return;
    }
    if (save.mapId === "camp" && ch === "B" && !next.flags.bossDown) {
      setSave(next);
      say(bossIntro(next.heroId));
      setPendingEnemies(["yellow", "officer", "boss"]);
      setPendingKind("boss");
      setBattleBg("./art/bg-camp.png");
      setPendingPreBattle({
        name: "黃巾渠帥",
        threat: "渠帥把黃旗一頓：把命留在營裡吧。",
      });
      return;
    }
    // Miniboss before soft encounters — any B / zone tile until ch2Clear.
    if (save.mapId === "field" && !next.flags.ch2Clear && (ch === "B" || isFieldMinibossTile(x, y))) {
      setSave(next);
      startFieldMiniboss(next);
      return;
    }
    if (save.mapId === "merge" && !next.flags.confluenceClear && (ch === "B" || isMergeMinibossTile(x, y))) {
      setSave(next);
      startMergeMiniboss(next);
      return;
    }
    if (save.mapId === "zgate" && !next.flags.ch3Clear && (ch === "B" || isZgateMinibossTile(x, y))) {
      setSave(next);
      startZgateMiniboss(next);
      return;
    }
    if (save.mapId === "nfield" && !next.flags.ch4Clear && (ch === "B" || isNfieldMinibossTile(x, y))) {
      setSave(next);
      startNfieldMiniboss(next);
      return;
    }
    if (save.mapId === "tgarden" && !next.flags.ch5Clear && (ch === "B" || isTgardenMinibossTile(x, y))) {
      setSave(next);
      startTgardenMiniboss(next);
      return;
    }
    if (save.mapId === "xroad" && !next.flags.ch6Clear && (ch === "B" || isXroadMinibossTile(x, y))) {
      setSave(next);
      startXroadMiniboss(next);
      return;
    }
    const warp = m.warps.find((w) => w.x === x && w.y === y);
    if (warp) {
      if (warp.requireFlag && !next.flags[warp.requireFlag]) {
        say([{ speaker: "系統", text: "北營還看不真切。先在官道上探聽，或靠近旗幟那一格。" }]);
        setSave(next);
        return;
      }
      next = { ...next, mapId: warp.to as MapId, x: warp.tx, y: warp.ty, encounterFill: 0 };
      flash(warp.prompt);
    }
    if (next.mapId === "road" && tileAt(mapById("road"), next.x, next.y) === "C") {
      next.flags = { ...next.flags, roadScouted: true };
      next = addJournal(next, "scout");
      flash("看見北營入口了。");
    }
    // Encounter meter: fills only on maps with encounter (field/road), never in town.
    // Soft packs suppressed on nfield until ch4Clear (miniboss path only).
    const encMap = mapById(next.mapId);
    if (next.mapId === "nfield" && !next.flags.ch4Clear) {
      // do not increment / do not trigger soft packs
    } else if (next.mapId === "tgarden" && !next.flags.ch5Clear) {
      // miniboss path only until ch5Clear
    } else if (next.mapId === "xroad" && !next.flags.ch6Clear) {
      // miniboss path only until ch6Clear
    } else if (encMap.encounter && (next.mapId === "road" || next.mapId === "field" || next.mapId === "merge" || next.mapId === "zgate" || next.mapId === "nfield")) {
      const max = encMap.encounter.steps;
      const fill = (next.encounterFill ?? 0) + 1;
      if (fill >= max && !next.flags.bossDown && !next.flags.ch2Clear && !next.flags.confluenceClear && !next.flags.ch3Clear && !next.flags.ch4Clear && !next.flags.ch5Clear && !next.flags.ch6Clear) {
        const pack =
          encMap.encounter.packs[Math.floor(Math.random() * encMap.encounter.packs.length)] ?? [
            "yellow",
          ];
        // Keep bar visually full during the 遭遇已滿 line (screenshot-readable).
        next = { ...next, encounterFill: max };
        setSave(next);
        say([
          {
            speaker: "系統",
            text:
              next.mapId === "field"
                ? "遭遇已滿。平野上有人攔路。"
                : next.mapId === "merge"
                  ? "遭遇已滿。合流官道上有人攔路。"
                  : next.mapId === "zgate"
                    ? "遭遇已滿。鎮口有人攔路。"
                    : "遭遇已滿。官道上有人攔路。",
          },
        ]);
        setPendingEnemies(pack);
        setPendingKind("skirmish");
        setBattleBg(next.mapId === "field" ? "./art/bg-road.png" : "./art/bg-road.png");
        setPendingPreBattle(null);
        return;
      }
      next = { ...next, encounterFill: fill };
    }
    setSave(next);
  }

  function interact() {
    if (!save || line || overnight || chapterClear || nightTalk || nightDeep || screen !== "world") return;
    const m = mapById(save.mapId);
    // Standing on B after battle return / adjacent to 黃巾小帥 → same miniboss flow.
    if (save.mapId === "field" && !save.flags.ch2Clear) {
      const standingBoss =
        tileAt(m, save.x, save.y) === "B" || isFieldMinibossTile(save.x, save.y);
      const hitEarly = interactTarget(save);
      if (standingBoss || hitEarly?.npc?.id === "yz-lieutenant") {
        sfx.click();
        startFieldMiniboss(save);
        return;
      }
    }
    if (save.mapId === "merge" && !save.flags.confluenceClear) {
      const standingBoss =
        tileAt(m, save.x, save.y) === "B" || isMergeMinibossTile(save.x, save.y);
      const hitEarly = interactTarget(save);
      if (standingBoss || hitEarly?.npc?.id === "merge-remnant") {
        sfx.click();
        startMergeMiniboss(save);
        return;
      }
    }
    if (save.mapId === "zgate" && !save.flags.ch3Clear) {
      const standingBoss =
        tileAt(m, save.x, save.y) === "B" || isZgateMinibossTile(save.x, save.y);
      const hitEarly = interactTarget(save);
      if (standingBoss || hitEarly?.npc?.id === "zf-gatechief") {
        sfx.click();
        startZgateMiniboss(save);
        return;
      }
    }
    if (save.mapId === "nfield" && !save.flags.ch4Clear) {
      const standingBoss =
        tileAt(m, save.x, save.y) === "B" || isNfieldMinibossTile(save.x, save.y);
      const hitEarly = interactTarget(save);
      if (standingBoss || hitEarly?.npc?.id === "zg-schemer") {
        sfx.click();
        let at = save;
        if (!at.flags.ch4Inquired) {
          at = persist({ ...at, flags: { ...at.flags, ch4Inquired: true } });
          setSave(at);
        }
        startNfieldMiniboss(at);
        return;
      }
    }
    const hit = interactTarget(save);
    if (hit?.npc) {
      if (hit.npc.id === "bounty-board") {
        sfx.click();
        if (save.flags.bountyDone) {
          say([{ speaker: "懸賞板", text: "此懸賞已領。板上暫無新單。" }]);
          return;
        }
        if (!save.flags.bountyAccepted) {
          setBountyPanel("accept");
          setBountyReady(false);
          return;
        }
        if (save.flags.bountyTargetDown) {
          // Turn in
          let next = structuredClone(save);
          next.flags.bountyDone = true;
          next.gold += 80;
          next.items["herb"] = (next.items["herb"] ?? 0) + 2;
          next = addJournal(next, "bounty-clear");
          patchProgress({ bountyDone: true, bountyAccepted: true });
          setSave(persist(next));
          setBountyPanel("complete");
          setBountyReady(false);
          window.setTimeout(() => setBountyReady(true), 2500);
          return;
        }
        say([
          {
            speaker: "懸賞板",
            text: "進行中・目標：黃巾懸賞賊。擊敗後回此板交還。",
          },
        ]);
        return;
      }
      if (hit.npc.id === "bounty-outlaw") {
        sfx.click();
        startBountyOutlaw(save);
        return;
      }
      if (hit.npc.id === "lb-tyrant" && !save.flags.ch5Clear) {
        sfx.click();
        startTgardenMiniboss(save);
        return;
      }
      if (hit.npc.id === "cc-enforcer" && !save.flags.ch6Clear) {
        sfx.click();
        startXroadMiniboss(save);
        return;
      }
      setPathNpc(hit.npc);
      setPathConfirm(null);
      sfx.click();
      return;
    }
    const warp = m.warps.find((w) => Math.abs(w.x - save.x) + Math.abs(w.y - save.y) <= 1);
    if (warp) {
      if (warp.to === "road" && save.mapId === "xinyue" && !save.flags.cleared) {
        say([
          { speaker: "山賊頭目", portrait: "./art/portrait-bandit.png", text: "這城門從今夜起歸我們看。想過去，先留下錢與命。" },
          { speaker: heroById(save.heroId).name, portrait: heroById(save.heroId).portrait, text: "城門是給活人過的。" },
        ]);
        setPendingEnemies(["yellow", "bandit"]);
        setPendingKind("gate");
        setBattleBg("./art/bg-battle.png");
        setPendingPreBattle({
          name: "黃巾卒・山賊頭目",
          threat: "山賊頭目橫刀：想過城門，先留下錢與命。",
        });
        return;
      }
      if (warp.requireFlag && !save.flags[warp.requireFlag]) {
        say([{ speaker: "系統", text: "還不到進去的時候。" }]);
        return;
      }
      const next = persist({ ...save, mapId: warp.to, x: warp.tx, y: warp.ty });
      setSave(next);
      flash(warp.prompt);
    }
  }

  function applyPath(action: keyof typeof PATH_LABEL) {
    if (!save || !pathNpc) return;
    const result = performPathAction(
      save.heroId,
      pathNpc,
      action,
      save.flags,
      save.gold,
      save.party,
    );
    setPathNpc(null);
    setPathConfirm(null);

    if (!result.ok) {
      // Always surface a short banner for path failures (inquire/hire/purchase/challenge).
      showFail(result.failBanner ?? "對方不肯");
      say(
        result.lines.map((text) => ({
          speaker: result.title,
          portrait: npcPortrait(pathNpc),
          text,
        })),
      );
      return;
    }

    let next = structuredClone(save);
    next.pathMastery = recordPathSuccess(
      effectiveMastery(next.pathMastery),
      action as PathAction,
    );
    let overnightHeals: { name: string; hp: number; sp: number }[] | undefined;
    if (result.overnight && pathNpc.id === "innkeeper") {
      const before = save.party.map((id) => {
        const v = save.vitals[id] ?? { hp: 0, sp: 0 };
        return { id, name: heroById(id).name, hp: v.hp, sp: v.sp };
      });
      next = restParty(save);
      next = addJournal(next, "rested");
      next.flags.rested = true;
      overnightHeals = before.map((b) => {
        const after = next.vitals[b.id] ?? { hp: b.hp, sp: b.sp };
        return {
          name: b.name,
          hp: Math.max(0, after.hp - b.hp),
          sp: Math.max(0, after.sp - b.sp),
        };
      });
    } else {
      if (result.goldDelta) next.gold = Math.max(0, next.gold + result.goldDelta);
      if (result.itemDelta) {
        for (const [k, v] of Object.entries(result.itemDelta)) {
          next.items[k] = (next.items[k] ?? 0) + v;
        }
      }
      if (result.hourDelta) next.hour = (next.hour + result.hourDelta) % 24;
    }
    if (result.flag) next.flags[result.flag] = true;
    if (action === "hire") next.flags.hiredEyes = true;

    if (result.clue) next = addClue(next, result.clue);

    let spoke = false;
    if (result.flag === "childSafe") {
      next = addJournal(next, "child");
      say([
        ...result.lines.map((text) => ({
          speaker: pathNpc.name,
          portrait: npcPortrait(pathNpc),
          text,
        })),
        ...childRescueLines(),
      ]);
      spoke = true;
    }
    if (result.revealWeak) {
      next.weaknessLog = logWeaknesses(next.weaknessLog, result.revealWeak);
      next.inquired = [...new Set([...next.inquired, pathNpc.id])];
      next = addJournal(next, "inquired");
    }
    if (result.recruitTemp && result.companionId) {
      const beforeParty = next.party.length;
      if (result.thirdRecruit) {
        next = recruitThird(next, result.companionId);
        if (next.party.length > beforeParty || next.flags.thirdJoined) {
          say([
            ...result.lines.map((t) => ({
              speaker: result.title,
              portrait: npcPortrait(pathNpc),
              text: t,
            })),
            ...thirdRecruitLines(next.heroId, result.companionId),
          ]);
          spoke = true;
        }
      } else {
        next = recruitCompanion(next, result.companionId);
        if (next.party.length > beforeParty) {
          say([
            ...result.lines.map((t) => ({
              speaker: result.title,
              portrait: npcPortrait(pathNpc),
              text: t,
            })),
            ...recruitLines(next.heroId, result.companionId),
          ]);
          spoke = true;
        }
      }
    }
    const overnightLines = result.overnight
      ? result.lines.map((text) => ({
          speaker: result.title,
          portrait: npcPortrait(pathNpc),
          text,
        }))
      : null;
    if (!spoke && !result.overnight) {
      say(
        result.lines.map((text) => ({
          speaker: result.title,
          portrait: npcPortrait(pathNpc),
          text,
        })),
      );
    }
    if (result.lootPopup) {
      showLoot(result.lootPopup);
    } else if (result.itemDelta) {
      const gained = Object.entries(result.itemDelta).find(([, n]) => n > 0);
      if (gained) {
        const [id] = gained;
        const named = ITEMS.find((x) => x.id === id)?.name ?? id;
        showLoot(`獲得 ${named}`);
      }
    }
    if (result.overnight) {
      // Play 「一夜過去」 first (screenshot-safe), then dialogue.
      showOvernight(overnightHeals, () => {
        if (!spoke && overnightLines) say(overnightLines);
      });
    }

    if (result.startBattle) {
      setPendingEnemies(result.startBattle);
      setPendingKind(result.flag === "officerFight" ? "skirmish" : "gate");
      setBattleBg(save.mapId === "camp" ? "./art/bg-camp.png" : "./art/bg-battle.png");
      if (result.preBattleName && result.preBattleThreat) {
        setPendingPreBattle({ name: result.preBattleName, threat: result.preBattleThreat });
      } else {
        setPendingPreBattle(null);
      }
    }
    setSave(persist(next));
  }

  function nextLine() {
    if (lineAt < lines.length - 1) {
      setLineAt((n) => n + 1);
      sfx.talk();
      return;
    }
    setLines([]);
    setLineAt(0);
    if (pendingEnemies.length && screen !== "battle") {
      if (!save) return;
      if (pendingPreBattle) {
        setPreBattle(pendingPreBattle);
        setPendingPreBattle(null);
        return;
      }
      startBattle(save, pendingEnemies, pendingKind, battleBg);
    }
  }

  useEffect(() => {
    const blurHud = () => {
      const el = document.activeElement;
      if (el instanceof HTMLElement && el.closest(".controls, .step-pad, .side-actions, .dpad")) {
        el.blur();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (menu) {
          setMenu(false);
          return;
        }
        if (pathNpc) {
          if (pathConfirm) {
            setPathConfirm(null);
            return;
          }
          setPathNpc(null);
          return;
        }
        // Never open 列傳 while dialogue or non-world screens are up.
        if (line || screen !== "world") return;
        setMenu(true);
        return;
      }
      if (nightTalk) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advanceNightTalk();
        }
        return;
      }
      if (line) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          nextLine();
        }
        return;
      }
      if (menu || pathNpc || overnight || chapterClear || nightTalk || nightDeep || screen !== "world") return;

      // Space on a focused HUD button (esp. 列傳) would otherwise activate it.
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        blurHud();
        return;
      }

      const dir =
        e.key === "ArrowUp" || e.key === "w" || e.key === "W"
          ? "up"
          : e.key === "ArrowDown" || e.key === "s" || e.key === "S"
            ? "down"
            : e.key === "ArrowLeft" || e.key === "a" || e.key === "A"
              ? "left"
              : e.key === "ArrowRight" || e.key === "d" || e.key === "D"
                ? "right"
                : null;
      if (dir) {
        e.preventDefault();
        blurHud();
        move(dir);
        return;
      }
      if (e.key === "Enter") {
        // Stop focused HUD buttons (esp. 列傳) from stealing Enter.
        e.preventDefault();
        blurHud();
        interact();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const hint = useMemo(() => {
    if (!save) return "交談";
    const hit = interactTarget(save);
    if (hit?.npc) {
      if (hit.npc.id === "innkeeper") return "投宿一夜・掌櫃";
      if (hit.npc.id === "merge-campfire") return "圍爐夜話・營火";
      if (hit.npc.id === "merge-remnant") return "挑戰・渠帥殘黨";
      if (hit.npc.id === "zf-gatechief") return "威嚇・鎮口頭目";
      return `${heroById(save.heroId).pathActionName}・${hit.npc.name}`;
    }
    const m = mapById(save.mapId);
    const warp = m.warps.find((w) => Math.abs(w.x - save.x) + Math.abs(w.y - save.y) <= 1);
    if (warp) return warp.prompt;
    return "交談";
  }, [save, interactTarget]);

  return (
    <main className="app" onPointerDown={unlockAudio} id="game-main">
      <a className="skip-link" href="#game-hero">
        略過裝飾、進入畫面
      </a>
      <h1 className="sr-only">八路列傳</h1>
      {screen === "title" && (
        <TitleScreen
          hasSave={hasSave}
          onNew={() => {
            unlockAudio();
            sfx.click();
            setPicked(null);
            setScreen("select");
          }}
          onContinue={() => {
            const loaded = loadSave();
            if (!loaded) return;
            syncProgressFromSave(loaded.flags, loaded.chronicleId);
            setSave(loaded);
            setScreen("world");
          }}
          onSecondChronicle={() => {
            unlockAudio();
            sfx.click();
            setScreen("chronicleConfirm");
          }}
          onConfluence={() => {
            unlockAudio();
            sfx.click();
            setScreen("confluenceConfirm");
          }}
          onZhangFei={() => {
            unlockAudio();
            sfx.click();
            setScreen("zhangfeiConfirm");
          }}
          onZhuge={() => {
            unlockAudio();
            sfx.click();
            setScreen("zhugeConfirm");
          }}
          onLiubei={() => {
            unlockAudio();
            sfx.click();
            setScreen("liubeiConfirm");
          }}
          onCaocao={() => {
            unlockAudio();
            sfx.click();
            setScreen("caocaoConfirm");
          }}
          onOpenFourRoads={() => {
            unlockAudio();
            sfx.click();
            setScreen("fourRoads");
          }}
          onOpenFiveRoads={() => {
            unlockAudio();
            sfx.click();
            setScreen("fiveRoads");
          }}
          onBountyQa={() => {
            unlockAudio();
            sfx.click();
            // QA: 關羽 in 新野 beside bounty board, ready to accept
            const base = newSave("guanyu");
            const s = persist({
              ...base,
              mapId: "xinyue",
              x: 8,
              y: 8,
              facing: "up" as const,
              flags: { ...base.flags, cleared: true },
              gold: 50,
            });
            setSave(s);
            setScreen("world");
            say([
              {
                speaker: "系統",
                text: "懸賞測試：走到懸賞板（東側）接取，再去官道擊敗黃巾懸賞賊，回板交還。",
              },
            ]);
          }}
          onOpenSaveSlots={() => {
            unlockAudio();
            sfx.click();
            setScreen("saveSlots");
          }}
          onOpenWorldMap={() => {
            unlockAudio();
            sfx.click();
            setWorldMapPreview(null);
            setScreen("worldMap");
          }}
          onOpenWorldMapGrey={() => {
            unlockAudio();
            sfx.click();
            // Preview only — only 新野 unlocked, 常山／合流 grey; does not wipe real meta.
            setWorldMapPreview(qaGreyMapProgress());
            setScreen("worldMap");
          }}
          onOpenSettings={() => {
            unlockAudio();
            sfx.click();
            setScreen("settings");
          }}
        />
      )}
      {screen === "chronicleConfirm" && (
        <ChronicleConfirm
          onBack={() => setScreen("title")}
          onConfirm={() => {
            patchProgress({ ch2Started: true });
            const s = persist(newSecondChronicleSave());
            setSave(s);
            setScreen("world");
            say(secondChronicleOpening(s.heroId));
          }}
        />
      )}
      {screen === "confluenceConfirm" && (
        <ChronicleConfirm
          chronicleId={CONFLUENCE_ID}
          onBack={() => setScreen("title")}
          onConfirm={() => {
            const s = persist(newConfluenceSave());
            setSave(s);
            setScreen("world");
            say(confluenceOpening());
          }}
        />
      )}
      {screen === "zhangfeiConfirm" && (
        <ChronicleConfirm
          chronicleId={ZHANGFEI_CHRONICLE_ID}
          onBack={() => setScreen("title")}
          onConfirm={() => {
            patchProgress({ ch3Started: true });
            const s = persist(newZhangFeiSave());
            setSave(s);
            setScreen("world");
            say(zhangfeiOpening());
          }}
        />
      )}
      {screen === "zhugeConfirm" && (
        <ChronicleConfirm
          chronicleId={ZHUGE_CHRONICLE_ID}
          onBack={() => setScreen("title")}
          onConfirm={() => {
            patchProgress({ ch4Started: true });
            const base = newZhugeSave();
            // QA / 動身: nfield south of B, inquired seeded, no soft packs until clear.
            const s = persist({
              ...base,
              flags: { ...base.flags, ch4Inquired: true },
              mapId: "nfield",
              x: 7,
              y: 3,
              facing: "up",
              encounterFill: 0,
            });
            setSave(s);
            setScreen("world");
            say(zhugeOpening());
          }}
        />
      )}
      {screen === "liubeiConfirm" && (
        <ChronicleConfirm
          chronicleId={LIUBEI_CHRONICLE_ID}
          onBack={() => setScreen("title")}
          onConfirm={() => {
            patchProgress({ ch5Started: true });
            const base = newLiubeiSave();
            const s = persist({
              ...base,
              mapId: "tgarden",
              x: 7,
              y: 3,
              facing: "up",
              encounterFill: 0,
            });
            setSave(s);
            setScreen("world");
            say(liubeiOpening());
          }}
        />
      )}
      {screen === "caocaoConfirm" && (
        <ChronicleConfirm
          chronicleId={CAOCAO_CHRONICLE_ID}
          onBack={() => setScreen("title")}
          onConfirm={() => {
            patchProgress({ ch6Started: true });
            const base = newCaocaoSave();
            const s = persist({
              ...base,
              mapId: "xroad",
              x: 7,
              y: 3,
              facing: "up",
              encounterFill: 0,
            });
            setSave(s);
            setScreen("world");
            say(caocaoOpening());
            // Fresh line tip cards if never seen
            maybeShowTips();
          }}
        />
      )}
      {screen === "fourRoads" && (
        <FourRoadsPanel onBack={() => setScreen("title")} />
      )}
      {screen === "fiveRoads" && (
        <FiveRoadsPanel onBack={() => setScreen("title")} />
      )}
      {screen === "settings" && (
        <SettingsPanel onBack={() => setScreen(save ? "world" : "title")} />
      )}
      {screen === "partySelect" && save && (
        <PartySelectPanel
          currentParty={save.party}
          heroId={save.heroId}
          onBack={() => setScreen("world")}
          onConfirm={(party) => {
            const next = persist(setPartyMembers(save, party));
            setSave(next);
            setScreen("world");
            flash(`編隊：${next.party.map((id) => heroById(id).name).join("・")}`);
          }}
        />
      )}
      {screen === "saveSlots" && (
        <SaveSlotsPanel
          currentSave={save}
          onBack={() => setScreen(save ? "world" : "title")}
          onLoaded={(loaded) => {
            // Called only after 「已讀取」 ready-gate dismiss (≥2s hold).
            syncProgressFromSave(loaded.flags, loaded.chronicleId);
            setSave(loaded);
            setScreen("world");
          }}
        />
      )}
      {screen === "worldMap" && (
        <WorldMapPanel
          previewProgress={worldMapPreview}
          onBack={() => {
            setWorldMapPreview(null);
            setScreen("title");
          }}
          onTravel={(node: WorldNodeId) => {
            setWorldMapPreview(null);
            unlockAudio();
            sfx.click();
            const go = () => {
            if (node === "xinyue") {
              // Resume or start 關羽線 at 新野
              const loaded = loadSave();
              if (loaded && (loaded.chronicleId === "ch1" || loaded.flags.bossDown)) {
                const next = { ...loaded, mapId: "xinyue" as const, x: 6, y: 10, facing: "up" as const };
                setSave(persist(next));
                setScreen("world");
                return;
              }
              patchProgress({ ch1Started: true });
              const s = persist(addJournal(newSave("guanyu"), "start"));
              setSave(s);
              setScreen("world");
              say(openingFor("guanyu"));
              return;
            }
            if (node === "changshan") {
              setScreen("chronicleConfirm");
              return;
            }
            if (node === "merge") {
              setScreen("confluenceConfirm");
              return;
            }
            if (node === "wolong") {
              setScreen("zhugeConfirm");
            }
            };
            travelWithBanner(node, go);
          }}
        />
      )}
      {screen === "select" && (
        <CharacterSelect
          picked={picked}
          onPick={setPicked}
          onBack={() => setScreen("title")}
          onStart={() => {
            if (!picked) return;
            patchProgress({ ch1Started: true });
            const s = persist(addJournal(newSave(picked), "start"));
            setSave(s);
            setScreen("world");
            say(openingFor(picked));
            maybeShowTips();
          }}
        />
      )}
      {screen === "world" && save && map && (
        <WorldView
          map={map}
          save={save}
          interactHint={hint}
          onMove={move}
          onInteract={interact}
          onMenu={() => setMenu(true)}
          uiBlocked={Boolean(line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep)}
          onQuickField={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "yunzhen") return;
            sfx.step();
            const next = persist({
              ...save,
              mapId: "field",
              x: 7,
              y: 10,
              facing: "up",
              encounterFill: 0,
            });
            setSave(next);
            flash("出驛，前往平野");
          }}
          onQuickBlacksmith={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "yunzhen") return;
            sfx.step();
            // Adjacent to 鐵匠 at (9,3) — stand at (8,3) facing right.
            const next = persist({ ...save, x: 8, y: 3, facing: "right" });
            setSave(next);
            flash("找到鐵匠了。");
          }}
          onChallengeMiniboss={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "field" || save.flags.ch2Clear) return;
            sfx.click();
            startFieldMiniboss(save);
          }}
          onChallengeRemnant={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "merge" || save.flags.confluenceClear) return;
            sfx.click();
            startMergeMiniboss(save);
          }}
          onQuickZgate={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "zhuolu") return;
            sfx.step();
            const next = persist({
              ...save,
              mapId: "zgate",
              x: 7,
              y: 10,
              facing: "up",
              encounterFill: 0,
            });
            setSave(next);
            flash("出驛，前往鎮口");
          }}
          onChallengeGatechief={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "zgate" || save.flags.ch3Clear) return;
            sfx.click();
            startZgateMiniboss(save);
          }}
          onQuickNfield={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "wolong") return;
            sfx.step();
            const next = persist({
              ...save,
              mapId: "nfield",
              x: 7,
              y: 3,
              facing: "up",
              encounterFill: 0,
              flags: { ...save.flags, ch4Inquired: true },
            });
            setSave(next);
            flash("出岡，前往新野郊野");
          }}
          onChallengeSchemer={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "nfield" || save.flags.ch4Clear) return;
            sfx.click();
            let at = save;
            if (!at.flags.ch4Inquired) {
              at = persist({ ...at, flags: { ...at.flags, ch4Inquired: true } });
              setSave(at);
            }
            startNfieldMiniboss(at);
          }}
          onQuickTgarden={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "taoyuan") return;
            sfx.step();
            const next = persist({
              ...save,
              mapId: "tgarden",
              x: 7,
              y: 3,
              facing: "up",
              encounterFill: 0,
            });
            setSave(next);
            flash("出園，前往桃園外");
          }}
          onChallengeTyrant={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "tgarden" || save.flags.ch5Clear) return;
            sfx.click();
            startTgardenMiniboss(save);
          }}
          onQuickXroad={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "xuchang") return;
            sfx.step();
            const next = persist({
              ...save,
              mapId: "xroad",
              x: 7,
              y: 3,
              facing: "up",
              encounterFill: 0,
            });
            setSave(next);
            flash("出郊，前往許昌官道");
          }}
          onChallengeEnforcer={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.mapId !== "xroad" || save.flags.ch6Clear) return;
            sfx.click();
            startXroadMiniboss(save);
          }}
          onNightTalk={() => {
            if (!save || line || pathNpc || menu || overnight || chapterClear || nightTalk || nightDeep) return;
            if (save.flags.nightTalkDone) {
              flash("今夜已談過。");
              return;
            }
            if (save.chronicleId !== "confluence" && save.mapId !== "merge") return;
            sfx.click();
            beginNightTalk();
          }}
        />
      )}
      {screen === "battle" && save && battle && (
        <BattleView
          battle={battle}
          items={save.items}
          bg={battleBg}
          consumeItem={(id) => {
            if (!save.items[id]) return false;
            const next = structuredClone(save);
            next.items[id] -= 1;
            setSave(persist(next));
            return true;
          }}
          onChange={(next) => setBattle(next)}
          onWin={(finished) => {
            if (!save) return;
            setBattleFx("out");
            window.setTimeout(() => {
              setBattle(null);
              setSave(afterWin(save, finished));
              setPendingEnemies([]);
              setScreen("world");
              setBattleFx(null);
            }, 280);
          }}
          onLose={() => {
            setBattle(null);
            setPendingEnemies([]);
            setScreen("gameover");
          }}
        />
      )}
      {screen === "gameover" && (
        <section className="title-wrap">
          <div className="bg-plate" style={{ backgroundImage: "url(./art/bg-camp.png)" }} />
          <h1>全軍覆沒</h1>
          <p>可讀取存檔再來，或從頭選擇英雄。</p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const loaded = loadSave();
                if (loaded) {
                  setSave(loaded);
                  setScreen("world");
                } else setScreen("title");
              }}
            >
              讀檔
            </button>
            <button type="button" className="btn" onClick={() => setScreen("title")}>
              標題
            </button>
          </div>
        </section>
      )}

      {line && <DialogueBox line={line} talking onNext={nextLine} />}

      {pathNpc && save && screen === "world" && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="路徑行動">
          <div className="sheet gold-frame path-sheet">
            {!pathConfirm ? (
              <>
                <h2>{pathNpc.name}</h2>
                <p className="path-talk">{talkLinesFor(pathNpc, save.inquired)[0]}</p>
                <div className="list-btns">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      const talk = talkLinesFor(pathNpc, save.inquired);
                      // Wayfarer talk can unlock the third companion when a second is already present.
                      if (
                        pathNpc.id === "wayfarer" &&
                        save.flags.companionJoined &&
                        !save.flags.thirdJoined
                      ) {
                        applyPath("hire");
                        return;
                      }
                      say(
                        talk.map((text) => ({
                          speaker: pathNpc.name,
                          portrait: npcPortrait(pathNpc),
                          text,
                        })),
                      );
                      setPathNpc(null);
                      setPathConfirm(null);
                    }}
                  >
                    交談
                  </button>
                  {pathNpc.id === "innkeeper" ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary overnight-action"
                        onClick={() => setPathConfirm("purchase")}
                        data-qa="overnight"
                      >
                        投宿一夜（免費）
                      </button>
                      {save.chronicleId === "confluence" && !save.flags.nightTalkDone && (
                        <button
                          type="button"
                          className="btn"
                          data-qa="night-talk-inn"
                          onClick={() => {
                            setPathNpc(null);
                            setPathConfirm(null);
                            beginNightTalk();
                          }}
                        >
                          圍爐夜話
                        </button>
                      )}
                    </>
                  ) : pathNpc.id === "merge-campfire" ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        data-qa="night-talk-camp"
                        disabled={Boolean(save.flags.nightTalkDone)}
                        onClick={() => {
                          setPathNpc(null);
                          setPathConfirm(null);
                          if (save.flags.nightTalkDone) {
                            flash("今夜已談過。");
                            return;
                          }
                          beginNightTalk();
                        }}
                      >
                        圍爐夜話
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          const talk = talkLinesFor(pathNpc, save.inquired);
                          say(
                            talk.map((text) => ({
                              speaker: pathNpc.name,
                              portrait: npcPortrait(pathNpc),
                              text,
                            })),
                          );
                          setPathNpc(null);
                          setPathConfirm(null);
                        }}
                      >
                        交談
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setPathConfirm(heroById(save.heroId).pathAction)}
                      >
                        {heroById(save.heroId).pathActionName}（專精）
                      </button>
                      <button type="button" className="btn" onClick={() => setPathConfirm(pathNpc.pathHint)}>
                        {PATH_LABEL[pathNpc.pathHint]}（對方擅長）
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setPathNpc(null);
                      setPathConfirm(null);
                    }}
                  >
                    離開
                  </button>
                </div>
              </>
            ) : (
              (() => {
                const mastery = effectiveMastery(save.pathMastery);
                const stars = masteryStars(mastery, pathConfirm);
                const mHint = masteryHint(mastery, pathConfirm);
                const preview = previewPathAction(
                  save.heroId,
                  pathNpc,
                  pathConfirm,
                  save.flags,
                  save.gold,
                  mHint,
                  stars,
                );
                return (
                  <>
                    <h2>{preview.name}</h2>
                    {stars > 0 && (
                      <div
                        className="path-mastery gold-frame"
                        data-qa="path-mastery"
                        data-stars={stars}
                        role="status"
                      >
                        <span className="path-mastery-stars" aria-label={`熟練${stars}星`}>
                          {masteryStarsText(stars)}
                        </span>
                        <span className="path-mastery-hint">較易成功</span>
                      </div>
                    )}
                    <p className="path-cond">{preview.condition}</p>
                    <p className="path-result">{preview.result}</p>
                    <div className="list-btns">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => applyPath(pathConfirm)}
                      >
                        確認執行
                      </button>
                      <button type="button" className="btn" onClick={() => setPathConfirm(null)}>
                        返回
                      </button>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {menu && save && screen === "world" && (
        <MenuOverlay
          save={save}
          onClose={() => setMenu(false)}
          onSave={() => {
            persist(save);
            setMenu(false);
            setScreen("saveSlots");
          }}
          onTitle={() => {
            persist(save);
            setMenu(false);
            setScreen("title");
          }}
          onWorldMap={
            worldMapUnlocked()
              ? () => {
                  persist(save);
                  setMenu(false);
                  setWorldMapPreview(null);
                  setScreen("worldMap");
                }
              : undefined
          }
          onPartySelect={() => {
            persist(save);
            setMenu(false);
            setScreen("partySelect");
          }}
          onSettings={() => {
            persist(save);
            setMenu(false);
            setScreen("settings");
          }}
          onBuy={(itemId) => {
            const it = ITEMS.find((x) => x.id === itemId);
            if (!it || save.gold < it.price) {
              flash("錢不夠。");
              return;
            }
            const next = structuredClone(save);
            next.gold -= it.price;
            next.items[itemId] = (next.items[itemId] ?? 0) + 1;
            setSave(persist(next));
            if (isEquippable(itemId)) {
              showLoot(`獲得 ${it.name}`);
            } else {
              flash(`買下${it.name}。`);
            }
          }}
          onEquip={(itemId) => {
            const it = itemById(itemId);
            if (!it?.slot || (save.items[itemId] ?? 0) <= 0) {
              flash("無法裝備。");
              return;
            }
            const next = structuredClone(save);
            const slot = it.slot;
            const prevId = next.equip[slot];
            if (prevId && prevId !== itemId) {
              next.items[prevId] = (next.items[prevId] ?? 0) + 1;
            }
            if (prevId !== itemId) {
              next.items[itemId] = Math.max(0, (next.items[itemId] ?? 0) - 1);
            }
            next.equip = { ...next.equip, [slot]: itemId };
            setSave(persist(next));
            setMenu(false);
            showLoot(`已裝備 ${it.name}`);
          }}
          onUnequip={(slot) => {
            const id = save.equip?.[slot];
            if (!id) return;
            const next = structuredClone(save);
            next.items[id] = (next.items[id] ?? 0) + 1;
            const equip = { ...next.equip };
            delete equip[slot];
            next.equip = equip;
            setSave(persist(next));
            const named = itemById(id)?.name ?? id;
            flash(`已卸下${named}。`);
          }}
        />
      )}

      {toast && (
        <div className="gold-frame chip toast-live" role="status" aria-live="polite">
          {toast}
        </div>
      )}
      {failBanner && (
        <div
          className="fail-banner"
          role="status"
          aria-live="assertive"
          data-fail-banner={failBanner}
        >
          {failBanner}
        </div>
      )}
      {lootPopup && (
        <div
          className="loot-popup"
          role="status"
          aria-live="polite"
          data-loot-popup={lootPopup}
        >
          {lootPopup}
        </div>
      )}
      {overnight && (
        <div className="overnight-veil" role="status" aria-live="polite" data-fx="overnight" data-overnight-popup="一夜過去">
          <div className="overnight-popup" aria-label="一夜過去">
            <div className="overnight-popup-kicker">客棧・休整</div>
            <div className="overnight-popup-title">一夜過去</div>
            <div className="overnight-popup-sub">氣血與氣力已回復</div>
          </div>
        </div>
      )}
      {restHeals && (
        <div className="rest-heal-hud" role="status" aria-live="polite" data-fx="rest-heal">
          {restHeals.map((h) => (
            <div key={h.name} className="rest-heal-row">
              <b>{h.name}</b>
              {h.hp > 0 && <span className="heal-pop">+{h.hp} HP</span>}
              {h.sp > 0 && <span className="heal-pop sp">+{h.sp} SP</span>}
              {h.hp === 0 && h.sp === 0 && <span className="heal-pop">已滿</span>}
            </div>
          ))}
        </div>
      )}
      {bountyPanel === "accept" && save && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="接取懸賞" data-qa="bounty-accept">
          <div className="sheet gold-frame">
            <h2>接取懸賞</h2>
            <p className="enemy-name">目標：黃巾懸賞賊</p>
            <p className="threat">擊敗官道上的懸賞賊，回懸賞板交還。報酬：80金＋草藥×2。</p>
            <div className="list-btns">
              <button type="button" className="btn" onClick={() => setBountyPanel(null)}>
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-qa="bounty-accept-yes"
                onClick={() => {
                  let next = structuredClone(save);
                  next.flags.bountyAccepted = true;
                  next = addJournal(next, "bounty-start");
                  patchProgress({ bountyAccepted: true });
                  setSave(persist(next));
                  setBountyPanel(null);
                  flash("懸賞・進行中");
                }}
              >
                接取
              </button>
            </div>
          </div>
        </div>
      )}
      {bountyPanel === "complete" && (
        <div
          className="overlay chapter-clear-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="懸賞完成"
          data-qa="bounty-complete"
        >
          <div className="sheet gold-frame chapter-clear-panel" data-fx="bounty-complete">
            <h1 className="chapter-clear-title">懸賞完成</h1>
            <p className="chapter-clear-sub">獲得 80金・草藥×2</p>
            <p className="chapter-clear-hold-hint" aria-hidden={!bountyReady}>
              {bountyReady ? "" : "……"}
            </p>
            <div className="list-btns">
              <button
                type="button"
                className="btn btn-primary"
                data-qa="bounty-complete-ok"
                disabled={!bountyReady}
                onClick={() => {
                  if (!bountyReady) return;
                  setBountyPanel(null);
                  setBountyReady(false);
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
      {chapterClear && (
        <div
          className="overlay chapter-clear-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={chapterClear.title}
        >
          <div className="sheet gold-frame chapter-clear-panel" data-fx="chapter-clear">
            <h1 className="chapter-clear-title">{chapterClear.title}</h1>
            <p className="chapter-clear-sub">同行旅人</p>
            <ul className="chapter-clear-names">
              {chapterClear.names.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className="chapter-clear-hold-hint" aria-hidden={!chapterClearReady}>
              {chapterClearReady ? "" : "……"}
            </p>
            <div className="list-btns">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!chapterClearReady}
                onClick={() => {
                  if (!chapterClearReady) return;
                  setChapterClear(null);
                  setChapterClearReady(false);
                  if (pendingEnding) {
                    say(pendingEnding);
                    setPendingEnding(null);
                  }
                }}
              >
                繼續徘徊
              </button>
              {chapterClear.offerSecond && (
                <button
                  type="button"
                  className="btn"
                  disabled={!chapterClearReady}
                  data-qa="clear-second-chronicle"
                  onClick={() => {
                    if (!chapterClearReady) return;
                    setChapterClear(null);
                    setChapterClearReady(false);
                    setPendingEnding(null);
                    if (save) persist(save);
                    setScreen("chronicleConfirm");
                  }}
                >
                  趙雲列傳
                </button>
              )}
              {chapterClear.offerConfluence && (
                <button
                  type="button"
                  className="btn"
                  disabled={!chapterClearReady}
                  data-qa="clear-confluence"
                  onClick={() => {
                    if (!chapterClearReady) return;
                    setChapterClear(null);
                    setChapterClearReady(false);
                    setPendingEnding(null);
                    if (save) persist(save);
                    setScreen("confluenceConfirm");
                  }}
                >
                  匯合篇
                </button>
              )}
              <button
                type="button"
                className="btn"
                disabled={!chapterClearReady}
                onClick={() => {
                  if (!chapterClearReady) return;
                  setChapterClear(null);
                  setChapterClearReady(false);
                  setPendingEnding(null);
                  if (save) persist(save);
                  setScreen("title");
                }}
              >
                回標題
              </button>
            </div>
          </div>
        </div>
      )}
      {preBattle && save && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="開戰前">
          <div className="sheet gold-frame prebattle-sheet">
            <h2>即將開戰</h2>
            <p className="enemy-name">{preBattle.name}</p>
            <p className="threat">{preBattle.threat}</p>
            <div className="list-btns">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setPreBattle(null);
                  startBattle(save, pendingEnemies, pendingKind, battleBg);
                }}
              >
                進入戰鬥
              </button>
            </div>
          </div>
        </div>
      )}
      {nightTalk && nightTalk[nightTalkAt] && (
        <div
          className="night-talk-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="圍爐夜話"
          data-qa="night-talk"
          onClick={advanceNightTalk}
        >
          <div className="night-talk-panel">
            {nightTalk[nightTalkAt].portrait && (
              <img
                className="night-talk-portrait"
                src={nightTalk[nightTalkAt].portrait}
                alt={nightTalk[nightTalkAt].speaker}
                width={112}
                height={148}
              />
            )}
            <div className="night-talk-nameplate">{nightTalk[nightTalkAt].speaker}</div>
            <p className="night-talk-line">{nightTalk[nightTalkAt].text}</p>
            <div className="night-talk-hint">輕觸繼續</div>
          </div>
        </div>
      )}
      {nightDeep && (
        <div
          className="overnight-veil night-deep-veil"
          role="status"
          aria-live="polite"
          data-fx="night-deep"
          data-qa="night-deep"
        >
          <div className="overnight-popup" aria-label="夜深了">
            <div className="overnight-popup-kicker">營火・夜話</div>
            <div className="overnight-popup-title">夜深了</div>
            <div className="overnight-popup-sub">氣力稍復・見聞已記</div>
          </div>
        </div>
      )}
      {battleFx && <div className={`battle-veil ${battleFx}`} aria-hidden="true" />}

      {travelBanner && (
        <div className="overlay travel-banner-overlay" role="status" aria-live="polite" data-qa="travel-banner">
          <div className="sheet gold-frame travel-banner-panel">
            <div className="travel-banner-kicker">天下圖</div>
            <h1 className="travel-banner-title">旅途…</h1>
            <p className="travel-banner-sub">驛道塵起，旌旗南指</p>
          </div>
        </div>
      )}
      {tipPage !== null && (
        <div className="overlay tip-cards-overlay" role="dialog" aria-modal="true" data-qa="tip-cards">
          <div className="sheet gold-frame tip-card-panel" data-qa={`tip-card-${tipPage}`}>
            <div className="tip-card-kicker">初行提示・{tipPage + 1}/{TIPS.length}</div>
            <h1 className="tip-card-title">{TIPS[tipPage].title}</h1>
            <p className="tip-card-body">{TIPS[tipPage].body}</p>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn"
                data-qa="tip-skip"
                onClick={() => {
                  markTipsSeen();
                  setTipPage(null);
                }}
              >
                跳過
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-qa="tip-next"
                onClick={() => {
                  if (tipPage >= TIPS.length - 1) {
                    markTipsSeen();
                    setTipPage(null);
                  } else {
                    setTipPage(tipPage + 1);
                  }
                }}
              >
                {tipPage >= TIPS.length - 1 ? "開始" : "下一頁"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

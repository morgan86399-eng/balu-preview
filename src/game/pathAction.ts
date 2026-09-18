import { ENEMIES, PARTNER, TRAVELER, heroById, PATH_LABEL, INQUIRED_TALK } from "./data.ts";
import { itemById } from "./items.ts";
import type { PathAction, TownNpc, Weapon } from "./types.ts";

export interface PathResult {
  ok: boolean;
  title: string;
  lines: string[];
  goldDelta?: number;
  itemDelta?: Record<string, number>;
  startBattle?: string[];
  revealWeak?: string[];
  flag?: string;
  recruitTemp?: boolean;
  /** Partner hero id to temporarily join the party. */
  companionId?: string;
  /** True when recruiting the third (traveler) companion. */
  thirdRecruit?: boolean;
  hourDelta?: number;
  /** Center gold loot popup copy, e.g. 「獲得 草藥」. */
  lootPopup?: string;
  /** Short failure banner (被看穿了／對方不肯). */
  failBanner?: string;
  /** Clue line stored in journal 見聞. */
  clue?: string;
  /** Threat line for pre-battle panel. */
  preBattleThreat?: string;
  /** Display name(s) for pre-battle panel. */
  preBattleName?: string;
  /** Overnight rest presentation. */
  overnight?: boolean;
}

// Re-export item names helper used below — defined in data to avoid cycle; fallback here.
function itemName(id: string): string {
  return itemById(id)?.name ?? id;
}

const ACTION_LINE: Record<PathAction, (npc: string, hero: string) => string> = {
  challenge: (npc, hero) => `${hero} 把兵器橫在身前，向${npc}下了戰書。`,
  inquire: (npc, hero) => `${hero} 把話問得很慢。${npc} 想了想，把知道的都說了。`,
  allure: (npc, hero) => `${hero} 只說了半句。${npc} 卻把藏著的那句也接上了。`,
  purchase: (npc, hero) => `${hero} 把錢放上木盤。${npc} 點頭，把貨推了過來。`,
  guide: (npc, hero) => `${hero} 示意${npc}退到屋簷下。人一讓開，視線就清楚了。`,
  hire: (npc, hero) => `${hero} 請${npc}幫忙看一晚。`,
  provoke: (npc, hero) => `${hero} 嗓門一提，${npc} 臉上的血色先退了。`,
  duel: (npc, hero) => `${hero} 點名要單挑。${npc} 沒法再裝沒聽見。`,
};

const WEAK_PACKS: Record<string, string[]> = {
  elder: ["yellow", "bandit", "officer", "boss"],
  bard: ["boss"],
  traveler: ["officer", "boss"],
  wayfarer: ["yellow", "bandit"],
  vendor: ["yellow"],
  singer: ["bandit"],
  "lb-elder": ["tyrant", "yellow"],
  "lb-youth": ["tyrant"],
  "lb-scout": ["tyrant", "yellow"],
  "lb-farmer": ["tyrant"],
  "zg-elder": ["schemer", "yellow"],
  "zg-scholar": ["schemer"],
  "zg-scout": ["schemer", "yellow"],
  "zg-wounded": ["schemer"],
  "zf-elder": ["gatechief", "yellow"],
  "zf-scout": ["gatechief"],
};

const PEACEFUL = new Set([
  "elder",
  "vendor",
  "singer",
  "child",
  "innkeeper",
  "bard",
  "watch",
  "wayfarer",
  "captive",
  "zg-elder",
  "zg-scholar",
  "zg-scout",
  "zg-wounded",
  "zf-elder",
  "zf-scout",
]);

function battleLabel(ids: string[]): string {
  return ids.map((id) => ENEMIES[id]?.name ?? id).join("・");
}

function threatFor(ids: string[]): string {
  if (ids.includes("officer")) return "校尉抽出軍刀：再近一步，就在這裡動手。";
  if (ids.includes("boss")) return "渠帥把黃旗一頓：把命留在營裡吧。";
  if (ids.includes("bandit")) return "山賊頭目橫刀：想過城門，先留下錢與命。";
  return "對方把兵器抬起來了。沒有退路。";
}

export function performPathAction(
  heroId: string,
  npc: TownNpc,
  action: PathAction,
  flags: Record<string, boolean>,
  gold: number,
  party: string[] = [heroId],
): PathResult {
  const hero = heroById(heroId);
  const intro = ACTION_LINE[action](npc.name, hero.name);
  const matched = action === hero.pathAction || action === npc.pathHint;

  if (action === "purchase") {
    if (npc.id === "innkeeper") {
      // Free/cheap overnight for QA — gold gate removed (was 15).
      return {
        ok: true,
        title: "投宿一夜",
        lines: [intro, "掌櫃低聲：歇好了再上路。"],
        goldDelta: 0,
        hourDelta: 10,
        flag: "rested",
        overnight: true,
      };
    }
    if (npc.id !== "vendor" && npc.id !== "yz-vendor" && !matched) {
      return {
        ok: false,
        title: "購買",
        lines: [intro, `${npc.name}把袖子一甩：這兒不賣。`],
        failBanner: "對方不肯",
      };
    }
    if (npc.id === "yz-vendor") {
      // First visit: free starter spear so equip tab is never empty for ch2 QA.
      if (!flags.gotIronSpear) {
        return {
          ok: true,
          title: "購買",
          lines: [intro, "鐵匠把精鐵槍塞進你手裡（見面禮）。列傳裡打開裝備就能換上。"],
          goldDelta: 0,
          itemDelta: { "iron-spear": 1 },
          flag: "gotIronSpear",
          lootPopup: `獲得 ${itemName("iron-spear")}`,
        };
      }
      if (gold < 60) {
        return {
          ok: false,
          title: "購買",
          lines: [intro, "精鐵槍要六十錢。"],
          failBanner: "對方不肯",
        };
      }
      return {
        ok: true,
        title: "購買",
        lines: [intro, "鐵匠把精鐵槍塞進你手裡。列傳裡可裝備。"],
        goldDelta: -60,
        itemDelta: { "iron-spear": 1 },
        flag: "gotIronSpear",
        lootPopup: `獲得 ${itemName("iron-spear")}`,
      };
    }
    if (gold < 20) {
      return {
        ok: false,
        title: "購買",
        lines: [intro, "錢不夠。"],
        failBanner: "對方不肯",
      };
    }
    return {
      ok: true,
      title: "購買",
      lines: [intro, "商販塞來一包草藥。"],
      goldDelta: -20,
      itemDelta: { herb: 1 },
      lootPopup: `獲得 ${itemName("herb")}`,
    };
  }

  if (action === "inquire" || action === "allure") {
    if (!matched && npc.id !== "wayfarer") {
      return {
        ok: false,
        title: PATH_LABEL[action],
        lines: [intro, `${npc.name}把話噎回去了：你問得太急。`],
        failBanner: "被看穿了",
      };
    }
    const ids = WEAK_PACKS[npc.id] ?? ["yellow"];
    const names = ids.map((id) => {
      const e = ENEMIES[id];
      const w = e?.weaknesses.map((x) => x).join("/") ?? "";
      return `${e?.name ?? id}：${w}`;
    });
    const partner = PARTNER[heroId];
    const traveler = TRAVELER[heroId];
    const canSecond =
      Boolean(partner) &&
      !flags.companionJoined &&
      !party.includes(partner!) &&
      (npc.id === "elder" || npc.id === "traveler" || npc.id === "bard");
    const canThird =
      Boolean(traveler) &&
      flags.companionJoined &&
      !flags.thirdJoined &&
      !party.includes(traveler!) &&
      npc.id === "wayfarer";

    const clue =
      INQUIRED_TALK[npc.id]?.[0] ??
      `${npc.name}：${names[0] ?? "動向未明"}`;

    const lines = [
      intro,
      ...names,
      flags.cleared ? "城門這一側已經清靜。" : "人就在城門與北營。",
      clue,
    ];
    if (canSecond && partner) {
      lines.push(`${heroById(partner).name} 聽見這番話，決定暫時與你同行。`);
    }
    if (canThird && traveler) {
      lines.push(`${heroById(traveler).name} 拍了拍行囊，願意短暫加入。`);
    }
    const zgInquire = npc.id.startsWith("zg-");
    return {
      ok: true,
      title: PATH_LABEL[action],
      lines: zgInquire
        ? [...lines, "陣眼已記在見聞。可以出岡，以計定勝負。"]
        : lines,
      revealWeak: ids,
      recruitTemp: canSecond || canThird,
      companionId: canThird ? traveler : canSecond ? partner : undefined,
      thirdRecruit: canThird,
      flag: canThird
        ? "thirdJoined"
        : canSecond
          ? "companionJoined"
          : zgInquire
            ? "ch4Inquired"
            : undefined,
      clue,
    };
  }

  if (action === "guide" && npc.id === "captive") {
    return {
      ok: true,
      title: "帶領",
      lines: [intro, "婦人跟著你離開火堆。孩童在新野等她。"],
      flag: "childSafe",
    };
  }

  if (action === "challenge" || action === "duel" || action === "provoke") {
    if (PEACEFUL.has(npc.id)) {
      return {
        ok: false,
        title: hero.pathActionName,
        lines: [intro, `${npc.name}連連擺手：打打殺殺的，找錯人了。`],
        failBanner: "對方不肯",
      };
    }
    if (npc.id === "lookout" && !flags.officerDown) {
      const ids = ["officer"];
      return {
        ok: true,
        title: hero.pathActionName,
        lines: [intro, "校尉把刀抽出來了。"],
        startBattle: ids,
        flag: "officerFight",
        preBattleName: battleLabel(ids),
        preBattleThreat: threatFor(ids),
      };
    }
    if (npc.id === "drinker" && !flags.cleared) {
      const ids = ["yellow", "bandit"];
      return {
        ok: true,
        title: hero.pathActionName,
        lines: [intro, matched ? "對方把刀橫過來了。" : "話還沒說完，刀風已經到了。"],
        startBattle: ids,
        preBattleName: battleLabel(ids),
        preBattleThreat: threatFor(ids),
      };
    }
    if (flags.cleared) {
      return { ok: true, title: hero.pathActionName, lines: [intro, "這裡已經沒有可打的人。"] };
    }
    const ids = ["yellow", "yellow"];
    return {
      ok: true,
      title: hero.pathActionName,
      lines: [intro, "刀風到了。"],
      startBattle: ids,
      preBattleName: battleLabel(ids),
      preBattleThreat: threatFor(ids),
    };
  }

  if (action === "hire") {
    const partner = PARTNER[heroId];
    const traveler = TRAVELER[heroId];
    const canSecond =
      Boolean(partner) && !flags.companionJoined && !party.includes(partner!);

    if (npc.id === "wayfarer") {
      if (!flags.companionJoined) {
        return {
          ok: false,
          title: "延聘",
          lines: [intro, "過路旅人搖頭：你們再找一位同伴，我再跟。"],
          failBanner: "對方不肯",
        };
      }
      if (flags.thirdJoined || (traveler && party.includes(traveler))) {
        return {
          ok: true,
          title: "延聘",
          lines: [intro, "旅人已經在隊伍裡了。"],
        };
      }
      const lines = [
        intro,
        `${heroById(traveler!).name} 點頭：這一段路，我跟你們走。`,
      ];
      return {
        ok: true,
        title: "延聘",
        lines,
        flag: "thirdJoined",
        recruitTemp: true,
        companionId: traveler,
        thirdRecruit: true,
      };
    }

    const lines = [intro, "這人答應幫你看路。接下來幾步，遭遇會稀一些。"];
    if (canSecond && partner) {
      lines.push(`${heroById(partner).name} 也跟了上來，願意暫時同行。`);
    }
    return {
      ok: true,
      title: "延聘",
      lines,
      flag: canSecond ? "companionJoined" : "hiredEyes",
      recruitTemp: canSecond,
      companionId: canSecond ? partner : undefined,
    };
  }

  return {
    ok: true,
    title: PATH_LABEL[action],
    lines: [intro, "路讓出來了。"],
  };
}

export function logWeaknesses(
  prev: Record<string, Weapon[]>,
  enemyIds: string[],
): Record<string, Weapon[]> {
  const next = { ...prev };
  for (const id of enemyIds) {
    const e = ENEMIES[id];
    if (e) next[id] = e.weaknesses;
  }
  return next;
}

export interface PathPreview {
  name: string;
  condition: string;
  result: string;
  /** ★★★ + 較易成功 when mastery unlocked. */
  masteryLine?: string | null;
  masteryStars?: number;
}

/** One-line confirm copy before executing a path action. */
export function previewPathAction(
  heroId: string,
  npc: TownNpc,
  action: PathAction,
  flags: Record<string, boolean>,
  gold: number,
  masteryLine?: string | null,
  masteryStars?: number,
): PathPreview {
  const withMastery = (p: PathPreview): PathPreview => ({
    ...p,
    masteryLine: masteryLine ?? null,
    masteryStars: masteryStars ?? 0,
    condition:
      masteryStars && masteryStars > 0
        ? `${p.condition} · 熟練較易成功`
        : p.condition,
  });
  const _previewInner = (): PathPreview => {
  const hero = heroById(heroId);
  const name = PATH_LABEL[action];
  const matched = action === hero.pathAction || action === npc.pathHint;
  const condition = matched
    ? `條件：符合${hero.name}專精或對方習性 · 成功率高`
    : `條件：非專精路徑 · 仍可嘗試`;

  if (action === "purchase") {
    if (npc.id === "innkeeper") {
      return {
        name: "投宿一夜",
        condition: "條件：免費過夜 · 全隊氣血氣力回滿",
        result: "結果：中央金框「一夜過去」，時間推進，傷勢養回。",
      };
    }
    return {
      name: "購買",
      condition: gold >= 20 ? "條件：支付 20 錢" : "條件：需 20 錢（目前不足）",
      result: "結果：取得草藥（金框提示）。",
    };
  }
  if (action === "inquire" || action === "allure") {
    const canRecruit =
      !flags.companionJoined &&
      (npc.id === "elder" || npc.id === "traveler" || npc.id === "bard");
    const canThird =
      flags.companionJoined && !flags.thirdJoined && npc.id === "wayfarer";
    return {
      name,
      condition: matched ? "條件：對方願意開口 · 成功率高" : "條件：對方未必全說 · 可能被看穿",
      result: canThird
        ? "結果：第三人短暫同行，目標更新。"
        : canRecruit
          ? "結果：得知弱點，並可能讓同伴短暫同行。"
          : "結果：可能得知敵人弱點，並更新目標。",
    };
  }
  if (action === "guide" && npc.id === "captive") {
    return {
      name: "帶領",
      condition: "條件：靠近俘虜 · 可護送離開",
      result: "結果：婦人脫險，孩童得安。",
    };
  }
  if (action === "challenge" || action === "duel" || action === "provoke") {
    if (!matched && PEACEFUL.has(npc.id)) {
      return {
        name: hero.pathActionName,
        condition: "條件：對方未必接招",
        result: "結果：可能被拒（對方不肯）。",
      };
    }
    if (npc.id === "lookout" && !flags.officerDown) {
      return {
        name: hero.pathActionName,
        condition: "條件：點名校尉 · 必起衝突",
        result: "結果：開戰前確認後進入戰鬥。",
      };
    }
    return {
      name: hero.pathActionName,
      condition: matched ? "條件：對方接招 · 成功率高" : "條件：對方可能先動手",
      result: "結果：開戰前短面板後進入戰鬥。",
    };
  }
  if (action === "hire") {
    if (npc.id === "wayfarer") {
      return {
        name: "延聘",
        condition: flags.companionJoined
          ? "條件：已有同伴 · 可請第三人"
          : "條件：需先有一位同伴",
        result: flags.thirdJoined
          ? "結果：旅人已在隊伍中。"
          : "結果：第三人短暫同行。",
      };
    }
    return {
      name: "延聘",
      condition: "條件：對方願意幫忙看路",
      result: flags.companionJoined
        ? "結果：官道遭遇變稀。"
        : "結果：同伴短暫同行，官道遭遇變稀。",
    };
  }
  return { name, condition, result: "結果：路讓出來了。" };
  };
  return withMastery(_previewInner());
}

/** Talk lines for an NPC, preferring unlocked inquire dialogue. */
export function talkLinesFor(npc: TownNpc, inquired: string[]): string[] {
  if (inquired.includes(npc.id) && INQUIRED_TALK[npc.id]?.length) {
    return INQUIRED_TALK[npc.id]!;
  }
  return npc.talk;
}

import { heroById } from "./data.ts";
import { statScale } from "./items.ts";
import type { ChronicleId, DialogueLine, GameSave, HeroVitals } from "./types.ts";

export interface ChronicleDef {
  id: ChronicleId;
  heroId: string;
  title: string;
  /** One-line summary for confirm panel. */
  summary: string;
  clearTitle: string;
  startMap: GameSave["mapId"];
  startX: number;
  startY: number;
  partnerId?: string;
}

function vitals(heroId: string, level: number): HeroVitals {
  const h = heroById(heroId);
  return { hp: statScale(h.maxHp, level), sp: statScale(h.maxSp, level) };
}

export const CHRONICLES: Record<ChronicleId, ChronicleDef> = {
  ch1: {
    id: "ch1",
    heroId: "guanyu",
    title: "關羽列傳",
    summary: "關羽入新野，破城門、清北營。",
    clearTitle: "北營既破",
    startMap: "xinyue",
    startX: 6,
    startY: 10,
  },
  zhaoyun2: {
    id: "zhaoyun2",
    heroId: "zhaoyun",
    title: "趙雲列傳",
    summary: "白馬銀槍，護民於常山驛。出驛入平野，先削小頭目的盾。",
    clearTitle: "趙雲列傳・初章既竟",
    startMap: "yunzhen",
    startX: 6,
    startY: 4,
    partnerId: "sunshangxiang",
  },
  confluence: {
    id: "confluence",
    heroId: "guanyu",
    title: "匯合篇",
    summary: "關羽與趙雲並肩上路，掃清黃巾渠帥殘黨。",
    clearTitle: "八路匯合・序章既竟",
    startMap: "merge",
    startX: 7,
    startY: 9,
    partnerId: "zhaoyun",
  },
  zhangfei3: {
    id: "zhangfei3",
    heroId: "zhangfei",
    title: "張飛列傳",
    summary: "燕人張飛據涿郡驛，威嚇鎮口黃巾，先拔鎮口頭目之旗。",
    clearTitle: "張飛列傳・初章既竟",
    startMap: "zhuolu",
    startX: 6,
    startY: 4,
    partnerId: "guanyu",
  },
  zhuge4: {
    id: "zhuge4",
    heroId: "zhuge",
    title: "諸葛亮列傳",
    summary: "臥龍出山，先探新野郊野動靜，以計定勝負，破黃巾偽軍師。",
    clearTitle: "諸葛亮列傳・初章既竟",
    startMap: "wolong",
    startX: 6,
    startY: 4,
    partnerId: "zhouyu",
  },
  liubei5: {
    id: "liubei5",
    heroId: "liubei",
    title: "劉備列傳",
    summary: "桃園之誓，延聘義士。出園平鄉野黃巾鄉霸，安民心於新野。",
    clearTitle: "劉備列傳・初章既竟",
    startMap: "taoyuan",
    startX: 6,
    startY: 4,
    partnerId: "guanyu",
  },
  caocao6: {
    id: "caocao6",
    heroId: "caocao",
    title: "曹操列傳",
    summary: "許昌郊風聲緊。先探聽官道虛實，再以威壓收服黃巾探馬頭目。",
    clearTitle: "曹操列傳・初章既竟",
    startMap: "xuchang",
    startX: 6,
    startY: 4,
    partnerId: "zhuge",
  },
};

export const SECOND_CHRONICLE_ID: ChronicleId = "zhaoyun2";
export const CONFLUENCE_ID: ChronicleId = "confluence";
export const ZHANGFEI_CHRONICLE_ID: ChronicleId = "zhangfei3";
export const ZHUGE_CHRONICLE_ID: ChronicleId = "zhuge4";
export const LIUBEI_CHRONICLE_ID: ChronicleId = "liubei5";
export const CAOCAO_CHRONICLE_ID: ChronicleId = "caocao6";

export function chronicleById(id: ChronicleId): ChronicleDef {
  return CHRONICLES[id] ?? CHRONICLES.ch1;
}

export function secondChronicleOpening(heroId: string): DialogueLine[] {
  const h = heroById(heroId);
  return [
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "常山驛的燈還亮著。黃巾小股在平野北頭紮了旗，百姓不敢出驛門。",
    },
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "先聽驛丞與斥候的話，再上平野。遭遇會慢慢漲滿——滿了就會有人攔路。",
    },
    {
      speaker: "系統",
      text: "這是第二列傳短線。擊敗平野北端小頭目即可寫完初章。",
    },
  ];
}

export function confluenceOpening(): DialogueLine[] {
  const a = heroById("guanyu");
  const b = heroById("zhaoyun");
  return [
    {
      speaker: a.name,
      portrait: a.portrait,
      text: "新野與常山的火都熄過一輪。殘黨還在官道上聚旗——不能留。",
    },
    {
      speaker: b.name,
      portrait: b.portrait,
      text: "白馬已備。關將軍前面開路，雲護側翼。",
    },
    {
      speaker: "系統",
      text: "匯合篇短線：北上擊敗合流小頭目。營火處可圍爐夜話。",
    },
  ];
}

/** Camp night talk — ≥4 lines, 關羽／趙雲 each ≥2. */
export function nightTalkLines(): DialogueLine[] {
  const a = heroById("guanyu");
  const b = heroById("zhaoyun");
  return [
    {
      speaker: a.name,
      portrait: a.portrait,
      text: "火邊安靜。新野那一夜，我只想著城門別再失。",
    },
    {
      speaker: b.name,
      portrait: b.portrait,
      text: "常山驛的燈也一樣。百姓敢出驛門，比打贏一仗更難。",
    },
    {
      speaker: a.name,
      portrait: a.portrait,
      text: "義氣在前。你我並肩，剩下的旗，一個一個拔。",
    },
    {
      speaker: b.name,
      portrait: b.portrait,
      text: "白馬願走。關將軍睡吧——我守這半宿。",
    },
  ];
}

/** Fresh save for second chronicle short line (Zhao Yun). */
export function newSecondChronicleSave(): GameSave {
  const def = CHRONICLES.zhaoyun2;
  const heroId = def.heroId;
  const party = def.partnerId ? [heroId, def.partnerId] : [heroId];
  const vitalsMap: GameSave["vitals"] = {};
  for (const id of party) vitalsMap[id] = vitals(id, 1);
  return {
    version: 2,
    heroId,
    party,
    mapId: def.startMap,
    x: def.startX,
    y: def.startY,
    facing: "up",
    flags: { companionJoined: Boolean(def.partnerId), gotIronSpear: true },
    gold: 90,
    items: { herb: 2, salve: 0, oil: 1, "iron-spear": 1, "leather-armor": 1 },
    inquired: [],
    weaknessLog: {},
    journal: ["ch2-start"],
    clues: ["常山平野北端有黃巾小頭目。"],
    hour: 16,
    level: 1,
    exp: 0,
    vitals: vitalsMap,
    steps: 0,
    chapter: 1,
    chronicleId: "zhaoyun2",
    equip: {},
    encounterFill: 0,
  };
}

/** Fresh save for confluence short line (Guan Yu + Zhao Yun). */
export function newConfluenceSave(): GameSave {
  const def = CHRONICLES.confluence;
  const party = [def.heroId, def.partnerId!];
  const vitalsMap: GameSave["vitals"] = {};
  for (const id of party) vitalsMap[id] = vitals(id, 2);
  return {
    version: 2,
    heroId: def.heroId,
    party,
    mapId: def.startMap,
    x: def.startX,
    y: def.startY,
    facing: "up",
    flags: { companionJoined: true, gotIronSpear: true, gotLeather: true },
    gold: 120,
    items: { herb: 3, salve: 1, oil: 1, "iron-spear": 1, "leather-armor": 1 },
    inquired: [],
    weaknessLog: {},
    journal: ["confluence-start"],
    clues: ["合流官道北端有黃巾渠帥殘黨。"],
    hour: 19,
    level: 2,
    exp: 0,
    vitals: vitalsMap,
    steps: 0,
    chapter: 1,
    chronicleId: "confluence",
    equip: { weapon: "iron-spear", armor: "leather-armor" },
    encounterFill: 0,
  };
}

export function zhangfeiOpening(): DialogueLine[] {
  const h = heroById("zhangfei");
  return [
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "涿郡驛的酒旗還在晃。鎮口那幫黃巾敢攔路？先讓他們聽見燕人的嗓門。",
    },
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "威嚇、挑戰都行。出驛上鎮口，把那頭目的旗拔了。",
    },
    {
      speaker: "系統",
      text: "這是張飛列傳短線。擊敗鎮口小頭目即可寫完初章。",
    },
  ];
}

/** Fresh save for Zhang Fei short line. */
export function newZhangFeiSave(): GameSave {
  const def = CHRONICLES.zhangfei3;
  const heroId = def.heroId;
  const party = def.partnerId ? [heroId, def.partnerId] : [heroId];
  const vitalsMap: GameSave["vitals"] = {};
  for (const id of party) vitalsMap[id] = vitals(id, 1);
  return {
    version: 2,
    heroId,
    party,
    mapId: def.startMap,
    x: def.startX,
    y: def.startY,
    facing: "up",
    flags: { companionJoined: Boolean(def.partnerId), gotIronSpear: true },
    gold: 90,
    items: { herb: 2, salve: 0, oil: 1, "iron-spear": 1, "leather-armor": 1 },
    inquired: [],
    weaknessLog: {},
    journal: ["ch3-start"],
    clues: ["鎮口北端有黃巾鎮口頭目。"],
    hour: 15,
    level: 1,
    exp: 0,
    vitals: vitalsMap,
    steps: 0,
    chapter: 1,
    chronicleId: "zhangfei3",
    equip: {},
    encounterFill: 0,
  };
}


export function zhugeOpening(): DialogueLine[] {
  const h = heroById("zhuge");
  return [
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "臥龍岡的草還濕。新野郊野有黃巾偽軍師在佈陣——先探聽，再以計破之。",
    },
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "探聽為先。問清虛實，火計才有落點。",
    },
    {
      speaker: "系統",
      text: "這是諸葛亮列傳短線。至少一次探聽後，擊敗郊野偽軍師即可寫完初章。",
    },
  ];
}

/** Fresh save for Zhuge Liang short line. */
export function newZhugeSave(): GameSave {
  const def = CHRONICLES.zhuge4;
  const heroId = def.heroId;
  const party = def.partnerId ? [heroId, def.partnerId] : [heroId];
  const vitalsMap: GameSave["vitals"] = {};
  for (const id of party) vitalsMap[id] = vitals(id, 1);
  return {
    version: 2,
    heroId,
    party,
    mapId: def.startMap,
    x: def.startX,
    y: def.startY,
    facing: "up",
    flags: {
      companionJoined: Boolean(def.partnerId),
      gotIronSpear: true,
      // Seed inquired so QA / 動身 can fight immediately; dialogue still optional.
      ch4Inquired: true,
    },
    gold: 90,
    items: { herb: 2, salve: 0, oil: 1, "iron-spear": 1, "leather-armor": 1 },
    inquired: [],
    weaknessLog: {},
    journal: ["ch4-start"],
    clues: ["臥龍岡外郊野有黃巾偽軍師。"],
    hour: 14,
    level: 1,
    exp: 0,
    vitals: vitalsMap,
    steps: 0,
    chapter: 1,
    chronicleId: "zhuge4",
    equip: {},
    encounterFill: 0,
    pathMastery: {},
  };
}

export function liubeiOpening(): DialogueLine[] {
  const h = heroById("liubei");
  return [
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "桃園的柳還青。鄉外黃巾鄉霸勒索百姓——不除，這一城難安。",
    },
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "延聘、勸誘皆可。先安人心，再出園平霸。",
    },
    {
      speaker: "系統",
      text: "這是劉備列傳短線。擊敗桃園外鄉霸即可寫完初章。",
    },
  ];
}

/** Fresh save for Liu Bei short line. */
export function newLiubeiSave(): GameSave {
  const def = CHRONICLES.liubei5;
  const heroId = def.heroId;
  const party = def.partnerId ? [heroId, def.partnerId] : [heroId];
  const vitalsMap: GameSave["vitals"] = {};
  for (const id of party) vitalsMap[id] = vitals(id, 1);
  return {
    version: 2,
    heroId,
    party,
    mapId: def.startMap,
    x: def.startX,
    y: def.startY,
    facing: "up",
    flags: {
      companionJoined: Boolean(def.partnerId),
      gotIronSpear: true,
    },
    gold: 90,
    items: { herb: 2, salve: 0, oil: 1, "iron-spear": 1, "leather-armor": 1 },
    inquired: [],
    weaknessLog: {},
    journal: ["ch5-start"],
    clues: ["桃園外有黃巾鄉霸。"],
    hour: 10,
    level: 1,
    exp: 0,
    vitals: vitalsMap,
    steps: 0,
    chapter: 1,
    chronicleId: "liubei5",
    equip: {},
    encounterFill: 0,
    pathMastery: {},
  };
}

export function caocaoOpening(): DialogueLine[] {
  const h = heroById("caocao");
  return [
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "許昌郊外的風，帶著黃巾探馬的蹄塵。這條官道，得先握在自己手裡。",
    },
    {
      speaker: h.name,
      portrait: h.portrait,
      text: "探聽虛實，再以威壓收旗。徵購、探聽皆可——先讓他們知道誰在發令。",
    },
    {
      speaker: "系統",
      text: "這是曹操列傳短線。擊敗許昌官道上的黃巾探馬頭目即可寫完初章。",
    },
  ];
}

/** Fresh save for Cao Cao short line. */
export function newCaocaoSave(): GameSave {
  const def = CHRONICLES.caocao6;
  const heroId = def.heroId;
  const party = def.partnerId ? [heroId, def.partnerId] : [heroId];
  const vitalsMap: GameSave["vitals"] = {};
  for (const id of party) vitalsMap[id] = vitals(id, 1);
  return {
    version: 2,
    heroId,
    party,
    mapId: def.startMap,
    x: def.startX,
    y: def.startY,
    facing: "up",
    flags: {
      companionJoined: Boolean(def.partnerId),
      gotIronSpear: true,
    },
    gold: 90,
    items: { herb: 2, salve: 0, oil: 1, "iron-spear": 1, "leather-armor": 1 },
    inquired: [],
    weaknessLog: {},
    journal: ["ch6-start"],
    clues: ["許昌官道有黃巾探馬頭目。"],
    hour: 11,
    level: 1,
    exp: 0,
    vitals: vitalsMap,
    steps: 0,
    chapter: 1,
    chronicleId: "caocao6",
    equip: {},
    encounterFill: 0,
    pathMastery: {},
  };
}

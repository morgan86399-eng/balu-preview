import type { MapDef } from "./types.ts";

export const MAPS: Record<string, MapDef> = {
  xinyue: {
    id: "xinyue",
    name: "新野",
    bg: "./art/bg-town.png",
    lighting: "dusk",
    view: { northY: 0.2, southY: 0.86, northHalf: 0.18, southHalf: 0.46, centerX: 0.5 },
    tiles: [
      "#############",
      "#...GGGGG...#",
      "#...........#",
      "#hh.......hh#",
      "#...........#",
      "#...........#",
      "#g.........g#",
      "#...........#",
      "#....www....#",
      "#..........I#",
      "#...........#",
      "#############",
    ],
    npcs: [
      {
        id: "elder",
        name: "里長",
        x: 4,
        y: 7,
        pathHint: "inquire",
        talk: [
          "里長按著竹杖：黃巾昨夜摸到井邊。先把動向問清楚，再出城門。",
          "士卒怕刀、火、弓。頭目那一層盾比較厚，別急著硬拼。",
        ],
      },
      {
        id: "drinker",
        name: "酒客",
        x: 2,
        y: 5,
        pathHint: "challenge",
        talk: ["酒客把碗一頓：城門那幾個，我一個能打。你要是不服，現在就較量。"],
      },
      {
        id: "singer",
        name: "歌女",
        x: 10,
        y: 5,
        pathHint: "allure",
        talk: ["歌女把扇子合上：頭目愛聽奉承。有人肯勸，他會先把破綻露出來。"],
      },
      {
        id: "vendor",
        name: "商販",
        x: 9,
        y: 3,
        pathHint: "purchase",
        talk: ["商販壓低聲音：草藥、金創藥、火油都還有。出城門前帶上，總比空手強。"],
      },
      {
        id: "bounty-board",
        name: "懸賞板",
        x: 8,
        y: 7,
        pathHint: "inquire",
        talk: [
          "木板上墨跡未乾：懸賞——黃巾懸賞賊。接取後擊敗目標，回板交還。",
        ],
      },

      {
        id: "watch",
        name: "更夫",
        x: 4,
        y: 9,
        pathHint: "guide",
        nightOnly: true,
        talk: ["更夫提著燈：夜里城門只留一條縫。官道上有人咳嗽，不像過路的。"],
      },
      {
        id: "child",
        name: "孩童",
        x: 9,
        y: 9,
        pathHint: "hire",
        dayOnly: true,
        hideFlag: "childSafe",
        talk: ["孩童揪著衣角：阿娘被他們帶去營寨了。你們要是去，能不能把人帶回來。"],
      },
      {
        id: "wayfarer",
        name: "過路旅人",
        x: 7,
        y: 6,
        pathHint: "hire",
        hideFlag: "thirdJoined",
        talk: [
          "過路旅人把斗笠一掀：我也往北。你們若已有同伴，我不介意短暫同行。",
          "三人並肩，城門與北營都好走些。先探聽、再削盾。",
        ],
      },
    ],
    warps: [
      { x: 5, y: 1, to: "road", tx: 7, ty: 10, prompt: "出城，前往官道", requireFlag: "cleared" },
      { x: 6, y: 1, to: "road", tx: 7, ty: 10, prompt: "出城，前往官道", requireFlag: "cleared" },
      { x: 7, y: 1, to: "road", tx: 7, ty: 10, prompt: "出城，前往官道", requireFlag: "cleared" },
      { x: 11, y: 9, to: "inn", tx: 3, ty: 4, prompt: "推開客棧門" },
    ],
  },
  inn: {
    id: "inn",
    name: "新野客棧",
    bg: "./art/bg-inn.png",
    lighting: "warm",
    view: { northY: 0.3, southY: 0.78, northHalf: 0.28, southHalf: 0.36, centerX: 0.5 },
    tiles: [
      "#######",
      "#.....#",
      "#.....#",
      "#.....#",
      "#..D..#",
      "#######",
    ],
    npcs: [
      {
        id: "innkeeper",
        name: "掌櫃",
        x: 3,
        y: 2,
        pathHint: "purchase",
        talk: [
          "掌櫃擦著酒盞：今夜免費招待。選「投宿一夜」，傷勢與氣力都會養回來；燈火會換一輪。",
        ],
      },
      {
        id: "bard",
        name: "琴師",
        x: 1,
        y: 3,
        pathHint: "allure",
        talk: [
          "琴師把弦按住：黃巾渠帥在北營。他白天巡寨，夜里喝酒。有人能勸，比硬闖省事。",
        ],
      },
    ],
    warps: [{ x: 3, y: 4, to: "xinyue", tx: 10, ty: 10, prompt: "回到街上" }],
  },
  road: {
    id: "road",
    name: "新野官道",
    bg: "./art/bg-road.png",
    lighting: "noon",
    view: { northY: 0.22, southY: 0.8, northHalf: 0.14, southHalf: 0.38, centerX: 0.5 },
    tiles: [
      "###############",
      "#tt....C....tt#",
      "#tt.........tt#",
      "#.....rrr.....#",
      "#tt...rrr...tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#tt.........tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#......G......#",
      "###############",
    ],
    npcs: [
      {
        id: "traveler",
        name: "傷兵",
        x: 7,
        y: 8,
        pathHint: "hire",
        talk: [
          "傷兵靠著車轅：北面營寨插黃旗。校尉在路上巡，渠帥坐在最裡頭。",
        ],
      },
      {
        id: "bounty-outlaw",
        name: "黃巾懸賞賊",
        x: 5,
        y: 4,
        pathHint: "challenge",
        requireFlag: "bountyAccepted",
        hideFlag: "bountyTargetDown",
        talk: [
          "懸賞賊橫刀：懸賞板上寫我？來拿賞的，先留下命。",
        ],
      },

    ],
    warps: [
      { x: 7, y: 10, to: "xinyue", tx: 6, ty: 2, prompt: "返回新野" },
      { x: 7, y: 1, to: "camp", tx: 6, ty: 10, prompt: "潜入黃巾營寨", requireFlag: "roadScouted" },
    ],
    encounter: {
      steps: 6,
      softOnly: true,
      packs: [
        ["yellow"],
        ["yellow"],
        ["yellow", "yellow"],
        ["archer"],
      ],
    },
  },
  camp: {
    id: "camp",
    name: "黃巾北營",
    bg: "./art/bg-camp.png",
    lighting: "fire",
    view: { northY: 0.24, southY: 0.78, northHalf: 0.16, southHalf: 0.4, centerX: 0.5 },
    tiles: [
      "#############",
      "#TTT.....TTT#",
      "#T.........T#",
      "#....B......#",
      "#...........#",
      "#..T.....T..#",
      "#...........#",
      "#.....P.....#",
      "#...........#",
      "#...........#",
      "#.....G.....#",
      "#############",
    ],
    npcs: [
      {
        id: "captive",
        name: "被俘的阿娘",
        x: 7,
        y: 7,
        pathHint: "guide",
        hideFlag: "childSafe",
        talk: ["婦人把孩子的布繩握緊：求你帶我離開火堆。"],
      },
      {
        id: "lookout",
        name: "巡營校尉",
        x: 3,
        y: 5,
        pathHint: "duel",
        hideFlag: "officerDown",
        talk: ["校尉按刀：再近一步，就在營裡動手。"],
      },
    ],
    warps: [{ x: 6, y: 10, to: "road", tx: 7, ty: 2, prompt: "撤回官道" }],
  },

  yunzhen: {
    id: "yunzhen",
    name: "常山驛",
    bg: "./art/bg-town.png",
    lighting: "dusk",
    view: { northY: 0.2, southY: 0.86, northHalf: 0.18, southHalf: 0.46, centerX: 0.5 },
    tiles: [
      "#############",
      "#...GGGGG...#",
      "#...........#",
      "#hh.......hh#",
      "#...........#",
      "#...........#",
      "#g.........g#",
      "#...........#",
      "#....www....#",
      "#...........#",
      "#...........#",
      "#############",
    ],
    npcs: [
      {
        id: "yz-elder",
        name: "驛丞",
        x: 4,
        y: 7,
        pathHint: "inquire",
        talk: [
          "驛丞拱手：常山道上有黃巾小股。白馬將軍若肯出驛，平野那頭有個頭目在等。",
          "先到平野看看動靜。遭遇會慢慢漲滿——別硬闖。",
        ],
      },
      {
        id: "yz-vendor",
        name: "鐵匠",
        x: 9,
        y: 3,
        pathHint: "purchase",
        talk: [
          "鐵匠拍了拍槍架：白馬將軍，這支精鐵槍與一領皮甲先掛你名下。列傳裡打開「裝備」就能換上。",
          "要再買一把也可以——六十錢。",
        ],
      },
      {
        id: "yz-scout",
        name: "斥候",
        x: 7,
        y: 5,
        pathHint: "hire",
        talk: [
          "斥候指北：平野盡頭有黃旗。頭目盾不厚，削兩下就能破。",
        ],
      },
    ],
    warps: [
      { x: 4, y: 1, to: "field", tx: 7, ty: 10, prompt: "出驛，前往平野" },
      { x: 5, y: 1, to: "field", tx: 7, ty: 10, prompt: "出驛，前往平野" },
      { x: 6, y: 1, to: "field", tx: 7, ty: 10, prompt: "出驛，前往平野" },
      { x: 7, y: 1, to: "field", tx: 7, ty: 10, prompt: "出驛，前往平野" },
      { x: 8, y: 1, to: "field", tx: 7, ty: 10, prompt: "出驛，前往平野" },
      { x: 5, y: 2, to: "field", tx: 7, ty: 10, prompt: "出驛，前往平野" },
      { x: 6, y: 2, to: "field", tx: 7, ty: 10, prompt: "出驛，前往平野" },
      { x: 7, y: 2, to: "field", tx: 7, ty: 10, prompt: "出驛，前往平野" },
    ],
  },
  field: {
    id: "field",
    name: "常山平野",
    bg: "./art/bg-road.png",
    lighting: "noon",
    view: { northY: 0.22, southY: 0.8, northHalf: 0.14, southHalf: 0.38, centerX: 0.5 },
    tiles: [
      "###############",
      "#tt...BBB...tt#",
      "#tt...BBB...tt#",
      "#.....rrr.....#",
      "#tt...rrr...tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#tt.........tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#......G......#",
      "###############",
    ],
    npcs: [
      {
        id: "yz-lieutenant",
        name: "黃巾小帥",
        x: 7,
        y: 1,
        pathHint: "duel",
        hideFlag: "ch2Clear",
        talk: [
          "常山道從今日起歸我。白馬？拿來餵馬。",
        ],
      },
      {
        id: "yz-wounded",
        name: "傷卒",
        x: 5,
        y: 8,
        pathHint: "hire",
        talk: [
          "傷卒喘著：北面那個小頭目愛逞強。盾破了就完。",
        ],
      },
    ],
    warps: [
      { x: 7, y: 10, to: "yunzhen", tx: 6, ty: 2, prompt: "返回常山驛" },
    ],
    encounter: {
      steps: 5,
      softOnly: true,
      packs: [
        ["yellow"],
        ["yellow"],
        ["archer"],
        ["yellow", "yellow"],
      ],
    },
  },
  merge: {
    id: "merge",
    name: "合流官道",
    bg: "./art/bg-road.png",
    lighting: "dusk",
    view: { northY: 0.22, southY: 0.8, northHalf: 0.14, southHalf: 0.38, centerX: 0.5 },
    tiles: [
      "###############",
      "#tt...BBB...tt#",
      "#tt...BBB...tt#",
      "#.....rrr.....#",
      "#tt...rrr...tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#tt....F....tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#......G......#",
      "###############",
    ],
    npcs: [
      {
        id: "merge-remnant",
        name: "黃巾渠帥殘黨",
        x: 7,
        y: 1,
        pathHint: "duel",
        hideFlag: "confluenceClear",
        talk: [
          "殘黨把黃旗一頓：新野與常山都滅不了你們？那就在這裡決。",
        ],
      },
      {
        id: "merge-campfire",
        name: "營火",
        x: 7,
        y: 7,
        pathHint: "allure",
        talk: [
          "營火噼啪作響。今夜可圍爐夜話——聽聽彼此的路。",
        ],
      },
      {
        id: "merge-scout",
        name: "合流斥候",
        x: 5,
        y: 8,
        pathHint: "inquire",
        talk: [
          "斥候指北：渠帥殘部在北頭紮旗。兩位將軍並肩，盾會薄些。",
        ],
      },
    ],
    warps: [],
    encounter: {
      steps: 6,
      softOnly: true,
      packs: [
        ["yellow"],
        ["yellow"],
        ["archer"],
      ],
    },
  },
  zhuolu: {
    id: "zhuolu",
    name: "涿郡驛",
    bg: "./art/bg-town.png",
    lighting: "dusk",
    view: { northY: 0.2, southY: 0.86, northHalf: 0.18, southHalf: 0.46, centerX: 0.5 },
    tiles: [
      "#############",
      "#...GGGGG...#",
      "#...........#",
      "#hh.......hh#",
      "#...........#",
      "#...........#",
      "#g.........g#",
      "#...........#",
      "#....www....#",
      "#...........#",
      "#...........#",
      "#############",
    ],
    npcs: [
      {
        id: "zf-elder",
        name: "驛丞",
        x: 4,
        y: 7,
        pathHint: "inquire",
        talk: [
          "驛丞擦汗：鎮口黃巾紮了旗，過路的都繞道。燕將軍嗓門大，或許能把他們嚇跑。",
          "出北門就是鎮口。頭目愛逞強，威嚇、挑戰都試得。",
        ],
      },
      {
        id: "zf-drinker",
        name: "酒客",
        x: 9,
        y: 5,
        pathHint: "challenge",
        talk: [
          "酒客把碗一頓：鎮口那傢伙說自己天下第一。燕將軍不服？現在就較量——先拿他練手。",
        ],
      },
      {
        id: "zf-scout",
        name: "斥候",
        x: 7,
        y: 5,
        pathHint: "provoke",
        talk: [
          "斥候指北：頭目盾不厚。先吼一聲再上，他腿先軟。",
        ],
      },
    ],
    warps: [
      { x: 4, y: 1, to: "zgate", tx: 7, ty: 10, prompt: "出驛，前往鎮口" },
      { x: 5, y: 1, to: "zgate", tx: 7, ty: 10, prompt: "出驛，前往鎮口" },
      { x: 6, y: 1, to: "zgate", tx: 7, ty: 10, prompt: "出驛，前往鎮口" },
      { x: 7, y: 1, to: "zgate", tx: 7, ty: 10, prompt: "出驛，前往鎮口" },
      { x: 8, y: 1, to: "zgate", tx: 7, ty: 10, prompt: "出驛，前往鎮口" },
      { x: 5, y: 2, to: "zgate", tx: 7, ty: 10, prompt: "出驛，前往鎮口" },
      { x: 6, y: 2, to: "zgate", tx: 7, ty: 10, prompt: "出驛，前往鎮口" },
      { x: 7, y: 2, to: "zgate", tx: 7, ty: 10, prompt: "出驛，前往鎮口" },
    ],
  },
  zgate: {
    id: "zgate",
    name: "鎮口",
    bg: "./art/bg-road.png",
    lighting: "noon",
    view: { northY: 0.22, southY: 0.8, northHalf: 0.14, southHalf: 0.38, centerX: 0.5 },
    tiles: [
      "###############",
      "#tt...BBB...tt#",
      "#tt...BBB...tt#",
      "#.....rrr.....#",
      "#tt...rrr...tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#tt.........tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#......G......#",
      "###############",
    ],
    npcs: [
      {
        id: "zf-gatechief",
        name: "黃巾鎮口頭目",
        x: 7,
        y: 1,
        pathHint: "provoke",
        hideFlag: "ch3Clear",
        talk: [
          "鎮口從今日起歸我。燕人？嗓門再大也過不了這關。",
        ],
      },
      {
        id: "zf-wounded",
        name: "傷卒",
        x: 5,
        y: 8,
        pathHint: "challenge",
        talk: [
          "傷卒喘著：北面那個頭目最怕被吼。盾破了就完。",
        ],
      },
    ],
    warps: [
      { x: 7, y: 10, to: "zhuolu", tx: 6, ty: 2, prompt: "返回涿郡驛" },
    ],
    encounter: {
      steps: 5,
      softOnly: true,
      packs: [
        ["yellow"],
        ["yellow"],
        ["archer"],
        ["yellow", "yellow"],
      ],
    },
  },
  wolong: {
    id: "wolong",
    name: "臥龍岡",
    bg: "./art/bg-town.png",
    lighting: "dusk",
    view: { northY: 0.2, southY: 0.86, northHalf: 0.18, southHalf: 0.46, centerX: 0.5 },
    tiles: [
      "#############",
      "#...GGGGG...#",
      "#...........#",
      "#hh.......hh#",
      "#...........#",
      "#...........#",
      "#g.........g#",
      "#...........#",
      "#....www....#",
      "#...........#",
      "#...........#",
      "#############",
    ],
    npcs: [
      {
        id: "zg-elder",
        name: "村老",
        x: 4,
        y: 7,
        pathHint: "inquire",
        talk: [
          "村老撫鬚：郊野那偽軍師最愛虛張聲勢。先探聽他佈的陣眼，再對上火計。",
          "出北門就是新野郊野。探聽過後再上，計定勝負。",
        ],
      },
      {
        id: "zg-scholar",
        name: "書生",
        x: 9,
        y: 5,
        pathHint: "inquire",
        talk: [
          "書生低聲：偽軍師盾不厚，怕火與扇。諸葛先生若肯問，我把聽說的都講。",
        ],
      },
      {
        id: "zg-scout",
        name: "斥候",
        x: 7,
        y: 5,
        pathHint: "allure",
        talk: [
          "斥候指北：北端旗下就是偽軍師。先問清虛實再動手。",
        ],
      },
    ],
    warps: [
      { x: 4, y: 1, to: "nfield", tx: 7, ty: 10, prompt: "出岡，前往新野郊野" },
      { x: 5, y: 1, to: "nfield", tx: 7, ty: 10, prompt: "出岡，前往新野郊野" },
      { x: 6, y: 1, to: "nfield", tx: 7, ty: 10, prompt: "出岡，前往新野郊野" },
      { x: 7, y: 1, to: "nfield", tx: 7, ty: 10, prompt: "出岡，前往新野郊野" },
      { x: 8, y: 1, to: "nfield", tx: 7, ty: 10, prompt: "出岡，前往新野郊野" },
      { x: 5, y: 2, to: "nfield", tx: 7, ty: 10, prompt: "出岡，前往新野郊野" },
      { x: 6, y: 2, to: "nfield", tx: 7, ty: 10, prompt: "出岡，前往新野郊野" },
      { x: 7, y: 2, to: "nfield", tx: 7, ty: 10, prompt: "出岡，前往新野郊野" },
    ],
  },
  nfield: {
    id: "nfield",
    name: "新野郊野",
    bg: "./art/bg-road.png",
    lighting: "noon",
    view: { northY: 0.22, southY: 0.8, northHalf: 0.14, southHalf: 0.38, centerX: 0.5 },
    tiles: [
      "###############",
      "#tt...BBB...tt#",
      "#tt...BBB...tt#",
      "#.....rrr.....#",
      "#tt...rrr...tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#tt.........tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#......G......#",
      "###############",
    ],
    npcs: [
      {
        id: "zg-schemer",
        name: "黃巾偽軍師",
        x: 7,
        y: 1,
        pathHint: "inquire",
        hideFlag: "ch4Clear",
        talk: [
          "偽軍師搖扇：臥龍？不過一介山野。陣眼已成，今日定叫你空手而歸。",
        ],
      },
      {
        id: "zg-wounded",
        name: "傷卒",
        x: 5,
        y: 8,
        pathHint: "inquire",
        talk: [
          "傷卒喘著：北面那個偽軍師最怕被人看破陣眼。探聽後再上，他盾先鬆。",
        ],
      },
    ],
    warps: [
      { x: 7, y: 10, to: "wolong", tx: 6, ty: 2, prompt: "返回臥龍岡" },
    ],
    encounter: {
      steps: 5,
      softOnly: true,
      packs: [
        ["yellow"],
        ["yellow"],
        ["archer"],
        ["yellow", "yellow"],
      ],
    },
  },
  taoyuan: {
    id: "taoyuan",
    name: "桃園",
    bg: "./art/bg-town.png",
    lighting: "dusk",
    view: { northY: 0.2, southY: 0.86, northHalf: 0.18, southHalf: 0.46, centerX: 0.5 },
    tiles: [
      "#############",
      "#...GGGGG...#",
      "#...........#",
      "#hh.......hh#",
      "#...........#",
      "#...........#",
      "#g.........g#",
      "#...........#",
      "#....www....#",
      "#...........#",
      "#...........#",
      "#############",
    ],
    npcs: [
      {
        id: "lb-elder",
        name: "園中父老",
        x: 4,
        y: 7,
        pathHint: "hire",
        talk: [
          "父老拱手：園外鄉霸勒索過路人。劉使君若肯延聘義士，或可平之。",
          "出北門就是桃園外。鄉霸最吃硬勸與延聘之氣。",
        ],
      },
      {
        id: "lb-youth",
        name: "鄉勇",
        x: 9,
        y: 5,
        pathHint: "allure",
        talk: [
          "鄉勇握刀：願隨劉使君。先把鄉霸的旗拔了，百姓才敢種地。",
        ],
      },
      {
        id: "lb-scout",
        name: "斥候",
        x: 7,
        y: 5,
        pathHint: "inquire",
        talk: [
          "斥候指北：北端旗下就是黃巾鄉霸。延聘同行再上，更穩。",
        ],
      },
    ],
    warps: [
      { x: 4, y: 1, to: "tgarden", tx: 7, ty: 10, prompt: "出園，前往桃園外" },
      { x: 5, y: 1, to: "tgarden", tx: 7, ty: 10, prompt: "出園，前往桃園外" },
      { x: 6, y: 1, to: "tgarden", tx: 7, ty: 10, prompt: "出園，前往桃園外" },
      { x: 7, y: 1, to: "tgarden", tx: 7, ty: 10, prompt: "出園，前往桃園外" },
      { x: 8, y: 1, to: "tgarden", tx: 7, ty: 10, prompt: "出園，前往桃園外" },
      { x: 5, y: 2, to: "tgarden", tx: 7, ty: 10, prompt: "出園，前往桃園外" },
      { x: 6, y: 2, to: "tgarden", tx: 7, ty: 10, prompt: "出園，前往桃園外" },
      { x: 7, y: 2, to: "tgarden", tx: 7, ty: 10, prompt: "出園，前往桃園外" },
    ],
  },
  tgarden: {
    id: "tgarden",
    name: "桃園外",
    bg: "./art/bg-road.png",
    lighting: "noon",
    view: { northY: 0.22, southY: 0.8, northHalf: 0.14, southHalf: 0.38, centerX: 0.5 },
    tiles: [
      "###############",
      "#tt...BBB...tt#",
      "#tt...BBB...tt#",
      "#.....rrr.....#",
      "#tt...rrr...tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#tt.........tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#......G......#",
      "###############",
    ],
    npcs: [
      {
        id: "lb-tyrant",
        name: "黃巾鄉霸",
        x: 7,
        y: 1,
        pathHint: "hire",
        hideFlag: "ch5Clear",
        talk: [
          "鄉霸橫刀：桃園的地，從今日起歸我。仁義？拿來餵馬。",
        ],
      },
      {
        id: "lb-farmer",
        name: "農夫",
        x: 5,
        y: 8,
        pathHint: "allure",
        talk: [
          "農夫苦著臉：鄉霸要糧要人。劉使君若肯出面，我們跟您走。",
        ],
      },
    ],
    warps: [
      { x: 7, y: 10, to: "taoyuan", tx: 6, ty: 2, prompt: "返回桃園" },
    ],
    encounter: {
      steps: 5,
      softOnly: true,
      packs: [
        ["yellow"],
        ["yellow"],
        ["archer"],
        ["yellow", "yellow"],
      ],
    },
  },

  xuchang: {
    id: "xuchang",
    name: "許昌郊",
    bg: "./art/bg-town.png",
    lighting: "dusk",
    view: { northY: 0.2, southY: 0.86, northHalf: 0.18, southHalf: 0.46, centerX: 0.5 },
    tiles: [
      "#############",
      "#...GGGGG...#",
      "#...........#",
      "#hh.......hh#",
      "#...........#",
      "#...........#",
      "#g.........g#",
      "#...........#",
      "#....www....#",
      "#...........#",
      "#...........#",
      "#############",
    ],
    npcs: [
      {
        id: "cc-agent",
        name: "細作",
        x: 4,
        y: 7,
        pathHint: "inquire",
        talk: [
          "細作低聲：官道北旗下有黃巾探馬頭目。先探聽，再威壓，較穩。",
          "出北門就是官道。頭目最忌探聽與徵購斷其糧線。",
        ],
      },
      {
        id: "cc-captain",
        name: "親兵校尉",
        x: 9,
        y: 5,
        pathHint: "purchase",
        talk: [
          "校尉抱拳：丞相若徵購軍糧，沿途黃巾便難久駐。",
        ],
      },
      {
        id: "cc-scout",
        name: "斥候",
        x: 7,
        y: 5,
        pathHint: "inquire",
        talk: [
          "斥候指北：北端旗下就是探馬頭目。探聽清楚再上。",
        ],
      },
    ],
    warps: [
      { x: 4, y: 1, to: "xroad", tx: 7, ty: 10, prompt: "出郊，前往許昌官道" },
      { x: 5, y: 1, to: "xroad", tx: 7, ty: 10, prompt: "出郊，前往許昌官道" },
      { x: 6, y: 1, to: "xroad", tx: 7, ty: 10, prompt: "出郊，前往許昌官道" },
      { x: 7, y: 1, to: "xroad", tx: 7, ty: 10, prompt: "出郊，前往許昌官道" },
      { x: 8, y: 1, to: "xroad", tx: 7, ty: 10, prompt: "出郊，前往許昌官道" },
      { x: 5, y: 2, to: "xroad", tx: 7, ty: 10, prompt: "出郊，前往許昌官道" },
      { x: 6, y: 2, to: "xroad", tx: 7, ty: 10, prompt: "出郊，前往許昌官道" },
      { x: 7, y: 2, to: "xroad", tx: 7, ty: 10, prompt: "出郊，前往許昌官道" },
    ],
  },
  xroad: {
    id: "xroad",
    name: "許昌官道",
    bg: "./art/bg-road.png",
    lighting: "noon",
    view: { northY: 0.22, southY: 0.8, northHalf: 0.14, southHalf: 0.38, centerX: 0.5 },
    tiles: [
      "###############",
      "#tt...BBB...tt#",
      "#tt...BBB...tt#",
      "#.....rrr.....#",
      "#tt...rrr...tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#tt.........tt#",
      "#.....rrr.....#",
      "#tt.........tt#",
      "#......G......#",
      "###############",
    ],
    npcs: [
      {
        id: "cc-enforcer",
        name: "黃巾探馬頭目",
        x: 7,
        y: 1,
        pathHint: "purchase",
        hideFlag: "ch6Clear",
        talk: [
          "頭目橫刀：許昌官道的風聲，從今日起歸我。曹操？不過一丘貉。",
        ],
      },
      {
        id: "cc-merchant",
        name: "行商",
        x: 5,
        y: 8,
        pathHint: "purchase",
        talk: [
          "行商苦著臉：探馬要路錢。丞相若肯出面，我們跟您的旗走。",
        ],
      },
    ],
    warps: [
      { x: 7, y: 10, to: "xuchang", tx: 6, ty: 2, prompt: "返回許昌郊" },
    ],
    encounter: {
      steps: 5,
      softOnly: true,
      packs: [
        ["yellow"],
        ["yellow"],
        ["archer"],
        ["yellow", "yellow"],
      ],
    },
  },


};


/** Field miniboss zone — walk onto any of these to challenge 黃巾小帥. */
export const FIELD_MINIBOSS_COORDS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 8, y: 1 },
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },
];

export function isFieldMinibossTile(x: number, y: number): boolean {
  return FIELD_MINIBOSS_COORDS.some((c) => c.x === x && c.y === y);
}

/** Confluence miniboss zone — walk onto any of these to challenge 渠帥殘黨. */
export const MERGE_MINIBOSS_COORDS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 8, y: 1 },
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },
];

export function isMergeMinibossTile(x: number, y: number): boolean {
  return MERGE_MINIBOSS_COORDS.some((c) => c.x === x && c.y === y);
}

/** Zhang Fei gate miniboss zone. */
export const ZGATE_MINIBOSS_COORDS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 8, y: 1 },
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },
];

export function isZgateMinibossTile(x: number, y: number): boolean {
  return ZGATE_MINIBOSS_COORDS.some((c) => c.x === x && c.y === y);
}


/** Soft random packs suppressed on nfield until ch4Clear (miniboss path only). */
export function nfieldSoftEncountersSuppressed(flags: { ch4Clear?: boolean }): boolean {
  return !flags.ch4Clear;
}

/** Zhuge nfield miniboss zone — 黃巾偽軍師. */
export const NFIELD_MINIBOSS_COORDS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 8, y: 1 },
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },
];

export function isNfieldMinibossTile(x: number, y: number): boolean {
  return NFIELD_MINIBOSS_COORDS.some((c) => c.x === x && c.y === y);
}



/** Soft packs suppressed on tgarden until ch5Clear. */
export function tgardenSoftEncountersSuppressed(flags: { ch5Clear?: boolean }): boolean {
  return !flags.ch5Clear;
}

/** Liu Bei tgarden miniboss zone — 黃巾鄉霸. */
export const TGARDEN_MINIBOSS_COORDS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 8, y: 1 },
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },
];

export function isTgardenMinibossTile(x: number, y: number): boolean {
  return TGARDEN_MINIBOSS_COORDS.some((c) => c.x === x && c.y === y);
}


/** Soft packs suppressed on xroad until ch6Clear. */
export function xroadSoftEncountersSuppressed(flags: { ch6Clear?: boolean }): boolean {
  return !flags.ch6Clear;
}

/** Cao Cao xroad miniboss zone — 黃巾探馬頭目. */
export const XROAD_MINIBOSS_COORDS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 8, y: 1 },
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },
];

export function isXroadMinibossTile(x: number, y: number): boolean {
  return XROAD_MINIBOSS_COORDS.some((c) => c.x === x && c.y === y);
}

export function mapById(id: string): MapDef {
  const m = MAPS[id];
  if (!m) throw new Error(`unknown map ${id}`);
  return m;
}

export function tileAt(map: MapDef, x: number, y: number): string {
  return map.tiles[y]?.[x] ?? "#";
}

export function blockedTile(ch: string): boolean {
  return ch === "#" || ch === "h" || ch === "s" || ch === "w" || ch === "t" || ch === "T";
}

export function isNight(hour: number): boolean {
  return hour >= 20 || hour < 6;
}

export const START = { mapId: "xinyue" as const, x: 6, y: 10 };

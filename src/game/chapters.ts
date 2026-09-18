import { heroById } from "./data.ts";
import type { DialogueLine } from "./types.ts";

function line(speaker: string, text: string, portrait?: string): DialogueLine {
  return { speaker, portrait, text };
}

export function openingFor(heroId: string): DialogueLine[] {
  const h = heroById(heroId);
  const extra: Record<string, string> = {
    guanyu: "關羽把刀橫在背上。新野雖小，卻還有人把井水分給過路人。這樣的城，不能交給黃巾。",
    zhaoyun: "趙雲把銀槍點在石板上。城垛太矮，他已經數過城外有幾處炊煙。",
    zhangfei: "張飛把酒碗還給掌櫃。他說這城的酒淡，可人不能再淡下去。",
    zhuge: "諸葛亮看完城門的車轍。夜間有人運糧往北，轍印比商隊更深。",
    caocao: "曹操把地圖在袖裡折好。新野是棋盤上的一個點，點要先保住，棋才下得下去。",
    zhouyu: "周瑜聽城裡笛聲錯了一拍。亂世的前奏總是這樣起的。",
    sunshangxiang: "孫尚香把弓袋收緊。城垛後面那一撮黃旗，距離剛好在她的箭程裡。",
    diaochan: "貂蟬在燈下停住。她沒有帶兵器，可這座城的安危，已經壓到她肩上。",
  };
  return [
    line(h.name, h.opening, h.portrait),
    line(h.name, extra[heroId] ?? "新野的燈火還在。先把城裡的話聽完。", h.portrait),
    line("系統", "金圈是你能踏出的下一格。人站在街上，畫面上方是城門，下方是井。", undefined),
    line("系統", "靠近人時，右下角會變成路徑行動。戰鬥先削盾，打中弱點，再用蓄力加段數。", undefined),
  ];
}

export function recruitLines(heroId: string, partnerId: string): DialogueLine[] {
  const a = heroById(heroId);
  const b = heroById(partnerId);
  const pair: Record<string, string> = {
    guanyu: `${b.name}把矛一頓：二哥一個人衝營寨，我在後面看著都心煩。從此刻起，盾你削，人我擋。`,
    zhaoyun: `${b.name}把弓垂下：白馬跑得再快，也要有人給你看背後。我跟你去。`,
    zhangfei: `${b.name}把刀揹好：三弟的嗓門能把營寨掀開。刀還是我來。`,
    zhuge: `${b.name}把羽扇還給對方一半：軍師算路，火我來點。今晚北營會很亮。`,
    caocao: `${b.name}把扇骨敲了敲：主公要路，我給你把風向先量好。`,
    zhouyu: `${b.name}把箭袋轉到身前：都督的火要有人護著。箭我來。`,
    sunshangxiang: `${b.name}把銀槍橫過：郡主的箭雨需要有人把槍口先撕開。`,
    diaochan: `${b.name}把令箭收進袖裡：你能勸開的人，我就能編進隊伍。這筆帳，我們一起算。`,
  };
  return [
    line(b.name, pair[heroId] ?? `${b.name}點頭：這條路，我跟你一起。`, b.portrait),
    line(a.name, `${a.name}沒有推辭。隊伍裡終於有了第二個人。`, a.portrait),
  ];
}

export function gateClearLines(heroId: string): DialogueLine[] {
  const h = heroById(heroId);
  return [
    line(h.name, "城門這一側清靜了。官道往北，黃旗還在。", h.portrait),
    line("系統", "可回客棧養傷，或繼續前往官道。探聽過的弱點會記在列傳裡。"),
  ];
}

export function bossIntro(heroId: string): DialogueLine[] {
  const h = heroById(heroId);
  return [
    line("黃巾渠帥", "新野那口井，我看上很久了。你們這些過路的，把命留在營裡吧。", "./art/portrait-boss.png"),
    line(h.name, "井是給活人喝的。你要搶，就在這裡決。", h.portrait),
  ];
}

export function endingFor(heroId: string): DialogueLine[] {
  const h = heroById(heroId);
  const close: Record<string, string> = {
    guanyu: "關羽把刀收入鞘。新野保住了，可天下還有七條路沒有對上。他知道，這只是列傳的第一筆。",
    zhaoyun: "趙雲在官道上勒馬。營寨的煙散了，可遠方還有旗。他會繼續往前。",
    zhangfei: "張飛把酒灑在土上。這回拿來祭那些沒能進得了城的人。",
    zhuge: "諸葛亮把羽扇重新打開。新野只是第一張圖。後面的風，他已經開始算。",
    caocao: "曹操把新野劃進袖裡那張圖。點保住了。下一手，他已經想好。",
    zhouyu: "周瑜聽營寨最後一聲鼓停了。音律總算齊。下一章，會換一個調。",
    sunshangxiang: "孫尚香把最後一枝箭收回袋。新野的城垛，以後可以再高一尺。",
    diaochan: "貂蟬在燈下把扇子合上。她勸開的人還活著。這已經夠寫進列傳。",
  };
  return [
    line(h.name, close[heroId] ?? "新野這一章，暫時寫完了。", h.portrait),
    line("系統", "第一章結束。存檔已更新。之後仍可在新野活動、再戰、再探聽。"),
  ];
}

export function childRescueLines(): DialogueLine[] {
  return [
    line("被俘的阿娘", "火堆旁邊那個孩子還在等我。謝謝你們。", "./art/portrait-diaochan.png"),
    line("系統", "孩童已平安。新野白天會再見到他。"),
  ];
}

export function thirdRecruitLines(heroId: string, guestId: string): DialogueLine[] {
  const a = heroById(heroId);
  const b = heroById(guestId);
  return [
    line(b.name, `${b.name}把行囊一甩：過路歸過路，這一程我跟你們。盾你們削，我來補刀。`, b.portrait),
    line(a.name, `${a.name}點頭。隊伍裡終於有了第三個人。`, a.portrait),
    line("系統", "篇章目標已更新。出手順序會輪到三人。"),
  ];
}

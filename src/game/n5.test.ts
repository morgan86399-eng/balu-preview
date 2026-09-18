import { createBattle, fighterFromHero } from "./combat.ts";
import { newSecondChronicleSave, CHRONICLES } from "./chronicles.ts";
import { equipBonuses, itemById } from "./items.ts";
import { FIELD_MINIBOSS_COORDS, isFieldMinibossTile, MAPS, tileAt } from "./maps.ts";
import { newSave } from "./save.ts";
import { objectiveFor } from "./view.ts";

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error("FAIL", msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
}

{
  const s = newSave("guanyu");
  assert(s.chronicleId === "ch1", "ch1 chronicle");
  assert(s.encounterFill === 0, "encounter starts empty");
  assert(s.equip && Object.keys(s.equip).length === 0, "equip empty");
  console.log("ok", "newSave N+5 fields");
}

{
  const s = newSecondChronicleSave();
  assert(s.chronicleId === "zhaoyun2", "second chronicle id");
  assert(s.mapId === "yunzhen", "starts in 常山驛");
  assert(s.heroId === "zhaoyun", "趙雲主角");
  assert(s.party.includes("sunshangxiang"), "同伴同行");
  assert(CHRONICLES.zhaoyun2.clearTitle.includes("初章既竟"), "clear title");
  assert(CHRONICLES.zhaoyun2.startY <= 4, "start near gate (y<=4)");
  assert(s.y === CHRONICLES.zhaoyun2.startY, "save uses startY");
  assert((s.items["iron-spear"] ?? 0) >= 1, "seed iron-spear for equip");
  assert((s.items["leather-armor"] ?? 0) >= 1, "seed leather-armor for equip");
  assert(objectiveFor(s).includes("平野") || objectiveFor(s).includes("驛"), "ch2 objective");
  console.log("ok", "second chronicle save");
}

{
  assert(MAPS.yunzhen?.name === "常山驛", "yunzhen map");
  assert(MAPS.field?.encounter?.steps === 5, "field encounter steps");
  assert(MAPS.road?.encounter?.softOnly === true, "road soft encounters");
  assert(!MAPS.xinyue.encounter, "town has no encounter");
  assert(!MAPS.yunzhen.encounter, "yunzhen town no encounter");
  const exits = MAPS.yunzhen.warps.filter((w) => w.to === "field");
  assert(exits.length >= 5, "widened north exits to field");
  assert(exits.every((w) => w.tx === 7 && w.ty === 10), "field landing (7,10)");
  const smith = MAPS.yunzhen.npcs.find((n) => n.id === "yz-vendor");
  assert(smith && smith.x === 9 && smith.y === 3, "blacksmith tile");
  console.log("ok", "maps encounter rules");
}

{
  const spear = itemById("iron-spear");
  const armor = itemById("leather-armor");
  assert(spear?.kind === "weapon" && (spear.atkBonus ?? 0) > 0, "spear equip");
  assert(armor?.kind === "armor" && (armor.defBonus ?? 0) > 0, "armor equip");
  const b = equipBonuses({ weapon: "iron-spear", armor: "leather-armor" });
  assert(b.atk === spear!.atkBonus && b.def === armor!.defBonus, "equip bonuses sum");
  const bare = fighterFromHero("zhaoyun", 0, 1, {});
  const geared = fighterFromHero("zhaoyun", 0, 1, { weapon: "iron-spear", armor: "leather-armor" });
  assert(geared.atk === bare.atk + b.atk, "fighter atk with equip");
  assert(geared.def === bare.def + b.def, "fighter def with equip");
  console.log("ok", "equipment bonuses");
}

{
  const b = createBattle(["zhaoyun", "sunshangxiang"], ["yellow", "lieutenant"], "miniboss", 1, {
    weapon: "iron-spear",
  });
  assert(b.kind === "miniboss", "miniboss kind");
  assert(b.fighters.some((f) => f.defId === "lieutenant"), "lieutenant present");
  const hero = b.fighters.find((f) => f.defId === "zhaoyun")!;
  assert(hero.atk > fighterFromHero("zhaoyun", 0, 1).atk, "battle uses equip");
  console.log("ok", "miniboss battle");
}


{
  // N+5 FAIL 03 — field miniboss must be impossible to miss
  const field = MAPS.field;
  assert(field, "field map");
  for (const c of FIELD_MINIBOSS_COORDS) {
    assert(tileAt(field, c.x, c.y) === "B", `B marker at (${c.x},${c.y})`);
    assert(isFieldMinibossTile(c.x, c.y), `zone helper (${c.x},${c.y})`);
  }
  assert(FIELD_MINIBOSS_COORDS.length >= 6, "six-tile miniboss zone");
  const lt = field.npcs.find((n) => n.id === "yz-lieutenant");
  assert(lt && lt.name === "黃巾小帥", "visible 黃巾小帥 NPC");
  assert(lt!.x === 7 && lt!.y === 1, "NPC on/near B");
  assert(lt!.hideFlag === "ch2Clear", "NPC hides after clear");
  assert(CHRONICLES.zhaoyun2.clearTitle === "趙雲列傳・初章既竟", "fullscreen clear title");
  console.log("ok", "field miniboss zone + clear title");
}

console.log("n5 tests passed");

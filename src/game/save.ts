import { heroById } from "./data.ts";
import { START, mapById } from "./maps.ts";
import { guanyuStatus, loadProgress, maxPartySize, progressSummary, zhangfeiStatus, zhaoyunStatus, zhugeStatus } from "./progress.ts";
import { emptyMastery } from "./pathMastery.ts";
import { clampToMap } from "./view.ts";
import { statScale } from "./items.ts";
import type { GameSave, HeroVitals } from "./types.ts";

const KEY = "ba-lu-liezhuan-save-v2";
const SLOT_PREFIX = "ba-lu-liezhuan-slot-v1-";
const ACTIVE_KEY = "ba-lu-liezhuan-active-slot";
export const SLOT_COUNT = 3;

export interface SlotInfo {
  index: number;
  empty: boolean;
  /** Display name e.g. 存檔一 / 關羽列傳 */
  name: string;
  /** Chronicle progress summary */
  summary: string;
  /** Formatted timestamp or 「空」 */
  timestamp: string;
  savedAt: number | null;
  save: GameSave | null;
}

export function vitalsFor(heroId: string, level: number): HeroVitals {
  const h = heroById(heroId);
  return { hp: statScale(h.maxHp, level), sp: statScale(h.maxSp, level) };
}

export function newSave(heroId: string): GameSave {
  return {
    version: 2,
    heroId,
    party: [heroId],
    mapId: START.mapId,
    x: START.x,
    y: START.y,
    facing: "up",
    flags: {},
    gold: 80,
    items: { herb: 2, salve: 0, oil: 1, "iron-spear": 0, "leather-armor": 0 },
    inquired: [],
    weaknessLog: {},
    journal: ["start"],
    clues: [],
    hour: 17,
    level: 1,
    exp: 0,
    vitals: { [heroId]: vitalsFor(heroId, 1) },
    steps: 0,
    chapter: 1,
    chronicleId: "ch1",
    equip: {},
    encounterFill: 0,
    pathMastery: emptyMastery(),
  };
}

function normalizeSave(parsed: Partial<GameSave> & { herbs?: number }): GameSave | null {
  if (!parsed.heroId) return null;
  const base = newSave(parsed.heroId);
  const merged: GameSave = {
    ...base,
    ...parsed,
    version: 2,
    party: parsed.party?.length ? parsed.party : [parsed.heroId],
    items: {
      herb: 0,
      salve: 0,
      oil: 0,
      "iron-spear": 0,
      "leather-armor": 0,
      ...(parsed.items ?? { herb: parsed.herbs ?? 1, salve: 0, oil: 0 }),
    },
    flags: parsed.flags ?? {},
    inquired: parsed.inquired ?? [],
    weaknessLog: parsed.weaknessLog ?? {},
    journal: parsed.journal ?? ["start"],
    clues: parsed.clues ?? [],
    vitals: parsed.vitals ?? { [parsed.heroId]: vitalsFor(parsed.heroId, parsed.level ?? 1) },
    mapId: parsed.mapId ?? "xinyue",
    facing: parsed.facing ?? "up",
    chronicleId: parsed.chronicleId ?? "ch1",
    equip: parsed.equip ?? {},
    encounterFill: parsed.encounterFill ?? 0,
    pathMastery: parsed.pathMastery ?? emptyMastery(),
  };
  const pos = clampToMap(mapById(merged.mapId), merged.x, merged.y);
  return { ...merged, x: pos.x, y: pos.y };
}

function slotKey(index: number): string {
  return `${SLOT_PREFIX}${index}`;
}

function formatTs(ms: number): string {
  try {
    const d = new Date(ms);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${mo}/${da} ${h}:${mi}`;
  } catch {
    return "—";
  }
}

function chronicleSlotName(save: GameSave): string {
  if (save.chronicleId === "zhaoyun2") return "趙雲列傳";
  if (save.chronicleId === "zhangfei3") return "張飛列傳";
  if (save.chronicleId === "zhuge4") return "諸葛亮列傳";
  if (save.chronicleId === "confluence") return "匯合篇";
  const h = heroById(save.heroId);
  return h?.name ? `${h.name}列傳` : "關羽列傳";
}

function saveProgressBits(save: GameSave): string {
  const bits: string[] = [];
  if (save.flags.bossDown) bits.push("關羽既竟");
  else if (save.chronicleId === "ch1") bits.push("關羽進行中");
  if (save.flags.ch2Clear) bits.push("趙雲既竟");
  else if (save.chronicleId === "zhaoyun2") bits.push("趙雲進行中");
  if (save.flags.ch3Clear) bits.push("張飛既竟");
  else if (save.chronicleId === "zhangfei3") bits.push("張飛進行中");
  if (save.flags.ch4Clear) bits.push("諸葛既竟");
  else if (save.chronicleId === "zhuge4") bits.push("諸葛進行中");
  if (save.flags.confluenceClear) bits.push("匯合既竟");
  else if (save.chronicleId === "confluence") bits.push("匯合進行中");
  if (!bits.length) bits.push(chronicleSlotName(save));
  return bits.join(" · ");
}

interface SlotPayload {
  savedAt: number;
  save: GameSave;
}

function readSlotRaw(index: number): SlotPayload | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(slotKey(index));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; save?: Partial<GameSave> } & Partial<GameSave>;
    // Support both wrapped {savedAt,save} and bare GameSave (legacy migrate).
    if (parsed.save) {
      const save = normalizeSave(parsed.save);
      if (!save) return null;
      return { savedAt: parsed.savedAt ?? Date.now(), save };
    }
    const save = normalizeSave(parsed as Partial<GameSave>);
    if (!save) return null;
    return { savedAt: Date.now(), save };
  } catch {
    return null;
  }
}

/** Migrate legacy single-key save into slot 0 once (only if no slots exist). */
export function migrateLegacySave(): void {
  if (typeof localStorage === "undefined") return;
  for (let i = 0; i < SLOT_COUNT; i++) {
    if (localStorage.getItem(slotKey(i))) return;
  }
  const raw = localStorage.getItem(KEY) ?? localStorage.getItem("ba-lu-liezhuan-save-v1");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Partial<GameSave>;
    const save = normalizeSave(parsed);
    if (!save) return;
    const payload = { savedAt: Date.now(), save };
    localStorage.setItem(slotKey(0), JSON.stringify(payload));
    localStorage.setItem(ACTIVE_KEY, "0");
  } catch {
    /* ignore */
  }
}

export function getActiveSlot(): number {
  if (typeof localStorage === "undefined") return 0;
  migrateLegacySave();
  const raw = localStorage.getItem(ACTIVE_KEY);
  const n = raw != null ? Number(raw) : 0;
  if (!Number.isFinite(n) || n < 0 || n >= SLOT_COUNT) return 0;
  return n;
}

export function setActiveSlot(index: number): void {
  if (typeof localStorage === "undefined") return;
  const i = Math.max(0, Math.min(SLOT_COUNT - 1, index));
  localStorage.setItem(ACTIVE_KEY, String(i));
}

export function listSlots(): SlotInfo[] {
  migrateLegacySave();
  const meta = loadProgress();
  const out: SlotInfo[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const payload = readSlotRaw(i);
    if (!payload) {
      out.push({
        index: i,
        empty: true,
        name: `存檔${["一", "二", "三"][i]}`,
        summary: "空",
        timestamp: "空",
        savedAt: null,
        save: null,
      });
      continue;
    }
    out.push({
      index: i,
      empty: false,
      name: `存檔${["一", "二", "三"][i]}・${chronicleSlotName(payload.save)}`,
      summary: saveProgressBits(payload.save),
      timestamp: formatTs(payload.savedAt),
      savedAt: payload.savedAt,
      save: payload.save,
    });
  }
  // Touch meta so callers that want global summary still see it.
  void progressSummary(meta);
  void guanyuStatus(meta);
  void zhaoyunStatus(meta);
  void zhangfeiStatus(meta);
  void zhugeStatus(meta);
  return out;
}

export function loadSlot(index: number): GameSave | null {
  migrateLegacySave();
  const payload = readSlotRaw(index);
  return payload?.save ?? null;
}

export function writeSlot(index: number, save: GameSave): void {
  if (typeof localStorage === "undefined") return;
  const i = Math.max(0, Math.min(SLOT_COUNT - 1, index));
  const payload: SlotPayload = { savedAt: Date.now(), save };
  localStorage.setItem(slotKey(i), JSON.stringify(payload));
  // Keep legacy key in sync for older helpers / Continue.
  localStorage.setItem(KEY, JSON.stringify(save));
  setActiveSlot(i);
}

export function clearSlot(index: number): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(slotKey(index));
}

export function slotIsOccupied(index: number): boolean {
  return Boolean(readSlotRaw(index));
}

export function loadSave(): GameSave | null {
  migrateLegacySave();
  const active = getActiveSlot();
  const fromSlot = loadSlot(active);
  if (fromSlot) return fromSlot;
  // Fallback: any occupied slot, or legacy key.
  for (let i = 0; i < SLOT_COUNT; i++) {
    const s = loadSlot(i);
    if (s) return s;
  }
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("ba-lu-liezhuan-save-v1");
    if (!raw) return null;
    return normalizeSave(JSON.parse(raw) as Partial<GameSave>);
  } catch {
    return null;
  }
}

export function writeSave(save: GameSave): void {
  const slot = getActiveSlot();
  writeSlot(slot, save);
}

export function clearSave(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem("ba-lu-liezhuan-save-v1");
  for (let i = 0; i < SLOT_COUNT; i++) clearSlot(i);
  localStorage.removeItem(ACTIVE_KEY);
}

export function restParty(save: GameSave): GameSave {
  const next = structuredClone(save);
  next.hour = (next.hour + 10) % 24;
  // Overnight is free for QA / early game (was −15 錢).
  for (const id of next.party) next.vitals[id] = vitalsFor(id, next.level);
  return next;
}

export function addJournal(save: GameSave, id: string): GameSave {
  if (save.journal.includes(id)) return save;
  return { ...save, journal: [...save.journal, id] };
}

/** Add a temporary chapter companion if not already in the party. */
export function recruitCompanion(save: GameSave, companionId: string): GameSave {
  if (save.party.includes(companionId)) return save;
  const next = structuredClone(save);
  next.party = [...next.party, companionId];
  next.vitals[companionId] = vitalsFor(companionId, next.level);
  next.flags.companionJoined = true;
  return addJournal(next, "companion");
}

/** Add the third temporary companion (wayfarer encounter). */
export function recruitThird(save: GameSave, companionId: string): GameSave {
  if (save.party.includes(companionId)) {
    const next = structuredClone(save);
    next.flags.thirdJoined = true;
    return addJournal(next, "third");
  }
  const cap = maxPartySize();
  if (save.party.length >= cap) {
    const next = structuredClone(save);
    next.flags.thirdJoined = true;
    return addJournal(next, "third");
  }
  const next = structuredClone(save);
  next.party = [...next.party, companionId];
  next.vitals[companionId] = vitalsFor(companionId, next.level);
  next.flags.thirdJoined = true;
  return addJournal(next, "third");
}

/** Set party from unlocked travelers (max 3 or 4). Keeps heroId as lead. */
export function setPartyMembers(save: GameSave, memberIds: string[]): GameSave {
  const cap = maxPartySize();
  const lead = save.heroId;
  const rest = memberIds.filter((id) => id !== lead).slice(0, cap - 1);
  const party = [lead, ...rest].slice(0, cap);
  const next = structuredClone(save);
  next.party = party;
  for (const id of party) {
    if (!next.vitals[id]) next.vitals[id] = vitalsFor(id, next.level);
  }
  if (party.length >= 2) next.flags.companionJoined = true;
  if (party.length >= 3) next.flags.thirdJoined = true;
  if (party.length >= 4) next.flags.fourthJoined = true;
  return next;
}

export function addClue(save: GameSave, clue: string): GameSave {
  if (!clue || save.clues.includes(clue)) return save;
  return { ...save, clues: [...save.clues, clue] };
}

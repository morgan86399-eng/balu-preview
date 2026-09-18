/** Meta chronicle progress — survives switching saves / returning to title. */

export type LineStatus = "未開" | "進行中" | "初章既竟";

export interface MetaProgress {
  version: 1;
  ch1Started: boolean;
  ch1Clear: boolean;
  ch2Started: boolean;
  ch2Clear: boolean;
  ch3Started: boolean;
  ch3Clear: boolean;
  ch4Started: boolean;
  ch4Clear: boolean;
  ch5Started: boolean;
  ch5Clear: boolean;
  ch6Started: boolean;
  ch6Clear: boolean;
  confluenceClear: boolean;
  /** Optional meta mirror for bounty board (also stored on save.flags). */
  bountyAccepted?: boolean;
  bountyDone?: boolean;
}

const KEY = "ba-lu-liezhuan-progress-v1";

export function emptyProgress(): MetaProgress {
  return {
    version: 1,
    ch1Started: false,
    ch1Clear: false,
    ch2Started: false,
    ch2Clear: false,
    ch3Started: false,
    ch3Clear: false,
    ch4Started: false,
    ch4Clear: false,
    ch5Started: false,
    ch5Clear: false,
    ch6Started: false,
    ch6Clear: false,
    confluenceClear: false,
    bountyAccepted: false,
    bountyDone: false,
  };
}

export function loadProgress(): MetaProgress {
  try {
    if (typeof localStorage === "undefined") return emptyProgress();
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<MetaProgress>;
    return { ...emptyProgress(), ...parsed, version: 1 };
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(p: MetaProgress): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function patchProgress(partial: Partial<MetaProgress>): MetaProgress {
  const next = { ...loadProgress(), ...partial, version: 1 as const };
  writeProgress(next);
  return next;
}

export function lineStatus(started: boolean, clear: boolean): LineStatus {
  if (clear) return "初章既竟";
  if (started) return "進行中";
  return "未開";
}

export function guanyuStatus(p: MetaProgress = loadProgress()): LineStatus {
  return lineStatus(p.ch1Started, p.ch1Clear);
}

export function zhaoyunStatus(p: MetaProgress = loadProgress()): LineStatus {
  return lineStatus(p.ch2Started, p.ch2Clear);
}

export function zhangfeiStatus(p: MetaProgress = loadProgress()): LineStatus {
  return lineStatus(p.ch3Started, p.ch3Clear);
}

export function zhugeStatus(p: MetaProgress = loadProgress()): LineStatus {
  return lineStatus(p.ch4Started, p.ch4Clear);
}

export function liubeiStatus(p: MetaProgress = loadProgress()): LineStatus {
  return lineStatus(p.ch5Started, p.ch5Clear);
}

export function caocaoStatus(p: MetaProgress = loadProgress()): LineStatus {
  return lineStatus(p.ch6Started, p.ch6Clear);
}

/** 關羽＋趙雲＋張飛＋諸葛 皆初章既竟 → 四路總覽. */
export function fourRoadsUnlocked(p: MetaProgress = loadProgress()): boolean {
  return Boolean(p.ch1Clear && p.ch2Clear && p.ch3Clear && p.ch4Clear);
}

export function fourRoadsLockHint(p: MetaProgress = loadProgress()): string {
  if (fourRoadsUnlocked(p)) return "";
  const missing: string[] = [];
  if (!p.ch1Clear) missing.push("關羽列傳");
  if (!p.ch2Clear) missing.push("趙雲列傳");
  if (!p.ch3Clear) missing.push("張飛列傳");
  if (!p.ch4Clear) missing.push("諸葛亮列傳");
  return `未解鎖・缺：${missing.join("、")}`;
}

/** 關＋趙＋張＋諸葛＋劉 皆初章既竟 → 五路總覽（不含曹操）. */
export function fiveRoadsUnlocked(p: MetaProgress = loadProgress()): boolean {
  return Boolean(p.ch1Clear && p.ch2Clear && p.ch3Clear && p.ch4Clear && p.ch5Clear);
}

export function fiveRoadsLockHint(p: MetaProgress = loadProgress()): string {
  if (fiveRoadsUnlocked(p)) return "";
  const missing: string[] = [];
  if (!p.ch1Clear) missing.push("關羽列傳");
  if (!p.ch2Clear) missing.push("趙雲列傳");
  if (!p.ch3Clear) missing.push("張飛列傳");
  if (!p.ch4Clear) missing.push("諸葛亮列傳");
  if (!p.ch5Clear) missing.push("劉備列傳");
  return `未解鎖・缺：${missing.join("、")}`;
}

export function confluenceUnlocked(p: MetaProgress = loadProgress()): boolean {
  return p.ch1Clear && p.ch2Clear;
}

/** World map (天下圖) after 關羽初章既竟 or confluence clear. */
export function worldMapUnlocked(p: MetaProgress = loadProgress()): boolean {
  return p.ch1Clear || p.confluenceClear;
}

export type WorldNodeId = "xinyue" | "changshan" | "merge" | "wolong";

/** Progressive unlock: 新野←關羽既竟, 常山驛←趙雲既竟, 合流←匯合既竟, 臥龍岡←諸葛既竟. */
export function worldNodeUnlocked(
  node: WorldNodeId,
  p: MetaProgress = loadProgress(),
): boolean {
  if (node === "xinyue") return p.ch1Clear;
  if (node === "changshan") return p.ch2Clear;
  if (node === "merge") return p.confluenceClear;
  if (node === "wolong") return p.ch4Clear;
  return false;
}

/** Short hint when a world node is still locked. */
export function worldNodeLockHint(
  node: WorldNodeId,
  p: MetaProgress = loadProgress(),
): string {
  if (worldNodeUnlocked(node, p)) return "";
  if (node === "xinyue") return "關羽初章既竟後解鎖";
  if (node === "changshan") return "趙雲初章既竟後解鎖";
  if (node === "merge") return "匯合篇既竟後解鎖";
  if (node === "wolong") return "諸葛亮初章既竟後解鎖";
  return "未解鎖";
}

/** Synthetic progress for QA grey-map capture: map open, only 新野 unlocked. */
export function qaGreyMapProgress(): MetaProgress {
  return {
    ...emptyProgress(),
    ch1Started: true,
    ch1Clear: true,
  };
}

/** Hint for locked confluence entry. */
export function confluenceLockHint(p: MetaProgress = loadProgress()): string {
  if (p.ch1Clear && p.ch2Clear) return "";
  const missing: string[] = [];
  if (!p.ch1Clear) missing.push("關羽列傳");
  if (!p.ch2Clear) missing.push("趙雲列傳");
  return `未解鎖・缺：${missing.join("、")}`;
}

/** Cleared traveler lines (關／趙／張／諸葛). */
export function clearedTravelerCount(p: MetaProgress = loadProgress()): number {
  let n = 0;
  if (p.ch1Clear) n++;
  if (p.ch2Clear) n++;
  if (p.ch3Clear) n++;
  if (p.ch4Clear) n++;
  return n;
}

/** When ≥3 cleared (incl. current play), party may hold 4. */
export function maxPartySize(p: MetaProgress = loadProgress()): number {
  return clearedTravelerCount(p) >= 3 ? 4 : 3;
}

export function partyOfFourUnlocked(p: MetaProgress = loadProgress()): boolean {
  return clearedTravelerCount(p) >= 3;
}

/** Heroes unlocked for party select (cleared lines + always-available starters). */
export function unlockedTravelerIds(p: MetaProgress = loadProgress()): string[] {
  const ids = new Set<string>();
  // Always allow picking the eight roster, but grey locked ones in UI —
  // unlocked = has at least started/cleared their line OR is a partner of cleared.
  if (p.ch1Clear || p.ch1Started) ids.add("guanyu");
  if (p.ch2Clear || p.ch2Started) ids.add("zhaoyun");
  if (p.ch3Clear || p.ch3Started) ids.add("zhangfei");
  if (p.ch4Clear || p.ch4Started) ids.add("zhuge");
  if (p.ch5Clear || p.ch5Started) ids.add("liubei");
  if (p.ch6Clear || p.ch6Started) ids.add("caocao");
  // Partners unlocked with their line clear
  if (p.ch1Clear) {
    ids.add("guanyu");
    ids.add("zhangfei");
  }
  if (p.ch2Clear) {
    ids.add("zhaoyun");
    ids.add("sunshangxiang");
  }
  if (p.ch3Clear) {
    ids.add("zhangfei");
    ids.add("guanyu");
  }
  if (p.ch4Clear) {
    ids.add("zhuge");
    ids.add("zhouyu");
  }
  if (p.ch6Clear) {
    ids.add("caocao");
    ids.add("zhuge");
  }
  if (p.confluenceClear) {
    ids.add("guanyu");
    ids.add("zhaoyun");
  }
  return [...ids];
}

/** One-line progress summary for a save slot card. */
export function progressSummary(p: MetaProgress = loadProgress()): string {
  const bits = [
    `關羽 ${guanyuStatus(p)}`,
    `趙雲 ${zhaoyunStatus(p)}`,
    `張飛 ${zhangfeiStatus(p)}`,
    `諸葛 ${zhugeStatus(p)}`,
    `劉備 ${liubeiStatus(p)}`,
    `曹操 ${caocaoStatus(p)}`,
  ];
  if (p.confluenceClear) bits.push("匯合既竟");
  return bits.join(" · ");
}

/** Sync meta flags from an active save (bossDown / ch2Clear / ch3Clear / ch4Clear). */
export function syncProgressFromSave(flags: Record<string, boolean>, chronicleId?: string): MetaProgress {
  const patch: Partial<MetaProgress> = {};
  if (flags.bossDown) {
    patch.ch1Clear = true;
    patch.ch1Started = true;
  }
  if (flags.ch2Clear) {
    patch.ch2Clear = true;
    patch.ch2Started = true;
  }
  if (flags.ch3Clear) {
    patch.ch3Clear = true;
    patch.ch3Started = true;
  }
  if (flags.ch4Clear) {
    patch.ch4Clear = true;
    patch.ch4Started = true;
  }
  if (flags.ch5Clear) {
    patch.ch5Clear = true;
    patch.ch5Started = true;
  }
  if (flags.ch6Clear) {
    patch.ch6Clear = true;
    patch.ch6Started = true;
  }
  if (flags.confluenceClear) {
    patch.confluenceClear = true;
  }
  if (flags.bountyAccepted) patch.bountyAccepted = true;
  if (flags.bountyDone) patch.bountyDone = true;
  if (chronicleId === "ch1") patch.ch1Started = true;
  if (chronicleId === "zhaoyun2") patch.ch2Started = true;
  if (chronicleId === "zhangfei3") patch.ch3Started = true;
  if (chronicleId === "zhuge4") patch.ch4Started = true;
  if (chronicleId === "liubei5") patch.ch5Started = true;
  if (chronicleId === "caocao6") patch.ch6Started = true;
  return Object.keys(patch).length ? patchProgress(patch) : loadProgress();
}

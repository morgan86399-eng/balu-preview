import type { PathAction } from "./types.ts";
import { PATH_LABEL } from "./data.ts";

export type PathMasteryMap = Partial<Record<PathAction, number>>;

/** Success thresholds for ★ 1 / 2 / 3. */
export const MASTERY_THRESHOLDS = [2, 5, 9] as const;

const META_KEY = "ba-lu-liezhuan-path-mastery-v1";

export function emptyMastery(): PathMasteryMap {
  return {};
}

export function loadMetaMastery(): PathMasteryMap {
  try {
    if (typeof localStorage === "undefined") return emptyMastery();
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return emptyMastery();
    return { ...emptyMastery(), ...(JSON.parse(raw) as PathMasteryMap) };
  } catch {
    return emptyMastery();
  }
}

export function writeMetaMastery(m: PathMasteryMap): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(META_KEY, JSON.stringify(m));
}

export function mergeMastery(a: PathMasteryMap, b: PathMasteryMap): PathMasteryMap {
  const out: PathMasteryMap = { ...a };
  for (const [k, v] of Object.entries(b) as [PathAction, number][]) {
    out[k] = Math.max(out[k] ?? 0, v ?? 0);
  }
  return out;
}

export function masteryCount(m: PathMasteryMap, action: PathAction): number {
  return m[action] ?? 0;
}

/** 0–3 stars from cumulative successes. */
export function masteryStars(m: PathMasteryMap, action: PathAction): 0 | 1 | 2 | 3 {
  const n = masteryCount(m, action);
  if (n >= MASTERY_THRESHOLDS[2]) return 3;
  if (n >= MASTERY_THRESHOLDS[1]) return 2;
  if (n >= MASTERY_THRESHOLDS[0]) return 1;
  return 0;
}

export function masteryStarsText(stars: number): string {
  if (stars <= 0) return "";
  return "★".repeat(Math.min(3, stars));
}

/** Short hint when mastery ≥1. */
export function masteryHint(m: PathMasteryMap, action: PathAction): string | null {
  const s = masteryStars(m, action);
  if (s <= 0) return null;
  return `熟練 ${masteryStarsText(s)} · 較易成功`;
}

export function recordPathSuccess(
  m: PathMasteryMap,
  action: PathAction,
): PathMasteryMap {
  const next = { ...m, [action]: (m[action] ?? 0) + 1 };
  // Keep meta in sync so stars survive new chronicles.
  const meta = mergeMastery(loadMetaMastery(), next);
  writeMetaMastery(meta);
  return next;
}

/** Prefer save mastery, fall back to meta (max of both). */
export function effectiveMastery(saveMastery?: PathMasteryMap | null): PathMasteryMap {
  return mergeMastery(loadMetaMastery(), saveMastery ?? {});
}

export function masteryLabel(action: PathAction): string {
  return PATH_LABEL[action] ?? action;
}

/** QA helper: bump one action to 3★. */
export function qaMaxMastery(action: PathAction = "inquire"): PathMasteryMap {
  const m = { ...loadMetaMastery(), [action]: MASTERY_THRESHOLDS[2] };
  writeMetaMastery(m);
  return m;
}

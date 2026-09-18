/** Audio mute flags — localStorage only (no asset required). */

export interface GameSettings {
  music: boolean;
  sfx: boolean;
}

const KEY = "ba-lu-liezhuan-settings-v1";

export function defaultSettings(): GameSettings {
  return { music: true, sfx: true };
}

export function loadSettings(): GameSettings {
  try {
    if (typeof localStorage === "undefined") return defaultSettings();
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      music: parsed.music !== false,
      sfx: parsed.sfx !== false,
    };
  } catch {
    return defaultSettings();
  }
}

export function writeSettings(s: GameSettings): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function patchSettings(partial: Partial<GameSettings>): GameSettings {
  const next = { ...loadSettings(), ...partial };
  writeSettings(next);
  return next;
}

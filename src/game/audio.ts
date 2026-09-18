import { loadSettings } from "./settings.ts";

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = ac();
  if (c?.state === "suspended") void c.resume();
  // Browser autoplay policy: resume HTMLAudioElement after a user gesture.
  if (bgmEl && musicEnabled() && bgmEl.paused && desiredTrack) {
    void bgmEl.play().catch(() => {});
  }
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.05): void {
  if (!loadSettings().sfx) return;
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(c.destination);
  const t = c.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur);
}

/** Music mute flag from settings. */
export function musicEnabled(): boolean {
  return loadSettings().music;
}

export type BgmTrack = "explore" | "battle";

const BGM_SRC: Record<BgmTrack, string> = {
  explore: "./audio/bgm-explore.mp3",
  battle: "./audio/bgm-battle.mp3",
};

let bgmEl: HTMLAudioElement | null = null;
let desiredTrack: BgmTrack | null = null;
let activeTrack: BgmTrack | null = null;

function ensureBgmEl(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  if (!bgmEl) {
    bgmEl = new Audio();
    bgmEl.loop = true;
    bgmEl.preload = "auto";
    bgmEl.volume = 0.45;
  }
  return bgmEl;
}

function stopBgmInternal(): void {
  if (!bgmEl) return;
  bgmEl.pause();
  bgmEl.removeAttribute("src");
  bgmEl.load();
  activeTrack = null;
}

/**
 * Request a BGM track. Title / town / world map → explore; battle → battle.
 * Pass null to stop. Respects settings.music (muted → silence).
 */
export function setBgm(track: BgmTrack | null): void {
  desiredTrack = track;
  refreshBgm();
}

/** Re-apply desired track vs current music mute flag (call after settings apply). */
export function refreshBgm(): void {
  if (typeof window === "undefined") return;
  if (!musicEnabled() || !desiredTrack) {
    stopBgmInternal();
    return;
  }
  const el = ensureBgmEl();
  if (!el) return;
  if (activeTrack === desiredTrack && el.src) {
    if (el.paused) void el.play().catch(() => {});
    return;
  }
  el.loop = true;
  el.src = BGM_SRC[desiredTrack];
  activeTrack = desiredTrack;
  void el.play().catch(() => {
    // Autoplay blocked until unlockAudio / user gesture — retry there.
  });
}

export function stopBgm(): void {
  desiredTrack = null;
  stopBgmInternal();
}

/** Map UI screen → explore vs battle BGM. */
export function bgmForScreen(screen: string): BgmTrack {
  return screen === "battle" ? "battle" : "explore";
}

export const sfx = {
  click: () => beep(520, 0.06, "square", 0.03),
  step: () => beep(180, 0.04, "triangle", 0.02),
  hit: () => beep(140, 0.09, "sawtooth", 0.05),
  weak: () => {
    beep(880, 0.08, "square", 0.04);
    beep(1320, 0.12, "square", 0.03);
  },
  brk: () => {
    beep(200, 0.18, "sawtooth", 0.06);
    beep(80, 0.28, "triangle", 0.05);
  },
  heal: () => beep(660, 0.16, "sine", 0.04),
  win: () => {
    beep(523, 0.12, "square", 0.04);
    setTimeout(() => beep(659, 0.12, "square", 0.04), 90);
    setTimeout(() => beep(784, 0.2, "square", 0.04), 180);
  },
  lose: () => beep(110, 0.4, "triangle", 0.05),
  talk: () => beep(420, 0.05, "sine", 0.02),
};

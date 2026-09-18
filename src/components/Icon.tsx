import type { Weapon } from "../game/types.ts";

const ROT: Record<"up" | "down" | "left" | "right", number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

export function Chevron({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" style={{ transform: `rotate(${ROT[dir]}deg)` }}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 15l6-6 6 6"
      />
    </svg>
  );
}

/** Shield pip for battle — filled = remaining, empty = already chipped. */
export function ShieldIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`shield-ico${filled ? " on" : ""}`}
      aria-hidden="true"
      width="22"
      height="24"
      viewBox="0 0 24 26"
    >
      <path
        d="M12 1.5 L21 5.2 V12.2 C21 18.2 16.8 22.8 12 24.5 C7.2 22.8 3 18.2 3 12.2 V5.2 Z"
        fill={filled ? "#5aa8d4" : "rgba(12,18,28,0.55)"}
        stroke={filled ? "#b8e4ff" : "rgba(126,200,255,0.45)"}
        strokeWidth="1.6"
      />
      {filled && (
        <path
          d="M12 5.5 L17 7.5 V12 C17 15.8 14.5 18.8 12 20 C9.5 18.8 7 15.8 7 12 V7.5 Z"
          fill="#9ad4ff"
          opacity="0.55"
        />
      )}
    </svg>
  );
}

const WEAPON_PATH: Record<Weapon, string> = {
  sword: "M5 19 L15 9 M13 7 L17 11 M16 6 L18 8 M7 17 L5 19",
  spear: "M12 3 V20 M9 6 L12 3 L15 6 M10 20 H14",
  bow: "M7 5 C14 8, 14 16, 7 19 M7 5 V19 M8 12 H18",
  fan: "M12 18 L4 8 C8 6, 16 6, 20 8 L12 18 M12 18 V12",
  fire: "M12 3 C10 8 16 9 14 14 C13 17 10 18 10 18 C8 14 14 12 12 3 Z M10 18 C9 20 11 22 13 20",
  staff: "M12 3 V21 M9 7 H15 M10 12 H14",
  dark: "M12 3 C7 7 7 15 12 21 C17 15 17 7 12 3 Z M12 8 V16",
};

/** Weapon weakness icon — SVG only, no emoji. */
export function WeaponIcon({ weapon, size = 18 }: { weapon: Weapon; size?: number }) {
  return (
    <svg
      className="weapon-ico"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={WEAPON_PATH[weapon]}
      />
    </svg>
  );
}

export function MysteryIcon({ size = 18 }: { size?: number }) {
  return (
    <svg className="weapon-ico mystery" aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 3" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">
        ?
      </text>
    </svg>
  );
}

import type { Rect } from "./math";

export type PickupKind = "health" | "armor" | "rocket";
export type PickupSpawn = { kind: PickupKind; x: number; y: number };

export type LevelData = {
  id: string;
  name: string;
  plan: string;
  redSpawn: { x: number; y: number };
  blueSpawn: { x: number; y: number };
  redBase: Rect;
  blueBase: Rect;
  redFlag: { x: number; y: number };
  blueFlag: { x: number; y: number };
  walls: Rect[];
  gaps: Rect[];
  pickups: PickupSpawn[];
  botRoutes: {
    attacker: { x: number; y: number }[];
    defender: { x: number; y: number }[];
  };
};

const trainingCrossing: LevelData = {
  id: "training-crossing",
  name: "Training Crossing",
  plan: "Balanced starter arena with a risky central jump route and safer top/bottom lanes.",
  redSpawn: { x: 150, y: 410 },
  blueSpawn: { x: 1350, y: 410 },
  redBase: { x: 70, y: 280, w: 190, h: 260 },
  blueBase: { x: 1240, y: 280, w: 190, h: 260 },
  redFlag: { x: 150, y: 410 },
  blueFlag: { x: 1350, y: 410 },
  walls: [
    { x: 332, y: 120, w: 42, h: 185 }, { x: 332, y: 515, w: 42, h: 185 },
    { x: 470, y: 333, w: 44, h: 154 }, { x: 1126, y: 120, w: 42, h: 185 },
    { x: 1126, y: 515, w: 42, h: 185 }, { x: 986, y: 333, w: 44, h: 154 },
    { x: 620, y: 96, w: 260, h: 36 }, { x: 620, y: 688, w: 260, h: 36 },
    { x: 726, y: 312, w: 48, h: 196 }, { x: 585, y: 392, w: 100, h: 36 },
    { x: 815, y: 392, w: 100, h: 36 },
  ] satisfies Rect[],
  gaps: [
    { x: 555, y: 218, w: 140, h: 64 }, { x: 805, y: 218, w: 140, h: 64 },
    { x: 555, y: 538, w: 140, h: 64 }, { x: 805, y: 538, w: 140, h: 64 },
    { x: 666, y: 350, w: 168, h: 120 },
  ] satisfies Rect[],
  pickups: [
    { kind: "health", x: 120, y: 320 }, { kind: "armor", x: 220, y: 320 }, { kind: "rocket", x: 150, y: 500 },
    { kind: "health", x: 1290, y: 320 }, { kind: "armor", x: 1390, y: 320 }, { kind: "rocket", x: 1350, y: 500 },
  ],
  botRoutes: {
    attacker: [{ x: 1160, y: 84 }, { x: 760, y: 72 }, { x: 360, y: 84 }, { x: 150, y: 410 }],
    defender: [{ x: 1180, y: 280 }, { x: 1340, y: 280 }, { x: 1340, y: 540 }, { x: 1180, y: 540 }],
  },
};

const midlineRush: LevelData = {
  id: "midline-rush",
  name: "Midline Rush",
  plan: "Faster map with a broad middle lane, two chained jump gaps, and open return routes for speed retention.",
  redSpawn: { x: 145, y: 410 },
  blueSpawn: { x: 1355, y: 410 },
  redBase: { x: 70, y: 300, w: 180, h: 220 },
  blueBase: { x: 1250, y: 300, w: 180, h: 220 },
  redFlag: { x: 150, y: 410 },
  blueFlag: { x: 1350, y: 410 },
  walls: [
    { x: 360, y: 110, w: 42, h: 210 }, { x: 360, y: 500, w: 42, h: 210 },
    { x: 1098, y: 110, w: 42, h: 210 }, { x: 1098, y: 500, w: 42, h: 210 },
    { x: 535, y: 185, w: 160, h: 34 }, { x: 805, y: 185, w: 160, h: 34 },
    { x: 535, y: 601, w: 160, h: 34 }, { x: 805, y: 601, w: 160, h: 34 },
    { x: 715, y: 300, w: 70, h: 70 }, { x: 715, y: 450, w: 70, h: 70 },
  ],
  gaps: [
    { x: 575, y: 350, w: 140, h: 120 },
    { x: 785, y: 350, w: 140, h: 120 },
    { x: 655, y: 250, w: 190, h: 54 },
    { x: 655, y: 516, w: 190, h: 54 },
  ],
  pickups: [
    { kind: "health", x: 118, y: 335 }, { kind: "armor", x: 212, y: 335 }, { kind: "rocket", x: 150, y: 485 },
    { kind: "health", x: 1288, y: 335 }, { kind: "armor", x: 1382, y: 335 }, { kind: "rocket", x: 1350, y: 485 },
  ],
  botRoutes: {
    attacker: [{ x: 1130, y: 735 }, { x: 760, y: 735 }, { x: 360, y: 735 }, { x: 150, y: 410 }],
    defender: [{ x: 1190, y: 310 }, { x: 1380, y: 310 }, { x: 1380, y: 520 }, { x: 1190, y: 520 }],
  },
};

const flankSwitch: LevelData = {
  id: "flank-switch",
  name: "Flank Switch",
  plan: "More technical map with curved wall gates, tight passages, and diagonal-feeling gap decisions.",
  redSpawn: { x: 150, y: 410 },
  blueSpawn: { x: 1350, y: 410 },
  redBase: { x: 75, y: 275, w: 190, h: 270 },
  blueBase: { x: 1235, y: 275, w: 190, h: 270 },
  redFlag: { x: 150, y: 410 },
  blueFlag: { x: 1350, y: 410 },
  walls: [
    { x: 330, y: 150, w: 210, h: 36 }, { x: 330, y: 634, w: 210, h: 36 },
    { x: 960, y: 150, w: 210, h: 36 }, { x: 960, y: 634, w: 210, h: 36 },
    { x: 475, y: 250, w: 42, h: 150 }, { x: 475, y: 420, w: 42, h: 150 },
    { x: 983, y: 250, w: 42, h: 150 }, { x: 983, y: 420, w: 42, h: 150 },
    { x: 672, y: 145, w: 46, h: 210 }, { x: 782, y: 465, w: 46, h: 210 },
    { x: 660, y: 392, w: 180, h: 36 },
  ],
  gaps: [
    { x: 585, y: 235, w: 128, h: 70 }, { x: 787, y: 515, w: 128, h: 70 },
    { x: 585, y: 515, w: 128, h: 70 }, { x: 787, y: 235, w: 128, h: 70 },
    { x: 706, y: 338, w: 88, h: 144 },
  ],
  pickups: [
    { kind: "health", x: 125, y: 315 }, { kind: "armor", x: 220, y: 315 }, { kind: "rocket", x: 150, y: 505 },
    { kind: "health", x: 1280, y: 315 }, { kind: "armor", x: 1375, y: 315 }, { kind: "rocket", x: 1350, y: 505 },
  ],
  botRoutes: {
    attacker: [{ x: 1180, y: 720 }, { x: 930, y: 720 }, { x: 750, y: 720 }, { x: 520, y: 720 }, { x: 150, y: 410 }],
    defender: [{ x: 1200, y: 250 }, { x: 1380, y: 330 }, { x: 1380, y: 500 }, { x: 1200, y: 590 }],
  },
};

export const LEVELS = [trainingCrossing, midlineRush, flankSwitch] as const;
export type LevelId = typeof LEVELS[number]["id"];
export const LEVEL_BY_ID = Object.fromEntries(LEVELS.map((level) => [level.id, level])) as Record<LevelId, LevelData>;
export const LEVEL = trainingCrossing;

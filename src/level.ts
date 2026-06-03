import type { Rect } from "./math";

export const LEVEL = {
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
};

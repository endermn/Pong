import { lerp, zip } from "./util.js";

export const R = 0;
export const G = 1;
export const B = 2;

export function rgb(str) {
  return [
    parseInt(str.slice(0, 2), 16),
    parseInt(str.slice(2, 4), 16),
    parseInt(str.slice(4, 6), 16),
  ];
}

export function lerpColor(a, b, alpha) {
  return zip(a, b).map(([a, b]) => lerp(a, b, alpha));
}

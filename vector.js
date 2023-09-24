import { zip } from "./util.js";

export const X = 0;
export const Y = 1;

export const WIDTH = X;
export const HEIGHT = Y;

export function vrep(x, n) {
  return Array(n).fill(x)
}

export function vadd(a, b) {
  return zip(a, b).map(x => x[0] + x[1]);
}

export function vmul(a, b) {
  return zip(a, b).map(x => x[0] * x[1]);
}

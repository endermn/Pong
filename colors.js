const R = 0;
const G = 1;
const B = 2;

const X = 0;
const Y = 1;

export function rgb(str) {
  return [
    parseInt(str.slice(0, 2), 16),
    parseInt(str.slice(2, 4), 16),
    parseInt(str.slice(4, 6), 16),
  ];
}
export function lerp(a, b, alpha) {
  return a + alpha * (b - a);
}

export function zip(a, b) {
  return a.map((e, i) => [e, b[i]]);
}
export function lerpColor(a, b, alpha) {
  return zip(a, b).map((x) => lerp(x[0], x[1], alpha));
}
export function setColor(color, ctx) {
  ctx.fillStyle =
    "rgba(" + color[R] + ", " + color[G] + ", " + color[B] + ", 1)";
}
export function getPaddleColor(powershotness) {
  return lerpColor(rgb("ffffff"), rgb("ff0000"), powershotness);
}
export function fillCircle(pos, radius, ctx) {
  ctx.beginPath();
  ctx.arc(pos[X], pos[Y], radius, 0, Math.PI * 2, false);
  ctx.fill();
}

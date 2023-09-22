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
export default function setColor(color, ctx) {
  ctx.fillStyle =
    "rgba(" + color[R] + ", " + color[G] + ", " + color[B] + ", 1)";
}

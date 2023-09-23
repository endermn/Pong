const R = 0;
const G = 1;
const B = 2;

const X = 0;
const Y = 1;
export class Colors {
  rgb(str) {
    return [
      parseInt(str.slice(0, 2), 16),
      parseInt(str.slice(2, 4), 16),
      parseInt(str.slice(4, 6), 16),
    ];
  }
  lerp(a, b, alpha) {
    return a + alpha * (b - a);
  }

  zip(a, b) {
    return a.map((e, i) => [e, b[i]]);
  }
  lerpColor(a, b, alpha) {
    return this.zip(a, b).map((x) => this.lerp(x[0], x[1], alpha));
  }
  setColor(color, ctx) {
    ctx.fillStyle =
      "rgba(" + color[R] + ", " + color[G] + ", " + color[B] + ", 1)";
  }
  getPaddleColor(powershotness) {
    return this.lerpColor(
      this.rgb("ffffff"),
      this.rgb("ff0000"),
      powershotness
    );
  }
  fillCircle(pos, radius, ctx) {
    ctx.beginPath();
    ctx.arc(pos[X], pos[Y], radius, 0, Math.PI * 2, false);
    ctx.fill();
  }
}

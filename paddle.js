import { X, Y, WIDTH, HEIGHT, vrep, vadd, vmul } from "./vector.js";
import { rgb, lerpColor } from "./colors.js";

const PIXELS_PER_MS = 0.5;
export const SIZE = [20, 110];

export class Paddle {
  /*constructor() {
    this.reset();
  }*/

  reset(y) {
    this.y = y;
    this.dashCooldown = 0;
    this.shakeness = 0;
    this.powershotness = 0;
  }

  update(deltaTime, height, downness, chargePressed, dashPressed) {
    this.shakeness = Math.max(this.shakeness - deltaTime / 500, 0);
    this.dashCooldown = Math.max(this.dashCooldown - deltaTime / 3000, 0);

    if (chargePressed) {
      this.powershotness = Math.min(this.powershotness + deltaTime * 0.0005, 1);
    } else {
      let deltaY = downness * deltaTime * PIXELS_PER_MS;
      if (dashPressed && this.dashCooldown == 0 && downness != 0) {
        deltaY *= 40;
        this.dashCooldown = 1;
      }
      const maxPaddleY = height - SIZE[HEIGHT];
      this.y = Math.min(Math.max(this.y + deltaY, 0), maxPaddleY);
    }
  }

  draw(ctx, x) {
    const shakeOffset = [0, 0].map(
      (_) => (Math.random() - 0.5) * 30 * this.shakeness
    );
    const color = lerpColor(rgb("ffffff"), rgb("ff0000"), this.powershotness);

    if (this.dashCooldown > 0)
      ctx.strokeRect(
        vadd([x, this.y], shakeOffset),
        vmul(SIZE, [1, this.dashCooldown]),
        rgb("F28500"),
        10
      );

    ctx.fillRect(vadd([x, this.y], shakeOffset), SIZE, color);
  }
}

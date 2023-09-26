import { zipMany } from "./util.js";
import { X, Y, WIDTH, HEIGHT, vrep, vadd, vmul } from "./vector.js";
import { rgb, lerpColor } from "./colors.js";

const LEFT = 0;
const RIGHT = 1;

const PIXELS_PER_MS = 0.5;
const BALL_RADIUS = 14;
const PADDLE_SIZE = [20, 110];
const OLD_BALL_POSITION_COUNT = 10;

function getPaddleColor(powershotness) {
  return lerpColor(rgb("ffffff"), rgb("ff0000"), powershotness);
}

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.hitSound = new Audio("hit_sound.wav");
    this.score = [0, 0];
    this.oldBallPositionIndex = 0;
    this.reset();
    this.oldBallPositions = Array(OLD_BALL_POSITION_COUNT).fill(this.ballPos);
  }

  reset() {
    this.dashCooldowns = [0, 0];

    this.size = [window.innerWidth, window.innerHeight];
    this.canvas.width = this.size[WIDTH];
    this.canvas.height = this.size[HEIGHT];

    this.paddleShakenesses = [0, 0];

    this.paddleYs = vrep((this.size[HEIGHT] - PADDLE_SIZE[HEIGHT]) / 2, 2);

    this.ballPos = vmul(this.size, vrep(0.5, 2));

    const startAngle = Math.random() * 2 * Math.PI;
    this.ballVelocity = [Math.cos(startAngle) / 2, Math.sin(startAngle) / 2];

    this.powershotnesses = [0, 0];

    this.spin = 0;
  }

  drawPaddle(ctx, side, shakeOffset, paddleColor, x) {
    if (this.dashCooldowns[side] > 0)
      ctx.strokeRect(
        vadd([x, this.paddleYs[side]], shakeOffset),
        vmul(PADDLE_SIZE, [1, this.dashCooldowns[side]]),
        rgb("F28500"),
        10
      );
    ctx.fillRect(
      vadd([x, this.paddleYs[side]], shakeOffset),
      PADDLE_SIZE,
      paddleColor
    );
  }

  draw(ctx) {
    ctx.fillRect([0, 0], this.size, rgb("202833"));

    for (let i = 0; i < OLD_BALL_POSITION_COUNT; i++) {
      const newness = (i + 1) / OLD_BALL_POSITION_COUNT;
      const color = lerpColor(rgb("202833"), rgb("ee8888"), newness);
      const positionIndex =
        (this.oldBallPositionIndex + i) % OLD_BALL_POSITION_COUNT;
      ctx.fillCircle(this.oldBallPositions[positionIndex], BALL_RADIUS, color);
    }

    ctx.fillCircle(this.ballPos, BALL_RADIUS, rgb("ffffff"));

    const shakeOffsets = this.paddleShakenesses.map((s) =>
      [0, 0].map((_) => (Math.random() - 0.5) * 30 * s)
    );
    const paddleColors = this.powershotnesses.map(getPaddleColor);

    this.drawPaddle(ctx, LEFT, shakeOffsets[LEFT], paddleColors[LEFT], 0);
    const rightPaddleX = this.size[WIDTH] - PADDLE_SIZE[WIDTH];
    this.drawPaddle(
      ctx,
      RIGHT,
      shakeOffsets[RIGHT],
      paddleColors[RIGHT],
      rightPaddleX
    );

    const centerX = this.size[WIDTH] / 2;
    const SCORE_Y = 60;
    const FONT = "50px Arial";
    ctx.fillText([centerX, SCORE_Y], ":", FONT, rgb("ffffff"), "center");
    ctx.fillText(
      [centerX - 15, SCORE_Y],
      this.score[LEFT],
      FONT,
      rgb("ffffff"),
      "right"
    );
    ctx.fillText(
      [centerX + 15, SCORE_Y],
      this.score[RIGHT],
      FONT,
      rgb("ffffff"),
      "left"
    );
  }

  movePaddles(pressedKeys, deltaTime) {
    const c = zipMany([
      this.powershotnesses,
      this.paddleYs,
      ["KeyD", "ArrowLeft"],
      ["KeyW", "ArrowUp"],
      ["KeyS", "ArrowDown"],
      ["KeyQ", "ArrowRight"],
      this.dashCooldowns,
    ]).map(
      ([
        powershotness,
        paddleY,
        powershotKey,
        upKey,
        downKey,
        dashKey,
        dashCooldown,
      ]) => {
        if (pressedKeys.has(powershotKey)) {
          powershotness = Math.min(powershotness + deltaTime * 0.0005, 1);
        } else {
          const downness = pressedKeys.has(downKey) - pressedKeys.has(upKey);
          let deltaY = downness * deltaTime * PIXELS_PER_MS;
          if (pressedKeys.has(dashKey) && dashCooldown == 0 && downness != 0) {
            deltaY *= 40;
            dashCooldown = 1;
          }
          const maxPaddleY = this.size[HEIGHT] - PADDLE_SIZE[HEIGHT];
          paddleY = Math.min(Math.max(paddleY + deltaY, 0), maxPaddleY);
        }
        return [powershotness, paddleY, dashCooldown];
      }
    );
    // [[lPS, lPY], [rPS, rPY]] => [[lPS, rPS], [lPY, rPY]]
    this.powershotnesses = c.map(([powershotness, _1, _2]) => powershotness);
    this.paddleYs = c.map(([_1, paddleY, _2]) => paddleY);
    this.dashCooldowns = c.map(([_1, _2, cooldown]) => cooldown);
  }

  hitPaddles(oldPaddleYs) {
    const ballAcceleration = 0.4;
    if (
      this.ballPos[X] - BALL_RADIUS <= PADDLE_SIZE[WIDTH] &&
      this.ballPos[Y] - BALL_RADIUS <
        this.paddleYs[LEFT] + PADDLE_SIZE[HEIGHT] &&
      this.ballPos[Y] + BALL_RADIUS > this.paddleYs[LEFT] &&
      this.ballVelocity[X] < 0
    ) {
      this.hitSound.volume = Math.max(this.powershotnesses[LEFT], 0.1);
      this.hitSound.play();
      this.spin -= Math.sign(this.paddleYs[LEFT] - oldPaddleYs[LEFT]);
      this.ballVelocity = [
        -this.ballVelocity[X] + ballAcceleration + this.powershotnesses[LEFT]*1.5,
        this.ballVelocity[Y],
      ];
      this.paddleShakenesses = [
        0.3 + this.powershotnesses[LEFT],
        this.paddleShakenesses[RIGHT],
      ];
      this.powershotnesses = [0, this.powershotnesses[RIGHT]];
    }
    if (
      this.ballPos[X] + BALL_RADIUS >= this.size[WIDTH] - PADDLE_SIZE[WIDTH] &&
      this.ballPos[Y] - BALL_RADIUS <
        this.paddleYs[RIGHT] + PADDLE_SIZE[HEIGHT] &&
      this.ballPos[Y] + BALL_RADIUS > this.paddleYs[RIGHT] &&
      this.ballVelocity[X] > 0
    ) {
      this.hitSound.volume = Math.max(this.powershotnesses[RIGHT], 0.1);
      this.hitSound.play();
      this.spin -= Math.sign(this.paddleYs[RIGHT] - oldPaddleYs[RIGHT]);
      this.ballVelocity = [
        -this.ballVelocity[X] - ballAcceleration - this.powershotnesses[RIGHT]*1.5,
        this.ballVelocity[Y],
      ];
      this.paddleShakenesses = [
        this.paddleShakenesses[LEFT],
        0.3 + this.powershotnesses[RIGHT],
      ];
      this.powershotnesses = [this.powershotnesses[LEFT], 0];
    }
  }

  hitTopAndBottom() {
    const wallVelocityMultiplier = 0.7;
    const wallSpinMultiplier = 0.3;
    if (this.ballPos[Y] <= BALL_RADIUS && this.ballVelocity[Y] < 0) {
      this.ballVelocity = [
        this.ballVelocity[X] - this.spin * wallVelocityMultiplier,
        -this.ballVelocity[Y],
      ];
      this.spin *= wallSpinMultiplier;
    }
    if (
      this.ballPos[Y] >= this.size[HEIGHT] - BALL_RADIUS &&
      this.ballVelocity[Y] > 0
    ) {
      this.ballVelocity = [
        this.ballVelocity[X] + this.spin * wallVelocityMultiplier,
        -this.ballVelocity[Y],
      ];
      this.spin *= wallSpinMultiplier;
    }
  }

  update(pressedKeys, deltaTime) {
    const oldPaddleYs = this.paddleYs;

    this.oldBallPositions[this.oldBallPositionIndex] = this.ballPos;
    this.oldBallPositionIndex =
      (this.oldBallPositionIndex + 1) % OLD_BALL_POSITION_COUNT;

    this.paddleShakenesses = this.paddleShakenesses.map((s) =>
      Math.max(s - deltaTime / 500, 0)
    );

    this.dashCooldowns = this.dashCooldowns.map((cooldown) =>
      Math.max(cooldown - deltaTime / 3000, 0)
    );

    this.movePaddles(pressedKeys, deltaTime);

    if (this.ballVelocity[X] > 0 && this.ballVelocity[X] < 0.3)
      this.ballVelocity = [0.3, this.ballVelocity[Y]];
    if (this.ballVelocity[X] < 0 && this.ballVelocity[X] > -0.3)
      this.ballVelocity = [-0.3, this.ballVelocity[Y]];
    this.ballPos = vadd(
      this.ballPos,
      vmul(this.ballVelocity, vrep(deltaTime, 2))
    );

    this.hitTopAndBottom();

    this.hitPaddles(oldPaddleYs);

    this.ballVelocity = [
      this.ballVelocity[X] -
        (deltaTime / 2000) *
          this.ballVelocity[X] *
          Math.abs(this.ballVelocity[X]),
      this.ballVelocity[Y] -
        (deltaTime / 2000) *
          (this.ballVelocity[Y] * Math.abs(this.ballVelocity[Y]) -
            this.spin * 2),
    ];
    this.spin -= (deltaTime / 200) * this.spin * 0.5 * Math.abs(this.spin);

    if (this.ballPos[X] < 0) {
      this.score = vadd(this.score, [0, 1]);
      this.reset();
    } else if (this.ballPos[X] > this.size[WIDTH]) {
      this.score = vadd(this.score, [1, 0]);
      this.reset();
    }
  }
}

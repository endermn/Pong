import { zipMany } from "./util.js";
import { X, Y, WIDTH, HEIGHT, vrep, vadd, vmul } from "./vector.js";
import { rgb, lerpColor } from "./colors.js";
import { Paddle, SIZE as PADDLE_SIZE } from "./paddle.js";

const LEFT = 0;
const RIGHT = 1;

const BALL_RADIUS = 14;
const OLD_BALL_POSITION_COUNT = 10;

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.hitSound = new Audio("hit_sound.wav");
    this.score = [0, 0];
    this.oldBallPositionIndex = 0;
    this.paddles = [new Paddle(), new Paddle()];
    this.reset();
    this.oldBallPositions = Array(OLD_BALL_POSITION_COUNT).fill(this.ballPos);
  }

  reset() {
    this.dashCooldowns = [0, 0];

    this.size = [window.innerWidth, window.innerHeight];
    this.canvas.width = this.size[WIDTH];
    this.canvas.height = this.size[HEIGHT];

    for (const side of [LEFT, RIGHT])
      this.paddles[side].reset((this.size[HEIGHT] - PADDLE_SIZE[HEIGHT]) / 2);

    this.ballPos = vmul(this.size, vrep(0.5, 2));

    const startAngle = Math.random() * 2 * Math.PI;
    this.ballVelocity = [Math.cos(startAngle) / 2, Math.sin(startAngle) / 2];

    this.spin = 0;
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

    this.paddles[LEFT].draw(ctx, 0);
    this.paddles[RIGHT].draw(ctx, this.size[WIDTH] - PADDLE_SIZE[WIDTH]);

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

  hitPaddles(oldPaddleYs) {
    const ballAcceleration = 0.4;
    if (
      this.ballPos[X] - BALL_RADIUS <= PADDLE_SIZE[WIDTH] &&
      this.ballPos[Y] - BALL_RADIUS <
        this.paddles[LEFT].y + PADDLE_SIZE[HEIGHT] &&
      this.ballPos[Y] + BALL_RADIUS > this.paddles[LEFT].y &&
      this.ballVelocity[X] < 0
    ) {
      this.hitSound.volume = Math.max(this.paddles[LEFT].powershotness, 0.1);
      this.hitSound.play();
      this.spin -= Math.sign(this.paddles[LEFT].y - oldPaddleYs[LEFT]);
      this.ballVelocity = [
        -this.ballVelocity[X] +
          ballAcceleration +
          this.paddles[LEFT].powershotness * 1.5,
        this.ballVelocity[Y],
      ];
      this.paddles[LEFT].shakeness = 0.3 + this.paddles[LEFT].powershotness;
      this.paddles[LEFT].powershotness = 0;
    }
    if (
      this.ballPos[X] + BALL_RADIUS >= this.size[WIDTH] - PADDLE_SIZE[WIDTH] &&
      this.ballPos[Y] - BALL_RADIUS <
        this.paddles[RIGHT].y + PADDLE_SIZE[HEIGHT] &&
      this.ballPos[Y] + BALL_RADIUS > this.paddles[RIGHT].y &&
      this.ballVelocity[X] > 0
    ) {
      this.hitSound.volume = Math.max(this.paddles[RIGHT].powershotness, 0.1);
      this.hitSound.play();
      this.spin -= Math.sign(this.paddles[RIGHT].y - oldPaddleYs[RIGHT]);
      this.ballVelocity = [
        -this.ballVelocity[X] -
          ballAcceleration -
          this.paddles[RIGHT].powershotness * 1.5,
        this.ballVelocity[Y],
      ];
      this.paddles[RIGHT].shakeness = 0.3 + this.paddles[RIGHT].powershotness;
      this.paddles[RIGHT].powershotness = 0;
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
    const oldPaddleYs = this.paddles.map((p) => p.y);
    this.oldBallPositions[this.oldBallPositionIndex] = this.ballPos;
    this.oldBallPositionIndex =
      (this.oldBallPositionIndex + 1) % OLD_BALL_POSITION_COUNT;

    this.paddles[LEFT].update(
      deltaTime,
      this.size[HEIGHT],
      pressedKeys.has("KeyS") - pressedKeys.has("KeyW"),
      pressedKeys.has("KeyD"),
      pressedKeys.has("KeyQ")
    );
    this.paddles[RIGHT].update(
      deltaTime,
      this.size[HEIGHT],
      pressedKeys.has("ArrowDown") - pressedKeys.has("ArrowUp"),
      pressedKeys.has("ArrowLeft"),
      pressedKeys.has("ArrowRight")
    );

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

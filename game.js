<<<<<<< HEAD
import { X, Y, WIDTH, HEIGHT, vrep, vadd, vmul } from "./vector.js";
import { rgb, lerpColor } from "./colors.js";
=======
import { X, Y, WIDTH, HEIGHT, vadd } from "./vector.js";
import { rgb } from "./colors.js";
>>>>>>> d17d001120275501827c84718346fa3075e01fc9
import { Paddle, SIZE as PADDLE_SIZE } from "./paddle.js";
import { Ball, RADIUS as BALL_RADIUS } from "./ball.js";

const LEFT = 0;
const RIGHT = 1;

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.hitSound = new Audio("hit_sound.wav");
    this.score = [0, 0];
    this.paddles = [new Paddle(), new Paddle()];
    this.ball = new Ball();
    this.#reset();
  }

  #reset() {
    this.size = [window.innerWidth, window.innerHeight];
    this.canvas.width = this.size[WIDTH];
    this.canvas.height = this.size[HEIGHT];

    for (const side of [LEFT, RIGHT])
      this.paddles[side].reset((this.size[HEIGHT] - PADDLE_SIZE[HEIGHT]) / 2);

    this.ball.reset(this.size.map(x => x / 2));
  }

  draw(ctx) {
    ctx.fillRect([0, 0], this.size, rgb("202833"));

    this.ball.draw(ctx);

    this.paddles[LEFT].draw(ctx, 0);
    this.paddles[RIGHT].draw(ctx, this.size[WIDTH] - PADDLE_SIZE[WIDTH]);

    const centerX = this.size[WIDTH] / 2;
    const SCORE_Y = 60;
    const FONT = "50px Arial";

    ctx.fillText([centerX, SCORE_Y], ":", FONT, rgb("ffffff"), "center");

    const leftScorePos = [centerX - 15, SCORE_Y];
    ctx.fillText(leftScorePos, this.score[LEFT], FONT, rgb("ffffff"), "right");

    const rightScorePos = [centerX + 15, SCORE_Y];
    ctx.fillText(rightScorePos, this.score[RIGHT], FONT, rgb("ffffff"), "left");
  }

  #hitPaddles(oldPaddleYs) {
    const ballAcceleration = 0.4;
    if (
      this.ball.pos[X] - BALL_RADIUS <= PADDLE_SIZE[WIDTH] &&
      this.ball.pos[Y] - BALL_RADIUS <
        this.paddles[LEFT].y + PADDLE_SIZE[HEIGHT] &&
      this.ball.pos[Y] + BALL_RADIUS > this.paddles[LEFT].y &&
      this.ball.velocity[X] < 0
    ) {
      this.hitSound.volume = Math.max(this.paddles[LEFT].powershotness, 0.1);
      this.hitSound.play();
      this.ball.spin -= Math.sign(this.paddles[LEFT].y - oldPaddleYs[LEFT]);
      this.ball.velocity = [
        -this.ball.velocity[X] +
          ballAcceleration +
          this.paddles[LEFT].powershotness * 1.5,
        this.ball.velocity[Y],
      ];
      this.paddles[LEFT].shakeness = 0.3 + this.paddles[LEFT].powershotness;
      this.paddles[LEFT].powershotness = 0;
    }
    if (
      this.ball.pos[X] + BALL_RADIUS >= this.size[WIDTH] - PADDLE_SIZE[WIDTH] &&
      this.ball.pos[Y] - BALL_RADIUS <
        this.paddles[RIGHT].y + PADDLE_SIZE[HEIGHT] &&
      this.ball.pos[Y] + BALL_RADIUS > this.paddles[RIGHT].y &&
      this.ball.velocity[X] > 0
    ) {
      this.hitSound.volume = Math.max(this.paddles[RIGHT].powershotness, 0.1);
      this.hitSound.play();
      this.ball.spin -= Math.sign(this.paddles[RIGHT].y - oldPaddleYs[RIGHT]);
      this.ball.velocity = [
        -this.ball.velocity[X] -
          ballAcceleration -
          this.paddles[RIGHT].powershotness * 1.5,
        this.ball.velocity[Y],
      ];
      this.paddles[RIGHT].shakeness = 0.3 + this.paddles[RIGHT].powershotness;
      this.paddles[RIGHT].powershotness = 0;
    }
  }

  #checkGameState() {
    if (this.ball.pos[X] < 0) {
      this.score = vadd(this.score, [0, 1]);
      this.#reset();
    } else if (this.ball.pos[X] > this.size[WIDTH]) {
      this.score = vadd(this.score, [1, 0]);
      this.reset();
    }
    if (this.score[LEFT] >= 5 || this.score[RIGHT] >= 5) {
      this.score[LEFT] = 0;
      this.score[RIGHT] = 0;
      this.reset();
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
      this.#reset();
    }
  }

  update(pressedKeys, deltaTime) {
    const oldPaddleYs = this.paddles.map((p) => p.y);

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

    this.ball.update(deltaTime, this.size[HEIGHT]);

    this.#hitPaddles(oldPaddleYs);

    this.#checkGameState();
  }
}

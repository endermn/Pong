import { zipMany } from "./util.js";
import { X, Y, WIDTH, HEIGHT, vrep, vadd, vmul } from "./vector.js";
import { rgb, lerpColor } from "./colors.js";

const LEFT = 0;
const RIGHT = 1;

const PIXELS_PER_MS = 0.5;
const BALL_RADIUS = 14;
const PADDLE_SIZE = [20, 110];
const OLD_BALL_POSITION_COUNT = 20;

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
    this.size = [window.innerWidth, window.innerHeight];
    this.canvas.width = this.size[WIDTH];
    this.canvas.height = this.size[HEIGHT];

    this.paddleYs = vrep((this.size[HEIGHT] - PADDLE_SIZE[HEIGHT]) / 2, 2);

    this.ballPos = vmul(this.size, vrep(.5, 2));

    const startAngle = Math.random() * 2 * Math.PI;
    this.ballVelocity = [Math.cos(startAngle) / 2, Math.sin(startAngle) / 2];

    this.powershotnesses = [0, 0];

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

    const paddleColors = this.powershotnesses.map(getPaddleColor);
    ctx.fillRect([0, this.paddleYs[LEFT]], PADDLE_SIZE, paddleColors[LEFT]);

    const rightPaddlePos = [this.size[WIDTH] - PADDLE_SIZE[WIDTH], this.paddleYs[RIGHT]];
    ctx.fillRect(rightPaddlePos, PADDLE_SIZE, paddleColors[RIGHT]);

    const scoreText = `${this.score[LEFT]} : ${this.score[RIGHT]}`;
    ctx.fillText([50, 50], scoreText, "30px Arial", rgb("ffffff"));
  }

  movePaddles(pressedKeys, deltaTime) {
    const c =
      zipMany([this.powershotnesses, this.paddleYs, ["KeyD", "ArrowLeft"], ["KeyW", "ArrowUp"], ["KeyS", "ArrowDown"]])
      .map(([powershotness, paddleY, powershotKey, upKey, downKey]) => {
        if (pressedKeys.has(powershotKey)) {
          console.log("power");
          powershotness = Math.min(powershotness + deltaTime * 0.0005, 1);
        } else {
          if (pressedKeys.has(upKey)) paddleY -= deltaTime * PIXELS_PER_MS;
          if (pressedKeys.has(downKey)) paddleY += deltaTime * PIXELS_PER_MS;
          const maxPaddleY = this.size[HEIGHT] - PADDLE_SIZE[HEIGHT];
          paddleY = Math.min(Math.max(paddleY, 0), maxPaddleY);
        }
        return [powershotness, paddleY];
      });
    // [[lPS, lPY], [rPS, rPY]] => [[lPS, rPS], [lPY, rPY]]
    this.powershotnesses = c.map(([powershotness, _]) => powershotness);
    this.paddleYs = c.map(([_, paddleY]) => paddleY);
  }

  hitPaddles(oldPaddleYs) {
    const ballAcceleration = 0.4;
    if (
      this.ballPos[X] - BALL_RADIUS <= PADDLE_SIZE[WIDTH] &&
      this.ballPos[Y] - BALL_RADIUS < this.paddleYs[LEFT] + PADDLE_SIZE[HEIGHT] &&
      this.ballPos[Y] + BALL_RADIUS > this.paddleYs[LEFT] &&
      this.ballVelocity[X] < 0
    ) {
      this.hitSound.volume = Math.max(this.powershotnesses[LEFT], 0.1);
      this.hitSound.play();
      this.spin -= Math.sign(this.paddleYs[LEFT] - oldPaddleYs[LEFT]);
      this.ballVelocity = [-this.ballVelocity[X] + ballAcceleration + this.powershotnesses[LEFT], this.ballVelocity[Y]];
      this.powershotnesses = [0, this.powershotnesses[RIGHT]];
    }
    if (
      this.ballPos[X] + BALL_RADIUS >= this.size[WIDTH] - PADDLE_SIZE[WIDTH] &&
      this.ballPos[Y] - BALL_RADIUS < this.paddleYs[RIGHT] + PADDLE_SIZE[HEIGHT] &&
      this.ballPos[Y] + BALL_RADIUS > this.paddleYs[RIGHT] &&
      this.ballVelocity[X] > 0
    ) {
      this.hitSound.volume = Math.max(this.powershotnesses[RIGHT], 0.1);
      this.hitSound.play();
      this.spin -= Math.sign(this.paddleYs[RIGHT] - oldPaddleYs[RIGHT]);
      this.ballVelocity = [-this.ballVelocity[X] - ballAcceleration - this.powershotnesses[RIGHT], this.ballVelocity[Y]];
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
    if (this.ballPos[Y] >= this.size[HEIGHT] - BALL_RADIUS && this.ballVelocity[Y] > 0) {
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
    this.oldBallPositionIndex = (this.oldBallPositionIndex + 1) % OLD_BALL_POSITION_COUNT;

    this.movePaddles(pressedKeys, deltaTime);

    if (this.ballVelocity[X] > 0 && this.ballVelocity[X] < 0.3)
      this.ballVelocity = [0.3, this.ballVelocity[Y]];
    if (this.ballVelocity[X] < 0 && this.ballVelocity[X] > -0.3)
      this.ballVelocity = [-0.3, this.ballVelocity[Y]];
    this.ballPos = vadd(this.ballPos, vmul(this.ballVelocity, vrep(deltaTime, 2)));

    this.hitTopAndBottom();

    this.hitPaddles(oldPaddleYs);

    this.ballVelocity = [
      this.ballVelocity[X] - (deltaTime / 2000) * this.ballVelocity[X] * Math.abs(this.ballVelocity[X]),
      this.ballVelocity[Y] - (deltaTime / 2000) * (this.ballVelocity[Y] * Math.abs(this.ballVelocity[Y]) - this.spin * 2),
    ];
    this.spin -= (deltaTime / 200) * this.spin * 0.5 * Math.abs(this.spin);

    if (this.ballPos[X] < 0) {
      this.score = vadd(this.score, [1, 0]);
      this.reset();
    } else if (this.ballPos[X] > this.size[WIDTH]) {
      this.score = vadd(this.score, [0, 1]);
      this.reset();
    }
  }
}

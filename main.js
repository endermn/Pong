"use strict";

import {
  rgb,
  lerpColor,
  setColor,
  getPaddleColor,
  fillCircle,
} from "./colors.js";

const canvas = document.getElementById("canvasId");
const ctx = canvas.getContext("2d");
const pressedKeys = new Set();

const PIXELS_PER_MS = 0.5;
const BALL_RADIUS = 14;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 110;
const HIT_SOUND = new Audio("hit_sound.wav");
const OLD_BALL_POSITION_COUNT = 20;

let leftPaddleY;
let rightPaddleY;

let ballX;
let ballY;
let velocityX;
let velocityY;

let leftPowershotness;
let rightPowershotness;

let leftScore = 0;
let rightScore = 0;

let spin;

let oldBallPositions = Array(OLD_BALL_POSITION_COUNT).fill([ballX, ballY]);
let oldBallPositionIndex = 0;

function resetGame() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  leftPaddleY = rightPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;

  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  const startAngle = Math.random() * 2 * Math.PI;
  velocityX = Math.cos(startAngle) / 2;
  velocityY = Math.sin(startAngle) / 2;

  leftPowershotness = 0;
  rightPowershotness = 0;

  spin = 0;
}

resetGame();

let previousTime = 0;

function draw() {
  setColor(rgb("202833"), ctx);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < OLD_BALL_POSITION_COUNT; i++) {
    setColor(
      lerpColor(
        rgb("202833"),
        rgb("ee8888"),
        (i + 1) / OLD_BALL_POSITION_COUNT
      ),
      ctx
    );
    const positionIndex = (oldBallPositionIndex + i) % OLD_BALL_POSITION_COUNT;
    fillCircle(oldBallPositions[positionIndex], BALL_RADIUS, ctx);
  }

  setColor(rgb("ffffff"), ctx);
  fillCircle([ballX, ballY], BALL_RADIUS, ctx);

  setColor(getPaddleColor(leftPowershotness), ctx);
  ctx.fillRect(0, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
  setColor(getPaddleColor(rightPowershotness), ctx);
  ctx.fillRect(
    canvas.width - PADDLE_WIDTH,
    rightPaddleY,
    PADDLE_WIDTH,
    PADDLE_HEIGHT
  );

  setColor(rgb("ffffff"), ctx);
  ctx.font = "30px Arial";
  ctx.fillText(`${leftScore} : ${rightScore}`, 50, 50);
  ctx.fillText(velocityX, 250, 50);
}

function paddleMove(deltaTime) {
  const deltaTimeMultiplier = 0.0005;

  if (pressedKeys.has("KeyD")) {
    leftPowershotness = Math.min(
      leftPowershotness + deltaTime * deltaTimeMultiplier,
      1
    );
  } else {
    if (pressedKeys.has("KeyW")) leftPaddleY -= deltaTime * PIXELS_PER_MS;
    if (pressedKeys.has("KeyS")) leftPaddleY += deltaTime * PIXELS_PER_MS;
  }

  if (pressedKeys.has("ArrowLeft")) {
    rightPowershotness = Math.min(
      rightPowershotness + deltaTime * deltaTimeMultiplier,
      1
    );
  } else {
    if (pressedKeys.has("ArrowUp")) rightPaddleY -= deltaTime * PIXELS_PER_MS;
    if (pressedKeys.has("ArrowDown")) rightPaddleY += deltaTime * PIXELS_PER_MS;
  }
  leftPaddleY = Math.min(
    Math.max(leftPaddleY, 0),
    canvas.height - PADDLE_HEIGHT
  );
  rightPaddleY = Math.min(
    Math.max(rightPaddleY, 0),
    canvas.height - PADDLE_HEIGHT
  );
}

function onHit(oldLeftPaddleY, oldRightPaddleY) {
  let ballAcceleration = 0.4;
  if (
    ballX - BALL_RADIUS <= PADDLE_WIDTH &&
    ballY - BALL_RADIUS < leftPaddleY + PADDLE_HEIGHT &&
    ballY + BALL_RADIUS > leftPaddleY &&
    velocityX < 0
  ) {
    HIT_SOUND.volume = Math.max(leftPowershotness, 0.1);
    HIT_SOUND.play();
    spin -= Math.sign(leftPaddleY - oldLeftPaddleY);
    velocityX = -velocityX + ballAcceleration + leftPowershotness;
    leftPowershotness = 0;
  }
  if (
    ballX + BALL_RADIUS >= canvas.width - PADDLE_WIDTH &&
    ballY - BALL_RADIUS < rightPaddleY + PADDLE_HEIGHT &&
    ballY + BALL_RADIUS > rightPaddleY &&
    velocityX > 0
  ) {
    HIT_SOUND.volume = Math.max(rightPowershotness, 0.1);
    HIT_SOUND.play();
    spin -= Math.sign(rightPaddleY - oldRightPaddleY);
    velocityX = -velocityX - ballAcceleration - rightPowershotness;
    rightPowershotness = 0;
  }
}

function onCornerHit() {
  const wallVelocityMultiplier = 0.7;
  const wallSpinMultiplier = 0.3;
  if (ballY <= BALL_RADIUS && velocityY < 0) {
    velocityX -= spin * wallVelocityMultiplier;
    spin *= wallSpinMultiplier;
    velocityY *= -1;
  }
  if (ballY >= canvas.height - BALL_RADIUS && velocityY > 0) {
    velocityX += spin * wallVelocityMultiplier;
    spin *= wallSpinMultiplier;
    velocityY *= -1;
  }
}
function getDeltaTime(time) {
  let deltaTime = time - (previousTime ?? time);
  if (deltaTime > 500) deltaTime = 0;
  previousTime = time;
  return deltaTime;
}

function checkGameState() {
  if (ballX < 0) {
    rightScore++;
    resetGame();
  } else if (ballX > canvas.width) {
    leftScore++;
    resetGame();
  }
}

function onFrame(time) {
  let deltaTime = getDeltaTime(time);

  const oldLeftPaddleY = leftPaddleY;
  const oldRightPaddleY = rightPaddleY;

  oldBallPositions[oldBallPositionIndex] = [ballX, ballY];
  oldBallPositionIndex = (oldBallPositionIndex + 1) % OLD_BALL_POSITION_COUNT;

  paddleMove(deltaTime);
  if (velocityX > 0 && velocityX < 0.3) velocityX = 0.3;
  if (velocityX < 0 && velocityX > -0.3) velocityX = -0.3;
  ballX += velocityX * deltaTime;
  ballY += velocityY * deltaTime;

  onCornerHit();

  onHit(oldLeftPaddleY, oldRightPaddleY);

  velocityX -= (deltaTime / 2000) * velocityX * Math.abs(velocityX);
  velocityY -=
    (deltaTime / 2000) * (velocityY * Math.abs(velocityY) - spin * 2);
  spin -= (deltaTime / 200) * spin * 0.5 * Math.abs(spin);

  checkGameState();

  draw();

  window.requestAnimationFrame(onFrame);
}

document.addEventListener("keydown", (e) => pressedKeys.add(e.code));
document.addEventListener("keyup", (e) => pressedKeys.delete(e.code));

window.requestAnimationFrame(onFrame);
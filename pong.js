"use strict";
const canvas = document.getElementById("canvasId");
const ctx = canvas.getContext("2d");
const pressedKeys = new Set();

function lerp(a, b, alpha) {
  return a + alpha * (b - a);
}

function zip(a, b) {
  return a.map((e, i) => [e, b[i]]);
}

const R = 0;
const G = 1;
const B = 2;

function lerpColor(a, b, alpha) {
  return zip(a, b).map((x) => lerp(x[0], x[1], alpha));
}

function rgb(str) {
  return [
    parseInt(str.slice(0, 2), 16),
    parseInt(str.slice(2, 4), 16),
    parseInt(str.slice(4, 6), 16),
  ];
}

function setColor(color) {
  ctx.fillStyle =
    "rgba(" + color[R] + ", " + color[G] + ", " + color[B] + ", 1)";
}

const PIXELS_PER_MS = 0.5;
const BALL_RADIUS = 14;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 110;

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
}

resetGame();

function getPaddleColor(powershotness) {
  return lerpColor(rgb("ffffff"), rgb("ff0000"), powershotness);
}

let previousTime = 0;

function draw() {
  setColor(rgb("202833"));
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  setColor(getPaddleColor(leftPowershotness));
  ctx.fillRect(0, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
  setColor(getPaddleColor(rightPowershotness));
  ctx.fillRect(
    canvas.width - PADDLE_WIDTH,
    rightPaddleY,
    PADDLE_WIDTH,
    PADDLE_HEIGHT
  );

  setColor(rgb("ffffff"));
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.font = "30px Arial";
  ctx.fillText(`${leftScore} : ${rightScore}`, 50, 50);
}

function onFrame(time) {
  let deltaTime = time - (previousTime ?? time);
  if (deltaTime > 500) deltaTime = 0;
  previousTime = time;

  if (pressedKeys.has("ArrowLeft")) {
    rightPowershotness += Math.min(deltaTime * 0.0005, 1);
  } else {
    if (pressedKeys.has("ArrowUp")) rightPaddleY -= deltaTime * PIXELS_PER_MS;
    if (pressedKeys.has("ArrowDown")) rightPaddleY += deltaTime * PIXELS_PER_MS;
  }

  if (pressedKeys.has("KeyD")) {
    leftPowershotness += Math.min(deltaTime * 0.0005, 1);
  } else {
    if (pressedKeys.has("KeyW")) leftPaddleY -= deltaTime * PIXELS_PER_MS;
    if (pressedKeys.has("KeyS")) leftPaddleY += deltaTime * PIXELS_PER_MS;
  }

  leftPaddleY = Math.min(
    Math.max(leftPaddleY, 0),
    canvas.height - PADDLE_HEIGHT
  );
  rightPaddleY = Math.min(
    Math.max(rightPaddleY, 0),
    canvas.height - PADDLE_HEIGHT
  );

  ballX += velocityX * deltaTime;
  ballY += velocityY * deltaTime;
  if (
    (ballY <= BALL_RADIUS && velocityY < 0) ||
    (ballY >= canvas.height - BALL_RADIUS && velocityY > 0)
  )
    velocityY *= -1.48;

  if (
    ballX - BALL_RADIUS <= PADDLE_WIDTH &&
    ballY - BALL_RADIUS < leftPaddleY + PADDLE_HEIGHT &&
    ballY + BALL_RADIUS > leftPaddleY &&
    velocityX < 0
  ) {
    velocityX = -velocityX + 0.5 + leftPowershotness * 0.5;
    leftPowershotness = 0;
  }
  if (
    ballX + BALL_RADIUS >= canvas.width - PADDLE_WIDTH &&
    ballY - BALL_RADIUS < rightPaddleY + PADDLE_HEIGHT &&
    ballY + BALL_RADIUS > rightPaddleY &&
    velocityX > 0
  ) {
    velocityX = -velocityX - 0.5 - rightPowershotness * 0.5;
    rightPowershotness = 0;
  }

  velocityX -= (deltaTime / 2000) * velocityX * Math.abs(velocityX);
  velocityY -= (deltaTime / 2000) * velocityY * Math.abs(velocityY);

  if (ballX < 0) {
    rightScore++;
    resetGame();
  } else if (ballX > canvas.width) {
    leftScore++;
    resetGame();
  }

  draw();
  window.requestAnimationFrame(onFrame);
}

document.addEventListener("keydown", (e) => pressedKeys.add(e.code));
document.addEventListener("keyup", (e) => pressedKeys.delete(e.code));

window.requestAnimationFrame(onFrame);

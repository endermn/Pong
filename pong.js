"use strict";
const canvas = document.getElementById("canvasId");
const ctx = canvas.getContext("2d");
const pressedKeys = new Set();

const PIXELS_PER_MS = 0.5;
const BALL_RADIUS = 10;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 110;

let positionYL = 240;
let positionYR = 240;

let ballX;
let ballY;
let velocityX;
let velocityY;

let powerShot = false;

function resetBall() {
  ballX = 500;
  ballY = 250;
  const startAngle = Math.random() * 2 * Math.PI;
  velocityX = Math.cos(startAngle) / 2;
  velocityY = Math.sin(startAngle) / 2;
}

resetBall();

let previousTime = 0; //new Date().getTime();

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(132, 213, 245, 0.8)";
  ctx.fillRect(0, positionYL, PADDLE_WIDTH, PADDLE_HEIGHT);
  ctx.fillRect(980, positionYR, PADDLE_WIDTH, PADDLE_HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.fillRect(
    ballX - BALL_RADIUS,
    ballY - BALL_RADIUS,
    BALL_RADIUS * 2,
    BALL_RADIUS * 2
  );
}

function onFrame(time) {
  const deltaTime = time - (previousTime ?? time);
  if (pressedKeys.has("ArrowUp")) positionYR -= deltaTime * PIXELS_PER_MS;
  if (pressedKeys.has("ArrowDown")) positionYR += deltaTime * PIXELS_PER_MS;
  if (pressedKeys.has("KeyW")) positionYL -= deltaTime * PIXELS_PER_MS;
  if (pressedKeys.has("KeyS")) positionYL += deltaTime * PIXELS_PER_MS;
  previousTime = time;

  positionYL = Math.min(Math.max(positionYL, 0), 700 - PADDLE_HEIGHT);
  positionYR = Math.min(Math.max(positionYR, 0), 700 - PADDLE_HEIGHT);

  ballX += velocityX * deltaTime;
  ballY += velocityY * deltaTime;
  if (
    (ballY <= BALL_RADIUS && velocityY < 0) ||
    (ballY >= 700 - BALL_RADIUS && velocityY > 0)
  )
    velocityY *= -1;
  if (
    ballX - BALL_RADIUS <= PADDLE_WIDTH &&
    ballY - BALL_RADIUS < positionYL + PADDLE_HEIGHT &&
    ballY + BALL_RADIUS > positionYL &&
    velocityX < 0
  ) {
    velocityX = -velocityX + 0.4 + powerShot * 0.5;
    powerShot = false;
  }
  if (
    ballX + BALL_RADIUS >= 1000 - PADDLE_WIDTH &&
    ballY - BALL_RADIUS < positionYR + PADDLE_HEIGHT &&
    ballY + BALL_RADIUS > positionYR &&
    velocityX > 0
  ) {
    velocityX = -velocityX - 0.4 - powerShot * 0.5;
    powerShot = false;
  }
  velocityX -=
    (deltaTime / 2000) * velocityX * velocityX * Math.sign(velocityX);
  //velocityY *= 1 - deltaTime / 3500;

  if (
    (ballX <= BALL_RADIUS && velocityX < 0) ||
    (ballX >= 1000 - BALL_RADIUS && velocityX > 0)
  )
    resetBall();

  draw();
  window.requestAnimationFrame(onFrame);
}

document.addEventListener("keyup", (e) => {
  pressedKeys.delete(e.code);
});

document.addEventListener("keydown", (e) => {
  if (e.code == "Space") powerShot = true;
  pressedKeys.add(e.code);
});

window.requestAnimationFrame(onFrame);

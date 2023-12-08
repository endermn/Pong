import Canvas from "./draw.js";
import Game from "./game.js";

const canvas = document.getElementById("canvas");

const ctx = new Canvas(canvas);
const pressedKeys = new Set;

let previousTime = 0;

const game = new Game;
await game.init(canvas);

function onFrame(time) {
	let deltaTime = time - (previousTime ?? time);
	if (deltaTime > 500)
		deltaTime = 0;
	previousTime = time;

	game.update(pressedKeys, deltaTime);

	game.draw(ctx);

	window.requestAnimationFrame(onFrame);
}

document.addEventListener("keydown", e => {
	if (!e.repeat)
		game.onKeyDown(e.code);
	pressedKeys.add(e.code);
});
document.addEventListener("keyup", e => pressedKeys.delete(e.code));

window.requestAnimationFrame(onFrame);

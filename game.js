import { X, Y, WIDTH, HEIGHT, vadd, vmul } from "./vector.js";
import { rgb } from "./colors.js";
import { Paddle, SIZE as PADDLE_SIZE } from "./paddle.js";
import { Ball, RADIUS as BALL_RADIUS, RADIUS } from "./ball.js";
import { PickupItem } from "./item.js";

const LEFT = 0;
const RIGHT = 1;

const WIN_SCORE = 11;
const WIN_MARGIN = 2;

export default class Game {
	async init(canvas) {
		this.draw_item = true;
		this.canvas = canvas;
		const response = await fetch("hit_sound.txt");
		const buffer = await response.arrayBuffer();
		const url = URL.createObjectURL(new Blob([buffer.slice(4)], {type: "audio/wav"}));
		this.hitSound = new Audio(url);
		this.paddles = [new Paddle(), new Paddle()];
		this.pickup_item = new PickupItem();
		this.ball = new Ball;
		this.winner = undefined;
		this.#reset();
	}

	#resetPoint() {
		for (const side of [LEFT, RIGHT])
			this.paddles[side].reset((this.size[HEIGHT] - PADDLE_SIZE[HEIGHT]) / 2);

		this.ball.reset(this.size.map(x => x / 2));
		this.pickup_item.reset_pickup();
	}

	#reset() {
		this.size = [window.innerWidth, window.innerHeight];
		this.canvas.width = this.size[WIDTH];
		this.canvas.height = this.size[HEIGHT];
		this.pickup_item.reset_pickup();
		this.#resetPoint();
		this.score = [0, 0];

		/*const response = await fetch("http://localhost:8088");
		const json = await response.json();
		this.type = json.type;
		this.serverAddr = json.server_addr;
		console.log(json);*/
	}

	draw(ctx) {
		ctx.fillRect([0, 0], this.size, rgb("202830"));

		this.paddles[LEFT].drawDashHint(ctx, 0);
		this.paddles[RIGHT].drawDashHint(ctx, this.size[WIDTH] - PADDLE_SIZE[WIDTH]);
		if(this.draw_item)
			this.pickup_item.draw(ctx);
		this.ball.draw(ctx);

		this.paddles[LEFT].draw(ctx, 0);
		this.paddles[RIGHT].draw(ctx, this.size[WIDTH] - PADDLE_SIZE[WIDTH]);

		const centerX = this.size[WIDTH] / 2;
		const centerY = this.size[HEIGHT] / 2;
		const SCORE_Y = 60;
		const FONT = "50px Arial";

		ctx.fillText([centerX, SCORE_Y], ":", FONT, rgb("ffffff"), "center");

		const leftScorePos = [centerX - 15, SCORE_Y];
		ctx.fillText(leftScorePos, this.score[LEFT], FONT, rgb("ffffff"), "right");

		const rightScorePos = [centerX + 15, SCORE_Y];
		ctx.fillText(rightScorePos, this.score[RIGHT], FONT, rgb("ffffff"), "left");
		if (this.winner !== undefined)
			ctx.fillText(
				[centerX, centerY - 15],
				`Player ${this.winner.player} won`,
				FONT,
				rgb("ffffff"),
				"center",
			);
	}

	#hitPaddles(oldPaddleYs) {
		const ballAcceleration = 0.4;
		const SPIN_MULTIPLIER = 2;

		if(this.pickup_item.has_collision(this.ball.pos, RADIUS))
			// ... DO SOMETHING
			// this.ball.velocity = vmul(this.ball.velocity, [1.5, 1.5])
			this.ball.velocity[Y] *= 0.5;


		if (
			this.ball.pos[X] - BALL_RADIUS <= PADDLE_SIZE[WIDTH] &&
			this.ball.pos[Y] - BALL_RADIUS < this.paddles[LEFT].y + PADDLE_SIZE[HEIGHT] &&
			this.ball.pos[Y] + BALL_RADIUS > this.paddles[LEFT].y &&
			this.ball.velocity[X] < 0
		) {
			this.hitSound.volume = Math.max(this.paddles[LEFT].powershotness, 0.1);
			this.hitSound.play();
			this.ball.spin -= SPIN_MULTIPLIER * Math.sign(this.paddles[LEFT].y - oldPaddleYs[LEFT]);
			this.ball.velocity = [
				-this.ball.velocity[X] + ballAcceleration + this.paddles[LEFT].powershotness * 1.5,
				this.ball.velocity[Y],
			];
			this.paddles[LEFT].shakeness = 0.3 + this.paddles[LEFT].powershotness;
			this.paddles[LEFT].powershotness = 0;
		}
		if (
			this.ball.pos[X] + BALL_RADIUS >= this.size[WIDTH] - PADDLE_SIZE[WIDTH] &&
			this.ball.pos[Y] - BALL_RADIUS < this.paddles[RIGHT].y + PADDLE_SIZE[HEIGHT] &&
			this.ball.pos[Y] + BALL_RADIUS > this.paddles[RIGHT].y &&
			this.ball.velocity[X] > 0
		) {
			this.hitSound.volume = Math.max(this.paddles[RIGHT].powershotness, 0.1);
			this.hitSound.play();
			this.ball.spin -= SPIN_MULTIPLIER * Math.sign(this.paddles[RIGHT].y - oldPaddleYs[RIGHT]);
			this.ball.velocity = [
				-this.ball.velocity[X] - ballAcceleration - this.paddles[RIGHT].powershotness * 1.5,
				this.ball.velocity[Y],
			];
			this.paddles[RIGHT].shakeness = 0.3 + this.paddles[RIGHT].powershotness;
			this.paddles[RIGHT].powershotness = 0;
		}
	}

	#checkGameState() {
		if (this.ball.pos[X] > this.size[WIDTH]) {
			this.score = vadd(this.score, [1, 0]);
			if (this.score[LEFT] >= WIN_SCORE && this.score[LEFT] - this.score[RIGHT] >= WIN_MARGIN) {
				this.#reset();
				// left player won
				this.winner = { player: 1, timeLeft: 1000 };
			} else {
				this.#resetPoint();
			}
		} else if (this.ball.pos[X] < 0) {
			this.score = vadd(this.score, [0, 1]);
			if (this.score[RIGHT] >= WIN_SCORE && this.score[RIGHT] - this.score[LEFT] >= WIN_MARGIN) {
				// right player won
				this.#reset();
				this.winner = { player: 2, timeLeft: 1000 };
			} else {
				this.#resetPoint();
			}
		}

	}

	onKeyDown(key) {
		switch(key) {
		case "KeyA":
			this.paddles[LEFT].dash = true;
			break;
		case "KeyE":
			this.paddles[LEFT].toggleDashHint();
			break;
		case "ArrowRight":
			this.paddles[RIGHT].dash = true;
			break;
		case "Slash":
			this.paddles[RIGHT].toggleDashHint();
			break;
		default:
			break;
		}
	}

	update(pressedKeys, deltaTime) {
		const oldPaddleYs = this.paddles.map(p => p.y);

		this.paddles[LEFT].update(
			deltaTime,
			this.size[HEIGHT],
			pressedKeys.has("KeyS") - pressedKeys.has("KeyW"),
			pressedKeys.has("KeyD"),
			//pressedKeys.has("KeyA"),
		);
		this.paddles[RIGHT].update(
			deltaTime,
			this.size[HEIGHT],
			pressedKeys.has("ArrowDown") - pressedKeys.has("ArrowUp"),
			pressedKeys.has("ArrowLeft"),
			//pressedKeys.has("ArrowRight"),
		);

		this.ball.update(deltaTime, this.size[HEIGHT]);

		this.#checkGameState();

		this.#hitPaddles(oldPaddleYs);

		if (this.winner !== undefined) {
			this.winner.timeLeft -= deltaTime;
			if (this.winner.timeLeft <= 0)
				this.winner = undefined;
		}
	}
}

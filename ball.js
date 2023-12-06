import { zip } from "./util.js";
import { X, Y, vadd } from "./vector.js";
import { rgb, lerpColor } from "./colors.js";

export const RADIUS = 14;
const OLD_POSITION_COUNT = 10;

export class Ball {
	constructor() {
		this.oldPositionIndex = 0;
	}

	reset(pos) {
		this.pos = pos;

		const startAngle = Math.random() * 2 * Math.PI;
		this.velocity = [Math.cos(startAngle) / 2, Math.sin(startAngle) / 2];

		this.spin = 0;

		if (this.oldPositions === undefined)
			this.oldPositions = Array(OLD_POSITION_COUNT).fill(pos);
	}

	#hitTopAndBottom(height) {
		const WALL_VELOCITY_MULTIPLIER = 0.7;
		const WALL_SPIN_MULTIPLIER = 0.3;

		if (this.pos[Y] <= RADIUS && this.velocity[Y] < 0) {
			this.velocity = [
				this.velocity[X] - this.spin * WALL_VELOCITY_MULTIPLIER,
				-this.velocity[Y],
			];
			this.spin *= WALL_SPIN_MULTIPLIER;
		}
		if (this.pos[Y] >= height - RADIUS && this.velocity[Y] > 0) {
			this.velocity = [
				this.velocity[X] + this.spin * WALL_VELOCITY_MULTIPLIER,
				-this.velocity[Y],
			];
			this.spin *= WALL_SPIN_MULTIPLIER;
		}
	}

	update(deltaTime, height) {
		this.oldPositions[this.oldPositionIndex] = this.pos;
		this.oldPositionIndex = (this.oldPositionIndex + 1) % OLD_POSITION_COUNT;

		this.pos = vadd(this.pos, this.velocity.map(v => v * deltaTime));

		if (this.velocity[X] > 0 && this.velocity[X] < 0.3)
			this.velocity = [0.3, this.velocity[Y]];
		if (this.velocity[X] < 0 && this.velocity[X] > -0.3)
			this.velocity = [-0.3, this.velocity[Y]];

		this.#hitTopAndBottom(height);

		this.velocity = zip(this.velocity, [0, this.spin * 2]).map(
			([v, s]) => v - (deltaTime / 2000) * (v * Math.abs(v) - s),
		);
		this.spin -= (deltaTime / 200) * this.spin * 0.5 * Math.abs(this.spin);
	}

	draw(ctx) {
		for (let i = 0; i < OLD_POSITION_COUNT; i++) {
			const newness = (i + 1) / OLD_POSITION_COUNT;
			const color = lerpColor(rgb("202833"), rgb("ee8888"), newness);
			const positionIndex = (this.oldPositionIndex + i) % OLD_POSITION_COUNT;
			ctx.fillCircle(this.oldPositions[positionIndex], RADIUS, color);
		}

		ctx.fillCircle(this.pos, RADIUS, rgb("ffffff"));
	}
}

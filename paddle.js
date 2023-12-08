import { WIDTH, HEIGHT, vadd, vmul } from "./vector.js";
import { rgb, lerpColor } from "./colors.js";

const PIXELS_PER_MS = 0.5;
const DASH_AMOUNT = 300;
export const SIZE = [20, 110];

export class Paddle {
	constructor() {
		this.dashHintEnabled = true;
	}

	reset(y) {
		this.y = y;
		this.dashCooldown = 0;
		this.shakeness = 0;
		this.powershotness = 0;
		this.dashHintY = undefined;
		this.dashableBlinkTimeLeft = 0;
		this.dash = false;
	}

	toggleDashHint() {
		this.dashHintEnabled = !this.dashHintEnabled;
	}

	update(deltaTime, height, downness, chargePressed) {
		this.shakeness = Math.max(this.shakeness - deltaTime / 500, 0);
		this.dashableBlinkTimeLeft = Math.max(this.dashableBlinkTimeLeft - deltaTime, 0);
		if (this.dashCooldown > 0) {
			this.dashCooldown = Math.max(this.dashCooldown - deltaTime / 3000, 0);
			if (this.dashCooldown == 0)
				this.dashableBlinkTimeLeft = 80;
		}

		const maxPaddleY = height - SIZE[HEIGHT];
		function clampY(y) {
			return Math.min(Math.max(y, 0), maxPaddleY);
		}

		this.dashHintY = undefined;
		if (chargePressed) {
			this.powershotness = Math.min(this.powershotness + deltaTime * 0.0005, 1);
		} else {
			let deltaY = downness * deltaTime * PIXELS_PER_MS;
			if (this.dashCooldown == 0 && downness != 0) {
				if (this.dash) {
					deltaY = downness * DASH_AMOUNT;
					this.dashCooldown = 1;
					this.dash = false;
				} else {
					this.dashHintY = clampY(this.y + downness * DASH_AMOUNT);
				}
			}
			this.y = clampY(this.y + deltaY);
		}
	}

	drawDashHint(ctx, x) {
		if (this.dashHintEnabled && this.dashHintY !== undefined)
			ctx.fillRect([x, this.dashHintY], SIZE, rgb("606468"));
	}

	draw(ctx, x) {
		const shakeOffset = [0, 0].map(_ => (Math.random() - 0.5) * 30 * this.shakeness);

		if (this.dashCooldown > 0)
			ctx.strokeRect(
				vadd([x, this.y], shakeOffset),
				vmul(SIZE, [1, this.dashCooldown]),
				rgb("F28500"),
				10,
			);

		const color = this.dashableBlinkTimeLeft > 0 ? rgb("57B84A") :
			lerpColor(rgb("ffffff"), rgb("ff0000"), this.powershotness);
		ctx.fillRect(vadd([x, this.y], shakeOffset), SIZE, color);
	}
}

import { rgb } from "./colors.js";
import { X, Y, WIDTH, HEIGHT } from "./vector.js";


export class PickupItem {
    constructor() {
        this.reset_time = new Date().getTime() / 1000;
        this.cooldown_s = 10;
        this.size = [50, 50]
        this.pos = [(window.innerWidth  - this.size[WIDTH])/ 2, window.innerHeight / 2];
    }

    reset_pickup() {
        this.pos[Y] = Math.floor(Math.random() * (window.innerHeight - this.size[HEIGHT]));
    }

    has_collision(ball_pos, radius) {
        const distanceX = Math.abs(ball_pos[X] - (this.pos[X] + this.size[WIDTH] / 2));
        const distanceY = Math.abs(ball_pos[Y] - (this.pos[Y] + this.size[HEIGHT] / 2));
        if(distanceX <= radius + this.size[WIDTH] / 2 && distanceY <= radius + this.size[HEIGHT] / 2) {
            this.reset_pickup();
            return true;
        }
        return false
    }

    draw(ctx) {
		const color = rgb("008000");
        ctx.fillRect(this.pos, this.size, color);
	}
}

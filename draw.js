import { X, Y, WIDTH, HEIGHT } from "./vector.js";
import { R, G, B } from "./colors.js";

export default class Canvas {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d");
  }

  #setColor(color) {
    this.ctx.fillStyle =
      "rgba(" + color[R] + ", " + color[G] + ", " + color[B] + ", 1)";
  }
  #setStrokeColor(color) {
    this.ctx.strokeStyle =
      "rgba(" + color[R] + ", " + color[G] + ", " + color[B] + ", 1)";
  }

  fillRect(pos, size, color) {
    this.#setColor(color);
    this.ctx.fillRect(pos[X], pos[Y], size[WIDTH], size[HEIGHT]);
  }
  strokeRect(pos, size, color, thickness) {
    this.#setStrokeColor(color);
    this.ctx.beginPath();
    this.ctx.lineWidth = thickness;
    this.ctx.rect(pos[X], pos[Y], size[WIDTH], size[HEIGHT]);
    this.ctx.stroke();
  }

  fillCircle(pos, radius, color) {
    this.#setColor(color);
    this.ctx.beginPath();
    this.ctx.arc(pos[X], pos[Y], radius, 0, Math.PI * 2, false);
    this.ctx.fill();
  }

  fillText(pos, text, font, color, align = "left") {
    this.#setColor(color);
    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, pos[X], pos[Y]);
  }
}

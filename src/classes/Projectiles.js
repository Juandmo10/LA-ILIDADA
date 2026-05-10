import { canvas, globals } from '../utils/globals.js';

export class Proyectil {
    constructor(x, y, direccion) {
        this.x = x;
        this.y = y;
        this.w = 30;
        this.h = 15;
        this.velocidad = 12 * direccion;
        this.activo = true;
    }

    actualizar() {
        this.x += this.velocidad;
        if (this.x < 0 || this.x > canvas.width) this.activo = false;
    }

    dibujar(ctx) {
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 5, this.y + 2, this.w - 10, this.h - 4);
    }
}

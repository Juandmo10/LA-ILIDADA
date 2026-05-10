import { canvas, globals, ESTADOS, loadImageWithoutBg } from '../utils/globals.js';
import { particleSystem } from '../systems/Particles.js';

const imgSoldier = loadImageWithoutBg('/assets/soldier.png');
const imgHector = loadImageWithoutBg('/assets/hector.png');

export class EnemigoBase {
    constructor(velMultiplicador = 1) {
        this.w = 40;
        this.h = 60;
        this.x = canvas.width + 50; 
        this.y = globals.SUELO_Y - this.h;
        this.velocidad = 2 * velMultiplicador;
    }

    actualizar() {
        this.x -= this.velocidad; 
    }

    dibujar(ctx) {
        ctx.save();
        if (imgSoldier.complete && imgSoldier.naturalWidth > 0) {
            let drawW = 90, drawH = 90, offsetX = -25, offsetY = -30;
            ctx.translate(this.x, this.y);
            ctx.drawImage(imgSoldier, offsetX, offsetY, drawW, drawH);
        } else {
            ctx.fillStyle = '#8B0000'; 
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();
    }
}

export class Boss {
    constructor() {
        this.w = 80;
        this.h = 100; 
        this.x = canvas.width + 100;
        this.y = globals.SUELO_Y - this.h;
        this.vidas = 6;
        this.maxVidas = 6;
        this.velocidad = 2.0; 
        this.vy = 0;
        
        this.timerAtaque = 0;
        this.intervaloAtaque = 100; 
        this.atacando = false;
        this.duracionAtaque = 15; 
        this.faseAtaque = 0;
        
        this.invulnerable = false;
        this.timerInvulnerable = 0;
        this.direccion = -1; // -1 = Izquierda, 1 = Derecha
    }

    actualizar(jugadorX) {
        if (this.invulnerable) {
            this.timerInvulnerable--;
            if (this.timerInvulnerable <= 0) this.invulnerable = false;
        }

        if (!this.atacando) {
            if (this.x + this.w / 2 > jugadorX + 40) {
                this.x -= this.velocidad;
                this.direccion = -1;
            } else if (this.x + this.w / 2 < jugadorX - 40) {
                this.x += this.velocidad;
                this.direccion = 1;
            }

            this.timerAtaque++;
            // Rango para la lanza es mayor (~180px)
            if (this.timerAtaque >= this.intervaloAtaque && Math.abs((this.x + this.w/2) - jugadorX) < 180) {
                this.atacando = true;
                this.timerAtaque = 0;
                this.faseAtaque = this.duracionAtaque;
            }
        } else {
            this.faseAtaque--;
            if (this.faseAtaque <= 0) this.atacando = false;
        }

        this.vy += globals.GRAVEDAD;
        this.y += this.vy;
        if (this.y + this.h >= globals.SUELO_Y) {
            this.y = globals.SUELO_Y - this.h;
            this.vy = 0;
        }

        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
    }

    dibujar(ctx) {
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) return; 

        ctx.save();
        if (imgHector.complete && imgHector.naturalWidth > 0) {
            let drawW = 160, drawH = 160, offsetX = -40, offsetY = -60;
            if (this.direccion === 1) {
                ctx.translate(this.x + this.w, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(imgHector, offsetX, offsetY, drawW, drawH);
            } else {
                ctx.translate(this.x, this.y);
                ctx.drawImage(imgHector, offsetX, offsetY, drawW, drawH);
            }
        } else {
            ctx.fillStyle = '#4B0082'; 
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();

        if (this.atacando) { 
            // Dibuja una estocada de lanza
            ctx.fillStyle = 'rgba(255, 50, 50, 0.6)';
            let hitW = 180;
            let hitH = 20;
            let hitX = this.direccion === 1 ? this.x + this.w : this.x - hitW;
            let hitY = this.y + this.h / 2;
            
            ctx.fillRect(hitX, hitY, hitW, hitH);
        }
    }

    getHitboxAtaque() {
        if (!this.atacando) return null;
        let hitW = 180;
        let hitH = 40;
        return {
            x: this.direccion === 1 ? this.x + this.w : this.x - hitW,
            y: this.y + this.h / 2 - 10,
            w: hitW,
            h: hitH
        };
    }

    recibirDano() {
        if (this.invulnerable) return;
        this.vidas--;
        this.invulnerable = true;
        this.timerInvulnerable = 15; 
        particleSystem.addBlood(this.x + this.w/2, this.y + this.h/2);
        if (this.vidas <= 0) globals.estadoActual = ESTADOS.VICTORIA;
    }
}

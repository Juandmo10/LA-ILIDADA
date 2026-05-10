import { canvas, globals, teclas, ESTADOS, loadImageWithoutBg } from '../utils/globals.js';
import { Proyectil } from './Projectiles.js';
import { particleSystem } from '../systems/Particles.js';
import { playHit, playShoot, playJump } from '../systems/Audio.js';

const imgAquiles = loadImageWithoutBg('/assets/achilles.png');

export class Player {
    constructor() {
        this.w = 40;
        this.h = 60;
        this.x = canvas.width / 4;
        this.y = globals.SUELO_Y - this.h;
        this.vx = 0;
        this.vy = 0;
        this.velocidad = 5;
        this.fuerzaSalto = -14; 
        this.enSuelo = false;
        this.vidas = 3;
        this.direccion = 1; 
        
        this.invulnerable = false;
        this.timerInvulnerable = 0;
        
        this.atacando = false;
        this.timerAtaque = 0;
        this.duracionAtaque = 15;
        this.cooldownAtaque = 0;

        this.cooldownEspecial = 0;
        this.maxCooldownEspecial = 90; 
        
        this.isDashing = false;
        this.dashTimer = 0;
        this.cooldownDash = 0;

        this.ultimaTeclaEspacio = false;
        this.ultimaTeclaF = false;
        this.ultimaTeclaShift = false;
    }

    actualizar() {
        if (this.cooldownDash > 0) this.cooldownDash--;

        if (this.isDashing) {
            this.dashTimer--;
            this.vx = this.direccion * 15; // Velocidad extrema
            this.x += this.vx;
            particleSystem.addDust(this.x + this.w/2, this.y + this.h);
            if (this.dashTimer <= 0) this.isDashing = false;
        } else {
            this.vx = 0;
            if (teclas['ArrowLeft'] || teclas['a']) { this.vx = -this.velocidad; this.direccion = -1; }
            if (teclas['ArrowRight'] || teclas['d']) { this.vx = this.velocidad; this.direccion = 1; }
            this.x += this.vx;
            if (this.vx !== 0 && this.enSuelo && Math.random() < 0.1) {
                particleSystem.addDust(this.x + this.w/2, this.y + this.h);
            }
            
            // Trigger Dash
            if (teclas['Shift'] && !this.ultimaTeclaShift && this.cooldownDash <= 0) {
                this.isDashing = true;
                this.dashTimer = 15;
                this.cooldownDash = 120; // 2 segundos
                playJump(); // Sonido rápido temporal
            }
        }
        this.ultimaTeclaShift = teclas['Shift'];

        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        if ((teclas['ArrowUp'] || teclas['w']) && this.enSuelo && !this.isDashing) {
            this.vy = this.fuerzaSalto;
            this.enSuelo = false;
            playJump();
            particleSystem.addDust(this.x + this.w/2, this.y + this.h);
        }

        this.vy += globals.GRAVEDAD;
        this.y += this.vy;

        if (this.y + this.h >= globals.SUELO_Y) {
            this.y = globals.SUELO_Y - this.h;
            this.vy = 0;
            this.enSuelo = true;
        } else {
            this.enSuelo = false;
        }

        if (this.invulnerable) {
            this.timerInvulnerable--;
            if (this.timerInvulnerable <= 0) this.invulnerable = false;
        }

        if (this.cooldownAtaque > 0) this.cooldownAtaque--;
        if (this.atacando) {
            this.timerAtaque--;
            if (this.timerAtaque <= 0) this.atacando = false;
        } else if (teclas[' '] && !this.ultimaTeclaEspacio && this.cooldownAtaque <= 0) {
            this.atacando = true;
            this.timerAtaque = this.duracionAtaque;
            this.cooldownAtaque = 25; 
            playHit(); // Espadazo sound
        }
        this.ultimaTeclaEspacio = teclas[' '];

        if (this.cooldownEspecial > 0) this.cooldownEspecial--;
        if (teclas['f'] && !this.ultimaTeclaF && this.cooldownEspecial <= 0) {
            globals.proyectiles.push(new Proyectil(
                this.x + (this.direccion === 1 ? this.w : -20), 
                this.y + this.h / 2 - 10, 
                this.direccion
            ));
            playShoot();
            this.cooldownEspecial = this.maxCooldownEspecial;
        }
        this.ultimaTeclaF = teclas['f'];
    }

    dibujar(ctx) {
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) return;

        ctx.save();
        if (imgAquiles.complete && imgAquiles.naturalWidth > 0) {
            let drawW = 100, drawH = 100, offsetX = -30, offsetY = -40;
            if (this.direccion === -1) {
                ctx.translate(this.x + this.w, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(imgAquiles, offsetX, offsetY, drawW, drawH);
            } else {
                ctx.translate(this.x, this.y);
                ctx.drawImage(imgAquiles, offsetX, offsetY, drawW, drawH);
            }
        } else {
            let px = this.x, py = this.y;
            ctx.fillStyle = 'darkred';
            if (this.direccion === 1) {
                ctx.fillRect(px - 15, py + 10, 20, this.h - 10);
            } else {
                ctx.fillRect(px + this.w - 5, py + 10, 20, this.h - 10);
            }
            ctx.fillStyle = '#D4AF37'; 
            ctx.fillRect(px, py, this.w, this.h);
            ctx.fillRect(px + 5, py - 15, this.w - 10, 20);
            ctx.fillStyle = 'red';
            ctx.fillRect(px + 10, py - 25, this.w - 20, 10);
        }
        ctx.restore();

        if (this.atacando) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            let radio = 50;
            if (this.direccion === 1) {
                ctx.arc(this.x + this.w, this.y + this.h/2, radio, -Math.PI/2, Math.PI/2);
            } else {
                ctx.arc(this.x, this.y + this.h/2, radio, Math.PI/2, Math.PI*1.5);
            }
            ctx.fill();
        }
    }

    getHitboxAtaque() {
        if (!this.atacando) return null;
        return {
            x: this.direccion === 1 ? this.x + this.w : this.x - 50,
            y: this.y,
            w: 50,
            h: this.h
        };
    }

    recibirDano(direccionEmpuje) {
        if (this.invulnerable || this.isDashing) return;
        this.vidas--;
        this.invulnerable = true;
        this.timerInvulnerable = 60; 
        
        this.vy = -6;
        this.vx = direccionEmpuje * 12;
        this.x += this.vx;
        particleSystem.addBlood(this.x + this.w/2, this.y + this.h/2);

        if (this.vidas <= 0) globals.estadoActual = ESTADOS.GAME_OVER;
    }
}

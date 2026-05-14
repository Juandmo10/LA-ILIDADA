import { canvas, globals, ESTADOS, loadImageWithoutBg } from '../utils/globals.js';
import { Proyectil } from './Projectiles.js';
import { particleSystem } from '../systems/Particles.js';
import { playHit, playShoot, playJump } from '../systems/Audio.js';

const imgAquiles = loadImageWithoutBg('./assets/achilles.png');
const imgHector  = loadImageWithoutBg('./assets/hector.png');

export class PlayerPvP {
    /**
     * @param {object} opts
     * @param {number} opts.startX  - posición inicial X
     * @param {number} opts.dir     - dirección inicial (1 = derecha, -1 = izquierda)
     * @param {string} opts.sprite  - 'achilles' | 'hector'
     * @param {object} opts.keys    - mapa de acciones a teclas
     *   { left, right, up, attack, shoot, dash }
     * @param {string} opts.color   - color de la barra de vida / HUD
     * @param {string} opts.name    - nombre del jugador
     * @param {number} opts.playerIndex - 0 o 1
     */
    constructor(opts) {
        this.w = 40;
        this.h = 60;
        this.x = opts.startX;
        this.y = globals.SUELO_Y - this.h;
        this.vx = 0;
        this.vy = 0;
        this.velocidad = 5;
        this.fuerzaSalto = -14;
        this.enSuelo = false;
        this.vidas = 5;
        this.maxVidas = 5;
        this.direccion = opts.dir;
        this.sprite = opts.sprite;
        this.keys = opts.keys;
        this.color = opts.color || '#D4AF37';
        this.name = opts.name || 'Player';
        this.playerIndex = opts.playerIndex || 0;

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

        // Teclas anteriores (para detectar flancos)
        this._prevKeys = {};
        for (const k of Object.values(opts.keys)) this._prevKeys[k] = false;

        // Proyectiles propios
        this.proyectiles = [];
    }

    _pressed(action, teclas) {
        return teclas[this.keys[action]] === true;
    }
    _justPressed(action, teclas) {
        const k = this.keys[action];
        return teclas[k] === true && !this._prevKeys[k];
    }
    _updatePrev(teclas) {
        for (const k of Object.values(this.keys)) {
            this._prevKeys[k] = teclas[k] === true;
        }
    }

    actualizar(teclas, otroJugador) {
        if (this.cooldownDash > 0) this.cooldownDash--;

        if (this.isDashing) {
            this.dashTimer--;
            this.vx = this.direccion * 15;
            this.x += this.vx;
            particleSystem.addDust(this.x + this.w / 2, this.y + this.h);
            if (this.dashTimer <= 0) this.isDashing = false;
        } else {
            this.vx = 0;
            if (this._pressed('left', teclas))  { this.vx = -this.velocidad; this.direccion = -1; }
            if (this._pressed('right', teclas)) { this.vx =  this.velocidad; this.direccion =  1; }
            this.x += this.vx;
            if (this.vx !== 0 && this.enSuelo && Math.random() < 0.1) {
                particleSystem.addDust(this.x + this.w / 2, this.y + this.h);
            }

            if (this._justPressed('dash', teclas) && this.cooldownDash <= 0) {
                this.isDashing = true;
                this.dashTimer = 15;
                this.cooldownDash = 120;
                playJump();
            }
        }

        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        if (this._pressed('up', teclas) && this.enSuelo && !this.isDashing) {
            this.vy = this.fuerzaSalto;
            this.enSuelo = false;
            playJump();
            particleSystem.addDust(this.x + this.w / 2, this.y + this.h);
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

        // Mirar al rival cuando no hay movimiento horizontal (antes de ataque/disparo para que apunten bien).
        if (otroJugador && this.vx === 0 && !this.isDashing) {
            this.direccion = otroJugador.x > this.x ? 1 : -1;
        }

        if (this.invulnerable) {
            this.timerInvulnerable--;
            if (this.timerInvulnerable <= 0) this.invulnerable = false;
        }

        // Ataque melee
        if (this.cooldownAtaque > 0) this.cooldownAtaque--;
        if (this.atacando) {
            this.timerAtaque--;
            if (this.timerAtaque <= 0) this.atacando = false;
        } else if (this._justPressed('attack', teclas) && this.cooldownAtaque <= 0) {
            this.atacando = true;
            this.timerAtaque = this.duracionAtaque;
            this.cooldownAtaque = 25;
            playHit();
        }

        // Disparo
        if (this.cooldownEspecial > 0) this.cooldownEspecial--;
        if (this._justPressed('shoot', teclas) && this.cooldownEspecial <= 0) {
            this.proyectiles.push(new Proyectil(
                this.x + (this.direccion === 1 ? this.w : -20),
                this.y + this.h / 2 - 10,
                this.direccion
            ));
            playShoot();
            this.cooldownEspecial = this.maxCooldownEspecial;
        }

        // Actualizar proyectiles propios
        for (let i = this.proyectiles.length - 1; i >= 0; i--) {
            this.proyectiles[i].actualizar();
            particleSystem.addFire(this.proyectiles[i].x, this.proyectiles[i].y);
            if (!this.proyectiles[i].activo) this.proyectiles.splice(i, 1);
        }

        this._updatePrev(teclas);
    }

    dibujar(ctx) {
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) return;

        const img = this.sprite === 'hector' ? imgHector : imgAquiles;
        ctx.save();
        if (img.complete && img.naturalWidth > 0) {
            let drawW = this.sprite === 'hector' ? 160 : 100;
            let drawH = this.sprite === 'hector' ? 160 : 100;
            let offsetX = this.sprite === 'hector' ? -40 : -30;
            let offsetY = this.sprite === 'hector' ? -60 : -40;
            if (this.direccion === -1) {
                ctx.translate(this.x + this.w, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
            } else {
                ctx.translate(this.x, this.y);
                ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
            }
        } else {
            ctx.fillStyle = this.sprite === 'hector' ? '#4B0082' : '#D4AF37';
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();

        if (this.atacando) {
            ctx.fillStyle = this.sprite === 'hector' ? 'rgba(180,50,255,0.5)' : 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            let radio = 50;
            if (this.direccion === 1) {
                ctx.arc(this.x + this.w, this.y + this.h / 2, radio, -Math.PI / 2, Math.PI / 2);
            } else {
                ctx.arc(this.x, this.y + this.h / 2, radio, Math.PI / 2, Math.PI * 1.5);
            }
            ctx.fill();
        }

        // Dibujar proyectiles propios
        for (const p of this.proyectiles) {
            p.dibujar(ctx);
        }

        // Etiqueta sobre la cabeza
        ctx.save();
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(this.name, this.x + this.w / 2, this.y - 8);
        ctx.restore();
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
        this.timerInvulnerable = 80;
        this.vy = -6;
        this.vx = direccionEmpuje * 12;
        this.x += this.vx;
        particleSystem.addBlood(this.x + this.w / 2, this.y + this.h / 2);
    }
}

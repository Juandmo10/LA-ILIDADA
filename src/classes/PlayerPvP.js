import { canvas, globals, loadImageWithoutBg } from '../utils/globals.js';
import { Proyectil } from './Projectiles.js';
import { particleSystem } from '../systems/Particles.js';
import { playHit, playShoot, playJump } from '../systems/Audio.js';

const imgAquiles = loadImageWithoutBg('./assets/achilles.png');
const imgHector = loadImageWithoutBg('./assets/hector.png');

/**
 * Orientación en el PNG del proyecto:
 * - achilles: mira a la derecha en el archivo → espejo cuando mira a la izquierda (direccion -1).
 * - hector: mira a la izquierda en el archivo (mismo criterio que el Boss en historia) → espejo cuando mira a la derecha (direccion 1).
 */
function debeEspejarSpritePvP(sprite, direccion) {
    if (sprite === 'hector') return direccion === 1;
    return direccion === -1;
}

/** Hitbox PvP: el borde inferior es el “suelo” del personaje. */
const PVP_HITBOX_H = 60;
/** Corrección si el PNG deja aire bajo los pies (baja el dibujo hacia el suelo del canvas). */
const PVP_PIES_SUELO = 14;

function obtenerSpritePvP(sprite) {
    if (sprite === 'hector') {
        const drawW = 160;
        const drawH = 160;
        return {
            img: imgHector,
            drawW,
            drawH,
            offsetX: -40,
            offsetY: PVP_HITBOX_H - drawH + PVP_PIES_SUELO,
        };
    }
    const drawW = 100;
    const drawH = 100;
    return {
        img: imgAquiles,
        drawW,
        drawH,
        offsetX: -30,
        offsetY: PVP_HITBOX_H - drawH + PVP_PIES_SUELO,
    };
}

export class PlayerPvP {
    /**
     * @param {object} opts
     * @param {number} opts.startX
     * @param {number} opts.dir     - 1 = derecha, -1 = izquierda
     * @param {string} opts.sprite  - 'achilles' | 'hector'
     * @param {object} opts.keys
     * @param {string} opts.color
     * @param {string} opts.name
     * @param {number} opts.playerIndex
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

        this._prevKeys = {};
        for (const k of Object.values(opts.keys)) this._prevKeys[k] = false;

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

        if (otroJugador && this.vx === 0 && !this.isDashing) {
            this.direccion = otroJugador.x > this.x ? 1 : -1;
        }

        if (this.invulnerable) {
            this.timerInvulnerable--;
            if (this.timerInvulnerable <= 0) this.invulnerable = false;
        }

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

        for (let i = this.proyectiles.length - 1; i >= 0; i--) {
            this.proyectiles[i].actualizar();
            particleSystem.addFire(this.proyectiles[i].x, this.proyectiles[i].y);
            if (!this.proyectiles[i].activo) this.proyectiles.splice(i, 1);
        }

        this._updatePrev(teclas);
    }

    dibujar(ctx) {
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) return;

        const { img, drawW, drawH, offsetX, offsetY } = obtenerSpritePvP(this.sprite);

        ctx.save();
        if (img.complete && img.width > 0 && img.height > 0) {
            if (debeEspejarSpritePvP(this.sprite, this.direccion)) {
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
            ctx.fillStyle = this.sprite === 'hector'
                ? 'rgba(180, 50, 255, 0.45)'
                : 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            const radio = 50;
            if (this.direccion === 1) {
                ctx.arc(this.x + this.w, this.y + this.h / 2, radio, -Math.PI / 2, Math.PI / 2);
            } else {
                ctx.arc(this.x, this.y + this.h / 2, radio, Math.PI / 2, Math.PI * 1.5);
            }
            ctx.fill();
        }

        for (const p of this.proyectiles) {
            p.dibujar(ctx);
        }

        ctx.save();
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        // Centro horizontal del sprite en pantalla (corrige espejo respecto al borde derecho del hitbox).
        const cx = this.x + offsetX + drawW / 2;
        const nameX = debeEspejarSpritePvP(this.sprite, this.direccion)
            ? 2 * (this.x + this.w) - cx
            : cx;
        const nameY = this.y + offsetY - 10;
        ctx.fillText(this.name, nameX, nameY);
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

    /**
     * @param {number} direccionEmpuje -1 empuja a la izquierda, +1 a la derecha
     */
    recibirDano(direccionEmpuje) {
        if (this.invulnerable || this.isDashing) return;
        this.vidas--;
        this.invulnerable = true;
        this.timerInvulnerable = 80;
        this.vy = -6;
        const d = direccionEmpuje === 0 ? 1 : Math.sign(direccionEmpuje);
        this.vx = d * 12;
        this.x += this.vx;
        particleSystem.addBlood(this.x + this.w / 2, this.y + this.h / 2);
    }
}

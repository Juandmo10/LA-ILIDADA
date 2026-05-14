import { canvas, ctx, globals, ESTADOS, teclas, PVP_KEYS_P1, PVP_KEYS_P2, checkColision } from './utils/globals.js';
import { Player } from './classes/Player.js';
import { PlayerPvP } from './classes/PlayerPvP.js';
import { EnemigoBase, Boss } from './classes/Enemies.js';
import { particleSystem } from './systems/Particles.js';
import { playThunder } from './systems/Audio.js';

// --- UI DOM Elements ---
const screens = {
    [ESTADOS.PANTALLA_INICIO]:    document.getElementById('screen-inicio'),
    [ESTADOS.PANTALLA_LORE]:      document.getElementById('screen-lore'),
    [ESTADOS.SELECCION_MODO]:     document.getElementById('screen-modo'),
    [ESTADOS.SELECCION_ESCENARIO]:document.getElementById('screen-seleccion'),
    [ESTADOS.CONTROLES_PVP]:      document.getElementById('screen-controles-pvp'),
    [ESTADOS.JUEGO_PRINCIPAL]:    document.getElementById('hud'),
    [ESTADOS.JUEGO_PVP]:          document.getElementById('hud-pvp'),
    [ESTADOS.GAME_OVER]:          document.getElementById('screen-gameover'),
    [ESTADOS.VICTORIA]:           document.getElementById('screen-victoria'),
    [ESTADOS.VICTORIA_PVP]:       document.getElementById('screen-victoria-pvp'),
};

const heartsContainer  = document.getElementById('hearts-container');
const levelProgress    = document.getElementById('level-progress');
const bossHpWrapper    = document.getElementById('boss-hp-wrapper');
const bossHpFill       = document.getElementById('boss-hp-fill');
const fuegoStatus      = document.getElementById('fuego-status');
const loreContent      = document.getElementById('lore-content');
const pvpWinnerText    = document.getElementById('pvp-winner-text');

// --- ASSETS ---
const imgBackgroundCosta = new Image(); imgBackgroundCosta.src = './assets/bg.png';
const imgBackgroundRuins = new Image(); imgBackgroundRuins.src = './assets/ruins.png';
const imgBackgroundArena = new Image(); imgBackgroundArena.src = './assets/arena.png';

let ultimaTeclaEnter = false;
let introScrollY = 0;
let spawnRate = 120;
let timerGeneracion = 0;
let cooldownRayo = 0;
const MAX_COOLDOWN_RAYO = 600;
let showRayoEffect = 0;
let ultimaTeclaE = false;

// --- Escenario pendiente para PvP (seleccionado en pantalla-seleccion) ---
let escenarioPendiente = 1;

// ─────────────────────────────────────────────
// UPDATE UI
// ─────────────────────────────────────────────
function updateUI() {
    Object.values(screens).forEach(s => { if (s) s.classList.add('hidden'); });
    if (screens[globals.estadoActual]) screens[globals.estadoActual].classList.remove('hidden');

    // HUD Historia
    if (globals.estadoActual === ESTADOS.JUEGO_PRINCIPAL) {
        heartsContainer.innerHTML = '';
        for (let i = 0; i < globals.jugador.vidas; i++) {
            let img = document.createElement('img');
            img.src = './assets/heart.png';
            heartsContainer.appendChild(img);
        }
        if (!globals.bossActivo) {
            bossHpWrapper.classList.add('hidden');
            levelProgress.classList.remove('hidden');
            let n = globals.escenarioSeleccionado === 1 ? 'COSTA' : (globals.escenarioSeleccionado === 2 ? 'RUINAS' : 'ARENA NOCTURNA');
            levelProgress.textContent = `Nivel ${globals.escenarioSeleccionado} (${n}) - Progreso: ${globals.enemigosMuertos}/${globals.enemigosTotalNivel}`;
        } else {
            bossHpWrapper.classList.remove('hidden');
            levelProgress.classList.add('hidden');
            if (globals.boss) bossHpFill.style.width = Math.max(0, (globals.boss.vidas / globals.boss.maxVidas) * 100) + '%';
        }
        if (globals.jugador.cooldownEspecial <= 0) {
            fuegoStatus.textContent = 'Fuego [F]: LISTO'; fuegoStatus.style.color = '#FF4500';
        } else {
            fuegoStatus.textContent = 'Fuego [F]: RECARGANDO'; fuegoStatus.style.color = 'gray';
        }
        const dashStatus = document.getElementById('dash-status');
        if (globals.jugador.cooldownDash <= 0) {
            dashStatus.textContent = 'Dash [SHIFT]: LISTO'; dashStatus.style.color = '#87CEEB';
        } else {
            dashStatus.textContent = 'Dash [SHIFT]: RECARGANDO'; dashStatus.style.color = 'gray';
        }
        const rayoStatus = document.getElementById('rayo-status');
        if (cooldownRayo <= 0) {
            rayoStatus.textContent = 'Rayo de Zeus [E]: LISTO'; rayoStatus.style.color = '#FFD700';
        } else {
            rayoStatus.textContent = 'Rayo de Zeus [E]: RECARGANDO'; rayoStatus.style.color = 'gray';
        }
    }

    // HUD PvP
    if (globals.estadoActual === ESTADOS.JUEGO_PVP) {
        const p1 = globals.jugador;
        const p2 = globals.jugador2;
        if (p1 && p2) {
            // Barras de vida
            const p1BarFill = document.getElementById('pvp-p1-bar-fill');
            const p2BarFill = document.getElementById('pvp-p2-bar-fill');
            if (p1BarFill) p1BarFill.style.width = Math.max(0, (p1.vidas / p1.maxVidas) * 100) + '%';
            if (p2BarFill) p2BarFill.style.width = Math.max(0, (p2.vidas / p2.maxVidas) * 100) + '%';

            // Cooldowns P1
            const p1Shoot = document.getElementById('pvp-p1-shoot');
            const p1Dash  = document.getElementById('pvp-p1-dash');
            if (p1Shoot) { p1Shoot.textContent = p1.cooldownEspecial <= 0 ? '🔥 LISTO' : '🔥 RECARG.'; p1Shoot.style.color = p1.cooldownEspecial <= 0 ? '#FF4500' : 'gray'; }
            if (p1Dash)  { p1Dash.textContent  = p1.cooldownDash  <= 0 ? '💨 LISTO' : '💨 RECARG.'; p1Dash.style.color  = p1.cooldownDash  <= 0 ? '#87CEEB' : 'gray'; }

            // Cooldowns P2
            const p2Shoot = document.getElementById('pvp-p2-shoot');
            const p2Dash  = document.getElementById('pvp-p2-dash');
            if (p2Shoot) { p2Shoot.textContent = p2.cooldownEspecial <= 0 ? '🔥 LISTO' : '🔥 RECARG.'; p2Shoot.style.color = p2.cooldownEspecial <= 0 ? '#8A2BE2' : 'gray'; }
            if (p2Dash)  { p2Dash.textContent  = p2.cooldownDash  <= 0 ? '💨 LISTO' : '💨 RECARG.'; p2Dash.style.color  = p2.cooldownDash  <= 0 ? '#87CEEB' : 'gray'; }
        }
    }
}

// ─────────────────────────────────────────────
// INICIAR NIVEL HISTORIA
// ─────────────────────────────────────────────
function iniciarNivel(escenario) {
    globals.modoPvP = false;
    globals.escenarioSeleccionado = escenario;
    globals.jugador = new Player();
    globals.enemigos = [];
    globals.proyectiles = [];
    globals.boss = null;
    globals.enemigosGenerados = 0;
    globals.enemigosMuertos = 0;
    globals.bossActivo = false;
    cooldownRayo = 0;
    showRayoEffect = 0;
    if (escenario === 1) spawnRate = 120;
    else if (escenario === 2) spawnRate = 90;
    else spawnRate = 60;
    globals.estadoActual = ESTADOS.JUEGO_PRINCIPAL;
    updateUI();
}

// ─────────────────────────────────────────────
// INICIAR PVP
// ─────────────────────────────────────────────
function iniciarPvP(escenario) {
    globals.modoPvP = true;
    globals.escenarioSeleccionado = escenario;
    globals.enemigos = [];
    globals.proyectiles = [];
    globals.boss = null;
    globals.bossActivo = false;
    particleSystem.clear();

    globals.jugador = new PlayerPvP({
        startX: canvas.width * 0.25,
        dir: 1,
        sprite: 'achilles',
        keys: PVP_KEYS_P1,
        color: '#D4AF37',
        name: 'AQUILES',
        playerIndex: 0,
    });
    globals.jugador2 = new PlayerPvP({
        startX: canvas.width * 0.65,
        dir: -1,
        sprite: 'hector',
        keys: PVP_KEYS_P2,
        color: '#8A2BE2',
        name: 'HÉCTOR',
        playerIndex: 1,
    });

    globals.estadoActual = ESTADOS.JUEGO_PVP;
    updateUI();
}

// ─────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    globals.SUELO_Y = canvas.height - 150;
    introScrollY = canvas.height;
    if (globals.jugador) {
        if (globals.modoPvP && globals.estadoActual === ESTADOS.JUEGO_PVP) {
            globals.jugador.x = Math.max(0, Math.min(canvas.width - globals.jugador.w, globals.jugador.x));
        }
        if (globals.jugador.y + globals.jugador.h > globals.SUELO_Y) {
            globals.jugador.y = globals.SUELO_Y - globals.jugador.h;
            globals.jugador.vy = 0;
            globals.jugador.enSuelo = true;
        }
    }
    if (globals.jugador2) {
        if (globals.modoPvP && globals.estadoActual === ESTADOS.JUEGO_PVP) {
            globals.jugador2.x = Math.max(0, Math.min(canvas.width - globals.jugador2.w, globals.jugador2.x));
        }
        if (globals.jugador2.y + globals.jugador2.h > globals.SUELO_Y) {
            globals.jugador2.y = globals.SUELO_Y - globals.jugador2.h;
            globals.jugador2.vy = 0;
            globals.jugador2.enSuelo = true;
        }
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─────────────────────────────────────────────
// TECLAS GLOBALES (incl. códigos físicos para PvP: ; y Shift con teclados mixtos)
// ─────────────────────────────────────────────
function applyPhysicalKeyState(e, pressed) {
    if (e.code === 'Semicolon' && Object.prototype.hasOwnProperty.call(teclas, ';')) {
        teclas[';'] = pressed;
        if (pressed) e.preventDefault();
        return true;
    }
    if (e.code === 'Space' && Object.prototype.hasOwnProperty.call(teclas, ' ')) {
        teclas[' '] = pressed;
        if (pressed) e.preventDefault();
        return true;
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (pressed) teclas['Shift'] = true;
        else teclas['Shift'] = e.getModifierState('Shift');
        if (pressed) e.preventDefault();
        return true;
    }
    return false;
}

window.addEventListener('keydown', (e) => {
    if (applyPhysicalKeyState(e, true)) return;
    let k = e.key === ' ' ? ' ' : (e.key === 'Enter' ? 'Enter' : (e.key.length === 1 ? e.key.toLowerCase() : e.key));
    if (teclas.hasOwnProperty(k)) { teclas[k] = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
    if (applyPhysicalKeyState(e, false)) return;
    let k = e.key === ' ' ? ' ' : (e.key === 'Enter' ? 'Enter' : (e.key.length === 1 ? e.key.toLowerCase() : e.key));
    if (teclas.hasOwnProperty(k)) { teclas[k] = false; }
});

window.addEventListener('blur', () => {
    for (const k of Object.keys(teclas)) teclas[k] = false;
});

// ─────────────────────────────────────────────
// UI BOTONES
// ─────────────────────────────────────────────
// Modo Historia
document.getElementById('btn-modo-historia').addEventListener('click', () => {
    globals.modoPvP = false;
    globals.estadoActual = ESTADOS.SELECCION_ESCENARIO;
    updateUI();
});

// Modo PvP
document.getElementById('btn-modo-pvp').addEventListener('click', () => {
    globals.modoPvP = true;
    globals.estadoActual = ESTADOS.SELECCION_ESCENARIO;
    updateUI();
});

// Escenarios (historia y PvP comparten pantalla de selección)
document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const raw = e.currentTarget?.dataset?.esc;
        const n = parseInt(raw, 10);
        escenarioPendiente = Number.isFinite(n) && n >= 1 && n <= 3 ? n : 1;
        if (globals.modoPvP) {
            globals.estadoActual = ESTADOS.CONTROLES_PVP;
            updateUI();
        } else {
            iniciarNivel(escenarioPendiente);
        }
    });
});

// Botón Jugar desde pantalla de controles PvP
document.getElementById('btn-iniciar-pvp').addEventListener('click', () => {
    iniciarPvP(escenarioPendiente);
});

// Restarts
document.getElementById('btn-restart-go').addEventListener('click', () => { globals.estadoActual = ESTADOS.PANTALLA_INICIO; updateUI(); });
document.getElementById('btn-restart-vic').addEventListener('click', () => { globals.estadoActual = ESTADOS.PANTALLA_INICIO; updateUI(); });
document.getElementById('btn-restart-pvp-vic').addEventListener('click', () => { globals.estadoActual = ESTADOS.PANTALLA_INICIO; updateUI(); });

// Fullscreen
const btnFullscreen = document.getElementById('btnFullscreen');
btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err.message));
    } else {
        document.exitFullscreen();
    }
});

// ─────────────────────────────────────────────
// DIBUJAR FONDO
// ─────────────────────────────────────────────
function dibujarFondo() {
    if (globals.escenarioSeleccionado === 1) {
        if (imgBackgroundCosta.complete && imgBackgroundCosta.naturalWidth > 0) {
            ctx.drawImage(imgBackgroundCosta, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else if (globals.escenarioSeleccionado === 2) {
        if (imgBackgroundRuins.complete && imgBackgroundRuins.naturalWidth > 0) {
            ctx.drawImage(imgBackgroundRuins, 0, 0, canvas.width, canvas.height);
        }
    } else if (globals.escenarioSeleccionado === 3) {
        if (imgBackgroundArena.complete && imgBackgroundArena.naturalWidth > 0) {
            ctx.drawImage(imgBackgroundArena, 0, 0, canvas.width, canvas.height);
        }
    }
    ctx.fillStyle = globals.escenarioSeleccionado === 3 ? '#0B0C10' : '#4A3B2C';
    ctx.fillRect(0, globals.SUELO_Y, canvas.width, canvas.height - globals.SUELO_Y);
    ctx.fillStyle = globals.escenarioSeleccionado === 3 ? '#000' : '#2A1F16';
    ctx.fillRect(0, globals.SUELO_Y + 15, canvas.width, canvas.height - globals.SUELO_Y - 15);
}

// ─────────────────────────────────────────────
// GAME LOOP PVP
// ─────────────────────────────────────────────
function loopPvP() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dibujarFondo();

    const p1 = globals.jugador;
    const p2 = globals.jugador2;
    if (!p1 || !p2) return;

    p1.actualizar(teclas, p2);
    p2.actualizar(teclas, p1);

    // Verificar colisiones entre jugadores (melee y proyectiles)
    // P1 golpea a P2
    const h1 = p1.getHitboxAtaque();
    if (h1 && checkColision(h1, p2)) {
        p2.recibirDano(p1.x > p2.x ? -1 : 1);
    }
    // P2 golpea a P1
    const h2 = p2.getHitboxAtaque();
    if (h2 && checkColision(h2, p1)) {
        p1.recibirDano(p2.x > p1.x ? -1 : 1);
    }
    // Proyectiles P1 → P2
    for (let i = p1.proyectiles.length - 1; i >= 0; i--) {
        if (checkColision(p1.proyectiles[i], p2)) {
            p1.proyectiles[i].activo = false;
            particleSystem.addBlood(p2.x, p2.y + p2.h / 2);
            p2.recibirDano(1);
        }
    }
    // Proyectiles P2 → P1
    for (let i = p2.proyectiles.length - 1; i >= 0; i--) {
        if (checkColision(p2.proyectiles[i], p1)) {
            p2.proyectiles[i].activo = false;
            particleSystem.addBlood(p1.x, p1.y + p1.h / 2);
            p1.recibirDano(-1);
        }
    }

    p2.dibujar(ctx);
    p1.dibujar(ctx);

    particleSystem.update();
    particleSystem.draw(ctx);

    // Comprobar fin de partida
    if (p1.vidas <= 0 || p2.vidas <= 0) {
        const winner = p1.vidas <= 0 ? p2.name : p1.name;
        if (pvpWinnerText) pvpWinnerText.textContent = `¡${winner} GANA!`;
        globals.estadoActual = ESTADOS.VICTORIA_PVP;
    }

    updateUI();
}

// ─────────────────────────────────────────────
// GAME LOOP PRINCIPAL
// ─────────────────────────────────────────────
function gameLoop() {
    if (!ctx || !canvas) {
        requestAnimationFrame(gameLoop);
        return;
    }
    if (globals.estadoActual === ESTADOS.PANTALLA_INICIO) {
        if (teclas['Enter'] && !ultimaTeclaEnter) {
            globals.estadoActual = ESTADOS.PANTALLA_LORE;
            introScrollY = canvas.height;
            updateUI();
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    else if (globals.estadoActual === ESTADOS.PANTALLA_LORE) {
        introScrollY -= 1.5;
        loreContent.style.top = introScrollY + 'px';
        if ((teclas['Enter'] && !ultimaTeclaEnter) || introScrollY < -800) {
            globals.estadoActual = ESTADOS.SELECCION_MODO;
            updateUI();
        }
    }
    else if (globals.estadoActual === ESTADOS.SELECCION_MODO ||
             globals.estadoActual === ESTADOS.SELECCION_ESCENARIO ||
             globals.estadoActual === ESTADOS.CONTROLES_PVP) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    else if (globals.estadoActual === ESTADOS.JUEGO_PRINCIPAL) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dibujarFondo();

        if (cooldownRayo > 0) cooldownRayo--;
        if (showRayoEffect > 0) showRayoEffect--;

        if (teclas['e'] && !ultimaTeclaE && cooldownRayo <= 0) {
            playThunder();
            showRayoEffect = 30;
            cooldownRayo = MAX_COOLDOWN_RAYO;
            for (let i = globals.enemigos.length - 1; i >= 0; i--) {
                particleSystem.addBlood(globals.enemigos[i].x, globals.enemigos[i].y + globals.enemigos[i].h / 2);
                particleSystem.addFire(globals.enemigos[i].x, globals.enemigos[i].y);
                globals.enemigos.splice(i, 1);
                globals.enemigosMuertos++;
            }
            if (globals.bossActivo && globals.boss) {
                globals.boss.recibirDano();
                globals.boss.recibirDano();
            }
        }
        ultimaTeclaE = teclas['e'];

        globals.jugador.actualizar();
        globals.jugador.dibujar(ctx);

        for (let i = globals.proyectiles.length - 1; i >= 0; i--) {
            globals.proyectiles[i].actualizar();
            globals.proyectiles[i].dibujar(ctx);
            particleSystem.addFire(globals.proyectiles[i].x, globals.proyectiles[i].y);
            if (!globals.proyectiles[i].activo) globals.proyectiles.splice(i, 1);
        }

        if (!globals.bossActivo) {
            if (globals.enemigosGenerados < globals.enemigosTotalNivel) {
                timerGeneracion++;
                if (timerGeneracion >= spawnRate) {
                    let velMult = 1 + (globals.escenarioSeleccionado * 0.3) + (globals.enemigosGenerados * 0.05);
                    globals.enemigos.push(new EnemigoBase(velMult));
                    globals.enemigosGenerados++;
                    timerGeneracion = 0;
                }
            }

            for (let i = globals.enemigos.length - 1; i >= 0; i--) {
                let en = globals.enemigos[i];
                en.actualizar();
                en.dibujar(ctx);
                if (en.x < -en.w) { globals.enemigos.splice(i, 1); globals.enemigosMuertos++; continue; }
                if (checkColision(globals.jugador, en)) {
                    globals.jugador.recibirDano(en.x > globals.jugador.x ? -1 : 1);
                }
                let hBoxAtaque = globals.jugador.getHitboxAtaque();
                if (hBoxAtaque && checkColision(hBoxAtaque, en)) {
                    particleSystem.addBlood(en.x, en.y + en.h / 2);
                    globals.enemigos.splice(i, 1);
                    globals.enemigosMuertos++;
                    continue;
                }
                for (let j = globals.proyectiles.length - 1; j >= 0; j--) {
                    if (checkColision(globals.proyectiles[j], en)) {
                        globals.proyectiles[j].activo = false;
                        particleSystem.addFire(en.x, en.y);
                        globals.enemigos.splice(i, 1);
                        globals.enemigosMuertos++;
                        break;
                    }
                }
            }

            if (globals.enemigosMuertos >= globals.enemigosTotalNivel && globals.enemigos.length === 0) {
                globals.bossActivo = true;
                globals.boss = new Boss();
            }
        } else {
            if (globals.boss) {
                globals.boss.actualizar(globals.jugador.x + globals.jugador.w / 2);
                globals.boss.dibujar(ctx);
                if (checkColision(globals.jugador, globals.boss)) {
                    globals.jugador.recibirDano(globals.boss.x > globals.jugador.x ? -1 : 1);
                }
                let bossAtaque = globals.boss.getHitboxAtaque();
                if (bossAtaque && checkColision(bossAtaque, globals.jugador)) {
                    globals.jugador.recibirDano(globals.boss.x > globals.jugador.x ? -1 : 1);
                }
                let hBoxAtaque = globals.jugador.getHitboxAtaque();
                if (hBoxAtaque && checkColision(hBoxAtaque, globals.boss)) {
                    globals.boss.recibirDano();
                }
                for (let j = globals.proyectiles.length - 1; j >= 0; j--) {
                    if (checkColision(globals.proyectiles[j], globals.boss)) {
                        globals.proyectiles[j].activo = false;
                        particleSystem.addFire(globals.boss.x, globals.boss.y);
                        globals.boss.recibirDano();
                    }
                }
            }
        }

        particleSystem.update();
        particleSystem.draw(ctx);

        if (showRayoEffect > 0) {
            ctx.fillStyle = showRayoEffect % 4 < 2 ? 'rgba(255,255,255,0.8)' : 'rgba(135,206,235,0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#FFF'; ctx.lineWidth = 10;
            ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2-50, canvas.height/2); ctx.lineTo(canvas.width/2+50, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(canvas.width/4, 0); ctx.lineTo(canvas.width/4+30, canvas.height/2); ctx.lineTo(canvas.width/4-20, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(canvas.width*0.75, 0); ctx.lineTo(canvas.width*0.75-40, canvas.height/2); ctx.lineTo(canvas.width*0.75+10, canvas.height); ctx.stroke();
        }

        updateUI();
    }
    else if (globals.estadoActual === ESTADOS.JUEGO_PVP) {
        loopPvP();
    }
    else if (globals.estadoActual === ESTADOS.GAME_OVER ||
             globals.estadoActual === ESTADOS.VICTORIA ||
             globals.estadoActual === ESTADOS.VICTORIA_PVP) {
        if (teclas['Enter'] && !ultimaTeclaEnter) {
            globals.estadoActual = ESTADOS.PANTALLA_INICIO;
            updateUI();
        }
    }

    ultimaTeclaEnter = teclas['Enter'];
    requestAnimationFrame(gameLoop);
}

updateUI();
requestAnimationFrame(gameLoop);

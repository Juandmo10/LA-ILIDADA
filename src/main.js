import { canvas, ctx, globals, ESTADOS, teclas, checkColision } from './utils/globals.js';
import { Player } from './classes/Player.js';
import { EnemigoBase, Boss } from './classes/Enemies.js';
import { particleSystem } from './systems/Particles.js';
import { playThunder } from './systems/Audio.js';

// --- UI DOM Elements ---
const screens = {
    [ESTADOS.PANTALLA_INICIO]: document.getElementById('screen-inicio'),
    [ESTADOS.PANTALLA_LORE]: document.getElementById('screen-lore'),
    [ESTADOS.SELECCION_ESCENARIO]: document.getElementById('screen-seleccion'),
    [ESTADOS.JUEGO_PRINCIPAL]: document.getElementById('hud'),
    [ESTADOS.GAME_OVER]: document.getElementById('screen-gameover'),
    [ESTADOS.VICTORIA]: document.getElementById('screen-victoria')
};
const heartsContainer = document.getElementById('hearts-container');
const levelProgress = document.getElementById('level-progress');
const bossHpWrapper = document.getElementById('boss-hp-wrapper');
const bossHpFill = document.getElementById('boss-hp-fill');
const fuegoStatus = document.getElementById('fuego-status');
const loreContent = document.getElementById('lore-content');

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

function updateUI() {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });
    if (screens[globals.estadoActual]) {
        screens[globals.estadoActual].classList.remove('hidden');
    }

    if (globals.estadoActual === ESTADOS.JUEGO_PRINCIPAL) {
        heartsContainer.innerHTML = '';
        for(let i=0; i<globals.jugador.vidas; i++) {
            let img = document.createElement('img');
            img.src = './assets/heart.png';
            heartsContainer.appendChild(img);
        }

        if (!globals.bossActivo) {
            bossHpWrapper.classList.add('hidden');
            levelProgress.classList.remove('hidden');
            let nombreNivel = globals.escenarioSeleccionado === 1 ? "COSTA" : (globals.escenarioSeleccionado === 2 ? "RUINAS" : "ARENA NOCTURNA");
            levelProgress.textContent = `Nivel ${globals.escenarioSeleccionado} (${nombreNivel}) - Progreso: ${globals.enemigosMuertos}/${globals.enemigosTotalNivel}`;
        } else {
            bossHpWrapper.classList.remove('hidden');
            levelProgress.classList.add('hidden');
            if (globals.boss) {
                bossHpFill.style.width = Math.max(0, (globals.boss.vidas / globals.boss.maxVidas) * 100) + '%';
            }
        }

        if (globals.jugador.cooldownEspecial <= 0) {
            fuegoStatus.textContent = 'Fuego [F]: LISTO';
            fuegoStatus.style.color = '#FF4500';
        } else {
            fuegoStatus.textContent = 'Fuego [F]: RECARGANDO';
            fuegoStatus.style.color = 'gray';
        }

        const dashStatus = document.getElementById('dash-status');
        if (globals.jugador.cooldownDash <= 0) {
            dashStatus.textContent = 'Dash [SHIFT]: LISTO';
            dashStatus.style.color = '#87CEEB';
        } else {
            dashStatus.textContent = 'Dash [SHIFT]: RECARGANDO';
            dashStatus.style.color = 'gray';
        }

        const rayoStatus = document.getElementById('rayo-status');
        if (cooldownRayo <= 0) {
            rayoStatus.textContent = 'Rayo de Zeus [E]: LISTO';
            rayoStatus.style.color = '#FFD700';
        } else {
            rayoStatus.textContent = 'Rayo de Zeus [E]: RECARGANDO';
            rayoStatus.style.color = 'gray';
        }
    }
}

function iniciarNivel(escenario) {
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

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    globals.SUELO_Y = canvas.height - 150; 
    
    introScrollY = canvas.height;

    if (globals.jugador) {
        if (globals.jugador.y + globals.jugador.h > globals.SUELO_Y) {
            globals.jugador.y = globals.SUELO_Y - globals.jugador.h;
            globals.jugador.vy = 0;
            globals.jugador.enSuelo = true;
        }
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('keydown', (e) => {
    let k = e.key === ' ' ? ' ' : (e.key === 'Enter' ? 'Enter' : (e.key.length === 1 ? e.key.toLowerCase() : e.key));
    if (teclas.hasOwnProperty(k)) teclas[k] = true;
});
window.addEventListener('keyup', (e) => {
    let k = e.key === ' ' ? ' ' : (e.key === 'Enter' ? 'Enter' : (e.key.length === 1 ? e.key.toLowerCase() : e.key));
    if (teclas.hasOwnProperty(k)) teclas[k] = false;
});

// UI Event Listeners
document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        iniciarNivel(parseInt(e.target.dataset.esc));
    });
});
document.getElementById('btn-restart-go').addEventListener('click', () => { globals.estadoActual = ESTADOS.PANTALLA_INICIO; updateUI(); });
document.getElementById('btn-restart-vic').addEventListener('click', () => { globals.estadoActual = ESTADOS.PANTALLA_INICIO; updateUI(); });

const btnFullscreen = document.getElementById('btnFullscreen');
btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err.message));
    } else {
        document.exitFullscreen();
    }
});

function dibujarFondo() {
    if (globals.escenarioSeleccionado === 1) { 
        if (imgBackgroundCosta.complete && imgBackgroundCosta.naturalWidth > 0) {
            ctx.drawImage(imgBackgroundCosta, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } 
    else if (globals.escenarioSeleccionado === 2) {
        if (imgBackgroundRuins.complete && imgBackgroundRuins.naturalWidth > 0) {
            ctx.drawImage(imgBackgroundRuins, 0, 0, canvas.width, canvas.height);
        }
    }
    else if (globals.escenarioSeleccionado === 3) {
        if (imgBackgroundArena.complete && imgBackgroundArena.naturalWidth > 0) {
            ctx.drawImage(imgBackgroundArena, 0, 0, canvas.width, canvas.height);
        }
    }
    ctx.fillStyle = globals.escenarioSeleccionado === 3 ? '#0B0C10' : '#4A3B2C'; 
    ctx.fillRect(0, globals.SUELO_Y, canvas.width, canvas.height - globals.SUELO_Y);
    ctx.fillStyle = globals.escenarioSeleccionado === 3 ? '#000' : '#2A1F16'; 
    ctx.fillRect(0, globals.SUELO_Y + 15, canvas.width, canvas.height - globals.SUELO_Y - 15);
}

function gameLoop() {
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
            globals.estadoActual = ESTADOS.SELECCION_ESCENARIO;
            updateUI();
        }
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
                particleSystem.addBlood(globals.enemigos[i].x, globals.enemigos[i].y + globals.enemigos[i].h/2);
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
                let e = globals.enemigos[i];
                e.actualizar();
                e.dibujar(ctx);

                if (e.x < -e.w) {
                    globals.enemigos.splice(i, 1);
                    globals.enemigosMuertos++;
                    continue;
                }

                if (checkColision(globals.jugador, e)) {
                    globals.jugador.recibirDano(e.x > globals.jugador.x ? -1 : 1); 
                }

                let hBoxAtaque = globals.jugador.getHitboxAtaque();
                if (hBoxAtaque && checkColision(hBoxAtaque, e)) {
                    particleSystem.addBlood(e.x, e.y + e.h/2);
                    globals.enemigos.splice(i, 1);
                    globals.enemigosMuertos++;
                    continue; 
                }

                for (let j = globals.proyectiles.length - 1; j >= 0; j--) {
                    if (checkColision(globals.proyectiles[j], e)) {
                        globals.proyectiles[j].activo = false;
                        particleSystem.addFire(e.x, e.y);
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
            ctx.fillStyle = showRayoEffect % 4 < 2 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(135, 206, 235, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(canvas.width/2, 0);
            ctx.lineTo(canvas.width/2 - 50, canvas.height/2);
            ctx.lineTo(canvas.width/2 + 50, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(canvas.width/4, 0);
            ctx.lineTo(canvas.width/4 + 30, canvas.height/2);
            ctx.lineTo(canvas.width/4 - 20, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(canvas.width*0.75, 0);
            ctx.lineTo(canvas.width*0.75 - 40, canvas.height/2);
            ctx.lineTo(canvas.width*0.75 + 10, canvas.height);
            ctx.stroke();
        }
        
        updateUI(); 
    }
    else if (globals.estadoActual === ESTADOS.GAME_OVER || globals.estadoActual === ESTADOS.VICTORIA) {
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

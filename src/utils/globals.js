export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas ? canvas.getContext('2d') : null;

export const globals = {
    SUELO_Y: 0,
    GRAVEDAD: 0.6,
    jugador: null,
    enemigos: [],
    flechasEnemigas: [],
    proyectiles: [],
    boss: null,
    estadoActual: 0,
    escenarioSeleccionado: 1,
    enemigosGenerados: 0,
    enemigosMuertos: 0,
    enemigosTotalNivel: 5,
    bossActivo: false,
    // PvP
    modoPvP: false,
    jugador2: null,
    /** Campaña con diálogos (solo modo historia). */
    historiaNarrada: false,
    /** Sacudida de cámara (frames restantes). */
    screenShake: 0,
    /** Rondas ganadas en PvP (mejor de N). */
    pvpRoundsP1: 0,
    pvpRoundsP2: 0,
    pvpRoundsToWin: 2,
    /** Fin de partida por tiempo (timestamp ms). 0 = sin límite. */
    pvpMatchEndTime: 0,
    /** Pausa breve entre rondas (frames). */
    pvpBetweenRounds: 0,
    /** Texto breve entre rondas. */
    pvpRoundBanner: '',
    /** Tras diálogo previo al jefe. */
    preBossDialogoVisto: false,
    /** Evita lanzar dos veces el diálogo pre-jefe. */
    preBossDialogIniciado: false,
    /** Epílogo ya encolado al derrotar al jefe. */
    bossEpilogueTriggered: false,
};

export const ESTADOS = {
    PANTALLA_INICIO: 0,
    PANTALLA_LORE: 1,
    SELECCION_MODO: 6,        // Nuevo: Elegir Historia o PvP
    SELECCION_ESCENARIO: 2,
    CONTROLES_PVP: 7,         // Nuevo: Mostrar controles PvP
    JUEGO_PRINCIPAL: 3,
    JUEGO_PVP: 8,             // Nuevo: Bucle de juego PvP
    GAME_OVER: 4,
    VICTORIA: 5,
    VICTORIA_PVP: 9,          // Nuevo: Victoria en PvP
    HISTORIA_DIALOGO: 10,     // Campaña: viñetas con diálogo
};

// Teclas Jugador 1 (Historia): flechas/WASD + Space + F + E + Shift
// Teclas Jugador 2 PvP: Arrow keys + L (ataque) + K (disparo) + ; (dash)
// Ambos conjuntos registrados globalmente
export const teclas = {
    // Jugador 1 (historia + PvP)
    ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false,
    w: false, a: false, d: false, s: false,
    ' ': false, f: false, e: false, Shift: false,
    Enter: false,
    // Jugador 2 (PvP)
    l: false, k: false, ';': false,
    // Shared
    '1': false, '2': false, '3': false
};

// Mapas de teclas para PvP
export const PVP_KEYS_P1 = {
    left:   'a',
    right:  'd',
    up:     'w',
    attack: ' ',      // Espacio
    shoot:  'f',
    dash:   'Shift',
};

export const PVP_KEYS_P2 = {
    left:   'ArrowLeft',
    right:  'ArrowRight',
    up:     'ArrowUp',
    attack: 'l',
    shoot:  'k',
    dash:   ';',
};

export function checkColision(rect1, rect2) {
    if (!rect1 || !rect2) return false;
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.h + rect1.y > rect2.y
    );
}

export function loadImageWithoutBg(src) {
    const resultCanvas = document.createElement('canvas');
    resultCanvas.complete = false;
    const img = new Image();
    img.src = src;
    img.onload = () => {
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        const tCtx = resultCanvas.getContext('2d', { willReadFrequently: true });
        tCtx.drawImage(img, 0, 0);
        const imgData = tCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
        const data = imgData.data;
        
        const r0 = data[0], g0 = data[1], b0 = data[2];
        const tolerance = 45; 
        
        for (let i = 0; i < data.length; i += 4) {
            if (data[i+3] === 0) continue; 
            if (Math.abs(data[i] - r0) < tolerance && Math.abs(data[i+1] - g0) < tolerance && Math.abs(data[i+2] - b0) < tolerance) {
                data[i+3] = 0; 
            }
        }
        
        tCtx.putImageData(imgData, 0, 0);
        resultCanvas.complete = true;
        resultCanvas.naturalWidth = img.width;
        resultCanvas.naturalHeight = img.height;
    };
    return resultCanvas;
}

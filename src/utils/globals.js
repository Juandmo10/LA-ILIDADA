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
    bossActivo: false
};

export const ESTADOS = {
    PANTALLA_INICIO: 0,
    PANTALLA_LORE: 1,
    SELECCION_ESCENARIO: 2,
    JUEGO_PRINCIPAL: 3,
    GAME_OVER: 4,
    VICTORIA: 5
};

export const teclas = {
    ArrowLeft: false, ArrowRight: false, ArrowUp: false,
    w: false, a: false, d: false,
    ' ': false, f: false, e: false, Enter: false, Shift: false,
    1: false, 2: false, 3: false
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
    };
    return resultCanvas;
}

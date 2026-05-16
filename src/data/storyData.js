/**
 * Diálogos de la campaña (inspirados en la Ilíada de Homero).
 * Cada entrada: { speaker, text, accent? } — accent es color opcional del nombre.
 */

export const SPEAKERS = {
    NARRADOR: { label: 'Narrador', color: '#c9b8a8' },
    AQUILES: { label: 'Aquiles', color: '#D4AF37' },
    AGAMENON: { label: 'Agamenón', color: '#CD853F' },
    BRISEIDA: { label: 'Briseida', color: '#87CEEB' },
    PATROCLO: { label: 'Patroclo', color: '#98FB98' },
    HECTOR: { label: 'Héctor', color: '#8A2BE2' },
    ANDROMACA: { label: 'Andrómaca', color: '#FFB6C1' },
    PRIAMO: { label: 'Príamo', color: '#B8860B' },
    ZEUS: { label: 'Zeus (voz lejana)', color: '#E6E6FA' },
};

function line(speakerKey, text) {
    const s = SPEAKERS[speakerKey];
    return { speaker: s.label, speakerKey, text, color: s.color };
}

/** Prologo antes del primer oleaje de enemigos (por escenario / acto). */
export function getIntroActo(escenario) {
    if (escenario === 1) {
        return [
            line('NARRADOR', 'Noveno año de asedio. En las tiendas aqueas arde un honor herido: la cólera del pélida Aquiles, cantada por las musas.'),
            line('AGAMENON', 'He tomado a tu premio, Aquiles. La ley del rey es la ley del campamento.'),
            line('AQUILES', 'Entonces me retiro del campo de batalla. Que los dánaos aprendan lo que es pelear sin mí.'),
            line('BRISEIDA', 'No fui yo quien eligió estas orillas… pero veo en tus ojos el mismo mar que nos arrastra a todos.'),
            line('NARRADOR', 'Mientras Troya resiste, tú —como Aquiles— harás sangrar la costa hasta que el campeón enemigo alce la vista.'),
        ];
    }
    if (escenario === 2) {
        return [
            line('NARRADOR', 'Las murallas se yerguen como un juramento de bronce. En el polvo de las ruinas, los nombres pesan más que las espadas.'),
            line('PATROCLO', 'Hermano de armas… déjame ir al frente con tu armadura. Si llevan tu sombra, quizá salven a los nuestros.'),
            line('AQUILES', 'Ve, Patroclo… pero no persigas a Troya hasta su puerta. El orgullo tiene un límite, y el hado no negocia.'),
            line('HECTOR', '¿Aquiles? No… pero el miedo no distingue el brillo del bronce. ¡Que Zeus decida entre tú y yo!'),
            line('NARRADOR', 'Lo que queda de la ciudad es un laberinto de sombras. Aquí, cada golpe escribe una línea del poema.'),
        ];
    }
    return [
        line('NARRADOR', 'La arena nocturna bebe el clamor de los ejércitos. Dos destinos convergen: el tuyo y el del hijo de Príamo.'),
        line('ANDROMACA', 'Héctor… el muro eres tú. Si caes, no quedará techo para nuestro hijo.'),
        line('HECTOR', 'Conozco el peso de ese muro. Pero un hombre no puede huir de su propio nombre.'),
        line('PRIAMO', 'Hijo mío, si los dioses ya lo han dicho, al menos que Troya recuerde con qué altura miraste a la muerte.'),
        line('ZEUS', 'La balanza se inclina… mas el honor de los mortales es cosa suya, no mía.'),
        line('AQUILES', 'Héctor. Por Patroclo. Por cada lágrima que Troya no mereció y el campamento sí.'),
        line('NARRADOR', 'Bajo la luna, dos astros del mismo cielo: el orgullo y el deber. Solo uno caminará de vuelta.'),
    ];
}

/** Antes de que aparezca Héctor como jefe. */
export function getPreBossActo(escenario) {
    if (escenario === 1) {
        return [
            line('NARRADOR', 'Los últimos troyanos de la costa retroceden… y del polvo surge el príncipe que arrastra a un pueblo entero a la guerra.'),
            line('HECTOR', 'Aquiles de los griegos: tu silencio fue un trueno en el campamento. Mi lanza responderá por Troya.'),
            line('AQUILES', 'Hoy no soy silencio. Soy el filo que recordará tu nombre… hasta que el viento lo borre.'),
        ];
    }
    if (escenario === 2) {
        return [
            line('NARRADOR', 'Entre columnas rotas, el rumor de los carros se apaga. Queda el choque de dos voluntades.'),
            line('HECTOR', 'En estas piedras juré defender a los míos. Si caigo, que sea con la frente alta.'),
            line('AQUILES', 'Juramentos hermosos… pero mi juramento fue más oscuro: venganza. Acércate, príncipe.'),
        ];
    }
    return [
        line('NARRADOR', 'El duelo ya no es de ejércitos: es de dos hombres y un poema que no cabe en el pecho.'),
        line('HECTOR', 'Si he de morir, que sea sin mentiras. Enfrentémonos como lo hacen quienes ya no temen a los dioses.'),
        line('AQUILES', 'Entonces mira de frente. Esto es lo que queda cuando el mundo te quita a quien amabas.'),
    ];
}

/** Tras derrotar a Héctor (cierre del acto). */
export function getEpilogoActo(escenario) {
    if (escenario === 1) {
        return [
            line('NARRADOR', 'La costa queda quieta, como si el mar contuviera el aliento.'),
            line('HECTOR', '…El día… aún… alcanza… a Troya…'),
            line('AQUILES', 'Duerme. Que las olas te lleven la furia… aunque yo sepa que la furia no se va con nadie.'),
        ];
    }
    if (escenario === 2) {
        return [
            line('NARRADOR', 'Las ruinas guardan el eco de dos nombres que el tiempo no olvidará.'),
            line('AQUILES', 'Patroclo… ¿lo oyes? El bronce calló. Pero el vacío sigue aquí, más alto que cualquier muro.'),
            line('NARRADOR', 'Y sin embargo, Troya aún late. La guerra no ha terminado: solo ha cambiado de verso.'),
        ];
    }
    return [
        line('NARRADOR', 'Bajo la luna, el campeón cae. La ciudad lo sabrá antes que el alba.'),
        line('ANDROMACA', 'No… no…'),
        line('AQUILES', 'He cumplido lo que juré… y aun así no sé si lo que queda es victoria o otra herida.'),
        line('NARRADOR', 'Así canta la cólera: no como un triunfo limpio, sino como un fuego que devora también al vencedor.'),
    ];
}

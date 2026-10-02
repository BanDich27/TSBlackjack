import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { isNumberObject } from 'node:util/types';

const PALOS = ['♠', '♥', '♦', '♣'] as const
const VALORES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const FICHAS = ["10", "20", "50", "100", "200"] as const;
type paloCarta = typeof PALOS[number];
type valorCarta = typeof VALORES[number];

class Carta {
    constructor (
        public valor: valorCarta,
        public palo: paloCarta
    ) {}
}

class Partida {
    constructor (
        public dinero: number,
        public mazo: Carta[],
        public numMazos: number
    ) {}
}

function mazoBase(): Carta[] {
    let mazo: Carta[] = [];

    for (let palo of PALOS) {
        for (let valor of VALORES) {
            mazo.push(new Carta(valor, palo));
        }
    }

    return mazo;
}

function barajarMazo<T>(mazo: T[]): T[] {
    for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        
        const temp = mazo[i]!;
        mazo[i] = mazo[j]!;
        mazo[j] = temp;
    }
    return mazo;
}

function iniciarMazos(numeroMazos: number): Carta[] {
    let mazo: Carta[] = [];

    for (let i = numeroMazos; i > 0; i--) {
        mazo = mazo.concat(mazoBase());
    }

    mazo = barajarMazo(mazo);

    return mazo;
}

function iniciarPartida(dinero: number, numMazos: number): Partida {
    return new Partida(dinero, iniciarMazos(numMazos), numMazos);
}

function calcularValorMano(c: Carta[]): number {
    let nA: number = 0;
    let valor: number = 0;    

    for (let i = 0; i < c.length; i++) {
        if (c[i]?.valor === "A" ) {
            nA++;
            valor += 11;
        } else if (["J", "Q", "K"].includes(c[i]?.valor!)) {
            valor += 10;
        } else {
            valor += Number(c[i]?.valor);
        }

        while (valor > 21 && nA > 0) {
            valor -= 10;
            nA -= 1;
        }
    }

    return valor;
}

function puedeDoblar(c: Carta[], apuesta: number, banco: number): boolean {
    return c.length === 2 && [9, 10, 11].includes(calcularValorMano(c)) && (banco - apuesta*2 >= 0)
}

function puedeDividir(c: Carta[], apuesta: number, banco: number): boolean {
    return c.length === 2 && (c[0]?.valor === c[1]?.valor) && (banco - apuesta*2 >= 0);
}

function mostrarManoConsola(j: Carta[], c: Carta[]): void {
    console.log("Tu mano: ");
    j.forEach(e => console.log(e));
    console.log("Mano del crupier: ");
    c.forEach(e => console.log(e));
}

async function pasarTurno(p: Partida): Promise<Partida> {
    const rl = readline.createInterface({ input, output }); // abrir lectura
    let respuesta: string;
    let numJugadas: number = 1;
    let apuesta: number = 0;

    // APOSTAR
    do {
        respuesta = await rl.question('Introduce fichas de apuesta [' + FICHAS.join("/") + '] (\'v\' para continuar)');

        if (respuesta === 'v' && (apuesta <= 0)) {
            console.log("Introduce una apuesta válida");
        } else if ((FICHAS.includes(respuesta as typeof FICHAS[number])) && (p.dinero - (Number(respuesta) + apuesta) >= 0)) {
            apuesta += Number(respuesta);
            p.dinero -= Number(respuesta);
        }

    } while (respuesta !== 'v' || apuesta <= 0)

    // REPARTO INICIAL
    if (p.mazo.length < 30) {
        console.log("Rebarajando");
        p.mazo = iniciarMazos(p.numMazos);
    }
    const jugador: Carta[][] = [[]];
    const crupier: Carta[] = [];
    jugador[0]!.push(p.mazo.pop()!);
    crupier.push(p.mazo.pop()!);
    jugador[0]!.push(p.mazo.pop()!);
    crupier.push(p.mazo.pop()!);

    for (let i = 0; i < numJugadas; i++) {
        if (i > 0) {
            console.log(`Mano ${i+1}:`);
        }
        
        mostrarManoConsola(jugador[i]!, crupier);
        
        // JUGAR
        let finJugada: boolean = calcularValorMano(jugador[i]!) === 21;
    
        while (!finJugada) {
            respuesta = await rl.question("Selecciona acción:\n1) PEDIR\n2) QUEDARSE\n3) DOBLAR\n4) DIVIDIR\n");
            
            switch (respuesta) {
                case "1":
                    jugador[i]!.push(p.mazo.pop()!);
                    mostrarManoConsola(jugador[i]!, crupier);
                    if (calcularValorMano(jugador[i]!) >= 21) {finJugada = true};
                    break;
                case "2":
                    finJugada = true;
                    break;
                case "3":
                    if (!puedeDoblar(jugador[i]!, apuesta, p.dinero)) {
                        console.log("Para doblar debes tener 2 cartas, tu mano debe valer (9,10,11) y poder pagar")
                    } else {
                        jugador[i]!.push(p.mazo.pop()!);
                        p.dinero -= apuesta;
                        finJugada = true;
                        mostrarManoConsola(jugador[i]!, crupier);
                    }
                    break;
                case "4":
                    if (!puedeDividir(jugador[i]!, apuesta, p.dinero)) {
                        console.log("Para dividir debes tener 2 cartas iguales y poder pagar la apuesta")
                    } else {
                        let c: Carta = jugador[i]!.pop()!
                        p.dinero -= apuesta;
                        jugador.push([c]);
                        mostrarManoConsola(jugador[i]!, crupier);
                    }
                    break;
            }
        }

        //FIANL

        // PASARSE DE 21

        if (calcularValorMano(jugador[i]!) > 21) {
            console.log("Te has pasado de 21");
            break;
        }

        // CRUPIER

        while (calcularValorMano(crupier) < Math.min(17, calcularValorMano(jugador[i]!))) {
            crupier.push(p.mazo.pop()!);
        }

        // DECISIÓN

        if (calcularValorMano(jugador[i]!) === 21) {
            if (calcularValorMano(crupier) === 21) {
                console.log("Empate");
                p.dinero += apuesta;
                console.log("Tienes " + p.dinero + " eurillos")
            } else {
                console.log("**BLACKJACK**");
                p.dinero += apuesta * 2,5;
                console.log("Tienes " + p.dinero + " eurillos")
            }
        } else if (calcularValorMano(crupier) < calcularValorMano(jugador[i]!) || calcularValorMano(crupier) > 21) {
            console.log("GANAS!!!!")
            p.dinero += apuesta*2
            console.log("Tienes " + p.dinero + " eurillos")
        } else if ( calcularValorMano(crupier) === calcularValorMano(jugador[i]!)) {
            console.log("Empate");
            p.dinero += apuesta;
            console.log("Tienes " + p.dinero + " eurillos")
        }


    }

    
    
    rl.close(); // cerrar lectura
    return p;
}

export { pasarTurno };
export { iniciarPartida };
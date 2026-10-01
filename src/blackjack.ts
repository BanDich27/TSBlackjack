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

async function pasarTurno(p: Partida): Promise<Partida> {
    const rl = readline.createInterface({ input, output }); // abrir lectura
    let respuesta: string;
    let apuesta: number = 0;

    // APOSTAR
    do {
        respuesta = await rl.question('Introduce fichas de apuesta [' + FICHAS.join("/") + '] (\'v\' para continuar)');

        if (respuesta === 'v' && (apuesta <= 0)) {
            console.log("Introduce una apuesta superior a 0");
        } else if (FICHAS.includes(respuesta as typeof FICHAS[number])) {
            apuesta += Number(respuesta);
        }

    } while (respuesta !== 'v' || apuesta <= 0)

    // REPARTIR
    if (p.mazo.length < 30) {
        console.log("Rebarajando");
        p.mazo = iniciarMazos(p.numMazos);
    }
    const jugador: Carta[] = [];
    const crupier: Carta[] = [];
    jugador.push(p.mazo.pop()!);
    crupier.push(p.mazo.pop()!);
    jugador.push(p.mazo.pop()!);
    crupier.push(p.mazo.pop()!);
    
    console.log(`Tu mano: ${jugador[0]}; ${jugador[1]} / Mano del crupier: ${crupier[0]}`);
    


    
    
    rl.close(); // cerrar lectura
    return p;
}

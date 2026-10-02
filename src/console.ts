import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { iniciarPartida, pasarTurno } from "./blackjack.js";

async function main(): Promise<void> {
    const p = iniciarPartida(100, 6);

    while (true) {
        await pasarTurno(p);

        if (p.dinero < 10) {
            console.log("No tienes saldo suficiente para otra apuesta.");
            break;
        }

        const rl = readline.createInterface({ input, output });
        const respuesta = await rl.question("¿Quieres jugar otra mano? (s/n): ");
        rl.close();

        if (respuesta.trim().toLowerCase() !== "s") {
            break;
        }
    }
}

void main();
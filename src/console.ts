import { iniciarPartida, pasarTurno } from "./blackjack.js";

function main(): void {
    let p = iniciarPartida(100, 6);
    pasarTurno(p);
}

main();
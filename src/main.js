import { Opening } from './opening.js';
import { Game } from './game.js';

export class App {
    constructor() {
        this.gameboard = document.getElementById('gameboard');
        this.openingContainer = document.getElementById('opening-container');
        this.opening = null;
        this.game = null;
    }

    start() {
        this.game = new Game();
        this.game.start();

        return;

        // 1) Garante que o <div id="gameboard"> esteja oculto até a abertura terminar
        if (this.gameboard) {
            this.gameboard.style.display = 'none';
        }

        if (this.openingContainer) {
            this.openingContainer.style.display = 'block';
        }

        // 2) Cria a Opening, passando como callback a inicialização do GameTakeoff
        this.opening = new Opening(this.openingContainer, () => {
            if (this.openingContainer) {
                this.openingContainer.style.display = 'none';
            }

            if (this.gameboard) {
                this.gameboard.style.display = 'block';
            }

            this.game = new Game();
            this.game.start();
        });

        // 3) Dispara a abertura
        this.opening.start();
    }
}

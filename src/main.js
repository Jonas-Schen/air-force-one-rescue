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
        // 1) Garante que o <div id="gameboard"> esteja oculto até a abertura terminar
        if (this.gameboard) {
            this.gameboard.style.display = 'none';
        }

        if (this.openingContainer) {
            this.openingContainer.style.display = 'block';
        }

        //>Jump opening for tests
        this.game = new Game();
        this.game.start();
        if (this.openingContainer) {
            this.openingContainer.style.display = 'none';
        }

        if (this.gameboard) {
            this.gameboard.style.display = 'block';
        }
        return;

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

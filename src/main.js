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
        //> 1) Ensures the <div id="gameboard"> is hidden until the opening is complete
        if (this.gameboard) {
            this.gameboard.style.display = 'none';
        }

        if (this.openingContainer) {
            this.openingContainer.style.display = 'block';
        }

        //> 2) Creates the Opening, passing the GameTakeoff initialization as a callback
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

        //> 3) Trigger the opening
        this.opening.start();
    }
}

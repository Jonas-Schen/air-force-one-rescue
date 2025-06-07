import * as THREE from 'three';
import { Player } from './player.js';
import { EnemiesManager } from './enemies.js';
import { RocketsManager } from './rockets.js';
import { TankerManager } from './tanker.js';
import {updateScoreUI, showGameOver, updatePauseUI} from './ui.js';
import {AudioListener, AudioLoader, Audio} from 'three';

export class Game {
    constructor() {
        document.getElementById('game-container').style.display = 'block';
        this.container = document.getElementById('game-container');
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.player = null;
        this.rocketTimer = null;
        this.gameStarted = false;
        this.isPaused = false;

        // flags de controle
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.increaseSpeed = false;
        this.decreaseSpeed = false;

        this.playerSpeed = 0.1;
        this.minPlayerSpeed = 0.02;
        this.maxPlayerSpeed = 0.15;
        this.worldSpeed = 0.05;
        this.minWorldSpeed = 0.02;
        this.maxWorldSpeed = 0.5;

        // Sistema de vidas e chamas
        this.initialLives = 5;
        this.playerLives = this.initialLives;
        this.invulnerabilityTime = 2000; // 2 segundos de invulnerabilidade
        this.isInvulnerable = false;
        this.lastHitTime = 0;
        this.engineFlames = []; // Array para armazenar as chamas das turbinas
        this.flameTexture = null;

        this.fuelConsumptionRate = 12.6;
        this.lastFuelCheck = 0;
        this.initialFuelLevel = 100;

        this.gameState = {
            speed: 0.02,
            distance: 0,
            lives: this.playerLives,
            fuelLevel: this.initialFuelLevel,
            playerHit: () => {
                this._handlePlayerHit();
            },
            gameOver: () => {
                if (this.planeSound) {
                    this.planeSound.stop();
                }
                this.rocketsManager.reset();
                showGameOver(this.gameState.distance, this.resetGame.bind(this));
            }
        };

        this._setupScene();
        this._initBackground();
        this._initCamera();
        this._initRenderer();
        this._initLights();
        this._loadFlameTexture();
        this._initPlayer();
        this._bindEvents();
        this._animate();
        this._initAudio();

        this.rocketsManager = new RocketsManager(this.scene, this.camera, this.player, this.gameState);
        this.enemiesManager = new EnemiesManager(this.scene, this.camera, this.player, this.gameState);
        this.tankerManager = new TankerManager(this.scene, this.player, this.gameState);
    }

    _updateFuelConsumption() {
        // Durante o reabastecimento, não consome combustível
        if (this.tankerManager && this.tankerManager.inProgress) {
            return;
        }

        // Calcula quantas unidades de combustível devem ter sido consumidas baseado na distância
        const fuelUnitsConsumed = Math.floor(this.gameState.distance / this.fuelConsumptionRate);

        // Se uma nova unidade deve ser consumida
        if (fuelUnitsConsumed > this.lastFuelCheck) {
            this.gameState.fuelLevel = Math.max(0, 100 - fuelUnitsConsumed);
            this.lastFuelCheck = fuelUnitsConsumed;

            // Verifica se o combustível acabou
            if (this.gameState.fuelLevel <= 0) {
                this.gameState.gameOver();
            }
        }
    }

    _loadFlameTexture() {
        const textureLoader = new THREE.TextureLoader();
        this.flameTexture = textureLoader.load(
            '/assets/textures/flame.png',
            undefined,
            undefined,
            err => console.error('Error loading flame texture:', err)
        );
    }

    _createEngineFlame(engineIndex) {
        if (!this.flameTexture || !this.player) return;

        // Posições aproximadas das 4 turbinas (ajustar conforme necessário)
        const enginePositions = [
            { x: -0.95, y: -1.9, z: 0.3 }, // Turbina esquerda externa
            { x: -0.55, y: -1.9, z: -0.1 }, // Turbina esquerda interna
            { x: 0.55, y: -1.9, z: -0.1 }, // Turbina direita interna
            { x: 0.95, y: -1.9, z: 0.3 } // Turbina direita externa
        ];

        if (engineIndex >= enginePositions.length) return;

        // Cria material para o sprite de chama
        const spriteMaterial = new THREE.SpriteMaterial({
            map: this.flameTexture,
            transparent: true,
            opacity: 0.8,
            alphaTest: 0.001,
            blending: THREE.AdditiveBlending // Efeito de fogo mais realista
        });

        // Cria o sprite
        const flameSprite = new THREE.Sprite(spriteMaterial);
        flameSprite.scale.set(0.3, 0.5, 1); // Tamanho da chama

        // Posiciona a chama na turbina correspondente
        const pos = enginePositions[engineIndex];
        flameSprite.position.set(pos.x, pos.y, pos.z);

        // Adiciona a chama ao grupo do jogador
        this.player.group.add(flameSprite);

        // Armazena a chama para animação
        this.engineFlames[engineIndex] = {
            sprite: flameSprite,
            material: spriteMaterial,
            baseScale: { x: 0.3, y: 0.5 },
            active: true
        };
    }

    _updateEngineFlames() {
        // Anima as chamas das turbinas
        this.engineFlames.forEach((flame, index) => {
            if (flame && flame.active) {
                // Efeito de tremeluzir/piscar
                const time = Date.now() * 0.01;
                const flicker = 0.8 + Math.sin(time + index) * 0.2;

                flame.sprite.scale.x = flame.baseScale.x * flicker;
                flame.sprite.scale.y = flame.baseScale.y * (0.9 + Math.sin(time * 2 + index) * 0.1);

                // Varia a opacidade
                flame.material.opacity = 0.6 + Math.sin(time * 3 + index) * 0.2;
            }
        });
    }

    _clearEngineFlames() {
        // Remove todas as chamas das turbinas
        this.engineFlames.forEach(flame => {
            if (flame && flame.sprite && flame.sprite.parent) {
                flame.sprite.parent.remove(flame.sprite);
                flame.material.dispose();
            }
        });
        this.engineFlames = [];
    }

    _handlePlayerHit() {
        // Verifica se o jogador está invulnerável
        if (this.isInvulnerable) {
            return;
        }

        // Reduz uma vida
        this.playerLives--;
        this.gameState.lives = this.playerLives;

        const engineToIgnite = this.initialLives - this.playerLives - 1;
        if (engineToIgnite >= 0 && engineToIgnite < 4) {
            this._createEngineFlame(engineToIgnite);
        }

        // Ativa invulnerabilidade
        this.isInvulnerable = true;
        this.lastHitTime = Date.now();

        // Efeito visual de invulnerabilidade (piscar o jogador)
        this._startInvulnerabilityEffect();

        // Verifica se o jogador morreu
        if (this.playerLives <= 0) {
            this.gameState.gameOver();
        }
    }

    _startInvulnerabilityEffect() {
        let blinkCount = 0;
        const maxBlinks = 10; // Número de piscadas
        const blinkInterval = this.invulnerabilityTime / maxBlinks;

        const blinkTimer = setInterval(() => {
            if (blinkCount >= maxBlinks) {
                // Para o efeito e remove invulnerabilidade
                this.isInvulnerable = false;
                this.player.group.visible = true;
                clearInterval(blinkTimer);

                return;
            }

            // Alterna visibilidade do jogador
            this.player.group.visible = !this.player.group.visible;
            blinkCount++;
        }, blinkInterval);
    }

    start() {
        this.gameStarted = false;       // só vai virar true quando o player terminar de carregar
        this.clock = new THREE.Clock();
    }

    resetGame() {
        this._clearRocketTimer();
        this.rocketsManager.reset();
        this.enemiesManager.reset();
        this.tankerManager.reset();

        if (this.planeSound) {
            this.planeSound.stop();
        }

        // Limpa as chamas das turbinas
        this._clearEngineFlames();

        // Desativa sequência de reabastecimento se estiver ativa
        if (this.isRefuelSequenceActive) {
            this.refuelPlane.deactivate();
            this.isRefuelSequenceActive = false;
        }

        // reset player
        this.player.group.position.set(0, -2.5, 0);
        this.player.currentPositionY = -2.5;
        this.player.group.visible = true; // Garante que o jogador esteja visível

        this.playerLives = this.initialLives;
        this.isInvulnerable = false;
        this.lastHitTime = 0;

        // Reset do sistema de combustível
        this.lastFuelCheck = 0;

        // reset flags e velocidades
        Object.assign(this.gameState, {
            speed: 0.02,
            distance: 0,
            lives: this.playerLives,
            fuelLevel: this.initialFuelLevel,
        });
        this.moveLeft = this.moveRight = this.moveUp = this.moveDown = false;
        this.increaseSpeed = this.decreaseSpeed = false;
        this.playerSpeed = 0.1;
        this.worldSpeed  = 0.05;
    }

    _setupScene() {
        // apenas placeholder, a cena já foi criada no constructor
    }

    _initBackground() {
        const loader = new THREE.TextureLoader();
        loader.load('/assets/textures/sky/sky_full.png',
            tex => { this.scene.background = tex; },
            undefined,
            err => console.error('Error loading sky texture:', err)
        );
    }

    _initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 8;
    }

    _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    _initLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 1));
        const dir = new THREE.DirectionalLight(0xffffff, 3.0);
        dir.position.set(0, 5, 5);
        this.scene.add(dir);
    }

    _initPlayer() {
        this.player = new Player(this.scene, () => {
            console.log('✅ Player model loaded, game starting!');
            this.gameStarted = true;
            // posição inicial do player
            this.player.group.position.set(0, -2.5, 0);
            this.player.currentPositionY = -2.5;

            if (this.planeSound) {
                this.planeSound.play();
            }
        });
    }

    _bindEvents() {
        document.addEventListener('keydown', this._onKeyDown.bind(this));
        document.addEventListener('keyup', this._onKeyUp.bind(this));
        window.addEventListener('resize', this._onResize.bind(this));
    }

    _onKeyDown(e) {
        switch(e.key.toLowerCase()) {
            case 'arrowleft': this.moveLeft = true; break;
            case 'arrowright': this.moveRight = true; break;
            case 'arrowup': this.moveDown = true; break;
            case 'arrowdown': this.moveUp = true; break;
            case 'a': this.increaseSpeed = true; break;
            case 'z': this.decreaseSpeed = true; break;
            case 'p': this.isPaused = !this.isPaused; break;
        }

        this._updateSpeed();
    }

    _onKeyUp(e) {
        switch(e.key.toLowerCase()) {
            case 'arrowleft': this.moveLeft = false; break;
            case 'arrowright': this.moveRight = false; break;
            case 'arrowup': this.moveDown = false; break;
            case 'arrowdown': this.moveUp = false; break;
            case 'a': this.increaseSpeed = false; break;
            case 'z': this.decreaseSpeed = false; break;
        }

        this._updateSpeed();
    }

    _updateSpeed() {
        const acc = 0.001, brk = 0.004;
        if (this.increaseSpeed) {
            this.worldSpeed  = Math.min(this.worldSpeed  + acc, this.maxWorldSpeed);
            this.playerSpeed = Math.min(this.playerSpeed + acc, this.maxPlayerSpeed);
        }

        if (this.decreaseSpeed) {
            this.worldSpeed  = Math.max(this.worldSpeed  - brk, this.minWorldSpeed);
            this.playerSpeed = Math.max(this.playerSpeed - brk, this.minPlayerSpeed);
        }
    }

    _clearRocketTimer() {
        if (this.rocketTimer) {
            clearTimeout(this.rocketTimer);
            this.rocketTimer = null;
        }
    }

    _animate() {
        requestAnimationFrame(this._animate.bind(this));

        if (!this.gameStarted) {
            this.renderer.render(this.scene, this.camera);

            return;
        }

        updatePauseUI(this.isPaused);
        this.rocketsManager.isPaused = this.isPaused;
        this.tankerManager.isPaused = this.isPaused;

        if (this.isPaused) {
            if (this.planeSound && this.planeSound.isPlaying) {
                this.planeSound.stop();
                this.rocketsManager.stopSound();
            }

            this.renderer.render(this.scene, this.camera);

            return;
        } else {
            if (this.planeSound && !this.planeSound.isPlaying) {
                this.planeSound.play();
                this.rocketsManager.playSound();
            }
        }

        const deltaTime = this.clock.getDelta();

        // Atualiza animação das chamas
        this._updateEngineFlames();

        // pontuação baseada em distância percorrida
        this.gameState.distance += this.worldSpeed * deltaTime * 100;

        // Atualiza consumo de combustível baseado na distância
        this._updateFuelConsumption();

        // Atualiza sistema de reabastecimento
        this.tankerManager.update(deltaTime);

        // mover jogador
        const dir = this.moveLeft ? 'left'
            : this.moveRight ? 'right'
            : this.moveUp ? 'up'
            : this.moveDown ? 'down'
            : null;

        if (dir) {
            this.player.move(dir, this.playerSpeed, this._getViewLimitX(), this._getLowerY(), this._getUpperY());
        }
        this.player.update(dir, deltaTime, dir!==null, this.increaseSpeed, this.decreaseSpeed);

        // spawn de foguetes
        this.rocketsManager.update();
        this.enemiesManager.update(this.worldSpeed);

        // atualiza UI
        updateScoreUI(this.gameState.distance, this.worldSpeed, this.playerLives, this.gameState.fuelLevel);

        this.renderer.render(this.scene, this.camera);
    }

    _initAudio() {
        if ((localStorage.getItem('sound') ?? 'ON') === 'OFF') return;

        this.listener = new AudioListener();
        this.camera.add(this.listener);

        this.planeSound = new Audio(this.listener);

        const planeSoundLoader = new AudioLoader();
        planeSoundLoader.load(
            '/assets/sounds/plane_flying.ogg',
            buffer => {
                this.planeSound.setBuffer(buffer);
                this.planeSound.setLoop(true);
                this.planeSound.setVolume(0.5);
            },
            undefined,
            err => console.error('Error loading plane sound:', err)
        );
    }

    _getFrustumHeight() {
        return 2 * this.camera.position.z * Math.tan( (this.camera.fov/2) * (Math.PI/180) );
    }

    _getUpperY() {
        return this._getFrustumHeight()/2 - 0.5;
    }

    _getLowerY() {
        return -this._getFrustumHeight()/2 + 3;
    }

    _getViewLimitX() {
        return this._getUpperY() * this.camera.aspect;
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// rockets.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {AudioListener, AudioLoader, Audio} from 'three';

const rocketDefs = [
    { url: '/assets/models/rockets/simple_rocket.glb', speed: 0.16, scale: 0.0013, orientation: 'left' },
    { url: '/assets/models/rockets/sci-fi_missile.glb', speed: 0.14, scale: 0.5, orientation: 'left' },
    { url: '/assets/models/rockets/aim-9_missile.glb', speed: 0.12, scale: 0.7, orientation: 'left' },
    { url: '/assets/models/rockets/mica_anti_aircraft_missile_-free.glb', speed: 0.10, scale: 0.7, orientation: 'right' },
    { url: '/assets/models/rockets/aim-120_amraam_missile.glb', speed: 0.08, scale: 0.7, orientation: 'left' },
    { url: '/assets/models/rockets/missile_fateh_110.glb', speed: 0.06, scale: 0.002, orientation: 'left' },
];

export class RocketsManager {
    constructor(scene, camera, player, gameState) {
        this.scene = scene;
        this.camera = camera;
        this.player = player;
        this.gameState = gameState;
        this.isPaused = false;
        this.loader = new GLTFLoader();
        this.models = [];
        this.rockets = [];
        this._timer = null;
        this._initAudio();

        // pré-carrega todos os gltf
        rocketDefs.forEach(def =>
            this.loader.load(
                def.url,
                gltf => {
                    this.models.push({
                        speed: def.speed,
                        scale: def.scale,
                        orientation: def.orientation,
                        scene: gltf.scene
                    });
                },
                undefined,
                err => console.error('Erro ao carregar', def.url, err)
            )
        );

        this._scheduleNext();
    }

    _initAudio() {
        if ((localStorage.getItem('sound') ?? 'ON') === 'OFF') return;

        this.listener = new AudioListener();
        this.camera.add(this.listener);

        this.rocketSound = new Audio(this.listener);

        const rocketSoundLoader = new AudioLoader();
        rocketSoundLoader.load(
            '/assets/sounds/rocket.ogg',
            buffer => {
                this.rocketSound.setBuffer(buffer);
                this.rocketSound.setLoop(true);
                this.rocketSound.setVolume(0.2);
            },
            undefined,
            err => console.error('Error loading rocket sound:', err)
        );
    }

    // agenda o próximo spawn em 5–10s
    _scheduleNext() {
        this._timer = setTimeout(() => {
            this._spawnRocket();
            this._scheduleNext();
        }, 5000 + Math.random() * 5000);
    }

    _spawnRocket() {
        if (this.models.length === 0) return;

        if (this.isPaused) return;

        const defIdx = Math.floor(Math.random() * this.models.length);
        const { speed, scale, orientation, scene: model } = this.models[defIdx];
        const rocket = model.clone(true);
        rocket.userData = { speed, orientation, spawnOffset: 1 };

        // escala e direção
        rocket.scale.set(scale, scale, scale);
        rocket.userData.rotationSpeed = Math.random() * 0.05 + 0.02;

        // limites de visão
        const H = 2 * this.camera.position.z * Math.tan((this.camera.fov/2)*(Math.PI/180));
        const halfH = H/2;
        const viewX = halfH * this.camera.aspect;
        const topY = halfH - 0.5;
        const botY = -halfH + 3;

        // pos Y aleatória e X fora da tela
        rocket.position.y = THREE.MathUtils.randFloat(botY, topY);
        const fromLeft = Math.random() < 0.5;

        let pi = Math.PI;
        if (rocket.userData.orientation === 'right') pi = pi * (-1);

        if (fromLeft) {
            rocket.position.x = -viewX - rocket.userData.spawnOffset;
            rocket.rotation.y = pi / 2;
            rocket.userData.dir = 'right';
        } else {
            rocket.position.x = viewX + rocket.userData.spawnOffset;
            rocket.rotation.y = (pi * -1) / 2;
            rocket.userData.dir = 'left';
        }

        this.scene.add(rocket);
        if (this.rocketSound) {
            this.rocketSound.play();
        }

        this.rockets.push(rocket);
    }

    update() {
        if (!this.player || !this.gameState || this.isPaused) return;

        const H = 2 * this.camera.position.z * Math.tan((this.camera.fov/2)*(Math.PI/180));
        const halfH = H/2;
        const viewX = halfH * this.camera.aspect;

        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];

            const dirMul = (r.userData.dir === 'right') ?  1 : -1;
            r.position.x += dirMul * r.userData.speed;
            r.rotation.z += r.userData.rotationSpeed;

            // checa colisão
            const boxR = new THREE.Box3().setFromObject(r);
            const boxP = new THREE.Box3().setFromObject(this.player.group);
            if (boxR.intersectsBox(boxP)) {
                this.gameState.gameOver();
                return;
            }

            // remoção fora da tela
            if (r.position.x > viewX + r.userData.spawnOffset || r.position.x < -viewX - r.userData.spawnOffset) {
                this.scene.remove(r);
                this.rockets.splice(i, 1);

                if (this.rocketSound && this.rockets.length === 0) {
                    this.rocketSound.stop();
                }
            }
        }
    }

    stopSound() {
        if (this.rocketSound && this.rocketSound.isPlaying) {
            this.rocketSound.stop();
        }
    }

    playSound() {
        if (this.rocketSound && !this.rocketSound.isPlaying) {
            this.rocketSound.play();
        }
    }

    // limpa tudo (para reiniciar o jogo)
    reset() {
        clearTimeout(this._timer);
        this.rockets.forEach(r => this.scene.remove(r));
        this.rockets.length = 0;
        this._scheduleNext();

        if (this.rocketSound) {
            this.rocketSound.stop();
        }
    }
}

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
        this._initAudios();
        this._loadExplosionTexture();

        //> Pre loading all the gltf
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

    _loadExplosionTexture() {
        const textureLoader = new THREE.TextureLoader();
        this.explosionTexture = textureLoader.load(
            '/assets/textures/explosion.png',
            undefined,
            undefined,
            err => console.error('Error loading explosion texture:', err)
        );
    }

    _createExplosionEffect(position) {
        if (!this.explosionTexture) return;

        //> Creates material for the explosion sprite
        const spriteMaterial = new THREE.SpriteMaterial({
            map: this.explosionTexture,
            transparent: true,
            opacity: 1,
            alphaTest: 0.001
        });

        //> Create the sprite
        const explosionSprite = new THREE.Sprite(spriteMaterial);
        explosionSprite.scale.set(2, 2, 1);
        explosionSprite.position.copy(position);

        this.scene.add(explosionSprite);

        //> Removes after 1 second with fade effect
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05; //> Gradually reduces opacity
            spriteMaterial.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(explosionSprite);
                spriteMaterial.dispose();
                clearInterval(fadeInterval);
            }
        }, 50); //> Updates every 50ms for a smooth fade

        //> Guaranteed to remove after 1 second (if fade doesn't work)
        setTimeout(() => {
            if (explosionSprite.parent) {
                this.scene.remove(explosionSprite);
                spriteMaterial.dispose();
            }
        }, 1000);
    }

    _initAudios() {
        if ((localStorage.getItem('sound') ?? 'ON') === 'OFF') return;

        this.listener = new AudioListener();
        this.camera.add(this.listener);

        this.rocketSound = new Audio(this.listener);
        this.explosionSound = new Audio(this.listener);

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

        const explosionSoundLoader = new AudioLoader();
        explosionSoundLoader.load(
            '/assets/sounds/explosion.ogg',
            buffer => {
                this.explosionSound.setBuffer(buffer);
                this.explosionSound.setLoop(false);
                this.explosionSound.setVolume(0.5);
            },
            undefined,
            err => console.error('Error loading explosion sound:', err)
        );
    }

    //> Schedule the next spawn in 5–10s
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

        //> Scale and direction
        rocket.scale.set(scale, scale, scale);
        rocket.userData.rotationSpeed = Math.random() * 0.05 + 0.02;

        //> vision limits
        const H = 2 * this.camera.position.z * Math.tan((this.camera.fov/2)*(Math.PI/180));
        const halfH = H/2;
        const viewX = halfH * this.camera.aspect;
        const topY = halfH - 3;
        const botY = -halfH + 1;

        //> Random Y pos and X off screen
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

            //> Check collision
            const boxR = new THREE.Box3().setFromObject(r);
            const boxP = new THREE.Box3().setFromObject(this.player.group);
            if (boxR.intersectsBox(boxP)) {
                //> Creates explosion effect at missile position
                this._createExplosionEffect(r.position.clone());

                if (this.explosionSound) {
                    if (this.explosionSound.isPlaying) {
                        this.explosionSound.stop();
                    }
                    this.explosionSound.play();
                }

                //> Removes the missile from the scene and array upon collision
                this.scene.remove(r);
                this.rockets.splice(i, 1);

                //> Stop the sound if there are no more missiles
                if (this.rocketSound && this.rockets.length === 0) {
                    this.rocketSound.stop();
                }

                this.gameState.playerHit();

                continue;
            }

            //> Off-screen removal
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

    //> Clear everything (to restart the game)
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

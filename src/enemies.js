// enemies.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {AudioListener, AudioLoader, Audio} from 'three';

export class EnemiesManager {
    /**
     * @param {THREE.Scene} scene
     * @param {THREE.Camera} camera
     * @param {Player} player
     * @param {Object} gameState
     */
    constructor(scene, camera, player, gameState) {
        this.scene      = scene;
        this.camera     = camera;
        this.player     = player;
        this.gameState  = gameState;
        this.loader     = new GLTFLoader();
        this.ufoModel   = null;
        this.enemies    = [];
        this.maxEnemies = 2;
        this._initAudios();
        this._loadExplosionTexture();

        // carrega o modelo uma vez
        this.loader.load(
            '/assets/models/enemies/ufo_doodle.glb',
            gltf => {
                this.ufoModel = gltf.scene;
                console.log('✅ UFO model loaded!');
            },
            undefined,
            err => console.error('❌ Failed to load UFO model:', err)
        );
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

        const spriteMaterial = new THREE.SpriteMaterial({
            map: this.explosionTexture,
            transparent: true,
            opacity: 1,
            alphaTest: 0.001
        });

        const explosionSprite = new THREE.Sprite(spriteMaterial);
        explosionSprite.scale.set(2, 2, 1);
        explosionSprite.position.copy(position);

        this.scene.add(explosionSprite);

        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            spriteMaterial.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(explosionSprite);
                spriteMaterial.dispose();
                clearInterval(fadeInterval);
            }
        }, 50);

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

        this.laserSound = new Audio(this.listener);
        this.explosionSound = new Audio(this.listener);
        this.crashSound = new Audio(this.listener);

        const laserSoundLoader = new AudioLoader();
        laserSoundLoader.load(
            '/assets/sounds/laser_shoot.ogg',
            buffer => {
                this.laserSound.setBuffer(buffer);
                this.laserSound.setLoop(false);
                this.laserSound.setVolume(1);
            },
            undefined,
            err => console.error('Error loading laser sound:', err)
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

        const crashSoundLoader = new AudioLoader();
        crashSoundLoader.load(
            '/assets/sounds/crash.ogg',
            buffer => {
                this.crashSound.setBuffer(buffer);
                this.crashSound.setLoop(false);
                this.crashSound.setVolume(0.5);
            },
            undefined,
            err => console.error('Error loading crash sound:', err)
        );
    }

    // chama a cada frame, passando a velocidade do mundo
    update(worldSpeed) {
        if (!this.ufoModel) return;  // ainda carregando

        const H        = 2 * this.camera.position.z * Math.tan((this.camera.fov/2)*(Math.PI/180));
        const halfH    = H/2;
        const viewLimit= halfH * this.camera.aspect;

        // atualiza cada inimigo
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            // movimento
            e.position.y -= worldSpeed;
            // rotação da nave
            e.rotation.y += e.userData.rotationSpeed;

            // dispara laser aleatório (uma só vez)
            if (!e.userData.hasFiredLaser && Math.random() < 0.001) {
                this._fireLaser(e);
                e.userData.hasFiredLaser = true;
            }

            // checa colisão laser → player
            if (e.userData.laser && e.userData.laser.userData.active) {
                const boxL = new THREE.Box3().setFromObject(e.userData.laser);
                const boxP = new THREE.Box3().setFromObject(this.player.group);
                if (boxL.intersectsBox(boxP)) {
                    this._createExplosionEffect(this.player.group.position.clone());
                    if (this.explosionSound) {
                        if (this.explosionSound.isPlaying) {
                            this.explosionSound.stop();
                        }
                        this.explosionSound.play();
                    }

                    this.gameState.playerHit();

                    continue;
                }
            }

            // checa colisão nave → player
            const boxE = new THREE.Box3().setFromObject(e);
            const boxP2 = new THREE.Box3().setFromObject(this.player.group);
            if (boxE.intersectsBox(boxP2)) {
                this._createExplosionEffect(this.player.group.position.clone());
                if (this.crashSound) {
                    if (this.crashSound.isPlaying) {
                        this.crashSound.stop();
                    }
                    this.crashSound.play();
                }

                // Remove a nave inimiga da cena e do array
                this._removeEnemy(i);

                this.gameState.playerHit();

                continue;
            }

            // remove se saiu da tela
            if (e.position.y < -5) {
                this._removeEnemy(i);
            }
        }

        // cria novo se abaixo do máximo e nenhum acima do meio
        if (
            this.enemies.length < this.maxEnemies &&
            !this.enemies.some(e => e.position.y > 0)
        ) {
            this._spawnEnemy(viewLimit);
        }
    }

    reset() {
        this.enemies.forEach((e, i) => this._removeEnemy(i));
    }

    _spawnEnemy(viewLimit) {
        const enemy = this.ufoModel.clone(true);
        enemy.scale.set(0.05, 0.05, 0.05);
        enemy.position.x = (Math.random()*2 - 1) * viewLimit;
        enemy.position.y = 5;
        enemy.userData = {
            rotationSpeed: Math.random()*0.05 + 0.02,
            laser:         null,
            hasFiredLaser: false
        };
        this.scene.add(enemy);
        this.enemies.push(enemy);
    }

    _fireLaser(enemy) {
        // calcula alcance vertical do laser
        const H = 2 * this.camera.position.z * Math.tan((this.camera.fov/2)*(Math.PI/180));
        const laserLen  = enemy.position.y + H/2;
        const geometry= new THREE.CylinderGeometry(0.05, 0.05, laserLen, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const laser = new THREE.Mesh(geometry, material);

        laser.position.set(
            enemy.position.x,
            enemy.position.y - laserLen/2,
            enemy.position.z
        );
        laser.userData.active = false;
        enemy.userData.laser = laser;

        this.scene.add(laser);

        if (this.laserSound) {
            this.laserSound.play();
        }

        // ativa colisão no próximo frame
        setTimeout(() => laser.userData.active = true, 16);
        // remove após 50ms
        setTimeout(() => {
            this.scene.remove(laser);
            enemy.userData.laser = null;
        }, 50);
    }

    _removeEnemy(index) {
        const e = this.enemies[index];
        if (e.userData.laser) {
            this.scene.remove(e.userData.laser);
        }
        this.scene.remove(e);
        this.enemies.splice(index, 1);
    }
}

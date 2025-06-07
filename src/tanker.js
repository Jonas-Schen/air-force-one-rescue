import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {AudioListener, AudioLoader, Audio} from 'three';

export class TankerManager {
    constructor(scene, camera, player, gameState) {
        this.scene = scene;
        this.camera = camera;
        this.player = player;
        this.gameState = gameState;
        this.loader = new GLTFLoader();

        this.tankerPlane = null;
        this.tankerPlaneModel = null;
        this.isRefuelingActive = false;
        this.tankerPlaneLoaded = false;
        this.refuelingInProgress = false;
        this.isLoadingModel = false;
        this.refuelingConnectionDistance = 3.3;
        this.refuelRate = 3;
        this.refuelLimitRate = 98;

        this.tankerState = 'IDLE';

        this.approachElapsedTime = 0;
        this.positionedElapsedTime = 0;
        this.departElapsedTime = 0;
        this.floatElapsedTime = 0;

        this.approachDuration = 4;
        this.departDuration = 3;

        // Sistema de timeout
        this.refuelingTimeout = 10;

        // ✅ Sistema de cooldown
        this.cooldownDuration = 60;
        this.cooldownElapsedTime = 0;
        this.isInCooldown = false;

        this.isPaused = false;

        // Posições E ROTAÇÕES para animação
        this.startPosition = { x: -25, y: 2, z: -5 };
        this.targetPosition = { x: 0, y: -3, z: -3 };
        this.departPosition = { x: 25, y: 2, z: -5 };

        // Rotações para cada fase da animação
        this.startRotation = { x: -2, y: -Math.PI, z: 0 };
        this.targetRotation = { x: 0, y: -Math.PI / 2, z: 0 };
        this.departRotation = { x: 2, y: -Math.PI, z: 0 };

        this._initAudios();
    }

    _initAudios() {
        if ((localStorage.getItem('sound') ?? 'ON') === 'OFF') return;

        this.listener = new AudioListener();
        this.camera.add(this.listener);

        this.fillingSound = new Audio(this.listener);
        this.tankerSound = new Audio(this.listener);

        const fillingSoundLoader = new AudioLoader();
        fillingSoundLoader.load(
            '/assets/sounds/filling.ogg',
            buffer => {
                this.fillingSound.setBuffer(buffer);
                this.fillingSound.setLoop(false);
                this.fillingSound.setVolume(0.3);
            },
            undefined,
            err => console.error('Error loading filling sound:', err)
        );

        const tankerSoundLoader = new AudioLoader();
        tankerSoundLoader.load(
            '/assets/sounds/tanker.ogg',
            buffer => {
                this.tankerSound.setBuffer(buffer);
                this.tankerSound.setLoop(false);
                this.tankerSound.setVolume(1);
            },
            undefined,
            err => console.error('Error loading tanker sound:', err)
        );
    }

    /**
     * Carrega o modelo do avião de reabastecimento sob demanda
     */
    _loadRefuelingPlane() {
        return new Promise((resolve, reject) => {
            if (this.tankerPlaneLoaded || this.isLoadingModel) {
                resolve();
                return;
            }

            this.isLoadingModel = true;

            this.loader.load(
                '/assets/models/airplanes/lockheed_s3_viking.glb',
                (gltf) => {
                    this.tankerPlaneModel = gltf.scene.clone();

                    this.tankerPlaneModel.scale.set(0.2, 0.2, 0.2);
                    this.tankerPlaneModel.rotation.set(0, -Math.PI / 2, 0);

                    this.tankerPlaneLoaded = true;
                    this.isLoadingModel = false;

                    resolve();
                },
                undefined,
                (error) => {
                    this.isLoadingModel = false;
                    console.error('❌ Error loading refueling plane model:', error);
                    reject(error);
                }
            );
        });
    }

    update(deltaTime) {
        if (this.isPaused) {
            return;
        }

        const clampedDeltaTime = Math.min(deltaTime, 0.033); // Máximo 33ms (30fps)

        this._updateCooldown(clampedDeltaTime);

        if (!this.isRefuelingActive &&
            !this.isInCooldown &&
            this.gameState.fuelLevel <= this.refuelLimitRate
        ) {
            this._tryActivateRefueling();
        }

        if (this.isRefuelingActive && this.tankerPlane) {
            this._updateTankerState(clampedDeltaTime);
        }
    }

    /**
     * ✅ Atualiza o sistema de cooldown
     */
    _updateCooldown(deltaTime) {
        if (!this.isInCooldown) return;

        this.cooldownElapsedTime += deltaTime;

        const remainingTime = this.cooldownDuration - this.cooldownElapsedTime;
        if (Math.floor(this.cooldownElapsedTime) % 10 === 0 &&
            Math.floor(this.cooldownElapsedTime - deltaTime) % 10 !== 0) {
        }

        if (this.cooldownElapsedTime >= this.cooldownDuration) {
            this._endCooldown();
        }
    }

    /**
     * ✅ Inicia o período de cooldown
     */
    _startCooldown() {
        this.isInCooldown = true;
        this.cooldownElapsedTime = 0;
    }

    /**
     * ✅ Termina o período de cooldown
     */
    _endCooldown() {
        this.isInCooldown = false;
        this.cooldownElapsedTime = 0;
    }

    async _tryActivateRefueling() {
        if (this.isRefuelingActive || this.isLoadingModel || this.isInCooldown) {
            return;
        }

        try {
            if (!this.tankerPlaneLoaded) {
                await this._loadRefuelingPlane();
            }

            this._startTankerApproach();
        } catch (error) {
            console.error('❌ Failed to activate refueling system:', error);
        }
    }

    /**
     * Inicia a aproximação do tanker
     */
    _startTankerApproach() {
        if (!this.tankerPlaneModel || this.isRefuelingActive) return;

        if (this.tankerSound) {
            this.tankerSound.play();
        }

        this.approachElapsedTime = 0;
        this.positionedElapsedTime = 0;
        this.departElapsedTime = 0;
        this.floatElapsedTime = 0;

        // Clona o modelo e configura posição E rotação inicial
        this.tankerPlane = this.tankerPlaneModel.clone();

        this.tankerPlane.position.set(
            this.startPosition.x,
            this.startPosition.y,
            this.startPosition.z
        );

        this.tankerPlane.rotation.set(
            this.startRotation.x,
            this.startRotation.y,
            this.startRotation.z
        );

        this.scene.add(this.tankerPlane);

        this.tankerState = 'APPROACHING';
        this.isRefuelingActive = true;
    }

    /**
     * ✅ Atualiza o estado e animação do tanker usando deltaTime
     */
    _updateTankerState(deltaTime) {
        this.floatElapsedTime += deltaTime;

        switch (this.tankerState) {
            case 'APPROACHING':
                this._updateApproachAnimation(deltaTime);
                break;
            case 'POSITIONED':
                this._updatePositionedState(deltaTime);
                break;
            case 'REFUELING':
                this._updateRefuelingState(deltaTime);
                break;
            case 'DEPARTING':
                this._updateDepartAnimation(deltaTime);
                break;
        }
    }

    /**
     * ✅ Anima a aproximação do tanker usando deltaTime
     */
    _updateApproachAnimation(deltaTime) {
        this.approachElapsedTime += deltaTime;
        const progress = Math.min(this.approachElapsedTime / this.approachDuration, 1);

        const easeProgress = this._easeInOutCubic(progress);

        this.tankerPlane.position.x = this._lerp(
            this.startPosition.x,
            this.targetPosition.x,
            easeProgress
        );
        this.tankerPlane.position.y = this._lerp(
            this.startPosition.y,
            this.targetPosition.y,
            easeProgress
        );
        this.tankerPlane.position.z = this._lerp(
            this.startPosition.z,
            this.targetPosition.z,
            easeProgress
        );

        this.tankerPlane.rotation.x = this._lerp(
            this.startRotation.x,
            this.targetRotation.x,
            easeProgress
        );
        this.tankerPlane.rotation.y = this._lerp(
            this.startRotation.y,
            this.targetRotation.y,
            easeProgress
        );
        this.tankerPlane.rotation.z = this._lerp(
            this.startRotation.z,
            this.targetRotation.z,
            easeProgress
        );

        if (progress >= 1) {
            this.tankerState = 'POSITIONED';
            this.positionedElapsedTime = 0;
        }
    }

    /**
     * ✅ Estado quando o tanker está posicionado esperando o jogador
     */
    _updatePositionedState(deltaTime) {
        if (!this.player) return;

        this.positionedElapsedTime += deltaTime;

        this._addTankerFloatAnimation();

        // Verifica timeout
        if (this.positionedElapsedTime >= this.refuelingTimeout) {
            this._startTankerDeparture();

            return;
        }

        const playerPos = this.player.group.position;
        const refuelingPos = this.tankerPlane.position;

        const distance = playerPos.distanceTo(refuelingPos);
        const isInPosition = this._isPlayerInRefuelingPosition(playerPos, refuelingPos);

        if (isInPosition && distance <= this.refuelingConnectionDistance) {
            this._playFillingSound()

            this.tankerState = 'REFUELING';
            this.refuelingInProgress = true;
        }
    }

    _playFillingSound() {
        if (this.fillingSound && !this.fillingSound.isPlaying) {
            this.fillingSound.play();
        }
    }

    _stopFillingSound() {
        if (this.fillingSound && this.fillingSound.isPlaying) {
            this.fillingSound.stop();
        }
    }

    /**
     * ✅ Estado de reabastecimento ativo
     */
    _updateRefuelingState(deltaTime) {
        if (!this.player) return;

        this.positionedElapsedTime += deltaTime;

        this._addTankerFloatAnimation();

        if (this.positionedElapsedTime >= this.refuelingTimeout) {
            this._startTankerDeparture();

            return;
        }

        const playerPos = this.player.group.position;
        const refuelingPos = this.tankerPlane.position;

        const distance = playerPos.distanceTo(refuelingPos);
        const isInPosition = this._isPlayerInRefuelingPosition(playerPos, refuelingPos);

        if (isInPosition && distance <= this.refuelingConnectionDistance) {
            this._processRefueling(deltaTime);

            if (this.gameState.fuelLevel >= 100) {
                this._startTankerDeparture();
            }
        } else {
            this.tankerState = 'POSITIONED';
            this.refuelingInProgress = false;
            this._stopFillingSound();
        }
    }

    /**
     * Função melhorada para detectar posição de reabastecimento
     */
    _isPlayerInRefuelingPosition(playerPos, refuelingPos) {
        const relativeX = playerPos.x - refuelingPos.x;
        const relativeY = playerPos.y - refuelingPos.y;
        const relativeZ = playerPos.z - refuelingPos.z;

        const absX = Math.abs(relativeX);
        const absY = Math.abs(relativeY);

        const isXAligned = absX < 1.5;
        const isYAligned = absY < 1.2;
        const isBehindTanker = relativeZ > 0.5;

        return isXAligned && isYAligned && isBehindTanker;
    }

    /**
     * Inicia a saída do tanker (com motivo)
     */
    _startTankerDeparture() {
        if (this.tankerSound) {
            if (this.tankerSound.isPlaying) {
                this.tankerSound.stop();
            }
            this.tankerSound.play();
        }

        this.tankerState = 'DEPARTING';
        this.refuelingInProgress = false;
        this._stopFillingSound();
        this.departElapsedTime = 0;
    }

    /**
     * ✅ Anima a saída do tanker usando deltaTime
     */
    _updateDepartAnimation(deltaTime) {
        this.departElapsedTime += deltaTime;
        const progress = Math.min(this.departElapsedTime / this.departDuration, 1);

        const easeProgress = this._easeInOutCubic(progress);

        this.tankerPlane.position.x = this._lerp(
            this.targetPosition.x,
            this.departPosition.x,
            easeProgress
        );
        this.tankerPlane.position.y = this._lerp(
            this.targetPosition.y,
            this.departPosition.y,
            easeProgress
        );
        this.tankerPlane.position.z = this._lerp(
            this.targetPosition.z,
            this.departPosition.z,
            easeProgress
        );

        this.tankerPlane.rotation.x = this._lerp(
            this.targetRotation.x,
            this.departRotation.x,
            easeProgress
        );
        this.tankerPlane.rotation.y = this._lerp(
            this.targetRotation.y,
            this.departRotation.y,
            easeProgress
        );
        this.tankerPlane.rotation.z = this._lerp(
            this.targetRotation.z,
            this.departRotation.z,
            easeProgress
        );

        if (progress >= 1) {
            this._deactivateRefueling();
        }
    }

    /**
     * ✅ Adiciona animação de flutuação ao tanker usando tempo acumulado
     */
    _addTankerFloatAnimation() {
        if (!this.tankerPlane) return;

        const floatAmplitude = 0.3;
        const floatSpeed = 1.5;

        const floatOffset = Math.sin(this.floatElapsedTime * floatSpeed) * floatAmplitude;

        this.tankerPlane.position.y = this.targetPosition.y + floatOffset;
    }

    /**
     * Função de interpolação linear
     */
    _lerp(start, end, progress) {
        return start + (end - start) * progress;
    }

    /**
     * Função de easing para animação suave
     */
    _easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    _processRefueling(deltaTime) {
        const fuelToAdd = this.refuelRate * deltaTime;
        this.gameState.fuelLevel = Math.min(100, this.gameState.fuelLevel + fuelToAdd);
    }

    _deactivateRefueling() {
        if (this.tankerPlane) {
            this.scene.remove(this.tankerPlane);
            this.tankerPlane = null;
        }

        this.isRefuelingActive = false;
        this.refuelingInProgress = false;
        this._stopFillingSound();
        this.tankerState = 'IDLE';

        this._startCooldown();

        this.approachElapsedTime = 0;
        this.positionedElapsedTime = 0;
        this.departElapsedTime = 0;
        this.floatElapsedTime = 0;
    }

    reset() {
        if (this.tankerPlane) {
            this.scene.remove(this.tankerPlane);
            this.tankerPlane = null;
        }

        this.isRefuelingActive = false;
        this.refuelingInProgress = false;
        this._stopFillingSound();
        this.tankerState = 'IDLE';

        this.approachElapsedTime = 0;
        this.positionedElapsedTime = 0;
        this.departElapsedTime = 0;
        this.floatElapsedTime = 0;

        this.isInCooldown = false;
        this.cooldownElapsedTime = 0;
    }

    dispose() {
        this.reset();

        if (this.tankerPlaneModel) {
            this.tankerPlaneModel.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
            this.tankerPlaneModel = null;
        }

        this.tankerPlaneLoaded = false;
        this.isLoadingModel = false;
    }

    get inProgress() { return this.refuelingInProgress; }
}

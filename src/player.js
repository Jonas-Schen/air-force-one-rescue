import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
    constructor(scene, onModelLoaded) {
        this.group = new THREE.Group();
        this.scene = scene;
        this.elapsedTime = 0; // For idle animation timing
        this.loadModel(onModelLoaded);
        this.currentPositionY = -2.5;
        scene.add(this.group);
    }

    loadModel(onModelLoaded) {
        const loader = new GLTFLoader();
        loader.load(
            '/assets/models/airplanes/air_force_one_-_boeing_747_vc-25ab.glb',
            (gltf) => {
                const model = gltf.scene;

                model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = false;
                        child.material.opacity = 1;
                        child.material.depthWrite = true;
                        child.material.needsUpdate = true;
                    }
                });

                model.scale.set(0.2, 0.2, 0.2);
                model.position.set(0, -2, 0);
                model.rotation.y = Math.PI;

                this.model = model; // Save reference for animations
                this.group.add(model);

                if (onModelLoaded) onModelLoaded();
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
            }
        );
    }

    move(playerDirection, speed, viewLimitX, lowerLimitY, upperLimitY) {
        switch (playerDirection) {
            case 'left': this.group.position.x -= speed; break;
            case 'right': this.group.position.x += speed; break;
            case 'up': this.currentPositionY += speed; break;
            case 'down': this.currentPositionY -= speed; break;
        }

        // Limita movimentação horizontal
        this.group.position.x = Math.max(Math.min(this.group.position.x, viewLimitX), -viewLimitX);

        // Limita movimentação vertical
        this.currentPositionY = Math.max(Math.min(this.currentPositionY, upperLimitY), lowerLimitY);

        const targetRotationZ = playerDirection === 'left' ? 0.5 : playerDirection === 'right' ? -0.5 : 0;
        this.group.rotation.z += (targetRotationZ - this.group.rotation.z) * 0.1;
    }

    update(playerDirection, deltaTime, isMoving, isAccelerating, isDecelerating) {
        this.elapsedTime += deltaTime;

        // Flutuação suave (idle animation)
        const floatAmplitude = 0.2;
        const floatSpeed = 2;
        this.group.position.y = this.currentPositionY + Math.sin(this.elapsedTime * floatSpeed) * floatAmplitude;

        // ✅ Animação de inclinar o bico (Pitch)
        let targetRotationX = 0;

        if (playerDirection === 'up') {
            targetRotationX = 0.35;   //> Bico sobe (seta ↑)
        } if (playerDirection === 'down') {
            targetRotationX = -0.35;  //> Bico desc (seta ↑)
        } else if (isAccelerating) {
            targetRotationX = -0.15;  //> Bico sobe (tecla a)
        } else if (isDecelerating) {
            targetRotationX = 0.15;   //> Bico desce (tecla z)
        }

        // Suavizar a transição de movimento
        this.group.rotation.x += (targetRotationX - this.group.rotation.x) * 0.1;

        // ✅ Correção de rotação no eixo Z (lateral)
        if (!isMoving) {
            this.group.rotation.z += (0 - this.group.rotation.z) * 0.1;
        }
    }
}

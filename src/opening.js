import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import gsap from 'gsap';
import { Player } from './player.js';
import fontJson from 'three/examples/fonts/optimer_regular.typeface.json';
import {AudioListener, AudioLoader, Audio} from 'three';

export class Opening {
    /**
     * @param {HTMLElement} container  — elemento onde o canvas será inserido (ex: document.body)
     * @param {Function}    onFinish   — callback chamado após clearScene()
     */
    constructor(container, onFinish = () => {
    }) {
        this.container = container;
        this.onFinish = onFinish;

        this.letters = [];
        this.scales = [];

        this._setupScene();
        this._initBackground();
        this._initLights();
        this._initPlayer();
        this._initText();
        this._initAudios();

        window.addEventListener('resize', this._onResize.bind(this));
    }

    _setupScene() {
        // cena, câmera e renderer
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this._animate();
    }

    _initBackground() {
        const loader = new THREE.TextureLoader();
        loader.load(
            '/assets/textures/opening.png',
            tex => { this.scene.background = tex; },
            undefined,
            err => console.error('Erro ao carregar background:', err)
        );
    }

    _initLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(5, 10, 7);
        this.scene.add(dir);
    }

    _initPlayer() {
        this.player = new Player(this.scene, () => {
            this.player.group.position.set(0, -30, -50);
            this.player.group.rotation.y = Math.PI;
        });
    }

    _initText() {
        const fontLoader = new FontLoader();
        const font = fontLoader.parse(fontJson);

        const title = "AIR FORCE ONE RESCUE";
        const radius = 10;
        const step = -Math.PI / (title.length - 1);
        const midIndex = (title.length - 1) / 2;
        const amplitude = 5;

        const material = new THREE.MeshStandardMaterial({
            color: 0x00ccff,
            emissive: 0x002244,
            roughness: 0.5,
            metalness: 0.3
        });

        // criar as letras
        title.split('').forEach((char, i) => {
            const geo = new TextGeometry(char, {
                font,
                size: 1.2,
                depth: 0.15,
                curveSegments: 6,
                bevelEnabled: false
            });
            geo.computeBoundingBox();
            geo.center();

            const mesh = new THREE.Mesh(geo, material);
            const angle = -Math.PI + i * step;

            mesh.position.set(
                Math.cos(angle) * radius * 1.4,
                Math.sin(angle) * radius / 2,
                amplitude * Math.abs((i - midIndex) / midIndex)
            );

            this.scene.add(mesh);
            this.letters.push(mesh);
            this.scales.push(mesh.scale);
        });
    }

    _initAudios() {
        if ((localStorage.getItem('sound') ?? 'ON') === 'OFF') return;

        this.listener = new AudioListener();
        this.camera.add(this.listener);

        this.alienSound = new Audio(this.listener);
        this.planeSound = new Audio(this.listener);

        const alienSoundLoader = new AudioLoader();
        alienSoundLoader.load(
            '/assets/sounds/opening_alien.ogg',
            buffer => {
                this.alienSound.setBuffer(buffer);
                this.alienSound.setLoop(false);
                this.alienSound.setVolume(1);
                this.alienSound.play();
            },
            undefined,
            err => console.error('Error loading alien sound:', err)
        );

        const planeSoundLoader = new AudioLoader();
        planeSoundLoader.load(
            '/assets/sounds/opening_plane.ogg',
            buffer => {
                this.planeSound.setBuffer(buffer);
                this.planeSound.setLoop(false);
                this.planeSound.setVolume(1);
            },
            undefined,
            err => console.error('Error loading plane sound:', err)
        );
    }

    start() {
        // animação de entrada + sequência de explosão e limpeza
        gsap.from(this.scales, {
            duration: 1,
            x: 6,
            y: 6,
            z: 5,
            stagger: 0.05,
            ease: "back.out(1.7)",
            onComplete: () => {
                if (this.planeSound) {
                    this.planeSound.play();
                }

                gsap.to(this.player.group.position, {
                    z: 20,
                    y: 5,
                    duration: 5,
                    ease: "power2.out"
                });
                gsap.to(this.player.group.rotation, {
                    x: -Math.PI / 4,
                    duration: 5,
                    ease: "power2.out"
                });

                // explode letras
                gsap.delayedCall(2.75, this._explodeLetters.bind(this));

                // limpa cena e finaliza
                gsap.delayedCall(5, () => {
                    this._clearScene();
                    this.onFinish();
                });
            }
        });
    }

    _explodeLetters() {
        this.letters.forEach(mesh => {
            const dir = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            gsap.to(mesh.position, {
                x: mesh.position.x + dir.x * 15,
                y: mesh.position.y + dir.y * 15,
                z: mesh.position.z + dir.z * 15,
                duration: 2,
                ease: "power3.out"
            });
            gsap.to(mesh.rotation, {
                x: Math.random() * Math.PI * 2,
                y: Math.random() * Math.PI * 2,
                z: Math.random() * Math.PI * 2,
                duration: 2,
                ease: "power3.out"
            });
            gsap.to(mesh.scale, {
                x: 0.1,
                y: 0.1,
                z: 0.1,
                duration: 2,
                ease: "power3.out"
            });
        });
    }

    _disposeNode(node) {
        if (node.isMesh) {
            node.geometry?.dispose();
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach(material => {
                Object.values(material).forEach(val => val?.isTexture && val.dispose());
                material.dispose();
            });
        }
        node.children?.forEach(child => this._disposeNode(child));
    }

    _clearScene() {
        if (this.scene.background && this.scene.background.isTexture) {
            this.scene.background.dispose();
            this.scene.background = null;
        }

        // remove e libera todos os filhos da cena
        this.scene.children.slice().forEach(child => {
            this.scene.remove(child);
            this._disposeNode(child);
        });

        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }

        if (this.alienSound) {
            this.alienSound.stop();
        }

        if (this.planeSound) {
            this.planeSound.stop();
        }
    }

    _animate() {
        requestAnimationFrame(this._animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

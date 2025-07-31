import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import gsap from 'gsap';
import {AudioListener, AudioLoader, Audio} from 'three';
import { i18n } from './i18n.js';

export class Credits {
    /**
     * @param {HTMLElement} container
     */
    constructor(container) {
        this.container = container;
        this.lines = this._getLines();

        //> Default settings
        this.fontSize = 0.5;
        this.color = 0xfcd639;
        this.scrollDuration = 90;
        this.tiltAngle = -Math.PI / 4;
        this.lineSpacing = 1.5;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        //> Position the camera from the front, slightly above, and tilt it to “look down”
        this.camera.position.set(0, 5, 15);
        this.camera.rotation.x = -this.tiltAngle;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        //> Group that will contain all lines of text
        this.textGroup = new THREE.Group();
        this.scene.add(this.textGroup);

        //> Flags and resources
        this.font = null;
        this.textMeshes = [];
        this._loaded = false;

        const fontLoader = new FontLoader();
        fontLoader.load(i18n.getFontByLanguage(), fontType => {
            this.font = fontType;

            this._createTextMeshes();
            this._initBackground();
            this._initAudio();
            this._start();
        });

        //> Bind to resize
        window.addEventListener('resize', this._onResize.bind(this));
    }

    _initBackground() {
        const loader = new THREE.TextureLoader();
        loader.load(
            '/assets/textures/credits.png',
            tex => { this.scene.background = tex; },
            undefined,
            err => console.error('Error loading background:', err)
        );
    }

    _initAudio() {
        if ((localStorage.getItem('sound') ?? 'ON') === 'OFF') return;

        this.listener = new AudioListener();
        this.camera.add(this.listener);

        this.creditsSound = new Audio(this.listener);

        const creditsSoundLoader = new AudioLoader();
        creditsSoundLoader.load(
            '/assets/sounds/credits.ogg',
            buffer => {
                this.creditsSound.setBuffer(buffer);
                this.creditsSound.setLoop(false);
                this.creditsSound.setVolume(1);
                this.creditsSound.play();
            },
            undefined,
            err => console.error('Error loading credits sound:', err)
        );
    }

    _getLines() {
        return [
            '[1]Air Force One Rescue',
            '',
            `${i18n.t('createdBy')}:`,
            '[0.75]Jonas Schen',
            '',
            i18n.t('creditsLine1'),
            i18n.t('creditsLine2'),
            i18n.t('creditsLine3'),
            i18n.t('creditsLine4'),
            i18n.t('creditsLine5'),
            i18n.t('creditsLine6'),
            i18n.t('creditsLine7'),
            i18n.t('creditsLine8'),
            '',
            `[1]${i18n.t('inGodWeTrust')}!`,
            '',
            '',
            `${i18n.t('soundsLibrary')}:`,
            'https://mixkit.co/',
            '',
            '',
            `${i18n.t('modelsLibrary')}:`,
            'https://sketchfab.com',
            '',
            `${i18n.t('airplane')}: Air Force One`,
            `${i18n.t('createdBy')}: bohmerang`,
            'https://sketchfab.com/3d-models/air-force-one-boeing-747-vc-25ab-327154ad78154f8f9c0ec7169fd4820c',
            '',
            `${i18n.t('airplane')}: Airplane Lockheed S3`,
            `${i18n.t('createdBy')}: helijah`,
            'https://sketchfab.com/3d-models/lockheed-s3-viking-3808810635e94d0093702502af72d35d',
            '',
            `${i18n.t('alienSpaceships')}:`,
            `${i18n.t('createdBy')}: re1monsen`,
            'https://sketchfab.com/3d-models/ufo-doodle-d78d1fff4fdd450791726b3c93a02fdb',
            '',
            `${i18n.t('missile')} AIM-9`,
            `${i18n.t('createdBy')}: rickslash`,
            'https://sketchfab.com/3d-models/aim-9-missile-caaf15b49bac4144b6c6be577c2b872a',
            '',
            `${i18n.t('missile')} AIM-120 Amraam`,
            `${i18n.t('createdBy')}: rickslash`,
            'https://sketchfab.com/3d-models/aim-120-amraam-missile-e52d37a110004e1480465bc6b0943ebc',
            '',
            `${i18n.t('missile')} Mica anti aircraft`,
            `${i18n.t('createdBy')}: the9thearl`,
            'https://sketchfab.com/3d-models/mica-anti-aircraft-missile-free-146954581f6146378bb1f4c55022ae6c',
            '',
            `${i18n.t('missile')} Fateh 110`,
            `${i18n.t('createdBy')}: Mehdi Shahsavan`,
            'https://sketchfab.com/3d-models/missile-fateh-110-5da58f2682aa4d07bd030fc5f77652a0',
            '',
            `${i18n.t('missile')} Sci-fi`,
            `${i18n.t('createdBy')}: robnewman76`,
            'https://sketchfab.com/3d-models/sci-fi-missile-1be9ec86a68d4657920fec178be1626c',
            '',
            `${i18n.t('missile')} Simple rocket`,
            `${i18n.t('createdBy')}: Mehdi Shahsavan`,
            'https://sketchfab.com/3d-models/rocket-7ac80b6d4701415a85e492ec24185a21',
            '',
            i18n.t('allImagesAi'),
        ];
    }

    _createTextMeshes() {
        if (!this.font) return;

        const materialMain = new THREE.MeshBasicMaterial({ color: this.color });
        const lineCount = this.lines.length;
        const totalHeight = lineCount * this.fontSize + (this.lineSpacing * 2);
        let yCursor = -totalHeight;

        //> Iterates through the array backwards:
        for (let idx = 0; idx < lineCount; idx++) {
            //> Take the line taking into account the inversion
            const line = this.lines[lineCount - 1 - idx];
            let text = line;
            let fontSize = this.fontSize;
            if (text.startsWith('[')) {
                text = text.substring(text.indexOf(']')+1, text.length);
                fontSize = parseFloat(line.substring(line.indexOf('[')+1, line.indexOf(']')));
            }

            const geo = new TextGeometry(text, {
                font: this.font,
                size: fontSize,
                depth: 0.1,
                curveSegments: 4,
                bevelEnabled: false
            });
            geo.computeBoundingBox();
            geo.center();

            const offsetX = 0.02;
            const offsetY = 0.02;
            const offsetZ = -0.01;

            const shadowMat1 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
            const shadow1    = new THREE.Mesh(geo.clone(), shadowMat1);
            shadow1.position.set(offsetX, yCursor - offsetY, offsetZ);
            this.textGroup.add(shadow1);

            const shadowMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
            const shadow2    = new THREE.Mesh(geo.clone(), shadowMat2);
            shadow2.position.set(offsetX * 2, yCursor - offsetY * 2, offsetZ - 0.005);
            this.textGroup.add(shadow2);

            const mainMesh = new THREE.Mesh(geo, materialMain);
            mainMesh.position.set(0, yCursor, 0);
            this.textGroup.add(mainMesh);
            this.textMeshes.push(mainMesh);

            yCursor += this.fontSize * this.lineSpacing;
        }

        this._loaded = true;
    }

    _start() {
        this.container.style.display = 'block';

        if (!this._loaded) {
            console.warn('Font not loaded yet – try calling start() after a few ms.');
            return;
        }
        //> Final position of the group: all lines must rise until they exit through the top of the camera
        //> Assuming the camera “sees” something like Y ≈ +5 at the top (it depends on FOV),
        //> Calculate a large enough Y offset:
        let finalOffsetY = (this.lines.length * this.fontSize * this.lineSpacing) * 2;

        //> Anima a posição Y do grupo de texto
        gsap.fromTo(
            this.textGroup.position,
            { y: 0 },
            {
                y: finalOffsetY,
                duration: this.scrollDuration,
                ease: 'none',
                onUpdate: () => {
                    //> At each frame the text moves; we render
                    this.renderer.render(this.scene, this.camera);
                },
                onComplete: () => {
                    this._clearScene();
                }
            }
        );
    }

    _clearScene() {
        //> Remove and dispose of meshes
        this.textMeshes.forEach(mesh => {
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.textGroup.remove(mesh);
        });
        this.textMeshes.length = 0;

        //> Remove the group from the scene
        this.scene.remove(this.textGroup);

        //> Dispose of the scene and renderer
        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }

        if (this.creditsSound) {
            this.creditsSound.stop();
        }

        //> Hides the credits container
        this.container.style.display = 'none';

        const menuOverlay = document.getElementsByClassName('menu-overlay');
        if (menuOverlay) {
            menuOverlay[0].style.display = 'flex';
        }
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

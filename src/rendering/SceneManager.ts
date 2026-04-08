import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CAMERA_DISTANCE = 350;
const CAMERA_ANGLE = Math.PI / 4;
const MIN_POLAR = Math.PI / 8;
const MAX_POLAR = Math.PI / 2.5;
const AUTO_FOLLOW_LERP = 0.03;
const RELEASE_RETURN_DELAY = 1500;
const MINIMAP_SIZE = 200;
const MINIMAP_PAD = 14;

export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private fpCamera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private followTarget: { x: number; z: number } | null = null;
  private followRotation: number = 0;
  private userOrbiting = false;
  private orbitReleaseTime = 0;
  private _firstPerson = false;

  get isFirstPerson(): boolean { return this._firstPerson; }

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x0a1a0d);
    this.renderer.autoClear = false;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a1a0d, 800, 1600);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 1, 3000);
    this.camera.position.set(0, Math.sin(CAMERA_ANGLE) * CAMERA_DISTANCE, Math.cos(CAMERA_ANGLE) * CAMERA_DISTANCE);
    this.camera.lookAt(0, 0, 0);

    this.fpCamera = new THREE.PerspectiveCamera(75, aspect, 0.5, 2000);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.mouseButtons = {
      LEFT: -1 as THREE.MOUSE,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 800;
    this.controls.minPolarAngle = MIN_POLAR;
    this.controls.maxPolarAngle = MAX_POLAR;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    this.controls.addEventListener('start', () => { this.userOrbiting = true; });
    this.controls.addEventListener('end', () => {
      this.userOrbiting = false;
      this.orbitReleaseTime = performance.now();
    });

    this.setupLighting();
    this.createSwampFloor();
    window.addEventListener('resize', () => this.onResize());
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffd59e, 0.6);
    this.scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffecd2, 0.8);
    directional.position.set(50, 100, 30);
    this.scene.add(directional);
  }

  private createSwampFloor(): void {
    const geometry = new THREE.PlaneGeometry(3000, 3000);
    const material = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    this.scene.add(floor);
  }

  private onResize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.fpCamera.aspect = aspect;
    this.fpCamera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  toggleView(): void {
    this._firstPerson = !this._firstPerson;
    this.controls.enabled = !this._firstPerson;
  }

  setFollowTarget(x: number, z: number): void {
    this.followTarget = { x, z };
  }

  setFollowRotation(rotation: number): void {
    this.followRotation = rotation;
  }

  private updateOverhead(): void {
    if (this.followTarget) {
      this.controls.target.set(this.followTarget.x, 0, this.followTarget.z);
    }

    if (!this.userOrbiting && performance.now() - this.orbitReleaseTime > RELEASE_RETURN_DELAY) {
      const desiredAzimuth = this.followRotation;
      const current = this.controls.getAzimuthalAngle();
      let diff = desiredAzimuth - current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const spherical = new THREE.Spherical().setFromVector3(
        this.camera.position.clone().sub(this.controls.target)
      );
      spherical.theta += diff * AUTO_FOLLOW_LERP;
      const newPos = new THREE.Vector3().setFromSpherical(spherical).add(this.controls.target);
      this.camera.position.copy(newPos);
    }

    this.controls.update();
  }

  private updateFP(): void {
    if (!this.followTarget) return;
    const fwd = new THREE.Vector3(
      -Math.sin(this.followRotation), 0, -Math.cos(this.followRotation)
    );
    this.fpCamera.position.set(this.followTarget.x, 4, this.followTarget.z);
    const lookAt = new THREE.Vector3().copy(this.fpCamera.position)
      .add(fwd.multiplyScalar(100));
    this.fpCamera.lookAt(lookAt);
  }

  render(): void {
    this.updateOverhead();
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.renderer.clear();

    if (this._firstPerson) {
      this.updateFP();
      this.renderer.setViewport(0, 0, w, h);
      this.renderer.setScissor(0, 0, w, h);
      this.renderer.setScissorTest(false);
      this.renderer.render(this.scene, this.fpCamera);

      this.renderer.setScissorTest(true);
      this.renderer.setViewport(w - MINIMAP_SIZE - MINIMAP_PAD, MINIMAP_PAD, MINIMAP_SIZE, MINIMAP_SIZE);
      this.renderer.setScissor(w - MINIMAP_SIZE - MINIMAP_PAD, MINIMAP_PAD, MINIMAP_SIZE, MINIMAP_SIZE);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setScissorTest(false);
      this.renderer.setViewport(0, 0, w, h);
    } else {
      this.renderer.setViewport(0, 0, w, h);
      this.renderer.render(this.scene, this.camera);
    }
  }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CAMERA_LERP_SPEED = 0.08;
const CAMERA_DISTANCE = 350;
const CAMERA_ANGLE = Math.PI / 4;
const MIN_POLAR = Math.PI / 8;
const MAX_POLAR = Math.PI / 2.5;

export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private followTarget: { x: number; z: number } | null = null;
  private cameraOffset: THREE.Vector3;

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x0a1a0d);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a1a0d, 800, 1600);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 1, 3000);

    this.cameraOffset = new THREE.Vector3(
      0,
      Math.sin(CAMERA_ANGLE) * CAMERA_DISTANCE,
      Math.cos(CAMERA_ANGLE) * CAMERA_DISTANCE
    );
    this.camera.position.copy(this.cameraOffset);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.mouseButtons = {
      LEFT: -1 as THREE.MOUSE,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.controls.enableZoom = true;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 800;
    this.controls.minPolarAngle = MIN_POLAR;
    this.controls.maxPolarAngle = MAX_POLAR;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

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
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setFollowTarget(x: number, z: number): void {
    this.followTarget = { x, z };
  }

  update(): void {
    if (this.followTarget) {
      const target = this.controls.target;
      target.x += (this.followTarget.x - target.x) * CAMERA_LERP_SPEED;
      target.z += (this.followTarget.z - target.z) * CAMERA_LERP_SPEED;
    }
    this.controls.update();
  }

  render(): void {
    this.update();
    this.renderer.render(this.scene, this.camera);
  }
}

import * as THREE from 'three';

const ZOOM = 1;
const CAMERA_LERP_SPEED = 0.08;

export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  private followTarget: { x: number; z: number } | null = null;

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    const viewHeight = 800 / ZOOM;
    const viewWidth = viewHeight * aspect;

    this.camera = new THREE.OrthographicCamera(
      -viewWidth / 2,
      viewWidth / 2,
      viewHeight / 2,
      -viewHeight / 2,
      0.1,
      1000
    );
    this.camera.position.set(0, 100, 0);
    this.camera.up.set(0, 0, -1);
    this.camera.lookAt(0, 0, 0);

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
    const geometry = new THREE.PlaneGeometry(2000, 2000);
    const material = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    this.scene.add(floor);
  }

  private onResize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    const viewHeight = 800 / ZOOM;
    const viewWidth = viewHeight * aspect;

    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setFollowTarget(x: number, z: number): void {
    this.followTarget = { x, z };
  }

  update(): void {
    if (this.followTarget) {
      const cam = this.camera.position;
      cam.x += (this.followTarget.x - cam.x) * CAMERA_LERP_SPEED;
      cam.z += (this.followTarget.z - cam.z) * CAMERA_LERP_SPEED;
    }
  }

  render(): void {
    this.update();
    this.renderer.render(this.scene, this.camera);
  }
}

import * as THREE from 'three';

interface WakePuff {
  mesh: THREE.Mesh;
  age: number;
  maxAge: number;
  startScale: number;
}

const MAX_PUFFS = 120;
const SPAWN_INTERVAL = 0.06;
const PUFF_LIFE = 1.8;
const BASE_SCALE = 3;
const END_SCALE = 14;
const SPREAD = 5;
const MIN_SPEED = 30;

export class WakeRenderer {
  private scene: THREE.Scene;
  private puffs: WakePuff[] = [];
  private texture: THREE.CanvasTexture;
  private geo: THREE.PlaneGeometry;
  private timers: Map<string, number> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.texture = this.createFoamTexture();
    this.geo = new THREE.PlaneGeometry(1, 1);
  }

  spawnWake(id: string, x: number, z: number, rotation: number, speed: number): void {
    if (speed < MIN_SPEED) return;
    const t = (this.timers.get(id) ?? 0);
    if (t > 0) return;

    const interval = SPAWN_INTERVAL * (MIN_SPEED / Math.max(speed, MIN_SPEED));
    this.timers.set(id, interval);

    const fwdX = -Math.sin(rotation);
    const fwdZ = -Math.cos(rotation);
    const rearX = x - fwdX * 14;
    const rearZ = z - fwdZ * 14;

    for (const side of [-1, 1]) {
      if (this.puffs.length >= MAX_PUFFS) break;
      const perpX = -fwdZ * side * SPREAD;
      const perpZ = fwdX * side * SPREAD;
      const jx = (Math.random() - 0.5) * 3;
      const jz = (Math.random() - 0.5) * 3;

      const mat = new THREE.MeshBasicMaterial({
        map: this.texture, transparent: true, opacity: 0.7,
        side: THREE.DoubleSide, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.position.set(rearX + perpX + jx, 0.4, rearZ + perpZ + jz);
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.setScalar(BASE_SCALE);
      this.scene.add(mesh);

      this.puffs.push({
        mesh,
        age: 0,
        maxAge: PUFF_LIFE + Math.random() * 0.4,
        startScale: BASE_SCALE * (0.8 + Math.random() * 0.4),
      });
    }
  }

  update(dt: number): void {
    for (const [id, t] of this.timers) {
      this.timers.set(id, Math.max(0, t - dt));
    }

    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.age += dt;
      if (p.age >= p.maxAge) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.puffs.splice(i, 1);
        continue;
      }
      const t = p.age / p.maxAge;
      const scale = p.startScale + (END_SCALE - p.startScale) * t;
      p.mesh.scale.setScalar(scale);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 * (1 - t * t);
    }
  }

  private createFoamTexture(): THREE.CanvasTexture {
    const s = 64;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, s, s);
    const cx = s / 2;

    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    grad.addColorStop(0, 'rgba(200,230,255,0.9)');
    grad.addColorStop(0.3, 'rgba(160,210,240,0.6)');
    grad.addColorStop(0.6, 'rgba(120,180,220,0.3)');
    grad.addColorStop(1, 'rgba(80,150,200,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * cx * 0.6;
      const r = 1.5 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * dist, cx + Math.sin(angle) * dist, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  clear(): void {
    for (const p of this.puffs) {
      this.scene.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    }
    this.puffs.length = 0;
    this.timers.clear();
  }
}

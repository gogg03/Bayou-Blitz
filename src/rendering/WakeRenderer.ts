import * as THREE from 'three';

const MAX_PUFFS = 80;
const SPAWN_INTERVAL = 0.08;
const PUFF_LIFE = 1.8;
const BASE_SCALE = 3;
const END_SCALE = 14;
const SPREAD = 5;
const MIN_SPEED = 30;

interface PooledPuff {
  mesh: THREE.Mesh;
  active: boolean;
  age: number;
  maxAge: number;
  startScale: number;
}

export class WakeRenderer {
  private scene: THREE.Scene;
  private pool: PooledPuff[] = [];
  private timers: Map<string, number> = new Map();
  private sharedMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const geo = new THREE.PlaneGeometry(1, 1);
    this.sharedMat = new THREE.MeshBasicMaterial({
      map: this.createFoamTexture(), transparent: true, opacity: 0,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < MAX_PUFFS; i++) {
      const mesh = new THREE.Mesh(geo, this.sharedMat.clone());
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      scene.add(mesh);
      this.pool.push({ mesh, active: false, age: 0, maxAge: PUFF_LIFE, startScale: BASE_SCALE });
    }
  }

  private acquire(): PooledPuff | null {
    for (const p of this.pool) {
      if (!p.active) return p;
    }
    return null;
  }

  spawnWake(id: string, x: number, z: number, rotation: number, speed: number): void {
    if (speed < MIN_SPEED) return;
    const t = this.timers.get(id) ?? 0;
    if (t > 0) return;

    const interval = SPAWN_INTERVAL * (MIN_SPEED / Math.max(speed, MIN_SPEED));
    this.timers.set(id, interval);

    const fwdX = -Math.sin(rotation);
    const fwdZ = -Math.cos(rotation);
    const rearX = x - fwdX * 14;
    const rearZ = z - fwdZ * 14;

    for (const side of [-1, 1]) {
      const puff = this.acquire();
      if (!puff) break;
      const perpX = -fwdZ * side * SPREAD;
      const perpZ = fwdX * side * SPREAD;
      const jx = (Math.random() - 0.5) * 3;
      const jz = (Math.random() - 0.5) * 3;

      puff.active = true;
      puff.age = 0;
      puff.maxAge = PUFF_LIFE + Math.random() * 0.4;
      puff.startScale = BASE_SCALE * (0.8 + Math.random() * 0.4);
      puff.mesh.position.set(rearX + perpX + jx, 0.4, rearZ + perpZ + jz);
      puff.mesh.scale.setScalar(puff.startScale);
      puff.mesh.visible = true;
      (puff.mesh.material as THREE.MeshBasicMaterial).opacity = 0.7;
    }
  }

  update(dt: number): void {
    for (const [id, t] of this.timers) {
      this.timers.set(id, Math.max(0, t - dt));
    }

    for (const p of this.pool) {
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.maxAge) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      const t = p.age / p.maxAge;
      p.mesh.scale.setScalar(p.startScale + (END_SCALE - p.startScale) * t);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - t * t);
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
    for (const p of this.pool) {
      p.active = false;
      p.mesh.visible = false;
    }
    this.timers.clear();
  }
}

import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

const POOL_SIZE = 50;

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private geometry: THREE.SphereGeometry;
  private material: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.geometry = new THREE.SphereGeometry(1.5, 4, 4);
    this.material = new THREE.MeshBasicMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.6,
    });
  }

  spawnSplash(x: number, z: number, count = 12): void {
    for (let i = 0; i < count && this.particles.length < POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.material.clone());
      mesh.position.set(x, 2, z);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          30 + Math.random() * 40,
          Math.sin(angle) * speed,
        ),
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 120 * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      const alpha = 1 - p.life / p.maxLife;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.6;
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles.length = 0;
  }
}

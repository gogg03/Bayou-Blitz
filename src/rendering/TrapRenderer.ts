import * as THREE from 'three';
import type { TrapState } from '../../shared/types';

const TRAP_SIZE = 6;
const GLOW_SIZE = 12;
const BOB_SPEED = 3;
const BOB_HEIGHT = 1.5;

export class TrapRenderer {
  private scene: THREE.Scene;
  private trapMeshes: Map<string, THREE.Group> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  updateTraps(traps: TrapState[], time: number): void {
    const activeIds = new Set<string>();

    for (const trap of traps) {
      if (!trap.isActive) {
        this.removeTrap(trap.id);
        continue;
      }

      activeIds.add(trap.id);

      if (!this.trapMeshes.has(trap.id)) {
        this.createTrap(trap.id, trap.position.x, trap.position.y);
      }

      const group = this.trapMeshes.get(trap.id)!;
      group.position.set(trap.position.x, 0, trap.position.y);

      const bob = Math.sin(time * BOB_SPEED + trap.position.x * 0.1) * BOB_HEIGHT;
      group.position.y = 2 + bob;
    }

    for (const id of this.trapMeshes.keys()) {
      if (!activeIds.has(id)) {
        this.removeTrap(id);
      }
    }
  }

  private createTrap(id: string, x: number, z: number): void {
    const group = new THREE.Group();

    const cageGeo = new THREE.CylinderGeometry(TRAP_SIZE / 2, TRAP_SIZE / 2, TRAP_SIZE, 6);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.5,
      wireframe: true,
    });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    group.add(cage);

    const glowGeo = new THREE.SphereGeometry(GLOW_SIZE / 2, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff9900,
      transparent: true,
      opacity: 0.25,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    group.position.set(x, 2, z);
    this.scene.add(group);
    this.trapMeshes.set(id, group);
  }

  private removeTrap(id: string): void {
    const group = this.trapMeshes.get(id);
    if (group) {
      this.scene.remove(group);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.trapMeshes.delete(id);
    }
  }

  clear(): void {
    for (const id of [...this.trapMeshes.keys()]) {
      this.removeTrap(id);
    }
  }
}

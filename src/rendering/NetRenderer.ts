import * as THREE from 'three';
import type { NetProjectile } from '../../shared/types';

const NET_SIZE = 8;
const GLOW_SIZE = 14;

export class NetRenderer {
  private scene: THREE.Scene;
  private meshes: Map<string, THREE.Group> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  updateNets(nets: NetProjectile[]): void {
    const activeIds = new Set<string>();

    for (const net of nets) {
      activeIds.add(net.id);

      if (!this.meshes.has(net.id)) {
        this.createNet(net.id);
      }

      const group = this.meshes.get(net.id)!;
      group.position.set(net.position.x, 4, net.position.y);

      const angle = Math.atan2(-net.velocity.x, -net.velocity.y);
      group.rotation.y = angle;
    }

    for (const id of this.meshes.keys()) {
      if (!activeIds.has(id)) {
        this.removeNet(id);
      }
    }
  }

  private createNet(id: string): void {
    const group = new THREE.Group();

    const coreGeo = new THREE.IcosahedronGeometry(NET_SIZE, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    const glowGeo = new THREE.SphereGeometry(GLOW_SIZE, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.3,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    this.scene.add(group);
    this.meshes.set(id, group);
  }

  private removeNet(id: string): void {
    const group = this.meshes.get(id);
    if (group) {
      this.scene.remove(group);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.meshes.delete(id);
    }
  }

  clear(): void {
    for (const id of [...this.meshes.keys()]) {
      this.removeNet(id);
    }
  }
}

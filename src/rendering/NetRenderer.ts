import * as THREE from 'three';
import type { NetProjectile } from '../../shared/types';

const NET_SIZE = 4;

export class NetRenderer {
  private scene: THREE.Scene;
  private meshes: Map<string, THREE.Mesh> = new Map();

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

      const mesh = this.meshes.get(net.id)!;
      mesh.position.set(net.position.x, 3, net.position.y);

      const angle = Math.atan2(-net.velocity.x, -net.velocity.y);
      mesh.rotation.y = angle;
    }

    for (const id of this.meshes.keys()) {
      if (!activeIds.has(id)) {
        this.removeNet(id);
      }
    }
  }

  private createNet(id: string): void {
    const geo = new THREE.SphereGeometry(NET_SIZE, 6, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    this.meshes.set(id, mesh);
  }

  private removeNet(id: string): void {
    const mesh = this.meshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.meshes.delete(id);
    }
  }

  clear(): void {
    for (const id of [...this.meshes.keys()]) {
      this.removeNet(id);
    }
  }
}

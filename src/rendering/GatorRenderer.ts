import * as THREE from 'three';
import type { GatorState } from '../../shared/types';

const BODY_LENGTH = 14;
const BODY_WIDTH = 5;
const HEAD_LENGTH = 6;

export class GatorRenderer {
  private scene: THREE.Scene;
  private gatorMeshes: Map<string, THREE.Group> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  updateGators(gators: GatorState[]): void {
    const activeIds = new Set<string>();

    for (const gator of gators) {
      activeIds.add(gator.id);

      if (!this.gatorMeshes.has(gator.id)) {
        this.createGator(gator.id);
      }

      const group = this.gatorMeshes.get(gator.id)!;
      group.position.set(gator.position.x, 1.5, gator.position.y);

      const target = gator.patrolPath[gator.patrolPathIndex];
      if (target) {
        const dx = target.x - gator.position.x;
        const dy = target.y - gator.position.y;
        const angle = Math.atan2(-dx, -dy);
        group.rotation.y = angle;
      }
    }

    for (const id of this.gatorMeshes.keys()) {
      if (!activeIds.has(id)) {
        this.removeGator(id);
      }
    }
  }

  private createGator(id: string): void {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b5e2b });

    const bodyGeo = new THREE.BoxGeometry(BODY_WIDTH, 3, BODY_LENGTH);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    group.add(body);

    const headMat = new THREE.MeshStandardMaterial({ color: 0x4a7a35 });
    const headGeo = new THREE.BoxGeometry(BODY_WIDTH * 0.7, 2.5, HEAD_LENGTH);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.z = -(BODY_LENGTH / 2 + HEAD_LENGTH / 2 - 1);
    head.position.y = 0.2;
    group.add(head);

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff3300, emissiveIntensity: 1.0 });
    const eyeGeo = new THREE.SphereGeometry(0.8, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-BODY_WIDTH * 0.3, 1.8, -(BODY_LENGTH / 2 + 2));
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(BODY_WIDTH * 0.3, 1.8, -(BODY_LENGTH / 2 + 2));
    group.add(rightEye);

    const tailMat = new THREE.MeshStandardMaterial({ color: 0x3b5e2b });
    const tailGeo = new THREE.ConeGeometry(BODY_WIDTH * 0.4, 8, 4);
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.z = BODY_LENGTH / 2 + 3;
    tail.position.y = 0;
    group.add(tail);

    this.scene.add(group);
    this.gatorMeshes.set(id, group);
  }

  private removeGator(id: string): void {
    const group = this.gatorMeshes.get(id);
    if (group) {
      this.scene.remove(group);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.gatorMeshes.delete(id);
    }
  }

  clear(): void {
    for (const id of [...this.gatorMeshes.keys()]) {
      this.removeGator(id);
    }
  }
}

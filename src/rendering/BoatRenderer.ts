import * as THREE from 'three';

const BOAT_LENGTH = 24;
const BOAT_WIDTH = 12;
const BOAT_HEIGHT = 4;
const BOW_LENGTH = 10;

export class BoatRenderer {
  private scene: THREE.Scene;
  private boatMeshes: Map<string, THREE.Group> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createBoat(id: string, color: number = 0xcc4422): THREE.Group {
    const group = new THREE.Group();

    const hullGeo = new THREE.BoxGeometry(BOAT_WIDTH, BOAT_HEIGHT, BOAT_LENGTH);
    const hullMat = new THREE.MeshStandardMaterial({ color });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = BOAT_HEIGHT / 2 + 0.5;
    group.add(hull);

    const bowGeo = new THREE.ConeGeometry(BOAT_WIDTH / 2, BOW_LENGTH, 4);
    const bowMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.rotation.x = Math.PI / 2;
    bow.position.set(0, BOAT_HEIGHT / 2 + 0.5, -(BOAT_LENGTH / 2 + BOW_LENGTH / 2));
    group.add(bow);

    const fanGeo = new THREE.CylinderGeometry(5, 5, 1, 8);
    const fanMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const fan = new THREE.Mesh(fanGeo, fanMat);
    fan.position.set(0, BOAT_HEIGHT + 2, BOAT_LENGTH / 2 - 2);
    group.add(fan);

    this.scene.add(group);
    this.boatMeshes.set(id, group);
    return group;
  }

  updateBoat(id: string, x: number, z: number, rotation: number): void {
    const group = this.boatMeshes.get(id);
    if (!group) return;
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
  }

  removeBoat(id: string): void {
    const group = this.boatMeshes.get(id);
    if (group) {
      this.scene.remove(group);
      this.boatMeshes.delete(id);
    }
  }

  getBoatMesh(id: string): THREE.Group | undefined {
    return this.boatMeshes.get(id);
  }
}
